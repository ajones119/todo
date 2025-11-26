import { FastifyInstance } from 'fastify';
import { handlers } from '../middleware/index.js';
import {
  HabitTemplateCreateSchema,
  HabitTemplateUpdateSchema,
  HabitCompletionIncrementSchema,
  type HabitTemplate,
  type HabitTemplateCreate,
  type HabitTemplateUpdate,
  type HabitCompletionIncrement,
} from '@todo/types';

export async function habitsRoutes(app: FastifyInstance) {
  // GET /habits - Get all habit templates for the user
  app.get(
    '/habits',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        const { data, error } = await app.supabase
          .from('Habit_Template')
          .select('*')
          .eq('userId', userId)
          .is('deletedAt', null)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching habits:', error);
          return reply.status(500).send({
            error: 'Failed to fetch habits',
            message: error.message
          });
        }

        return reply.status(200).send(data || []);
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

  // POST /habits - Create a new habit
  app.post(
    '/habits',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Validate request body with Zod schema
      const parseResult = HabitTemplateCreateSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.issues
        });
      }

      const body = parseResult.data;

      try {
        const habitData: {
          userId: string;
          name: string;
          category?: string;
          weight: number;
        } = {
          userId: userId,
          name: body.name,
          category: body.category,
          weight: body.weight,
        };

        const { data, error } = await app.supabase
          .from('Habit_Template')
          .insert(habitData)
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          return reply.status(500).send({
            error: 'Failed to create habit',
            message: error.message
          });
        }

        return reply.status(201).send(data);
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

  // PATCH /habits/:id - Update an existing habit
  app.patch(
    '/habits/:id',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      // Validate request body (partial update, id comes from params)
      const updateSchema = HabitTemplateUpdateSchema.omit({ id: true });
      const parseResult = updateSchema.partial().safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.issues
        });
      }

      const body = parseResult.data;

      try {
        // First, verify ownership
        const { data: existingHabit, error: fetchError } = await app.supabase
          .from('Habit_Template')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (fetchError || !existingHabit) {
          return reply.status(404).send({
            error: 'Habit not found or unauthorized'
          });
        }

        const updateData: {
          name?: string;
          category?: string;
          weight?: number;
        } = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.weight !== undefined) updateData.weight = body.weight;

        const { data, error } = await app.supabase
          .from('Habit_Template')
          .update(updateData)
          .eq('id', id)
          .eq('userId', userId)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return reply.status(500).send({
            error: 'Failed to update habit',
            message: error.message
          });
        }

        return reply.status(200).send(data);
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

  // DELETE /habits/:id - Soft delete a habit
  app.delete(
    '/habits/:id',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      try {
        // Verify ownership
        const { data: existingHabit, error: fetchError } = await app.supabase
          .from('Habit_Template')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (fetchError || !existingHabit) {
          return reply.status(404).send({
            error: 'Habit not found or unauthorized'
          });
        }

        // Soft delete by setting deletedAt
        const { data, error } = await app.supabase
          .from('Habit_Template')
          .update({ deletedAt: new Date().toISOString() })
          .eq('id', id)
          .eq('userId', userId)
          .select()
          .single();

        if (error) {
          console.error('Supabase delete error:', error);
          return reply.status(500).send({
            error: 'Failed to delete habit',
            message: error.message
          });
        }

        return reply.status(200).send(data);
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

  // PATCH /habits/:id/increment - Increment or decrement habit count for today
  app.patch(
    '/habits/:id/increment',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      // Validate request body
      const parseResult = HabitCompletionIncrementSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.issues
        });
      }

      const body = parseResult.data;

      try {
        // Verify template exists and user has access
        const { data: template, error: templateError } = await app.supabase
          .from('Habit_Template')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (templateError || !template) {
          return reply.status(404).send({
            error: 'Habit template not found or unauthorized'
          });
        }

        // Determine target date - use provided date or default to today
        let targetDateISO: string;
        let startOfTargetDate: Date;
        let endOfTargetDate: Date;

        if (body.date) {
          targetDateISO = body.date;
          const parsedDate = new Date(body.date);
          startOfTargetDate = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate(), 0, 0, 0, 0));
          endOfTargetDate = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate(), 23, 59, 59, 999));
        } else {
          // Default to today at midnight UTC
          const now = new Date();
          startOfTargetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
          endOfTargetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
          targetDateISO = startOfTargetDate.toISOString();
        }

        // Check if completion record exists for the target date
        const { data: existingCompletion, error: fetchError } = await app.supabase
          .from('Habit_Complete')
          .select('*')
          .eq('userId', userId)
          .eq('template', id)
          .gte('createdAt', startOfTargetDate.toISOString())
          .lte('createdAt', endOfTargetDate.toISOString())
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching completion:', fetchError);
          return reply.status(500).send({
            error: 'Failed to check completion status',
            message: fetchError.message
          });
        }

        let completionData;

        if (existingCompletion) {
          // Update existing record
          const currentPositive = existingCompletion.positiveCount || 0;
          const currentNegative = existingCompletion.negativeCount || 0;

          if (body.type === 'positive') {
            completionData = {
              positiveCount: Math.max(0, currentPositive + 1),
              negativeCount: currentNegative,
            };
          } else {
            completionData = {
              positiveCount: currentPositive,
              negativeCount: Math.max(0, currentNegative + 1),
            };
          }

          const { data: updatedCompletion, error: updateError } = await app.supabase
            .from('Habit_Complete')
            .update(completionData)
            .eq('id', existingCompletion.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating completion:', updateError);
            return reply.status(500).send({
              error: 'Failed to update completion',
              message: updateError.message
            });
          }

          return reply.status(200).send(updatedCompletion);
        } else {
          // Create new record for today
          const initialPositive = body.type === 'positive' ? 1 : 0;
          const initialNegative = body.type === 'negative' ? 1 : 0;

          completionData = {
            userId: userId,
            template: id,
            positiveCount: initialPositive,
            negativeCount: initialNegative,
            createdAt: targetDateISO,
          };

          const { data: newCompletion, error: insertError } = await app.supabase
            .from('Habit_Complete')
            .insert(completionData)
            .select()
            .single();

          if (insertError) {
            console.error('Error creating completion:', insertError);
            return reply.status(500).send({
              error: 'Failed to create completion',
              message: insertError.message
            });
          }

          return reply.status(201).send(newCompletion);
        }
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
}

