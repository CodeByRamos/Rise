-- 0017 — Reparo de drift + índices de performance (docs/18 C3, M5)
--
-- DRIFT: o journal do Drizzle registra 0011 (season_claims) e 0012 (push_subscriptions)
-- como aplicadas, mas as tabelas NÃO existem na produção — Push e claim de Temporada
-- retornam 500 hoje. Recriamos idempotentemente (IF NOT EXISTS) a partir do DDL
-- canônico dessas migrações. FK/unique/índice inline só rodam quando a tabela nasce.
--
-- ÍNDICE: xp_events(action_log_id) é o ausente mais grave — `diario`/`diaDetalhe`
-- fazem LEFT JOIN por esse campo e sem o índice materializam a tabela inteira.
-- Volume atual é baixo, então CREATE INDEX simples é instantâneo; em escala, criar
-- com CONCURRENTLY fora de transação.

-- 1) season_claims (0011)
CREATE TABLE IF NOT EXISTS "season_claims" (
	"user_id" uuid NOT NULL,
	"season_key" text NOT NULL,
	"milestone_xp" integer NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_claims_user_id_season_key_milestone_xp_pk" PRIMARY KEY("user_id","season_key","milestone_xp"),
	CONSTRAINT "season_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);

-- 2) push_subscriptions (0012)
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint"),
	CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");

-- 3) RLS nas tabelas recém-criadas (deny-by-default, igual à 0016).
ALTER TABLE "season_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;

-- 4) Índices de performance (docs/18 §1.3, M9)
CREATE INDEX IF NOT EXISTS "xp_events_action_log_idx" ON "xp_events" USING btree ("action_log_id");
CREATE INDEX IF NOT EXISTS "feed_items_user_id_idx" ON "feed_items" USING btree ("user_id","id");
CREATE INDEX IF NOT EXISTS "notifications_unread_idx" ON "notifications" USING btree ("user_id") WHERE "read_at" IS NULL;
