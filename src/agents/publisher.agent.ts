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
    model: 'groq/llama-3.1-8b-instant',
    instructions: `You receive a blog post object and a diagram element spec object as JSON.

Execute these steps in order:

## Excalidraw Diagram (if tools available)
1. Call clear_canvas to reset the Excalidraw canvas.
2. Call batch_create_elements with the diagram.elements array.
3. Call set_viewport with scrollToContent: true to fit the diagram.
4. Call export_to_excalidraw_url to get a shareable diagram URL.

## Notion Publishing
5. Search Notion for an existing page with "Week of {weekStart}" using notion-search-week.
6. If the page does NOT exist, create it with notion-create-blog-page.
7. Build the full markdown: include the blog content, and if a diagram URL was generated, embed it as an image link.
8. Write the markdown to the page using notion-write-markdown.
9. Update the page icon using notion-update-page with a relevant emoji.

Return a summary with the Notion page URL and diagram URL (if available).
If any step fails, report the error clearly. Do not skip steps.`,
    tools,
  });
}
