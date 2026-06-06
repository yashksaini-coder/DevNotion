import type { Request, Response, NextFunction } from 'express';
import { isAuthEnabled, isSessionValid, verifyPassword, readCookie, SESSION_COOKIE } from '../auth.js';

/**
 * Dashboard auth. Off entirely when no password is configured (local-only use).
 * When on, a request passes if EITHER:
 *   - it carries a valid, unexpired session cookie (browser, set at /login), or
 *   - it sends `Authorization: Bearer <password>` (API / scripts, stateless).
 * Browsers get redirected to /login; everything else gets a 401.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthEnabled()) {
    next();
    return;
  }

  const header = req.headers.authorization ?? '';
  if (header.startsWith('Bearer ') && verifyPassword(header.slice(7))) {
    next();
    return;
  }

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
