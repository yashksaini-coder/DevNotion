import { Agent } from '@mastra/core/agent';
import { createGoogleModel } from '../config/providers.js';

/** Base cover scene. {context} is filled deterministically from the week's work. */
export const COVER_SCENE =
  'A warm, photorealistic editorial illustration of a focused young adult developer working through a rainy evening — rain streaking the window behind him, a mug of coffee on the desk, three monitor screens in front of him filled with code and ideas, and a Discord voice-call panel open on one screen. Deep indigo and charcoal tones, screen glow on his face. On the screens: {context}. Cinematic, high detail, 16:9, no logos, no watermarks.';

/** Real Mastra agent for cover generation (image model + scene). */
export const imageAgent = new Agent({
  id: 'image-agent',
  name: 'image-agent',
  model: createGoogleModel('gemini-2.5-flash-image'),
  instructions: COVER_SCENE,
});
