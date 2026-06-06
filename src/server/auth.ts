import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/** Login cache (session) stays alive for exactly this long after login. */
export const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const SESSION_COOKIE = 'devnotion_session';

// ─── password hashing (scrypt: salted, slow, constant-time compare) ───

/** Hash a password as `salt:derivedKey` (both hex). A random salt is used unless one is given. */
export function hashPassword(password: string, salt: string = randomBytes(16).toString('hex')): string {
  const derived = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

/** Constant-time verify a password against a stored `salt:derivedKey`. */
export function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  let keyBuf: Buffer;
  try {
    keyBuf = Buffer.from(key, 'hex');
  } catch {
    return false;
  }
  const derived = scryptSync(password, salt, 32);
  return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
}

// Configured credential: prefer a pre-computed hash; otherwise hash the plaintext
// password once at boot so the rest of the app only ever compares against a hash.
const configuredHash: string | null =
  env.DASHBOARD_PASSWORD_HASH ?? (env.DASHBOARD_PASSWORD ? hashPassword(env.DASHBOARD_PASSWORD) : null);

/** Auth is enforced only when a password (or hash) is configured. */
export function isAuthEnabled(): boolean {
  return configuredHash !== null;
}

/** Verify a submitted password against the configured credential (constant-time). */
export function verifyPassword(password: string): boolean {
  if (!configuredHash || !password) return false;
  return verifyPasswordHash(password, configuredHash);
}

// ─── sessions (in-memory; reset on restart — fine for a single-user dashboard) ───

const sessions = new Map<string, number>(); // sessionId -> expiresAt (epoch ms)

/** Create a session that expires `ttlMs` from `now`. Returns the opaque session id. */
export function createSession(now: number = Date.now(), ttlMs: number = SESSION_TTL_MS): string {
  const id = randomBytes(32).toString('hex');
  sessions.set(id, now + ttlMs);
  return id;
}

/** True only if the session exists and has not expired. Expired sessions are evicted lazily. */
export function isSessionValid(id: string | undefined, now: number = Date.now()): boolean {
  if (!id) return false;
  const expiresAt = sessions.get(id);
  if (expiresAt === undefined) return false;
  if (now >= expiresAt) {
    sessions.delete(id);
    return false;
  }
  return true;
}

export function destroySession(id: string | undefined): void {
  if (id) sessions.delete(id);
}

/**
 * Sanitize a post-login redirect target to an internal path — prevents open redirects.
 * Must be `/` followed by a non-slash, non-backslash char. Browsers normalize `\` to `/`,
 * so `//evil.com` AND `/\evil.com` (and absolute URLs) all fall back to the safe default.
 */
export function safeInternalPath(redirect: unknown, fallback = '/runs'): string {
  return typeof redirect === 'string' && /^\/[^/\\]/.test(redirect) ? redirect : fallback;
}

// ─── cookie parsing (no cookie-parser dependency) ───

/** Read a single cookie value from a raw Cookie header. */
export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}
