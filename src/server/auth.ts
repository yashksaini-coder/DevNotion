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

// ─── request-level unlock check (read-only — for rendering locked vs unlocked UI) ───

/**
 * True if the request carries a valid unlock SESSION cookie. Does NOT mutate.
 *
 * Deliberately session-cookie-only: a Bearer token must NOT flip a public GET page to
 * "unlocked", because verifyPassword() here would run on the unthrottled public GET path
 * and become a brute-force oracle for the PIN. Sessions are obtainable only through the
 * rate-limited /login POST; Bearer still authorizes mutations in authMiddleware (throttled).
 */
export function isUnlocked(req: { headers: { cookie?: string } }): boolean {
  return isSessionValid(readCookie(req.headers.cookie, SESSION_COOKIE));
}

// ─── brute-force throttle on credential attempts (the unlock token is a guessable PIN) ───

export const MAX_LOGIN_ATTEMPTS = 5; // per IP per window
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
// Defense-in-depth vs DISTRIBUTED guessing (many IPs, each under the per-IP cap) of the
// small PIN keyspace: a global cap across all IPs per window. Trade-off — a sustained
// attack can lock everyone out for the window; acceptable for a single-user dashboard,
// where a brief lockout beats a cracked publish credential. (A longer token is strictly
// better; this is a backstop, not a substitute.)
export const GLOBAL_MAX_FAILURES = 50;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
let globalFailures = 0;
let globalResetAt = 0;

/** Whether `ip` may still attempt a credential check (under the per-window cap). */
export function loginAllowed(ip: string, now: number = Date.now()): boolean {
  if (now < globalResetAt && globalFailures >= GLOBAL_MAX_FAILURES) return false; // global backstop
  const a = loginAttempts.get(ip);
  if (!a || now >= a.resetAt) return true;
  return a.count < MAX_LOGIN_ATTEMPTS;
}

/** Record a failed credential attempt for `ip` (starts/extends the lockout window). */
export function recordLoginFailure(ip: string, now: number = Date.now()): void {
  const a = loginAttempts.get(ip);
  if (!a || now >= a.resetAt) loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  else a.count += 1;

  // Global backstop counter (distributed brute force across many IPs).
  if (now >= globalResetAt) {
    globalFailures = 1;
    globalResetAt = now + LOGIN_WINDOW_MS;
  } else {
    globalFailures += 1;
  }
}

/** Clear the failure counter for `ip` (call on a successful unlock). */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}
