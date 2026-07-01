# Plano de Desenvolvimento por Sprints do Rise

> Documento canônico. Escopo: plano executável em sprints de 2 semanas cobrindo a **Fase 0 (Fundação)** + **Fase 1 (MVP — Loop Solo)** em detalhe e um **esboço da Fase 2 (Social)**. Para cada sprint: objetivo, entregáveis, tarefas técnicas concretas, Definição de Pronto (DoD) e riscos. Deriva diretamente de `docs/06-roadmap.md`, `docs/07-arquitetura-tecnica.md`, `docs/08-banco-de-dados.md`, `docs/10-funcionalidades.md` e `docs/13-gamificacao.md`. Nunca contradiz o canon.

## TL;DR

Equipe fundadora enxuta (2–3 pessoas: foco full-stack + produto/design; IA/dados como chapéu compartilhado). Sprints de **2 semanas**. A Fase 0 é **1 sprint** (Sprint 0). A Fase 1 (MVP) ocupa os **Sprints 1–8**, ordenados por dependência: motor → input → profundidade → inteligência → visão → engajamento/mobile → receita → operação/hardening. O critério de saída do MVP (D7/D30 e streak médio fortes — `docs/06`) destrava a Fase 2, esboçada nos Sprints 9–11.

| Sprint | Tema | Saída-âncora |
|---|---|---|
| **0** | Fundação | Monorepo + CI/CD + Auth + tokens + esqueleto de schema |
| **1** | Motor de progressão | XP/Nível/Streak sobre ledger imutável |
| **2** | Registro de Ação + feedback AAA | Loop mínimo jogável (1-tap → XP → level-up) |
| **3** | Profundidade | Skill Trees + Conquistas/Badges + Missões |
| **4** | Inteligência v1 | Coach Sonnet diário + Haiku + RAG/Insights |
| **5** | Visão + Temporadas | Dashboard Minha Evolução + Temporada solo + Faíscas |
| **6** | Mobile + Notificações | App Expo + push nativo/web + e-mail |
| **7** | Receita | Premium + Stripe + entitlements + Opus semanal gated |
| **8** | Operação + hardening MVP | Admin mínimo + anti-fraude + perf + a11y → MVP fechado |
| **9–11** | Esboço Fase 2 | Feed → Guildas → Ligas/Temporadas competitivas |

**Convenções de esforço (do `docs/10`):** P ≤ 3 dias, M ≤ 2 semanas, G ≥ 2 semanas. **DoD global** (vale para todo sprint, além do DoD específico): typecheck/lint/testes verdes no CI; eventos de analytics canônicos versionados em `packages/config` instrumentados; acessibilidade AA nos componentes tocados (foco visível, motion-reduce, SR labels); strings em pt-BR/en; sem regra de domínio fora de `packages/core`; Coach nunca referido como "chatbot".

---

## Sprint 0 — Fundação (Fase 0)

> **Objetivo:** repositório executável, seguro e observável. Ao fim, qualquer feature da Fase 1 começa sem retrabalho estrutural.

### Entregáveis
- Monorepo Turborepo+pnpm com `apps/web` e `packages/{core,ui,db,ai,api,config}`.
- CI/CD verde + preview deploy por PR (Vercel) + ambientes (dev/staging/prod) no Supabase.
- Auth funcional + RLS base.
- Design tokens gerando 3 alvos + 3–4 componentes Rise base.
- Esqueleto de schema migrado + evento `xp.granted` de teste end-to-end.

### Tarefas técnicas
- **Repo & build:** init Turborepo+pnpm; pipeline `turbo` (build/lint/typecheck/test); regra de dependência de boundaries (`core` não importa ninguém) via ESLint boundaries; `tsconfig` base em `packages/config`.
- **CI/CD:** GitHub Actions — lint + typecheck + Vitest + build + Playwright smoke; deploy preview Vercel por PR; secrets por ambiente; branch protection.
- **Supabase:** projetos dev/staging/prod; Drizzle configurado (schema TS + `drizzle-kit` migrations); conexão pooled.
- **Auth:** Supabase Auth (email + OAuth Google + magic link); `protectedProcedure`/`publicProcedure`/`premiumProcedure`/`orgProcedure` no tRPC; sessão em RSC.
- **RLS base:** políticas por `user_id` em `User`, `XPGrant`, `UserStat`, `ActionLog`.
- **Design tokens:** `packages/ui/tokens` com `primitives.json`/`semantic.json`/`areas.json` + `build.ts` → `tokens.css`, `tokens.native.ts`, `tailwind.tokens.ts`; tema dark padrão + light; componentes `BarraDeXP`, `AnelDeProgresso`, `AreaCard`, `LevelBadge` sobre shadcn/ui.
- **Schema esqueleto:** `User`, `LifeArea`, `XPGrant/XPLedger` (append-only), `ActionLog` (com `client_action_id`), `UserStat`, tabela `outbox`; índices iniciais (ledger `user_id, life_area_id, created_at`).
- **Domínio em `core`:** funções puras `xpTotal(n)=50n²+50n`, `custoProximo(n)=100·(n+1)`, `nivel(xp)=floor((-50+sqrt(2500+200·xp))/100))`, `fatorAmplitude`, `multStreak` — com testes unitários.
- **Observabilidade & i18n:** PostHog (client + server) + Sentry + logs estruturados; next-intl pt-BR/en com termos do glossário.
- **ADRs:** `0001` Drizzle>Prisma, `0002` tRPC>REST/GraphQL, `0003` IA em camadas, `0004` Inngest>cron, `0005` Supabase>Postgres self-hosted.

### Definição de Pronto
- `pnpm build && pnpm test && pnpm typecheck` verdes no CI; preview deploy automático por PR.
- Login/signup/magic link funcionando em staging com RLS ativa.
- Teste e2e: registrar ação fake → grava `XPGrant` → projeta Nível de Área correto (curva validada por teste de propriedade).
- Tokens consumidos por web (Tailwind) e prontos para mobile (NativeWind preset).

### Riscos
- **Drizzle + RLS:** curva de aprendizado de políticas + pooler. *Mitigação:* templates de política e testes de RLS desde já.
- **Drift de tokens:** *mitigação:* fonte única gerada (ADR), proibido config duplicado por app.
- **Over-engineering da fundação:** *mitigação:* só o esqueleto necessário para a Fase 1; nada de social/B2B no schema agora.

---

## Sprint 1 — Motor de Progressão (Fase 1)

> **Objetivo:** o servidor como verdade do progresso. XP, Nível de Área, Nível Rise e Streak corretos, auditáveis e recomputáveis.

### Entregáveis
- Áreas da Vida (14 padrão + criação pelo usuário) com cor canônica/fallback determinístico.
- Concessão de XP via `XPGrant` append-only; Nível de Área e Nível Rise **derivados** (não persistidos como verdade).
- Streak com estado/contagem e janela de carência.

### Tarefas técnicas
- **LifeArea:** seed das 14 áreas (`--area-*`); criação custom com picker restrito ou `cor = paleta[hash(areaId) % 12]`; routers `lifeArea`.
- **Motor de XP:** router `xp` + `action`/`level`; `xp.granted` sempre no servidor; `UserStat` agregado atualizado **na mesma transação** da ação; outbox transacional na mesma transação.
- **Derivação de nível:** projeções recomputáveis a partir do ledger (habilita rebalanceamento sem migração destrutiva — registrar como ADR); `fator_amplitude` +28% @8 áreas; teto Nível Rise 100.
- **Streak:** router `streak`; `streak.extended/broken`; estado, contagem, janela de carência configurável; `mult_streak` satura em 1.5 @25 dias.
- **Anti-grinding (base):** teto diário de XP por área com retornos decrescentes; XP acima do teto conta para streak/stats, não para XP/liga.
- **Idempotência:** `client_action_id` para dedupe; `xp.granted` idempotente.

### Definição de Pronto
- Testes de propriedade da curva e da derivação (monotonicidade, teto, amplitude).
- Concorrência: duas ações simultâneas não duplicam XP (idempotência verificada).
- p95 do caminho de registrar ação < 200ms em staging (ledger enxuto; caro vai para outbox).

### Riscos
- **Corretude da curva/amplitude:** *mitigação:* domínio puro 100% testado em `core`.
- **Race no agregado `UserStat`:** *mitigação:* update na mesma transação + idempotência.

---

## Sprint 2 — Registro de Ação + Feedback AAA

> **Objetivo:** tornar o loop mínimo **jogável e prazeroso**. Esta é a feature de maior RICE (40.0); investimento desproporcional em velocidade e prazer.

### Entregáveis
- Registro de Ação 1-tap + quick log com optimistic UI.
- Feedback AAA de level-up: `LevelUpOverlay`, animações, microinterações, celebração escalando com raridade.

### Tarefas técnicas
- **UI de registro:** botão 1-tap por área + quick log (quantidade/duração); optimistic UI com reconciliação do servidor; haptics no mobile (preparado).
- **Componentes de celebração:** `LevelUpOverlay`, `StreakFlame`, atualização animada de `BarraDeXP`/`AnelDeProgresso`; Motion (web) animando só transform/opacity; teto de partículas + cleanup.
- **Eventos:** disparar `action.logged`, `xp.granted`, `level.up`, `rise.level.up`, `streak.extended` (payload tipado em `core`).
- **Home (web):** painel do dia com áreas, XP do dia, streak ativo, próxima missão (placeholder até Sprint 3).
- **Analytics:** instrumentar `action_logged`, `level_up`, `streak_kept`/`streak_broken`.

### Definição de Pronto
- Registrar ação → ver XP e (quando aplicável) level-up em < 1 frame perceptível (optimistic), reconciliado pelo servidor.
- Celebração respeita `motion-reduce`; sem jank (60fps) em device de gama média.
- Cobertura e2e Playwright do fluxo registrar→level-up.

### Riscos
- **Optimistic UI divergir do servidor:** *mitigação:* servidor é a verdade; rollback visual em erro.
- **Excesso de celebração vira fadiga:** *mitigação:* celebração escala com raridade; eventos comuns são sutis.

---

## Sprint 3 — Profundidade: Skill Trees + Conquistas + Missões

> **Objetivo:** o que diferencia o Rise de um app de hábitos e retém Bruno — profundidade de progressão.

### Entregáveis
- Skill Trees por Área da Vida (tronco/ramos/folhas).
- Conquistas/Badges (raridades Comum→Mítica) e Missões (diárias/semanais/personalizadas).

### Tarefas técnicas
- **Skill Tree:** schema `Skill/SkillTree/SkillNode`; desbloqueio por XP + marcos; `skill.node.unlocked`; componentes `SkillTree`/`SkillNode`.
- **Conquistas/Badges:** schema `Achievement`/`Badge`; `achievement.unlocked`/`badge.equipped`; `CardDeConquista`/`BadgeInsignia`.
- **Missões:** router `quest`; tipos diária/semanal/personalizada; `mission.assigned`/`mission.completed` concede XP; `MissaoCard`.
- **Integração ao loop:** concluir missão progride temporada (placeholder até Sprint 5).
- **Analytics:** `quest_completed`.

### Definição de Pronto
- Desbloquear nó de Skill Tree e conquista dispara celebração correta por raridade.
- Missões geram XP via ledger (nunca XP direto fora do ledger).
- Skill Tree navegável e performática em árvores grandes.

### Riscos
- **Skill Tree complexa demais para o MVP:** *mitigação:* 1–2 áreas com árvore rica, resto com árvore enxuta; expandir pós-MVP.

---

## Sprint 4 — Inteligência v1: Coach de IA

> **Objetivo:** o Coach como mentor pessoal (nunca chatbot) que orienta o próximo objetivo a partir das estatísticas reais do usuário.

### Entregáveis
- Coach Sonnet diário (cota no Free) + heurísticas/Haiku no volume.
- Insights via RAG (pgvector) sobre `StatSnapshot/Embedding`.

### Tarefas técnicas
- **Camadas de IA:** heurísticas + `claude-haiku-4-5` (classificação/microtarefas); `claude-sonnet-4-6` (coach diário); roteamento por custo em `packages/ai`.
- **RAG:** `StatSnapshot` + `Embedding` com pgvector (índice HNSW); pipeline de geração de snapshot; recuperação enxuta.
- **Tool use:** ferramentas estruturadas validadas por Zod (consultar stats, sugerir missão, sugerir Modo Descanso).
- **UI:** `CoachBubble`/`InsightCard`; cota Free (~5–10 msg/dia) com `PremiumGate`.
- **Bem-estar:** Coach detecta sinais de burnout e sugere Modo Descanso.
- **Jobs:** Inngest para snapshots/análises em lote (via outbox).
- **Analytics:** `coach_insight_shown`.

### Definição de Pronto
- Coach responde com contexto real do usuário (RAG verificável) e respeita cota.
- Custo por interação medido (PostHog/logs); roteamento de camada correto.
- Tool calls validadas por Zod; nenhuma alucinação de XP/nível (Coach lê, não escreve no ledger).

### Riscos
- **Custo de IA descontrolado:** *mitigação:* camadas + caching + cotas + batch via Inngest.
- **Coach genérico ("chatbot"):** *mitigação:* RAG sobre stats próprios + tom de mentor do `brandTone`.

---

## Sprint 5 — Visão + Temporadas solo + Faíscas

> **Objetivo:** dar ao usuário uma visão premium da própria evolução e o primeiro ciclo de novidade recorrente (Temporada), com a moeda cosmética isolada do XP.

### Entregáveis
- Dashboard **Minha Evolução** + Histórico por Área (7 dias no Free).
- Temporada mensal solo com recompensas cosméticas individuais; Faíscas (cosmética, isolada do XP).

### Tarefas técnicas
- **Dashboard:** `StatTile`, gráficos de XP/streak por área, Nível Rise; estatísticas 7 dias (Free) / profundas (Premium, gate).
- **Temporada:** router `season`; `season.started/ended/progress`; reset apenas de leaderboard sazonal/passe (XP/níveis/Skill Trees/Conquistas nunca resetam); `SeasonBanner`.
- **Faíscas:** `SparksWallet`/`CosmeticItem`/`Inventory` **estruturalmente separados** do XPLedger; `sparks.earned/spent`, `cosmetic.acquired`; `SparksWalletChip`; loja sem loot box, preço transparente.
- **Cosméticos:** catálogo base (temas/molduras) aplicáveis.

### Definição de Pronto
- Auditoria de schema: nenhuma relação entre `SparksWallet` e `XPLedger` (pay-to-win impossível por design).
- Reset de temporada não toca XP/níveis/conquistas (teste).
- Dashboard performático e legível (Geist Mono tabular nos números).

### Riscos
- **Confusão Faíscas×XP na UI:** *mitigação:* linguagem e namespaces distintos; cosmético nunca aparece no caminho de progresso.

---

## Sprint 6 — Mobile (Expo) + Notificações

> **Objetivo:** presença diária na home do usuário. Push nativo é requisito de engajamento — entra no MVP, não depois.

### Entregáveis
- App Expo (RN + NativeWind) com paridade do loop core.
- Notificações Expo Push / Web Push + e-mail (Resend) + central de preferências.

### Tarefas técnicas
- **Expo:** `apps/mobile` consumindo `packages/{api,ui,core}`; componentes `.native.tsx` compartilhando tipos/lógica/tokens; NativeWind preset.
- **Telas core mobile:** Home, registrar ação 1-tap, Coach, Minha Evolução.
- **Push:** Expo Push (nativo) + Web Push (PWA); central de preferências; notificações calibradas (sem dark patterns/FOMO).
- **E-mail:** Resend para transacionais (resumo, marcos).
- **Jobs:** Inngest para agendamento de notificações (streak em risco, missão do dia) — compromisso saudável, nunca culpa.

### Definição de Pronto
- Loop core (registrar→XP→level-up→Coach) funciona no Expo com haptics.
- Push entregue em iOS/Android de teste; preferências respeitadas; opt-out simples.
- E-mail transacional entregando.

### Riscos
- **Divergência web/mobile:** *mitigação:* lógica/tipos em `core`, UI em pares `.tsx`/`.native.tsx`.
- **Push intrusivo:** *mitigação:* frequência calibrada via PostHog; nunca culpa punitiva.

---

## Sprint 7 — Receita: Premium + Billing

> **Objetivo:** validar disposição a pagar e unit economics com dinheiro real, sem nunca monetizar progressão central.

### Entregáveis
- Tiers Rise Free / Rise+ / Rise Founder com entitlements.
- Billing Stripe + trial 7 dias sem cartão.
- Análise Profunda semanal (Opus) gated Premium (versão inicial).

### Tarefas técnicas
- **Tiers/entitlements:** router `subscription`; Rise+ (R$29,90/mês, R$199/ano, $7,99/$59,99), Rise Founder (R$299 vitalício, vagas limitadas); gating de cota Coach, analytics profundo, Opus, cosméticos Premium, estipêndio de Faíscas.
- **Stripe:** checkout, webhooks → `premium_upgraded`; trial 7 dias sem cartão; cancelamento simétrico; downgrade preserva XP/níveis/conquistas/histórico.
- **Opus semanal:** `claude-opus-4-8` com RAG sobre stats; gated Premium; batch via Inngest.
- **Paywall:** `PremiumGate`/`Paywall` honesto (sem FOMO artificial); plano anual como âncora.

### Definição de Pronto
- Upgrade/downgrade/cancel funcionam; nenhum dado perdido no downgrade.
- Opus gera Análise Profunda real apenas para Premium; custo por análise medido.
- Conversão e custo IA/tier visíveis no PostHog (base de unit economics).

### Riscos
- **Webhooks/estado de billing inconsistente:** *mitigação:* idempotência + reconciliação via outbox.
- **Custo Opus:** *mitigação:* batch + RAG enxuto + gating estrito Premium.

---

## Sprint 8 — Operação + Hardening do MVP

> **Objetivo:** fechar o MVP com operação mínima, integridade da economia e qualidade de produção. Ao fim, MVP pronto para coortes e para medir o gate da Fase 2.

### Entregáveis
- Admin mínimo (flags, kill switch, suporte, anti-fraude XP).
- Hardening: performance, acessibilidade AA, anti-fraude, observabilidade.

### Tarefas técnicas
- **Admin:** feature flags (PostHog), kill switch, ferramentas de suporte, fila de anti-fraude.
- **Anti-fraude em camadas:** plausibilidade; integrações HealthKit/Google Fit/GitHub como verdade preferencial; detecção por heurística+Haiku; consequência proporcional silenciosa; falso positivo evitado a todo custo; `antifraud.flagged`.
- **Amortecedores de streak completos:** Streak Freeze (jogando ou Faíscas, máx 2), perdão automático a cada 14 dias, streak repair 24h (1x/semana), Modo Descanso (até 14 dias); `streak.frozen/repaired`, `rest.mode.toggled`.
- **Perf/a11y:** auditoria p95 do caminho quente; contraste de cores de Área validado em build; foco visível, SR labels, motion-reduce, haptics como DoD.
- **Observabilidade:** dashboards de North Star (Dias de Evolução), D7/D30, streak médio, conversão.

### Definição de Pronto
- North Star + retenção D7/D30 + streak médio instrumentados e visíveis.
- Anti-fraude ativo sem falsos positivos em teste; quebrar streak nunca remove XP/nível/conquista.
- a11y AA verificada; p95 do caminho quente < 200ms sob carga de teste. **MVP fechado.**

### Riscos
- **Anti-fraude punir honesto:** *mitigação:* integrações como verdade preferencial + consequência proporcional + revisão humana de flags.

---

## Esboço da Fase 2 — Social (Sprints 9–11)

> Só inicia após o **critério de saída do MVP** (D7/D30 e streak médio fortes — `docs/06` §3). Esboço de alto nível; detalhamento vira plano próprio quando o gate abrir.

### Sprint 9 — Grafo social + Feed de marcos
- **Entregáveis:** follow/amigos; Feed exclusivamente de progresso (marcos, recordes, streaks, conquistas, level-ups).
- **Tarefas:** routers `social`/`feed`; `FeedItem`/`MilestoneCard`; **fan-out na escrita** + agregados materializados com cache (Realtime é entrega, não verdade); índice feed `(actor_id, created_at)`.
- **DoD:** feed sem selfies/política/conteúdo aleatório; fan-out escalável; sem comparação tóxica.
- **Risco:** cold-start de feed → *mitigação:* só liga após gate; seed com marcos reais do usuário.

### Sprint 10 — Guildas
- **Entregáveis:** Guildas (Líder/Oficial/Membro) + metas coletivas.
- **Tarefas:** routers `guild`; `guild.goal.reached`; RLS por guilda.
- **DoD:** responsabilidade coletiva sem culpa punitiva; retenção incremental medível vs. solo.

### Sprint 11 — Ligas/Rankings + Temporadas competitivas
- **Entregáveis:** Ligas (10 divisões Bronze→Lendária, grupos ~30, XP-semana normalizado por área, promoção top7/rebaixa bottom5, reset semanal, **opt-out**); Temporadas competitivas com Passe + Pontos de Temporada (PT).
- **Tarefas:** routers `ranking`; `league.promoted/demoted/week.reset`; leaderboard `(season_id, score DESC)`; reset via Inngest.
- **DoD:** competição só por progresso real (nunca por dinheiro); rankings opt-out; bem-estar monitorado pelo Coach.
- **Risco:** comparação tóxica → *mitigação:* normalização por área, opt-out, sem FOMO.

---

## Cadência operacional (equipe enxuta fundadora)

| Ritual | Frequência | Propósito |
|---|---|---|
| Planning | início do sprint (2 sem.) | escopo + DoD do sprint |
| Daily assíncrona | diária | desbloqueio rápido |
| Demo + review | fim do sprint | validar entregáveis contra DoD |
| Retro | fim do sprint | ajustar processo |
| Revisão de North Star | semanal | decidir se gate de fase abriu |

**Princípios de execução:** corte vertical (sempre uma fatia jogável ao fim do sprint, não camadas horizontais); domínio puro em `core` testado antes da UI; feature flag tudo que é arriscado; nada de social/B2B no schema antes da hora; medir antes de escalar (escala é playbook por gatilho, não pré-otimização).

## Síntese

O plano transforma o roadmap em fatias verticais de 2 semanas. A Fase 0 entrega uma fundação que não precisa ser refeita; os Sprints 1–8 constroem o Loop Solo na ordem de dependência (motor → input → profundidade → IA → visão → mobile → receita → operação), com a monetização base antecipada para validar unit economics cedo. O gate métrico do MVP — não o calendário — destrava a Fase 2 social, esboçada nos Sprints 9–11. Em todas as fases valem os guardrails inegociáveis: progressão central nunca é paywall, competição só por progresso real, sem pay-to-win e sem dark patterns.
