import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { eq } from "@acme/db";
import { user } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can see this secret message!";
  }),

  /**
   * Czy zalogowany user musi zmienić hasło.
   * Public — żeby guard nie sypał UNAUTHORIZED gdy session jeszcze się nie
   * załadowała / wygasła. Brak sesji → zwracamy false (nie wymuszamy nic).
   */
  myMustChangePassword: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) return { mustChange: false };
    const row = await ctx.db.query.user.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.id, ctx.session!.user.id),
      columns: { mustChangePassword: true },
    });
    return { mustChange: row?.mustChangePassword ?? false };
  }),

  /** Zmiana własnego hasła — wymaga starego + nowego. Czyści flagę mustChangePassword. */
  changeMyPassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Podaj aktualne hasło"),
        newPassword: z
          .string()
          .min(6, "Nowe hasło musi mieć min. 6 znaków")
          .max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.currentPassword === input.newPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nowe hasło musi być inne niż aktualne",
        });
      }

      try {
        await ctx.authApi.changePassword({
          body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
            // Zostawiamy bieżącą sesję — user nie musi się ponownie logować
            revokeOtherSessions: false,
          },
          headers: ctx.headers,
          asResponse: false,
        });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            e instanceof Error && e.message
              ? e.message
              : "Nie udało się zmienić hasła (sprawdź aktualne hasło)",
        });
      }

      await ctx.db
        .update(user)
        .set({ mustChangePassword: false })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
