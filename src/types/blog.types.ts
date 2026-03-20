import { z } from 'zod';

export const NarratorOutputSchema = z.object({
  blog: z.object({
    headline: z.string().transform((s) => s.slice(0, 120)),
    tldr: z.string().transform((s) => s.slice(0, 300)),
    content: z.string(),
    tags: z.array(z.string()).default([]),
    readingTimeMinutes: z.coerce.number().min(1).max(20).default(2),
  }),
});

export type NarratorOutput = z.infer<typeof NarratorOutputSchema>;
