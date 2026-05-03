import { z } from "zod/v4";

/** YYYY-MM-DD (lokalna data PL). */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie YYYY-MM-DD");

/** HH:MM (24h, lokalny czas PL). */
export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Czas musi być w formacie HH:MM");

export const attendanceCheckInInputSchema = z.object({
  /** Domyślnie dzisiaj (PL); worker może podać "wczoraj" do uzupełnienia. */
  date: dateStringSchema.optional(),
  note: z.string().max(500).optional(),
});

export const attendanceCheckOutInputSchema = z.object({
  date: dateStringSchema.optional(),
});

export const attendanceSetTimesInputSchema = z.object({
  date: dateStringSchema,
  /** HH:MM PL — godzina wejścia. Brak = bez zmian. */
  checkInTime: timeStringSchema.optional(),
  /** HH:MM PL — godzina wyjścia. null = wyczyść; brak = bez zmian. */
  checkOutTime: timeStringSchema.nullable().optional(),
  /** Tylko manager/admin — edycja cudzego rekordu. */
  userId: z.string().optional(),
});

export const attendanceSetNoteInputSchema = z.object({
  date: dateStringSchema,
  note: z.string().max(500).nullable(),
  userId: z.string().optional(),
});

export const attendanceCancelInputSchema = z.object({
  date: dateStringSchema,
  userId: z.string().optional(),
});

export const attendanceListForDateInputSchema = z.object({
  date: dateStringSchema,
});

export const attendanceMonthlyReportInputSchema = z.object({
  year: z.number().int().min(2024).max(2100),
  month: z.number().int().min(1).max(12),
});

export type AttendanceCheckInInput = z.infer<
  typeof attendanceCheckInInputSchema
>;
export type AttendanceCheckOutInput = z.infer<
  typeof attendanceCheckOutInputSchema
>;
export type AttendanceSetTimesInput = z.infer<
  typeof attendanceSetTimesInputSchema
>;
