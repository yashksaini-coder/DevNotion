import type { WeeklyData } from '../types/github.types.js';
import type { NarratorOutput } from '../types/blog.types.js';
import { renderAuthorFooter } from './footer.js';

function publicImageUrl(relPath: string | undefined): string | undefined {
  if (!relPath) return undefined;
  return process.env.IMAGE_PUBLIC_BASE_URL
    ? `${process.env.IMAGE_PUBLIC_BASE_URL.replace(/\/$/, '')}/${relPath.replace(/^\.?\//, '').replace(/\\/g, '/')}`
    : undefined;
}

export interface PublishLinks {
  notionPageUrl?: string;
  devtoUrl?: string;
  hashnodeUrl?: string;
}

export interface PublishResult extends PublishLinks {
  weekStart: string;
  weekEnd: string;
  headline: string;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  totalAdditions: number;
  totalDeletions: number;
  repoCount: number;
  topLanguages: string[];
}

/**
 * Build planner-style markdown for Notion with structured tables.
 */
export function buildPlannerMarkdown(
  data: WeeklyData,
  blog: NarratorOutput['blog'],
  links: PublishLinks,
  publishMode: 'auto' | 'draft' = 'auto',
  imageUrls: { coverUrl?: string; statsCardUrl?: string } = {},
): string {
  const lines: string[] = [];

  lines.push(`> ${blog.tldr}`);
  lines.push('');
  if (imageUrls.coverUrl) { lines.push(`![cover](${imageUrls.coverUrl})`); lines.push(''); }
  if (imageUrls.statsCardUrl) { lines.push(`![week stats](${imageUrls.statsCardUrl})`); lines.push(''); }

  // Published links
  lines.push('## Published Links');
  lines.push('| Platform | Link | Status |');
  lines.push('|----------|------|--------|');
  if (links.notionPageUrl) {
    lines.push(`| Notion | [View Page](${links.notionPageUrl}) | Published |`);
  }
  if (links.devtoUrl) {
    const status = publishMode === 'draft' ? 'Draft' : 'Published';
    lines.push(`| DEV.to | [${publishMode === 'draft' ? 'Edit Draft' : 'View Article'}](${links.devtoUrl}) | ${status} |`);
  } else {
    lines.push('| DEV.to | — | Not configured |');
  }
  if (links.hashnodeUrl) {
    const status = publishMode === 'draft' ? 'Draft' : 'Published';
    lines.push(`| Hashnode | [${publishMode === 'draft' ? 'View Draft' : 'View Article'}](${links.hashnodeUrl}) | ${status} |`);
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
  lines.push(renderAuthorFooter());
  lines.push('');
  lines.push(`${blog.readingTimeMinutes} min read · Generated by [DevNotion](https://github.com/yashksaini-coder/DevNotion)`);

  return lines.join('\n');
}

/**
 * Build simple blog markdown for DEV.to (no planner tables).
 */
export function buildDevtoMarkdown(blog: NarratorOutput['blog']): string {
  let md = `> ${blog.tldr}\n\n`;
  md += blog.content;
  md += `\n\n${renderAuthorFooter()}\n`;
  md += `\n${blog.tags.map((t) => `#${t}`).join(' ')} · ${blog.readingTimeMinutes} min read · Generated by [DevNotion](https://github.com/yashksaini-coder/DevNotion)`;
  return md;
}

export async function publishBlog(opts: {
  blog: NarratorOutput['blog'];
  weeklyData: WeeklyData;
  publishMode: 'auto' | 'draft';
  images?: { coverPath?: string; statsCardPath?: string };
}): Promise<PublishResult> {
  const { env } = await import('../config/env.js');
  const { blog, weeklyData, publishMode } = opts;
  const coverUrl = publicImageUrl(opts.images?.coverPath);
  const statsCardUrl = publicImageUrl(opts.images?.statsCardPath);
  const targets = env.PUBLISH_TARGETS;
  const asDraft = publishMode === 'draft';

  const links: PublishLinks = {};

  let notionPageId: string | undefined;
  if (targets.includes('notion')) {
    const { createNotionPage } = await import('../tools/notion-rest.tool.js');
    const title = `Week of ${weeklyData.weekStart} · ${weeklyData.repos.length} repos · ${weeklyData.totalPRs} PRs`;
    const createResult = await createNotionPage(title);
    notionPageId = createResult.pageId;
    links.notionPageUrl = createResult.pageUrl;
    console.log('Publish: Created Notion page:', links.notionPageUrl);
  }

  if (targets.includes('devto') && env.DEVTO_API_KEY) {
    const { createDevtoArticle } = await import('../tools/devto.tool.js');
    const devtoResult = await createDevtoArticle({
      title: blog.headline,
      body_markdown: buildDevtoMarkdown(blog),
      tags: blog.tags,
      published: !asDraft,
      canonical_url: links.notionPageUrl,
      main_image: coverUrl,
    });
    links.devtoUrl = devtoResult.articleUrl;
    console.log(`Publish: ${asDraft ? 'Created DEV.to draft' : 'Published DEV.to article'}:`, links.devtoUrl);
  }

  if (targets.includes('hashnode') && env.HASHNODE_TOKEN && env.HASHNODE_PUBLICATION_ID) {
    const { publishToHashnode } = await import('../tools/hashnode.tool.js');
    const hashnodeResult = await publishToHashnode({
      title: blog.headline,
      contentMarkdown: buildDevtoMarkdown(blog),
      tags: blog.tags,
      subtitle: blog.tldr,
      draft: asDraft,
      coverImageUrl: coverUrl,
    });
    links.hashnodeUrl = hashnodeResult.postUrl;
    console.log(`Publish: ${asDraft ? 'Created Hashnode draft' : 'Published Hashnode post'}:`, links.hashnodeUrl);
  }

  if (notionPageId) {
    const { writeNotionMarkdown, updateNotionPage } = await import('../tools/notion-rest.tool.js');
    const plannerMd = buildPlannerMarkdown(weeklyData, blog, links, publishMode, { coverUrl, statsCardUrl });
    await writeNotionMarkdown(notionPageId, plannerMd);
    console.log('Publish: Planner markdown written to Notion');
    await updateNotionPage(notionPageId, asDraft ? '📝' : '📊');
  }

  const topLanguages = Object.entries(weeklyData.languages)
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
    topLanguages,
  };
}
