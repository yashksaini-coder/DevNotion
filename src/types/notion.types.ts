import { z } from 'zod';

export const PublishResultSchema = z.object({
  notionPageUrl: z.string().url(),
  diagramUrl: z.string().url(),
  notionPageId: z.string(),
  publishedAt: z.string(),
});

export type PublishResult = z.infer<typeof PublishResultSchema>;
