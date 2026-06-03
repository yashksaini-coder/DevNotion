import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '../config/env.js';
import type { NarratorOutput } from '../types/blog.types.js';

const COVER_MODEL = 'gemini-2.5-flash-image';

/**
 * Generate an evocative cover image for the week via Nano Banana. Best-effort:
 * returns null on any failure (image generation is never fatal).
 */
export async function generateCoverImage(blog: NarratorOutput['blog']): Promise<Uint8Array | null> {
  const keys = env.GOOGLE_API_KEYS;
  if (!keys || keys.length === 0) return null;
  try {
    const google = createGoogleGenerativeAI({ apiKey: keys[0]! });
    const prompt = `A clean, modern, abstract tech blog cover illustration representing: "${blog.headline}". Developer/open-source theme, deep indigo and dark background, no text, no words, minimal and tasteful.`;
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
