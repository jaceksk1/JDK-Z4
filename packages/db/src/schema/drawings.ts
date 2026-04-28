import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { projects } from "./projects";

export const drawings = pgTable(
  "drawings",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    projectId: t
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Kod rysunku bez segmentu wersji, np. "6295_01_PW_ELE_XXX_XXX_X_RYS_001" */
    fileCode: t.text().notNull(),
    /** Opis tekstowy — np. "Schemat tablicy TR1.4 — klatka A1, parter" */
    description: t.text().notNull(),
    /** Branża: ELE, SAN, KON, ARCH… (z 4. segmentu kodu, ale dublujemy do filtrów) */
    discipline: t.text(),
    /** Faza: PW, KZM, NA… (z 3. segmentu kodu) */
    phase: t.text(),
    /** Aktualna rewizja (z ostatniego segmentu kodu, np. "01_02") — informacyjnie */
    revision: t.text(),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [
    index("drawings_project_idx").on(table.projectId),
    uniqueIndex("drawings_project_filecode_unique").on(
      table.projectId,
      table.fileCode,
    ),
  ],
);
