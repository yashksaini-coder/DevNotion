import { describe, it, expect } from 'vitest';
import { NarratorOutputSchema } from '../types/blog.types.js';

describe('NarratorOutputSchema', () => {
  it('parses valid blog output', () => {
    const input = {
      blog: {
        headline: 'Week of 2026-03-16: shipped auth rewrite',
        tldr: '42 commits, 5 PRs across 3 repos — auth rewrite landed.',
        content: '## TL;DR\nBig week.\n\n## What I Built\nStuff.',
        tags: ['typescript', 'backend'],
        readingTimeMinutes: 3,
      },
    };

    const result = NarratorOutputSchema.parse(input);
    expect(result.blog.headline).toBe(input.blog.headline);
    expect(result.blog.tags).toEqual(['typescript', 'backend']);
  });

  it('applies defaults for optional fields', () => {
    const input = {
      blog: {
        headline: 'Test headline',
        tldr: 'Test tldr',
        content: 'Test content',
      },
    };

    const result = NarratorOutputSchema.parse(input);
    expect(result.blog.tags).toEqual([]);
    expect(result.blog.readingTimeMinutes).toBe(2);
  });

  it('truncates headline to 120 chars', () => {
    const input = {
      blog: {
        headline: 'A'.repeat(200),
        tldr: 'short',
        content: 'content',
        tags: [],
        readingTimeMinutes: 2,
      },
    };

    const result = NarratorOutputSchema.parse(input);
    expect(result.blog.headline.length).toBe(120);
  });

  it('truncates tldr to 300 chars', () => {
    const input = {
      blog: {
        headline: 'ok',
        tldr: 'B'.repeat(500),
        content: 'content',
        tags: [],
        readingTimeMinutes: 2,
      },
    };

    const result = NarratorOutputSchema.parse(input);
    expect(result.blog.tldr.length).toBe(300);
  });
});
