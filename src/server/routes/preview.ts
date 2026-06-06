import { Router, type IRouter } from 'express';
import { getRun } from '../store.js';
import { page, tokenGate } from '../views/layout.js';
import { isUnlocked } from '../auth.js';

export const previewRouter: IRouter = Router();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// GET /preview/:jobId — show run status / preview / edit form
previewRouter.get('/:jobId', (req, res) => {
  const run = getRun(req.params.jobId!);
  if (!run) {
    res.status(404).send('<h1>Run not found</h1>');
    return;
  }

  const unlocked = isUnlocked(req);
  const isRunning = run.status === 'pending' || run.status === 'running';
  const isPublishing = run.status === 'publishing';
  const isFailed = run.status === 'failed';
  const isPublished = run.status === 'published';

  const links = [
    run.result?.notionPageUrl
      ? `<a href="${escapeHtml(run.result.notionPageUrl)}" target="_blank" rel="noopener" class="platform-link">📓 Notion</a>`
      : '',
    run.result?.devtoUrl
      ? `<a href="${escapeHtml(run.result.devtoUrl)}" target="_blank" rel="noopener" class="platform-link">🔗 DEV.to</a>`
      : '',
    run.result?.hashnodeUrl
      ? `<a href="${escapeHtml(run.result.hashnodeUrl)}" target="_blank" rel="noopener" class="platform-link">⚡ Hashnode</a>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const title = isRunning
    ? 'Running… · DevNotion'
    : `${escapeHtml(run.result?.headline ?? 'Preview')} · DevNotion`;

  const body = /* html */ `
    ${isRunning ? `
    <div class="card">
      <div class="center-state">
        <div class="spinner"></div>
        <p style="margin-top:0.75rem;font-size:0.9rem">Pipeline running for week of <strong>${escapeHtml(run.weekStart)}</strong>…</p>
        <p style="margin-top:0.5rem;font-size:0.8rem">This page auto-refreshes every 3 seconds</p>
      </div>
    </div>` : ''}

    ${isPublishing ? `
    <div class="card">
      <div class="center-state">
        <div class="spinner"></div>
        <p style="margin-top:0.75rem;font-size:0.9rem">Publishing to your platforms…</p>
        <p style="margin-top:0.5rem;font-size:0.8rem">This page auto-refreshes every 3 seconds</p>
      </div>
    </div>` : ''}

    ${isFailed ? `
    <div class="error-state">
      <h3>Pipeline Failed</h3>
      <pre>${escapeHtml(run.error ?? 'Unknown error')}</pre>
    </div>` : ''}

    ${run.status === 'preview' && run.result ? `
    <div class="card">
      <h2>Preview — Ready to Review</h2>
      <div class="headline">${escapeHtml(run.result.headline)}</div>
      ${run.result.tldr ? `<div class="tldr">${escapeHtml(run.result.tldr)}</div>` : ''}
      <div class="meta">
        <span><strong>Week:</strong> ${escapeHtml(run.weekStart)}</span>
        <span><strong>Tone:</strong> ${escapeHtml(run.tone)}</span>
        <span><strong>Tags:</strong> ${escapeHtml(run.result.tags.join(', '))}</span>
      </div>
      ${run.images?.statsCardPath ? `
      <div class="img-row">
        <img src="/generated/${escapeHtml(run.images.statsCardPath.replace(/^.*assets[\\/]generated[\\/]/, '').replace(/\\\\/g, '/'))}" alt="cover">
      </div>` : ''}
      ${unlocked ? `
      <form method="POST" action="/run/publish/${run.jobId}" style="margin-top:1.25rem">
        <label style="display:block;font-size:0.8rem;color:#a1a1aa;margin-bottom:0.4rem">Edit the post before publishing (markdown)</label>
        <textarea name="editedContent" style="width:100%;min-height:380px;background:#0f0f0f;border:1px solid #27272a;border-radius:0.5rem;padding:0.75rem;color:#e5e5e5;font-family:'SF Mono',monospace;font-size:0.85rem;line-height:1.5">${escapeHtml(run.editedContent ?? run.result.content)}</textarea>
        <button type="submit" class="btn btn-primary" style="margin-top:1rem">Approve &amp; Publish →</button>
      </form>` : `
      <label style="display:block;font-size:0.8rem;color:#a1a1aa;margin:1.25rem 0 0.4rem">Generated post (read-only)</label>
      <textarea readonly aria-readonly="true" style="width:100%;min-height:380px;background:#0f0f0f;border:1px solid #27272a;border-radius:0.5rem;padding:0.75rem;color:#e5e5e5;font-family:'SF Mono',monospace;font-size:0.85rem;line-height:1.5;opacity:0.85">${escapeHtml(run.editedContent ?? run.result.content)}</textarea>
      <div style="margin-top:1rem">${tokenGate(`/preview/${run.jobId}`, 'Enter the token to edit and publish this draft.')}</div>`}
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

    ${isPublished && run.result ? `
    <div class="card">
      <h2>Published</h2>
      <div class="headline">${escapeHtml(run.result.headline)}</div>
      ${run.result.tldr ? `<div class="tldr">${escapeHtml(run.result.tldr)}</div>` : ''}
      <div class="meta">
        <span><strong>Week:</strong> ${escapeHtml(run.weekStart)}</span>
        <span><strong>Tone:</strong> ${escapeHtml(run.tone)}</span>
        ${run.focusAreas ? `<span><strong>Focus:</strong> ${escapeHtml(run.focusAreas)}</span>` : ''}
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
    </div>` : ''}`;

  res.send(page({
    title,
    headExtra: (isRunning || isPublishing) ? '<meta http-equiv="refresh" content="3">' : '',
    body,
  }));
});
