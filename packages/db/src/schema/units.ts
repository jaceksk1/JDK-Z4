import { index, pgEnum, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { buildings } from "./buildings";
import { floors } from "./floors";
import { projects } from "./projects";
import { sections } from "./sections";

export const unitStatusEnum = pgEnum("unit_status", [
  "not_started",
  "in_progress",
  "to_check",
  "done",
  "issue",
]);

export const unitTypeEnum = pgEnum("unit_type", [
  "apartment",
  "commercial",
  "parking",
  "storage",
]);

export const units = pgTable(
  "units",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    projectId: t
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // NULL dla parkingów i komórek (MP, KL)
    buildingId: t
      .uuid()
      .references(() => buildings.id, { onDelete: "set null" }),
    // NULL dla parkingów i komórek (MP, KL)
    sectionId: t
      .uuid()
      .references(() => sections.id, { onDelete: "set null" }),
    type: unitTypeEnum().notNull(),
    // Unikalny oznacznik lokalu: "A1.2.5", "A1.U.1", "MP20", "KL 1"
    designator: t.text().notNull(),
    // FK do tabeli floors — NULL dla KL (komórki lokatorskie)
    floorId: t
      .uuid()
      .references(() => floors.id, { onDelete: "set null" }),
    status: unitStatusEnum().notNull().default("not_started"),
    // Kod karty (klatka.piętro.numer): "A1.1.5" dla mieszkań, "A1.U.1" dla LU.
    // Folder na NAS: BUDYNEK X/PDF/{cardCode}/{cardCode}.{karta|osw|gn}.pdf
    cardCode: t.text(),
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
    uniqueIndex("units_project_designator_unique").on(
      table.projectId,
      table.designator,
    ),
    index("units_project_idx").on(table.projectId),
    index("units_section_idx").on(table.sectionId),
    index("units_status_idx").on(table.status),
    index("units_type_idx").on(table.type),
  ],
);
