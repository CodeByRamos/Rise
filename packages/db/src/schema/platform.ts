import {
  pgTable,
  text,
  integer,
  bigserial,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
