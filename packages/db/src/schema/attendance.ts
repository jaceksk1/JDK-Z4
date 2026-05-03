import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth-schema";
import { projects } from "./projects";

/**
 * Obecność pracownika danego dnia w danym projekcie.
 * Jeden rekord per (user, project, date). Worker może edytować dziś i wczoraj;
 * manager/admin — bez ograniczeń. `hoursWorked` może być wyliczone automatycznie
 * z różnicy checkedIn/checkedOut lub wpisane ręcznie (override).
 */
export const attendance = pgTable(
  "attendance",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: t
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Lokalna data PL w formacie YYYY-MM-DD (Europe/Warsaw). */
    date: t.date({ mode: "string" }).notNull(),
    /** Moment "jestem dziś" — strefa czasowa zachowana. */
    checkedInAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    /** Moment "wychodzę" — opcjonalny. */
    checkedOutAt: t.timestamp({ mode: "date", withTimezone: true }),
    /** Godziny przepracowane (auto z różnicy lub ręczny override), 0..24. */
    hoursWorked: t.numeric({ precision: 4, scale: 2 }),
    /** Wolna notatka, np. "L4", "delegacja", "spóźniony". */
    note: t.text(),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [
    uniqueIndex("attendance_user_project_date_unique").on(
      table.userId,
      table.projectId,
      table.date,
    ),
    index("attendance_project_date_idx").on(table.projectId, table.date),
    index("attendance_user_idx").on(table.userId),
  ],
);
