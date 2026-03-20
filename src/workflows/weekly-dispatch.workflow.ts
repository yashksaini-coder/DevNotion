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

    // Attempt 1: structured output (Gemini native JSON schema)
    try {
      const result = await agent.generate(prompt, {
        structuredOutput: { schema: NarratorOutputSchema },
      });
      if (result.object) {
        console.log('Narrate step: Structured output succeeded');
        return NarratorOutputSchema.parse(result.object);
      }
    } catch (err) {
      console.warn('Narrate step: Structured output failed, falling back to text parsing...', err instanceof Error ? err.message : err);
    }

    // Attempt 2: text generation + JSON parsing
    try {
      const result = await agent.generate(prompt);
      const parsed = parseLLMResponse(result.text, NarratorOutputSchema);
      if (parsed.success) {
        console.log('Narrate step: Text JSON parsed successfully');
        return parsed.data;
      }
      console.warn('Narrate step: LLM returned invalid JSON:', parsed.error);
    } catch (err) {
      console.warn('Narrate step: LLM text call failed:', err instanceof Error ? err.message : err);
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

    // 1. Excalidraw diagram (best-effort) — official excalidraw-mcp
    try {
      const { getExcalidrawToolsets } = await import('../tools/excalidraw-mcp.tool.js');
      const toolsets = await getExcalidrawToolsets();
      const tools = Object.values(toolsets).reduce((acc, ts) => ({ ...acc, ...ts }), {} as Record<string, any>);

      const elements = inputData.diagram?.elements ?? [];
      if (tools['create_view'] && elements.length) {
        await tools['create_view'].execute({ elements: JSON.stringify(elements) });
        console.log('Publish: Diagram view created');
      }
      if (tools['export_to_excalidraw'] && elements.length) {
        const sceneJson = JSON.stringify({
          type: 'excalidraw',
          version: 2,
          elements,
          appState: { viewBackgroundColor: '#ffffff' },
        });
        const exportResult = await tools['export_to_excalidraw'].execute({ json: sceneJson });
        diagramUrl = (exportResult as any)?.content?.[0]?.text ?? (exportResult as any)?.url ?? 'N/A';
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

    // 3. Build rich markdown
    const now = new Date().toISOString().split('T')[0];
    let fullMarkdown = `# ${blog.headline}\n\n`;
    fullMarkdown += `> ${blog.tldr}\n\n`;

    if (diagramUrl !== 'N/A') {
      fullMarkdown += `![${inputData.diagram?.title ?? 'Weekly Diagram'}](${diagramUrl})\n\n`;
    }

    fullMarkdown += blog.content;
    fullMarkdown += `\n\n---\n\n`;
    fullMarkdown += blog.tags.map((t) => `#${t}`).join(' ');
    fullMarkdown += ` · ${blog.readingTimeMinutes} min read · Generated ${now} by [GitPulse](https://github.com/yashksaini-coder/GitPulse)`;

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
