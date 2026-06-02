import express from 'express';
import { env } from '../config/env.js';
import { authMiddleware } from './middleware/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { runRouter } from './routes/run.js';
import { previewRouter } from './routes/preview.js';

const app = express();

// Parse URL-encoded form bodies and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Optional auth (login page — only if DASHBOARD_TOKEN is set)
app.get('/login', (req, res) => {
  if (!env.DASHBOARD_TOKEN) {
    res.redirect('/');
    return;
  }
  const redirect = (req.query.redirect as string) ?? '/';
  res.send(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login · DevNotion</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 2rem; width: 320px; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; text-align: center; }
    label { display: block; font-size: 0.875rem; color: #a1a1aa; margin-bottom: 0.4rem; }
    input { width: 100%; background: #0f0f0f; border: 1px solid #27272a; border-radius: 0.5rem; padding: 0.6rem 0.75rem; color: #e5e5e5; font-size: 0.9rem; outline: none; margin-bottom: 1rem; }
    input:focus { border-color: #6366f1; }
    button { width: 100%; background: #6366f1; color: #fff; border: none; padding: 0.6rem; border-radius: 0.5rem; font-size: 0.9rem; cursor: pointer; }
    button:hover { opacity: 0.85; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📊 DevNotion</h1>
    <form method="POST" action="/login">
      <input type="hidden" name="redirect" value="${redirect}">
      <label>Access Token</label>
      <input type="password" name="token" placeholder="Enter dashboard token" required autofocus>
      <button type="submit">Login</button>
    </form>
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
