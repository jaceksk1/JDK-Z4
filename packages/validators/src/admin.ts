import { z } from "zod/v4";

export const userRoleSchema = z.enum(["admin", "manager", "worker"]);

export const createUserInputSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: userRoleSchema,
  company: z.string().max(100).optional(),
  password: z.string().min(4).max(100),
});

export const updateUserInputSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).max(100),
  role: userRoleSchema,
  company: z.string().max(100).optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
