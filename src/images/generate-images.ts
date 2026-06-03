import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WeeklyData } from '../types/github.types.js';
import type { NarratorOutput } from '../types/blog.types.js';
import { buildStatsCardSvg, svgToPng } from './stats-card.js';
import { generateCoverImage } from './cover.js';

export interface GeneratedImages {
  coverPath?: string;
  statsCardPath?: string;
}

/**
 * Generate the weekly images into assets/generated/<weekStart>/. Best-effort:
 * a failure in either image leaves it out; never throws.
 */
export async function generateImages(
  weekStart: string,
  data: WeeklyData,
  blog: NarratorOutput['blog'],
): Promise<GeneratedImages> {
  const relDir = join('assets', 'generated', weekStart);
  const absDir = join(process.cwd(), relDir);
  const out: GeneratedImages = {};

  try {
    mkdirSync(absDir, { recursive: true });
  } catch {
    return out;
  }

  try {
    const png = svgToPng(buildStatsCardSvg(data, blog));
    const rel = join(relDir, 'stats.png');
    writeFileSync(join(process.cwd(), rel), png);
    out.statsCardPath = rel;
  } catch (err) {
    console.warn('Stats card generation failed (non-fatal):', err instanceof Error ? err.message : err);
  }

  try {
    const topRepo = [...data.repos].sort((a, b) => b.commits - a.commits)[0]?.name;
    const languages = Object.entries(data.languages).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);
    const bits: string[] = [];
    if (data.totalPRs > 0) bits.push(`${data.totalPRs} PRs`);
    if (data.totalIssues > 0) bits.push(`${data.totalIssues} issues open`);
    if (data.totalReviews > 0) bits.push(`${data.totalReviews} code reviews`);
    const highlight = bits.join(', ') || undefined;
    const bytes = await generateCoverImage(blog, { topRepo, languages, highlight });
    if (bytes) {
      const rel = join(relDir, 'cover.png');
      writeFileSync(join(process.cwd(), rel), bytes);
      out.coverPath = rel;
    }
  } catch (err) {
    console.warn('Cover generation failed (non-fatal):', err instanceof Error ? err.message : err);
  }

  return out;
}
