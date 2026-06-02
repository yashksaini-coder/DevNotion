import { Agent } from '@mastra/core/agent';
import { env } from '../config/env.js';
import { createGoogleModel } from '../config/providers.js';
import { buildNarratorSystemPrompt } from '../llm/system-prompt.js';

export const narratorAgent = new Agent({
  id: 'narrator-agent',
  name: 'narrator-agent',
  model: createGoogleModel(env.NARRATOR_MODEL),
  instructions: buildNarratorSystemPrompt(env.BLOG_TONE, env.FOCUS_AREAS),
});
