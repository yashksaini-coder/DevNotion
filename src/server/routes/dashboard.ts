import { Router, type IRouter } from 'express';
import { listRuns } from '../store.js';
import { env } from '../../config/env.js';

export const dashboardRouter: IRouter = Router();

dashboardRouter.get('/', (_req, res) => {
  const runs = listRuns(30);
  const authEnabled = Boolean(env.DASHBOARD_TOKEN);

  const rows = runs
    .map((run) => {
      const statusBadge: Record<string, string> = {
        pending: '<span class="badge badge-gray">Pending</span>',
        running: '<span class="badge badge-blue">Running</span>',
        preview: '<span class="badge badge-yellow">Preview Ready</span>',
        published: '<span class="badge badge-green">Published</span>',
        failed: '<span class="badge badge-red">Failed</span>',
      };

      const links = [
        run.result?.notionPageUrl ? `<a href="${run.result.notionPageUrl}" target="_blank">Notion</a>` : '',
        run.result?.devtoUrl ? `<a href="${run.result.devtoUrl}" target="_blank">DEV.to</a>` : '',
        run.result?.hashnodeUrl ? `<a href="${run.result.hashnodeUrl}" target="_blank">Hashnode</a>` : '',
      ]
        .filter(Boolean)
        .join(' · ');

      const previewLink =
        run.status === 'preview'
          ? `<a href="/preview/${run.jobId}" class="btn btn-sm">Review & Publish →</a>`
          : '';

      return `
        <tr>
          <td>${new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
          <td><code>${run.weekStart}</code></td>
          <td>${run.result?.headline ? `<span title="${run.result.headline}">${run.result.headline.slice(0, 55)}${run.result.headline.length > 55 ? '…' : ''}</span>` : '—'}</td>
          <td>${statusBadge[run.status] ?? run.status}</td>
          <td>${links || previewLink || '—'}</td>
        </tr>`;
    })
    .join('');

  res.send(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevNotion Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; min-height: 100vh; }
    header { background: #18181b; border-bottom: 1px solid #27272a; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
    header h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
    header .subtitle { color: #71717a; font-size: 0.875rem; }
    header nav { margin-left: auto; display: flex; gap: 0.75rem; }
    main { max-width: 1100px; margin: 2rem auto; padding: 0 2rem; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.5rem 0.75rem; font-size: 0.75rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #27272a; }
    td { padding: 0.75rem; font-size: 0.875rem; border-bottom: 1px solid #18181b; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #27272a; }
    a { color: #818cf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8em; background: #27272a; padding: 0.15em 0.4em; border-radius: 0.25rem; }
    .btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-decoration: none; border: none; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-sm { padding: 0.3rem 0.75rem; font-size: 0.8rem; background: #6366f1; color: #fff; border-radius: 0.375rem; }
    .badge { display: inline-flex; align-items: center; padding: 0.2em 0.6em; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-gray  { background: #27272a; color: #a1a1aa; }
    .badge-blue  { background: #1e3a5f; color: #60a5fa; }
    .badge-yellow{ background: #3b2f00; color: #fbbf24; }
    .badge-green { background: #052e16; color: #4ade80; }
    .badge-red   { background: #3b0f0f; color: #f87171; }
    .empty { text-align: center; padding: 3rem; color: #71717a; }
    .auth-notice { background: #1c1917; border: 1px solid #292524; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.8rem; color: #a8a29e; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <header>
    <span>📊</span>
    <div>
      <h1>DevNotion</h1>
      <div class="subtitle">Weekly GitHub Activity → Blog Posts</div>
    </div>
    <nav>
      <a href="/run" class="btn btn-primary">+ New Run</a>
    </nav>
  </header>
  <main>
    ${!authEnabled ? '<div class="auth-notice">🔓 Running without auth — set DASHBOARD_TOKEN in .env to secure this dashboard</div>' : ''}
    <div class="card">
      <h2>Run History</h2>
      ${runs.length === 0 ? '<div class="empty">No runs yet — <a href="/run">start your first run</a></div>' : `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Week</th>
            <th>Headline</th>
            <th>Status</th>
            <th>Links</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`}
    </div>
  </main>
</body>
</html>`);
});
