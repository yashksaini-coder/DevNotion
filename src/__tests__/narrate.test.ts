import { describe, it, expect } from 'vitest';
import { narrateBlog } from '../llm/narrate.js';
import type { LLMProvider } from '../llm/provider.js';
import type { WeeklyData } from '../types/github.types.js';

const fakeData = {
  weekStart: '2026-05-27',
  weekEnd: '2026-06-03',
  totalCommits: 12,
  totalPRs: 0,
  totalAdditions: 0,
  totalDeletions: 0,
  totalIssues: 0,
  totalReviews: 0,
  totalDiscussions: 0,
  repos: [],
  pullRequests: [],
  issues: [],
  reviews: [],
  discussions: [],
  languages: {},
  reviewsGiven: 0,
  streakDays: 0,
} as unknown as WeeklyData;

function provider(generate: LLMProvider['generate']): LLMProvider {
  return { name: 'gemini', generate };
}

describe('narrateBlog', () => {
  it('returns parsed blog on valid model output', async () => {
    const text =
      '---\nheadline: "Shipped the spine"\ntldr: "did stuff"\ntags: typescript, backend\n---\n## TL;DR\nA solid week of building things and shipping work.';
    const blog = await narrateBlog(provider(async () => text), fakeData);
    expect(blog.headline).toBe('Shipped the spine');
    expect(blog.tags).toContain('typescript');
  });

  it('throws when the provider call fails (fail-loud, no fallback)', async () => {
    const p = provider(async () => {
      throw new Error('quota exceeded');
    });
    await expect(narrateBlog(p, fakeData)).rejects.toThrow(/quota exceeded/);
  });

  it('throws when model output cannot be parsed', async () => {
    const p = provider(async () => 'no frontmatter here');
    await expect(narrateBlog(p, fakeData)).rejects.toThrow(/Narration failed/);
  });
});
