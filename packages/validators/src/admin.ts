import { z } from "zod/v4";

export const userRoleSchema = z.enum(["admin", "manager", "worker"]);

export const createUserInputSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: userRoleSchema,
  password: z.string().min(4).max(100),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
