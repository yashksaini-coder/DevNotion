import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { WeeklyDataSchema, type WeeklyData } from '../types/github.types.js';
import { NarratorOutputSchema, type NarratorOutput } from '../types/blog.types.js';
import { fetchWeeklyContributions } from '../tools/github.tool.js';
import { parseFrontmatter } from '../utils/parse-frontmatter.js';

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
function buildFallbackNarration(data: WeeklyData): NarratorOutput {
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
  execute: async ({ inputData, mastra }) => {
    const agent = mastra!.getAgent('narrator-agent');
    const dataJson = JSON.stringify(inputData, null, 2);
    const prompt = `Generate a blog post from this GitHub contribution data:\n\n${dataJson}`;

    let blog: NarratorOutput['blog'];

    // Attempt: plain text generation → parse frontmatter + markdown
    try {
      const result = await agent.generate(prompt);
      const parsed = parseFrontmatter(result.text);
      if (parsed.success) {
        console.log('Narrate step: Markdown blog generated successfully');
        blog = parsed.data.blog;
      } else {
        console.warn('Narrate step: Failed to parse frontmatter:', parsed.error);
        blog = buildFallbackNarration(inputData).blog;
      }
    } catch (err) {
      console.warn('Narrate step: LLM call failed:', err instanceof Error ? err.message : err);
      blog = buildFallbackNarration(inputData).blog;
    }

    // Pass through raw data for planner tables in publish step
    return { blog, weeklyData: inputData };
  },
});

/**
 * Build planner-style markdown for Notion with structured tables.
 */
function buildPlannerMarkdown(
  data: WeeklyData,
  blog: NarratorOutput['blog'],
  links: { notionPageUrl?: string; devtoUrl?: string },
): string {
  const lines: string[] = [];

  lines.push(`> ${blog.tldr}`);
  lines.push('');

  // Published links
  lines.push('## Published Links');
  lines.push('| Platform | Link | Status |');
  lines.push('|----------|------|--------|');
  if (links.notionPageUrl) {
    lines.push(`| Notion | [View Page](${links.notionPageUrl}) | Published |`);
  }
  if (links.devtoUrl) {
    lines.push(`| DEV.to | [Edit Draft](${links.devtoUrl}) | Draft |`);
  } else {
    lines.push('| DEV.to | — | Not configured |');
  }
  lines.push('');

  // Week at a glance
  lines.push('## Week at a Glance');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Commits | ${data.totalCommits} |`);
  lines.push(`| Pull Requests | ${data.totalPRs} |`);
  lines.push(`| Issues | ${data.totalIssues} |`);
  lines.push(`| Code Reviews | ${data.totalReviews} |`);
  lines.push(`| Discussions | ${data.totalDiscussions} |`);
  lines.push(`| Lines Added | +${data.totalAdditions.toLocaleString()} |`);
  lines.push(`| Lines Removed | -${data.totalDeletions.toLocaleString()} |`);
  if (data.streakDays > 0) {
    lines.push(`| Streak | ${data.streakDays} days |`);
  }
  lines.push('');

  // Active repositories
  if (data.repos.length > 0) {
    lines.push('## Active Repositories');
    lines.push('| Repository | Commits | Language | Changes |');
    lines.push('|------------|---------|----------|---------|');
    for (const r of data.repos) {
      lines.push(`| [${r.name}](${r.url}) | ${r.commits} | ${r.language ?? '—'} | +${r.additions}/-${r.deletions} |`);
    }
    lines.push('');
  }

  // Pull requests
  if (data.pullRequests.length > 0) {
    lines.push('## Pull Requests');
    lines.push('| Title | Repo | State | Changes |');
    lines.push('|-------|------|-------|---------|');
    for (const pr of data.pullRequests) {
      lines.push(`| [${pr.title}](${pr.url}) | ${pr.repo} | ${pr.state} | +${pr.additions}/-${pr.deletions} |`);
    }
    lines.push('');
  }

  // Issues
  if (data.issues.length > 0) {
    lines.push('## Issues');
    lines.push('| Title | Repo | State |');
    lines.push('|-------|------|-------|');
    for (const i of data.issues) {
      lines.push(`| [${i.title}](${i.url}) | ${i.repo} | ${i.state} |`);
    }
    lines.push('');
  }

  // Code reviews
  if (data.reviews.length > 0) {
    lines.push('## Code Reviews');
    lines.push('| PR | Repo | State |');
    lines.push('|----|------|-------|');
    for (const r of data.reviews) {
      lines.push(`| [${r.prTitle}](${r.prUrl}) | ${r.repo} | ${r.state} |`);
    }
    lines.push('');
  }

  // Discussions
  if (data.discussions.length > 0) {
    lines.push('## Discussions');
    lines.push('| Title | Category | Answered |');
    lines.push('|-------|----------|----------|');
    for (const d of data.discussions) {
      lines.push(`| [${d.title}](${d.url}) | ${d.category} | ${d.isAnswered ? 'Yes' : '—'} |`);
    }
    lines.push('');
  }

  // Languages
  const topLangs = Object.entries(data.languages).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (topLangs.length > 0) {
    lines.push('## Languages');
    lines.push('| Language | Commits |');
    lines.push('|----------|---------|');
    for (const [lang, count] of topLangs) {
      lines.push(`| ${lang} | ${count} |`);
    }
    lines.push('');
  }

  // Blog content section
  lines.push('---');
  lines.push('');
  lines.push('## Blog Post');
  lines.push('');
  lines.push(blog.content);
  lines.push('');

  // Footer
  const now = new Date().toISOString().split('T')[0];
  lines.push('---');
  lines.push('');
  lines.push(`${blog.readingTimeMinutes} min read · Generated ${now} by [DevNotion](https://github.com/yashksaini-coder/DevNotion)`);

  return lines.join('\n');
}

/**
 * Build simple blog markdown for DEV.to (no planner tables).
 */
function buildDevtoMarkdown(blog: NarratorOutput['blog']): string {
  const now = new Date().toISOString().split('T')[0];
  let md = `> ${blog.tldr}\n\n`;
  md += blog.content;
  md += `\n\n---\n\n`;
  md += `${blog.tags.map((t) => `#${t}`).join(' ')} · ${blog.readingTimeMinutes} min read · Generated ${now} by [DevNotion](https://github.com/yashksaini-coder/DevNotion)`;
  return md;
}

const PublishOutputSchema = z.object({
  notionPageUrl: z.string().optional(),
  devtoUrl: z.string().optional(),
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
    const targets = env.PUBLISH_TARGETS;
    const { blog, weeklyData } = inputData;

    const links: { notionPageUrl?: string; devtoUrl?: string } = {};

    // 1. Create Notion page (need pageId before writing content)
    let notionPageId: string | undefined;
    if (targets.includes('notion')) {
      const { createNotionPage } = await import('../tools/notion-rest.tool.js');

      const title = `Week of ${weeklyData.weekStart} · ${weeklyData.repos.length} repos · ${weeklyData.totalPRs} PRs`;
      const createResult = await createNotionPage(title);
      notionPageId = createResult.pageId;
      links.notionPageUrl = createResult.pageUrl;
      console.log('Publish: Created Notion page:', links.notionPageUrl);
    }

    // 2. Create DEV.to draft (so we can embed the link in the Notion planner)
    if (targets.includes('devto') && env.DEVTO_API_KEY) {
      const { createDevtoArticle } = await import('../tools/devto.tool.js');

      const devtoResult = await createDevtoArticle({
        title: blog.headline,
        body_markdown: buildDevtoMarkdown(blog),
        tags: blog.tags,
        published: false,
        canonical_url: links.notionPageUrl,
      });
      links.devtoUrl = devtoResult.articleUrl;
      console.log('Publish: Created DEV.to draft:', links.devtoUrl);
    }

    // 3. Write planner-style markdown to Notion (includes DEV.to link)
    if (notionPageId) {
      const { writeNotionMarkdown, updateNotionPage } = await import('../tools/notion-rest.tool.js');

      const plannerMd = buildPlannerMarkdown(weeklyData, blog, links);
      await writeNotionMarkdown(notionPageId, plannerMd);
      console.log('Publish: Planner markdown written to Notion');

      await updateNotionPage(notionPageId, '📊');
    }

    const topLangs = Object.entries(weeklyData.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([l]) => l);

    return {
      ...links,
      weekStart: weeklyData.weekStart,
      weekEnd: weeklyData.weekEnd,
      headline: blog.headline,
      totalCommits: weeklyData.totalCommits,
      totalPRs: weeklyData.totalPRs,
      totalIssues: weeklyData.totalIssues,
      totalReviews: weeklyData.totalReviews,
      totalAdditions: weeklyData.totalAdditions,
      totalDeletions: weeklyData.totalDeletions,
      repoCount: weeklyData.repos.length,
      topLanguages: topLangs,
    };
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
