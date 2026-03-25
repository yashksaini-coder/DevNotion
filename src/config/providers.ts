import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from './env.js';

/**
 * Round-robin key rotation across Google API keys.
 * Each call to nextKey() returns the next key in the pool,
 * distributing RPD quota across all configured keys.
 */
let keyIndex = 0;

function nextKey(): string {
  const key = env.GOOGLE_API_KEYS[keyIndex % env.GOOGLE_API_KEYS.length]!;
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
