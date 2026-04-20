import { index, pgTable } from "drizzle-orm/pg-core";

import { projects } from "./projects";

export const buildings = pgTable(
  "buildings",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    projectId: t
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: t.text().notNull(), // "A", "B"
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [index("buildings_project_idx").on(table.projectId)],
);
