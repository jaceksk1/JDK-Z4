import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { alias, and, desc, eq, ilike, lt, or } from "@acme/db";
import { floors, projects, questions, units, user } from "@acme/db/schema";
import {
  questionAnswerInputSchema,
  questionCreateInputSchema,
  questionGetByIdInputSchema,
  questionListInputSchema,
  questionResolveInputSchema,
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

/** Procedura tylko dla kierownika lub admina */
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

// Aliasy do podwójnego joina na tabelę user
const askedByUser = alias(user, "asked_by_user");
const answeredByUser = alias(user, "answered_by_user");

export const questionRouter = {
  /** Zadaj pytanie — dowolny zalogowany użytkownik */
  create: protectedProcedure
    .input(questionCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await getProject(ctx, input.projectCode);

      // Walidacja unitId jeśli podano
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

      const [created] = await ctx.db
        .insert(questions)
        .values({
          projectId: project.id,
          unitId: input.unitId ?? null,
          content: input.content,
          askedById: ctx.session.user.id,
        })
        .returning();

      return created;
    }),

  /** Odpowiedz na pytanie — tylko kierownik/admin */
  answer: managerProcedure
    .input(questionAnswerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.db.query.questions.findFirst({
        where: (q, { eq: eqFn }) => eqFn(q.id, input.questionId),
      });
      if (!question) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pytanie nie istnieje",
        });
      }
      if (question.status === "resolved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pytanie jest już zamknięte",
        });
      }

      const [updated] = await ctx.db
        .update(questions)
        .set({
          answer: input.answer,
          answeredById: ctx.session.user.id,
          answeredAt: new Date(),
          status: "answered",
        })
        .where(eq(questions.id, input.questionId))
        .returning();

      return updated;
    }),

  /** Zamknij pytanie — autor lub kierownik/admin */
  resolve: protectedProcedure
    .input(questionResolveInputSchema)
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.db.query.questions.findFirst({
        where: (q, { eq: eqFn }) => eqFn(q.id, input.questionId),
      });
      if (!question) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pytanie nie istnieje",
        });
      }

      const role = ctx.session.user.role;
      const isAuthor = question.askedById === ctx.session.user.id;
      const isManager = role === "manager" || role === "admin";

      if (!isAuthor && !isManager) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Tylko autor pytania lub kierownik może zamknąć pytanie",
        });
      }

      const [updated] = await ctx.db
        .update(questions)
        .set({ status: "resolved" })
        .where(eq(questions.id, input.questionId))
        .returning();

      return updated;
    }),

  /** Szczegóły pytania z danymi autora, odpowiadającego i jednostki */
  getById: protectedProcedure
    .input(questionGetByIdInputSchema)
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: questions.id,
          content: questions.content,
          status: questions.status,
          createdAt: questions.createdAt,
          answer: questions.answer,
          answeredAt: questions.answeredAt,
          askedBy: {
            id: askedByUser.id,
            name: askedByUser.name,
          },
          answeredBy: {
            id: answeredByUser.id,
            name: answeredByUser.name,
          },
          unit: {
            id: units.id,
            designator: units.designator,
          },
          floorStorey: floors.storey,
        })
        .from(questions)
        .innerJoin(askedByUser, eq(questions.askedById, askedByUser.id))
        .leftJoin(
          answeredByUser,
          eq(questions.answeredById, answeredByUser.id),
        )
        .leftJoin(units, eq(questions.unitId, units.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .where(eq(questions.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pytanie nie istnieje",
        });
      }

      const ab = row.answeredBy;
      const u = row.unit;
      return {
        ...row,
        answeredBy: ab && ab.id ? ab : null,
        unit: u && u.id
          ? { ...u, displayDesignator: displayDesignator(u.designator, row.floorStorey) }
          : null,
      };
    }),

  /** Lista pytań z filtrami, wyszukiwaniem i cursor pagination */
  list: protectedProcedure
    .input(questionListInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await getProject(ctx, input.projectCode);

      const conditions = [eq(questions.projectId, project.id)];

      if (input.unitId) conditions.push(eq(questions.unitId, input.unitId));
      if (input.status) conditions.push(eq(questions.status, input.status));
      if (input.askedById)
        conditions.push(eq(questions.askedById, input.askedById));

      if (input.search) {
        const term = `%${input.search}%`;
        conditions.push(
          or(
            ilike(questions.content, term),
            ilike(questions.answer, term),
          )!,
        );
      }

      // Cursor pagination — pobierz createdAt pytania-kursora
      if (input.cursor) {
        const cursorRow = await ctx.db.query.questions.findFirst({
          where: (q, { eq: eqFn }) => eqFn(q.id, input.cursor!),
          columns: { createdAt: true },
        });
        if (cursorRow) {
          conditions.push(lt(questions.createdAt, cursorRow.createdAt));
        }
      }

      const rows = await ctx.db
        .select({
          id: questions.id,
          content: questions.content,
          status: questions.status,
          createdAt: questions.createdAt,
          answer: questions.answer,
          answeredAt: questions.answeredAt,
          askedBy: {
            id: askedByUser.id,
            name: askedByUser.name,
          },
          answeredBy: {
            id: answeredByUser.id,
            name: answeredByUser.name,
          },
          unit: {
            id: units.id,
            designator: units.designator,
          },
          floorStorey: floors.storey,
        })
        .from(questions)
        .innerJoin(askedByUser, eq(questions.askedById, askedByUser.id))
        .leftJoin(
          answeredByUser,
          eq(questions.answeredById, answeredByUser.id),
        )
        .leftJoin(units, eq(questions.unitId, units.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .where(and(...conditions))
        .orderBy(desc(questions.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items: items.map((row) => {
          const ab = row.answeredBy;
          const u = row.unit;
          return {
            ...row,
            answeredBy: ab && ab.id ? ab : null,
            unit: u && u.id
              ? { ...u, displayDesignator: displayDesignator(u.designator, row.floorStorey) }
              : null,
          };
        }),
        nextCursor: hasMore ? items[items.length - 1]!.id : null,
      };
    }),
} satisfies TRPCRouterRecord;

/**
 * Zamienia kondygnację projektową na numer piętra w designatorze.
 * "A1.2.5" + storey=1 → "A1.1.5"
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
