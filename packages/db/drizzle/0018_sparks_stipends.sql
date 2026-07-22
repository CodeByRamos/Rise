-- 0018 — Estipêndio mensal de Faíscas do Rise+/Founder (docs/12 §2, docs/18 C5)
--
-- O entitlement monthlySparksStipend (300 Plus / 500 Founder) era vendido e exibido
-- em subscription.status, mas NENHUM código creditava. Esta tabela é o guardião de
-- idempotência: PK (user_id, period) garante um crédito por mês por usuário — o cron
-- diário e o webhook podem disparar em paralelo sem duplicar.

CREATE TABLE IF NOT EXISTS "sparks_stipends" (
	"user_id" uuid NOT NULL,
	"period" text NOT NULL,
	"amount" bigint NOT NULL,
	"plan" text NOT NULL,
	"credited_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sparks_stipends_user_id_period_pk" PRIMARY KEY("user_id","period"),
	CONSTRAINT "sparks_stipends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);
CREATE INDEX IF NOT EXISTS "sparks_stipends_period_idx" ON "sparks_stipends" USING btree ("period");

ALTER TABLE "sparks_stipends" ENABLE ROW LEVEL SECURITY;
