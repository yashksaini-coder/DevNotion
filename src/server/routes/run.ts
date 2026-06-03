import { Router, type IRouter } from 'express';
import { createRun, getRun, updateRun } from '../store.js';
import { env } from '../../config/env.js';
import { getLastMonday } from '../../utils/dates.js';
import { page } from '../views/layout.js';

export const runRouter: IRouter = Router();

// GET /run — trigger form
runRouter.get('/', (_req, res) => {
  const defaultWeek = getLastMonday();
  const currentTargets = env.PUBLISH_TARGETS.join(', ');

  const body = /* html */ `
    <div class="notice">
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
    <script>
      document.getElementById('runForm').addEventListener('submit', function(e) {
        document.getElementById('submitBtn').textContent = 'Running…';
        document.getElementById('submitBtn').disabled = true;
      });
    </script>`;

  res.send(page({ title: 'New Run · DevNotion', activeNav: 'run', body }));
});

// POST /run — trigger the pipeline and redirect to preview
runRouter.post('/', async (req, res) => {
  const weekStart: string = req.body.weekStart ?? getLastMonday();
  const tone: string = req.body.tone ?? env.BLOG_TONE;
  const focusAreas: string = req.body.focusAreas ?? '';

  const record = createRun(weekStart, tone, focusAreas);
  updateRun(record.jobId, { status: 'running' });

  // Fire-and-forget: run the pipeline in the background
  runGenerateBackground(record.jobId, weekStart, tone, focusAreas).catch((err) => {
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

async function runGenerateBackground(
  jobId: string,
  weekStart: string,
  tone: string,
  focusAreas: string,
): Promise<void> {
  const { generateContent } = await import('../../pipeline/generate.js');
  const { updateRun } = await import('../store.js');

  const { blog, weeklyData, images } = await generateContent({
    weekStart,
    tone: tone as 'professional' | 'casual' | 'technical' | 'storytelling',
    focusAreas: focusAreas || undefined,
  });

  const topLanguages = Object.entries(weeklyData.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([l]) => l);

  updateRun(jobId, {
    status: 'preview',
    completedAt: new Date().toISOString(),
    weeklyData,
    images,
    result: {
      headline: blog.headline,
      tldr: blog.tldr,
      content: blog.content,
      tags: blog.tags.length ? blog.tags : topLanguages,
      totalCommits: weeklyData.totalCommits,
      totalPRs: weeklyData.totalPRs,
      totalIssues: weeklyData.totalIssues,
      totalReviews: weeklyData.totalReviews,
      repoCount: weeklyData.repos.length,
    },
  });
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

// POST /publish/:jobId — approve edits and publish to all targets
runRouter.post('/publish/:jobId', async (req, res) => {
  const jobId = req.params.jobId!;
  const run = getRun(jobId);
  if (!run || run.status !== 'preview' || !run.result || !run.weeklyData) {
    res.status(400).send('<h1>Run not ready to publish</h1><p><a href="/">← Back</a></p>');
    return;
  }

  const editedContent: string = req.body.editedContent ?? run.result.content;
  updateRun(jobId, { status: 'publishing', editedContent });

  publishApprovedBackground(jobId).catch((err) => {
    console.error('Publish error:', err);
    updateRun(jobId, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      completedAt: new Date().toISOString(),
    });
  });

  res.redirect(`/preview/${jobId}`);
});

async function publishApprovedBackground(jobId: string): Promise<void> {
  const { getRun, updateRun } = await import('../store.js');
  const { publishBlog } = await import('../../publish/publish-content.js');
  const { env } = await import('../../config/env.js');

  const run = getRun(jobId);
  if (!run || !run.result || !run.weeklyData) throw new Error('Run state missing for publish');

  const content = run.editedContent ?? run.result.content;
  const blog = {
    headline: run.result.headline,
    tldr: run.result.tldr,
    content,
    tags: run.result.tags,
    readingTimeMinutes: Math.max(1, Math.round(content.split(/\s+/).length / 250)),
  };

  const result = await publishBlog({
    blog,
    weeklyData: run.weeklyData,
    publishMode: env.PUBLISH_MODE,
    images: run.images,
  });

  updateRun(jobId, {
    status: 'published',
    completedAt: new Date().toISOString(),
    result: {
      ...run.result,
      content,
      notionPageUrl: result.notionPageUrl,
      devtoUrl: result.devtoUrl,
      hashnodeUrl: result.hashnodeUrl,
    },
  });
}
