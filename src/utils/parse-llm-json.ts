import { z } from 'zod';

/**
 * Extract and parse JSON from LLM text responses.
 * Handles markdown fences, leading/trailing junk, and partial matches.
 */
export function extractJSON(text: string): unknown {
  const trimmed = text.trim();

  // 1. Try: markdown code fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]!.trim());
    } catch { /* fall through */ }
  }

  // 2. Try: raw text is valid JSON
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through */ }

  // 3. Try: find outermost balanced { ... } block
  const start = trimmed.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < trimmed.length; i++) {
      if (trimmed[i] === '{') depth++;
      else if (trimmed[i] === '}') depth--;
      if (depth === 0) {
        try {
          return JSON.parse(trimmed.slice(start, i + 1));
        } catch { /* fall through */ }
        break;
      }
    }
  }

  throw new Error('Could not extract valid JSON from LLM response');
}

/**
 * Parse LLM text into a typed object using a Zod schema.
 * Returns { success, data, error } to avoid throwing.
 */
export function parseLLMResponse<T>(
  text: string,
  schema: z.ZodType<T>,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const raw = extractJSON(text);
    const parsed = schema.parse(raw);
    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
