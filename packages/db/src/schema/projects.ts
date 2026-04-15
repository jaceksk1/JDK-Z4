import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  name: t.text().notNull(),
  code: t.text().notNull().unique(), // np. "Z4"
  createdAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));
