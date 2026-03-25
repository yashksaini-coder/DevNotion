import type { NarratorOutput } from '../types/blog.types.js';

/**
 * Parse YAML frontmatter + markdown content from narrator output.
 * Expected format:
 * ---
 * headline: "..."
 * tldr: "..."
 * tags: tag1, tag2, tag3
 * ---
 * ...markdown content...
 */
export function parseFrontmatter(
  text: string,
): { success: true; data: NarratorOutput } | { success: false; error: string } {
  try {
    const trimmed = text.trim();

    // Extract frontmatter between --- delimiters
    const match = trimmed.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) {
      return { success: false, error: 'No frontmatter block found (expected --- delimiters)' };
    }

    const frontmatter = match[1]!;
    const content = match[2]!.trim();

    if (!content) {
      return { success: false, error: 'No content after frontmatter' };
    }

    // Parse frontmatter fields
    const headline = extractField(frontmatter, 'headline') ?? 'Untitled';
    const tldr = extractField(frontmatter, 'tldr') ?? '';
    const tagsRaw = extractField(frontmatter, 'tags') ?? '';
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

    // Estimate reading time (~250 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.min(20, Math.round(wordCount / 250)));

    return {
      success: true,
      data: {
        blog: {
          headline: headline.slice(0, 120),
          tldr: tldr.slice(0, 300),
          content,
          tags,
          readingTimeMinutes,
        },
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Extract a field value from YAML frontmatter.
 * Handles both quoted ("value") and unquoted (value) formats.
 */
function extractField(frontmatter: string, key: string): string | null {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);
  if (!match) return null;
  // Strip surrounding quotes if present
  return match[1]!.trim().replace(/^["']|["']$/g, '');
}
