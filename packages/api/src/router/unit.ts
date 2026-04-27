import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { and, asc, eq, isNull, sql } from "@acme/db";
import { buildings, floors, projects, sections, units } from "@acme/db/schema";
import {
  unitGetByIdInputSchema,
  unitListInputSchema,
  unitStatsInputSchema,
  unitUpdateCardNumberInputSchema,
  unitUpdateStatusInputSchema,
} from "@acme/validators";

import { protectedProcedure } from "../trpc";

/** Tylko kierownik lub admin */
const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.session.user.role;
  if (role !== "manager" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tylko kierownik może wykonać tę operację",
    });
  }
  return next({ ctx });
});

type Ctx = { db: typeof import("@acme/db/client").db };

async function getProject(ctx: Ctx, code: string) {
  const project = await ctx.db.query.projects.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.code, code),
  });
  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Projekt ${code} nie istnieje`,
    });
  }
  return project;
}

export const unitRouter = {
  /**
   * Statystyki agregowane — do widoków przeglądowych drill-down.
   *
   * level="building" → grupowanie po budynkach (+ garaż gdy MP/KL bez buildingId)
   * level="section"  → grupowanie po sekcjach w danym budynku
   * level="floor"    → grupowanie po piętrach w danej sekcji
   */
  stats: protectedProcedure
    .input(unitStatsInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await getProject(ctx, input.projectCode);

      if (input.level === "building") {
        // Budynki A, B + wirtualny "garage" dla jednostek bez budynku
        const rows = await ctx.db
          .select({
            buildingName: buildings.name,
            type: units.type,
            status: units.status,
            count: sql<number>`count(*)::int`,
          })
          .from(units)
          .leftJoin(buildings, eq(units.buildingId, buildings.id))
          .where(eq(units.projectId, project.id))
          .groupBy(buildings.name, units.type, units.status);

        return aggregateByGroup(rows, (r) => r.buildingName ?? "Garaż");
      }

      if (input.level === "section") {
        if (!input.buildingName) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "buildingName wymagany dla level=section",
          });
        }

        const rows = await ctx.db
          .select({
            sectionName: sections.name,
            type: units.type,
            status: units.status,
            count: sql<number>`count(*)::int`,
          })
          .from(units)
          .innerJoin(buildings, eq(units.buildingId, buildings.id))
          .leftJoin(sections, eq(units.sectionId, sections.id))
          .where(
            and(
              eq(units.projectId, project.id),
              eq(buildings.name, input.buildingName),
            ),
          )
          .groupBy(sections.name, units.type, units.status);

        return aggregateByGroup(rows, (r) => r.sectionName ?? "—");
      }

      // level === "floor"
      if (!input.sectionName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "sectionName wymagany dla level=floor",
        });
      }

      const rows = await ctx.db
        .select({
          floorId: floors.id,
          floorLabel: floors.label,
          floorSortOrder: floors.sortOrder,
          type: units.type,
          status: units.status,
          count: sql<number>`count(*)::int`,
        })
        .from(units)
        .innerJoin(sections, eq(units.sectionId, sections.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .where(
          and(
            eq(units.projectId, project.id),
            eq(sections.name, input.sectionName),
          ),
        )
        .groupBy(
          floors.id,
          floors.label,
          floors.sortOrder,
          units.type,
          units.status,
        );

      return aggregateByFloor(rows);
    }),

  /** Statystyki garażu — MP i KL osobno */
  garageStats: protectedProcedure
    .input(unitStatsInputSchema.pick({ projectCode: true }))
    .query(async ({ ctx, input }) => {
      const project = await getProject(ctx, input.projectCode);

      const rows = await ctx.db
        .select({
          type: units.type,
          status: units.status,
          count: sql<number>`count(*)::int`,
        })
        .from(units)
        .where(
          and(
            eq(units.projectId, project.id),
            isNull(units.buildingId),
          ),
        )
        .groupBy(units.type, units.status);

      return aggregateByGroup(rows, (r) => r.type);
    }),

  /**
   * Lista jednostek z filtrowaniem.
   */
  list: protectedProcedure
    .input(unitListInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await getProject(ctx, input.projectCode);

      const conditions = [eq(units.projectId, project.id)];

      if (input.sectionName) {
        const section = await ctx.db.query.sections.findFirst({
          where: (s, { eq: eqFn }) => eqFn(s.name, input.sectionName!),
        });
        if (section) conditions.push(eq(units.sectionId, section.id));
      } else if (input.buildingName) {
        const building = await ctx.db.query.buildings.findFirst({
          where: (b, { and: andFn, eq: eqFn }) =>
            andFn(
              eqFn(b.projectId, project.id),
              eqFn(b.name, input.buildingName!),
            ),
        });
        if (building) conditions.push(eq(units.buildingId, building.id));
      } else if (input.includeGarage) {
        conditions.push(isNull(units.buildingId));
      }

      if (input.type) conditions.push(eq(units.type, input.type));
      if (input.status) conditions.push(eq(units.status, input.status));
      if (input.floorId) conditions.push(eq(units.floorId, input.floorId));

      const rows = await ctx.db
        .select({
          id: units.id,
          designator: units.designator,
          type: units.type,
          status: units.status,
          floorId: units.floorId,
          floorLabel: floors.label,
          floorStorey: floors.storey,
          notes: units.notes,
          cardNumber: units.cardNumber,
          buildingName: buildings.name,
          sectionName: sections.name,
        })
        .from(units)
        .leftJoin(buildings, eq(units.buildingId, buildings.id))
        .leftJoin(sections, eq(units.sectionId, sections.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .where(and(...conditions))
        .orderBy(asc(units.designator));

      return rows
        .map((r) => ({
          ...r,
          displayDesignator: displayDesignator(r.designator, r.floorStorey),
        }))
        .sort((a, b) => naturalSort(a.displayDesignator, b.displayDesignator));
    }),

  getById: protectedProcedure
    .input(unitGetByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: units.id,
          designator: units.designator,
          type: units.type,
          status: units.status,
          floorId: units.floorId,
          floorLabel: floors.label,
          floorStorey: floors.storey,
          notes: units.notes,
          cardNumber: units.cardNumber,
          createdAt: units.createdAt,
          updatedAt: units.updatedAt,
          buildingName: buildings.name,
          sectionName: sections.name,
          projectId: units.projectId,
        })
        .from(units)
        .leftJoin(buildings, eq(units.buildingId, buildings.id))
        .leftJoin(sections, eq(units.sectionId, sections.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .where(eq(units.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Jednostka ${input.id} nie istnieje`,
        });
      }
      return {
        ...row,
        displayDesignator: displayDesignator(row.designator, row.floorStorey),
      };
    }),

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

  /** Ustaw/wyczyść numer karty instalacyjnej — manager/admin, tylko apartment */
  updateCardNumber: managerProcedure
    .input(unitUpdateCardNumberInputSchema)
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
      if (existing.type !== "apartment") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Numer karty dotyczy tylko mieszkań",
        });
      }

      const [updated] = await ctx.db
        .update(units)
        .set({ cardNumber: input.cardNumber })
        .where(eq(units.id, input.id))
        .returning({ id: units.id, cardNumber: units.cardNumber });

      return updated;
    }),
} satisfies TRPCRouterRecord;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Zamienia kondygnację projektową na numer piętra w designatorze.
 * "A1.2.5" + storey=1 → "A1.1.5"
 * Nie zmienia LU (A1.U.1), MP, KL.
 */
function displayDesignator(
  designator: string,
  storey: number | null,
): string {
  if (storey === null || storey < 0) return designator;
  return designator.replace(
    /^([AB]\d+\.)(\d+)(\.\d+)$/,
    `$1${storey}$3`,
  );
}

/** Sortowanie naturalne: "A1.1.2" < "A1.1.10" (porównuje segmenty numerycznie) */
function naturalSort(a: string, b: string): number {
  const pa = a.split(/(\d+)/);
  const pb = b.split(/(\d+)/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const sa = pa[i] ?? "";
    const sb = pb[i] ?? "";
    const na = Number(sa);
    const nb = Number(sb);
    if (!isNaN(na) && !isNaN(nb)) {
      if (na !== nb) return na - nb;
    } else {
      const cmp = sa.localeCompare(sb);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

interface RawStatsRow {
  status: string;
  type: string;
  count: number;
}

interface GroupStats {
  total: number;
  not_started: number;
  in_progress: number;
  to_check: number;
  done: number;
  issue: number;
  apartment: number;
  commercial: number;
  parking: number;
  storage: number;
}

/** Grupuje wiersze "count per (group, type, status)" do agregatów per grupa */
function aggregateByGroup<T extends RawStatsRow>(
  rows: T[],
  groupKey: (row: T) => string,
) {
  const map = new Map<string, GroupStats>();

  const empty = (): GroupStats => ({
    total: 0,
    not_started: 0,
    in_progress: 0,
    to_check: 0,
    done: 0,
    issue: 0,
    apartment: 0,
    commercial: 0,
    parking: 0,
    storage: 0,
  });

  for (const row of rows) {
    const key = groupKey(row);
    const existing = map.get(key) ?? empty();
    existing.total += row.count;

    // Akumuluj po statusie
    if (row.status in existing) {
      (existing as unknown as Record<string, number>)[row.status] =
        (existing as unknown as Record<string, number>)[row.status]! +
        row.count;
    }
    // Akumuluj po typie
    if (row.type in existing) {
      (existing as unknown as Record<string, number>)[row.type] =
        (existing as unknown as Record<string, number>)[row.type]! + row.count;
    }

    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, id: null as string | null, sortOrder: 0, ...stats }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Wariant aggregateByGroup specyficzny dla pięter — zwraca id + sortOrder */
function aggregateByFloor(
  rows: {
    floorId: string | null;
    floorLabel: string | null;
    floorSortOrder: number | null;
    type: string;
    status: string;
    count: number;
  }[],
) {
  const map = new Map<
    string,
    GroupStats & { id: string | null; sortOrder: number }
  >();

  const empty = (): GroupStats & { id: string | null; sortOrder: number } => ({
    total: 0,
    not_started: 0,
    in_progress: 0,
    to_check: 0,
    done: 0,
    issue: 0,
    apartment: 0,
    commercial: 0,
    parking: 0,
    storage: 0,
    id: null,
    sortOrder: 99,
  });

  for (const row of rows) {
    const key = row.floorLabel ?? "—";
    const existing = map.get(key) ?? {
      ...empty(),
      id: row.floorId,
      sortOrder: row.floorSortOrder ?? 99,
    };
    existing.total += row.count;

    if (row.status in existing) {
      (existing as unknown as Record<string, number>)[row.status] =
        (existing as unknown as Record<string, number>)[row.status]! +
        row.count;
    }
    if (row.type in existing) {
      (existing as unknown as Record<string, number>)[row.type] =
        (existing as unknown as Record<string, number>)[row.type]! + row.count;
    }

    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([name, { id, sortOrder, ...stats }]) => ({ name, id, sortOrder, ...stats }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
