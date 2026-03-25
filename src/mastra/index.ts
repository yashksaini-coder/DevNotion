import { Mastra } from '@mastra/core';
import { FilesystemStore } from '@mastra/core/storage';
import { githubHarvestAgent } from '../agents/github-harvest.agent.js';
import { narratorAgent } from '../agents/narrator.agent.js';
import { publisherAgent } from '../agents/publisher.agent.js';
import { weeklyDispatchWorkflow } from '../workflows/weekly-dispatch.workflow.js';

export const mastra = new Mastra({
  storage: new FilesystemStore(),
  agents: {
    'github-harvest-agent': githubHarvestAgent,
    'narrator-agent': narratorAgent,
    'publisher-agent': publisherAgent,
  },
  workflows: {
    'weekly-dispatch': weeklyDispatchWorkflow,
  },
});
