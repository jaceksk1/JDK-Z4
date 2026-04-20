import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { and, eq } from "@acme/db";
import { stageTemplates, unitStages, units } from "@acme/db/schema";
import {
  stageGetForUnitInputSchema,
  stageToggleInputSchema,
  stageUpdateNoteInputSchema,
} from "@acme/validators";

import { protectedProcedure } from "../trpc";

type DB = typeof import("@acme/db/client").db;

/**
 * Definicje etapów per typ jednostki.
 * Kolejność = sortOrder w bazie.
 */
const STAGE_DEFINITIONS: Record<string, string[]> = {
  apartment: [
    "Filigrany",
    "Instalacja podtynkowa",
    "Instalacja podposadzkowa",
    "Montaż rozdzielnic TM i TT",
    "Montaż osprzętu",
    "Sprawdzenie działania instalacji",
  ],
  commercial: [
    "Instalacja podtynkowa",
    "Instalacja podposadzkowa",
    "Montaż rozdzielnic TM i TT",
    "Montaż osprzętu",
    "Sprawdzenie działania instalacji",
  ],
  parking: ["Zasilanie / WLZ"],
  storage: ["Instalacja"],
};

/**
 * Ensure stage_templates exist for a given unit type.
 * Idempotent — skips if already seeded.
 */
async function ensureTemplates(
  db: DB,
  unitType: string,
) {
  const existing = await db
    .select({ id: stageTemplates.id })
    .from(stageTemplates)
    .where(eq(stageTemplates.unitType, unitType))
    .limit(1);

  if (existing.length > 0) return;

  const names = STAGE_DEFINITIONS[unitType];
  if (!names?.length) return;

  await db
    .insert(stageTemplates)
    .values(
      names.map((name, i) => ({
        unitType,
        name,
        sortOrder: i + 1,
      })),
    )
    .onConflictDoNothing();
}

/**
 * Ensure unit_stages rows exist for a specific unit.
 * Creates missing rows based on templates for the unit's type.
 */
async function ensureUnitStages(
  db: DB,
  unitId: string,
  unitType: string,
) {
  await ensureTemplates(db, unitType);

  const templates = await db
    .select({ id: stageTemplates.id })
    .from(stageTemplates)
    .where(eq(stageTemplates.unitType, unitType));

  if (templates.length === 0) return;

  const existingStages = await db
    .select({ stageTemplateId: unitStages.stageTemplateId })
    .from(unitStages)
    .where(eq(unitStages.unitId, unitId));

  const existingIds = new Set(existingStages.map((s) => s.stageTemplateId));
  const missing = templates.filter((t) => !existingIds.has(t.id));

  if (missing.length > 0) {
    await db
      .insert(unitStages)
      .values(
        missing.map((t) => ({
          unitId,
          stageTemplateId: t.id,
        })),
      )
      .onConflictDoNothing();
  }
}

export const stageRouter = {
  /** Get all stages for a unit (auto-creates if missing) */
  getForUnit: protectedProcedure
    .input(stageGetForUnitInputSchema)
    .query(async ({ ctx, input }) => {
      // Get unit type
      const [unit] = await ctx.db
        .select({ id: units.id, type: units.type })
        .from(units)
        .where(eq(units.id, input.unitId))
        .limit(1);

      if (!unit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jednostka nie istnieje",
        });
      }

      // Ensure stages exist
      await ensureUnitStages(ctx.db, unit.id, unit.type);

      // Fetch stages with template info, sorted by sortOrder
      const stages = await ctx.db
        .select({
          id: unitStages.id,
          status: unitStages.status,
          completedAt: unitStages.completedAt,
          completedBy: unitStages.completedBy,
          notes: unitStages.notes,
          templateName: stageTemplates.name,
          sortOrder: stageTemplates.sortOrder,
        })
        .from(unitStages)
        .innerJoin(
          stageTemplates,
          eq(unitStages.stageTemplateId, stageTemplates.id),
        )
        .where(eq(unitStages.unitId, input.unitId))
        .orderBy(stageTemplates.sortOrder);

      return stages;
    }),

  /** Toggle stage status (pending ↔ done, or set issue) */
  toggle: protectedProcedure
    .input(stageToggleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [stage] = await ctx.db
        .select({ id: unitStages.id, unitId: unitStages.unitId })
        .from(unitStages)
        .where(eq(unitStages.id, input.unitStageId))
        .limit(1);

      if (!stage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Etap nie istnieje",
        });
      }

      const now = input.status === "done" ? new Date() : null;
      const by = input.status === "done" ? ctx.session.user.id : null;

      await ctx.db
        .update(unitStages)
        .set({
          status: input.status,
          completedAt: now,
          completedBy: by,
        })
        .where(eq(unitStages.id, input.unitStageId));

      // Auto-update unit status based on stages
      await syncUnitStatus(ctx.db, stage.unitId);

      return { success: true };
    }),

  /** Update notes on a stage */
  updateNote: protectedProcedure
    .input(stageUpdateNoteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [stage] = await ctx.db
        .select({ id: unitStages.id })
        .from(unitStages)
        .where(eq(unitStages.id, input.unitStageId))
        .limit(1);

      if (!stage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Etap nie istnieje",
        });
      }

      await ctx.db
        .update(unitStages)
        .set({ notes: input.notes })
        .where(eq(unitStages.id, input.unitStageId));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;

/**
 * Sync unit status based on its stages:
 * - any issue → issue
 * - all done → done
 * - some done → in_progress
 * - none done → not_started
 */
async function syncUnitStatus(
  db: DB,
  unitId: string,
) {
  const stages = await db
    .select({ status: unitStages.status })
    .from(unitStages)
    .where(eq(unitStages.unitId, unitId));

  if (stages.length === 0) return;

  const hasIssue = stages.some((s) => s.status === "issue");
  const allDone = stages.every((s) => s.status === "done");
  const someDone = stages.some((s) => s.status === "done");

  let unitStatus: "not_started" | "in_progress" | "done" | "issue";
  if (hasIssue) unitStatus = "issue";
  else if (allDone) unitStatus = "done";
  else if (someDone) unitStatus = "in_progress";
  else unitStatus = "not_started";

  await db
    .update(units)
    .set({ status: unitStatus })
    .where(eq(units.id, unitId));
}
