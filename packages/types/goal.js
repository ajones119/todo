import { z } from 'zod';
/**
 * Goal - Represents a goal that can be completed
 */
export const GoalSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string().min(1),
    category: z.string().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    rewarded: z.boolean().default(false),
    weight: z.number().int().min(1).max(5).default(3),
    completedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    deletedAt: z.string().datetime().nullable().optional(),
    fromTemplate: z.boolean().default(false),
});
/**
 * Goal input for creation (without id, timestamps, or deletedAt)
 */
export const GoalCreateSchema = GoalSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
}).partial({
    rewarded: true,
    weight: true,
    completedAt: true,
    fromTemplate: true,
});
/**
 * Goal input for updates (all fields optional except id)
 */
export const GoalUpdateSchema = GoalSchema.partial().required({
    id: true,
});
/**
 * Goal completion toggle input
 */
export const GoalCompletionToggleSchema = z.object({
    completed: z.boolean(),
});
