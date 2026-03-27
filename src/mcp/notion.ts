import { MCPClient } from '@mastra/mcp';
import { env } from '../config/env.js';

export const notionMcp = new MCPClient({
  servers: {
    notion: {
      command: 'npx',
      args: ['-y', '@notionhq/notion-mcp-server'],
      env: {
        OPENAPI_MCP_HEADERS: JSON.stringify({
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
        }),
      },
    },
  },
  timeout: 30000,
});

/**
 * Lazily load MCP tools with graceful fallback.
 * If MCP server fails to start, returns empty toolset
 * (direct Notion tools still work independently).
 */
export async function getNotionMcpTools(): Promise<Record<string, any>> {
  try {
    return await notionMcp.listTools();
  } catch (err) {
    console.warn('MCP: Notion MCP server unavailable, using direct tools only:', err instanceof Error ? err.message : err);
    return {};
  }
}
