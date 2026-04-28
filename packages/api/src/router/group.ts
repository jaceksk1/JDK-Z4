import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq, inArray, sql } from "@acme/db";
import { groupModules, groups, user, userGroups } from "@acme/db/schema";
import {
  groupCreateInputSchema,
  groupUpdateInputSchema,
  MODULE_KEYS,
} from "@acme/validators";

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

type Ctx = { db: typeof import("@acme/db/client").db };

/** Sprawdza czy każdy z podanych moduleKeys jest w whitelist MODULE_KEYS. */
function validateModuleKeys(keys: string[]): string[] {
  const valid = new Set<string>(MODULE_KEYS);
  return keys.filter((k) => valid.has(k));
}

/** Zwraca listę moduleKeys widocznych dla danego usera. Admin = wszystkie. */
async function getEffectiveModulesForUser(
  ctx: Ctx,
  userId: string,
  role: string | null,
): Promise<string[]> {
  if (role === "admin") return [...MODULE_KEYS];

  const rows = await ctx.db
    .selectDistinct({ moduleKey: groupModules.moduleKey })
    .from(userGroups)
    .innerJoin(groupModules, eq(userGroups.groupId, groupModules.groupId))
    .where(eq(userGroups.userId, userId));

  return rows.map((r) => r.moduleKey);
}

export const groupRouter = {
  /** Moduły widoczne dla zalogowanego usera — używane przez sidebar. */
  myModules: protectedProcedure.query(async ({ ctx }) => {
    return getEffectiveModulesForUser(
      ctx,
      ctx.session.user.id,
      ctx.session.user.role ?? null,
    );
  }),

  /** Lista wszystkich grup z liczbą członków + listą modułów. */
  list: adminProcedure.query(async ({ ctx }) => {
    const allGroups = await ctx.db.select().from(groups).orderBy(groups.name);
    if (allGroups.length === 0) return [];

    const ids = allGroups.map((g) => g.id);

    const moduleRows = await ctx.db
      .select()
      .from(groupModules)
      .where(inArray(groupModules.groupId, ids));

    const memberCountRows = await ctx.db
      .select({
        groupId: userGroups.groupId,
        count: sql<number>`count(*)::int`,
      })
      .from(userGroups)
      .where(inArray(userGroups.groupId, ids))
      .groupBy(userGroups.groupId);

    const modulesByGroup = new Map<string, string[]>();
    for (const row of moduleRows) {
      const arr = modulesByGroup.get(row.groupId) ?? [];
      arr.push(row.moduleKey);
      modulesByGroup.set(row.groupId, arr);
    }

    const memberCountByGroup = new Map<string, number>();
    for (const row of memberCountRows) {
      memberCountByGroup.set(row.groupId, row.count);
    }

    return allGroups.map((g) => ({
      ...g,
      moduleKeys: modulesByGroup.get(g.id) ?? [],
      memberCount: memberCountByGroup.get(g.id) ?? 0,
    }));
  }),

  create: adminProcedure
    .input(groupCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const moduleKeys = validateModuleKeys(input.moduleKeys);

      const existing = await ctx.db.query.groups.findFirst({
        where: (g, { eq: eqFn }) => eqFn(g.name, input.name),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Grupa "${input.name}" już istnieje`,
        });
      }

      const [created] = await ctx.db
        .insert(groups)
        .values({ name: input.name, description: input.description ?? null })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się utworzyć grupy",
        });
      }

      if (moduleKeys.length > 0) {
        await ctx.db
          .insert(groupModules)
          .values(moduleKeys.map((k) => ({ groupId: created.id, moduleKey: k })));
      }

      return { id: created.id, moduleKeys };
    }),

  update: adminProcedure
    .input(groupUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const moduleKeys = validateModuleKeys(input.moduleKeys);

      // Konflikt nazwy z inną grupą
      const conflict = await ctx.db.query.groups.findFirst({
        where: (g, { and: andFn, eq: eqFn, ne }) =>
          andFn(eqFn(g.name, input.name), ne(g.id, input.groupId)),
      });
      if (conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Grupa "${input.name}" już istnieje`,
        });
      }

      await ctx.db
        .update(groups)
        .set({ name: input.name, description: input.description ?? null })
        .where(eq(groups.id, input.groupId));

      // Reset modułów: delete + insert (proste, atomowe per request)
      await ctx.db
        .delete(groupModules)
        .where(eq(groupModules.groupId, input.groupId));
      if (moduleKeys.length > 0) {
        await ctx.db
          .insert(groupModules)
          .values(
            moduleKeys.map((k) => ({ groupId: input.groupId, moduleKey: k })),
          );
      }

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ groupId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Sprawdź czy nie zostawimy userów bez żadnej grupy
      const orphans = await ctx.db
        .select({ userId: userGroups.userId })
        .from(userGroups)
        .where(eq(userGroups.groupId, input.groupId));

      if (orphans.length > 0) {
        const orphanIds = orphans.map((o) => o.userId);
        const otherMemberships = await ctx.db
          .select({
            userId: userGroups.userId,
            count: sql<number>`count(*)::int`,
          })
          .from(userGroups)
          .where(
            and(
              inArray(userGroups.userId, orphanIds),
              sql`${userGroups.groupId} != ${input.groupId}`,
            ),
          )
          .groupBy(userGroups.userId);

        const usersWithOtherGroups = new Set(
          otherMemberships.map((r) => r.userId),
        );
        const wouldBeOrphaned = orphanIds.filter(
          (id) => !usersWithOtherGroups.has(id),
        );

        if (wouldBeOrphaned.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Usunięcie grupy zostawiłoby ${wouldBeOrphaned.length} użytkowników bez żadnej grupy. Najpierw przypisz im inną grupę.`,
          });
        }
      }

      await ctx.db.delete(groups).where(eq(groups.id, input.groupId));
      return { success: true };
    }),

  /** Lista członków danej grupy. */
  members: adminProcedure
    .input(z.object({ groupId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        })
        .from(userGroups)
        .innerJoin(user, eq(user.id, userGroups.userId))
        .where(eq(userGroups.groupId, input.groupId))
        .orderBy(user.name);
    }),
} satisfies TRPCRouterRecord;
