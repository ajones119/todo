import Fastify from "fastify";
import cors from "@fastify/cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { handlers } from "./middleware/index.js";
import { tasksRoutes } from "./routes/tasks.js";
import { habitsRoutes } from "./routes/habits.js";
import { goalsRoutes } from "./routes/goals.js";
import { statsRoutes } from "./routes/stats.js";
import { setupQuestBoardCron } from "./cron/index.js";
import { mastra } from "./mastra/index.js";
import { RuntimeContext } from "@mastra/core/runtime-context";

dotenv.config();

// Allow CORS from CLIENT_URL environment variable (fallback to localhost:5173)
// Strip trailing slash to match browser Origin header
const clientOrigin = process.env.CLIENT_URL?.replace(/\/$/, '');
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY || !clientOrigin) {
    throw new Error(`Supabase environment variables (SUPABASE_PROJECT_ID, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, CLIENT_URL) are required. Missing: ${JSON.stringify({ SUPABASE_PROJECT_ID: !!SUPABASE_PROJECT_ID, SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY: !!SUPABASE_SERVICE_KEY, clientOrigin })}`);
}

// Type narrowing - TypeScript now knows these are strings
const supabaseProjectId: string = SUPABASE_PROJECT_ID;
const supabaseAnonKey: string = SUPABASE_ANON_KEY;
const supabaseServiceKey: string = SUPABASE_SERVICE_KEY;

const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;

const app = Fastify({ logger: true });

const setupPlugins = async () => {
  await app.register(cors, {
    origin: clientOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        //autoRefreshToken: false,
        //persistSession: false
    }
});

    // Attach Supabase client to server instance
    app.decorate('supabase', supabaseClient);
}

const setupRoutes = async () => {
  app.get(
    "/ping",
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request) => ({
      pong: true,
      userId: request.user?.id,
    }),
  );

  // GET /stats/users - Get total user count (for dashboard)
  app.get(
    "/stats/users",
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      try {
        // Use Supabase Admin API to get user count
        // Note: This requires admin access via service key
        const { data, error } = await app.supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

        if (error) {
          console.error('Error fetching user count:', error);
          return reply.status(500).send({
            error: 'Failed to fetch user count',
            message: error.message
          });
        }

        // Get total count from the response
        // The admin API doesn't directly return count, so we'll need to make a full query
        // For now, return a placeholder - you may need to adjust based on your Supabase setup
        const { data: allUsers, error: listError } = await app.supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
          return reply.status(500).send({
            error: 'Failed to fetch user count',
            message: listError.message
          });
        }

        return reply.status(200).send({ count: allUsers?.users?.length || 0 });
      } catch (error) {
        console.error('Unexpected error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Internal server error',
          message: errorMessage
        });
      }
    }
  );

  // Register task routes
  await app.register(tasksRoutes);
  
  // Register habit routes
  await app.register(habitsRoutes);
  
  // Register goal routes
  await app.register(goalsRoutes);

  // Register stats routes
  await app.register(statsRoutes);

  // TEMPORARY: Endpoint to manually trigger weekly workflow
  app.post(
    "/dev/weekly-workflow",
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      // Check if DEV_MODE is enabled
      if (process.env.DEV_MODE !== 'TRUE' && process.env.DEV_MODE !== 'true') {
        return reply.status(500).send({
          error: 'Developer endpoints are disabled',
          message: 'This endpoint is only available when DEV_MODE=True'
        });
      }
      
      try {
        console.log('[DEV] Manual weekly workflow trigger requested');
        
        // Create runtime context and inject Supabase client
        const runtimeContext = new RuntimeContext();
        runtimeContext.set('supabase', app.supabase);

        const workflow = await mastra.getWorkflows().weekly.createRunAsync();
        const result = await workflow.start({
          inputData: {
            message: 'Write a narrative report about the week and the effect of the users on the village and against the event',
          },
          runtimeContext,
        });

        console.log('[DEV] Weekly workflow completed:', result);
        return reply.status(200).send({ 
          success: true,
          message: 'Workflow started - check server logs for results'
        });
      } catch (error) {
        console.error('[DEV] Error running weekly workflow:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Failed to run workflow',
          message: errorMessage
        });
      }
    }
  );

  // TEMPORARY: Endpoint to manually trigger daily workflow
  app.post(
    "/dev/daily-workflow",
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      // Check if DEV_MODE is enabled
      if (process.env.DEV_MODE !== 'True' && process.env.DEV_MODE !== 'true') {
        return reply.status(500).send({
          error: 'Developer endpoints are disabled',
          message: 'This endpoint is only available when DEV_MODE=True'
        });
      }
      
      try {
        console.log('[DEV] Manual daily workflow trigger requested');
        
        // Create runtime context and inject Supabase client
        const runtimeContext = new RuntimeContext();
        runtimeContext.set('supabase', app.supabase);

        const workflow = await mastra.getWorkflows().daily.createRunAsync();
        const result = await workflow.start({
          inputData: {
            message: 'Run daily tasks including adding quest templates to the Quest Board',
          },
          runtimeContext,
        });

        console.log('[DEV] Daily workflow completed:', result);
        return reply.status(200).send({ 
          success: true,
          message: 'Workflow started - check server logs for results'
        });
      } catch (error) {
        console.error('[DEV] Error running daily workflow:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Failed to run workflow',
          message: errorMessage
        });
      }
    }
  );
}

const startServer = async () => {
    console.log("================================================");
    console.log("Starting server...");
    console.log(`Server listening on port ${process.env.PORT || 3001}`);
    console.log(`CORS origin: ${clientOrigin}`);
    console.log(`Supabase project ID: ${supabaseProjectId}`);
    console.log(`Supabase service key: ${supabaseServiceKey}`);
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log("================================================");    
    await setupPlugins();
    await setupRoutes();
  
  // Setup quest board cron job
  await setupQuestBoardCron(app);
  
    // Start server - 0.0.0.0 is the default host for all interfaces including render.com
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`Server is running on http://${host}:${port}`);
}

startServer();