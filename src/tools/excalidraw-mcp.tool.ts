import { MCPClient } from '@mastra/mcp';
import { env } from '../config/env.js';

let mcpClient: MCPClient | null = null;

function getExcalidrawMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient({
      id: 'excalidraw-mcp',
      servers: {
        excalidraw: {
          url: new URL('/mcp', env.EXCALIDRAW_MCP_URL),
        },
      },
    });
  }
  return mcpClient;
}

export async function getExcalidrawTools() {
  const client = getExcalidrawMCPClient();
  return client.listTools();
}

export async function getExcalidrawToolsets() {
  const client = getExcalidrawMCPClient();
  return client.listToolsets();
}
