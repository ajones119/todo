import { FastifyInstance } from 'fastify';
import { handlers } from '../middleware/index.js';
import {
  GoalCreateSchema,
  GoalUpdateSchema,
  GoalCompletionToggleSchema,
  type Goal,
  type GoalCreate,
  type GoalUpdate,
  type GoalCompletionToggle,
} from '@todo/types';

export async function goalsRoutes(app: FastifyInstance) {
  // GET /quest-board - Get available quest board templates from last 24 hours
  app.get(
    '/quest-board',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      try {
        // Calculate 24 hours ago
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        const twentyFourHoursAgoISO = twentyFourHoursAgo.toISOString();

        const { data, error } = await app.supabase
          .from('Quest_Board_Templates')
          .select('*')
          .gte('createdAt', twentyFourHoursAgoISO)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching quest board templates:', error);
          return reply.status(500).send({
            error: 'Failed to fetch quest board templates',
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

  // GET /goals - Get all goals for the user
  app.get(
    '/goals',
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
          .from('Goal')
          .select('*')
          .eq('userId', userId)
          .is('deletedAt', null)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching goals:', error);
          return reply.status(500).send({
            error: 'Failed to fetch goals',
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

  // POST /goals - Create a new goal
  app.post(
    '/goals',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Validate request body with Zod schema
      const parseResult = GoalCreateSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.errors
        });
      }

      const body = parseResult.data;
      const questBoardTemplateId = (request.body as { questBoardTemplateId?: string })?.questBoardTemplateId;

      try {
        // If this is from a quest board template, fetch the template first
        let templateData: { name?: string; category?: string; weight?: number; daysToComplete?: number } | null = null;
        if (questBoardTemplateId) {
          const { data: template, error: templateError } = await app.supabase
            .from('Quest_Board_Templates')
            .select('name, category, weight, daysToComplete')
            .eq('id', questBoardTemplateId)
            .single();

          if (templateError) {
            return reply.status(404).send({
              error: 'Quest board template not found',
              message: templateError.message
            });
          }

          templateData = template;
        }

        // Calculate due date from daysToComplete if from template
        let calculatedDueDate: string | null = null;
        if (questBoardTemplateId && templateData?.daysToComplete) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + templateData.daysToComplete);
          calculatedDueDate = dueDate.toISOString();
        }

        const goalData: {
          userId: string;
          name: string;
          category?: string;
          dueDate?: string | null;
          rewarded?: boolean;
          weight: number;
          completedAt?: string | null;
          fromTemplate?: boolean;
        } = {
          userId: userId,
          name: body.name || templateData?.name || '',
          category: body.category || templateData?.category,
          dueDate: body.dueDate || calculatedDueDate || null,
          rewarded: body.rewarded || false,
          weight: body.weight || templateData?.weight || 3,
          completedAt: body.completedAt || null,
          fromTemplate: questBoardTemplateId ? true : false,
        };

        const { data, error } = await app.supabase
          .from('Goal')
          .insert(goalData)
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          return reply.status(500).send({
            error: 'Failed to create goal',
            message: error.message
          });
        }

        // If this was from a quest board template, delete the template row
        if (questBoardTemplateId) {
          const { error: deleteError } = await app.supabase
            .from('Quest_Board_Templates')
            .delete()
            .eq('id', questBoardTemplateId);

          if (deleteError) {
            console.error('Error deleting quest board template:', deleteError);
            // Don't fail the request if deletion fails, just log it
          }
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

  // PATCH /goals/:id - Update an existing goal
  app.patch(
    '/goals/:id',
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
      const updateSchema = GoalUpdateSchema.omit({ id: true });
      const parseResult = updateSchema.partial().safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.errors
        });
      }

      const body = parseResult.data;

      try {
        // First, verify ownership
        const { data: existingGoal, error: fetchError } = await app.supabase
          .from('Goal')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (fetchError || !existingGoal) {
          return reply.status(404).send({
            error: 'Goal not found or unauthorized'
          });
        }

        const updateData: {
          name?: string;
          category?: string;
          dueDate?: string | null;
          rewarded?: boolean;
          weight?: number;
          completedAt?: string | null;
        } = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
        if (body.rewarded !== undefined) updateData.rewarded = body.rewarded;
        if (body.weight !== undefined) updateData.weight = body.weight;
        if (body.completedAt !== undefined) updateData.completedAt = body.completedAt;

        const { data, error } = await app.supabase
          .from('Goal')
          .update(updateData)
          .eq('id', id)
          .eq('userId', userId)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return reply.status(500).send({
            error: 'Failed to update goal',
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

  // DELETE /goals/:id - Soft delete a goal
  app.delete(
    '/goals/:id',
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
        const { data: existingGoal, error: fetchError } = await app.supabase
          .from('Goal')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (fetchError || !existingGoal) {
          return reply.status(404).send({
            error: 'Goal not found or unauthorized'
          });
        }

        // Soft delete by setting deletedAt
        const { data, error } = await app.supabase
          .from('Goal')
          .update({ deletedAt: new Date().toISOString() })
          .eq('id', id)
          .eq('userId', userId)
          .select()
          .single();

        if (error) {
          console.error('Supabase delete error:', error);
          return reply.status(500).send({
            error: 'Failed to delete goal',
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

  // PATCH /goals/:id/complete - Toggle goal completion
  app.patch(
    '/goals/:id/complete',
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
      const parseResult = GoalCompletionToggleSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.errors
        });
      }

      const body = parseResult.data;

      try {
        // Verify template exists and user has access
        const { data: goal, error: goalError } = await app.supabase
          .from('Goal')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (goalError || !goal) {
          return reply.status(404).send({
            error: 'Goal not found or unauthorized'
          });
        }

        // Update completion status
        const updateData = {
          completedAt: body.completed ? new Date().toISOString() : null,
        };

        const { data: updatedGoal, error: updateError } = await app.supabase
          .from('Goal')
          .update(updateData)
          .eq('id', id)
          .eq('userId', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating goal:', updateError);
          return reply.status(500).send({
            error: 'Failed to update goal',
            message: updateError.message
          });
        }

        return reply.status(200).send(updatedGoal);
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

