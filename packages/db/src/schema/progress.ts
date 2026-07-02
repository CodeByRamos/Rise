import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  bigserial,
  numeric,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { goalStatus, taskStatus, actionStatus } from "./enums";

/** docs/08-banco-de-dados.md §4 — Estrutura de progresso. */

// Catálogo das 15 Áreas da Vida canônicas. Áreas custom NÃO entram aqui.
export const lifeAreaCatalog = pgTable("life_area_catalog", {
  id: text("id").primaryKey(), // slug: 'estudos', 'programacao', …
  namePt: text("name_pt").notNull(),
  nameEn: text("name_en").notNull(),
  colorToken: text("color_token").notNull(),
  icon: text("icon").notNull(),
  baseXpTable: jsonb("base_xp_table").$type<Record<string, number>>().notNull(),
  isDefault: boolean("is_default").default(true).notNull(),
});

// Instância de Área da Vida por usuário (padrão ou custom). Nível/XP agregado aqui.
export const lifeAreas = pgTable(
  "life_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    catalogId: text("catalog_id").references(() => lifeAreaCatalog.id), // NULL ⇒ custom
    name: text("name").notNull(),
    colorToken: text("color_token").notNull(),
    icon: text("icon").notNull(),
    // Projeção (cache) de xp_events; a verdade é o ledger. Recomputável.
    totalXp: bigint("total_xp", { mode: "number" }).default(0).notNull(),
    level: integer("level").default(0).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("life_areas_user_idx").on(t.userId, t.isArchived),
    uniqueIndex("life_areas_user_catalog_uq")
      .on(t.userId, t.catalogId)
      .where(sql`${t.catalogId} is not null`),
    check("life_areas_xp_nonneg", sql`${t.totalXp} >= 0`),
  ],
);

// Hábitos recorrentes (cadência diária/semanal).
export const habits = pgTable(
  "habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lifeAreaId: uuid("life_area_id")
      .notNull()
      .references(() => lifeAreas.id),
    title: text("title").notNull(),
    cadence: jsonb("cadence").$type<Record<string, unknown>>().notNull(),
    targetCount: integer("target_count").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("habits_user_active_idx").on(t.userId, t.isActive)],
);

// Metas pessoais com prazo e progresso.
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lifeAreaId: uuid("life_area_id")
      .notNull()
      .references(() => lifeAreas.id),
    title: text("title").notNull(),
    targetValue: numeric("target_value", { precision: 12, scale: 2 }).notNull(),
    currentValue: numeric("current_value", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    unit: text("unit"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: goalStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("goals_user_status_idx").on(t.userId, t.status, t.dueAt)],
);

// Tarefas/check-ins concretos. Marcar como feito → vira action_log.
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lifeAreaId: uuid("life_area_id")
      .notNull()
      .references(() => lifeAreas.id),
    habitId: uuid("habit_id").references(() => habits.id),
    goalId: uuid("goal_id").references(() => goals.id),
    title: text("title").notNull(),
    status: taskStatus("status").default("pending").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("tasks_user_status_idx").on(t.userId, t.status, t.dueAt)],
);

// ⚡ Caminho quente: registro imutável de uma Ação que concede XP.
// Idempotente por (user_id, client_action_id). Particionamento mensal por
// created_at é migração de escala (doc 08 §13) — não pré-otimizado aqui.
export const actionLogs = pgTable(
  "action_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lifeAreaId: uuid("life_area_id")
      .notNull()
      .references(() => lifeAreas.id),
    taskId: uuid("task_id").references(() => tasks.id),
    clientActionId: uuid("client_action_id").notNull(),
    kind: text("kind").notNull(), // quick_log | habit_check | integration
    source: text("source").default("manual").notNull(), // manual | healthkit | githubu…
    // PROVA da ação (obrigatória na camada de API: nota OU foto).
    // Vira o conteúdo do feed social na Fase 2.
    note: text("note"),
    photoPath: text("photo_path"), // caminho no bucket `provas` (Supabase Storage)
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    status: actionStatus("status").default("validated").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("action_logs_idem_uq").on(t.userId, t.clientActionId),
    index("action_logs_user_created_idx").on(t.userId, t.createdAt),
    index("action_logs_area_created_idx").on(t.lifeAreaId, t.createdAt),
  ],
);
