import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { WeeklyDataSchema, type WeeklyData } from '../types/github.types.js';
import { NarratorOutputSchema, type NarratorOutput } from '../types/blog.types.js';
import { fetchWeeklyContributions } from '../tools/github.tool.js';
import { createProvider } from '../llm/provider.js';
import { narrateBlog } from '../llm/narrate.js';

// Combined schema: narrate → publish handoff (blog + raw data for planner tables)
const NarrateOutputSchema = z.object({
  blog: NarratorOutputSchema.shape.blog,
  weeklyData: WeeklyDataSchema,
});

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
 */
// Retained as an explicit, manually-invoked option only. NEVER used to auto-publish.
export function buildFallbackNarration(data: WeeklyData): NarratorOutput {
  const repoList = data.repos.map((r) => `- **${r.name}**: ${r.commits} commits (${r.language ?? 'unknown'})`).join('\n');
  const prList = data.pullRequests.map((pr) => `- [${pr.title}](${pr.url}) — ${pr.state}`).join('\n');
  const issueList = data.issues.map((i) => `- [${i.title}](${i.url}) — ${i.state}`).join('\n');
  const reviewList = data.reviews.map((r) => `- [${r.prTitle}](${r.prUrl}) — ${r.state}`).join('\n');
  const discList = data.discussions.map((d) => `- [${d.title}](${d.url}) — ${d.category} (${d.isAnswered ? 'answered' : 'unanswered'})`).join('\n');

  const content = `## TL;DR
${data.totalCommits} commits, ${data.totalPRs} PRs, ${data.totalIssues} issues, ${data.totalReviews} reviews across ${data.repos.length} repos, +${data.totalAdditions}/-${data.totalDeletions} lines.

## What I Built
${repoList}

## Key Pull Requests
${prList || '_No PRs this week._'}

## Issues Opened
${issueList || '_No issues this week._'}

## PR Reviews
${reviewList || '_No reviews this week._'}

## Discussions
${discList || '_No discussions this week._'}

## Tech Highlights
Top languages: ${Object.entries(data.languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l]) => l).join(', ')}.
`;

  return {
    blog: {
      headline: `Week of ${data.weekStart}: ${data.totalCommits} commits across ${data.repos.length} repos`,
      tldr: `${data.totalCommits} commits, ${data.totalPRs} PRs, ${data.totalIssues} issues, ${data.totalReviews} reviews, +${data.totalAdditions}/-${data.totalDeletions} lines.`,
      content,
      tags: Object.entries(data.languages).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l),
      readingTimeMinutes: 2,
    },
  };
}

const narrateStep = createStep({
  id: 'narrate',
  inputSchema: WeeklyDataSchema,
  outputSchema: NarrateOutputSchema,
  execute: async ({ inputData }) => {
    const { env } = await import('../config/env.js');

    // Fail-loud: if narration throws (quota, parse error), the run fails and
    // nothing is published. No silent fallback.
    const provider = createProvider(env);
    const blog = await narrateBlog(provider, inputData, {
      tone: env.BLOG_TONE,
      focusAreas: env.FOCUS_AREAS,
      maxTokens: env.NARRATION_MAX_TOKENS,
    });
    console.log(`Narrate step: Blog generated via ${provider.name}`);

    return { blog, weeklyData: inputData };
  },
});

// Enriched handoff: prefixed blog + images + the assigned dev-log number.
const PreparedSchema = z.object({
  blog: NarratorOutputSchema.shape.blog,
  weeklyData: WeeklyDataSchema,
  images: z.object({ statsCardPath: z.string().optional() }),
  devLogNumber: z.number(),
});

/**
 * Assign the sequential "Dev log #n" number from the shared run store, prefix
 * the headline, and generate the stats-card image (used as the cover) — exactly
 * what the dashboard path does, so automated runs match interactive ones.
 */
const prepareStep = createStep({
  id: 'prepare-publish',
  inputSchema: NarrateOutputSchema,
  outputSchema: PreparedSchema,
  execute: async ({ inputData }) => {
    const { env } = await import('../config/env.js');
    const { nextDevLogNumber } = await import('../server/store.js');
    const { formatDevLogTitle } = await import('../publish/title.js');
    const { generateImages } = await import('../images/generate-images.js');

    const devLogNumber = nextDevLogNumber();
    const blog = { ...inputData.blog, headline: formatDevLogTitle(devLogNumber, inputData.blog.headline) };
    console.log(`Prepare step: dev-log #${devLogNumber} — "${blog.headline}"`);

    // Best-effort (never throws); skipped when GENERATE_IMAGES=false.
    const images = env.GENERATE_IMAGES
      ? await generateImages(inputData.weeklyData.weekStart, inputData.weeklyData, blog)
      : {};

    return { blog, weeklyData: inputData.weeklyData, images, devLogNumber };
  },
});

const PublishOutputSchema = z.object({
  notionPageUrl: z.string().optional(),
  devtoUrl: z.string().optional(),
  hashnodeUrl: z.string().optional(),
  weekStart: z.string(),
  weekEnd: z.string(),
  headline: z.string(),
  totalCommits: z.number(),
  totalPRs: z.number(),
  totalIssues: z.number(),
  totalReviews: z.number(),
  totalAdditions: z.number(),
  totalDeletions: z.number(),
  repoCount: z.number(),
  topLanguages: z.array(z.string()),
});

const publishStep = createStep({
  id: 'publish',
  inputSchema: PreparedSchema,
  outputSchema: PublishOutputSchema,
  execute: async ({ inputData }) => {
    const { env } = await import('../config/env.js');
    const { publishBlog } = await import('../publish/publish-content.js');
    const { createRun, updateRun } = await import('../server/store.js');

    const result = await publishBlog({
      blog: inputData.blog,
      weeklyData: inputData.weeklyData,
      publishMode: env.PUBLISH_MODE,
      images: inputData.images,
    });

    // Persist into the shared run store AFTER a successful publish: keeps the
    // dev-log counter globally sequential across CLI + dashboard, surfaces the
    // automated run in dashboard history, and avoids burning a number on a
    // fail-loud abort (which throws before reaching here).
    const { weeklyData, blog, images, devLogNumber } = inputData;
    const record = createRun(weeklyData.weekStart, env.BLOG_TONE, env.FOCUS_AREAS ?? '');
    updateRun(record.jobId, {
      status: 'published',
      completedAt: new Date().toISOString(),
      weeklyData,
      images,
      devLogNumber,
      result: {
        headline: result.headline,
        tldr: blog.tldr,
        content: blog.content,
        tags: blog.tags,
        notionPageUrl: result.notionPageUrl,
        devtoUrl: result.devtoUrl,
        hashnodeUrl: result.hashnodeUrl,
        totalCommits: weeklyData.totalCommits,
        totalPRs: weeklyData.totalPRs,
        totalIssues: weeklyData.totalIssues,
        totalReviews: weeklyData.totalReviews,
        repoCount: weeklyData.repos.length,
      },
    });

    return result;
  },
});

export const weeklyDispatchWorkflow = createWorkflow({
  id: 'weekly-dispatch',
  inputSchema: z.object({ weekStart: z.string() }),
  outputSchema: PublishOutputSchema,
})
  .then(harvestStep)
  .then(narrateStep)
  .then(prepareStep)
  .then(publishStep)
  .commit();
