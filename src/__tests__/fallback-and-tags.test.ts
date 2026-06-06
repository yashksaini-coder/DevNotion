import { describe, it, expect } from 'vitest';
import { normalizeDevtoTags } from '../tools/devto.tool.js';
import { buildFallbackNarration } from '../workflows/weekly-dispatch.workflow.js';
import type { WeeklyData } from '../types/github.types.js';

describe('normalizeDevtoTags', () => {
  it('lowercases, strips non-alphanumerics, and caps at 4', () => {
    expect(normalizeDevtoTags(['TypeScript', 'open-source', 'C++', 'API', 'extra'])).toEqual([
      'typescript', 'opensource', 'c', 'api',
    ]);
  });
});

const data = {
  weekStart: '2026-05-27', weekEnd: '2026-06-03',
  totalCommits: 13, totalPRs: 0, totalAdditions: 100, totalDeletions: 5,
  totalIssues: 2, totalReviews: 0, totalDiscussions: 0,
  repos: [{ name: 'trx', url: 'https://github.com/x/trx', commits: 13, additions: 100, deletions: 5, language: 'Rust' }],
  pullRequests: [], issues: [], reviews: [], discussions: [],
  languages: { Rust: 10, TypeScript: 5 }, reviewsGiven: 0, streakDays: 5,
} as unknown as WeeklyData;

describe('buildFallbackNarration', () => {
  it('produces a valid blog object from raw data (no LLM)', () => {
    const out = buildFallbackNarration(data);
    expect(out.blog.headline).toContain('2026-05-27');
    expect(out.blog.content).toContain('TL;DR');
    expect(out.blog.content).toContain('trx');
    expect(Array.isArray(out.blog.tags)).toBe(true);
    expect(out.blog.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});
