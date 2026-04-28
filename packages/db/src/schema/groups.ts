import { primaryKey, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth-schema";

/**
 * Grupa uprawnień — łączy nazwany zbiór modułów (group_modules) z listą
 * członków (user_groups). User może być w wielu grupach — efektywne
 * uprawnienia to suma modułów ze wszystkich jego grup. Admin (user.role)
 * widzi wszystko niezależnie od grup.
 */
export const groups = pgTable(
  "groups",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    name: t.text().notNull(),
    description: t.text(),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [uniqueIndex("groups_name_unique").on(table.name)],
);

/** Moduły dostępne dla grupy. moduleKey = element MODULE_KEYS z @acme/validators. */
export const groupModules = pgTable(
  "group_modules",
  (t) => ({
    groupId: t
      .uuid()
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    moduleKey: t.text().notNull(),
  }),
  (table) => [primaryKey({ columns: [table.groupId, table.moduleKey] })],
);

/** Członkowie grupy (M:N user ↔ groups). */
export const userGroups = pgTable(
  "user_groups",
  (t) => ({
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    groupId: t
      .uuid()
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    addedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.userId, table.groupId] })],
);
