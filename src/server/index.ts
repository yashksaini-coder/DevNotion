import express from 'express';
import { join } from 'node:path';
import { env } from '../config/env.js';
import { STYLES } from './views/layout.js';
import { authMiddleware } from './middleware/auth.js';
import { isAuthEnabled, verifyPassword, createSession, destroySession, readCookie, SESSION_COOKIE, SESSION_TTL_MS } from './auth.js';
import { landingRouter } from './routes/landing.js';
import { dashboardRouter } from './routes/dashboard.js';
import { runRouter } from './routes/run.js';
import { previewRouter } from './routes/preview.js';

const app = express();

// Parse URL-encoded form bodies and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve generated images (no auth — needed for preview <img> and embeds)
app.use('/generated', express.static(join(process.cwd(), 'assets', 'generated')));

// Public landing page (no auth)
app.use('/', landingRouter);

// Login / logout — reachable without auth; active only when a password is configured.
app.get('/login', (req, res) => {
  if (!isAuthEnabled()) {
    res.redirect('/runs');
    return;
  }
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const redirect = esc((req.query.redirect as string) ?? '/runs');
  const error = req.query.error
    ? '<div class="notice" style="border-color:#ff4d2e;color:#ff8787;margin-bottom:1rem">Wrong password — try again.</div>'
    : '';
  res.send(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login · DevNotion</title>
  <style>${STYLES}</style>
</head>
<body>
  <div style="display:flex;align-items:center;justify-content:center;min-height:80vh">
    <div class="card" style="width:320px">
      <h1 style="font-size:1.25rem;font-weight:700;margin-bottom:1.5rem;text-align:center">📊 DevNotion</h1>
      ${error}
      <form method="POST" action="/login">
        <input type="hidden" name="redirect" value="${redirect}">
        <div class="field">
          <label>Password</label>
          <input type="password" name="password" placeholder="Enter dashboard password" required autofocus>
        </div>
        <button class="btn btn-primary" style="width:100%" type="submit">Log in</button>
      </form>
    </div>
  </div>
</body>
</html>`);
});

app.post('/login', (req, res) => {
  const { password, redirect } = req.body as { password?: string; redirect?: string };
  // Only allow internal redirect targets — never an absolute/protocol-relative URL.
  const target =
    typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/runs';
  if (password && verifyPassword(password)) {
    const sessionId = createSession();
    res.cookie(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_TTL_MS, path: '/' });
    res.redirect(target);
  } else {
    res.redirect(`/login?redirect=${encodeURIComponent(target)}&error=1`);
  }
});

app.get('/logout', (req, res) => {
  destroySession(readCookie(req.headers.cookie, SESSION_COOKIE));
  res.clearCookie(SESSION_COOKIE);
  res.redirect('/login');
});

// Apply auth to all routes below
app.use(authMiddleware);

// Routes
app.use('/runs', dashboardRouter);
app.use('/run', runRouter);
app.use('/preview', previewRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// 404 fallback
app.use((_req, res) => {
  res.status(404).send('<h1>404 — Page not found</h1><p><a href="/runs">← Back to Dashboard</a></p>');
});

export function startServer(): void {
  const port = env.DASHBOARD_PORT;
  app.listen(port, () => {
    console.log(`✓ DevNotion Dashboard running at http://localhost:${port}`);
    if (!isAuthEnabled()) {
      console.warn('⚠ No DASHBOARD_PASSWORD set — dashboard is publicly accessible on this port');
    }
  });
}
