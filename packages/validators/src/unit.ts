import { z } from "zod/v4";

export const unitStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "to_check",
  "done",
  "issue",
]);

export const unitTypeSchema = z.enum([
  "apartment",
  "commercial",
  "parking",
  "storage",
]);

/** Grupowanie statystyk: building | section | floor */
export const statsLevelSchema = z.enum(["building", "section", "floor"]);

export const unitStatsInputSchema = z.object({
  projectCode: z.string().min(1).max(10).default("Z4"),
  level: statsLevelSchema,
  /** Wymagany gdy level = section lub floor */
  buildingName: z.string().min(1).max(4).optional(),
  /** Wymagany gdy level = floor */
  sectionName: z.string().min(1).max(4).optional(),
});

export const unitListInputSchema = z.object({
  projectCode: z.string().min(1).max(10).default("Z4"),
  /** Budynek: "A" | "B" */
  buildingName: z.string().min(1).max(4).optional(),
  /** Sekcja: "A1" | "A2" | "B1" | "B2" */
  sectionName: z.string().min(1).max(4).optional(),
  type: unitTypeSchema.optional(),
  status: unitStatusSchema.optional(),
  /** ID kondygnacji z tabeli floors */
  floorId: z.string().uuid().optional(),
  /** Czy uwzględniać jednostki bez budynku (MP, KL) */
  includeGarage: z.boolean().default(false),
});

export const unitGetByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const unitUpdateStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: unitStatusSchema,
});

export type UnitStatus = z.infer<typeof unitStatusSchema>;
export type UnitType = z.infer<typeof unitTypeSchema>;
export type UnitListInput = z.infer<typeof unitListInputSchema>;
export type UnitUpdateStatusInput = z.infer<typeof unitUpdateStatusInputSchema>;
export type StatsLevel = z.infer<typeof statsLevelSchema>;
