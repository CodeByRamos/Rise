import {
  pgTable,
  text,
  integer,
  bigserial,
  jsonb,
  boolean,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";

/** docs/08-banco-de-dados.md §12 — Billing & Plataforma (outbox, flags). */

// Outbox transacional (ADR: gravada na MESMA transação das mutações; drenada
// por worker → Inngest, garantindo entrega exactly-once efetiva sem 2PC).
export const outbox = pgTable(
  "outbox",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    eventType: text("event_type").notNull(), // level.up | streak.extended | feed.fanout…
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: text("status").default("pending").notNull(), // pending | dispatched | failed
    attempts: integer("attempts").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  },
  (t) => [
    index("outbox_pending_idx")
      .on(t.status, t.createdAt)
      .where(sql`${t.status} = 'pending'`),
  ],
);

// Flags/kill-switch (Admin P0). Espelho server-side de flags do PostHog.
export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").default(false).notNull(),
  rollout: jsonb("rollout").$type<Record<string, unknown>>().default({}).notNull(),
});

// Análise Profunda do Coach (docs/14 §3, docs/12 §3) — camada Opus, gated
// Premium. Persistida por período para NÃO recobrar o Opus a cada releitura
// (uma análise por semana por usuário). `facts` guarda o bloco FATOS que
// ancorou a geração (auditoria anti-alucinação).
export const coachAnalyses = pgTable(
  "coach_analyses",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").default("weekly_deep").notNull(),
    model: text("model").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    facts: jsonb("facts").$type<Record<string, unknown>>().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Uma análise por (usuário, tipo, início-do-período): a 2ª geração da
    // mesma semana é dedupe, não uma segunda cobrança de Opus.
    uniqueIndex("coach_analyses_user_period_uq").on(
      t.userId,
      t.kind,
      t.periodStart,
    ),
    index("coach_analyses_user_idx").on(t.userId, t.createdAt),
  ],
);
