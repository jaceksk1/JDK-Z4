import { index, pgEnum, pgTable } from "drizzle-orm/pg-core";

import { user } from "../auth-schema";
import { projects } from "./projects";
import { units } from "./units";

export const questionStatusEnum = pgEnum("question_status", [
  "open",
  "answered",
  "resolved",
]);

export const questions = pgTable(
  "questions",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    projectId: t
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // Opcjonalne powiązanie z jednostką (mieszkanie, LU, MP, KL)
    unitId: t
      .uuid()
      .references(() => units.id, { onDelete: "set null" }),
    content: t.text().notNull(),
    status: questionStatusEnum().notNull().default("open"),
    // Kto zadał pytanie
    askedById: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Odpowiedź (NULL dopóki nie odpowiedziano)
    answer: t.text(),
    answeredById: t
      .text()
      .references(() => user.id, { onDelete: "set null" }),
    answeredAt: t.timestamp({ mode: "date", withTimezone: true }),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [
    index("questions_project_idx").on(table.projectId),
    index("questions_unit_idx").on(table.unitId),
    index("questions_status_idx").on(table.status),
    index("questions_asked_by_idx").on(table.askedById),
  ],
);
