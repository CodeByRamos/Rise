-- 0019 — Tokens de push nativo (Expo) para o app mobile (docs/18 mobile Fase 3)
--
-- O push nativo usa ExponentPushToken (um por dispositivo) enviado pela Expo
-- Push API — diferente do Web Push (VAPID) da tabela push_subscriptions. Token é
-- PK; ao relogar no mesmo aparelho, o dono é reatribuído (ON CONFLICT).

CREATE TABLE IF NOT EXISTS "expo_push_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expo_push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);
CREATE INDEX IF NOT EXISTS "expo_push_tokens_user_idx" ON "expo_push_tokens" USING btree ("user_id");

ALTER TABLE "expo_push_tokens" ENABLE ROW LEVEL SECURITY;
