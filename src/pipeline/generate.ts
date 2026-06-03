import { fetchWeeklyContributions } from '../tools/github.tool.js';
import { createProvider } from '../llm/provider.js';
import { narrateBlog } from '../llm/narrate.js';
import { env } from '../config/env.js';
import { generateImages, type GeneratedImages } from '../images/generate-images.js';
import type { WeeklyData } from '../types/github.types.js';
import type { NarratorOutput } from '../types/blog.types.js';
import type { BlogTone } from '../llm/system-prompt.js';

export interface GenerateResult {
  blog: NarratorOutput['blog'];
  weeklyData: WeeklyData;
  images: GeneratedImages;
}

/**
 * Generate a blog draft from a week of GitHub activity. Harvest + narrate only —
 * NO publishing. Fail-loud: a narration failure throws (caller handles it).
 */
export async function generateContent(opts: {
  weekStart: string;
  tone?: BlogTone;
  focusAreas?: string;
}): Promise<GenerateResult> {
  const weeklyData = await fetchWeeklyContributions(opts.weekStart);
  const provider = createProvider(env);
  const blog = await narrateBlog(provider, weeklyData, {
    tone: opts.tone ?? env.BLOG_TONE,
    focusAreas: opts.focusAreas ?? env.FOCUS_AREAS,
    maxTokens: env.NARRATION_MAX_TOKENS,
  });
  const images = env.GENERATE_IMAGES ? await generateImages(opts.weekStart, weeklyData, blog) : {};
  return { blog, weeklyData, images };
}
