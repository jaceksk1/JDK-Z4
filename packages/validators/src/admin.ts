import { z } from "zod/v4";

export const userRoleSchema = z.enum(["admin", "manager", "worker"]);

export const createUserInputSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: userRoleSchema,
  company: z.string().max(100).optional(),
  password: z.string().min(4).max(100),
  groupIds: z.array(z.string().uuid()).min(1, "Wybierz przynajmniej jedną grupę"),
});

export const updateUserInputSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).max(100),
  role: userRoleSchema,
  company: z.string().max(100).optional(),
  groupIds: z.array(z.string().uuid()).min(1, "Wybierz przynajmniej jedną grupę"),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const groupCreateInputSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  moduleKeys: z.array(z.string()).default([]),
});

export const groupUpdateInputSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  moduleKeys: z.array(z.string()),
});

export type GroupCreateInput = z.infer<typeof groupCreateInputSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateInputSchema>;
