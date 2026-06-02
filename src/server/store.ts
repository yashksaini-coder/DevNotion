import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface RunRecord {
  jobId: string;
  weekStart: string;
  tone: string;
  focusAreas: string;
  status: 'pending' | 'running' | 'preview' | 'published' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
  result?: {
    headline: string;
    tldr: string;
    content: string;
    tags: string[];
    notionPageUrl?: string;
    devtoUrl?: string;
    hashnodeUrl?: string;
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    totalReviews: number;
    repoCount: number;
  };
  editedContent?: string; // user edits before publish
}

const STORE_PATH = join(process.cwd(), '.devnotion-runs.json');

function loadStore(): RunRecord[] {
  if (!existsSync(STORE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(STORE_PATH, 'utf8')) as RunRecord[];
  } catch {
    return [];
  }
}

function saveStore(records: RunRecord[]): void {
  writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), 'utf8');
}

export function createRun(weekStart: string, tone: string, focusAreas: string): RunRecord {
  const record: RunRecord = {
    jobId: randomUUID(),
    weekStart,
    tone,
    focusAreas,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const store = loadStore();
  store.unshift(record);
  saveStore(store);
  return record;
}

export function getRun(jobId: string): RunRecord | undefined {
  return loadStore().find((r) => r.jobId === jobId);
}

export function listRuns(limit = 20): RunRecord[] {
  return loadStore().slice(0, limit);
}

export function updateRun(jobId: string, patch: Partial<RunRecord>): void {
  const store = loadStore();
  const idx = store.findIndex((r) => r.jobId === jobId);
  if (idx === -1) return;
  store[idx] = { ...store[idx]!, ...patch };
  saveStore(store);
}
