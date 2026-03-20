import { z } from 'zod';

// Permissive schema — core fields validated, rest passes through for rich Excalidraw format.
// The narrator instructions define the full element format (ids, label objects, roundness,
// arrow bindings, cameraUpdate, etc.) and .passthrough() preserves all extra properties.
export const ExcalidrawElementSchema = z.object({
  type: z.enum(['rectangle', 'arrow', 'text', 'ellipse', 'line', 'diamond', 'cameraUpdate']),
  id: z.string().optional(),
  x: z.coerce.number().optional(),
  y: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  strokeColor: z.string().optional(),
  backgroundColor: z.string().optional(),
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
