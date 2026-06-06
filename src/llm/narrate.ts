import type { LLMProvider } from './provider.js';
import type { WeeklyData } from '../types/github.types.js';
import type { NarratorOutput } from '../types/blog.types.js';
import { parseFrontmatter } from '../utils/parse-frontmatter.js';
import { buildNarratorSystemPrompt, type BlogTone } from './system-prompt.js';

export interface NarrateOptions {
  tone?: BlogTone;
  focusAreas?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Narrate weekly GitHub data into a blog post.
 * FAIL-LOUD: throws on provider error or unparseable output. It NEVER returns a
 * deterministic fallback — the caller decides what to do with a failure.
 */
export async function narrateBlog(
  provider: LLMProvider,
  data: WeeklyData,
  opts: NarrateOptions = {},
): Promise<NarratorOutput['blog']> {
  const system = buildNarratorSystemPrompt(opts.tone ?? 'casual', opts.focusAreas);
  const prompt = `Generate a blog post from this GitHub contribution data:\n\n${JSON.stringify(
    data,
    null,
    2,
  )}`;

  const text = await provider.generate(prompt, {
    system,
    maxTokens: opts.maxTokens ?? 8192,
    temperature: opts.temperature ?? 0.7,
  });

  const parsed = parseFrontmatter(text);
  if (!parsed.success) {
    throw new Error(`Narration failed: could not parse model output (${parsed.error})`);
  }
  return parsed.data.blog;
}
