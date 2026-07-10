import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { citext } from "./types";
import { planTier, userStatus } from "./enums";

/** docs/08-banco-de-dados.md §3 — Identidade e perfil. */

// A conta. Mínima e estável. `id` espelha auth.users.id do Supabase Auth.
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: citext("email").notNull().unique(),
    handle: citext("handle").notNull().unique(),
    plan: planTier("plan").default("free").notNull(),
    status: userStatus("status").default("active").notNull(),
    orgId: uuid("org_id"), // FK organizations (Fase 3) — sem FK ainda
    locale: text("locale").default("pt-BR").notNull(),
    timezone: text("timezone").default("America/Sao_Paulo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    check("users_handle_format", sql`${t.handle} ~ '^[a-z0-9_]{3,20}$'`),
    index("users_org_idx").on(t.orgId).where(sql`${t.orgId} is not null`),
    index("users_plan_idx").on(t.plan),
  ],
);

// Perfil público/cosmético — separado por ser lido em volume no feed/ranking.
export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"), // caminho no bucket público `avatars`
    bio: text("bio"),
    // Classe principal declarada (slug de CLASS_CATALOG em @rise/core). Identidade
    // cosmética — nunca concede XP/vantagem. Base das futuras Guerras de Classe.
    mainClassId: text("main_class_id"),
    // Slugs de cosmetic_items (FK adicionada via SQL na migração — evita ciclo de import).
    equippedThemeId: text("equipped_theme_id"),
    equippedFrameId: text("equipped_frame_id"),
    equippedBadgeId: uuid("equipped_badge_id"),
    isSearchable: boolean("is_searchable").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [check("profiles_bio_len", sql`length(${t.bio}) <= 280`)],
);

// Provedores de auth (espelho do necessário do Supabase Auth).
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("accounts_provider_uq").on(t.provider, t.providerAccountId),
  ],
);

// Preferências não-públicas (reduce-motion, Modo Descanso global, unidades).
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  restModeUntil: timestamp("rest_mode_until", { withTimezone: true }),
  prefs: jsonb("prefs").$type<Record<string, unknown>>().default({}).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
