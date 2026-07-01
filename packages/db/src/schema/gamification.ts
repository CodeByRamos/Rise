import {
  pgTable,
  uuid,
  integer,
  date,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { lifeAreas } from "./progress";
import { streakState } from "./enums";

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
