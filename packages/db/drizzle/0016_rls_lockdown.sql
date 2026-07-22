-- 0016 — RLS lockdown / deny-by-default (docs/08 §11, docs/18 C1)
--
-- CONTEXTO: as tabelas foram criadas via conexão direta Drizzle (role `postgres`,
-- owner). No Supabase, os roles `anon` e `authenticated` recebem GRANTs por padrão,
-- e sem RLS o PostgREST expõe TODA tabela em https://<proj>.supabase.co/rest/v1.
-- Verificado em 2026-07-22: a anon key (pública, embarcada no browser) lia `users`
-- (e-mails, plano), `xp_events`, `sparks_wallet`, `user_stats` — vazamento de PII +
-- vetor de forja de XP/Faíscas/plano ignorando 100% dos guardrails do tRPC.
--
-- CORREÇÃO: negar todo acesso de anon/authenticated às tabelas do schema public e
-- habilitar RLS como defesa em profundidade. O app conecta como `postgres` (owner),
-- que IGNORA RLS e mantém todos os privilégios — nada no tRPC quebra. O front usa a
-- anon key apenas para Auth (GoTrue, schema `auth`) e Storage (buckets), não para
-- ler tabelas — confirmado por grep (só `.storage.from(...)`).
--
-- IDEMPOTENTE e à prova de drift: itera sobre as tabelas REAIS do schema public,
-- então tabelas do schema TS que ainda não existem no banco (ex.: push_subscriptions)
-- não quebram a migração.

-- 1) Bloqueia PostgREST: sem privilégios de tabela/sequence, anon/authenticated não
--    leem nem escrevem nada via REST. (Funções de extensão ficam de fora de propósito
--    — não são nossas e gerariam apenas WARNINGs inúteis.)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 2) Tabelas/sequences futuras (criadas pelo owner em migrações) já nascem negadas.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- 3) Defense-in-depth: RLS ligado em TODA tabela existente do schema public. Sem
--    policy = deny-all para não-owner (owner/service_role continua passando).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
