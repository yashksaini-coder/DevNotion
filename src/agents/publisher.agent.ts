import { Agent } from '@mastra/core/agent';
import { getExcalidrawTools } from '../tools/excalidraw-mcp.tool.js';
import {
  createNotionPageTool,
  writeMarkdownTool,
  searchNotionTool,
  updateNotionPageTool,
} from '../tools/notion-rest.tool.js';

export async function createPublisherAgent(): Promise<Agent> {
  let tools: Record<string, any> = {
    createNotionPage: createNotionPageTool,
    writeMarkdown: writeMarkdownTool,
    searchNotion: searchNotionTool,
    updateNotionPage: updateNotionPageTool,
  };

  try {
    const excalidrawTools = await getExcalidrawTools();
    tools = { ...excalidrawTools, ...tools };
  } catch (err) {
    console.warn(
      'Excalidraw MCP not available — publisher will skip diagram creation.',
      err instanceof Error ? err.message : err,
    );
  }

  return new Agent({
    id: 'publisher-agent',
    name: 'publisher-agent',
    model: 'google/gemini-3-flash-preview',
    instructions: `You are the GitPulse Publisher agent. You receive a blog post and diagram spec as JSON and publish them.

## Excalidraw Diagram (if tools available)
1. Call create_view with the diagram.elements array to render the diagram.
2. Call export_to_excalidraw to get a shareable URL.

## Notion Publishing
3. Search Notion for an existing page matching "Week of {weekStart}" using notion-search-week.
4. If the page does NOT exist, create it with notion-create-blog-page.
5. Build markdown: H1 headline, blockquote TLDR, diagram image embed (if available), blog content, tags as hashtags, reading time footer.
6. Write the markdown to the page using notion-write-markdown.
7. Update the page icon using notion-update-page with a relevant emoji.

Return a summary with the Notion page URL and diagram URL (if available).
If any step fails, report the error clearly.`,
    tools,
  });
}
