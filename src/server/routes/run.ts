import { Router, type IRouter } from 'express';
import { createRun, getRun, updateRun } from '../store.js';
import { env } from '../../config/env.js';
import { getLastMonday } from '../../utils/dates.js';

export const runRouter: IRouter = Router();

// GET /run — trigger form
runRouter.get('/', (_req, res) => {
  const defaultWeek = getLastMonday();
  const currentTargets = env.PUBLISH_TARGETS.join(', ');

  res.send(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Run · DevNotion</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; min-height: 100vh; }
    header { background: #18181b; border-bottom: 1px solid #27272a; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
    header h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
    a.back { color: #818cf8; font-size: 0.875rem; text-decoration: none; margin-left: auto; }
    a.back:hover { text-decoration: underline; }
    main { max-width: 600px; margin: 2.5rem auto; padding: 0 2rem; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 2rem; }
    h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; }
    .field { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; color: #a1a1aa; margin-bottom: 0.4rem; }
    input, select, textarea { width: 100%; background: #0f0f0f; border: 1px solid #27272a; border-radius: 0.5rem; padding: 0.6rem 0.75rem; color: #e5e5e5; font-size: 0.9rem; outline: none; }
    input:focus, select:focus, textarea:focus { border-color: #6366f1; }
    textarea { resize: vertical; min-height: 80px; font-family: inherit; }
    .hint { font-size: 0.75rem; color: #52525b; margin-top: 0.35rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; width: 100%; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn:hover { opacity: 0.85; }
    .info { background: #18181b; border: 1px solid #27272a; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.8rem; color: #71717a; margin-bottom: 1.5rem; }
    .info strong { color: #a1a1aa; }
    select option { background: #18181b; }
  </style>
</head>
<body>
  <header>
    <span>📊</span>
    <h1>DevNotion</h1>
    <a href="/" class="back">← Run History</a>
  </header>
  <main>
    <div class="info">
      <strong>Publish targets:</strong> ${currentTargets} &nbsp;·&nbsp;
      <strong>Mode:</strong> ${env.PUBLISH_MODE} &nbsp;·&nbsp;
      <strong>LLM:</strong> ${env.LLM_PROVIDER}
    </div>
    <div class="card">
      <h2>Start New Run</h2>
      <form id="runForm" method="POST" action="/run">
        <div class="field">
          <label for="weekStart">Week Start (Monday)</label>
          <input type="date" id="weekStart" name="weekStart" value="${defaultWeek}" required>
          <div class="hint">The pipeline fetches 7 days of GitHub activity starting from this date.</div>
        </div>
        <div class="field">
          <label for="tone">Blog Tone</label>
          <select id="tone" name="tone">
            <option value="casual" ${env.BLOG_TONE === 'casual' ? 'selected' : ''}>Casual — OSS dev energy (default)</option>
            <option value="professional" ${env.BLOG_TONE === 'professional' ? 'selected' : ''}>Professional — Confident, concise</option>
            <option value="technical" ${env.BLOG_TONE === 'technical' ? 'selected' : ''}>Technical — Architecture deep-dive</option>
            <option value="storytelling" ${env.BLOG_TONE === 'storytelling' ? 'selected' : ''}>Storytelling — Personal dev log</option>
          </select>
        </div>
        <div class="field">
          <label for="focusAreas">Focus Areas <span style="color:#52525b;font-weight:400">(optional)</span></label>
          <textarea id="focusAreas" name="focusAreas" placeholder="e.g. TypeScript performance, open source contributions, API design">${env.FOCUS_AREAS ?? ''}</textarea>
          <div class="hint">Comma-separated themes. The narrator will emphasize these when found in your GitHub activity.</div>
        </div>
        <button type="submit" class="btn btn-primary" id="submitBtn">Run Pipeline →</button>
      </form>
    </div>
  </main>
  <script>
    document.getElementById('runForm').addEventListener('submit', function(e) {
      document.getElementById('submitBtn').textContent = 'Running…';
      document.getElementById('submitBtn').disabled = true;
    });
  </script>
</body>
</html>`);
});

// POST /run — trigger the pipeline and redirect to preview
runRouter.post('/', async (req, res) => {
  const weekStart: string = req.body.weekStart ?? getLastMonday();
  const tone: string = req.body.tone ?? env.BLOG_TONE;
  const focusAreas: string = req.body.focusAreas ?? '';

  const record = createRun(weekStart, tone, focusAreas);
  updateRun(record.jobId, { status: 'running' });

  // Fire-and-forget: run the pipeline in the background
  runPipelineBackground(record.jobId, weekStart, tone, focusAreas).catch((err) => {
    console.error('Pipeline error:', err);
    updateRun(record.jobId, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      completedAt: new Date().toISOString(),
    });
  });

  // Redirect immediately to a status page
  res.redirect(`/preview/${record.jobId}`);
});

async function runPipelineBackground(
  jobId: string,
  weekStart: string,
  tone: string,
  focusAreas: string,
): Promise<void> {
  // Override env for this run's tone/focus (process-level env mutation is safe for single-user dashboard)
  process.env.BLOG_TONE = tone;
  if (focusAreas) process.env.FOCUS_AREAS = focusAreas;
  else delete process.env.FOCUS_AREAS;

  const { mastra } = await import('../../mastra/index.js');
  const workflow = mastra.getWorkflow('weekly-dispatch');
  const run = await workflow.createRun();
  const result = await run.start({ inputData: { weekStart } });

  if (result.status === 'success' && result.result) {
    const r = result.result;

    // We need the blog content from the narrate step — re-read from the run context
    // Since the workflow only outputs PublishOutputSchema, we store what we have
    updateRun(jobId, {
      status: 'published',
      completedAt: new Date().toISOString(),
      result: {
        headline: r.headline,
        tldr: '',
        content: '',
        tags: r.topLanguages,
        notionPageUrl: r.notionPageUrl,
        devtoUrl: r.devtoUrl,
        hashnodeUrl: r.hashnodeUrl,
        totalCommits: r.totalCommits,
        totalPRs: r.totalPRs,
        totalIssues: r.totalIssues,
        totalReviews: r.totalReviews,
        repoCount: r.repoCount,
      },
    });
  } else {
    const errorMsg =
      result.status === 'failed'
        ? (result as { error?: { message?: string } }).error?.message ?? 'Pipeline failed'
        : 'Pipeline did not complete successfully';
    updateRun(jobId, {
      status: 'failed',
      error: errorMsg,
      completedAt: new Date().toISOString(),
    });
  }
}

// GET /status/:jobId — JSON status poll endpoint
runRouter.get('/status/:jobId', (req, res) => {
  const run = getRun(req.params.jobId!);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  res.json({ status: run.status, error: run.error });
});
