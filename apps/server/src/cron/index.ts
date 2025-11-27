import fastifyCron from 'fastify-cron';
import type { FastifyInstance } from 'fastify';
import { mastra } from '../mastra/index.js';
import { RuntimeContext } from '@mastra/core/runtime-context';

// Daily at 11 AM CST (17:00 UTC) - CST is UTC-6, so 11 AM CST = 5 PM UTC (cron format: 0 17 * * *)
const DAILY_WORKFLOW_CRON_SCHEDULE = '0 17 * * *';

// Weekly event - runs every Sunday at midnight UTC (cron format: 0 0 * * 0)
const WEEKLY_EVENT_CRON_SCHEDULE = '0 0 * * 0'; // Every Sunday at midnight UTC

export async function setupQuestBoardCron(app: FastifyInstance) {
  // Daily workflow - runs daily tasks including quest board updates
  const dailyEvent = async () => {
    try {
      console.log('[Daily Event] Starting daily workflow...');

      // Create runtime context and inject Supabase client
      const runtimeContext = new RuntimeContext();
      runtimeContext.set('supabase', app.supabase);

      const workflow = await mastra.getWorkflows().daily.createRunAsync();
      const result = await workflow.start({
        inputData: {
          message: 'Run daily tasks including adding quest templates to the Quest Board',
        },
        runtimeContext, // Pass runtime context with Supabase client
      });

      console.log('[Daily Event] Workflow result:', result);
    } catch (error) {
      console.error('[Daily Event] Error in daily workflow:', error);
    }
  };

  // Weekly event - run workflow to process weekly data
  const weeklyEvent = async () => {
    try {
      console.log('[Weekly Event] Starting weekly event...');

      // Create runtime context and inject Supabase client
      const runtimeContext = new RuntimeContext();
      runtimeContext.set('supabase', app.supabase);

      const workflow = await mastra.getWorkflows().weekly.createRunAsync();
      const result = await workflow.start({
        inputData: {
          message: 'Write a narrative report about the week and the effect of the users on the village and against the event',
        },
        runtimeContext, // Pass runtime context with Supabase client
      });

      console.log('[Weekly Event] Workflow result:', result);
    } catch (error) {
      console.error('[Weekly Event] Error in weekly event:', error);
    }
  };

  // Register cron job plugin with both jobs
  await app.register(fastifyCron, {
    jobs: [
      {
        cronTime: DAILY_WORKFLOW_CRON_SCHEDULE,
        onTick: dailyEvent,
        start: true, // Start immediately
      },
      {
        cronTime: WEEKLY_EVENT_CRON_SCHEDULE,
        onTick: weeklyEvent,
        start: true, // Start immediately
      },
    ],
  });

  console.log('Daily workflow cron job registered:', DAILY_WORKFLOW_CRON_SCHEDULE, '(11 AM CST / 5 PM UTC)');
  console.log('Weekly Event cron job registered:', WEEKLY_EVENT_CRON_SCHEDULE);
}

