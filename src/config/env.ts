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
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'GOOGLE_GENERATIVE_AI_API_KEY is required (get one at aistudio.google.com)'),
  GROQ_API_KEY: z.string().optional(),
  NOTION_TOKEN: z.string().min(1, 'NOTION_TOKEN is required (Notion Internal Integration)'),
  NOTION_PARENT_PAGE_ID: z
    .string()
    .min(1, 'NOTION_PARENT_PAGE_ID is required (UUID of parent page)')
    .transform((val) => {
      // Extract 32-char hex UUID from Notion URL slugs like "Page-Name-329293ab6e62802c8c5ad153ba8c02d1"
      const match = val.match(/([a-f0-9]{32})$/i);
      return match ? match[1] : val;
    }),

  // Optional with defaults
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  NARRATOR_MODEL: z.string().default('gemini-2.5-pro'),
  BLOG_TONE: z.enum(['professional', 'casual', 'technical', 'storytelling']).default('professional'),
  AUTO_PUBLISH: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
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
  return result.data;
}

export const env = validateEnv();
