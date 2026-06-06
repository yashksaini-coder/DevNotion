import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const TMP = join(tmpdir(), `devnotion-del-${randomUUID()}.json`);
beforeEach(() => { process.env.DEVNOTION_RUNS_PATH = TMP; });
afterEach(() => { rmSync(TMP, { force: true }); delete process.env.DEVNOTION_RUNS_PATH; });

describe('store delete', () => {
  it('deletes one run and a set of runs; unknown ids are no-ops', async () => {
    const { createRun, listRuns, deleteRun, deleteRuns } = await import('../server/store.js');
    const a = createRun('2026-05-01', 'casual', '');
    const b = createRun('2026-05-08', 'casual', '');
    const c = createRun('2026-05-15', 'casual', '');
    expect(listRuns(10)).toHaveLength(3);

    expect(deleteRun(b.jobId)).toBe(true);
    expect(deleteRun('does-not-exist')).toBe(false);
    expect(listRuns(10)).toHaveLength(2);

    const removed = deleteRuns([a.jobId, c.jobId, 'nope']);
    expect(removed).toBe(2);
    expect(listRuns(10)).toHaveLength(0);
  });
});
