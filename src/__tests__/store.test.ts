import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const TMP = join(tmpdir(), `devnotion-store-${randomUUID()}.json`);

beforeEach(() => {
  process.env.DEVNOTION_RUNS_PATH = TMP;
});
afterEach(() => {
  rmSync(TMP, { force: true });
  delete process.env.DEVNOTION_RUNS_PATH;
});

describe('run store', () => {
  it('creates, reads, and updates a run with content + weeklyData + edits', async () => {
    const { createRun, getRun, updateRun, listRuns } = await import('../server/store.js');

    const rec = createRun('2026-05-27', 'technical', '');
    expect(rec.status).toBe('pending');

    updateRun(rec.jobId, {
      status: 'preview',
      result: {
        headline: 'H',
        tldr: 'T',
        content: 'BODY',
        tags: ['ts'],
        totalCommits: 12,
        totalPRs: 0,
        totalIssues: 50,
        totalReviews: 0,
        repoCount: 3,
      },
      weeklyData: { weekStart: '2026-05-27' } as never,
    });

    const got = getRun(rec.jobId);
    expect(got?.status).toBe('preview');
    expect(got?.result?.content).toBe('BODY');
    expect(got?.weeklyData).toBeDefined();

    updateRun(rec.jobId, { editedContent: 'EDITED', status: 'published' });
    expect(getRun(rec.jobId)?.editedContent).toBe('EDITED');
    expect(listRuns(10)[0]?.jobId).toBe(rec.jobId);
  });
});
