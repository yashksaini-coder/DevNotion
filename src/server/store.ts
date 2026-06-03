import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { WeeklyData } from '../types/github.types.js';

export interface RunRecord {
  jobId: string;
  weekStart: string;
  tone: string;
  focusAreas: string;
  status: 'pending' | 'running' | 'preview' | 'publishing' | 'published' | 'failed';
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
  weeklyData?: WeeklyData; // full harvested data, needed to publish after approval
  images?: { coverPath?: string; statsCardPath?: string };
  devLogNumber?: number; // sequential "Dev log #n" number
}

const STORE_PATH = process.env.DEVNOTION_RUNS_PATH ?? join(process.cwd(), '.devnotion-runs.json');

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

export function deleteRun(jobId: string): boolean {
  const store = loadStore();
  const next = store.filter((r) => r.jobId !== jobId);
  if (next.length === store.length) return false;
  saveStore(next);
  return true;
}

export function deleteRuns(jobIds: string[]): number {
  const ids = new Set(jobIds);
  const store = loadStore();
  const next = store.filter((r) => !ids.has(r.jobId));
  const removed = store.length - next.length;
  if (removed > 0) saveStore(next);
  return removed;
}

/** Next sequential "Dev log #n" number — one past the highest assigned so far. */
export function nextDevLogNumber(): number {
  const store = loadStore();
  const max = store.reduce((m, r) => Math.max(m, r.devLogNumber ?? 0), 0);
  return max + 1;
}
