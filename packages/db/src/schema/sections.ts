import { sql } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

import { buildings } from "./buildings";

export const sections = pgTable(
  "sections",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    buildingId: t
      .uuid()
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    name: t.text().notNull(), // "A1", "A2", "B1", "B2"
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (table) => [index("sections_building_idx").on(table.buildingId)],
);
