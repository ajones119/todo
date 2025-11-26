import { z } from 'zod';
/**
 * Habit Completion - Represents a habit's completion count for a specific date
 */
export const HabitCompletionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    template: z.string().uuid(), // Reference to Habit_Template.id
    positiveCount: z.number().int().min(0).default(0),
    negativeCount: z.number().int().min(0).default(0),
    createdAt: z.string().datetime(), // The date this completion is for (target date)
    updatedAt: z.string().datetime().optional(),
});
/**
 * Habit Completion input for creation
 */
export const HabitCompletionCreateSchema = HabitCompletionSchema.omit({
    id: true,
    updatedAt: true,
}).partial({
    positiveCount: true,
    negativeCount: true,
});
/**
 * Habit Completion increment/decrement input
 */
export const HabitCompletionIncrementSchema = z.object({
    type: z.enum(['positive', 'negative']),
    date: z.string().datetime().optional(), // Optional date override (ISO string)
});
