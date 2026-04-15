import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { and, asc, eq } from "@acme/db";
import { buildings, projects, sections, units } from "@acme/db/schema";
import {
  unitGetByIdInputSchema,
  unitListInputSchema,
  unitUpdateStatusInputSchema,
} from "@acme/validators";

import { protectedProcedure } from "../trpc";

export const unitRouter = {
  /**
   * Lista jednostek z opcjonalnym filtrowaniem.
   * Zwraca dane denormalizowane (z nazwami budynku i sekcji).
   */
  list: protectedProcedure
    .input(unitListInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: (p, { eq: eqFn }) => eqFn(p.code, input.projectCode),
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Projekt ${input.projectCode} nie istnieje`,
        });
      }

      const conditions = [eq(units.projectId, project.id)];

      if (input.sectionName) {
        const section = await ctx.db.query.sections.findFirst({
          where: (s, { eq: eqFn }) => eqFn(s.name, input.sectionName!),
        });
        if (section) {
          conditions.push(eq(units.sectionId, section.id));
        }
      } else if (input.buildingName) {
        const building = await ctx.db.query.buildings.findFirst({
          where: (b, { and: andFn, eq: eqFn }) =>
            andFn(
              eqFn(b.projectId, project.id),
              eqFn(b.name, input.buildingName!),
            ),
        });
        if (building) {
          conditions.push(eq(units.buildingId, building.id));
        }
      }

      if (input.type) conditions.push(eq(units.type, input.type));
      if (input.status) conditions.push(eq(units.status, input.status));
      if (input.floor) conditions.push(eq(units.floor, input.floor));

      const rows = await ctx.db
        .select({
          id: units.id,
          designator: units.designator,
          type: units.type,
          status: units.status,
          floor: units.floor,
          notes: units.notes,
          buildingName: buildings.name,
          sectionName: sections.name,
        })
        .from(units)
        .leftJoin(buildings, eq(units.buildingId, buildings.id))
        .leftJoin(sections, eq(units.sectionId, sections.id))
        .where(and(...conditions))
        .orderBy(asc(units.designator));

      return rows;
    }),

  /**
   * Szczegóły jednej jednostki po ID.
   */
  getById: protectedProcedure
    .input(unitGetByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: units.id,
          designator: units.designator,
          type: units.type,
          status: units.status,
          floor: units.floor,
          notes: units.notes,
          createdAt: units.createdAt,
          updatedAt: units.updatedAt,
          buildingName: buildings.name,
          sectionName: sections.name,
          projectId: units.projectId,
        })
        .from(units)
        .leftJoin(buildings, eq(units.buildingId, buildings.id))
        .leftJoin(sections, eq(units.sectionId, sections.id))
        .where(eq(units.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Jednostka ${input.id} nie istnieje`,
        });
      }
      return row;
    }),

  /**
   * Zmiana statusu jednostki.
   * Dostępna dla każdego zalogowanego użytkownika — ograniczenia ról wejdą w kroku 9 (auth).
   */
  updateStatus: protectedProcedure
    .input(unitUpdateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.units.findFirst({
        where: (u, { eq: eqFn }) => eqFn(u.id, input.id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Jednostka ${input.id} nie istnieje`,
        });
      }

      const [updated] = await ctx.db
        .update(units)
        .set({ status: input.status })
        .where(eq(units.id, input.id))
        .returning({ id: units.id, status: units.status });

      return updated;
    }),
} satisfies TRPCRouterRecord;
