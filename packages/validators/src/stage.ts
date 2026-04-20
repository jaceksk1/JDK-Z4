import { z } from "zod/v4";

export const stageStatusSchema = z.enum(["pending", "done", "issue"]);

export const stageGetForUnitInputSchema = z.object({
  unitId: z.string().uuid(),
});

export const stageToggleInputSchema = z.object({
  unitStageId: z.string().uuid(),
  status: stageStatusSchema,
});

export const stageUpdateNoteInputSchema = z.object({
  unitStageId: z.string().uuid(),
  notes: z.string().max(500).nullable(),
});

export type StageStatus = z.infer<typeof stageStatusSchema>;
