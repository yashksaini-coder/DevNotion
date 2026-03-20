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

/** Map language name to Excalidraw fill color. */
function langColor(lang: string | null | undefined): string {
  if (!lang) return '#d0bfff';
  const l = lang.toLowerCase();
  if (l.includes('typescript') || l.includes('javascript')) return '#a5d8ff';
  if (l.includes('python')) return '#b2f2bb';
  if (l.includes('rust') || l.includes('go') || l.includes('c++') || l.includes('c#')) return '#ffd8a8';
  return '#d0bfff';
}

/**
 * Build a deterministic fallback NarratorOutput from raw GitHub data.
 * Uses rich Excalidraw element format: ids, label objects, roundness, arrow bindings, cameraUpdate.
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

  // Build rich Excalidraw elements
  const elements: Record<string, unknown>[] = [];

  // Camera
  elements.push({ type: 'cameraUpdate', width: 800, height: 600, x: 0, y: 0 });

  // Title
  elements.push({
    type: 'text', id: 'title', x: 150, y: 20,
    text: `Week of ${data.weekStart}`, fontSize: 24, strokeColor: '#1e1e1e',
  });

  // Repo boxes with language labels
  const repos = data.repos.slice(0, 10);
  repos.forEach((repo, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 60 + col * 150;
    const y = 120 + row * 140;
    const w = Math.min(220, Math.max(140, repo.commits * 15 + 120));

    elements.push({
      type: 'rectangle', id: `repo-${i}`,
      x, y, width: w, height: 80,
      roundness: { type: 3 },
      backgroundColor: langColor(repo.language),
      fillStyle: 'solid',
      label: { text: `${repo.name}\n${repo.commits} commits`, fontSize: 16 },
    });

    if (repo.language) {
      elements.push({
        type: 'text', id: `lang-${i}`,
        x: x + 10, y: y - 22,
        text: repo.language, fontSize: 14, strokeColor: '#495057',
      });
    }
  });

  // PR arrows from their repo box
  data.pullRequests.slice(0, 8).forEach((pr, i) => {
    const repoIdx = repos.findIndex((r) => r.name === pr.repo);
    if (repoIdx < 0) return;
    const col = repoIdx % 5;
    const row = Math.floor(repoIdx / 5);
    const rx = 60 + col * 150;
    const ry = 120 + row * 140;
    const rw = Math.min(220, Math.max(140, repos[repoIdx]!.commits * 15 + 120));
    const prColor = pr.state === 'MERGED' ? '#40c057' : pr.state === 'OPEN' ? '#fab005' : '#fa5252';

    elements.push({
      type: 'arrow', id: `pr-${i}`,
      x: rx + rw, y: ry + 30 + (i % 3) * 15,
      width: 80, height: 0,
      points: [[0, 0], [80, 0]],
      endArrowhead: 'arrow',
      strokeColor: prColor, strokeWidth: 2,
      startBinding: { elementId: `repo-${repoIdx}`, fixedPoint: [1, 0.5] },
      label: { text: pr.title.slice(0, 25), fontSize: 14 },
    });
  });

  // Metrics footer
  const lastRowY = repos.length > 5 ? 120 + 140 + 80 : 120 + 80;
  elements.push({
    type: 'text', id: 'footer',
    x: 100, y: lastRowY + 40,
    text: `${data.totalCommits} commits · ${data.totalPRs} PRs · +${data.totalAdditions} / -${data.totalDeletions} lines`,
    fontSize: 16, strokeColor: '#868e96',
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
      elements: elements as NarratorOutput['diagram']['elements'],
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

    // Attempt 1: structured output with 45s timeout (Gemini preview can be slow)
    try {
      const result = await Promise.race([
        agent.generate(prompt, {
          structuredOutput: { schema: NarratorOutputSchema },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Structured output timed out after 45s')), 45_000),
        ),
      ]);
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

      // Filter out cameraUpdate pseudo-elements for the export scene (they're rendering-only)
      const allElements = inputData.diagram?.elements ?? [];
      const drawableElements = allElements.filter((el) => el.type !== 'cameraUpdate');

      if (tools['create_view'] && allElements.length) {
        await tools['create_view'].execute({ elements: JSON.stringify(allElements) });
        console.log('Publish: Diagram view created');
      }
      if (tools['export_to_excalidraw'] && drawableElements.length) {
        const sceneJson = JSON.stringify({
          type: 'excalidraw',
          version: 2,
          elements: drawableElements,
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
