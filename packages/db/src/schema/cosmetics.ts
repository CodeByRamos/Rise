import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  boolean,
  bigserial,
  bigint,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";

/**
 * docs/08 §9 — Economia cosmética (isolada do XP, ADR 0007) + feed de marcos.
 * NENHUMA FK para xp_events/levels/rankings. Preços transparentes, sem loot box.
 */

// Catálogo de cosméticos. Slug PK (seed no código, dados no banco p/ FK/compra).
export const cosmeticItems = pgTable("cosmetic_items", {
  id: text("id").primaryKey(), // slug: frame-emerald, theme-azure…
  name: text("name").notNull(),
  kind: text("kind").notNull(), // frame | theme
  priceSparks: integer("price_sparks").notNull(),
  /** Dados de render (cores/gradiente) — o cliente desenha a partir disto. */
  preview: jsonb("preview").$type<Record<string, unknown>>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Inventário: o que cada usuário possui.
export const inventory = pgTable(
  "inventory",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    itemId: text("item_id")
      .notNull()
      .references(() => cosmeticItems.id),
    acquiredAt: timestamp("acquired_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemId] })],
);

// Feed de MARCOS de progresso (nunca o conteúdo da prova — privacidade).
export const feedItems = pgTable(
  "feed_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(), // level.up | streak.milestone | missions.day
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("feed_items_created_idx").on(t.createdAt)],
);

// Notificações in-app (sino). Escritas inline em seguir/reagir.
export const notifications = pgTable(
  "notifications",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id") // destinatário
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(), // follow | reaction
    actorId: uuid("actor_id") // quem gerou
      .notNull()
      .references(() => users.id),
    feedItemId: bigint("feed_item_id", { mode: "number" }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

// Grafo social: quem segue quem (doc 08 — FriendEdge/Follow).
export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follows_following_idx").on(t.followingId),
  ],
);

// Reações — APENAS positivas ("Força", o chevron da marca). Sem dislike (doc 08).
export const reactions = pgTable(
  "reactions",
  {
    feedItemId: bigint("feed_item_id", { mode: "number" })
      .notNull()
      .references(() => feedItems.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.feedItemId, t.userId] })],
);
