import { FastifyInstance } from 'fastify';
import { handlers } from '../middleware/index.js';
import {
  TaskTemplateCreateSchema,
  TaskTemplateUpdateSchema,
  TaskCompletionToggleSchema,
  type TaskTemplate,
  type TaskTemplateCreate,
  type TaskTemplateUpdate,
  type TaskCompletionToggle,
} from '@todo/types';

export async function tasksRoutes(app: FastifyInstance) {
  // PATCH /tasks/:id - Update an existing task
  app.patch(
    '/tasks/:id',
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
      const updateSchema = TaskTemplateUpdateSchema.omit({ id: true });
      const parseResult = updateSchema.partial().safeParse(request.body);
      
      if (!parseResult.success) {
        return reply.status(400).send({ 
          error: 'Invalid request body',
          details: parseResult.error?.message
        });
      }

      const body = parseResult.data;

      try {
        // First, get the existing task to verify ownership and get current rrule
        const { data: existingTask, error: fetchError } = await app.supabase
          .from('Task_Template')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (fetchError || !existingTask) {
          return reply.status(404).send({ 
            error: 'Task not found or unauthorized' 
          });
        }

        // Prepare update data
        const updateData: {
          title?: string;
          category?: string;
          rrule?: string[];
          weight?: number;
        } = {};

        // Update non-rrule fields if provided
        if (body.title !== undefined) updateData.title = body.title;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.weight !== undefined) updateData.weight = body.weight;

        // For rrule: client sends the complete array with appended new rrule
        if (body.rrule !== undefined && Array.isArray(body.rrule)) {
          // Filter out any corrupted single-character entries and empty strings
          const cleanedRrule = body.rrule.filter((r: unknown) => 
            typeof r === 'string' && r.trim().length > 1
          );
          if (cleanedRrule.length > 0) {
            updateData.rrule = cleanedRrule;
            console.log('Updating rrule array:', cleanedRrule);
          }
        }

        // Print data just before updating
        console.log('\n\n\n\nUpdating task:', id);
        console.log('Existing task rrule:', existingTask.rrule, 'Type:', typeof existingTask.rrule, 'IsArray:', Array.isArray(existingTask.rrule));
        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const { data, error } = await app.supabase
          .from('Task_Template')
          .update(updateData)
          .eq('id', id)
          .eq('userId', userId)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return reply.status(500).send({ 
            error: 'Failed to update task',
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

  // POST /tasks - Create a new task
  app.post(
    '/tasks',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Validate request body with Zod schema
      const parseResult = TaskTemplateCreateSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ 
          error: 'Invalid request body',
          details: parseResult.error.errors
        });
      }

      const body = parseResult.data;

      try {
        const taskData: {
          userId: string;
          title: string;
          rrule: string[];
          weight: number;
        } = {
          userId: userId,
          title: body.title,
          rrule: body.rrule || [],
          weight: body.weight,
        };
        
        // Print data just before saving
        console.log('\n\n\n\nSaving task to Task_Template:', JSON.stringify(taskData, null, 2));
        
        const { data, error } = await app.supabase
          .from('Task_Template')
          .insert(taskData)
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          return reply.status(500).send({ 
            error: 'Failed to create task',
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

  // PATCH /tasks/:id/complete - Toggle task completion
  app.patch(
    '/tasks/:id/complete',
    {
      preHandler: handlers.verifyAPIKey,
    },
    async (request, reply) => {
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };
      const body = request.body as {
        completed: boolean;
        date?: string; // Optional ISO date string for date override
      };

      // Validate body
      if (typeof body.completed !== 'boolean') {
        return reply.status(400).send({ 
          error: 'Missing or invalid required field',
          required: ['completed'] 
        });
      }

      try {
        // First, verify the template exists and user has access
        const { data: template, error: templateError } = await app.supabase
          .from('Task_Template')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (templateError || !template) {
          return reply.status(404).send({ 
            error: 'Task template not found or unauthorized' 
          });
        }

        // Determine target date - use provided date or default to today
        // IMPORTANT: completedAt IS the date it's completing for
        let targetDateISO: string;
        let startOfTargetDate: Date;
        let endOfTargetDate: Date;
        
        if (body.date) {
          // If date is provided, use it directly (it's already at midnight UTC from client)
          targetDateISO = body.date;
          startOfTargetDate = new Date(body.date);
          // Create end of day by adding 23:59:59.999
          endOfTargetDate = new Date(startOfTargetDate);
          endOfTargetDate.setUTCHours(23, 59, 59, 999);
        } else {
          // Default to today at midnight UTC
          const now = new Date();
          startOfTargetDate = new Date(now);
          startOfTargetDate.setUTCHours(0, 0, 0, 0);
          endOfTargetDate = new Date(now);
          endOfTargetDate.setUTCHours(23, 59, 59, 999);
          targetDateISO = startOfTargetDate.toISOString();
        }
        
        console.log('Received date parameter:', body.date);
        console.log('Using completedAt date (this IS the completion date):', targetDateISO);
        console.log('Target date range for query:', startOfTargetDate.toISOString(), 'to', endOfTargetDate.toISOString());

        // Check if completion record exists for the target date
        // IMPORTANT: Check by completedAt, not createdAt, since completedAt IS the date it's completed for
        // createdAt is just when the row was created (audit trail)
        const { data: existingCompletion, error: fetchError } = await app.supabase
          .from('Task_Complete')
          .select('*')
          .eq('userId', userId)
          .eq('template', id)
          .eq('completedAt', targetDateISO) // Check if there's already a completion for this target date
          .maybeSingle();

          console.log('Existing completion:', existingCompletion);
          console.log('Fetch error:', fetchError);
          console.log('Fetch error code:', fetchError?.code);

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" which is OK
          console.error('Error fetching completion:', fetchError);
          return reply.status(500).send({ 
            error: 'Failed to check completion status',
            message: fetchError.message 
          });
        }

        let completionData;
        let shouldRunSideEffects = false;
        
        // createdAt is always TODAY (when the row is created) - let DB handle it or set to now
        const nowISO = new Date().toISOString();

        if (existingCompletion) {
          // Update existing record - set completedAt and complete based on body.completed
          if (body.completed) {
            // Complete: set completedAt to target date (the date it's being completed FOR)
            completionData = {
              completedAt: targetDateISO,
              complete: true,
            };
          } else {
            // Uncomplete: leave completedAt alone, just set complete to false
            completionData = {
              complete: false,
            };
          }

          const { data: updatedCompletion, error: updateError } = await app.supabase
            .from('Task_Complete')
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
        } else {
          // No record for target date exists - create a new row
          if (body.completed) {
            shouldRunSideEffects = true; // Only run side effects on creation
            completionData = {
              userId: userId,
              template: id,
              rewarded: true,
              completedAt: targetDateISO, // The date the task is being completed FOR
              complete: true, // Defaults to true but explicitly set
              createdAt: nowISO, // TODAY - when the row is created (audit trail)
            };

            const { data: newCompletion, error: insertError } = await app.supabase
              .from('Task_Complete')
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
          } else {
            // If trying to uncomplete a non-existent record for target date, just return success
            // No side effects needed
          }
        }

        // Run side effects only when creating (rewarded = true on creation)
        if (shouldRunSideEffects) {
          // Empty side effects function for now
          // TODO: Add reward logic here
        }

        // Return template as JSON for logging
        console.log('Task completion toggled. Template:', JSON.stringify(template, null, 2));
        
        return reply.status(200).send(template);
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

  // DELETE /tasks/:id - Soft delete a task (sets deletedAt to current date)
  app.delete(
    '/tasks/:id',
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
        // First, verify the task exists and user has access
        const { data: existingTask, error: fetchError } = await app.supabase
          .from('Task_Template')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (fetchError || !existingTask) {
          return reply.status(404).send({ 
            error: 'Task not found or unauthorized' 
          });
        }

        // Soft delete: set deletedAt to current date
        const nowISO = new Date().toISOString();
        const { data, error } = await app.supabase
          .from('Task_Template')
          .update({ deletedAt: nowISO })
          .eq('id', id)
          .eq('userId', userId)
          .select()
          .single();

        if (error) {
          console.error('Error soft deleting task:', error);
          return reply.status(500).send({ 
            error: 'Failed to delete task',
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
}

