import { Router, type IRouter } from 'express';
import { listRuns, deleteRun, deleteRuns } from '../store.js';
import { isUnlocked } from '../auth.js';
import { page, escapeHtml } from '../views/layout.js';

export const dashboardRouter: IRouter = Router();

dashboardRouter.get('/', (req, res) => {
  const runs = listRuns(30);
  const unlocked = isUnlocked(req);

  const rows = runs
    .map((run) => {
      const statusBadge: Record<string, string> = {
        pending: '<span class="badge badge-gray">Pending</span>',
        running: '<span class="badge badge-blue">Running</span>',
        preview: '<span class="badge badge-yellow">Preview Ready</span>',
        published: '<span class="badge badge-green">Published</span>',
        failed: '<span class="badge badge-red">Failed</span>',
      };

      // Escape every run-derived value — this page is public.
      const links = [
        run.result?.notionPageUrl ? `<a href="${escapeHtml(run.result.notionPageUrl)}" target="_blank" rel="noopener">Notion</a>` : '',
        run.result?.devtoUrl ? `<a href="${escapeHtml(run.result.devtoUrl)}" target="_blank" rel="noopener">DEV.to</a>` : '',
        run.result?.hashnodeUrl ? `<a href="${escapeHtml(run.result.hashnodeUrl)}" target="_blank" rel="noopener">Hashnode</a>` : '',
      ]
        .filter(Boolean)
        .join(' · ');

      const previewLink =
        run.status === 'preview'
          ? `<a href="/preview/${run.jobId}" class="btn btn-sm">${unlocked ? 'Review & Publish →' : 'View preview →'}</a>`
          : '';

      const headline = run.result?.headline
        ? `<span title="${escapeHtml(run.result.headline)}">${escapeHtml(run.result.headline.slice(0, 55))}${run.result.headline.length > 55 ? '…' : ''}</span>`
        : '—';

      return `
        <tr>
          ${unlocked ? `<td><input type="checkbox" name="ids" value="${run.jobId}" aria-label="Select run" style="width:auto"></td>` : ''}
          <td>${new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
          <td><code>${escapeHtml(run.weekStart)}</code></td>
          <td>${headline}</td>
          <td>${statusBadge[run.status] ?? escapeHtml(run.status)}</td>
          <td>${links || previewLink || '—'}</td>
          ${unlocked ? `<td><button type="submit" formaction="/runs/${run.jobId}/delete" formmethod="post" onclick="return confirm('Delete this run?')" class="btn btn-sm" style="border-color:var(--red);color:var(--red)" aria-label="Delete run">✕</button></td>` : ''}
        </tr>`;
    })
    .join('');

  const banner = unlocked
    ? '<div class="notice" style="display:flex;justify-content:space-between;align-items:center">🔓 Unlocked — you can review, publish & delete (session expires after 10 min) <a href="/logout" style="color:#ff8787">Lock</a></div>'
    : '<div class="notice" style="display:flex;justify-content:space-between;align-items:center">🔒 View-only — anyone can browse; publishing & deleting require a token <a href="/login?redirect=/runs">Enter token</a></div>';

  const table = `
    <table>
      <thead>
        <tr>
          ${unlocked ? '<th style="width:1.5rem"></th>' : ''}
          <th>Date</th>
          <th>Week</th>
          <th>Headline</th>
          <th>Status</th>
          <th>Links</th>
          ${unlocked ? '<th></th>' : ''}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  const historyBlock =
    runs.length === 0
      ? `<div class="empty">No runs yet${unlocked ? ' — <a href="/run">start your first run</a>' : ''}</div>`
      : unlocked
        ? `<form method="POST" action="/runs/delete">${table}<div style="margin-top:1.25rem"><button type="submit" class="btn btn-sm" onclick="return confirm('Delete the selected runs?')">Delete selected</button></div></form>`
        : table;

  const body = `
    ${banner}
    <div class="card">
      <h2>Run History</h2>
      ${historyBlock}
    </div>`;

  res.send(page({ title: 'DevNotion Dashboard', activeNav: 'history', body }));
});

// POST /runs/delete — delete the selected runs (checkbox multi-select)
dashboardRouter.post('/delete', (req, res) => {
  const raw = (req.body as { ids?: string | string[] }).ids;
  const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
  deleteRuns(ids);
  res.redirect('/runs');
});

// POST /runs/:jobId/delete — delete a single run
dashboardRouter.post('/:jobId/delete', (req, res) => {
  deleteRun(req.params.jobId!);
  res.redirect('/runs');
});
