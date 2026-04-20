import { index, pgEnum, pgTable } from "drizzle-orm/pg-core";

import { user } from "../auth-schema";
import { projects } from "./projects";
import { units } from "./units";

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "submitted",
  "done",
]);

export const tasks = pgTable(
  "tasks",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    projectId: t
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    unitId: t
      .uuid()
      .references(() => units.id, { onDelete: "set null" }),
    title: t.text().notNull(),
    description: t.text(),
    status: taskStatusEnum().notNull().default("open"),
    assignedToId: t
      .text()
      .references(() => user.id, { onDelete: "set null" }),
    createdById: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    completionNote: t.text(),
    completionPhotoPath: t.text(),
    submittedAt: t.timestamp({ mode: "date", withTimezone: true }),
    dueDate: t.timestamp({ mode: "date", withTimezone: true }),
    createdAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [
    index("tasks_project_idx").on(table.projectId),
    index("tasks_unit_idx").on(table.unitId),
    index("tasks_status_idx").on(table.status),
    index("tasks_assigned_to_idx").on(table.assignedToId),
    index("tasks_created_by_idx").on(table.createdById),
  ],
);
