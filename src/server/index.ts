import express from 'express';
import { join } from 'node:path';
import { env } from '../config/env.js';
import { STYLES } from './views/layout.js';
import { authMiddleware } from './middleware/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { runRouter } from './routes/run.js';
import { previewRouter } from './routes/preview.js';

const app = express();

// Parse URL-encoded form bodies and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve generated images (no auth — needed for preview <img> and embeds)
app.use('/generated', express.static(join(process.cwd(), 'assets', 'generated')));

// Optional auth (login page — only if DASHBOARD_TOKEN is set)
app.get('/login', (req, res) => {
  if (!env.DASHBOARD_TOKEN) {
    res.redirect('/');
    return;
  }
  const redirectRaw = (req.query.redirect as string) ?? '/';
  const redirect = redirectRaw.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
      <form method="POST" action="/login">
        <input type="hidden" name="redirect" value="${redirect}">
        <div class="field">
          <label>Access Token</label>
          <input type="password" name="token" placeholder="Enter dashboard token" required autofocus>
        </div>
        <button class="btn btn-primary" style="width:100%" type="submit">Login</button>
      </form>
    </div>
  </div>
</body>
</html>`);
});

app.post('/login', (req, res) => {
  const { token, redirect } = req.body as { token?: string; redirect?: string };
  const target = redirect ?? '/';
  if (token === env.DASHBOARD_TOKEN) {
    // Redirect with token as query param (simple stateless auth for single-user dashboard)
    const url = new URL(target, `http://localhost:${env.DASHBOARD_PORT}`);
    url.searchParams.set('token', token!);
    res.redirect(url.pathname + url.search);
  } else {
    res.redirect(`/login?redirect=${encodeURIComponent(target)}&error=1`);
  }
});

// Apply auth to all routes below
app.use(authMiddleware);

// Routes
app.use('/', dashboardRouter);
app.use('/run', runRouter);
app.use('/preview', previewRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// 404 fallback
app.use((_req, res) => {
  res.status(404).send('<h1>404 — Page not found</h1><p><a href="/">← Back to Dashboard</a></p>');
});

export function startServer(): void {
  const port = env.DASHBOARD_PORT;
  app.listen(port, () => {
    console.log(`✓ DevNotion Dashboard running at http://localhost:${port}`);
    if (!env.DASHBOARD_TOKEN) {
      console.warn('⚠ No DASHBOARD_TOKEN set — dashboard is publicly accessible on this port');
    }
  });
}
