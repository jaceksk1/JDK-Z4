import { index, pgEnum, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { units } from "./units";

export const stageStatusEnum = pgEnum("stage_status", [
  "pending",
  "done",
  "issue",
]);

/**
 * Szablony etapów per typ jednostki.
 * Seeded razem z projektem — nie edytowane z UI.
 */
export const stageTemplates = pgTable(
  "stage_templates",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    unitType: t.text().notNull(), // apartment | commercial | parking | storage
    name: t.text().notNull(),
    sortOrder: t.integer().notNull(),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (table) => [
    uniqueIndex("stage_templates_type_order_unique").on(
      table.unitType,
      table.sortOrder,
    ),
    index("stage_templates_unit_type_idx").on(table.unitType),
  ],
);

/**
 * Instancje etapów per jednostka.
 * Tworzone automatycznie przy pierwszym otwarciu detail sheeta.
 */
export const unitStages = pgTable(
  "unit_stages",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    unitId: t
      .uuid()
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    stageTemplateId: t
      .uuid()
      .notNull()
      .references(() => stageTemplates.id, { onDelete: "cascade" }),
    status: stageStatusEnum().notNull().default("pending"),
    completedAt: t.timestamp({ mode: "date", withTimezone: true }),
    completedBy: t.text(), // user ID (string from Better Auth)
    notes: t.text(),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [
    uniqueIndex("unit_stages_unit_template_unique").on(
      table.unitId,
      table.stageTemplateId,
    ),
    index("unit_stages_unit_idx").on(table.unitId),
  ],
);
