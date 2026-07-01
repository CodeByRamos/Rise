# ADRs — Architecture Decision Records do Rise

Registro canônico das decisões arquiteturais. Cada ADR documenta **contexto → decisão → consequências**. Os docs `07`, `08` e `14` descrevem o raciocínio dessas decisões inline; esta tabela é a **numeração oficial reconciliada** (os documentos de origem haviam colidido na numeração 0006–0008 — esta lista resolve a colisão).

| ADR | Decisão | Origem | Status |
|-----|---------|--------|--------|
| 0001 | **Drizzle** em vez de Prisma (performance serverless/edge, SQL-first, fit com pgvector) | 07, Canon | Aceito |
| 0002 | **tRPC** em vez de REST/GraphQL (type-safety ponta a ponta web+mobile) | 07 | Aceito |
| 0003 | **IA do Coach em camadas** por custo (heurística → Haiku → Sonnet → Opus) | 07, 14 | Aceito |
| 0004 | **Inngest** (jobs duráveis + outbox) em vez de cron | 07 | Aceito |
| 0005 | **Supabase** em vez de Postgres self-hosted | 07 | Aceito |
| 0006 | **Event sourcing de XP**: `xp_events` append-only; níveis/stats são projeções recomputáveis (não persistidos como verdade) → habilita rebalanceamento de curva sem migração destrutiva | 08, 10, 17 | Aceito |
| 0007 | **Isolamento estrutural Faíscas × XP** no schema (sem FK entre os caminhos) → pay-to-win impossível por design, não só por política | 08, 13, 16 | Aceito |
| 0008 | **RAG separa FATOS de CONTEXTO**: números exatos via SQL determinístico (nunca embeddados) + semântica via pgvector/HNSW → elimina alucinação numérica | 14 | Aceito |
| 0009 | **"IA propõe, `core` aplica"**: a IA nunca define XP/nível; o motor de gamificação calcula pela curva canônica → exploit e pay-to-win impossíveis por arquitetura | 14 | Aceito |
| 0010 | **Feed por fan-out na escrita** com modelo híbrido push/pull para contas-celebridade (`is_high_fanout`) | 08 | Aceito (Fase 2) |
| 0011 | **Gating do Opus no Premium** (fallback Sonnet resumido no Free, teaser honesto) | 14, 12 | Aceito |
| 0012 | **Design tokens gerados** em `packages/ui/tokens` (Style Dictionary) emitindo `tokens.css` + `tokens.native.ts` + `tailwind.tokens.ts` → fonte única web/mobile | 15 | Aceito |

> Próximo passo (fase de implementação): materializar cada linha como `adr/NNNN-titulo.md` no formato completo (Contexto / Decisão / Alternativas consideradas / Consequências). Esta tabela é o índice provisório enquanto os arquivos individuais não existem.
