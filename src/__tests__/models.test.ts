import { describe, it, expect } from 'vitest';
import { DEFAULT_MODELS, resolveModelId } from '../llm/models.js';

describe('resolveModelId', () => {
  it('defaults gemini to gemini-3-flash-preview', () => {
    expect(DEFAULT_MODELS.gemini).toBe('gemini-3-flash-preview');
    expect(resolveModelId({ LLM_PROVIDER: 'gemini' })).toBe('gemini-3-flash-preview');
  });

  it('respects an explicit LLM_MODEL override', () => {
    expect(resolveModelId({ LLM_PROVIDER: 'gemini', LLM_MODEL: 'gemini-3.5-flash' })).toBe(
      'gemini-3.5-flash',
    );
  });

  it('has provider-specific defaults', () => {
    expect(resolveModelId({ LLM_PROVIDER: 'openai' })).toBe('gpt-4o-mini');
    expect(resolveModelId({ LLM_PROVIDER: 'anthropic' })).toBe('claude-3-5-haiku-20241022');
  });
});
