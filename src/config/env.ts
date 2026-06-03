import { z } from 'zod';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';

// Load .env.local first (user secrets), fall back to .env
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const EnvSchema = z.object({
  // Required
  GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN is required (ghp_ or github_pat_ prefix)'),
  GITHUB_USERNAME: z.string().min(1, 'GITHUB_USERNAME is required'),
  NOTION_TOKEN: z.string().min(1, 'NOTION_TOKEN is required (Notion Internal Integration)'),
  NOTION_PARENT_PAGE_ID: z
    .string()
    .min(1, 'NOTION_PARENT_PAGE_ID is required (UUID of parent page)')
    .transform((val) => {
      // Extract 32-char hex UUID from Notion URL slugs like "Page-Name-329293ab6e62802c8c5ad153ba8c02d1"
      const match = val.match(/([a-f0-9]{32})$/i);
      return match ? match[1] : val;
    }),

  // LLM Provider — defaults to gemini for backward compatibility
  LLM_PROVIDER: z.enum(['gemini', 'openai', 'anthropic']).default('gemini'),
  LLM_MODEL: z.string().optional(), // optional model override per provider
  // Max output tokens for narration (Gemini 3 is a thinking model — reasoning
  // tokens count against this, so keep it generous).
  NARRATION_MAX_TOKENS: z.coerce.number().int().min(512).max(32768).default(8192),

  // Image generation
  GENERATE_IMAGES: z.coerce.boolean().default(true),
  IMAGE_PUBLIC_BASE_URL: z.string().optional(), // e.g. raw repo URL base; when set, images attach on publish

  // Google (Gemini) — required when LLM_PROVIDER=gemini
  GOOGLE_API_KEYS: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        : [],
    ),

  // OpenAI — required when LLM_PROVIDER=openai
  OPENAI_API_KEY: z.string().optional(),

  // Anthropic — required when LLM_PROVIDER=anthropic
  ANTHROPIC_API_KEY: z.string().optional(),

  // Narration options
  NARRATOR_MODEL: z.string().default('gemini-3-flash-preview'),
  UTILITY_MODEL: z.string().default('gemini-3-flash-preview'),
  BLOG_TONE: z.enum(['professional', 'casual', 'technical', 'storytelling']).default('casual'),
  FOCUS_AREAS: z.string().optional(), // e.g. "TypeScript performance,open source,API design"

  // Behavior
  PUBLISH_MODE: z.enum(['auto', 'draft']).default('auto'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Multi-platform publishing (optional — notion-only works without these)
  PUBLISH_TARGETS: z
    .string()
    .default('notion')
    .transform((val) =>
      val
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  DEVTO_API_KEY: z.string().trim().optional(),
  HASHNODE_TOKEN: z.string().optional(),
  HASHNODE_PUBLICATION_ID: z.string().optional(),

  // Dashboard (optional)
  DASHBOARD_PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  DASHBOARD_TOKEN: z.string().optional(), // optional bearer token auth for dashboard
});

export type Env = z.infer<typeof EnvSchema>;

function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const env = result.data;

  // Cross-field validation: ensure the selected provider has its key
  if (env.LLM_PROVIDER === 'gemini' && (!env.GOOGLE_API_KEYS || env.GOOGLE_API_KEYS.length === 0)) {
    console.error('  GOOGLE_API_KEYS: required when LLM_PROVIDER=gemini');
    process.exit(1);
  }
  if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    console.error('  OPENAI_API_KEY: required when LLM_PROVIDER=openai');
    process.exit(1);
  }
  if (env.LLM_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
    console.error('  ANTHROPIC_API_KEY: required when LLM_PROVIDER=anthropic');
    process.exit(1);
  }

  // Hashnode validation
  if (env.PUBLISH_TARGETS.includes('hashnode')) {
    if (!env.HASHNODE_TOKEN) {
      console.error('  HASHNODE_TOKEN: required when hashnode is in PUBLISH_TARGETS');
      process.exit(1);
    }
    if (!env.HASHNODE_PUBLICATION_ID) {
      console.error('  HASHNODE_PUBLICATION_ID: required when hashnode is in PUBLISH_TARGETS');
      process.exit(1);
    }
  }

  return env;
}

export const env = validateEnv();

