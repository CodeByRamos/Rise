# @rise/db

Schema Drizzle + acesso a dados do Rise (Postgres/Supabase). Fonte da verdade do modelo: [`docs/08-banco-de-dados.md`](../../docs/08-banco-de-dados.md).

## Os três invariantes estruturais

1. **Event sourcing de XP** (ADR 0006) — `xp_events` é append-only e imutável; `levels`/`user_stats`/`life_areas.total_xp` são **projeções recomputáveis**, não a verdade. Permite rebalancear a curva (`50n²+50n`) sem migração destrutiva.
2. **Isolamento Faíscas × XP** (ADR 0007) — `sparks_wallet`/`sparks_ledger` (`schema/economy.ts`) **não têm FK** para `xp_events`/`levels`/`rankings`. Pay-to-win é impossível por design. **Nunca** importe xp/levels em `economy.ts`.
3. **Outbox transacional** — `outbox` grava trabalho assíncrono na mesma transação da mutação; um worker drena para o Inngest (exactly-once efetivo).

## Escopo atual (Fase 1)

Identidade, Áreas da Vida (catálogo + por usuário), Hábitos/Metas/Tarefas, `action_logs`, ledger de XP + projeções, Streaks, Faíscas (isoladas), Outbox e Feature Flags. Social/guilda/temporada/liga/IA/billing/B2B estão no doc 08 e entram nas Fases 2/3 (anti pré-otimização).

## Migrações

O schema TS gera o DDL; o que o drizzle-kit **não** expressa é aplicado como SQL versionado por cima (doc 08 §11–13): **RLS deny-by-default**, trigger `prevent_mutation` no ledger, particionamento mensal de `xp_events`/`action_logs` (gatilho de escala) e `pgvector` (RAG do Coach). A extensão `citext` já vem prependida na migração inicial.

```bash
# Requer um Postgres do Supabase (ver .env.example)
export DATABASE_URL="postgresql://…"

corepack pnpm --filter @rise/db db:generate   # gera SQL a partir do schema (offline)
corepack pnpm --filter @rise/db db:migrate     # aplica no banco
corepack pnpm --filter @rise/db db:studio       # inspeciona
```

> Autorização (doc 08 §11): escritas de **progresso e economia** (`xp_events`, `levels`, `user_stats`, `sparks_*`) são negadas ao cliente via RLS e só ocorrem via `service_role` em mutações tRPC server-side. O cliente faz optimistic UI; a verdade vem do servidor.
