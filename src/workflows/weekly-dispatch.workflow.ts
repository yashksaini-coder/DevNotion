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
  inputSchema: NarrateOutputSchema,
  outputSchema: PublishOutputSchema,
  execute: async ({ inputData }) => {
    const { env } = await import('../config/env.js');
    const { publishBlog } = await import('../publish/publish-content.js');
    return publishBlog({
      blog: inputData.blog,
      weeklyData: inputData.weeklyData,
      publishMode: env.PUBLISH_MODE,
    });
  },
});

export const weeklyDispatchWorkflow = createWorkflow({
  id: 'weekly-dispatch',
  inputSchema: z.object({ weekStart: z.string() }),
  outputSchema: PublishOutputSchema,
})
  .then(harvestStep)
  .then(narrateStep)
  .then(publishStep)
  .commit();
