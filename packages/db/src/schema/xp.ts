import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  bigserial,
  numeric,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { lifeAreas, actionLogs } from "./progress";
import { levelScope } from "./enums";

/** docs/08-banco-de-dados.md §5 — Economia de XP (event sourcing). ADR 0006. */

// ⚡ Livro-razão imutável: a FONTE DA VERDADE do progresso. Append-only.
// Estorno é novo evento (xp.reversed, amount negativo). Nunca UPDATE/DELETE
// (reforçado por RLS + trigger prevent_mutation na migração).
export const xpEvents = pgTable(
  "xp_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lifeAreaId: uuid("life_area_id")
      .notNull()
      .references(() => lifeAreas.id),
    actionLogId: bigint("action_log_id", { mode: "number" }).references(
      () => actionLogs.id,
    ),
    eventType: text("event_type").notNull(), // xp.granted | xp.reversed
    amount: bigint("amount", { mode: "number" }).notNull(), // negativo se reversão
    baseAmount: bigint("base_amount", { mode: "number" }).notNull(),
    streakMult: numeric("streak_mult", { precision: 4, scale: 2 })
      .default("1.00")
      .notNull(),
    // Self-FK para xp_events.id em xp.reversed — adicionada via SQL na migração
    // para evitar dependência circular no schema TS.
    reversesEventId: bigint("reverses_event_id", { mode: "number" }),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("xp_events_idem_uq").on(t.idempotencyKey),
    index("xp_events_user_area_created_idx").on(
      t.userId,
      t.lifeAreaId,
      t.createdAt,
    ),
    index("xp_events_created_idx").on(t.createdAt),
  ],
);

// Projeção materializada do nível por Área e do Nível Rise. Recomputável do ledger.
export const levels = pgTable(
  "levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lifeAreaId: uuid("life_area_id").references(() => lifeAreas.id), // NULL ⇒ Nível Rise
    scope: levelScope("scope").notNull(),
    totalXp: bigint("total_xp", { mode: "number" }).default(0).notNull(),
    level: integer("level").default(0).notNull(),
    xpIntoLevel: bigint("xp_into_level", { mode: "number" })
      .default(0)
      .notNull(),
    xpToNext: bigint("xp_to_next", { mode: "number" }).notNull(),
    prestige: integer("prestige").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("levels_area_uq").on(t.userId, t.lifeAreaId, t.scope),
    uniqueIndex("levels_rise_uq")
      .on(t.userId)
      .where(sql`${t.scope} = 'rise'`),
    index("levels_scope_level_idx").on(t.scope, t.level),
  ],
);

// Agregado quente, atualizado na mesma transação da ação. Lido em todo dashboard.
export const userStats = pgTable("user_stats", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  riseLevel: integer("rise_level").default(0).notNull(),
  totalXpAll: bigint("total_xp_all", { mode: "number" }).default(0).notNull(),
  activeAreas: integer("active_areas").default(0).notNull(), // p/ fator_amplitude
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
