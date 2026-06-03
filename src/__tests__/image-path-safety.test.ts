import { describe, it, expect } from 'vitest';
import { generateImages } from '../images/generate-images.js';
import type { WeeklyData } from '../types/github.types.js';

const data = {
  weekStart: 'x',
  weekEnd: 'y',
  totalCommits: 0,
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

const blog = { headline: 'h', tldr: 't', content: 'c', tags: [], readingTimeMinutes: 1 };

describe('generateImages path safety', () => {
  it('rejects a weekStart that is not YYYY-MM-DD (no filesystem write, no network)', async () => {
    const out = await generateImages('../../etc/passwd', data, blog);
    expect(out).toEqual({});
  });

  it('rejects a slashed weekStart', async () => {
    const out = await generateImages('2026/05/27', data, blog);
    expect(out).toEqual({});
  });
});
