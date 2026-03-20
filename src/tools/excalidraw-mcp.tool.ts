import { MCPClient } from '@mastra/mcp';
import { env } from '../config/env.js';

let mcpClient: MCPClient | null = null;

function getExcalidrawMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient({
      id: 'excalidraw-mcp',
      servers: {
        excalidraw: {
          command: 'docker',
          args: [
            'run',
            '-i',
            '--rm',
            '-e',
            `EXPRESS_SERVER_URL=${env.EXCALIDRAW_CANVAS_URL}`,
            '-e',
            'ENABLE_CANVAS_SYNC=true',
            'ghcr.io/yctimlin/mcp_excalidraw:latest',
          ],
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
