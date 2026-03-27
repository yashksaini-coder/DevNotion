import { Agent } from '@mastra/core/agent';
import { env } from '../config/env.js';
import { createGoogleModel } from '../config/providers.js';
import {
  createNotionPageTool,
  writeMarkdownTool,
  searchNotionTool,
  updateNotionPageTool,
} from '../tools/notion-rest.tool.js';
import { createDevtoArticleTool } from '../tools/devto.tool.js';

const tools: Record<string, any> = {
  createNotionPage: createNotionPageTool,
  writeMarkdown: writeMarkdownTool,
  searchNotion: searchNotionTool,
  updateNotionPage: updateNotionPageTool,
};

// Only register platform tools when API keys are configured
if (env.DEVTO_API_KEY) {
  tools.createDevtoArticle = createDevtoArticleTool;
}
const platformInstructions = env.DEVTO_API_KEY
  ? `## DEV.to Publishing
- Use devto-create-article to publish. Tags: max 4, lowercase alphanumeric.
- Set canonical_url to the Notion page URL if available.`
  : '';

export const publisherAgent = new Agent({
  id: 'publisher-agent',
  name: 'publisher-agent',
  model: createGoogleModel(env.UTILITY_MODEL),
  instructions: `You are the DevNotion Publisher agent. You receive a blog post as JSON and publish it to configured platforms.

## Notion Publishing
1. Search Notion for an existing page matching "Week of {weekStart}" using notion-search-week.
2. If the page does NOT exist, create it with notion-create-blog-page.
3. Build markdown: H1 headline, blockquote TLDR, blog content, tags as hashtags, reading time footer.
4. Write the markdown to the page using notion-write-markdown.
5. Update the page icon using notion-update-page with a relevant emoji.

${platformInstructions}

Return a summary with all published URLs.
If any step fails, report the error clearly.`,
  tools,
});
