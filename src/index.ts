import { mastra } from './mastra/index.js';
import cron from 'node-cron';
import { getLastMonday } from './utils/dates.js';

async function runWeeklyDispatch(weekStart?: string) {
  const week = weekStart ?? getLastMonday();
  console.log(`Starting DevNotion for week of ${week}...`);

  const workflow = mastra.getWorkflow('weekly-dispatch');
  const run = await workflow.createRun();
  const result = await run.start({ inputData: { weekStart: week } });

  if (result.status === 'success') {
    console.log(`Published: ${result.result?.notionPageUrl}`);
  } else {
    console.error('Workflow failed:', result.status);
    if ('error' in result) {
      console.error(result.error);
    }
    // Log individual step results for debugging
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

if (weekArg || process.argv.includes('--now')) {
  runWeeklyDispatch(weekArg).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  // Weekly cron: every Sunday at 08:00 local time
  cron.schedule('0 8 * * 0', () => {
    runWeeklyDispatch().catch(console.error);
  });
  console.log('DevNotion cron started. Runs every Sunday at 08:00.');
}
