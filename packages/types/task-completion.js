import { z } from 'zod';
/**
 * Task Completion - Represents a completed task for a specific date
 */
export const TaskCompletionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    template: z.string().uuid(), // Reference to Task_Template.id
    completedAt: z.string().datetime(), // The date the task was completed FOR (target date)
    complete: z.boolean().default(true), // Whether the task is currently complete
    rewarded: z.boolean().default(false),
    createdAt: z.string().datetime(), // When the row was created (audit trail)
    updatedAt: z.string().datetime().optional(),
});
/**
 * Task Completion input for creation
 */
export const TaskCompletionCreateSchema = TaskCompletionSchema.omit({
    id: true,
    updatedAt: true,
}).partial({
    rewarded: true,
    complete: true,
});
/**
 * Task Completion input for updates
 */
export const TaskCompletionUpdateSchema = TaskCompletionSchema.partial().required({
    id: true,
});
/**
 * Task Completion toggle input (for PATCH /tasks/:id/complete)
 */
export const TaskCompletionToggleSchema = z.object({
    completed: z.boolean(),
    date: z.string().datetime().optional(), // Optional date override (ISO string)
});
