import { Router, type IRouter } from 'express';
import { getRun } from '../store.js';

export const previewRouter: IRouter = Router();

// GET /preview/:jobId — show run status / preview / edit form
previewRouter.get('/:jobId', (req, res) => {
  const run = getRun(req.params.jobId!);
  if (!run) {
    res.status(404).send('<h1>Run not found</h1>');
    return;
  }

  const isRunning = run.status === 'pending' || run.status === 'running';
  const isFailed = run.status === 'failed';
  const isPublished = run.status === 'published';

  const links = [
    run.result?.notionPageUrl
      ? `<a href="${run.result.notionPageUrl}" target="_blank" class="platform-link">📓 Notion</a>`
      : '',
    run.result?.devtoUrl
      ? `<a href="${run.result.devtoUrl}" target="_blank" class="platform-link">🔗 DEV.to</a>`
      : '',
    run.result?.hashnodeUrl
      ? `<a href="${run.result.hashnodeUrl}" target="_blank" class="platform-link">⚡ Hashnode</a>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  res.send(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isRunning ? 'Running…' : run.result?.headline ?? 'Preview'} · DevNotion</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; min-height: 100vh; }
    header { background: #18181b; border-bottom: 1px solid #27272a; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
    header h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
    a.back { color: #818cf8; font-size: 0.875rem; text-decoration: none; margin-left: auto; }
    a.back:hover { text-decoration: underline; }
    main { max-width: 860px; margin: 2rem auto; padding: 0 2rem; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 2rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem; margin-bottom: 1rem; }
    .headline { font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 0.5rem; }
    .tldr { color: #a1a1aa; font-size: 0.925rem; line-height: 1.6; }
    .meta { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-top: 1rem; font-size: 0.8rem; color: #52525b; }
    .meta span strong { color: #71717a; }
    .platform-links { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem; }
    .platform-link { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.9rem; background: #27272a; border-radius: 0.5rem; font-size: 0.85rem; color: #e5e5e5; text-decoration: none; border: 1px solid #3f3f46; }
    .platform-link:hover { background: #3f3f46; }
    .spinner { display: inline-block; width: 1.5rem; height: 1.5rem; border: 2px solid #27272a; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .running-state { text-align: center; padding: 3rem; }
    .running-state p { color: #71717a; margin-top: 0.75rem; font-size: 0.9rem; }
    .error-state { padding: 1.5rem; background: #1a0a0a; border: 1px solid #7f1d1d; border-radius: 0.75rem; }
    .error-state h3 { color: #f87171; margin-bottom: 0.5rem; }
    .error-state pre { color: #fca5a5; font-size: 0.8rem; white-space: pre-wrap; word-break: break-word; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem; }
    .stat { background: #0f0f0f; border: 1px solid #27272a; border-radius: 0.5rem; padding: 0.75rem; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #818cf8; }
    .stat-label { font-size: 0.7rem; color: #52525b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.2rem; }
  </style>
  ${isRunning ? '<meta http-equiv="refresh" content="3">' : ''}
</head>
<body>
  <header>
    <span>📊</span>
    <h1>DevNotion</h1>
    <a href="/" class="back">← Run History</a>
  </header>
  <main>
    ${isRunning ? `
    <div class="card">
      <div class="running-state">
        <div class="spinner"></div>
        <p>Pipeline running for week of <strong>${run.weekStart}</strong>…</p>
        <p style="margin-top:0.5rem;font-size:0.8rem;color:#3f3f46">This page auto-refreshes every 3 seconds</p>
      </div>
    </div>` : ''}

    ${isFailed ? `
    <div class="error-state">
      <h3>Pipeline Failed</h3>
      <pre>${run.error ?? 'Unknown error'}</pre>
    </div>` : ''}

    ${isPublished && run.result ? `
    <div class="card">
      <h2>Published</h2>
      <div class="headline">${run.result.headline}</div>
      ${run.result.tldr ? `<div class="tldr">${run.result.tldr}</div>` : ''}
      <div class="meta">
        <span><strong>Week:</strong> ${run.weekStart}</span>
        <span><strong>Tone:</strong> ${run.tone}</span>
        ${run.focusAreas ? `<span><strong>Focus:</strong> ${run.focusAreas}</span>` : ''}
        <span><strong>Completed:</strong> ${run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</span>
      </div>
      <div class="platform-links">${links}</div>
    </div>

    <div class="card">
      <h2>Stats</h2>
      <div class="stat-grid">
        <div class="stat"><div class="stat-value">${run.result.totalCommits}</div><div class="stat-label">Commits</div></div>
        <div class="stat"><div class="stat-value">${run.result.totalPRs}</div><div class="stat-label">PRs</div></div>
        <div class="stat"><div class="stat-value">${run.result.totalIssues}</div><div class="stat-label">Issues</div></div>
        <div class="stat"><div class="stat-value">${run.result.totalReviews}</div><div class="stat-label">Reviews</div></div>
        <div class="stat"><div class="stat-value">${run.result.repoCount}</div><div class="stat-label">Repos</div></div>
      </div>
    </div>` : ''}
  </main>
</body>
</html>`);
});
