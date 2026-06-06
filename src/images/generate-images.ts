import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WeeklyData } from '../types/github.types.js';
import type { NarratorOutput } from '../types/blog.types.js';
import { buildStatsCardSvg, svgToPng } from './stats-card.js';

export interface GeneratedImages {
  statsCardPath?: string;
}

/**
 * Render the weekly stats card into assets/generated/<weekStart>/stats.png.
 * This single deterministic 1200x630 image doubles as the cover/social image
 * on every publish target. Best-effort: a failure leaves it out; never throws.
 */
export async function generateImages(
  weekStart: string,
  data: WeeklyData,
  blog: NarratorOutput['blog'],
): Promise<GeneratedImages> {
  // Defense-in-depth: weekStart is used as a path segment — only allow YYYY-MM-DD
  // so it can never contain path separators or `..` (path traversal).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    console.warn('Image generation skipped: invalid weekStart format:', weekStart);
    return {};
  }
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

  return out;
}
