import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '../config/env.js';
import type { NarratorOutput } from '../types/blog.types.js';
import { COVER_SCENE } from '../agents/image.agent.js';

const COVER_MODEL = 'gemini-2.5-flash-image';

export interface CoverContext {
  topRepo?: string;
  languages?: string[];
  highlight?: string;
}

/** Deterministically fill the cover scene's {context} from the week's work. */
export function buildCoverPrompt(context: CoverContext): string {
  const langs = context.languages?.slice(0, 3).filter(Boolean).join(' and ');
  const parts = [
    context.topRepo ? `code for "${context.topRepo}"` : 'a code editor and terminal',
    langs ? `in ${langs}` : null,
    context.highlight || null,
  ]
    .filter(Boolean)
    .join(', ');
  return COVER_SCENE.replace('{context}', parts || 'a code editor and terminal');
}

/**
 * Generate the weekly cover via Nano Banana. Best-effort: returns null on any
 * failure (image generation is never fatal). The prompt is composed
 * deterministically from the week's work by buildCoverPrompt.
 */
export async function generateCoverImage(
  blog: NarratorOutput['blog'],
  context: CoverContext = {},
): Promise<Uint8Array | null> {
  void blog; // scene is data-driven, not headline-driven
  const keys = env.GOOGLE_API_KEYS;
  if (!keys || keys.length === 0) return null;
  try {
    const google = createGoogleGenerativeAI({ apiKey: keys[0]! });
    const prompt = buildCoverPrompt(context);
    const result = await generateText({
      model: google(COVER_MODEL),
      prompt,
      providerOptions: { google: { responseModalities: ['IMAGE'] } },
    });
    const img = result.files.find((f) => f.mediaType?.startsWith('image/'));
    return img ? img.uint8Array : null;
  } catch (err) {
    console.warn('Cover image generation failed (non-fatal):', err instanceof Error ? err.message : err);
    return null;
  }
}
