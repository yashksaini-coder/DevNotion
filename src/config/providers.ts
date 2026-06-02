import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from './env.js';

/**
 * Round-robin key rotation across Google API keys.
 * Each call to nextKey() returns the next key in the pool,
 * distributing RPD quota across all configured keys.
 *
 * Only used when LLM_PROVIDER=gemini (or as fallback for Mastra agent model field).
 */
let keyIndex = 0;

function nextKey(): string {
  const keys = env.GOOGLE_API_KEYS ?? [];
  if (keys.length === 0) throw new Error('GOOGLE_API_KEYS is empty — cannot create Google model');
  const key = keys[keyIndex % keys.length]!;
  keyIndex++;
  return key;
}

/**
 * Create a Google Generative AI model with the next rotated API key.
 * Use this instead of the `google/model-id` string format to enable key rotation.
 */
export function createGoogleModel(modelId: string): ReturnType<ReturnType<typeof createGoogleGenerativeAI>> {
  const google = createGoogleGenerativeAI({ apiKey: nextKey() });
  return google(modelId);
}

