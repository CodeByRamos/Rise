import {
  pgTable,
  uuid,
  text,
  bigint,
  bigserial,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";

/**
 * docs/08-banco-de-dados.md §9 — Economia cosmética (Faíscas). ADR 0007.
 *
 * ISOLAMENTO ESTRUTURAL: NENHUMA tabela deste arquivo referencia xp_events,
 * levels ou rankings. Não existe caminho de schema que converta Faíscas em
 * progresso competitivo — pay-to-win é impossível por design, não por política.
 * Só há FK para `users`. Não importe xp/levels aqui. Jamais.
 */

// Carteira de Faíscas.
export const sparksWallet = pgTable(
  "sparks_wallet",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id),
    balance: bigint("balance", { mode: "number" }).default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [check("sparks_balance_nonneg", sql`${t.balance} >= 0`)],
);

// Livro-razão de Faíscas (append-only, auditoria financeira).
export const sparksLedger = pgTable(
  "sparks_ledger",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    delta: bigint("delta", { mode: "number" }).notNull(), // + ganho / − gasto
    reason: text("reason").notNull(), // purchase | season_reward | stipend | cosmetic_buy
    refId: uuid("ref_id"), // item/listing relacionado (sem FK cruzado com XP)
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("sparks_ledger_user_idx").on(t.userId, t.createdAt)],
);
