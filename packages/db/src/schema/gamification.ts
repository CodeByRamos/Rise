import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { lifeAreas } from "./progress";
import { streakState, missionStatus } from "./enums";

/** docs/08-banco-de-dados.md §6 — Gamificação (Fase 1: Streaks). */

// Estado de Sequência por área e geral, com amortecedores (doc 13 §5).
export const streaks = pgTable(
  "streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lifeAreaId: uuid("life_area_id").references(() => lifeAreas.id), // NULL ⇒ geral
    currentCount: integer("current_count").default(0).notNull(),
    longestCount: integer("longest_count").default(0).notNull(),
    freezesAvailable: integer("freezes_available").default(0).notNull(), // máx 2
    lastActiveDate: date("last_active_date").notNull(),
    graceUntil: timestamp("grace_until", { withTimezone: true }),
    state: streakState("state").default("active").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("streaks_user_area_uq").on(t.userId, t.lifeAreaId),
    index("streaks_user_state_idx").on(t.userId, t.state),
  ],
);

// Missões diárias do usuário (doc 13 §6.1). Templates vivem no código
// (seed/mission-templates.ts) — dados copiados aqui para o dia ser imutável;
// catálogo em DB entra quando o Coach gerar missões dinâmicas.
export const userMissions = pgTable(
  "user_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    templateId: text("template_id").notNull(), // slug do template
    title: text("title").notNull(),
    metric: text("metric").notNull(), // acoes | areas_distintas | nota_longa
    target: integer("target").notNull(),
    progress: integer("progress").default(0).notNull(),
    xpReward: integer("xp_reward").notNull(),
    sparksReward: integer("sparks_reward").notNull(),
    status: missionStatus("status").default("pending").notNull(),
    /** Dia civil LOCAL (users.timezone) para o qual a missão vale. */
    assignedDate: date("assigned_date").notNull(),
    /** Estado auxiliar por métrica (ex.: áreas distintas já vistas). */
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("user_missions_day_uq").on(t.userId, t.templateId, t.assignedDate),
    index("user_missions_user_day_idx").on(t.userId, t.assignedDate, t.status),
  ],
);
