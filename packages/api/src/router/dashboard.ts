import type { TRPCRouterRecord } from "@trpc/server";

import { and, eq, gt, sql } from "@acme/db";
import { projects, questions, tasks, units, user } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const dashboardRouter = {
  /** Statystyki dashboardu — różne per rola */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const project = await ctx.db.query.projects.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.code, "Z4"),
    });
    if (!project) return null;

    const userId = ctx.session.user.id;
    const role = ctx.session.user.role;
    const isManager = role === "manager" || role === "admin";

    // Liczba nieprzeczytanych odpowiedzi (odpowiedzi po lastSeenQaAt)
    const currentUser = await ctx.db.query.user.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.id, userId),
      columns: { lastSeenQaAt: true },
    });
    const lastSeen = currentUser?.lastSeenQaAt;

    // Dla workera: nieprzeczytane odpowiedzi na JEGO pytania
    // Dla managera: nowe pytania otwarte (bez odpowiedzi) od lastSeen
    const unreadConditions = [eq(questions.projectId, project.id)];

    if (isManager) {
      unreadConditions.push(eq(questions.status, "open"));
      if (lastSeen) {
        unreadConditions.push(gt(questions.createdAt, lastSeen));
      }
    } else {
      unreadConditions.push(eq(questions.askedById, userId));
      unreadConditions.push(eq(questions.status, "answered"));
      if (lastSeen) {
        unreadConditions.push(gt(questions.answeredAt, lastSeen));
      }
    }

    const [unreadResult] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(and(...unreadConditions));

    // Q&A stats
    const [qaStats] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${questions.status} = 'open')::int`,
        answered: sql<number>`count(*) filter (where ${questions.status} = 'answered')::int`,
        resolved: sql<number>`count(*) filter (where ${questions.status} = 'resolved')::int`,
      })
      .from(questions)
      .where(eq(questions.projectId, project.id));

    // Moje pytania (worker) lub pytania do odpowiedzenia (manager)
    const [myStats] = isManager
      ? await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(questions)
          .where(
            and(
              eq(questions.projectId, project.id),
              eq(questions.status, "open"),
            ),
          )
      : await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(questions)
          .where(
            and(
              eq(questions.projectId, project.id),
              eq(questions.askedById, userId),
            ),
          );

    // Statystyki zadań
    const [taskStats] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${tasks.status} = 'open')::int`,
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')::int`,
      })
      .from(tasks)
      .where(eq(tasks.projectId, project.id));

    // Statystyki jednostek
    const [unitStats] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        done: sql<number>`count(*) filter (where ${units.status} = 'done')::int`,
        inProgress: sql<number>`count(*) filter (where ${units.status} = 'in_progress')::int`,
        issue: sql<number>`count(*) filter (where ${units.status} = 'issue')::int`,
      })
      .from(units)
      .where(eq(units.projectId, project.id));

    return {
      role: isManager ? ("manager" as const) : ("worker" as const),
      unreadCount: unreadResult?.count ?? 0,
      qa: {
        total: qaStats?.total ?? 0,
        open: qaStats?.open ?? 0,
        answered: qaStats?.answered ?? 0,
        resolved: qaStats?.resolved ?? 0,
      },
      myCount: myStats?.count ?? 0,
      tasks: {
        total: taskStats?.total ?? 0,
        open: taskStats?.open ?? 0,
        done: taskStats?.done ?? 0,
      },
      units: {
        total: unitStats?.total ?? 0,
        done: unitStats?.done ?? 0,
        inProgress: unitStats?.inProgress ?? 0,
        issue: unitStats?.issue ?? 0,
      },
    };
  }),

  /** Oznacz Q&A jako przeczytane */
  markQaSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(user)
      .set({ lastSeenQaAt: new Date() })
      .where(eq(user.id, ctx.session.user.id));
    return { success: true };
  }),
} satisfies TRPCRouterRecord;
