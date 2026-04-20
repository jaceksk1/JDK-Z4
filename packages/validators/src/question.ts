import { z } from "zod/v4";

export const questionStatusSchema = z.enum(["open", "answered", "resolved"]);

export const questionCreateInputSchema = z.object({
  projectCode: z.string().min(1).max(10).default("Z4"),
  unitId: z.string().uuid().optional(),
  content: z.string().min(3).max(2000),
});

export const questionAnswerInputSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().min(1).max(5000),
});

export const questionResolveInputSchema = z.object({
  questionId: z.string().uuid(),
});

export const questionGetByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const questionListInputSchema = z.object({
  projectCode: z.string().min(1).max(10).default("Z4"),
  unitId: z.string().uuid().optional(),
  status: questionStatusSchema.optional(),
  askedById: z.string().optional(),
  search: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export type QuestionStatus = z.infer<typeof questionStatusSchema>;
export type QuestionCreateInput = z.infer<typeof questionCreateInputSchema>;
export type QuestionListInput = z.infer<typeof questionListInputSchema>;
