import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { env } from '../config/env.js';
import { devtoLimiter } from '../utils/rate-limiter.js';

const DEVTO_BASE = 'https://dev.to/api';

// Use shared rate limiter (DEV.to allows 30 req/30s for API key users)
const rateLimited = devtoLimiter;

/** DEV.to tags: max 4, lowercase, alphanumeric only. */
export function normalizeDevtoTags(tags: string[]): string[] {
  return tags.slice(0, 4).map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ''));
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'api-key': env.DEVTO_API_KEY!,
  };
}

export async function createDevtoArticle(opts: {
  title: string;
  body_markdown: string;
  tags: string[];
  published?: boolean;
  canonical_url?: string;
  main_image?: string;
}): Promise<{ articleId: number; articleUrl: string }> {
  const response = await rateLimited(() =>
    fetch(`${DEVTO_BASE}/articles`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        article: {
          title: opts.title,
          body_markdown: opts.body_markdown,
          tags: normalizeDevtoTags(opts.tags),
          published: opts.published ?? false,
          canonical_url: opts.canonical_url,
          main_image: opts.main_image,
        },
      }),
    }),
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DEV.to API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { id: number; url: string };
  return { articleId: data.id, articleUrl: data.url };
}

export const createDevtoArticleTool = createTool({
  id: 'devto-create-article',
  description: 'Create a new article on DEV.to',
  inputSchema: z.object({
    title: z.string().describe('Article title'),
    body_markdown: z.string().describe('Full markdown body'),
    tags: z.array(z.string()).max(4).describe('Tags (max 4, lowercase)'),
    published: z.boolean().default(false).describe('Publish immediately or save as draft'),
    canonical_url: z.string().optional().describe('Canonical URL (e.g. Notion page)'),
    main_image: z.string().optional().describe('Cover image URL'),
  }),
  outputSchema: z.object({
    articleId: z.number(),
    articleUrl: z.string(),
  }),
  execute: async (inputData) => {
    return createDevtoArticle(inputData);
  },
});
