import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { Env } from '../config/env.js';

export type LLMProviderName = 'gemini' | 'openai' | 'anthropic';

export interface GenerateOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMProvider {
  name: LLMProviderName;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}

// Default models per provider — overridable via env
const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
};

function createGeminiProvider(env: Env): LLMProvider {
  // Round-robin across multiple API keys for quota distribution
  let keyIndex = 0;
  const keys = env.GOOGLE_API_KEYS;

  function nextKey(): string {
    const key = keys[keyIndex % keys.length]!;
    keyIndex++;
    return key;
  }

  const modelId = env.LLM_MODEL ?? DEFAULT_MODELS.gemini;

  return {
    name: 'gemini',
    async generate(prompt, opts) {
      const google = createGoogleGenerativeAI({ apiKey: nextKey() });
      const { text } = await generateText({
        model: google(modelId),
        system: opts?.system,
        prompt,
        maxOutputTokens: opts?.maxTokens,
        temperature: opts?.temperature,
      });
      return text;
    },
  };
}

function createOpenAIProvider(env: Env): LLMProvider {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  const modelId = env.LLM_MODEL ?? DEFAULT_MODELS.openai;

  return {
    name: 'openai',
    async generate(prompt, opts) {
      const { text } = await generateText({
        model: openai(modelId),
        system: opts?.system,
        prompt,
        maxOutputTokens: opts?.maxTokens,
        temperature: opts?.temperature,
      });
      return text;
    },
  };
}

function createAnthropicProvider(env: Env): LLMProvider {
  if (!env.ANTHROPIC_API_KEY)
    throw new Error('ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic');
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const modelId = env.LLM_MODEL ?? DEFAULT_MODELS.anthropic;

  return {
    name: 'anthropic',
    async generate(prompt, opts) {
      const { text } = await generateText({
        model: anthropic(modelId),
        system: opts?.system,
        prompt,
        maxOutputTokens: opts?.maxTokens,
        temperature: opts?.temperature,
      });
      return text;
    },
  };
}

/**
 * Factory: returns the correct LLM provider based on LLM_PROVIDER env var.
 * Defaults to Gemini for backward compatibility.
 */
export function createProvider(env: Env): LLMProvider {
  switch (env.LLM_PROVIDER) {
    case 'openai':
      return createOpenAIProvider(env);
    case 'anthropic':
      return createAnthropicProvider(env);
    case 'gemini':
    default:
      return createGeminiProvider(env);
  }
}
