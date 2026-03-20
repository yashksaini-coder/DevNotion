import { z } from 'zod';

export const ExcalidrawElementSchema = z.object({
  type: z.enum(['rectangle', 'arrow', 'text', 'ellipse', 'line', 'diamond']),
  x: z.coerce.number(),
  y: z.coerce.number(),
  width: z.coerce.number().default(160),
  height: z.coerce.number().default(80),
  label: z.string().optional(),
  strokeColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  points: z.array(z.tuple([z.coerce.number(), z.coerce.number()])).optional(),
}).passthrough();

export const NarratorOutputSchema = z.object({
  blog: z.object({
    headline: z.string().transform((s) => s.slice(0, 120)),
    tldr: z.string().transform((s) => s.slice(0, 300)),
    content: z.string(),
    tags: z.array(z.string()).default([]),
    readingTimeMinutes: z.coerce.number().min(1).max(20).default(2),
  }).passthrough(),
  diagram: z.object({
    title: z.string(),
    elements: z.array(ExcalidrawElementSchema).default([]),
  }).passthrough(),
});

export type NarratorOutput = z.infer<typeof NarratorOutputSchema>;
export type ExcalidrawElement = z.infer<typeof ExcalidrawElementSchema>;
