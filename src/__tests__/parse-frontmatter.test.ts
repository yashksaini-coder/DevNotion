import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../utils/parse-frontmatter.js';

describe('parseFrontmatter', () => {
  it('parses a valid frontmatter + body', () => {
    const text = `---
headline: "Shipped the auth rewrite"
tldr: "A solid week."
tags: typescript, backend, auth
---
## TL;DR
Real content goes here, with enough words to count.`;
    const r = parseFrontmatter(text);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.blog.headline).toBe('Shipped the auth rewrite');
      expect(r.data.blog.tldr).toBe('A solid week.');
      expect(r.data.blog.tags).toEqual(['typescript', 'backend', 'auth']);
      expect(r.data.blog.content).toContain('## TL;DR');
      expect(r.data.blog.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    }
  });

  it('fails when there is no frontmatter block', () => {
    const r = parseFrontmatter('just some text, no delimiters');
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toMatch(/frontmatter/i);
  });

  it('fails when there is no content after the frontmatter', () => {
    const text = `---
headline: "x"
tldr: "y"
tags: a
---
`;
    const r = parseFrontmatter(text);
    expect(r.success).toBe(false);
  });

  it('tolerates missing optional fields (tags empty)', () => {
    const text = `---
headline: "Only a headline"
tldr: "tldr"
---
Body content present here.`;
    const r = parseFrontmatter(text);
    expect(r.success).toBe(true);
    if (r.success) expect(Array.isArray(r.data.blog.tags)).toBe(true);
  });
});
