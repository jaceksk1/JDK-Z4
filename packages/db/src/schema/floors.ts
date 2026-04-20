import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { projects } from "./projects";

export const floors = pgTable(
  "floors",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    projectId: t
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Wyświetlana nazwa: "Parter", "Piętro 1", "Garaż" */
    label: t.text().notNull(),
    /** Numer kondygnacji z designatora projektowego (1, 2, 3…) — NULL dla garażu */
    designatorKey: t.integer(),
    /** Faktyczny numer piętra: 0 = parter, 1 = piętro 1… -1 = garaż */
    storey: t.integer().notNull(),
    /** Kolejność wyświetlania */
    sortOrder: t.integer().notNull(),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [
    index("floors_project_idx").on(table.projectId),
    uniqueIndex("floors_project_storey_unique").on(
      table.projectId,
      table.storey,
    ),
  ],
);
