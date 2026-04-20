import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { eq } from "@acme/db";
import { user } from "@acme/db/schema";
import { createUserInputSchema, updateUserInputSchema } from "@acme/validators";

import { protectedProcedure } from "../trpc";

/** Jan Kowalski → jan.kowalski (bez polskich znaków) */
function toUsername(firstName: string, lastName: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/ą/g, "a")
      .replace(/ć/g, "c")
      .replace(/ę/g, "e")
      .replace(/ł/g, "l")
      .replace(/ń/g, "n")
      .replace(/ó/g, "o")
      .replace(/ś/g, "s")
      .replace(/ź/g, "z")
      .replace(/ż/g, "z")
      .replace(/[^a-z0-9]/g, "");
  return `${normalize(firstName)}.${normalize(lastName)}`;
}

/** Procedura dostępna tylko dla admina */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tylko administrator może wykonać tę operację",
    });
  }
  return next({ ctx });
});

export const adminRouter = {
  /** Lista wszystkich użytkowników */
  listUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        company: user.company,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(user.name);
  }),

  /** Tworzenie nowego użytkownika przez admina */
  createUser: adminProcedure
    .input(createUserInputSchema)
    .mutation(async ({ ctx, input }) => {
      const username = toUsername(input.firstName, input.lastName);
      const email = `${username}@jdkz4.local`;
      const fullName = `${input.firstName} ${input.lastName}`;

      // Sprawdź czy username już istnieje
      const existing = await ctx.db.query.user.findFirst({
        where: (u, { eq: eqFn }) => eqFn(u.username, username),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Użytkownik "${username}" już istnieje`,
        });
      }

      // Utwórz użytkownika przez Better Auth API
      const result = await ctx.authApi.signUpEmail({
        body: {
          email,
          password: input.password,
          name: fullName,
          username,
        },
        headers: ctx.headers,
        asResponse: false,
      });

      if (!result?.user?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się utworzyć użytkownika",
        });
      }

      // Ustaw rolę i firmę (admin plugin nie jest używany bezpośrednio — aktualizujemy ręcznie)
      await ctx.db
        .update(user)
        .set({ role: input.role, company: input.company ?? null })
        .where(eq(user.id, result.user.id));

      return {
        id: result.user.id,
        name: fullName,
        username,
        role: input.role,
        company: input.company ?? null,
      };
    }),

  /** Edycja danych użytkownika */
  updateUser: adminProcedure
    .input(updateUserInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.user.findFirst({
        where: (u, { eq: eqFn }) => eqFn(u.id, input.userId),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Użytkownik nie istnieje",
        });
      }

      await ctx.db
        .update(user)
        .set({
          name: input.name,
          role: input.role,
          company: input.company ?? null,
        })
        .where(eq(user.id, input.userId));

      return {
        id: input.userId,
        name: input.name,
        role: input.role,
        company: input.company ?? null,
      };
    }),

  /** Reset hasła przez admina */
  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(4).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Better Auth admin plugin: setUserPassword
      await ctx.authApi.setUserPassword({
        body: {
          userId: input.userId,
          newPassword: input.newPassword,
        },
        headers: ctx.headers,
        asResponse: false,
      });
      return { success: true };
    }),
  /** Usunięcie użytkownika */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Nie pozwól usunąć samego siebie
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nie możesz usunąć swojego konta",
        });
      }

      const existing = await ctx.db.query.user.findFirst({
        where: (u, { eq: eqFn }) => eqFn(u.id, input.userId),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Użytkownik nie istnieje",
        });
      }

      await ctx.db.delete(user).where(eq(user.id, input.userId));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
