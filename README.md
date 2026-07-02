# Rise

> **Rise não é um organizador de tarefas. É um videogame da vida real.**
> Toda ação positiva gera progresso real. Missão: *ajudar pessoas a evoluírem constantemente em todas as áreas da vida.*

## Documentação

A fundação completa do produto vive em [`docs/`](docs/00-README.md). Comece pelo [Canon](docs/00-canon.md) — a fonte única da verdade.

## Monorepo

Turborepo + pnpm. Stack: Next.js 15 (web) · Expo (mobile, Fase 2) · tRPC · Supabase + Drizzle · Claude (IA em camadas) · Inngest.

```
apps/
  web/            # Next.js 15 (App Router) + Tailwind v4 + marca oficial  ✅
  mobile/         # Expo / React Native — Fase 2
packages/
  core/           # Domínio puro: motor de XP, níveis, streaks (sem framework)  ✅
  db/             # Drizzle schema + migração inicial (Postgres/Supabase)  ✅
  api/            # Routers tRPC (registrar ação → XP)  ✅
  ai/             # Coach (Claude em camadas + tools + anti-alucinação)  ✅
  ui/             # Design system + tokens — a construir
  config/         # tsconfig/eslint/tailwind compartilhados — a construir
```

### Desenvolvimento

```bash
corepack prepare pnpm@9.15.0 --activate   # habilita o pnpm
pnpm install
pnpm test          # roda os testes (core já verde)
pnpm typecheck
```

## Estado atual (Sprint 0)

- [x] Fundação de produto (17 docs + canon + ADRs)
- [x] Esqueleto do monorepo (pnpm + Turborepo + TS estrito)
- [x] `packages/core` — motor de XP/níveis/streaks/Nível Rise, testado contra o spec canônico (62 testes)
- [x] `apps/web` — Next.js 15 + Tailwind v4, tokens da marca oficial, dashboard "Minha Evolução" consumindo `@rise/core`
- [x] CI (`.github/workflows/ci.yml`) — typecheck + test + lint
- [x] `packages/db` — schema Drizzle + migração inicial (18 tabelas, 3 invariantes estruturais)
- [x] `packages/api` — tRPC (`action.log` registrar ação → XP; `progress.me`), 5 testes
- [x] `apps/web` interativo — registrar ação (toque/tecla A/FAB) → +XP, level-up, anel/barra animam (optimistic UI via `@rise/core`)
- [x] Camada pronta para ligar: route handler tRPC (`/api/trpc`) + client tipado + provider; clients Supabase (`@supabase/ssr`)
- [x] Auth Supabase — `/entrar` (login/cadastro por e-mail+senha), middleware de sessão, `userId` real no contexto tRPC
- [x] `packages/db` seed runner do catálogo (`db:seed`)
- [x] `packages/ai` — Coach de IA (Claude em camadas Haiku/Sonnet/Opus, tools Zod, âncora FATOS anti-alucinação, 9 testes)
- [x] **Banco no ar:** migração (18 tabelas) + seed (15 Áreas) aplicados no Supabase real
- [x] Loop validado contra o banco: `action.log` → ledger + projeções + dedupe (smoke test)
- [x] **Dashboard ligado a dados reais:** `progress.bootstrap` no primeiro acesso, `progress.me` + `action.log` com optimistic UI; login em `/entrar`; modo demo continua sem envs (CI)
- [ ] Streak engine (extensão/quebra/amortecedores) · Missões · Coach na UI · `packages/ui` · observabilidade · Expo (mobile)

### Rodar a web localmente

```bash
corepack pnpm install
corepack pnpm --filter @rise/web dev   # http://localhost:3000
```

Ver o plano completo em [docs/17-plano-sprints.md](docs/17-plano-sprints.md).
