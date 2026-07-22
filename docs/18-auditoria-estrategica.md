# 18 — Auditoria & Planejamento Estratégico do Rise

> Documento vivo. Guia de evolução técnica e de produto para os próximos anos.
> Data: 2026-07-22. Autor: Arquitetura de Produto / Staff Eng.
> Método: auditoria multi-dimensão do repositório real (leitura de código, migrações
> e docs) confrontada contra os canônicos (`docs/00,07,08,13,14,16`). Não é opinião
> de brochura — cada afirmação aponta arquivo/linha ou o gargalo concreto.

**Regra de leitura:** severidade é honesta. Onde o produto está bom, digo curto.
Onde está podre ou é vaporware nos docs, digo em detalhe. Não escrevi para agradar.

---

## 0. Veredito executivo (leia isto se ler só uma coisa)

O Rise é, para o estágio, uma base **acima da média**: `packages/core` é um domínio
puro exemplar (124 testes, invariantes documentados, nível sempre derivado do XP),
a direção de dependências está correta, e há disciplina real de idempotência e
anti pay-to-win aplicada na arquitetura (não em `if`s espalhados). Isso é raro e é
o ativo mais valioso do projeto. Não jogue fora.

Mas há **seis rachaduras** que cobram juros com usuários reais em produção, em ordem
de urgência:

1. **RLS não existe.** O `deny-by-default` que o `docs/08` chama de "Definition of
   Done" está ausente das 16 migrações. A `anon key` é pública por design (vai em
   todo browser). Se o PostgREST estiver acessível — padrão do Supabase — qualquer
   um pode escrever direto em `xp_events`/`sparks_wallet`/`users.plan` e forjar
   XP, Faíscas e plano pago, ignorando 100% dos guardrails do tRPC. **Verificar
   hoje. É o único item que pode estar sendo explorado agora.**
2. **Estipêndio de Faíscas do Rise+ é vendido e nunca entregue.** Assinante paga,
   `subscription.status` mostra "300 Faíscas/mês", e nenhum código credita. Risco
   de estorno/reputação.
3. **Outbox órfã.** 4 routers gravam eventos em toda transação; não há consumidor
   (zero crons no Vercel — confirmado). Tabela write-only crescendo para sempre +
   custo puro no caminho quente.
4. **`action.log` é uma god procedure** de ~570 linhas / 25-40 statements numa
   transação, com projeção raceable (lost update **permanente** de XP em
   `life_areas.totalXp`) e `count(*)` do histórico inteiro por ação.
5. **Ranking global sem cache.** `league.week` e `class-war.week` varrem os
   `xp_events` da semana inteira, 2× por request. Funciona em 1k usuários; em 10k
   satura o banco; em 100k é inviável.
6. **19 routers, 5 testes.** Toda a lógica de API crítica (idempotência, teto,
   missões, compra, claim) não tem nenhum teste. E o `pnpm lint` do CI passa vazio
   (não há ESLint no repo).

Nada é estruturalmente irrecuperável. As correções P0 são **baratas** (1 índice,
1 UPDATE relativo, 1 migração de RLS, 1 cron). O erro estratégico seria crescer o
marketing antes de pagá-las. **Congelar features novas por ~1 sprint, fechar os P0,
depois acelerar.**

---

## 1. Auditoria por dimensão

### 1.1 Arquitetura & Código — Nota: A− (o ponto forte do projeto)

**Fortes**
- `packages/core` genuinamente puro: zero deps de runtime, invariantes testados
  (`xp/curve.ts:60`, `streak/engine.ts`), 124 testes verdes. Nível é sempre
  projeção do XP (ADR 0006). Isto é ouro.
- Dependências na direção certa: `api→core/db/ai`, `ai→core` (sem db), `db` não
  importa nada de cima. Gating premium é **estrutural** (`protectedProcedure →
  planProcedure → premiumProcedure`, `trpc.ts:32-70`), não espalhado.
- Idempotência de primeira: `UNIQUE(userId, clientActionId)` como **primeira**
  escrita da transação; ledger `xp_events` append-only; Faíscas isoladas do XP
  sem FK (ADR 0007 — pay-to-win impossível por schema).
- Comentários explicam o *porquê* e citam o doc canônico. Nível raro.

**Problemas**
| Sev | Onde | O quê |
|-----|------|-------|
| Alta | `action.ts:116-686` | God procedure de 570 linhas: streak+repair, 8 métricas de missão, freeze, Faíscas, projeções, Nível Rise, feed, conquistas, outbox — tudo síncrono numa tx. |
| Alta | `routers/*` | Zero testes nos 19 routers (só `xp-grant.test.ts`, 5 testes). Maior risco de regressão do produto sem rede. |
| Média | `docs/16` vs árvore | `packages/ui` e `packages/config` não existem. Tokens em `globals.css`, 38 componentes flat, `dashboard-live.tsx` com 919 linhas. `apps/mobile` (esqueleto) não tem como compartilhar UI. |
| Média | `u/[handle]/page.tsx:17` | Páginas web importam `@rise/db` direto e consultam o banco — viola a matriz do `docs/16 §3`. |
| Média | `mission-templates.ts` em `packages/db` | Regra de jogo (seleção de missão via hash FNV-1a, templates) mora na camada de dados; missão de Classe é construída inline no router com recompensa hardcoded. Deveria ser `core`. |
| Média | `turbo.json` + repo | Lint morto: task existe, nenhum pacote tem script, não há `eslint.config`. Monorepo em produção sem linting. |
| Baixa | `coach.ts` | `temperature` morto em `CONFIG_CAMADA`; `season.milestone.claimed` não está no catálogo `EVENTOS_GAMIFICACAO`; `multMissao` 1.5 hardcoded no router. |

### 1.2 Segurança — Nota: C (forte no app, buraco crítico nos dados)

**Fortes**
- Webhook Stripe **sólido**: HMAC-SHA256 + `crypto.timingSafeEqual` + anti-replay
  de 5 min + 400 em payload não verificado (`lib/billing.ts:107-136`). Única fonte
  que escreve `users.plan`.
- Autorização tRPC consistente: nenhuma procedure pública esquecida, nenhum IDOR
  encontrado nos fluxos sensíveis (área, perfil, feed, follows, shop). `shop.buy`
  recomputa preço no servidor e nunca toca XP.
- Sem segredos hardcoded no git (`.env` fora do versionamento; só `.env.example`).

**Problemas**
| Sev | Onde | O quê |
|-----|------|-------|
| **Crítica** | migrações vs `docs/08 §11` | **RLS deny-by-default ausente.** `grep policy/rls/row level` nas 16 migrações = 0. Trigger `prevent_mutation` prometida em `xp.ts:21` também não existe. Tabelas criadas via conexão direta Drizzle recebem grants default no Supabase → com anon key + PostgREST, forja de XP/Faíscas/plano direto no REST. |
| Alta | codebase inteiro | **Rate limiting inexistente** (`grep ratelimit/upstash` = 0). `/api/checkout` sem throttle; cota do Coach tem TOCTOU (concorrentes furam o COUNT → chamadas Anthropic extras = custo); `feed.react`/`follows` disparam push a terceiros sem limite (vetor de spam/assédio). |
| Alta | `perfil-client.tsx:193`, `action.ts:98`, `profile.ts:144` | Validação de upload só client-side. `accept` é burlável; servidor aceita `z.string().max(300)` sem checar mime/tamanho/dono. Bucket `avatars` público → conteúdo arbitrário servido pelo domínio Supabase. |
| Média | `SETUP.md:93-115` | Policies de Storage e RLS vivem só como SQL para colar à mão. Novo ambiente que pule o passo deixa bucket `provas` (privado!) e tabelas sem proteção. Drift de segurança por processo manual. |
| Baixa | `push.ts:56-63` | `unsubscribe` deleta por endpoint sem filtrar `userId`. `subscribe` reatribui inscrição incondicionalmente. |

**Nota sobre segredos locais:** o `.env.local` contém `SUPABASE_SERVICE_ROLE_KEY`,
`DATABASE_URL` (com senha) e `ANTHROPIC_API_KEY` reais. É o lugar correto (gitignored)
— **mas** como esses valores já circularam em ferramentas/logs desta sessão, considere
**rotacionar a `ANTHROPIC_API_KEY` e a `service_role`** por higiene, já que são as de
maior alavancagem (custo direto e acesso total ao banco, respectivamente).

### 1.3 Banco de Dados & APIs — Nota: C+ (bem desenhado no papel, rachaduras em produção)

**Fortes:** ledger event-sourcing correto, idempotência rigorosa, UPDATE set-based
com guard de status nas missões, pool do pooler configurado certo (`prepare:false`,
`max:4`, singleton). Migração 0013 mostra maturidade (dedup backfill antes do índice).

**Problemas** (os 4 críticos são os que derrubam o produto ao escalar):
| Sev | Onde | O quê |
|-----|------|-------|
| **Crítica** | migrações | Zero RLS + zero trigger de imutabilidade. "Ledger imutável" é convenção, não garantia. |
| **Crítica** | `platform.ts` outbox | Órfã: escrita em toda tx, nunca drenada (zero crons confirmado). ~milhões de linhas/ano em 10k DAU, custo puro no caminho quente. |
| **Crítica** | `league.ts:17`, `class-war.ts:26` | Agregação global sem cache: 2 varreduras dos `xp_events` da semana por request. 10k users = centenas de milhares de linhas por page view da Liga. |
| **Crítica** | `progress.ts:184` | `diario`/`diaDetalhe` fazem `LEFT JOIN xp_events ON action_log_id` **sem índice** em `xp_events(action_log_id)`. `diario` é a tela principal → colapso em 100k users. Índice ausente mais grave do sistema. |
| Alta | `action.ts` | Tx de ~25-40 statements sequenciais; p95 pode passar de 1s segurando locks e ocupando conexão do pooler. Teto global ≈ `pool/duração_tx` ações/s. |
| Alta | `action.ts:519-525` | **Lost update permanente:** `life_areas.totalXp` lido no início e escrito como valor absoluto no fim, sem `FOR UPDATE` nem `+= delta`. Duas ações concorrentes na mesma área → XP perdido para sempre na projeção (ledger fica certo, mas ninguém recomputa). |
| Alta | `action.ts:607` | `count(*)` do histórico completo de `action_logs` **em toda ação** (para avaliar conquistas). O(n) crescente. |
| Alta | `0009/0010` + `MANUAL` | **Drift confirmado:** `main_class_id` nunca aplicado em produção → quebrou Perfil/Classes/missões (500), reparado com SQL manual. Journal do Drizzle desalinhado do banco. Próximo deploy de schema é roleta. |
| Média | `feed.ts:34`, `social.ts:10`, `stats.ts:110` | Índices ausentes (`feed_items(user_id,id)`, `user_stats(rise_level)`); série de 30d em UTC enquanto XP agrupa por dia local. |
| Média | `xp.ts:62` tabela `levels` | Código morto: criada com 3 índices, nenhum router lê/escreve. |

### 1.4 UX / UI / Frontend — Nota: B (bonito e coeso; profundidade cresceu mais rápido que a arquitetura de informação)

> Auditoria automatizada desta dimensão bateu no limite de cota; avaliação abaixo
> é do responsável, com base no código conhecido. Recomendo rodar a passada
> automatizada quando a cota reabrir para caçar estados vazios faltantes tela a tela.

**Fortes**
- Identidade visual forte e consistente: tokens bem definidos (`globals.css`),
  Void/Emerald/Sora, animações com `prefers-reduced-motion` respeitado em toda parte.
- Regra "sem emoji" cumprida (ícones SVG). Landing cinética é de nível alto.
- Otimismo de UI no react do feed; números tabulares para não "dançar".

**Problemas / riscos**
| Sev | Onde | O quê |
|-----|------|-------|
| Alta | `app-nav.tsx` | **Sobrecarga de navegação:** 5 primários + 9 no "Mais" + notificações = 15 destinos. O produto acumulou telas (`foco`, `planejamento`, `coach`, `classes`, `estatísticas`, `ligas`, `feed`, `descobrir`, `loja`, `rise+`…) mais rápido que a hierarquia. Precisa de arquitetura de informação: agrupar em ~4-5 hubs (Hoje / Evoluir / Comunidade / Perfil). |
| Alta | `dashboard-live.tsx` (919 linhas) | Componente-monstro no client. Bundle e manutenção sofrem. Decompor. |
| Média | todas as telas | Cobertura de estados vazio/erro/loading provavelmente irregular tela-a-tela (não auditado exaustivamente). Faltam skeletons consistentes. |
| Média | repo | `tempoRelativo`/formatadores prováveis duplicados em N componentes (sintoma de falta de `packages/ui`). |
| Média | i18n | Strings pt-BR hardcoded. OK por ora, mas trava expansão internacional; mapear cedo. |
| Baixa | mobile | `apps/mobile` é esqueleto sem UI compartilhada — o web é a única superfície real hoje. |

### 1.5 Performance — Nota: C+
Frontend provavelmente bom (Next 15, RSC). O gargalo é **backend**: latência do
`action.log` (caminho quente), agregações de ranking sem cache, índices ausentes.
Ver 1.3. Nenhuma observabilidade de query (`pg_stat_statements`, tracing de tx lenta)
— hoje se otimiza no escuro.

### 1.6 SEO — Nota: C (aplicável só à superfície pública)
- **Existe:** OG image dinâmica por perfil (`u/[handle]/opengraph-image.tsx`),
  landing pública, metadata por rota.
- **Falta:** `sitemap.ts`, `robots.ts`, JSON-LD (schema.org), canonical, dados
  estruturados. Perfis públicos são conteúdo indexável desperdiçado — cada usuário
  ativo é uma landing page de SEO orgânico que hoje não ranqueia. Alavanca de
  crescimento barata e ignorada.

### 1.7 Infra & Deploy — Nota: C+
- Vercel `gru1`, auto-deploy no push. CI faz typecheck+test+lint — **mas `lint`
  passa vazio** (sem ESLint), então o verde do CI é parcialmente ilusório.
- **Zero crons** (`vercel.json` só tem region). Isso é a causa-raiz de 3 dívidas:
  outbox sem dreno, ranking sem refresh, estipêndio sem crédito. Um único cron
  destrava as três.
- Migrações **não** rodam no CI/CD — aplicadas à mão (ver drift 0009/0010). Maior
  risco operacional recorrente.
- `next.config` mínimo: sem security headers (CSP, HSTS), sem config de imagem.

### 1.8 Custos de operação — ver §6 (estimativas por escala)

### 1.9 Manutenibilidade — Nota: B−
Núcleo excelente; API concentra risco (god file + sem testes + sem lint). Docs são
detalhados **mas divergem do código** em pontos que importam (RLS, outbox, packages/ui,
particionamento, RAG/pgvector). Doc que promete o que não existe é pior que doc
ausente — gera falsa confiança. **Reconciliar docs com a realidade é dívida.**

---

## 2. Roadmap detalhado de melhorias (curto / médio / longo)

Formato por item: **Problema · Impacto usuário · Impacto negócio · Complexidade ·
Prioridade · Dependências · Riscos.**

### 2.1 Curto prazo (Sprint 0-1 — "estancar o sangramento")

**C1. RLS deny-by-default + REVOKE nas tabelas de economia**
- Problema: forja de XP/Faíscas/plano via PostgREST + anon key pública.
- Impacto usuário: integridade do jogo (rankings honestos); hoje forjável.
- Impacto negócio: fraude de plano pago = perda direta de receita; integridade é o
  produto inteiro num app de progresso.
- Complexidade: **Baixa** (1 migração: `ENABLE ROW LEVEL SECURITY` + `REVOKE
  INSERT/UPDATE/DELETE` de anon/authenticated; tRPC usa service_role, não é afetado).
- Prioridade: **CRÍTICA / imediata.**
- Dependências: nenhuma.
- Riscos: se alguma leitura pública (perfil, OG) depender de anon direto, precisa
  policy de SELECT — mapear antes. Risco geral ~zero (deny-all + service_role).

**C2. Verificar exploração ao vivo**
- Testar `GET https://<proj>.supabase.co/rest/v1/xp_events` com a anon key. Se
  retornar linhas, está aberto agora. Prio **CRÍTICA**, 10 min.

**C3. Índice `xp_events(action_log_id)` (`CREATE INDEX CONCURRENTLY`)**
- Problema: `diario` (tela principal) faz hash join do `xp_events` inteiro.
- Impacto usuário: latência da tela mais usada; colapso em escala.
- Complexidade: **Baixa** (1 linha SQL). Prio **CRÍTICA**. Sem downtime.

**C4. UPDATE relativo de `life_areas.totalXp`**
- Trocar escrita absoluta por `set total_xp = total_xp + ${delta}` (+ recomputar
  nível do novo total) ou `SELECT FOR UPDATE` da área.
- Problema: lost update permanente de XP. Impacto usuário: XP some silenciosamente.
- Complexidade: **Baixa**. Prio **CRÍTICA**. Risco: recomputar nível corretamente.

**C5. Entregar o estipêndio de Faíscas do Rise+**
- Crédito idempotente por `(userId, mês)` no primeiro acesso do mês (padrão igual
  ao `season.claim` já existente) ou via cron (ver C7).
- Impacto negócio: fecha risco de estorno; entrega o que foi vendido.
- Complexidade: **Baixa-Média**. Prio **Alta**. Dep: nenhuma (claim-on-login) ou C7.

**C6. Fechar o TOCTOU da cota do Coach**
- Contar+inserir atômico (ou advisory lock). Impede burla da cota → custo Anthropic.
- Complexidade: **Baixa**. Prio **Alta**.

**C7. Um cron (Vercel Cron) — destrava 3 dívidas**
- Drena outbox (`FOR UPDATE SKIP LOCKED` + delete), credita estipêndios, refresca
  ranking materializado.
- Complexidade: **Média** (1 route handler + `crons` no `vercel.json`).
- Prio **Alta**. Dep: define a estratégia de outbox e ranking (C8, M1).

**C8. Decidir destino da outbox agora**
- Ou consumidor (C7) ou remover as escritas. Hoje é custo + tabela infinita.
- Complexidade: **Baixa** (decisão) / **Média** (consumidor). Prio **Alta**.

**C9. ESLint flat config + regra de fronteira de imports**
- `no-restricted-imports`: apps não importam `@rise/db` (automatiza a regra do
  `docs/16` já violada 2×). Faz o `pnpm lint` do CI deixar de ser teatro.
- Complexidade: **Baixa**. Prio **Média**.

### 2.2 Médio prazo (Sprint 2-4 — "fundação para escalar")

**M1. Ranking semanal materializado**
- Tabela `weekly_xp(user_id, week, xp)` atualizada incrementalmente na própria tx
  do `action.log` (`ON CONFLICT DO UPDATE soma`) ou por cron 5 min. `league`/
  `class-war` leem dela; resposta cacheada 60s.
- Impacto: elimina o gargalo #3 de escala. Complexidade **Média**. Prio **Alta**.
  Dep: C7. Risco: consistência do incremento (testar).

**M2. Congelar e testar `action.log` ANTES de refatorar**
- Testes de integração com pglite (roda em CI sem Docker): replay de
  `clientActionId`, estouro de teto diário, missão simultânea, amortecedores.
- Prio **Alta**. Sem isto, qualquer refactor do god file é cego.

**M3. Enxugar a transação do `action.log` para ≤12 statements**
- Mover conquistas/feed para o consumidor da outbox; batch dos inserts de outbox
  num único multi-row; `count(*)` → contador incremental em `user_stats`; unificar
  os 2 ciclos de streak. Complexidade **Média-Alta**. Prio **Alta**. Dep: M2, C7.

**M4. `packages/ui` (tokens + componentes compartilhados)**
- Começar por tokens (`globals.css` → pacote) e pelos ~5 componentes usados em >1
  tela. Decompor `dashboard-live.tsx`. Destrava `apps/mobile`.
- Complexidade **Média**. Prio **Média**. Dep: atualizar `docs/16`.

**M5. Pipeline de migração confiável no CI/CD**
- `drizzle-kit migrate` contra o remoto + `drizzle-kit check` de drift antes do
  deploy. Reconciliar journal com 0009/0010. Aposentar SQL manual.
- Complexidade **Média**. Prio **Alta** (o processo já quebrou produção 1×).

**M6. Rate limiting** (Upstash ou limitador em Postgres)
- `/api/checkout`, `coach.conversar`, `follows`, `feed.react`. Prio **Alta**. Complex **Média**.

**M7. Validação server-side de upload** (mime real, tamanho, prefixo `<uid>/`).
- Prio **Média**. Complex **Baixa-Média**.

**M8. Corrigir o dead-end de tool use do Coach**
- Implementar 1 iteração do loop `tool_use → tool_result` (cobre 90% do valor) ou
  remover `COACH_TOOLS` e a menção fictícia a pgvector. Prio **Média**.

**M9. Índices restantes + queries sargáveis**
- `feed_items(user_id,id DESC)`, `user_stats(rise_level DESC)`, `notifications(user_id)
  WHERE read_at IS NULL`; teto diário por range `[início,fim)` local. Prio **Média**.

**M10. Observabilidade** — `pg_stat_statements` + log de tx >200ms no wrapper tRPC +
Sentry/PostHog. Prio **Média**. Sem isto, §6 são estimativas, não fatos.

### 2.3 Longo prazo (arquitetura para 100k+ — "não quebrar sob sucesso")

**L1. Job de recompute de projeções a partir do ledger** (rede de segurança do lost
update; roda nightly). Prio **Média**.

**L2. Plano de particionamento** de `xp_events`/`action_logs` (RANGE mensal) com
gatilho métrico documentado (~10M linhas). Retrofit tardio = rewrite com downtime.
Prio **Média** (planejar cedo, executar por gatilho).

**L3. Separar caminho quente do frio** — mover fan-out de feed, conquistas e
notificações 100% para workers assíncronos (Inngest/QStash). Prio **Alta @ escala**.

**L4. Read replicas / cache (Redis)** para leituras quentes (diario, ranking, perfil).
Prio **Média @ 100k**.

**L5. Reescrever docs para refletir a realidade** e manter ADRs atualizados. Contínuo.

---

## 3. Novas funcionalidades (50+)

Formato: **Objetivo · Público · Valor · Complexidade · Prioridade · Arquitetura.**
Agrupadas por tema. Prioridade considera esforço × retenção/receita.

### Núcleo de progresso & gamificação
1. **Retrospectiva anual "Rise Wrapped"** — Obj: recap gerado (spotify-wrapped).
   Público: todos. Valor: viralização + retenção sazonal. Complex: Média. Prio: Alta.
   Arq: agregação anual + OG images compartilháveis + cron de dezembro.
2. **Metas SMART com marcos** — Obj: metas de longo prazo com checkpoints. Todos.
   Retenção por comprometimento. Média. Alta. Estende `goal.ts`.
3. **Streak freeze comprável com Faíscas** — proteção anti-quebra. Todos. Reduz
   churn na quebra de streak (momento de maior abandono). Baixa. Alta. `economy`.
4. **"Boss fights" mensais** — desafio agregado de comunidade com meta coletiva de
   XP. Todos. Evento de engajamento. Média. Média. `season` + agregação.
5. **Habit stacking / rotinas** — encadear hábitos ("depois do café, ler 10min").
   Engajados. Formação de hábito real. Média. Alta.
6. **Prestígio / New Game+** — resetar nível de área por cosmético exclusivo de
   prestígio. Veteranos. Retenção de cauda longa (endgame). Média. Média.
7. **Multiplicadores de fim de semana / happy hour de XP** — eventos temporais.
   Todos. Picos de engajamento. Baixa. Média.
8. **Árvore de habilidades por área** (evolução visual da skill tree atual). Todos.
   Percepção de profundidade. Média. Média.
9. **"Comeback bonus"** — bônus por voltar depois de ausência (sem punir). Churned.
   Reativação. Baixa. Alta.
10. **Diário de gratidão / reflexão** que vira XP em Saúde Mental. Bem-estar. Retenção
    emocional. Baixa. Média.

### IA & personalização
11. **Coach proativo por notificação** — insight semanal push ("você lê mais às
    terças"). Engajados. Retenção via valor não solicitado. Média. Alta. Dep: cron+push.
12. **Sugestão de próxima ação** baseada em padrão (heurística primeiro, LLM depois).
    Todos. Reduz fricção de decisão. Média. Alta.
13. **Análise de foto de prova por visão** (validar que a foto bate com a ação —
    anti-fraude opcional). Todos. Integridade. Alta. Média. Claude vision, gated.
14. **Resumo em linguagem natural do dia/semana** (heurística → Haiku). Todos. Baixo
    custo, alto encanto. Baixa. Alta.
15. **Detecção de burnout / overtraining** (alerta quando padrão fica insustentável).
    Bem-estar. Diferencial ético. Média. Média.
16. **Coach com memória de longo prazo** (RAG real sobre histórico — o pgvector
    prometido). Rise+. Profundidade. Alta. Média.
17. **Planejamento semanal assistido por IA** (o `/planejamento` + sugestão). Engajados.
    Média. Média.

### Social & comunidade (o fosso mais difícil de copiar)
18. **Grupos / squads** — micro-comunidades com feed e ranking próprios. Todos.
    Retenção social (o maior multiplicador de retenção que existe). Alta. **Alta**.
19. **Accountability partners** — parear 2 usuários com metas parecidas. Engajados.
    Retenção por compromisso interpessoal. Média. Alta.
20. **Desafios 1v1 / duelos** — competição direta por período. Todos. Engajamento
    competitivo. Média. Média.
21. **Comentários e reações ricas no feed** (além da "Força"). Todos. Loop social.
    Baixa. Média. Estende `feed`.
22. **Menções e feed de amigos priorizado**. Todos. Relevância. Baixa. Média.
23. **Perfis públicos como landing de SEO** (já existe base; falta indexação). Todos.
    Crescimento orgânico. Baixa. **Alta**. Ver §1.6.
24. **Clubes por Área** (comunidade de "Corrida", "Programação"). Nichos. Descoberta.
    Média. Média.
25. **Mentoria** — veteranos guiam novatos por Faíscas/reputação. Comunidade. Fosso.
    Alta. Baixa.
26. **Feed de "prova do dia" curado** (melhores provas, opt-in). Todos. Inspiração.
    Baixa. Média.

### Produtividade & integrações
27. **Integração com Health/Google Fit/Apple Health** — importar passos, treino, sono
    automaticamente. Todos. Reduz fricção (XP sem log manual). Alta. **Alta**. Ver §8.
28. **Integração Strava** — corrida/ciclismo viram XP automático. Atletas. Fosso +
    aquisição. Média. Alta.
29. **Integração GitHub** — commits viram XP em Programação. Devs (público inicial!).
    Aquisição do nicho fundador. Média. Alta.
30. **Widget mobile / home screen** — streak e ação rápida sem abrir o app. Todos.
    Retenção diária. Alta. Média (precisa app nativo real).
31. **Apple Watch / Wear OS** — log de ação no pulso. Atletas. Fricção zero. Alta. Baixa.
32. **Calendário (Google/Outlook)** — eventos concluídos viram ações. Produtividade.
    Média. Média.
33. **Import de Notion/Todoist/hábitos existentes**. Migrantes de outros apps. Aquisição.
    Média. Baixa.
34. **API pública / webhooks** — devs plugam suas próprias fontes. Power users.
    Ecossistema (fosso). Alta. Baixa. Ver §7.
35. **Automações estilo IFTTT** ("terminei pomodoro → +XP foco"). Power users. Média. Baixa.

### Retenção & hábito
36. **Onboarding gamificado** com primeira vitória em <60s. Novos. **Ativação** (a
    métrica que mais move receita). Média. **Crítica**.
37. **Notificações inteligentes** (horário ótimo por usuário, não spam). Todos. Retenção.
    Média. Alta. Dep: push+cron.
38. **Modo descanso / férias** (pausar streak sem culpa — já há base). Todos. Anti-churn
    ético. Baixa. Média.
39. **Lembretes contextuais por área** ("sua hora de ler"). Todos. Formação de hábito.
    Baixa. Média.
40. **Recap de domingo** (semana em revisão + meta da próxima). Engajados. Ritual. Baixa. Alta.

### Monetização & cosmética
41. **Temas de app premium** (dark variants, paletas). Rise+. Receita cosmética. Baixa. Média.
42. **Molduras animadas / efeitos de level-up premium**. Rise+. Receita. Baixa. Média.
43. **Battle Pass sazonal** (trilha de recompensas por temporada, cosmético). Todos/pago.
    Receita recorrente + engajamento. Alta. **Alta**. Estende `season`.
44. **Presentear Faíscas/Rise+** a um amigo. Todos. Aquisição viral + receita. Média. Média.
45. **Marketplace de cosméticos de criadores** (rev-share). Criadores. Fosso + receita.
    Alta. Baixa. Ver §7.

### Analytics & insight (Rise+)
46. **Dashboard de correlações** ("nos dias que você treina, seu foco sobe 30%").
    Rise+. Valor "aha" difícil de copiar. Média. Alta. Dep: `stats`.
47. **Exportar dados (CSV/PDF report)**. Rise+/power. Confiança + B2B. Baixa. Média.
48. **Comparativo com coorte anônima** ("top 10% em consistência"). Todos. Motivação.
    Média. Média.
49. **Previsão de nível** ("neste ritmo, nível 20 em 3 semanas"). Todos. Motivação.
    Baixa. Média.
50. **Heatmap de consistência** (GitHub-style — já iniciado). Todos. Percepção de esforço.
    Baixa. Feito/em progresso.

### Acessibilidade & alcance
51. **i18n (EN primeiro)** — abre mercado global. Todos. Crescimento. Média. Média.
52. **Modo offline (PWA robusto)** — logar ação sem rede, sincroniza depois. Todos.
    Confiabilidade. Média. Média.
53. **Acessibilidade AA completa** (leitor de tela, contraste, teclado). Todos + B2B/gov.
    Alcance + conformidade. Média. Média.

---

## 4. Diferenciais competitivos (o fosso)

Prioridade a recursos **difíceis de copiar** e que aumentam retenção/percepção de valor.

1. **Prova real, não honra system.** Habitica/Finch confiam no auto-relato. Rise já
   tem foto de prova + foco cronometrado. Dobrar nisso (validação por visão IA,
   integrações que geram XP automático) cria integridade que apps de "marcar
   caixinha" não têm. **Este é o posicionamento central.**
2. **Economia à prova de pay-to-win por schema** (ADR 0007). Nenhum concorrente
   pode "comprar nível". Vender isso como valor ("seu progresso é real, ninguém
   compra").
3. **Coach ancorado em FATOS determinísticos** (anti-alucinação por design). IA que
   não inventa seu progresso — confiança que chatbots genéricos não dão.
4. **Grafo social de accountability** (squads + partners + mentoria). Retenção social
   é o fosso mais forte e mais caro de replicar — cada usuário conectado é um custo
   de saída.
5. **Multi-área da vida unificada.** Strava é só esporte, GitHub streak é só código,
   Duolingo só idioma. Rise agrega tudo num único "personagem". A visão de "RPG da
   vida" é o guarda-chuva que nenhum vertical cobre.
6. **Wrapped/retrospectiva + perfis públicos** como motor de crescimento orgânico
   embutido no produto (loop viral sem custo de aquisição).

---

## 5. Roadmap por versão

**MVP refinado (agora → 4 semanas)** — estancar sangramento + ativação.
RLS, índice crítico, lost-update, estipêndio, 1 cron, ranking materializado, testes
de `action.log`, onboarding <60s, estados vazios/erro completos. *Nada novo grande;
consertar e polir o que existe.*

**v1.0 (2-3 meses)** — produto sólido e retentivo.
Squads/accountability, integrações âncora (GitHub + Strava/Health), Coach proativo,
Wrapped, SEO de perfis, rate limiting, `packages/ui`, pipeline de migração no CI,
i18n EN. *Foco: retenção D30 e um loop de crescimento.*

**v2.0 (6-9 meses)** — plataforma e receita.
Battle Pass sazonal, dashboard de correlações (Rise+), marketplace de cosméticos,
API pública/webhooks, RAG real no Coach, app mobile nativo com widget, automações.
*Foco: LTV e ecossistema.*

**v3.0 (12-18 meses)** — escala e B2B.
Rise for Teams/Empresas (wellness corporativo), read replicas + cache + particionamento,
white-label/licenciamento, workers assíncronos completos. *Foco: nova linha de receita
e infra para 100k-1M.*

**Visão de longo prazo** — o "sistema operacional do autodesenvolvimento": qualquer
esforço real de qualquer fonte (wearables, apps, sensores) vira progresso num único
personagem de vida, com uma economia honesta e uma comunidade que sustenta o hábito.
A IA vira um verdadeiro companheiro que conhece sua trajetória de anos.

---

## 6. Escalabilidade por marco

| Métrica | 1.000 users | 10.000 users | 100.000 users | 1.000.000 users |
|---|---|---|---|---|
| **Estado** | Funciona como está | Liga/Classes saturam banco; pooler estoura em picos | Diario sem índice + tx lenta derrubam o produto | Arquitetura atual inviável sem reescrita de caminho frio |
| **Banco** | Supabase Free/Pro OK | **Pro obrigatório**; ranking materializado (M1); índices (C3,M9) | Read replica; cache Redis; caminho frio em workers | Particionamento (L2); sharding de leitura; connection pooling dedicado (Supavisor/PgBouncer tuned) |
| **Caminho quente** | `action.log` OK | Enxugar tx (M3) — senão pool satura | Fan-out 100% assíncrono (L3) | Event streaming; write-behind |
| **Ranking** | Query direta OK | **Materializar já** | Refresh incremental + cache 60s | Ranking aproximado / sampling |
| **Custo IA** | ~$5-30/mês | ~$50-300/mês (heurística absorve volume) | ~$500-3k/mês (gating estrito) | Cache de respostas + Haiku default + Opus só pago |
| **Ação #1** | Fechar P0 de segurança | Ranking materializado + índices + tx enxuta | Cache + replicas + workers | Particionamento + repensar hot path |

**Custos aproximados de operação** (ilustrativos — validar com dados reais):
- **Supabase:** Free até ~centenas de users; Pro (~$25/mês) a partir de 1k por
  causa de conexões/storage de fotos. Storage de provas é o vetor de crescimento —
  política de retenção/compressão de imagem cedo.
- **Vercel:** Free/Pro ($20) até 10k; function invocations e OG image dominam depois.
- **Stripe:** ~2.9%+taxa por transação (custo variável, não fixo).
- **IA:** ver §7.

---

## 7. Inteligência Artificial (onde IA agrega de verdade)

A arquitetura de 4 camadas (`docs/14`) já está **certa**: heurística L0 absorve
volume, Haiku para curto, Sonnet para o dia a dia, Opus para Análise Profunda paga.
Manter. O erro seria jogar Sonnet/Opus em tudo.

**Modelos e uso recomendado:**
- **Heurística (L0, $0):** todo o volume de respostas simples. Já é o default. Manter
  agressivo — é o que torna o Coach sustentável no Free.
- **Haiku (`claude-haiku-4-5`):** resumos de dia/semana, classificação, redação
  curta. Custo por interação na casa de frações de centavo. Onde IA "encanta" barato.
- **Sonnet (`claude-sonnet-5`):** Coach conversacional do dia a dia. ~2-3k tokens in
  + ~1k out por mensagem. Com cota Free e heurística absorvendo o grosso, estimo
  **~$0.05-0.15/usuário engajado/mês**. Aceitável.
- **Opus (`claude-opus-4-8`):** Análise Profunda semanal, **gated Rise+**. ~$0.30-0.40
  por análise → ~$1.20-1.60/mês por assinante. É o item caro; por ser pago e dedupe
  por semana (já implementado), é sustentável. **Nunca** liberar no Free.

**Onde IA agrega de verdade (não por moda):**
1. Coach proativo com insight semanal (retenção). 2. RAG real sobre o histórico
   (o pgvector prometido — hoje é ficção nas tools). 3. Detecção de burnout.
4. Validação de prova por visão (integridade — o diferencial #1). 5. Correlações
   ("treino → foco"). **Onde NÃO agrega:** gerar missões triviais (heurística resolve),
   "chat por chat". Manter a régua de "a camada mais barata que resolve".

**Dívida de IA atual:** o loop de `tool_use` não existe (tools são peso morto que
degrada respostas) e o `pgvector`/RAG é vaporware nos docs. Corrigir (M8) ou remover
as promessas.

---

## 8. Monetização (além do Rise+ atual)

O Rise+ (Stripe, mensal/anual/founder) já existe. Novas linhas, por potencial:

- **B2C recorrente:** Battle Pass sazonal (receita previsível + engajamento);
  temas/cosméticos premium; presentear Rise+/Faíscas (aquisição viral).
- **Marketplace:** cosméticos de criadores com rev-share (fosso + receita passiva).
- **Rise+ tiers:** hoje binário; considerar tier "Pro" (correlações, export, RAG
  Coach) acima do Plus.
- **B2B / Corporativo (maior TAM de longo prazo):** "Rise for Teams" — wellness e
  produtividade corporativa com dashboard de gestor (agregado, anonimizado), desafios
  de equipe. Empresas pagam por seat. Ticket alto, churn baixo.
- **API / Licenciamento:** API pública paga para devs; white-label do motor de
  gamificação para outros produtos (o `packages/core` é licenciável como engine).
- **Programas:** parcerias com academias/escolas (B2B2C), afiliados.

**Guardrail inviolável:** nada disso pode tocar a progressão (anti pay-to-win, ADR
0007). Monetizar cosmética, profundidade de insight, conveniência e B2B — nunca XP.

---

## 9. Integrações (por valor)

**Âncora (fazer cedo — reduzem fricção e trazem aquisição):**
- **GitHub** (commits → XP Programação; o público fundador é dev).
- **Strava** (treino/corrida → XP automático; atletas + viralidade).
- **Apple Health / Google Fit** (passos, sono, treino, mindfulness → XP sem log manual).

**Alto valor:**
- Google/Apple Calendar (eventos → ações), Notion/Todoist (import de hábitos),
  Spotify (foco), Duolingo/Anki (idiomas/estudo).

**Plataforma:**
- Webhooks + API pública (power users plugam qualquer fonte), Zapier/Make, Slack/Discord
  (compartilhar progresso, squads).

**Infra (já parciais):** Stripe (pago, sólido), Web Push/VAPID (configurado), PostHog
(analytics — mencionado nos docs), Sentry (falta — adicionar).

Arquitetura: cada integração é um "adaptador" que emite a mesma `action.log` interna.
Um `packages/integrations` com um contrato comum evita N implementações ad-hoc.

---

## 10. Benchmark (o que os melhores fazem e como superar)

- **Habitica** (RPG de hábitos): profundidade de RPG e comunidade, mas honra-system
  (auto-relato) e UI datada. **Rise supera** com prova real + design premium.
- **Duolingo** (rei da retenção): streak psychology, notificações e ligas impecáveis.
  **Aprender:** a maestria de streak/notificação e ligas semanais. **Superar:** Rise
  é multi-área, não vertical único.
- **Finch / Fabulous** (bem-estar): onboarding e apego emocional fortes. **Aprender:**
  ativação em <60s e tom acolhedor. **Superar:** Rise mede esforço real, não só humor.
- **Strava** (esporte social): o feed social e segmentos criam fosso brutal. **Aprender:**
  o loop social é o produto. **Superar:** Rise agrega TODAS as áreas, não só esporte.
- **GitHub** (contribution graph): o heatmap é o vício. **Aprender:** visualizar
  consistência vicia. Rise já está copiando (bom).

**Síntese:** os campeões vencem em **um** eixo (Duolingo=retenção, Strava=social,
Habitica=RPG). O Rise pode ganhar sendo o **agregador honesto** de todos — desde que
execute retenção no nível do Duolingo e social no nível do Strava. Hoje falta a
maestria de **notificação/ativação** (Duolingo) e a **profundidade social** (Strava).
São as duas maiores lacunas competitivas.

---

## 11. Dívida técnica (checklist priorizado)

**Pagar antes de crescer (bloqueiam escala/confiança):**
- [ ] RLS deny-by-default + trigger de imutabilidade em migração versionada.
- [ ] Consumidor da outbox (ou remover as escritas).
- [ ] Crédito do estipêndio de Faíscas (vendido, não entregue).
- [ ] Índice `xp_events(action_log_id)` + índices de feed/social/notificações.
- [ ] UPDATE relativo de `life_areas.totalXp` (lost update permanente).
- [ ] Testes de integração de `action.log`/`season.claim`/`shop.buy` (pglite).
- [ ] Pipeline de migração confiável no CI (reconciliar drift 0009/0010).
- [ ] ESLint + regra de fronteira de imports (lint hoje é teatro).
- [ ] Rate limiting (checkout, Coach, push).
- [ ] Validação server-side de upload.

**Pagar durante o crescimento:**
- [ ] Quebrar `action.log` (extrair `avaliarMissao` para core; fan-out via outbox).
- [ ] `packages/ui` + decompor `dashboard-live.tsx` (919 linhas).
- [ ] Ranking materializado.
- [ ] Loop de tool use do Coach OU remover tools/pgvector fictícios.
- [ ] Reconciliar docs com a realidade (RLS, outbox, ui, particionamento, RAG).

**Higiene (barato, faça em lote):**
- [ ] `season.milestone.claimed` no catálogo de eventos; `multMissao` 1.5 → core;
      `push.unsubscribe` filtrar userId; `temperature` morto; tabela `levels` (usar
      ou remover); round-trip de timezone (cachear no contexto).

---

## 12. Crítica a decisões antigas (que hoje não fazem mais sentido)

1. **Docs que prometem o que não existe.** `docs/07/08/14/16` descrevem RLS, outbox
   drenada, `packages/ui`, particionamento e RAG/pgvector como se existissem. Isso é
   pior que ausência — gerou falsa confiança de segurança e arquitetura. **Alternativa:**
   docs descrevem o que existe; o que é plano vai para uma seção "Planejado" explícita.
2. **Outbox transacional sem consumidor.** Adotar o padrão outbox (correto em teoria)
   sem nunca construir o relay adicionou custo e uma tabela infinita sem entregar o
   benefício. **Alternativa:** ou o cron/worker entra junto, ou não escreve na outbox
   ainda (event-sourcing só no ledger, fan-out síncrono enxuto no MVP).
3. **`action.log` como transação monolítica.** Contradiz o próprio `docs/07 §1.3`
   ("caminho quente enxuto"). Cresceu por conveniência. **Alternativa:** hot path
   grava o mínimo atômico (ação + XP + streak); conquistas/feed/notificações são
   derivados assíncronos.
4. **Lógica de jogo em `packages/db`** (seleção de missão, templates). Camada errada.
   **Alternativa:** regra de jogo é `core`; `db` só persiste.
5. **Migrações manuais.** O reparo por SQL colado no manual quebrou produção uma vez
   e vai de novo. **Alternativa:** migração é sempre versionada e aplicada por pipeline.
6. **Navegação que cresce com o produto** (15 destinos). Cada feature nova virou um
   item de menu. **Alternativa:** hubs temáticos fixos; features novas entram *dentro*
   de um hub, não como novo destino de topo.
7. **`temperature` e tabela `levels`** — restos de decisões revertidas. Remover.

---

## 13. Plano de execução priorizado (o que fazer, o que esperar, o que não fazer)

**AGORA (esta semana) — não negociável:**
1. Verificar exploração de RLS ao vivo (C2, 10 min).
2. Migração de RLS deny-by-default (C1).
3. Índice `xp_events(action_log_id)` (C3).
4. UPDATE relativo de `life_areas.totalXp` (C4).
5. Entregar estipêndio de Faíscas (C5).
6. Decidir e implementar 1 cron: outbox + estipêndio (C7/C8).

**PRÓXIMAS 3-4 SEMANAS — fundação:**
Ranking materializado (M1), testes de `action.log` (M2), enxugar a tx (M3), pipeline
de migração (M5), rate limiting (M6), ESLint (C9), onboarding <60s (feature 36),
estados vazios/erro completos, SEO de perfis (feature 23).

**PODE ESPERAR (v1+):** `packages/ui`, i18n, integrações (começar por GitHub — nosso
público), squads, Wrapped, Coach proativo, RAG real, mobile nativo.

**NÃO VALE A PENA AGORA:** marketplace de criadores, API pública, white-label,
Battle Pass, B2B/corporativo, particionamento (planejar, não executar), read replicas.
São movimentos de v2/v3 — construir antes de ter retenção comprovada é desperdício.

**A ordem certa é:** *segurança & integridade → retenção (ativação + social +
notificação) → crescimento (SEO + integrações + viral) → receita (passe/marketplace)
→ escala (infra) → B2B.* Pular etapas — especialmente crescer marketing antes de
fechar os P0 de segurança — é o único erro caro e irreversível neste momento.

---

## 14. Métricas para instrumentar (senão isto vira achismo)

Ativação (% que faz 1ª ação em <24h), D1/D7/D30 retention, DAU/MAU, streak médio,
% que quebra streak e churna, conversão Free→Rise+, LTV, custo IA por usuário, p50/p95
do `action.log`, custo de query da Liga. **Sem PostHog + `pg_stat_statements` + Sentry,
todo o resto deste doc são hipóteses fundamentadas — não fatos.** Instrumentar é o
verdadeiro P0 transversal.
