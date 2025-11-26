import { FastifyInstance } from 'fastify';
import { handlers } from '../middleware/index.js';

export async function statsRoutes(app: FastifyInstance) {
  // GET /stats/weekly - Get accumulated stats for the current week
  app.get(
    '/stats/weekly',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        // Calculate start of week (Sunday midnight UTC)
        const now = new Date();
        const dayOfWeek = now.getUTCDay(); // 0 (Sun) to 6 (Sat)
        
        const weekStart = new Date(now);
        weekStart.setUTCDate(now.getUTCDate() - dayOfWeek);
        weekStart.setUTCHours(0, 0, 0, 0);
        const weekStartISO = weekStart.toISOString();

        console.log('Fetching stats from:', weekStartISO);

        // Parallel data fetching
        const [
            { data: completedTasks, error: tasksError },
            { data: taskTemplates, error: taskTemplatesError },
            { data: habitCompletions, error: habitsError },
            { data: habitTemplates, error: habitTemplatesError },
            { data: completedGoals, error: goalsError }
        ] = await Promise.all([
            // 1. Task Completions in range
            app.supabase
                .from('Task_Complete')
                .select('*')
                .eq('userId', userId)
                .eq('complete', true)
                .gte('completedAt', weekStartISO),
            
            // 2. Task Templates (to get weights/categories)
            app.supabase
                .from('Task_Template')
                .select('id, weight, category')
                .eq('userId', userId),

            // 3. Habit Completions in range
            app.supabase
                .from('Habit_Complete')
                .select('*')
                .eq('userId', userId)
                .gte('createdAt', weekStartISO),

            // 4. Habit Templates
            app.supabase
                .from('Habit_Template')
                .select('id, weight, category')
                .eq('userId', userId),

            // 5. Goals (Quests) completed in range
            app.supabase
                .from('Goal')
                .select('id, weight, category, completedAt, fromTemplate')
                .eq('userId', userId)
                .gte('completedAt', weekStartISO)
        ]);

        if (tasksError) throw tasksError;
        if (taskTemplatesError) throw taskTemplatesError;
        if (habitsError) throw habitsError;
        if (habitTemplatesError) throw habitTemplatesError;
        if (goalsError) throw goalsError;

        // Process Data
        const stats: Record<string, number> = {};

        // Helpers to add points
        const addPoints = (category: string | undefined, points: number) => {
            // If no category, put in 'other' or skip?
            // Using empty string as key if undefined, or 'other'
            const cat = category || 'other'; 
            const key = cat.toLowerCase().trim();
            stats[key] = (stats[key] || 0) + points;
        };

        // 1. Tasks: Weight * 2
        const taskTemplateMap = new Map(taskTemplates?.map(t => [t.id, t]) || []);
        completedTasks?.forEach(task => {
            const template = taskTemplateMap.get(task.template);
            if (template) {
                // Default weight 1 if not set
                const weight = template.weight !== undefined ? template.weight : 1;
                const points = weight * 2;
                addPoints(template.category, points);
            }
        });

        // 2. Habits: Weight * 1 * Count (positive)
        const habitTemplateMap = new Map(habitTemplates?.map(h => [h.id, h]) || []);
        habitCompletions?.forEach(habit => {
            const template = habitTemplateMap.get(habit.template);
            if (template) {
                const count = habit.positiveCount || 0;
                if (count > 0) {
                    const weight = template.weight !== undefined ? template.weight : 1;
                    const points = weight * count * 1;
                    addPoints(template.category, points);
                }
            }
        });

        // 3. Quests (Goals): Weight * 3 (or * 3.9 if fromTemplate)
        completedGoals?.forEach(goal => {
            const weight = goal.weight !== undefined ? goal.weight : 1;
            // Template goals get 30% bonus (3 * 1.3 = 3.9)
            const multiplier = goal.fromTemplate ? 4 : 3;
            const points = weight * multiplier;
            addPoints(goal.category, points);
        });

        return reply.status(200).send(stats);

      } catch (error) {
        console.error('Error calculating stats:', error);
        return reply.status(500).send({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // GET /stats/user - Get or create user character data
  app.get(
    '/stats/user',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        // Check if character exists
        const { data: existingCharacter, error: fetchError } = await app.supabase
          .from('To_do_Character')
          .select('*')
          .eq('userId', userId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // If character doesn't exist, create one with default level 1
        if (!existingCharacter) {
          const { data: newCharacter, error: insertError } = await app.supabase
            .from('To_do_Character')
            .insert({
              userId: userId,
              level: 1,
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          return reply.status(200).send(newCharacter);
        }

        return reply.status(200).send(existingCharacter);
      } catch (error) {
        console.error('Error fetching/creating user character:', error);
        return reply.status(500).send({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // PATCH /stats/user - Update user character (name only for now)
  app.patch(
    '/stats/user',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Validate request body - only allow name for now
      const body = request.body as { name?: string };
      
      if (body.name === undefined) {
        return reply.status(400).send({
          error: 'Invalid request body',
          message: 'Name is required'
        });
      }

      // Validate name is a string and not empty
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return reply.status(400).send({
          error: 'Invalid request body',
          message: 'Name must be a non-empty string'
        });
      }

      try {
        // First, verify character exists and belongs to user
        const { data: existingCharacter, error: fetchError } = await app.supabase
          .from('To_do_Character')
          .select('*')
          .eq('userId', userId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // If character doesn't exist, create one
        if (!existingCharacter) {
          const { data: newCharacter, error: insertError } = await app.supabase
            .from('To_do_Character')
            .insert({
              userId: userId,
              level: 1,
              name: body.name.trim(),
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          return reply.status(200).send(newCharacter);
        }

        // Update existing character - only name for now
        const { data: updatedCharacter, error: updateError } = await app.supabase
          .from('To_do_Character')
          .update({
            name: body.name.trim(),
          })
          .eq('userId', userId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return reply.status(200).send(updatedCharacter);
      } catch (error) {
        console.error('Error updating user character:', error);
        return reply.status(500).send({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}

