import { Mastra } from '@mastra/core';
import { githubHarvestAgent } from '../agents/github-harvest.agent.js';
import { narratorAgent } from '../agents/narrator.agent.js';
import { createPublisherAgent } from '../agents/publisher.agent.js';
import { weeklyDispatchWorkflow } from '../workflows/weekly-dispatch.workflow.js';

const publisherAgent = await createPublisherAgent();

export const mastra = new Mastra({
  agents: {
    'github-harvest-agent': githubHarvestAgent,
    'narrator-agent': narratorAgent,
    'publisher-agent': publisherAgent,
  },
  workflows: {
    'weekly-dispatch': weeklyDispatchWorkflow,
  },
});
