import { describe, it, expect } from 'vitest';
import { aggregateRepoCommits, topTouchedAreas } from '../tools/github-commits.js';

describe('aggregateRepoCommits', () => {
  it('sums additions/deletions/changedFiles and collects messages', () => {
    const nodes = [
      { oid: 'a', message: 'feat: add parser\n\nlong body', additions: 100, deletions: 10, changedFilesIfAvailable: 4, committedDate: '2026-05-27T10:00:00Z' },
      { oid: 'b', message: 'fix: edge case', additions: 5, deletions: 40, changedFilesIfAvailable: 2, committedDate: '2026-05-28T10:00:00Z' },
    ];
    const agg = aggregateRepoCommits(nodes, 5);
    expect(agg.additions).toBe(105);
    expect(agg.deletions).toBe(50);
    expect(agg.changedFiles).toBe(6);
    expect(agg.commitMessages).toEqual(['feat: add parser', 'fix: edge case']);
  });

  it('caps the number of messages', () => {
    const nodes = Array.from({ length: 10 }, (_, i) => ({
      oid: String(i), message: `commit ${i}`, additions: 1, deletions: 0, changedFilesIfAvailable: 1, committedDate: '2026-05-27T10:00:00Z',
    }));
    const agg = aggregateRepoCommits(nodes, 3);
    expect(agg.commitMessages).toHaveLength(3);
    expect(agg.additions).toBe(10);
  });
});

describe('topTouchedAreas', () => {
  it('returns the most-touched top-level directories', () => {
    const paths = [
      'src/auth/login.ts',
      'src/auth/session.ts',
      'src/auth/token.ts',
      'src/api/users.ts',
      'README.md',
    ];
    const areas = topTouchedAreas(paths, 2);
    expect(areas).toEqual(['src/auth', 'src/api']);
  });

  it('handles root-level files and dedupes', () => {
    const areas = topTouchedAreas(['a.ts', 'b.ts', 'pkg/x.ts'], 5);
    expect(areas).toContain('pkg');
    expect(areas).toContain('(root)');
  });
});
