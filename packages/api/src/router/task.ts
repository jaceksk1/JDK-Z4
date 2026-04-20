import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { alias, and, desc, eq, ilike, lt, or, sql } from "@acme/db";
import { floors, projects, tasks, units, user } from "@acme/db/schema";
import {
  taskCreateInputSchema,
  taskGetByIdInputSchema,
  taskListInputSchema,
  taskSubmitInputSchema,
  taskUpdateInputSchema,
  taskUpdateStatusInputSchema,
} from "@acme/validators";

import { protectedProcedure } from "../trpc";

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

const createdByUser = alias(user, "created_by_user");
const assignedToUser = alias(user, "assigned_to_user");

export const taskRouter = {
  /** Utwórz zadanie — manager/admin */
  create: managerProcedure
    .input(taskCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await getProject(ctx, input.projectCode);

      if (input.unitId) {
        const unitExists = await ctx.db.query.units.findFirst({
          where: (u, { and: andFn, eq: eqFn }) =>
            andFn(eqFn(u.id, input.unitId!), eqFn(u.projectId, project.id)),
        });
        if (!unitExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Jednostka nie istnieje w tym projekcie",
          });
        }
      }

      if (input.assignedToId) {
        const userExists = await ctx.db.query.user.findFirst({
          where: (u, { eq: eqFn }) => eqFn(u.id, input.assignedToId!),
        });
        if (!userExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Użytkownik nie istnieje",
          });
        }
      }

      const [created] = await ctx.db
        .insert(tasks)
        .values({
          projectId: project.id,
          unitId: input.unitId ?? null,
          title: input.title,
          description: input.description ?? null,
          assignedToId: input.assignedToId ?? null,
          createdById: ctx.session.user.id,
          dueDate: input.dueDate ?? null,
        })
        .returning();

      return created;
    }),

  /** Zgłoś wykonanie — worker przypisany do zadania */
  submit: protectedProcedure
    .input(taskSubmitInputSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.id, input.taskId),
      });
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zadanie nie istnieje",
        });
      }
      if (task.status !== "open") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tylko otwarte zadanie może być zgłoszone",
        });
      }
      if (task.assignedToId !== ctx.session.user.id) {
        const role = ctx.session.user.role;
        if (role !== "manager" && role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Tylko przypisany pracownik może zgłosić wykonanie",
          });
        }
      }

      const [updated] = await ctx.db
        .update(tasks)
        .set({
          status: "submitted",
          completionNote: input.completionNote,
          submittedAt: new Date(),
        })
        .where(eq(tasks.id, input.taskId))
        .returning();

      return updated;
    }),

  /** Zmień status — manager/admin */
  updateStatus: managerProcedure
    .input(taskUpdateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.id, input.taskId),
      });
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zadanie nie istnieje",
        });
      }

      const [updated] = await ctx.db
        .update(tasks)
        .set({ status: input.status })
        .where(eq(tasks.id, input.taskId))
        .returning();

      return updated;
    }),

  /** Edycja zadania — manager/admin */
  update: managerProcedure
    .input(taskUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.id, input.taskId),
      });
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zadanie nie istnieje",
        });
      }

      const set: Record<string, unknown> = {};
      if (input.title !== undefined) set.title = input.title;
      if (input.description !== undefined) set.description = input.description;
      if (input.unitId !== undefined) set.unitId = input.unitId;
      if (input.assignedToId !== undefined) set.assignedToId = input.assignedToId;
      if (input.dueDate !== undefined) set.dueDate = input.dueDate;

      if (Object.keys(set).length === 0) return task;

      const [updated] = await ctx.db
        .update(tasks)
        .set(set)
        .where(eq(tasks.id, input.taskId))
        .returning();

      return updated;
    }),

  /** Usuń zadanie — manager/admin */
  delete: managerProcedure
    .input(taskGetByIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.id, input.id),
      });
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zadanie nie istnieje",
        });
      }
      await ctx.db.delete(tasks).where(eq(tasks.id, input.id));
      return { success: true };
    }),

  /** Szczegóły zadania */
  getById: protectedProcedure
    .input(taskGetByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          completionNote: tasks.completionNote,
          submittedAt: tasks.submittedAt,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          createdBy: {
            id: createdByUser.id,
            name: createdByUser.name,
          },
          assignedTo: {
            id: assignedToUser.id,
            name: assignedToUser.name,
          },
          unit: {
            id: units.id,
            designator: units.designator,
          },
          floorStorey: floors.storey,
        })
        .from(tasks)
        .innerJoin(createdByUser, eq(tasks.createdById, createdByUser.id))
        .leftJoin(assignedToUser, eq(tasks.assignedToId, assignedToUser.id))
        .leftJoin(units, eq(tasks.unitId, units.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .where(eq(tasks.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zadanie nie istnieje",
        });
      }

      const at = row.assignedTo;
      const u = row.unit;
      return {
        ...row,
        assignedTo: at && at.id ? at : null,
        unit: u && u.id
          ? { ...u, displayDesignator: displayDesignator(u.designator, row.floorStorey) }
          : null,
      };
    }),

  /** Lista zadań z filtrami i cursor pagination */
  list: protectedProcedure
    .input(taskListInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await getProject(ctx, input.projectCode);

      const conditions = [eq(tasks.projectId, project.id)];

      if (input.unitId) conditions.push(eq(tasks.unitId, input.unitId));
      if (input.status) conditions.push(eq(tasks.status, input.status));
      if (input.assignedToId)
        conditions.push(eq(tasks.assignedToId, input.assignedToId));
      if (input.createdById)
        conditions.push(eq(tasks.createdById, input.createdById));

      if (input.search) {
        const term = `%${input.search}%`;
        conditions.push(
          or(
            ilike(tasks.title, term),
            ilike(tasks.description, term),
          )!,
        );
      }

      if (input.cursor) {
        const cursorRow = await ctx.db.query.tasks.findFirst({
          where: (t, { eq: eqFn }) => eqFn(t.id, input.cursor!),
          columns: { createdAt: true },
        });
        if (cursorRow) {
          conditions.push(lt(tasks.createdAt, cursorRow.createdAt));
        }
      }

      const rows = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          createdBy: {
            id: createdByUser.id,
            name: createdByUser.name,
          },
          assignedTo: {
            id: assignedToUser.id,
            name: assignedToUser.name,
          },
          unit: {
            id: units.id,
            designator: units.designator,
          },
          floorStorey: floors.storey,
        })
        .from(tasks)
        .innerJoin(createdByUser, eq(tasks.createdById, createdByUser.id))
        .leftJoin(assignedToUser, eq(tasks.assignedToId, assignedToUser.id))
        .leftJoin(units, eq(tasks.unitId, units.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items: items.map((row) => {
          const at = row.assignedTo;
          const u = row.unit;
          return {
            ...row,
            assignedTo: at && at.id ? at : null,
            unit: u && u.id
              ? { ...u, displayDesignator: displayDesignator(u.designator, row.floorStorey) }
              : null,
          };
        }),
        nextCursor: hasMore ? items[items.length - 1]!.id : null,
      };
    }),

  /** Statystyki zadań dla projektu */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const project = await ctx.db.query.projects.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.code, "Z4"),
    });
    if (!project) return { total: 0, open: 0, done: 0 };

    const [result] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${tasks.status} = 'open')::int`,
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')::int`,
      })
      .from(tasks)
      .where(eq(tasks.projectId, project.id));

    return result ?? { total: 0, open: 0, done: 0 };
  }),
} satisfies TRPCRouterRecord;

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
