import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPasswordHash,
  createSession,
  isSessionValid,
  destroySession,
  readCookie,
  SESSION_TTL_MS,
  SESSION_COOKIE,
} from '../server/auth.js';

describe('password hashing (scrypt)', () => {
  it('verifies the correct password and rejects wrong ones', () => {
    const stored = hashPassword('correct horse battery staple');
    expect(verifyPasswordHash('correct horse battery staple', stored)).toBe(true);
    expect(verifyPasswordHash('wrong password', stored)).toBe(false);
    expect(verifyPasswordHash('', stored)).toBe(false);
  });

  it('uses a fresh salt each time (same password → different stored value)', () => {
    expect(hashPassword('same-password')).not.toBe(hashPassword('same-password'));
  });

  it('round-trips with a fixed salt', () => {
    const stored = hashPassword('hunter2', 'deadbeef');
    expect(stored.startsWith('deadbeef:')).toBe(true);
    expect(verifyPasswordHash('hunter2', stored)).toBe(true);
  });

  it('rejects malformed stored hashes instead of throwing', () => {
    expect(verifyPasswordHash('x', 'not-a-valid-hash')).toBe(false);
    expect(verifyPasswordHash('x', '')).toBe(false);
    expect(verifyPasswordHash('x', 'salt:')).toBe(false);
  });
});

describe('session lifecycle (10-minute TTL)', () => {
  it('the TTL is exactly 10 minutes', () => {
    expect(SESSION_TTL_MS).toBe(10 * 60 * 1000);
  });

  it('is valid right after login and dies exactly at the TTL boundary', () => {
    const t0 = 1_000_000;
    const id = createSession(t0);
    expect(isSessionValid(id, t0 + 1_000)).toBe(true); // 1s later — alive
    expect(isSessionValid(id, t0 + SESSION_TTL_MS - 1)).toBe(true); // just under 10 min
    expect(isSessionValid(id, t0 + SESSION_TTL_MS)).toBe(false); // exactly 10 min — expired
  });

  it('rejects unknown, empty, and destroyed sessions', () => {
    expect(isSessionValid('never-existed')).toBe(false);
    expect(isSessionValid(undefined)).toBe(false);
    const id = createSession();
    destroySession(id);
    expect(isSessionValid(id)).toBe(false);
  });
});

describe('cookie parsing', () => {
  it('reads a named cookie out of a Cookie header', () => {
    expect(readCookie(`a=1; ${SESSION_COOKIE}=abc123; b=2`, SESSION_COOKIE)).toBe('abc123');
  });

  it('returns undefined when absent or no header', () => {
    expect(readCookie('a=1; b=2', SESSION_COOKIE)).toBeUndefined();
    expect(readCookie(undefined, SESSION_COOKIE)).toBeUndefined();
  });
});
