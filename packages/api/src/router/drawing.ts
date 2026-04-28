import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq, inArray, sql } from "@acme/db";
import { drawings } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tylko administrator może wykonać tę operację",
    });
  }
  return next({ ctx });
});

const drawingItemSchema = z.object({
  fileCode: z.string().min(3).max(200),
  description: z.string().min(1).max(2000),
  discipline: z.string().max(20).optional().nullable(),
  phase: z.string().max(20).optional().nullable(),
  revision: z.string().max(20).optional().nullable(),
});

type Ctx = { db: typeof import("@acme/db/client").db };

async function getProjectId(ctx: Ctx, projectCode: string): Promise<string> {
  const project = await ctx.db.query.projects.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.code, projectCode),
  });
  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Projekt "${projectCode}" nie istnieje`,
    });
  }
  return project.id;
}

export const drawingRouter = {
  /** Bulk lookup po kodach — zwraca tylko te które są w DB */
  lookupByCodes: protectedProcedure
    .input(
      z.object({
        projectCode: z.string(),
        codes: z.array(z.string()).max(500),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.codes.length === 0) return [];
      const projectId = await getProjectId(ctx, input.projectCode);

      const rows = await ctx.db
        .select({
          fileCode: drawings.fileCode,
          description: drawings.description,
          discipline: drawings.discipline,
          revision: drawings.revision,
        })
        .from(drawings)
        .where(
          and(
            eq(drawings.projectId, projectId),
            inArray(drawings.fileCode, input.codes),
          ),
        );

      return rows;
    }),

  /** Lista wszystkich rysunków projektu (admin) */
  list: adminProcedure
    .input(z.object({ projectCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectId = await getProjectId(ctx, input.projectCode);
      return ctx.db
        .select()
        .from(drawings)
        .where(eq(drawings.projectId, projectId))
        .orderBy(drawings.fileCode);
    }),

  /** Import — upsert listy rysunków po (projectId, fileCode) */
  import: adminProcedure
    .input(
      z.object({
        projectCode: z.string(),
        items: z.array(drawingItemSchema).min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = await getProjectId(ctx, input.projectCode);

      // Dedupe po fileCode (ostatnie wystąpienie wygrywa) —
      // Postgres ON CONFLICT nie znosi duplikatów w obrębie jednego INSERT
      const byCode = new Map<string, (typeof input.items)[number]>();
      for (const item of input.items) {
        byCode.set(item.fileCode, item);
      }

      const rows = Array.from(byCode.values()).map((item) => ({
        projectId,
        fileCode: item.fileCode,
        description: item.description,
        discipline: item.discipline ?? null,
        phase: item.phase ?? null,
        revision: item.revision ?? null,
      }));

      await ctx.db
        .insert(drawings)
        .values(rows)
        .onConflictDoUpdate({
          target: [drawings.projectId, drawings.fileCode],
          set: {
            description: sql`excluded.description`,
            discipline: sql`excluded.discipline`,
            phase: sql`excluded.phase`,
            revision: sql`excluded.revision`,
          },
        });

      const duplicatesRemoved = input.items.length - rows.length;
      return { imported: rows.length, duplicatesRemoved };
    }),

  /** Wyczyść rysunki projektu (admin) — opcja przed reimportem */
  clear: adminProcedure
    .input(z.object({ projectCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const projectId = await getProjectId(ctx, input.projectCode);
      await ctx.db.delete(drawings).where(eq(drawings.projectId, projectId));
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
