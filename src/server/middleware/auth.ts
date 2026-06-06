import type { Request, Response, NextFunction } from 'express';
import {
  isSessionValid,
  verifyPassword,
  readCookie,
  SESSION_COOKIE,
  loginAllowed,
  recordLoginFailure,
  clearLoginAttempts,
} from '../auth.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Public view, token-gated mutations.
 *
 * - Safe methods (GET/HEAD/OPTIONS): always allowed. Anyone can view the dashboard,
 *   run history, and a run's preview.
 * - Unsafe methods (POST/PUT/PATCH/DELETE): require a valid session cookie OR a correct
 *   `Authorization: Bearer <token>`.
 *
 * FAIL-CLOSED: unsafe methods are gated regardless of whether a credential is configured,
 * so an unset DASHBOARD_PASSWORD_HASH can never silently make publishing/deleting public.
 * Bearer attempts are rate-limited per IP because the unlock token is a guessable PIN.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const ip = req.ip ?? 'unknown';
  const header = req.headers.authorization ?? '';

  // Stateless path (scripts/API): Authorization: Bearer <token> — throttled.
  if (header.startsWith('Bearer ')) {
    if (!loginAllowed(ip)) {
      res.status(429).json({ error: 'Too many attempts — try again later' });
      return;
    }
    if (verifyPassword(header.slice(7))) {
      clearLoginAttempts(ip);
      next();
      return;
    }
    recordLoginFailure(ip);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Browser path: a valid unlock session cookie.
  if (isSessionValid(readCookie(req.headers.cookie, SESSION_COOKIE))) {
    next();
    return;
  }

  if (req.accepts('html') && !req.path.startsWith('/api')) {
    res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
