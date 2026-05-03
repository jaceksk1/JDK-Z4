import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { and, asc, eq, gte, inArray, lte, sql } from "@acme/db";
import { attendance, projects, user } from "@acme/db/schema";
import {
  attendanceCancelInputSchema,
  attendanceCheckInInputSchema,
  attendanceCheckOutInputSchema,
  attendanceListForDateInputSchema,
  attendanceMonthlyReportInputSchema,
  attendanceSetNoteInputSchema,
  attendanceSetTimesInputSchema,
} from "@acme/validators";

import { protectedProcedure } from "../trpc";

const TZ = "Europe/Warsaw";

/** Lokalna data PL jako YYYY-MM-DD. */
function toPlDateString(d: Date): string {
  // 'en-CA' zwraca format YYYY-MM-DD; podajemy timeZone żeby liczyło lokalnie
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

function todayPl(): string {
  return toPlDateString(new Date());
}

function yesterdayPl(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toPlDateString(d);
}

function isManagerRole(role: string | null | undefined): boolean {
  return role === "manager" || role === "admin";
}

type Ctx = { db: typeof import("@acme/db/client").db };

async function getProjectZ4(ctx: Ctx) {
  const project = await ctx.db.query.projects.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.code, "Z4"),
  });
  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Projekt Z4 nie istnieje",
    });
  }
  return project;
}

/**
 * Sprawdza czy worker może edytować rekord danej daty:
 * - manager/admin → zawsze
 * - worker → tylko dziś (T) i wczoraj (T-1), tylko swój
 */
function assertWorkerCanEditDate(
  date: string,
  role: string | null | undefined,
) {
  if (isManagerRole(role)) return;
  const today = todayPl();
  const yesterday = yesterdayPl();
  if (date !== today && date !== yesterday) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Możesz edytować obecność tylko dla dziś i wczoraj. Skontaktuj się z kierownikiem.",
    });
  }
}

/** Worker nie może edytować cudzego userId. */
function resolveTargetUserId(
  inputUserId: string | undefined,
  selfId: string,
  role: string | null | undefined,
): string {
  if (!inputUserId) return selfId;
  if (inputUserId === selfId) return selfId;
  if (!isManagerRole(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tylko kierownik może edytować obecność innych pracowników",
    });
  }
  return inputUserId;
}

/** Liczy godziny z różnicy in-out, dwie cyfry po przecinku. */
function diffHours(checkedIn: Date, checkedOut: Date): number {
  const ms = checkedOut.getTime() - checkedIn.getTime();
  if (ms <= 0) return 0;
  return Math.round((ms / 1000 / 60 / 60) * 100) / 100;
}

/**
 * Buduje absolutny timestamp dla "YYYY-MM-DD" + "HH:MM" interpretowany jako
 * lokalny czas Europe/Warsaw. Działa poprawnie wokół DST (ostatnia niedziela
 * marca / października).
 */
function combineDateAndTimePl(dateStr: string, timeStr: string): Date {
  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  if (
    Y === undefined ||
    M === undefined ||
    D === undefined ||
    h === undefined ||
    m === undefined
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Niepoprawny format daty/godziny",
    });
  }
  // Pierwsze przybliżenie: traktujemy te liczby jako UTC
  const utcGuess = new Date(Date.UTC(Y, M - 1, D, h, m, 0));
  // Sprawdzamy jak ten moment wygląda po sformatowaniu w PL
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(utcGuess);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  const localizedAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  // Offset = ile zostało dodane przez TZ — odwracamy
  const offsetMs = localizedAsUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offsetMs);
}

export const attendanceRouter = {
  /** Stan obecności workera dla widgetu na dashbordzie. */
  myToday: protectedProcedure.query(async ({ ctx }) => {
    const project = await getProjectZ4(ctx);
    const userId = ctx.session.user.id;
    const today = todayPl();
    const yesterday = yesterdayPl();

    const rows = await ctx.db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          eq(attendance.projectId, project.id),
          inArray(attendance.date, [today, yesterday]),
        ),
      );

    const todayRecord = rows.find((r) => r.date === today) ?? null;
    const yesterdayRecord = rows.find((r) => r.date === yesterday) ?? null;

    // Worker zaczął wczoraj ale nie wpisał wyjścia → blokujemy dziś
    const yesterdayBlocking =
      yesterdayRecord !== null && yesterdayRecord.checkedOutAt === null;

    return {
      today,
      yesterday,
      todayRecord,
      yesterdayRecord,
      yesterdayBlocking,
    };
  }),

  /** Worker klika "Jestem dziś" (lub uzupełnia wczoraj). Idempotentne — drugi klik nic nie robi. */
  checkIn: protectedProcedure
    .input(attendanceCheckInInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);
      const userId = ctx.session.user.id;
      const role = ctx.session.user.role;
      const date = input.date ?? todayPl();
      assertWorkerCanEditDate(date, role);

      // Reguła: nie można zacząć dziś jeśli wczoraj nie zamknięte (brak wyjścia)
      if (date === todayPl() && !isManagerRole(role)) {
        const yesterday = yesterdayPl();
        const ydRow = await ctx.db.query.attendance.findFirst({
          where: (a, { and: andFn, eq: eqFn }) =>
            andFn(
              eqFn(a.userId, userId),
              eqFn(a.projectId, project.id),
              eqFn(a.date, yesterday),
            ),
        });
        if (ydRow && ydRow.checkedOutAt === null) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Najpierw wpisz godzinę wyjścia z poprzedniego dnia (lub anuluj rekord, jeśli nie byłeś).",
          });
        }
      }

      // Idempotentne: jeśli istnieje, nie nadpisuj checkedInAt
      const existing = await ctx.db.query.attendance.findFirst({
        where: (a, { and: andFn, eq: eqFn }) =>
          andFn(
            eqFn(a.userId, userId),
            eqFn(a.projectId, project.id),
            eqFn(a.date, date),
          ),
      });
      if (existing) {
        if (input.note !== undefined) {
          await ctx.db
            .update(attendance)
            .set({ note: input.note })
            .where(eq(attendance.id, existing.id));
        }
        return existing;
      }

      const [created] = await ctx.db
        .insert(attendance)
        .values({
          userId,
          projectId: project.id,
          date,
          checkedInAt: new Date(),
          note: input.note ?? null,
        })
        .returning();

      return created;
    }),

  /** Worker klika "Wychodzę". Auto-liczy godziny jeśli nie były ręcznie wpisane. */
  checkOut: protectedProcedure
    .input(attendanceCheckOutInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);
      const userId = ctx.session.user.id;
      const role = ctx.session.user.role;
      const date = input.date ?? todayPl();
      assertWorkerCanEditDate(date, role);

      const row = await ctx.db.query.attendance.findFirst({
        where: (a, { and: andFn, eq: eqFn }) =>
          andFn(
            eqFn(a.userId, userId),
            eqFn(a.projectId, project.id),
            eqFn(a.date, date),
          ),
      });
      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie zaznaczyłeś jeszcze obecności tego dnia",
        });
      }

      const checkedOutAt = new Date();
      const hoursWorked = diffHours(row.checkedInAt, checkedOutAt);

      const [updated] = await ctx.db
        .update(attendance)
        .set({
          checkedOutAt,
          hoursWorked: hoursWorked.toFixed(2),
        })
        .where(eq(attendance.id, row.id))
        .returning();

      return updated;
    }),

  /**
   * Ręczna edycja godzin zegarowych (HH:MM PL).
   * Worker = swoje T/T-1; manager = dowolnie.
   * Może utworzyć nowy rekord (manager) lub zaktualizować istniejący.
   * hoursWorked liczone automatycznie z różnicy gdy oba czasy obecne.
   */
  setTimes: protectedProcedure
    .input(attendanceSetTimesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);
      const role = ctx.session.user.role;
      const targetUserId = resolveTargetUserId(
        input.userId,
        ctx.session.user.id,
        role,
      );
      assertWorkerCanEditDate(input.date, role);

      const existing = await ctx.db.query.attendance.findFirst({
        where: (a, { and: andFn, eq: eqFn }) =>
          andFn(
            eqFn(a.userId, targetUserId),
            eqFn(a.projectId, project.id),
            eqFn(a.date, input.date),
          ),
      });

      // Wartości docelowe (z merge istniejących)
      const newCheckIn =
        input.checkInTime !== undefined
          ? combineDateAndTimePl(input.date, input.checkInTime)
          : (existing?.checkedInAt ?? null);

      let newCheckOut: Date | null;
      if (input.checkOutTime === undefined) {
        newCheckOut = existing?.checkedOutAt ?? null;
      } else if (input.checkOutTime === null) {
        newCheckOut = null;
      } else {
        newCheckOut = combineDateAndTimePl(input.date, input.checkOutTime);
      }

      if (!newCheckIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Brak godziny wejścia",
        });
      }
      if (newCheckOut && newCheckOut.getTime() <= newCheckIn.getTime()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Godzina wyjścia musi być późniejsza niż wejście",
        });
      }

      const newHours = newCheckOut
        ? diffHours(newCheckIn, newCheckOut).toFixed(2)
        : null;

      if (!existing) {
        if (!isManagerRole(role)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Najpierw zaznacz obecność dla tego dnia",
          });
        }
        const [created] = await ctx.db
          .insert(attendance)
          .values({
            userId: targetUserId,
            projectId: project.id,
            date: input.date,
            checkedInAt: newCheckIn,
            checkedOutAt: newCheckOut,
            hoursWorked: newHours,
          })
          .returning();
        return created;
      }

      const [updated] = await ctx.db
        .update(attendance)
        .set({
          checkedInAt: newCheckIn,
          checkedOutAt: newCheckOut,
          hoursWorked: newHours,
        })
        .where(eq(attendance.id, existing.id))
        .returning();
      return updated;
    }),

  /** Notatka do dnia. */
  setNote: protectedProcedure
    .input(attendanceSetNoteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);
      const role = ctx.session.user.role;
      const targetUserId = resolveTargetUserId(
        input.userId,
        ctx.session.user.id,
        role,
      );
      assertWorkerCanEditDate(input.date, role);

      const existing = await ctx.db.query.attendance.findFirst({
        where: (a, { and: andFn, eq: eqFn }) =>
          andFn(
            eqFn(a.userId, targetUserId),
            eqFn(a.projectId, project.id),
            eqFn(a.date, input.date),
          ),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brak rekordu obecności dla tego dnia",
        });
      }
      const [updated] = await ctx.db
        .update(attendance)
        .set({ note: input.note })
        .where(eq(attendance.id, existing.id))
        .returning();
      return updated;
    }),

  /** Anuluje obecność (np. kliknięcie przez pomyłkę / "nie byłem"). */
  cancel: protectedProcedure
    .input(attendanceCancelInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);
      const role = ctx.session.user.role;
      const targetUserId = resolveTargetUserId(
        input.userId,
        ctx.session.user.id,
        role,
      );
      assertWorkerCanEditDate(input.date, role);

      await ctx.db
        .delete(attendance)
        .where(
          and(
            eq(attendance.userId, targetUserId),
            eq(attendance.projectId, project.id),
            eq(attendance.date, input.date),
          ),
        );
      return { success: true };
    }),

  /** Manager: lista wszystkich userów + ich obecność na dany dzień. */
  listForDate: protectedProcedure
    .input(attendanceListForDateInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);

      const rows = await ctx.db
        .select({
          userId: user.id,
          name: user.name,
          username: user.username,
          company: user.company,
          role: user.role,
          attendanceId: attendance.id,
          checkedInAt: attendance.checkedInAt,
          checkedOutAt: attendance.checkedOutAt,
          hoursWorked: attendance.hoursWorked,
          note: attendance.note,
        })
        .from(user)
        .leftJoin(
          attendance,
          and(
            eq(attendance.userId, user.id),
            eq(attendance.projectId, project.id),
            eq(attendance.date, input.date),
          ),
        )
        .orderBy(asc(user.name));

      return rows.map((r) => ({
        userId: r.userId,
        name: r.name,
        username: r.username,
        company: r.company,
        role: r.role,
        present: r.attendanceId !== null,
        checkedInAt: r.checkedInAt,
        checkedOutAt: r.checkedOutAt,
        hoursWorked: r.hoursWorked === null ? null : Number(r.hoursWorked),
        note: r.note,
      }));
    }),

  /** Manager: tabela user × dzień miesiąca + suma godzin. */
  monthlyReport: protectedProcedure
    .input(attendanceMonthlyReportInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);

      const monthStr = String(input.month).padStart(2, "0");
      const start = `${input.year}-${monthStr}-01`;
      // Postgres porównuje string daty leksykograficznie — wygodne
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const end = `${input.year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

      const rows = await ctx.db
        .select({
          userId: attendance.userId,
          name: user.name,
          company: user.company,
          date: attendance.date,
          hoursWorked: attendance.hoursWorked,
          note: attendance.note,
        })
        .from(attendance)
        .innerJoin(user, eq(user.id, attendance.userId))
        .where(
          and(
            eq(attendance.projectId, project.id),
            gte(attendance.date, start),
            lte(attendance.date, end),
          ),
        )
        .orderBy(asc(user.name), asc(attendance.date));

      // Grupuj per user
      const byUser = new Map<
        string,
        {
          userId: string;
          name: string;
          company: string | null;
          days: Record<string, { hours: number | null; note: string | null }>;
          totalHours: number;
        }
      >();

      for (const r of rows) {
        const entry = byUser.get(r.userId) ?? {
          userId: r.userId,
          name: r.name,
          company: r.company,
          days: {},
          totalHours: 0,
        };
        const hours = r.hoursWorked === null ? null : Number(r.hoursWorked);
        entry.days[r.date] = { hours, note: r.note };
        if (hours !== null) entry.totalHours += hours;
        byUser.set(r.userId, entry);
      }

      return {
        year: input.year,
        month: input.month,
        daysInMonth: lastDay,
        users: Array.from(byUser.values()),
      };
    }),

  /** Manager: CSV do pobrania (płaski format pracownik|firma|data|godziny|notatka). */
  exportMonth: protectedProcedure
    .input(attendanceMonthlyReportInputSchema)
    .query(async ({ ctx, input }) => {
      const project = await getProjectZ4(ctx);
      const monthStr = String(input.month).padStart(2, "0");
      const start = `${input.year}-${monthStr}-01`;
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const end = `${input.year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

      const rows = await ctx.db
        .select({
          name: user.name,
          company: user.company,
          date: attendance.date,
          hoursWorked: attendance.hoursWorked,
          note: attendance.note,
        })
        .from(attendance)
        .innerJoin(user, eq(user.id, attendance.userId))
        .where(
          and(
            eq(attendance.projectId, project.id),
            gte(attendance.date, start),
            lte(attendance.date, end),
          ),
        )
        .orderBy(asc(user.name), asc(attendance.date));

      const header = "Pracownik;Firma;Data;Godziny;Notatka";
      const lines = rows.map((r) => {
        const csvEscape = (v: string | null) =>
          v === null ? "" : `"${v.replace(/"/g, '""')}"`;
        const hours =
          r.hoursWorked === null ? "" : Number(r.hoursWorked).toFixed(2);
        return [
          csvEscape(r.name),
          csvEscape(r.company),
          r.date,
          hours,
          csvEscape(r.note),
        ].join(";");
      });

      // BOM dla Excel + CRLF
      const csv = "﻿" + [header, ...lines].join("\r\n");
      return {
        filename: `obecnosc-${input.year}-${monthStr}.csv`,
        content: csv,
      };
    }),

  /** Stats helper — ile osób dziś (do dashboardu managera, opcjonalne). */
  todayCount: protectedProcedure.query(async ({ ctx }) => {
    const project = await getProjectZ4(ctx);
    const today = todayPl();
    const [row] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendance)
      .where(
        and(
          eq(attendance.projectId, project.id),
          eq(attendance.date, today),
        ),
      );
    return { date: today, count: row?.count ?? 0 };
  }),
} satisfies TRPCRouterRecord;
