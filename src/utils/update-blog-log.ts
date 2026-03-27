import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface BlogLogEntry {
  weekStart: string;
  weekEnd: string;
  headline: string;
  repoCount: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  totalAdditions: number;
  totalDeletions: number;
  topLanguages: string[];
  notionPageUrl?: string;
  devtoUrl?: string;
}

const README_PATH = resolve(process.cwd(), 'README.md');

function formatRow(e: BlogLogEntry): string {
  const lines = `+${e.totalAdditions.toLocaleString()}/-${e.totalDeletions.toLocaleString()}`;
  const langs = e.topLanguages.join(', ') || '—';
  const notion = e.notionPageUrl ? `[View](${e.notionPageUrl})` : '—';
  const devto = e.devtoUrl ? `[Draft](${e.devtoUrl})` : '—';
  const headline = e.headline.length > 50 ? e.headline.slice(0, 47) + '...' : e.headline;

  return `| ${e.weekStart} | ${headline} | ${e.repoCount} | ${e.totalCommits} | ${e.totalPRs} | ${e.totalIssues} | ${e.totalReviews} | ${lines} | ${langs} | ${notion} | ${devto} |`;
}

/**
 * Update the Blog Log table inside README.md.
 * Finds the table by its header row, inserts/updates the week's row.
 */
export function updateBlogLog(entry: BlogLogEntry): void {
  let content: string;
  try {
    content = readFileSync(README_PATH, 'utf-8');
  } catch {
    console.warn('Blog log: README.md not found, skipping');
    return;
  }

  let lines = content.split('\n');

  // Find the blog log table header row
  const headerIdx = lines.findIndex((l) => l.startsWith('| Week') && l.includes('Headline'));
  if (headerIdx === -1) {
    console.warn('Blog log: No blog log table found in README.md, skipping');
    return;
  }

  // Check if this week already exists (idempotent)
  const existingIdx = lines.findIndex((l) => l.startsWith(`| ${entry.weekStart} `));
  const newRow = formatRow(entry);

  if (existingIdx !== -1) {
    lines[existingIdx] = newRow;
  } else {
    // Insert after separator row (headerIdx + 1 is the |---| row)
    lines.splice(headerIdx + 2, 0, newRow);
  }

  writeFileSync(README_PATH, lines.join('\n'), 'utf-8');
  console.log(`Blog log updated: ${README_PATH}`);
}
