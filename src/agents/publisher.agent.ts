import { Agent } from '@mastra/core/agent';
import { env } from '../config/env.js';
import {
  createNotionPageTool,
  writeMarkdownTool,
  searchNotionTool,
  updateNotionPageTool,
} from '../tools/notion-rest.tool.js';

export const publisherAgent = new Agent({
  id: 'publisher-agent',
  name: 'publisher-agent',
  model: `google/${env.GEMINI_MODEL}`,
  instructions: `You are the DevNotion Publisher agent. You receive a blog post as JSON and publish it to Notion.

## Notion Publishing
1. Search Notion for an existing page matching "Week of {weekStart}" using notion-search-week.
2. If the page does NOT exist, create it with notion-create-blog-page.
3. Build markdown: H1 headline, blockquote TLDR, blog content, tags as hashtags, reading time footer.
4. Write the markdown to the page using notion-write-markdown.
5. Update the page icon using notion-update-page with a relevant emoji.

Return a summary with the Notion page URL.
If any step fails, report the error clearly.`,
  tools: {
    createNotionPage: createNotionPageTool,
    writeMarkdown: writeMarkdownTool,
    searchNotion: searchNotionTool,
    updateNotionPage: updateNotionPageTool,
  },
});
