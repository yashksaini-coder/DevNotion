import { mastra } from './mastra/index.js';
import { getLastMonday } from './utils/dates.js';
import { updateBlogLog } from './utils/update-blog-log.js';
import { notionMcp } from './mcp/notion.js';

async function runWeeklyDispatch(weekStart?: string) {
  const week = weekStart ?? getLastMonday();
  console.log(`Starting GitPulse for week of ${week}...`);

  const workflow = mastra.getWorkflow('weekly-dispatch');
  const run = await workflow.createRun();
  const result = await run.start({ inputData: { weekStart: week } });

  if (result.status === 'success' && result.result) {
    const r = result.result;
    console.log(`Published: ${r.notionPageUrl ?? '(no Notion)'}`);
    if (r.devtoUrl) console.log(`DEV.to draft: ${r.devtoUrl}`);

    // Update blog/README.md with this week's metrics
    updateBlogLog({
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      headline: r.headline,
      repoCount: r.repoCount,
      totalCommits: r.totalCommits,
      totalPRs: r.totalPRs,
      totalIssues: r.totalIssues,
      totalReviews: r.totalReviews,
      totalAdditions: r.totalAdditions,
      totalDeletions: r.totalDeletions,
      topLanguages: r.topLanguages,
      notionPageUrl: r.notionPageUrl,
      devtoUrl: r.devtoUrl,
    });
  } else {
    console.error('Workflow failed:', result.status);
    if ('error' in result) {
      console.error(result.error);
    }
    if ('steps' in result && result.steps) {
      for (const [stepId, stepResult] of Object.entries(result.steps as Record<string, any>)) {
        console.error(`  Step "${stepId}": ${stepResult?.status}`, stepResult?.output ?? stepResult?.error ?? '');
      }
    }
    process.exit(1);
  }
}

// Parse CLI arguments
const weekArg = process.argv.find((a) => a.startsWith('--week='))?.split('=')[1];
runWeeklyDispatch(weekArg)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => notionMcp.disconnect().catch(() => {}));
