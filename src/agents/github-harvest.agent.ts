import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchWeeklyContributions } from '../tools/github.tool.js';
import { WeeklyDataSchema } from '../types/github.types.js';

export const fetchGithubTool = createTool({
  id: 'fetch-github-week',
  description: 'Fetch all GitHub contributions for a specific week',
  inputSchema: z.object({
    weekStart: z.string().describe('ISO date YYYY-MM-DD, must be a Monday'),
  }),
  outputSchema: WeeklyDataSchema,
  execute: async (inputData) => {
    const raw = await fetchWeeklyContributions(inputData.weekStart);
    return WeeklyDataSchema.parse(raw);
  },
});

export const githubHarvestAgent = new Agent({
  id: 'github-harvest-agent',
  name: 'github-harvest-agent',
  model: 'groq/llama-3.1-8b-instant',
  instructions:
    'Call the fetch-github-week tool with the provided weekStart date. Return the raw result. Do not add commentary.',
  tools: { fetchGithubTool },
});
