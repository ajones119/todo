import { z } from 'zod';

/**
 * Task Template - Represents a task template that can be completed on specific dates
 */
export const TaskTemplateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  category: z.string().optional(),
  rrule: z.array(z.string()).default([]), // Array of RRule strings
  weight: z.number().int().min(1).max(5).default(3),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

/**
 * Task Template input for creation (without id, timestamps, or deletedAt)
 */
export const TaskTemplateCreateSchema = TaskTemplateSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

/**
 * Task Template input for updates (all fields optional except id)
 */
export const TaskTemplateUpdateSchema = TaskTemplateSchema.partial().required({
  id: true,
});

/**
 * TypeScript types derived from Zod schemas
 */
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;
export type TaskTemplateCreate = z.infer<typeof TaskTemplateCreateSchema>;
export type TaskTemplateUpdate = z.infer<typeof TaskTemplateUpdateSchema>;

