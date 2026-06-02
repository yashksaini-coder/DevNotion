import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';

/**
 * Optional bearer token auth for the dashboard.
 * Only active when DASHBOARD_TOKEN is set in env.
 * Skips auth entirely if no token is configured (local-only use).
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!env.DASHBOARD_TOKEN) {
    next();
    return;
  }

  const header = req.headers.authorization ?? '';
  const query = (req.query.token as string | undefined) ?? '';

  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : query;

  if (!token || token !== env.DASHBOARD_TOKEN) {
    // For browser requests, redirect to login; for API requests, return 401
    if (req.accepts('html') && !req.path.startsWith('/api')) {
      res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
    return;
  }

  next();
}
