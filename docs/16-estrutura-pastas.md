# Estrutura de Pastas do Monorepo Rise

> Documento canônico. Define a topologia física do código do Rise: a árvore de diretórios do monorepo (Turborepo + pnpm), as convenções de nomenclatura, a regra de dependência entre pacotes e onde mora cada responsabilidade — domínio vs UI vs dados vs IA. É a fonte da verdade para "onde colocar esse arquivo?". Deriva diretamente das decisões do `docs/07-arquitetura-tecnica.md` e deve permanecer 100% consistente com elas.

## TL;DR

O Rise é um monorepo **Turborepo + pnpm** com dois eixos:

- **`apps/*`** — aplicações executáveis (`web` Next.js 15, `mobile` Expo). São **adaptadores burros**: orquestram, renderizam, mas não contêm regra de domínio.
- **`packages/*`** — bibliotecas compartilhadas. O coração é **`packages/core`** (domínio puro, zero dependência de framework). Tudo o que é regra de XP, Nível, Streak, Temporada vive lá.

A regra de ouro: **`core` não importa ninguém**; `db`/`ai`/`api` importam `core`; `apps` importam `api`/`ui`/`config`. Nenhuma regra de domínio fora de `core`. Isso é o que torna a fórmula de XP (`50n²+50n`) testável sem subir Next, reutilizável por web, mobile e jobs Inngest, e impossível de duplicar por engano.

## 1. Princípios que governam a estrutura

| Princípio | O que significa na prática |
| --- | --- |
| **Domínio no centro** | `packages/core` é o anel mais interno (arquitetura limpa). Não conhece Postgres, React, tRPC nem Claude. |
| **Apps são adaptadores** | `apps/web` e `apps/mobile` só compõem UI + chamam `api`. Se você escreveu `xpTotal = 50*n*n+...` dentro de `apps/`, está no lugar errado. |
| **Servidor é a verdade do progresso** | Toda mutação de XP/Nível roda no servidor (`packages/api` + `packages/core`). Cliente faz só optimistic UI. |
| **Faíscas fisicamente isoladas** | `sparks`/cosméticos vivem em módulos separados (`core/sparks`, schema `db/schema/sparks.ts`) sem nenhum import cruzado com o caminho de XP. Anti pay-to-win por topologia, não por disciplina. |
| **Organização por feature nos apps** | Dentro de `apps/web`, código se agrupa por feature de produto (`features/registro-acao`), não por tipo técnico. |
| **Por domínio nos packages** | `packages/*` se organiza por entidade/domínio (`core/xp`, `api/routers/xp`), espelhando `coreEntities`. |
| **Tokens com fonte única** | Design tokens nascem em `packages/ui/tokens` e são gerados; nunca duplicados por app (evita drift — ver `docs/15-design-system.md`). |
| **Escala como playbook, não pré-otimização** | A estrutura não cria `apps/mobile` cheio no dia 1; ele entra na transição Fase 1. Pastas Fase 2/3 nascem vazias/marcadas. |

## 2. Árvore raiz do monorepo

```
rise/
├── apps/                          # Aplicações executáveis (adaptadores)
│   ├── web/                       # Next.js 15 (App Router, RSC) + PWA
│   └── mobile/                    # Expo / React Native (entra na transição da Fase 1)
│
├── packages/                      # Bibliotecas compartilhadas (anéis internos)
│   ├── core/                      # DOMÍNIO PURO — regras de gamificação (sem framework)
│   ├── db/                        # Drizzle: schema, migrações, client Supabase
│   ├── api/                       # Routers tRPC (espelham as entidades)
│   ├── ai/                        # Clients Claude, prompts, tools, RAG
│   ├── ui/                        # Componentes Rise + design tokens (web + NativeWind)
│   └── config/                    # eslint, tsconfig, tailwind, eventos de analytics, i18n base
│
├── infra/
│   └── inngest/                   # Jobs/workflows duráveis (streaks, temporadas, IA em lote)
│
├── e2e/                           # Testes end-to-end de fluxos cross-app (Playwright)
│
├── docs/                          # Documentação canônica (00-canon, 01..16, adr/)
│   └── adr/                       # Architecture Decision Records (0001..0005)
│
├── .github/
│   └── workflows/                 # CI: lint, type-check, test, build, deploy
│
├── .changeset/                    # Versionamento de pacotes (changesets)
├── turbo.json                     # Pipeline Turborepo (build/lint/test/dev + cache)
├── pnpm-workspace.yaml            # Declara apps/* e packages/* como workspaces
├── package.json                   # Scripts raiz + devDeps compartilhadas
├── tsconfig.base.json             # tsconfig base estendido por todos
├── .nvmrc / .npmrc                # Node pinado + config pnpm
├── .env.example                   # Contrato de variáveis de ambiente (sem segredos)
└── README.md
```

### Por que `infra/inngest` fora de `packages/`?

Os jobs Inngest são **deploy units**, não bibliotecas reutilizáveis. Eles *consomem* `core`, `db` e `ai`, mas ninguém os importa. Mantê-los em `infra/` deixa claro que são um terceiro alvo de execução (ao lado de `apps/web` e `apps/mobile`), reforçando o princípio "caro é assíncrono".

## 3. Regra de dependência (inegociável)

Validada por ESLint (`import/no-restricted-paths`) e por `boundaries` no Turbo:

```
                 ┌─────────────────────────────────────────┐
                 │                  core                    │  ← não importa NINGUÉM
                 └─────────────────────────────────────────┘
                      ▲          ▲          ▲
                      │          │          │
                 ┌────┴───┐  ┌───┴───┐  ┌───┴───┐
                 │   db   │  │  ai   │  │  api  │   (importam core; api importa db+ai)
                 └────────┘  └───────┘  └───┬───┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────┐
        │                                   │                               │
   ┌────┴─────┐                       ┌─────┴──────┐                  ┌──────┴──────┐
   │ apps/web │ ── ui, config ──►     │ apps/mobile│                  │ infra/inngest│
   └──────────┘                       └────────────┘                  └─────────────┘
```

| Pacote | Pode importar | NUNCA importa |
| --- | --- | --- |
| `core` | nada (só TS + Zod) | `db`, `ai`, `api`, `ui`, React, Next, Drizzle |
| `db` | `core` | `api`, `ui`, apps |
| `ai` | `core` | `db` (recebe dados via params), `ui`, apps |
| `api` | `core`, `db`, `ai`, `config` | `ui`, apps |
| `ui` | `config`, `ui/tokens` | `core`, `db`, `api` (recebe dados via props) |
| `apps/*` | `api`, `ui`, `config`, `core` (só tipos) | `db` diretamente |
| `infra/inngest` | `core`, `db`, `ai`, `config` | `ui`, apps |

> Nota deliberada: **`ui` não importa `core`.** Componentes recebem dados prontos via props (ex.: `<BarraDeXP atual={...} proximo={...} />`). Isso mantém a UI pura/Storybook-friendly e impede que regra de domínio vaze para o design system.

## 4. `packages/core` — o domínio (onde mora a regra de XP)

O pacote mais importante. **Sem React, sem Drizzle, sem Next.** Apenas TypeScript + Zod. Organizado por subdomínio, espelhando o modelo de gamificação canônico.

```
packages/core/
├── src/
│   ├── xp/
│   │   ├── curve.ts               # ◄ FONTE DA VERDADE da curva de XP
│   │   ├── grant.ts               # Lógica de concessão (idempotência por client_action_id)
│   │   ├── ledger.ts              # Reduções sobre o XPLedger append-only
│   │   ├── daily-cap.ts           # Teto diário + retornos decrescentes (anti-grind)
│   │   ├── streak-multiplier.ts   # mult_streak = min(1+0.02·dias, 1.5)
│   │   └── xp.test.ts
│   ├── level/
│   │   ├── area-level.ts          # Nível de Área a partir do XP da área
│   │   ├── rise-level.ts          # Nível Rise + fator_amplitude (cap +28%), teto 100
│   │   ├── prestige.ts            # Prestígio (cosmético/status, sem vantagem)
│   │   └── level.test.ts
│   ├── streak/
│   │   ├── state-machine.ts       # extended/frozen/broken/repaired
│   │   ├── freeze.ts              # Streak Freeze (máx 2), perdão 14d, repair 24h
│   │   └── rest-mode.ts           # Modo Descanso (congela até 14 dias)
│   ├── skill-tree/                # Tronco/ramos/folhas; desbloqueio por XP + marcos
│   │   ├── tree.ts
│   │   └── node.ts
│   ├── quest/                     # Missões (diárias/semanais/personalizadas)
│   ├── achievement/               # Conquistas + Badges + raridades
│   ├── season/                    # Regras de Temporada (~30d), Pontos de Temporada, Passe
│   ├── ranking/                   # Ligas: 10 divisões, normalização, promoção/rebaixamento
│   ├── sparks/                    # ◄ ISOLADO: economia cosmética (sem import de xp/level)
│   ├── life-area/                 # Catálogo de Áreas + criação de Área custom
│   ├── events/
│   │   └── catalog.ts             # Tipos dos eventos canônicos (xp.granted, level.up, ...)
│   ├── types/                     # Tipos de domínio compartilhados (branded ids, etc.)
│   └── index.ts                   # Barrel público do pacote
├── package.json
└── tsconfig.json
```

### Exemplo real: onde fica o cálculo de XP

`packages/core/src/xp/curve.ts` — função pura, testada isoladamente, consumida por servidor e cliente (optimistic UI):

```ts
// packages/core/src/xp/curve.ts
/** XP acumulado necessário para alcançar o nível n. Curva quadrática (ADR 0006). */
export const xpTotalParaNivel = (n: number): number => 50 * n * n + 50 * n;

/** Custo do PRÓXIMO nível a partir de n. */
export const custoProximoNivel = (n: number): number => 100 * (n + 1);

/** Nível derivado do XP acumulado. Inverso da curva. */
export const nivelPorXp = (xp: number): number =>
  Math.floor((-50 + Math.sqrt(2500 + 200 * xp)) / 100);
```

Níveis **nunca** são persistidos como verdade — são derivados do `XPLedger` (ver `docs/10-funcionalidades.md`). Rebalancear a curva = editar este arquivo, sem migração destrutiva.

## 5. `packages/db` — dados (Drizzle + Supabase)

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── user.ts                # User, perfil, plano (Free/Premium)
│   │   ├── life-area.ts           # LifeArea (padrão + custom)
│   │   ├── action-log.ts          # ActionLog (client_action_id p/ idempotência)
│   │   ├── xp-ledger.ts           # XPGrant/XPLedger APPEND-ONLY (particionado por mês)
│   │   ├── user-stat.ts           # UserStat agregado (atualizado na mesma txn da ação)
│   │   ├── streak.ts              # Streak (estado/contagem/janela de carência)
│   │   ├── skill-tree.ts          # SkillNode + progresso
│   │   ├── quest.ts               # Quest/Mission
│   │   ├── achievement.ts         # Achievement + Badge
│   │   ├── season.ts              # Season
│   │   ├── challenge.ts           # Challenge
│   │   ├── ranking.ts             # League/Leaderboard (índice season_id, score DESC)
│   │   ├── sparks.ts              # ◄ SparksWallet/CosmeticItem/Inventory (isolado do XP)
│   │   ├── subscription.ts        # Subscription/Plan + entitlements
│   │   ├── coach.ts               # CoachSession/Insight/Recommendation
│   │   ├── stat-snapshot.ts       # StatSnapshot + Embedding (pgvector, índice HNSW)
│   │   ├── outbox.ts              # Outbox transacional → Inngest
│   │   ├── social.ts              # FriendEdge/Feed/Milestone   (Fase 2)
│   │   ├── guild.ts               # Guild/GuildMembership        (Fase 2)
│   │   ├── org.ts                 # Organization/Team/Seat       (Fase 3)
│   │   └── index.ts               # Re-export + relations
│   ├── client.ts                  # Drizzle client (Supabase Postgres)
│   ├── rls/                       # Políticas RLS por user_id / org_id (defense-in-depth)
│   └── queries/                   # Queries SQL-first reutilizáveis (feeds, rankings, stats)
├── drizzle/
│   └── migrations/                # SQL gerado por drizzle-kit (versionado)
├── drizzle.config.ts
└── package.json
```

Convenção: **um arquivo de schema por entidade**, nome em kebab-case, tabela e colunas em `snake_case`, tipos TS em `PascalCase`. `db/queries/*` concentra SQL-first crítico para feeds/rankings/agregados (motivo do ADR Drizzle > Prisma).

## 6. `packages/api` — fronteira de aplicação (tRPC)

Um router por domínio, espelhando as entidades. É aqui que vive a **autorização app-layer** e onde `core` + `db` + `ai` se encontram.

```
packages/api/
├── src/
│   ├── trpc.ts                    # init tRPC, context (user, db, supabase)
│   ├── procedures.ts              # publicProcedure, protectedProcedure,
│   │                              #   premiumProcedure, orgProcedure
│   ├── routers/
│   │   ├── auth.ts
│   │   ├── life-area.ts
│   │   ├── action.ts              # action.log: caminho QUENTE, alvo p95 < 200ms
│   │   ├── xp.ts
│   │   ├── level.ts
│   │   ├── skill-tree.ts
│   │   ├── streak.ts
│   │   ├── quest.ts
│   │   ├── achievement.ts
│   │   ├── season.ts
│   │   ├── challenge.ts
│   │   ├── ranking.ts
│   │   ├── coach.ts
│   │   ├── stats.ts
│   │   ├── sparks.ts
│   │   ├── subscription.ts
│   │   ├── social.ts              # (Fase 2)
│   │   ├── guild.ts               # (Fase 2)
│   │   ├── feed.ts                # (Fase 2)
│   │   └── org.ts                 # (Fase 3)
│   ├── root.ts                    # appRouter (merge de todos os routers)
│   └── index.ts                   # export type AppRouter (consumido por web+mobile)
└── package.json
```

Exemplo de fluxo de uma ação registrada (caminho quente):

```ts
// packages/api/src/routers/action.ts
export const actionRouter = router({
  log: protectedProcedure
    .input(logActionSchema)               // Zod
    .mutation(async ({ ctx, input }) => {
      // 1. Persiste ActionLog (idempotente por client_action_id)
      // 2. core.xp.grant() calcula o XP (servidor é a verdade)
      // 3. Grava XPGrant + atualiza UserStat + grava outbox NA MESMA TXN
      // 4. Retorna projeção p/ optimistic UI; eventos pesados vão p/ Inngest
    }),
});
```

## 7. `packages/ai` — o Coach (camadas por custo)

```
packages/ai/
├── src/
│   ├── client.ts                  # Wrapper Anthropic (seleção de modelo por camada)
│   ├── models.ts                  # haiku-4-5 | sonnet-4-6 | opus-4-8 + roteamento
│   ├── prompts/                   # System prompts versionados (tom de mentor, nunca chatbot)
│   ├── tools/                     # Tool use estruturado (schemas Zod)
│   ├── rag/                       # Recuperação via pgvector sobre StatSnapshot/Embedding
│   ├── coach/                     # Coach diário (Sonnet) + heurísticas (Haiku)
│   └── analysis/                  # Análise Profunda semanal (Opus, gated Premium)
└── package.json
```

`ai` recebe os dados já carregados (não importa `db`); quem orquestra a busca é `api`/`infra`. Mantém `ai` testável com fixtures e barato de evoluir.

## 8. `packages/ui` — design system (web + mobile)

```
packages/ui/
├── tokens/
│   ├── primitives.json            # Cores cru, escala de espaço, raios
│   ├── semantic.json              # --bg-canvas, --accent, --xp, --streak, --premium...
│   ├── areas.json                 # --area-estudos ... --area-trabalho (14 áreas)
│   ├── build.ts                   # Gera os 3 alvos abaixo
│   └── dist/                      # tokens.css | tokens.native.ts | tailwind.tokens.ts
├── src/
│   ├── primitives/                # Re-export shadcn/ui (Button, Dialog, ...)
│   ├── components/                # Componentes Rise canônicos (par .tsx + .native.tsx)
│   │   ├── BarraDeXP.tsx
│   │   ├── BarraDeXP.native.tsx
│   │   ├── AnelDeProgresso.tsx
│   │   ├── AreaCard.tsx
│   │   ├── LevelBadge.tsx
│   │   ├── CardDeConquista.tsx
│   │   ├── StreakFlame.tsx
│   │   ├── SkillTree.tsx
│   │   ├── CoachBubble.tsx
│   │   ├── LevelUpOverlay.tsx
│   │   ├── PremiumGate.tsx
│   │   └── ...                    # demais componentes do doc 15
│   └── index.ts
└── package.json
```

Cada componente compartilha tipos/lógica entre `.tsx` (web, Motion) e `.native.tsx` (mobile, Reanimated). Variantes via CVA. Tokens são **gerados**, nunca editados à mão no `dist/`.

## 9. `apps/web` — Next.js 15 (organização por feature)

```
apps/web/
├── app/                           # App Router (rotas, layouts, RSC)
│   ├── (marketing)/               # Landing, SEO, i18n público
│   ├── (app)/                     # Área autenticada
│   │   ├── evolucao/              # Dashboard "Minha Evolução"
│   │   ├── areas/[areaId]/        # Detalhe de Área da Vida
│   │   ├── coach/                 # Coach de IA
│   │   ├── temporada/             # Temporada atual
│   │   └── layout.tsx
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts   # Handler tRPC
│   │   └── inngest/route.ts       # Endpoint Inngest (serve infra/inngest)
│   ├── layout.tsx                 # [data-theme], providers, fontes Geist
│   └── manifest.ts                # PWA
├── features/                      # ◄ Organização POR FEATURE de produto
│   ├── registro-acao/             # Maior RICE: 1-tap + quick log
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── coach/
│   ├── skill-tree/
│   └── premium/
├── components/                    # Componentes específicos do web (não-reutilizáveis)
├── server/
│   └── trpc/                      # Caller server-side + helpers RSC
├── lib/                           # Utilidades web (analytics PostHog, supabase browser)
├── messages/                      # Catálogos i18n (pt-BR, en) — next-intl
├── public/
├── next.config.ts
└── package.json
```

Diferença canônica: **`packages/ui`** = componentes do design system reutilizáveis (web+mobile); **`apps/web/features/*`** = composição de feature específica do produto web; **`apps/web/components/`** = peças só-web que não merecem virar feature nem entrar no design system.

## 10. `apps/mobile` — Expo (entra na transição da Fase 1)

```
apps/mobile/
├── app/                           # Expo Router (rotas espelhando o web quando faz sentido)
├── features/                      # Mesma filosofia por-feature do web
├── components/                    # Peças só-mobile
├── lib/                           # Push (Expo), supabase, analytics
├── app.config.ts                  # Config Expo (push nativo desde a arquitetura)
└── package.json
```

Consome `packages/api` (mesmo `AppRouter` type-safe), `packages/ui` (variantes `.native.tsx`, NativeWind) e `packages/core` (tipos). Push nativo é requisito de engajamento, não afterthought. Nasce esqueleto na Fase 1; PWA do `apps/web` é a ponte até lá.

## 11. `infra/inngest` e `e2e/`

```
infra/inngest/
├── functions/
│   ├── streak-daily-check.ts      # Recalcula streaks, aplica perdão/repair
│   ├── season-reset.ts            # Encerra/abre Temporada (~30d)
│   ├── league-week-reset.ts       # Reset semanal de liga + promoção/rebaixamento
│   ├── coach-weekly-analysis.ts   # Análise Profunda (Opus) em lote, Premium
│   └── outbox-consumer.ts         # Consome outbox transacional (exactly-once efetivo)
├── client.ts
└── package.json

e2e/
├── tests/                         # Fluxos cross-app (Playwright web; Maestro mobile depois)
│   ├── onboarding.spec.ts
│   ├── registro-acao.spec.ts
│   └── level-up.spec.ts
├── playwright.config.ts
└── package.json
```

## 12. Convenções de nomenclatura (resumo)

| Item | Convenção | Exemplo |
| --- | --- | --- |
| Pastas e arquivos não-componente | `kebab-case` | `xp-ledger.ts`, `area-level.ts` |
| Componentes React | `PascalCase` (par `.native.tsx`) | `BarraDeXP.tsx` / `BarraDeXP.native.tsx` |
| Variantes mobile | sufixo `.native.tsx` | `AreaCard.native.tsx` |
| Testes | colocalizados `.test.ts` (e2e em `e2e/`) | `curve.test.ts` |
| Routers tRPC | um por domínio, kebab-case | `routers/skill-tree.ts` |
| Tabelas/colunas DB | `snake_case` | `xp_grant`, `client_action_id` |
| Tipos/entidades no código | inglês `PascalCase` (glossário PT-BR) | `LifeArea`, `XPGrant` |
| Eventos | `dot.case` canônicos | `xp.granted`, `level.up`, `streak.extended` |
| Docs | `docs/NN-nome-kebab.md`; ADR `docs/adr/NNNN-titulo.md` | `16-estrutura-pastas.md` |

### Barrel files (`index.ts`)

- **Sim** no nível público de cada `package/*` (`packages/core/src/index.ts`) — é o contrato do pacote.
- **Sim** por feature em `apps/web/features/*/index.ts` — define a superfície da feature.
- **Não** abusar dentro de um mesmo subdomínio para evitar ciclos de import e quebrar tree-shaking. Imports internos do `core` referenciam o arquivo, não o barrel.

## 13. Princípios de decisão (síntese)

1. **Se é regra de progresso, vai para `packages/core`.** Se você precisou de `import` do React/Drizzle para escrevê-la, ela está no lugar errado.
2. **Se é dado, vai para `packages/db`;** se é fronteira/autorização, `packages/api`; se é IA, `packages/ai`; se é visual reutilizável, `packages/ui`.
3. **Apps compõem, não decidem.** `apps/web/features/*` orquestra; a verdade vem do servidor.
4. **Faíscas e cosméticos nunca tocam o módulo de XP** — nem no `core`, nem no `db`, nem no `api`. Isolamento é estrutural.
5. **Pastas Fase 2/3 nascem marcadas, não preenchidas.** Social, Guildas e B2B existem como placeholders consistentes, sem antecipar trabalho (anti pré-otimização).
6. **Tokens têm fonte única gerada;** drift de design é impossível por construção.
