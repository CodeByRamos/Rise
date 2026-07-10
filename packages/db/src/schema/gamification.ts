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
  primaryKey,
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
    // Streak repair (§5.3): valor da sequência quebrada + janela de 24h + limite semanal.
    pendingRepairValue: integer("pending_repair_value"),
    repairDeadline: timestamp("repair_deadline", { withTimezone: true }),
    lastRepairAt: timestamp("last_repair_at", { withTimezone: true }),
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

// Resgates de marcos da Temporada Solo (doc 13 §7). A temporada é o mês civil
// UTC (chave "AAAA-MM", derivada em @rise/core) — sem tabela de temporadas,
// reset implícito pela janela (mesma filosofia da Liga semanal). PK composta
// impede resgate duplo por construção. Reset nunca toca XP/nível/conquista.
export const seasonClaims = pgTable(
  "season_claims",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    seasonKey: text("season_key").notNull(), // "2026-07"
    milestoneXp: integer("milestone_xp").notNull(), // marco resgatado (500, 1500…)
    claimedAt: timestamp("claimed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.seasonKey, t.milestoneXp] })],
);

// Conquistas desbloqueadas — PERMANENTES (doc 13: o que sobe, fica).
// Catálogo/critérios vivem em @rise/core (ACHIEVEMENT_CATALOG).
export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    achievementId: text("achievement_id").notNull(), // slug do catálogo
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);
