import { Router, type IRouter } from 'express';
import { listRuns, deleteRun, deleteRuns } from '../store.js';
import { isAuthEnabled } from '../auth.js';
import { page } from '../views/layout.js';

export const dashboardRouter: IRouter = Router();

dashboardRouter.get('/', (_req, res) => {
  const runs = listRuns(30);
  const authEnabled = isAuthEnabled();

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
          <td><input type="checkbox" name="ids" value="${run.jobId}" aria-label="Select run" style="width:auto"></td>
          <td>${new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
          <td><code>${run.weekStart}</code></td>
          <td>${run.result?.headline ? `<span title="${run.result.headline}">${run.result.headline.slice(0, 55)}${run.result.headline.length > 55 ? '…' : ''}</span>` : '—'}</td>
          <td>${statusBadge[run.status] ?? run.status}</td>
          <td>${links || previewLink || '—'}</td>
          <td><button type="submit" formaction="/runs/${run.jobId}/delete" formmethod="post" onclick="return confirm('Delete this run?')" class="btn btn-sm" style="border-color:var(--red);color:var(--red)" aria-label="Delete run">✕</button></td>
        </tr>`;
    })
    .join('');

  const body = `
    ${!authEnabled
      ? '<div class="notice">🔓 Running without auth — set DASHBOARD_PASSWORD to secure this dashboard</div>'
      : '<div class="notice" style="display:flex;justify-content:space-between;align-items:center">🔒 Authenticated (session expires after 10 min) <a href="/logout" style="color:#ff8787">Log out</a></div>'}
    <div class="card">
      <h2>Run History</h2>
      ${runs.length === 0 ? '<div class="empty">No runs yet — <a href="/run">start your first run</a></div>' : `
      <form method="POST" action="/runs/delete">
        <table>
          <thead>
            <tr>
              <th style="width:1.5rem"></th>
              <th>Date</th>
              <th>Week</th>
              <th>Headline</th>
              <th>Status</th>
              <th>Links</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:1.25rem">
          <button type="submit" class="btn btn-sm" onclick="return confirm('Delete the selected runs?')">Delete selected</button>
        </div>
      </form>`}
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
