import { describe, it, expect } from 'vitest';
import { buildStatsCardSvg } from '../images/stats-card.js';
import type { WeeklyData } from '../types/github.types.js';

const data = {
  weekStart: '2026-05-27',
  weekEnd: '2026-06-03',
  totalCommits: 13,
  totalPRs: 2,
  totalAdditions: 2252,
  totalDeletions: 293,
  totalIssues: 5,
  totalReviews: 1,
  totalDiscussions: 0,
  repos: [{ name: 'trx' }, { name: 'nvim' }],
  pullRequests: [], issues: [], reviews: [], discussions: [],
  languages: { Rust: 1000, TypeScript: 500 },
  reviewsGiven: 1,
  streakDays: 5,
} as unknown as WeeklyData;

const blog = { headline: 'A week deep in src/server', tldr: 't', content: 'c', tags: ['rust'], readingTimeMinutes: 3 };

describe('buildStatsCardSvg', () => {
  it('produces an SVG containing the headline and key numbers', () => {
    const svg = buildStatsCardSvg(data, blog);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('13');
    expect(svg).toContain('2,252');
    expect(svg).toContain('A week deep in src/server');
  });

  it('escapes XML-special characters in the headline', () => {
    const svg = buildStatsCardSvg(data, { ...blog, headline: 'Fixed <auth> & "tokens"' });
    expect(svg).not.toContain('<auth>');
    expect(svg).toContain('&lt;auth&gt;');
    expect(svg).toContain('&amp;');
  });

  it('uses a concrete font family, not the bare CSS generic (resvg cannot resolve "sans-serif" alone)', () => {
    const svg = buildStatsCardSvg(data, blog);
    expect(svg).toContain('Liberation Sans');
    // no text node may rely on the bare generic, which resvg renders as a serif
    expect(svg).not.toMatch(/font-family="sans-serif"/);
  });

  it('strips the "Dev log #n" prefix from the card title (the article keeps it)', () => {
    const svg = buildStatsCardSvg(data, { ...blog, headline: 'Dev log #7 Shipping the auth flow' });
    expect(svg).toContain('Shipping the auth flow');
    expect(svg).not.toContain('Dev log #7');
  });

  it('does not render the week date on the card', () => {
    const svg = buildStatsCardSvg(data, blog);
    expect(svg).not.toContain(data.weekStart);
    expect(svg).not.toContain(data.weekEnd);
  });

  it('wraps a long title onto two lines so it fits', () => {
    const long = 'Bridging the Gap: TLS Interop, p2p Hardening, and Neovim Refinement Across the Stack';
    const svg = buildStatsCardSvg(data, { ...blog, headline: `Dev log #5 ${long}` });
    // two title <text> nodes at the header (fill #e5e5e5), none overflowing as one line
    const titleNodes = (svg.match(/fill="#e5e5e5"/g) ?? []).length;
    expect(titleNodes).toBe(2);
  });
});
