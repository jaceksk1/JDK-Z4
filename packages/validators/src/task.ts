import { z } from "zod/v4";

export const taskStatusSchema = z.enum(["open", "submitted", "done"]);

export const taskCreateInputSchema = z.object({
  projectCode: z.string().min(1).max(10).default("Z4"),
  unitId: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  assignedToId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const taskUpdateStatusInputSchema = z.object({
  taskId: z.string().uuid(),
  status: taskStatusSchema,
});

export const taskUpdateInputSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  unitId: z.string().uuid().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const taskGetByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const taskListInputSchema = z.object({
  projectCode: z.string().min(1).max(10).default("Z4"),
  unitId: z.string().uuid().optional(),
  status: taskStatusSchema.optional(),
  assignedToId: z.string().optional(),
  createdById: z.string().optional(),
  search: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export const taskSubmitInputSchema = z.object({
  taskId: z.string().uuid(),
  completionNote: z.string().min(2).max(2000),
  completionPhotoPath: z.string().max(500).optional(),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateInputSchema>;
export type TaskListInput = z.infer<typeof taskListInputSchema>;
