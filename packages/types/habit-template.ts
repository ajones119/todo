import { z } from 'zod';

/**
 * Habit Template - Represents a habit template that can be tracked daily
 */
export const HabitTemplateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().optional(),
  weight: z.number().int().min(1).max(5).default(3),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

/**
 * Habit Template input for creation (without id, timestamps, or deletedAt)
 */
export const HabitTemplateCreateSchema = HabitTemplateSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

/**
 * Habit Template input for updates (all fields optional except id)
 */
export const HabitTemplateUpdateSchema = HabitTemplateSchema.partial().required({
  id: true,
});

/**
 * TypeScript types derived from Zod schemas
 */
export type HabitTemplate = z.infer<typeof HabitTemplateSchema>;
export type HabitTemplateCreate = z.infer<typeof HabitTemplateCreateSchema>;
export type HabitTemplateUpdate = z.infer<typeof HabitTemplateUpdateSchema>;

