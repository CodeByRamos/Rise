# Rise — Fundação do Produto

> **Rise não é um organizador de tarefas. É um videogame da vida real.**
> Toda ação positiva gera progresso real. Missão: *ajudar pessoas a evoluírem constantemente em todas as áreas da vida.*

Este diretório é a **referência viva** do produto — escrito antes da primeira linha de código de aplicação. Comece pelo **[Canon](00-canon.md)**: é a fonte única da verdade (voz da marca, stack, modelo de gamificação, personas, glossário, entidades, sequenciamento). Nenhum documento pode contradizê-lo.

## North Star
**Dias de Evolução por usuário ativo.** Toda decisão de produto é filtrada por: *isso faz a pessoa evoluir de verdade e querer voltar amanhã — sem manipulação?*

## Índice

| # | Documento | O que cobre |
|---|-----------|-------------|
| 00 | [Canon](00-canon.md) | Fonte da verdade: marca, stack, gamificação, personas, glossário, entidades, sequenciamento |
| 01 | [Visão do Produto](01-visao-produto.md) | O que é, por que existe, north star, o que **não** é |
| 02 | [Missão & Proposta de Valor](02-missao-proposta-valor.md) | Missão, posicionamento, "por que agora", manifesto |
| 03 | [Personas](03-personas.md) | Lia, Bruno, Marina, Caio, Renata, Diego — dores, objetivos, JTBD |
| 04 | [Problemas Resolvidos](04-problemas-resolvidos.md) | Por que apps de hábito/tarefa falham; o gap emocional |
| 05 | [Diferenciais Competitivos](05-diferenciais.md) | Moat vs Habitica, Duolingo, Finch, Notion, Strava, Fabulous |
| 06 | [Roadmap por Fases](06-roadmap.md) | Fases 0–5, gates métricos, marcos, sequenciamento solo→social |
| 07 | [Arquitetura Técnica](07-arquitetura-tecnica.md) | Stack justificada, monorepo, tRPC, Realtime, jobs, segurança, escala, 5 ADRs |
| 08 | [Banco de Dados](08-banco-de-dados.md) | Modelo Postgres/Drizzle, ER, RLS, particionamento, event sourcing de XP |
| 09 | [Fluxos de Navegação](09-fluxos-navegacao.md) | IA de navegação web/mobile, onboarding, loop diário, estados |
| 10 | [Funcionalidades Priorizadas](10-funcionalidades.md) | Épicos, RICE/MoSCoW, MVP (P0) vs P1/P2/P3 |
| 11 | [Estratégia de Retenção](11-retencao.md) | Loop Hooked ético, ritmos, win-back, métricas, anti-padrões |
| 12 | [Monetização](12-monetizacao.md) | Tiers, preços, marketplace, B2B, unit economics, ética |
| 13 | [Gamificação](13-gamificacao.md) | Motor de XP, curvas, skill trees, streaks, temporadas, ligas, anti-fraude |
| 14 | [Sistema de IA (Coach)](14-sistema-ia.md) | IA em camadas, RAG, tool use, momentos, guardrails, evals |
| 15 | [Design System](15-design-system.md) | Tokens, dark mode, tipografia, motion, componentes, acessibilidade |
| 16 | [Estrutura de Pastas](16-estrutura-pastas.md) | Topologia do monorepo, regra de dependência, convenções |
| 17 | [Plano de Sprints](17-plano-sprints.md) | Sprint 0 + Sprints 1–8 (MVP) + esboço Fase 2 |
| — | [ADRs](adr/) | Decisões arquiteturais registradas |

## Decisões de fundador (pushbacks ao brief)
1. **Mobile nativo (Expo) na arquitetura desde já** — PWA é ponte, não destino. Engajamento diário depende de push nativo e presença na home.
2. **Loop solo impecável antes do social** — rede social só na Fase 2, com gate métrico (D7/D30 + streak), para evitar cold-start de feed vazio.
3. **Drizzle > Prisma** — performance serverless/edge, SQL-first, fit com pgvector (ADR 0001).
4. **IA em camadas por custo** — heurística → Haiku → Sonnet → Opus (gated Premium). Unit economics importa.
5. **Monetização base antecipada para a Fase 1** — validar disposição a pagar cedo, com guardrails anti pay-to-win (competição só por progresso; pago = cosmético/conveniência/IA).

## Convenções
- Idioma dos docs: **PT-BR**. Código: entidades em inglês + glossário PT-BR.
- Arquivos: `docs/NN-nome-kebab.md`. ADRs: `docs/adr/NNNN-titulo.md`.
- Toda decisão técnica relevante vira ADR.
