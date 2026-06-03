export type LLMProviderName = 'gemini' | 'openai' | 'anthropic';

// Default models per provider — overridable via LLM_MODEL.
// gemini-3-flash-preview has a free tier (~1,500 req/day) and replaced the
// retired gemini-2.0-flash (free quota was zeroed out).
export const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  gemini: 'gemini-3-flash-preview',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
};

export function resolveModelId(opts: {
  LLM_PROVIDER: LLMProviderName;
  LLM_MODEL?: string;
}): string {
  return opts.LLM_MODEL ?? DEFAULT_MODELS[opts.LLM_PROVIDER];
}
