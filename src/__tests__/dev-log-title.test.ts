import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { formatDevLogTitle } from '../publish/title.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

describe('formatDevLogTitle', () => {
  it('prefixes the title with the dev-log number', () => {
    expect(formatDevLogTitle(7, 'Shipped the auth flow')).toBe('Dev log #7 Shipped the auth flow');
  });
});

const TMP = join(tmpdir(), `devnotion-devlog-${randomUUID()}.json`);
beforeEach(() => {
  process.env.DEVNOTION_RUNS_PATH = TMP;
});
afterEach(() => {
  rmSync(TMP, { force: true });
  delete process.env.DEVNOTION_RUNS_PATH;
});

describe('nextDevLogNumber', () => {
  it('starts at 1 and increments past the highest assigned number', async () => {
    const { createRun, updateRun, nextDevLogNumber } = await import('../server/store.js');
    expect(nextDevLogNumber()).toBe(1);

    const a = createRun('2026-05-01', 'casual', '');
    updateRun(a.jobId, { devLogNumber: 1 });
    expect(nextDevLogNumber()).toBe(2);

    const b = createRun('2026-05-08', 'casual', '');
    updateRun(b.jobId, { devLogNumber: 5 });
    expect(nextDevLogNumber()).toBe(6);
  });
});
