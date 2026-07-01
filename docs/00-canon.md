# Rise — Canon do Produto

> Documento **canônico** e fonte única da verdade. Nenhum outro documento pode contradizê-lo. Os docs `01`–`05` complementam este canon. Termos, nomes de personas, modelo de gamificação e stack definidos aqui valem para todo o repositório (código e documentação).

## 1. Voz e tom da marca

A voz do Rise é a de um mentor confiante e energético que trata você como o herói da própria evolução — aspiracional, mas sempre honesta (nunca coach motivacional barato, nunca FOMO ou culpa). Fala em PT-BR direto, claro e premium, com a precisão de Linear/Stripe e a vivacidade de Duolingo: frases curtas, verbos de ação, foco em progresso real (*"Toda ação conta. Toda evolução aparece."*). Usa metáfora de jogo (XP, nível, missão, temporada) com naturalidade, sem infantilizar — profundidade que respeita tanto a estudante Lia quanto o cético dev Bruno. Celebra vitórias com entusiasmo genuíno e empatia nos recomeços (persona Diego), nunca julga falhas. Jamais manipula, jamais vende vantagem: o tom reflete o produto — alto engajamento porque a pessoa evolui de verdade.

## 2. Stack canônica

**Monorepo (dia 1):** Turborepo + pnpm. `apps/web` (Next.js), `apps/mobile` (Expo/RN — Fase 2/3), `packages/*`: `core` (domínio), `ui` (+ `ui/tokens` design tokens), `config`, `db`, `ai`.

**Web:** Next.js 15 (App Router, RSC) + React + TypeScript + TailwindCSS + shadcn/ui + Motion (Framer Motion). PWA como ponte para mobile (não destino).

**Mobile:** Expo + React Native + NativeWind (Tailwind universal) — primitivos de UI e design tokens compartilhados com a web. Push nativo é requisito de engajamento desde a arquitetura.

**API:** tRPC (type-safety ponta a ponta web+mobile) + TanStack Query (server state); Zustand (estado de UI local).

**Banco/Backend:** Supabase (Postgres gerenciado + Auth + Storage + Realtime + RLS). ORM: **Drizzle** (não Prisma). Autorização principal na camada de app (tRPC); RLS como defense-in-depth em tabelas sensíveis.
- *Trade-off Drizzle > Prisma (ADR 0001):* footprint menor e cold-start mais rápido em serverless/edge; SQL-first com controle fino de queries e índices (crítico para feeds/rankings/agregações de stats); migrations e schema em TS sem engine binária separada; melhor fit com pgvector. Custo: DX de modelagem menos "mágica" e ecossistema menor que Prisma — aceitável dado o ganho de performance e controle a escala de milhões.

**Auth:** Supabase Auth (email + OAuth + magic link; funciona em RN). Alternativa premium-DX avaliável: Clerk.

**IA Vetorial/RAG:** pgvector no próprio Postgres (RAG sobre as estatísticas do próprio usuário).

**Jobs/cron/workflows duráveis** (streaks, reset de temporada, notificações, análises de IA em lote): Inngest. Alternativas: Trigger.dev, Supabase cron + Edge Functions.

**IA:** Anthropic Claude API, em CAMADAS por custo (unit economics importa):
- heurísticas + `claude-haiku-4-5` → classificação/microtarefas em volume (cotidiano barato);
- `claude-sonnet-4-6` → coach do dia a dia;
- `claude-opus-4-8` → análises profundas semanais (gated no Premium).

Tool use estruturado + RAG (pgvector). Recursos pesados de IA ficam no Premium.

**Notificações:** Web Push (PWA) + Expo Push (nativo); e-mail transacional via Resend.
**Storage de imagens:** Supabase Storage no início; Cloudflare R2 + Images em escala.
**Hosting:** Vercel (web) + Supabase. Em escala, avaliar Cloudflare. CDN para assets.
**Observabilidade/produto:** PostHog (analytics + feature flags + A/B + session replay) + Sentry (erros) + logs estruturados (Axiom/OTel).
**Testes:** Vitest (unit) + Testing Library + Playwright (e2e web); Maestro (e2e mobile, depois).
**i18n:** next-intl (web) + i18next/expo-localization (mobile), catálogos compartilhados. Default **pt-BR + en**.
**Design tokens:** `packages/ui/tokens`, consumidos por Tailwind (web) e NativeWind (mobile).

## 3. Modelo central de gamificação

**XP (Pontos de Evolução).** Moeda de progresso, NÃO comprável jamais. Toda ação real positiva concede XP na Área da Vida correspondente. XP é a base de toda a progressão.

**Áreas da Vida.** Domínios de evolução, cada um funcionando como uma "classe" de RPG com progressão própria e independente: Estudos, Programação, Academia, Saúde, Sono, Alimentação, Leitura, Finanças, Idiomas, Música, Surf, Skate, Espiritualidade, Relacionamentos, Trabalho. O usuário pode CRIAR Áreas da Vida personalizadas.

**Níveis.** Dois eixos: *Nível de Área* (cada Área sobe pelo seu próprio XP) e *Nível Rise / Rank de Vida* (agregado de todas as áreas). Subir de nível dispara animação de level-up. Curva canônica quadrática: `XP_total(n) = 50n² + 50n`; custo do próximo nível `= 100·(n+1)`; nível derivado `nivel(xp) = floor((-50 + sqrt(2500 + 200·xp)) / 100)`.

**Skill Trees (Árvores de Habilidade).** Cada Área da Vida tem uma árvore que destrava galhos conforme XP e marcos.

**Streaks (Sequências).** Dias consecutivos de ação. Multiplicador satura: `min(1 + 0.02·dias, 1.5)`, teto em 25 dias. Geram compromisso saudável — nunca culpa.

**Missões.** Objetivos acionáveis (diários/semanais/personalizados, alguns sugeridos pelo Coach). Concluir concede XP e progride a Temporada.

**Conquistas / Badges.** Marcos permanentes desbloqueáveis e suas insígnias visuais.

**Temporadas (Seasons).** Ciclos ~mensais com desafios e recompensas cosméticas exclusivas. Reset toca APENAS leaderboard sazonal e passe — XP/níveis/Skill Trees/Conquistas NUNCA resetam. Cosméticos retornam em rotação (anti-FOMO).

**Desafios.** Eventos com meta e prazo (individual, guilda ou comunidade; alguns pagos/de criador — Fase 2). Nunca vendem vantagem.

**Rankings / Ligas.** Estilo Duolingo (10 divisões, promoção top7 / rebaixamento bottom5, XP-semana normalizado por área). Competitivo APENAS por progresso real. Opt-out.

**Guildas.** Comunidades para responsabilidade coletiva e desafios (Fase 2).

**Faíscas (Sparks).** Moeda cosmética usada SOMENTE para cosméticos. Isolada estruturalmente do XP no schema — NUNCA compra XP, nível, ranking ou vantagem.

### Guardrails inegociáveis (anti pay-to-win, anti dark pattern)
1. Dinheiro/Faíscas NUNCA compram XP, nível, skill, ranking ou vantagem competitiva.
2. Competição só por progresso real; o pago é exclusivamente cosmético/conveniência/profundidade de IA.
3. Sem loot box manipulativa: recompensas cosméticas transparentes (sem odds ocultas).
4. Streaks e missões geram compromisso, não culpa; sem FOMO artificial.
5. Premium destrava profundidade (IA Opus/Sonnet, analytics, cosméticos), nunca poder competitivo.

## 4. Personas

| Nome | Papel | Resumo |
|------|-------|--------|
| **Lia** | Jovem-Estudante (núcleo, Fase 1) | 24, eng. + estágio, SP. Nativa de games/Duolingo, vive no celular, odeia app cara de planilha. Quer consistência em estudo, sono, academia, idiomas. |
| **Bruno** | Profissional-Tech (núcleo, Fase 1) | 29, dev full-stack sênior, Floripa. Cético com gamificação infantil, ama progressão profunda e dados. Quer skill trees reais, stats e insights acionáveis. Paga por premium. |
| **Marina** | Fitness/Saúde (núcleo, Fase 1) | 33, nutricionista, Recife. Sofre com evolução fragmentada em vários apps. Quer consolidar Academia/Saúde/Sono/Alimentação em progressão única. |
| **Caio** | Criador/Influenciador (Fase 2 social) | 26, criador de produtividade, BH. Traz audiência. Quer mostrar progresso autêntico, liderar desafios/temporadas, construir guilda, monetizar. |
| **Renata** | Compradora B2B — Head de People (Fase 3) | 41, People em tech (~600 pessoas), SP. Quer benefício que o time use, dashboards anônimos de engajamento, desafios corporativos. Privacidade inegociável. |
| **Diego** | Recomeço/Transformação (Fase 1, caso emocional) | 37, transição de carreira/vida, Curitiba. Histórico de recomeços que não vingam. Representa amplitude e Áreas custom (ex.: Música) e o anti-desistência guiado pelo Coach. |

## 5. Glossário canônico (PT-BR)

- **Rise:** o produto; o "videogame da vida real". Também verbo-marca (ascender/evoluir).
- **XP / Pontos de Evolução:** moeda de progresso por ações reais. Nunca comprável.
- **Área da Vida** (en: Life Area): domínio de evolução com progressão própria. Extensível pelo usuário.
- **Nível de Área / Nível Rise (Rank de Vida):** nível por área / nível geral agregado.
- **Skill Tree / Árvore de Habilidade:** árvore de progressão por Área; destrava galhos com XP e marcos.
- **Streak / Sequência:** dias consecutivos de ação. Compromisso saudável, não culpa.
- **Missão:** objetivo acionável; concede XP ao concluir.
- **Conquista / Achievement:** marco permanente. **Badge / Insígnia:** sua representação visual.
- **Temporada / Season:** ciclo com início e fim, com desafios e recompensas cosméticas exclusivas.
- **Desafio:** evento com meta e prazo. **Ranking / Liga:** comparação por progresso real.
- **Guilda:** grupo/comunidade (Fase 2).
- **Faíscas / Sparks:** moeda cosmética; só compra cosméticos, nunca vantagem.
- **Cosmético:** item visual sem impacto competitivo.
- **Coach (de IA / Mentor):** a IA pessoal. Nunca chamado de "chatbot". **Insight:** análise/recomendação do Coach.
- **Feed:** linha do tempo social só de progresso (Fase 2). **Marco / Milestone:** evento publicável. **Recorde / PR:** melhor desempenho pessoal.
- **Premium:** assinatura que destrava profundidade de IA, analytics e cosméticos — nunca poder competitivo.
- **Loop Solo:** experiência individual de progressão + Coach (Fase 1).
- **North Star Metric:** Dias de Evolução por usuário ativo.

## 6. Entidades de domínio centrais

`User` · `LifeArea` · `Action / ActionLog` · `XPGrant / XPLedger (xp_events)` · `Level` · `Skill / SkillTree / SkillNode` · `Streak` · `Quest / Mission` · `Achievement / Badge` · `Season` · `Challenge` · `Ranking / Leaderboard / League` · `Guild / GuildMembership` · `FriendEdge / Follow` · `FeedItem / Milestone` · `SparksWallet / CosmeticItem / Inventory` · `Subscription / Plan` · `CoachSession / Insight / Recommendation` · `UserStat / StatSnapshot + Embedding` · `Organization / Team / Seat` (B2B).

Nomenclatura: entidades em inglês no código (`User`, `LifeArea`, `XPGrant`…) com glossário PT-BR; `snake_case` no DB; `dot.case` para eventos canônicos (`xp.granted`, `level.up`, …).

## 7. Sequenciamento de produto

Princípio-mestre: **construir o LOOP SOLO impecável antes do social**, para evitar o cold-start de uma rede social com "feed vazio".

- **Fase 0 — Fundação:** monorepo, Supabase+Drizzle+tRPC, auth, design tokens, observabilidade, i18n, esqueleto do schema.
- **Fase 1 — Loop Solo (núcleo):** VIVER → REGISTRAR → GANHAR XP → VER EVOLUÇÃO → COACH ORIENTA → PRÓXIMO OBJETIVO. Áreas/XP/Níveis, Skill Trees, Streaks, Missões, Conquistas, Temporadas, Faíscas, Coach em camadas, stats premium, Expo+push, Premium inicial. **Saída:** D7/D30 e streak médio fortes.
- **Fase 2 — Social:** grafo social, Feed só de progresso, Guildas, Desafios, Rankings/Ligas, ferramentas/monetização de criador, marketplace de cosméticos.
- **Fase 3 — B2B e Escala:** Organizações/Times/Assentos, dashboards anônimos, escala de infra, IA avançada, i18n ampliada.

Regra de ouro: nada entra antes do necessário. Social não vem antes de um loop solo que já encanta; B2B não vem antes de massa orgânica.

## 8. Identidade visual (oficial — Brand Identity 2026)

Fonte: `Rise Identity`. Esta seção é autoritativa sobre design; o doc 15 a segue.

**Conceito.** *"Cada ação positiva gera progresso. A marca é a linguagem visual dessa ascensão constante."* Símbolo = **dois chevrons empilhados** apontando para cima (topo Ascent Emerald = próximo passo; base Graphite = passo dado). Geometria: grade de 120u, vão de **64u**, ângulo de **41°**, passo vertical de **26u**, pontas arredondadas. O chevron é uma unidade repetível (empilhado vira barra de progresso / splash / padrão).

**Paleta oficial.**

| Nome | Hex | Uso |
|------|-----|-----|
| Ascent Emerald | `#10B981` | Acento / progresso / marca |
| Void | `#0A0B0D` | Fundo mais profundo (dark é o padrão) |
| Graphite | `#1A1D22` | Superfície |
| Ash | `#3A3F47` | Traços, chevron secundário, bordas fortes |
| Snow | `#F4F5F7` | Texto primário |

**Tipografia.** Wordmark/display: **Sora** Semibold, tracking −4.5%. Interface/texto: **Manrope** (400/500/600/700). Acento opcional "ponto esmeralda" (`Rise.`) assina o momento em que o progresso acontece.

**Implementação.** Tokens vivos em `apps/web/app/globals.css` (Tailwind v4 `@theme`) e o símbolo em `apps/web/components/rise-mark.tsx` (chevrons com a geometria exata acima). Estes valores superam os placeholders do doc 15.
