import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { Env } from '../config/env.js';
import { resolveModelId, type LLMProviderName } from './models.js';

export type { LLMProviderName };

export interface GenerateOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMProvider {
  name: LLMProviderName;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}


function createGeminiProvider(env: Env): LLMProvider {
  // Round-robin across multiple API keys for quota distribution
  let keyIndex = 0;
  const keys = env.GOOGLE_API_KEYS;

  function nextKey(): string {
    const key = keys[keyIndex % keys.length]!;
    keyIndex++;
    return key;
  }

  const modelId = resolveModelId({ LLM_PROVIDER: 'gemini', LLM_MODEL: env.LLM_MODEL });

  return {
    name: 'gemini',
    async generate(prompt, opts) {
      const google = createGoogleGenerativeAI({ apiKey: nextKey() });
      const { text } = await generateText({
        model: google(modelId),
        system: opts?.system,
        prompt,
        maxOutputTokens: opts?.maxTokens ?? 8192,
        temperature: opts?.temperature,
      });
      return text;
    },
  };
}

function createOpenAIProvider(env: Env): LLMProvider {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  const modelId = resolveModelId({ LLM_PROVIDER: 'openai', LLM_MODEL: env.LLM_MODEL });

  return {
    name: 'openai',
    async generate(prompt, opts) {
      const { text } = await generateText({
        model: openai(modelId),
        system: opts?.system,
        prompt,
        maxOutputTokens: opts?.maxTokens ?? 8192,
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
  const modelId = resolveModelId({ LLM_PROVIDER: 'anthropic', LLM_MODEL: env.LLM_MODEL });

  return {
    name: 'anthropic',
    async generate(prompt, opts) {
      const { text } = await generateText({
        model: anthropic(modelId),
        system: opts?.system,
        prompt,
        maxOutputTokens: opts?.maxTokens ?? 8192,
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
