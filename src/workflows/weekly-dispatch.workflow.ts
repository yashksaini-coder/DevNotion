import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { WeeklyDataSchema, type WeeklyData } from '../types/github.types.js';
import { NarratorOutputSchema, type NarratorOutput } from '../types/blog.types.js';
import { fetchWeeklyContributions } from '../tools/github.tool.js';
import { parseLLMResponse } from '../utils/parse-llm-json.js';

const harvestStep = createStep({
  id: 'harvest-github',
  inputSchema: z.object({ weekStart: z.string() }),
  outputSchema: WeeklyDataSchema,
  execute: async ({ inputData }) => {
    const data = await fetchWeeklyContributions(inputData.weekStart);
    return WeeklyDataSchema.parse(data);
  },
});

/**
 * Build a deterministic fallback NarratorOutput from raw GitHub data.
 * Used when the LLM fails to produce valid JSON after retries.
 */
function buildFallbackNarration(data: WeeklyData): NarratorOutput {
  const repoList = data.repos.map((r) => `- **${r.name}**: ${r.commits} commits (${r.language ?? 'unknown'})`).join('\n');
  const prList = data.pullRequests.map((pr) => `- [${pr.title}](${pr.url}) — ${pr.state}`).join('\n');

  const content = `## TL;DR
${data.totalCommits} commits across ${data.repos.length} repos, ${data.totalPRs} PRs, +${data.totalAdditions}/-${data.totalDeletions} lines.

## What I Built
${repoList}

## Key Pull Requests
${prList}

## Tech Highlights
Top languages: ${Object.entries(data.languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l]) => l).join(', ')}.
`;

  const elements: NarratorOutput['diagram']['elements'] = data.repos.slice(0, 10).map((repo, i) => ({
    type: 'rectangle' as const,
    x: 60 + (i % 5) * 220,
    y: i < 5 ? 200 : 350,
    width: 160,
    height: 80,
    label: `${repo.name}\n${repo.commits} commits`,
    backgroundColor: '#a5d8ff',
  }));

  elements.push({
    type: 'text' as const,
    x: 200,
    y: 50,
    width: 400,
    height: 30,
    label: `Week of ${data.weekStart}`,
  });

  return {
    blog: {
      headline: `Week of ${data.weekStart}: ${data.totalCommits} commits across ${data.repos.length} repos`,
      tldr: `${data.totalCommits} commits, ${data.totalPRs} PRs, +${data.totalAdditions}/-${data.totalDeletions} lines.`,
      content,
      tags: Object.entries(data.languages).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l),
      readingTimeMinutes: 2,
    },
    diagram: {
      title: `Weekly Contributions — ${data.weekStart}`,
      elements,
    },
  };
}

const narrateStep = createStep({
  id: 'narrate',
  inputSchema: WeeklyDataSchema,
  outputSchema: NarratorOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra!.getAgent('narrator-agent');
    const prompt = `Generate a blog post and diagram from this GitHub contribution data:\n\n${JSON.stringify(inputData, null, 2)}`;

    // Attempt 1: ask LLM for JSON
    try {
      const result = await agent.generate(prompt);
      const parsed = parseLLMResponse(result.text, NarratorOutputSchema);
      if (parsed.success) {
        console.log('Narrate step: LLM JSON parsed successfully');
        return parsed.data;
      }
      console.warn('Narrate step: LLM returned invalid JSON, retrying...', parsed.error);
    } catch (err) {
      console.warn('Narrate step: LLM call failed, retrying...', err instanceof Error ? err.message : err);
    }

    // Attempt 2: retry with a stricter prompt
    try {
      const result = await agent.generate(
        `IMPORTANT: You MUST respond with ONLY a JSON object. No markdown, no explanation.\n\n${prompt}`,
      );
      const parsed = parseLLMResponse(result.text, NarratorOutputSchema);
      if (parsed.success) {
        console.log('Narrate step: Retry succeeded');
        return parsed.data;
      }
      console.warn('Narrate step: Retry also produced invalid JSON:', parsed.error);
    } catch (err) {
      console.warn('Narrate step: Retry LLM call failed:', err instanceof Error ? err.message : err);
    }

    // Attempt 3: deterministic fallback from raw data
    console.log('Narrate step: Using deterministic fallback');
    return buildFallbackNarration(inputData as WeeklyData);
  },
});

const publishStep = createStep({
  id: 'publish',
  inputSchema: NarratorOutputSchema,
  outputSchema: z.object({
    notionPageUrl: z.string(),
    diagramUrl: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { searchNotion, createNotionPage, writeNotionMarkdown, updateNotionPage } = await import('../tools/notion-rest.tool.js');
    const blog = inputData.blog;
    let notionPageUrl = '';
    let diagramUrl = 'N/A';

    // 1. Excalidraw diagram (best-effort)
    try {
      const { getExcalidrawToolsets } = await import('../tools/excalidraw-mcp.tool.js');
      const toolsets = await getExcalidrawToolsets();
      const tools = Object.values(toolsets).reduce((acc, ts) => ({ ...acc, ...ts }), {} as Record<string, any>);

      if (tools['clear_canvas']) {
        await tools['clear_canvas'].execute({ random: 'clear' });
        console.log('Publish: Excalidraw canvas cleared');
      }
      if (tools['batch_create_elements'] && inputData.diagram?.elements?.length) {
        await tools['batch_create_elements'].execute({ elements: inputData.diagram.elements });
        console.log('Publish: Diagram elements created');
      }
      if (tools['export_canvas']) {
        const exportResult = await tools['export_canvas'].execute({});
        diagramUrl = (exportResult as any)?.url ?? 'N/A';
        console.log('Publish: Diagram exported:', diagramUrl);
      }
    } catch (err) {
      console.warn('Publish: Excalidraw skipped —', err instanceof Error ? err.message : err);
    }

    // 2. Search Notion for existing page
    const weekTitle = `Week of ${blog.headline.match(/\d{4}-\d{2}-\d{2}/) ?? 'current'}`;
    const searchResult = await searchNotion(weekTitle);

    let pageId: string;
    if (searchResult.exists && searchResult.pageId) {
      pageId = searchResult.pageId;
      notionPageUrl = searchResult.pageUrl ?? '';
      console.log('Publish: Found existing Notion page:', notionPageUrl);
    } else {
      const createResult = await createNotionPage(blog.headline);
      pageId = createResult.pageId;
      notionPageUrl = createResult.pageUrl;
      console.log('Publish: Created Notion page:', notionPageUrl);
    }

    // 3. Build full markdown with diagram embed
    let fullMarkdown = blog.content;
    if (diagramUrl !== 'N/A') {
      fullMarkdown = `![${inputData.diagram?.title ?? 'Weekly Diagram'}](${diagramUrl})\n\n${fullMarkdown}`;
    }
    fullMarkdown += `\n\n---\n*Tags: ${blog.tags.join(', ')}* · *${blog.readingTimeMinutes} min read*`;

    // 4. Write markdown to page
    await writeNotionMarkdown(pageId, fullMarkdown);
    console.log('Publish: Markdown written to Notion');

    // 5. Set page icon
    await updateNotionPage(pageId, '🚀');

    return { notionPageUrl, diagramUrl };
  },
});

export const weeklyDispatchWorkflow = createWorkflow({
  id: 'weekly-dispatch',
  inputSchema: z.object({ weekStart: z.string() }),
  outputSchema: z.object({
    notionPageUrl: z.string(),
    diagramUrl: z.string(),
  }),
})
  .then(harvestStep)
  .then(narrateStep)
  .then(publishStep)
  .commit();
