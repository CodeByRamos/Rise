# Roadmap por Fases do Rise

> Documento canônico. Escopo: define as fases de produto do Rise — objetivos, escopo, métricas de sucesso e marcos —, o sequenciamento entre elas e o porquê de cada decisão de ordem. Fonte da verdade para priorização macro. Nunca contradiz o canon (`docs/00-canon.md`) nem os docs 01–05, 07, 08, 10, 12, 13.

## TL;DR

O Rise é construído em seis fases. A regra-mestre é **Loop Solo impecável antes do social**: a pessoa precisa amar evoluir sozinha antes de qualquer feed, guilda ou ranking — caso contrário caímos no cold-start clássico de rede social (feed vazio, ninguém para seguir, churn no dia 1). Cada fase só começa quando a anterior bate seu **critério de saída** medido em dados, não em opinião. A North Star (**Dias de Evolução por usuário ativo**) é o filtro de toda priorização: nada entra antes do necessário, e a progressão central nunca é monetizada.

| Fase | Nome | Foco | Personas | Critério de entrada |
|---|---|---|---|---|
| **0** | Fundação | Infra, monorepo, esqueleto de domínio | — (equipe) | Início do projeto |
| **1** | MVP — Loop Solo | Progressão + hábitos/metas + Coach básico | Lia, Bruno, Marina, Diego | Fase 0 concluída |
| **2** | Social | Feed, guildas, rankings, temporadas competitivas | Caio + amplificação | D7/D30 e streak médio fortes |
| **3** | Monetização & IA avançada | Premium maduro, Análise Profunda Opus, analytics premium | todas | Receita recorrente validada + retenção social |
| **4** | Marketplace & Criadores | Economia de cosméticos, desafios pagos, ferramentas de criador | Caio + criadores | Massa social com criadores orgânicos |
| **5** | B2B & Escala | Rise for Teams, mobile nativo em escala, i18n ampliada | Renata | Produto consolidado + tração orgânica |

> **Nota sobre o brief.** O brief sugere "Fase 3 = Monetização/Premium". Discordamos parcialmente e **antecipamos a monetização base (Premium Rise+, trial, billing) para dentro da Fase 1**, porque unit economics da IA precisa ser validada com dinheiro real desde cedo e porque o Premium destrava *profundidade* que já existe no loop solo (não poder competitivo). O que fica na Fase 3 é a **maturação** da monetização e a **IA avançada em escala** (Opus semanal robusto, analytics profundo, otimização de margem). Isso evita rodar 12+ meses sem receita e sem sinal de disposição a pagar — o erro clássico de produto gamificado.

---

## 1. Princípios de sequenciamento (o porquê da ordem)

A ordem das fases não é arbitrária. Quatro teses a governam:

1. **Anti cold-start social.** Uma rede social baseada em progresso só inspira se houver progresso real para mostrar. Lançar feed/guildas/rankings antes de o loop solo encantar produz feed vazio e comparação tóxica sem substância. Social **amplifica** algo que já é bom; não cria valor do zero.
2. **Retenção precede aquisição.** Não escalamos aquisição (criadores, B2B) sobre um produto que não retém. O gate da Fase 2 é explicitamente **D7/D30 e streak médio fortes** — só então o efeito de rede vale o investimento.
3. **Unit economics desde cedo.** IA é o maior custo variável. Validamos a economia (camadas Haiku→Sonnet→Opus, conversão Premium, margem) ainda na Fase 1, em pequena escala, antes de abrir Opus para milhões.
4. **Mobile e escala são arquiteturais desde o dia 0, mas operacionais por fase.** Expo entra na Fase 1 (push nativo é requisito de engajamento). A *escala* de mobile e infra (R$/usuário, Cloudflare/R2, sharding) é um problema da Fase 5 — resolvido por playbook de gatilho de métrica (`docs/07-arquitetura-tecnica.md` §escala), não por pré-otimização.

**Regra de ouro:** nada entra antes do necessário. Social não vem antes de um loop solo que já encanta; B2B não vem antes de massa orgânica e produto consolidado.

---

## 2. Fase 0 — Fundação

> **Objetivo:** transformar o canon e a arquitetura em um esqueleto executável, seguro e observável, no qual a Fase 1 possa ser construída em velocidade máxima sem retrabalho estrutural.

### Escopo

- **Monorepo** Turborepo + pnpm: `apps/web` (Next.js 15 App Router/RSC), `packages/{core,ui,db,ai,api,config}`. Regra de dependência: `core` não importa ninguém; `db/ai/api` importam `core`; `apps` importam `api/ui/config`. feito
- **Backend base:** Supabase (Postgres + Auth + Storage + Realtime + RLS) + Drizzle (migrations e schema em TS) + tRPC com os tipos de procedure (`publicProcedure`, `protectedProcedure`, `premiumProcedure`, `orgProcedure`). feito
- **Auth:** Supabase Auth (email + OAuth + magic link). feito
- **Design tokens** (`packages/ui/tokens`): `primitives.json`, `semantic.json`, `areas.json` + `build.ts` emitindo `tokens.css`, `tokens.native.ts`, `tailwind.tokens.ts`. Tema dark padrão + light first-class.
- **Esqueleto de schema de domínio:** `User`, `LifeArea`, `XPGrant/XPLedger` (append-only), `ActionLog`, `UserStat`, tabela `outbox`.feito
- **Observabilidade e qualidade:** PostHog (analytics + flags + A/B), Sentry (erros), logs estruturados; Vitest + Playwright configurados; CI/CD (lint, typecheck, testes, build, preview deploy).feito
- **i18n** desde já: next-intl, catálogos pt-BR + en com termos canônicos do glossário (Área da Vida ↔ Life Area).
- **ADRs 0001–0005** registrados.

### Métricas de sucesso (são de engenharia, não de produto)

- `pnpm build` + `pnpm test` + `pnpm typecheck` verdes no CI; preview deploy automático por PR.
- p95 de uma mutação trivial autenticada ponta a ponta < 200ms em staging.
- Cobertura de domínio (`packages/core`) com testes para a curva de XP e derivação de nível.
- Zero regra de domínio fora de `core` (verificável por lint de boundaries).

### Marcos

- **M0.1** Monorepo + CI verde + deploy de staging.feito
- **M0.2** Auth funcional (login/signup/magic link) + RLS base.feito
- **M0.3** Design tokens gerando três alvos + 3–4 componentes Rise base (`BarraDeXP`, `AnelDeProgresso`, `AreaCard`, `LevelBadge`).feito
- **M0.4** Esqueleto de schema migrado + `xp.granted` end-to-end de teste (registra ação fake → grava no ledger → projeta nível).feito

---

## 3. Fase 1 — MVP: Loop Solo

> **Objetivo:** entregar o coração do produto — o loop **VIVER → REGISTRAR → GANHAR XP → VER EVOLUÇÃO → COACH ORIENTA → PRÓXIMO OBJETIVO** — com qualidade AAA e fricção mínima, a ponto de Lia, Bruno, Marina e Diego voltarem todos os dias por vontade própria.

Esta é a fase mais longa e mais importante. Se ela falhar, nenhuma fase posterior salva o produto.

### Escopo

**Motor de progressão (núcleo)**
- Áreas da Vida (14 padrão + criação pelo usuário com cor por picker restrito/fallback determinístico).
- XP, Nível de Área e Nível Rise derivados do **XPLedger imutável** (projeções recomputáveis, não persistidas como verdade — habilita rebalanceamento sem migração destrutiva). Curva `50n²+50n`; custo do próximo nível `100·(n+1)`; `fator_amplitude` +28% @8 áreas; teto Nível Rise 100.
- Streaks com os quatro amortecedores (Streak Freeze, perdão automático a cada 14 dias, streak repair 1x/semana, Modo Descanso). Quebrar streak **nunca** remove XP/nível/conquista.
- Skill Trees por Área da Vida (P0 — diferencial vs. app de hábitos, retém Bruno).
- Missões (diárias/semanais/personalizadas), Conquistas/Badges (raridades Comum→Mítica).
- Temporadas mensais solo com recompensas cosméticas individuais (camada competitiva fica na Fase 2). Faíscas (moeda cosmética, isolada estruturalmente do XP).

**Input e feedback**
- **Registro de Ação** (maior RICE do produto, 40.0): 1-tap + quick log, com idempotência (`client_action_id`), teto diário de XP por área com retornos decrescentes (anti-grinding).
- Feedback AAA: `LevelUpOverlay`, animações de level-up, microinterações; celebrações escalam com raridade do evento.

**Inteligência (Coach de IA em camadas)**
- Heurísticas + `claude-haiku-4-5` no volume (classificação/microtarefas).
- `claude-sonnet-4-6` como coach diário (cota no Free, ilimitado no Premium).
- `claude-opus-4-8` para Análise Profunda semanal (gated Premium) — versão inicial.
- RAG via pgvector sobre `StatSnapshot/Embedding`; tool use estruturado validado por Zod. Coach é guardião do bem-estar (sugere Modo Descanso em sinais de burnout). **Nunca chamado de chatbot.**

**Visão e engajamento**
- Dashboard **Minha Evolução** + Histórico por Área; estatísticas (7 dias no Free, profundas no Premium).
- App **Expo** (mobile nativo) entra nesta fase: push nativo + presença na home são essenciais ao engajamento diário. PWA é ponte, não destino.
- Notificações: Expo Push / Web Push + e-mail transacional (Resend) + central de preferências.

**Monetização base (antecipada — ver nota do TL;DR)**
- Tiers: **Rise Free** (generoso), **Rise+** (R$29,90/mês, R$199/ano, $7,99/$59,99), **Rise Founder** (R$299 vitalício, vagas limitadas). Trial 7 dias sem cartão. Billing via Stripe + entitlements.

**Operação**
- Admin mínimo transversal: feature flags, kill switch, suporte, anti-fraude de XP (plausibilidade + integrações como verdade preferencial + heurística/Haiku).

### Métricas de sucesso (critério de saída → desbloqueia Fase 2)

| Métrica | Alvo de saída |
|---|---|
| **Retenção D7** | forte (alvo de referência ≥ 35–40%) |
| **Retenção D30** | forte (alvo de referência ≥ 18–22%) |
| **Streak médio** do usuário ativo | forte e crescente |
| **North Star** (Dias de Evolução/usuário ativo) | tendência de alta semana a semana |
| **Conversão Free→Premium** | 3–6% (valida disposição a pagar) |
| **Sinal de compartilhamento** | usuários pedindo para mostrar progresso (gatilho qualitativo da Fase 2) |

> Os percentuais são alvos de referência calibráveis via PostHog; o gate real é a *tendência saudável e sustentada*, não um número mágico isolado.

### Marcos

- **M1.1** Motor de XP/Nível/Streak completo + Registro de Ação 1-tap com feedback AAA.
- **M1.2** Skill Trees + Conquistas/Badges + Missões.
- **M1.3** Coach Sonnet diário + Insights (RAG) + Haiku no volume; Opus semanal gated.
- **M1.4** App Expo com push nativo + Dashboard Minha Evolução.
- **M1.5** Premium + Billing + entitlements + Admin mínimo → **MVP fechado**.

---

## 4. Fase 2 — Social

> **Objetivo:** transformar evolução individual em evolução compartilhada e inspiradora, ativando o efeito de rede sem dark patterns e sem comparação tóxica. Ativa a persona Caio (criador) e amplifica Lia/Bruno/Marina/Diego.

Entra **somente** após o critério de saída da Fase 1.

### Escopo

- **Grafo social** (amigos/follow) baseado exclusivamente em progresso.
- **Feed** de marcos: metas concluídas, recordes/PRs, streaks, conquistas, level-ups. Sem selfies, política ou conteúdo aleatório. Arquitetura de fan-out na escrita + agregados materializados (Realtime é entrega, não verdade — `docs/07`).
- **Guildas** (papéis Líder/Oficial/Membro) para responsabilidade coletiva.
- **Rankings/Ligas** estilo Duolingo: 10 divisões (Bronze→Lendária), grupos ~30, ordenação por XP-semana normalizado por área, promoção top7/rebaixamento bottom5, reset semanal. **Opt-out.**
- **Desafios** (individuais/guilda/comunidade) e **Temporadas competitivas** com Passe de Temporada e Pontos de Temporada (PT).
- Notificações sociais calibradas (sem FOMO artificial).

### Métricas de sucesso

- % de DAU que consome o feed e % que publica marcos (sem cair em vaidade vazia).
- Retenção incremental de usuários em guilda vs. solo (tese: guilda aumenta retenção).
- Lift de North Star em coortes sociais vs. coorte de controle (PostHog A/B).
- Ausência de degradação de bem-estar (Coach monitora; rankings opt-out usados como sinal).

### Marcos

- **M2.1** Grafo social + Feed de marcos com fan-out.
- **M2.2** Guildas + metas coletivas.
- **M2.3** Ligas/Rankings semanais + Temporadas competitivas com Passe.

---

## 5. Fase 3 — Monetização & IA avançada

> **Objetivo:** maturar a receita recorrente e a profundidade de IA em escala, com unit economics saudável. Não é "ligar o paywall" — é aprofundar valor pago (sempre profundidade/clareza/beleza, nunca poder competitivo).

### Escopo

- **Análise Profunda Opus** robusta e em escala: análises semanais ricas com RAG enxuto, caching, batch via Inngest. Gated Premium.
- **Estatísticas profundas**: histórico ilimitado, correlações entre áreas, tendências, previsões do Coach.
- **Otimização de margem**: cotas Free, caching agressivo de IA, roteamento por camada afinado, observabilidade de custo por usuário/tier.
- **Estipêndio de Faíscas** Premium, cosméticos Premium, votação no roadmap, suporte prioritário (maturação dos entitlements já existentes).
- Experimentos de pricing (PPP/regionalização), planos anuais como âncora, redução de churn (<5%).

### Métricas de sucesso

- Margem bruta Premium **70–85%**; custo de IA por usuário sob controle por tier.
- **LTV/CAC > 3**; churn mensal **< 5%**; conversão sustentada 3–6%+.
- ARPU e MRR crescentes; retenção de assinante estável após 3 ciclos.

### Marcos

- **M3.1** Opus semanal em escala + analytics profundo Premium.
- **M3.2** Painel de unit economics (custo IA/tier) + cotas e caching otimizados.
- **M3.3** Experimentos de pricing/PPP + redução de churn validada.

---

## 6. Fase 4 — Marketplace & Criadores

> **Objetivo:** abrir uma economia de cosméticos e ferramentas de criador que dê a Caio e a outros criadores formas autênticas de monetizar progresso real, sem jamais vender vantagem.

Entra após massa social com criadores orgânicos (Fase 2 madura).

### Escopo

- **Marketplace de cosméticos**: rev share **70% criador / 30% Rise**, compra com Faíscas, curadoria obrigatória, guardrails anti loot box (sem caixas aleatórias, sem odds ocultas, preço sempre visível).
- **Desafios pagos**: take rate **15–20%**; inscrição compra acesso a programa/curadoria + cosmético exclusivo — **nunca** XP/vantagem/boost em ranking.
- **Ferramentas de criador**: liderar desafios/temporadas, construir guilda, painel de criador. Avaliar ativar o tier reservado **"Rise Pro"** (criador/power-user) **se** os dados justificarem — não antes.

### Métricas de sucesso

- GMV de cosméticos e take rate efetivo; nº de criadores ativos e retenção de criador.
- Receita de criador como % do total; satisfação de criador (NPS).
- Zero violação dos guardrails (auditoria: nenhum item pago concede vantagem competitiva).

### Marcos

- **M4.1** Marketplace de cosméticos com curadoria + rev share.
- **M4.2** Desafios pagos.
- **M4.3** Painel de criador + decisão sobre "Rise Pro".

---

## 7. Fase 5 — B2B & Escala

> **Objetivo:** levar o Rise a empresas (persona Renata) e suportar milhões de usuários com mobile nativo em escala e internacionalização ampliada — privacidade individual inegociável.

Entra após produto consolidado e tração orgânica.

### Escopo

- **Rise for Teams**: Organização/Time/Assento, licença por assento R$25–40 / $6–10/mês, contrato anual, SSO.
- **Dashboards agregados e anônimos** de engajamento/bem-estar, desafios corporativos, guildas por time. **Privacidade individual inegociável** (RLS por org_id, agregação com k-anonimato).
- **Escala de infra** por playbook de gatilho: read replicas, particionamento temporal do ledger/logs, fan-out, sharding por org B2B; avaliar Cloudflare/R2/Images, CDN.
- **Mobile nativo em escala**: performance, e2e Maestro, otimização de push.
- **i18n ampliada** além de pt-BR/en.

### Métricas de sucesso

- Nº de contas B2B, assentos ativos, % de adesão por empresa (vs. benchmark frustrante de ferramentas de bem-estar).
- Retenção de assento e renovação anual.
- SLOs de escala mantidos (p95 do caminho quente, custo/usuário) sob carga de milhões.

### Marcos

- **M5.1** Org/Time/Assento + dashboards anônimos + SSO.
- **M5.2** Desafios corporativos + guildas por time.
- **M5.3** Hardening de escala (particionamento, replicas, R2) + i18n ampliada.

---

## 8. Visão geral em uma linha do tempo (indicativa, equipe enxuta fundadora)

| Período relativo | Fase dominante | Entregável-âncora |
|---|---|---|
| Semanas 1–4 | Fase 0 | Fundação executável + CI/CD |
| Semanas 5–22 | Fase 1 | MVP Loop Solo (web + Expo + Premium) |
| Pós critério D7/D30 | Fase 2 | Feed + Guildas + Ligas |
| Em paralelo/seguida | Fase 3 | IA avançada + maturação de receita |
| Após massa social | Fase 4 | Marketplace + Criadores |
| Produto consolidado | Fase 5 | B2B + escala + i18n |

> Os prazos são indicativos para uma equipe fundadora enxuta; o gate de cada fase é **métrico**, não temporal. O plano operacional detalhado da Fase 0 + Fase 1 está em `docs/17-plano-sprints.md`.

---

## 9. Princípios de decisão (síntese)

1. **Loop solo antes de social, sempre.** Comunidade amplifica; não cria valor do zero.
2. **Gate por dado, não por calendário.** Cada fase abre quando a anterior prova retenção/economia.
3. **North Star filtra prioridade.** Dias de Evolução por usuário ativo decide o que entra.
4. **Progressão central nunca é paywall.** Pago = profundidade de IA + clareza + beleza. Nunca poder competitivo.
5. **Honestidade by design.** Sem pay-to-win, sem dark patterns, sem FOMO artificial — em todas as fases.
6. **Escala é playbook por gatilho, não pré-otimização.** Arquitetura limpa desde o dia 0; otimização quando a métrica pedir.
7. **Mobile e i18n são arquiteturais desde já, operacionais por fase.**
