import { Router, type IRouter } from 'express';
import { listRuns } from '../store.js';
import { env } from '../../config/env.js';
import { page } from '../views/layout.js';

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

  const body = `
    ${!authEnabled ? '<div class="notice">🔓 Running without auth — set DASHBOARD_TOKEN to secure this dashboard</div>' : ''}
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
    </div>`;

  res.send(page({ title: 'DevNotion Dashboard', activeNav: 'history', body }));
});
