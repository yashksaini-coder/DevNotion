import { createTool } from '@mastra/core/tools';
import { Client } from '@notionhq/client';
import { z } from 'zod';
import { env } from '../config/env.js';
import PQueue from 'p-queue';
import pRetry from 'p-retry';

const notion = new Client({ auth: env.NOTION_TOKEN });

// Rate limiter: Notion API allows ~3 requests/second
const queue = new PQueue({ concurrency: 1, interval: 334, intervalCap: 1 });

async function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
  return queue.add(() => pRetry(fn, { retries: 3 })) as Promise<T>;
}

export const searchNotionTool = createTool({
  id: 'notion-search-week',
  description: 'Search for an existing weekly dispatch page to prevent duplicates',
  inputSchema: z.object({
    weekTitle: z.string().describe('Title to search for, e.g. "Week of 2026-03-16"'),
  }),
  outputSchema: z.object({
    exists: z.boolean(),
    pageId: z.string().optional(),
    pageUrl: z.string().optional(),
  }),
  execute: async (inputData) => {
    const results = await rateLimited(() =>
      notion.search({
        query: inputData.weekTitle,
        filter: { property: 'object', value: 'page' },
        page_size: 5,
      }),
    );
    const match = results.results[0];
    if (match && 'url' in match) {
      return {
        exists: true,
        pageId: match.id,
        pageUrl: match.url,
      };
    }
    return { exists: false };
  },
});

export const createNotionPageTool = createTool({
  id: 'notion-create-blog-page',
  description: 'Create a new blog post page in Notion under the parent page',
  inputSchema: z.object({
    title: z.string().describe('Page title, e.g. "Week of March 16-22, 2026 · 12 commits · 3 PRs"'),
    weekStart: z.string().describe('ISO date of week start'),
  }),
  outputSchema: z.object({
    pageId: z.string(),
    pageUrl: z.string(),
  }),
  execute: async (inputData) => {
    const page = await rateLimited(() =>
      notion.pages.create({
        parent: { page_id: env.NOTION_PARENT_PAGE_ID },
        properties: {
          title: {
            title: [{ text: { content: inputData.title } }],
          },
        },
      }),
    );
    return {
      pageId: page.id,
      pageUrl: (page as any).url ?? `https://notion.so/${page.id.replace(/-/g, '')}`,
    };
  },
});

export const writeMarkdownTool = createTool({
  id: 'notion-write-markdown',
  description: 'Write markdown content to a Notion page using the Markdown Content API',
  inputSchema: z.object({
    pageId: z.string().describe('Notion page ID to write to'),
    markdown: z.string().describe('Full markdown content for the blog post'),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async (inputData) => {
    const response = await rateLimited(() =>
      fetch(`https://api.notion.com/v1/pages/${inputData.pageId}/markdown`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2026-03-11',
        },
        body: JSON.stringify({
          type: 'replace_content',
          replace_content: { new_str: inputData.markdown },
        }),
      }),
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Notion Markdown API error ${response.status}: ${body}`);
    }

    return { success: true };
  },
});

// Direct functions for programmatic (non-agent) use
export async function searchNotion(weekTitle: string) {
  const results = await rateLimited(() =>
    notion.search({ query: weekTitle, filter: { property: 'object', value: 'page' }, page_size: 5 }),
  );
  const match = results.results[0];
  if (match && 'url' in match) {
    return { exists: true, pageId: match.id, pageUrl: match.url };
  }
  return { exists: false as const, pageId: undefined, pageUrl: undefined };
}

export async function createNotionPage(title: string) {
  const page = await rateLimited(() =>
    notion.pages.create({
      parent: { page_id: env.NOTION_PARENT_PAGE_ID },
      properties: { title: { title: [{ text: { content: title } }] } },
    }),
  );
  return { pageId: page.id, pageUrl: (page as any).url ?? `https://notion.so/${page.id.replace(/-/g, '')}` };
}

export async function writeNotionMarkdown(pageId: string, markdown: string) {
  const response = await rateLimited(() =>
    fetch(`https://api.notion.com/v1/pages/${pageId}/markdown`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2026-03-11',
      },
      body: JSON.stringify({
        type: 'replace_content',
        replace_content: { new_str: markdown },
      }),
    }),
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion Markdown API error ${response.status}: ${body}`);
  }
}

export async function updateNotionPage(pageId: string, icon?: string) {
  const updateData: any = {};
  if (icon) updateData.icon = { type: 'emoji', emoji: icon };
  await rateLimited(() => notion.pages.update({ page_id: pageId, ...updateData }));
}

export const updateNotionPageTool = createTool({
  id: 'notion-update-page',
  description: 'Update properties on a Notion page (e.g. set published status)',
  inputSchema: z.object({
    pageId: z.string(),
    icon: z.string().optional().describe('Emoji icon for the page'),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async (inputData) => {
    const updateData: any = {};
    if (inputData.icon) {
      updateData.icon = { type: 'emoji', emoji: inputData.icon };
    }
    await rateLimited(() =>
      notion.pages.update({
        page_id: inputData.pageId,
        ...updateData,
      }),
    );
    return { success: true };
  },
});
