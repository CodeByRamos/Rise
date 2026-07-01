# 11 — Estratégia de Retenção (Progresso + Comunidade)

> Documento canônico do Rise. Escopo: como o Rise transforma "ações reais positivas" em retorno diário, semanal e sazonal — de forma ÉTICA, sem dark patterns, sem FOMO artificial, sem vício prejudicial. Define o loop central de engajamento, ritmos, onboarding com aha moment em <2 min, notificações inteligentes, streaks saudáveis, missões/temporadas, comunidade como multiplicador (Fase 2), ressurreição de inativos, métricas-alvo e instrumentação em PostHog, experimentos A/B e os anti-padrões inegociáveis. Subordinado ao `docs/00-canon.md` e consistente com `docs/10-arquitetura.md`, `docs/13-gamificacao.md`, `docs/funcionalidades`, `docs/monetizacao` e `docs/design`.

## TL;DR

A tese da retenção do Rise é simples e contrária ao mercado de "apps de hábito": **a retenção não vem do app, vem da evolução real do usuário.** O nosso trabalho é tornar essa evolução **visível, recompensada e iminentemente continuável**. O loop central (Gatilho → Ação → Recompensa Variável → Investimento) é o de *Hooked*, mas operado com guardrails: a recompensa variável nunca é manipulativa, o investimento sempre devolve valor real (XP, Skill Tree, Insight do Coach), e a saída é tão fácil quanto a entrada.

Regra-mestra herdada do sequenciamento: **o Loop Solo precisa reter sozinho antes do social.** Comunidade (Fase 2) é multiplicador de algo que já encanta — nunca a muleta de um produto vazio. A North Star **Dias de Evolução por usuário ativo** é o alvo único; toda alavanca de retenção existe para movê-la honestamente.

---

## 1. Princípios de retenção (a régua)

1. **Retenção é consequência de progresso real, não causa.** Se o usuário não evoluiu na vida, qualquer notificação é spam. Primeiro entregamos valor, depois pedimos retorno.
2. **Tempo bem gasto > tempo gasto.** Sessão curta e densa que termina com o usuário satisfeito vence sessão longa que termina em fadiga. Otimizamos *Dias de Evolução*, nunca *tempo de tela*.
3. **Recompensa variável sim, incerteza predatória não.** Variamos a forma/intensidade da celebração e do conteúdo do Coach — nunca escondemos odds nem criamos loot box.
4. **A porta de saída é larga.** Pausar streak (Modo Descanso), silenciar notificações, cancelar Premium — tudo simétrico e sem fricção. Confiança retém mais que aprisionamento.
5. **Honestidade by design.** Dinheiro/Faíscas nunca compram retorno competitivo. Nenhuma alavanca de retenção fere os guardrails do `gamificationCore`.
6. **Coach é guardião do bem-estar.** A IA detecta excesso e sugere descanso. O produto que protege o usuário do burnout retém por anos, não por semanas.

---

## 2. O Loop Central de Engajamento (Hooked, versão ética)

O modelo de Nir Eyban (Gatilho → Ação → Recompensa Variável → Investimento) é a espinha. A diferença do Rise é que **cada estágio devolve valor real e respeita a autonomia.**

```
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        ▼                                                  │
   ┌─────────┐    ┌────────┐    ┌──────────────┐    ┌─────────────┐
   │ GATILHO │ →  │  AÇÃO  │ →  │  RECOMPENSA  │ →  │ INVESTIMENTO│
   │externo/ │    │viver+  │    │   VARIÁVEL   │    │  carrega o  │
   │ interno │    │registrar│   │ (AAA + valor)│    │próximo loop │
   └─────────┘    └────────┘    └──────────────┘    └─────────────┘
```

### 2.1 Gatilho

| Tipo | Exemplos no Rise | Princípio ético |
|------|------------------|-----------------|
| **Externo** | Push nativo/Web Push com *time-to-send* por IA, e-mail de marco (Resend), missão diária pronta na home, lembrete de streak em risco | Frequência calibrada, opt-out de 1 toque, nunca culpa |
| **Interno** | Vontade de "fechar o anel do dia", curiosidade pelo Insight semanal, orgulho de subir de Nível de Área, sensação de identidade ("sou alguém que evolui") | O gatilho interno é o objetivo final — o externo deve se tornar dispensável |

A maturação de retenção = **migrar do gatilho externo para o interno.** Medimos isso pela queda de sessões originadas de push ao longo das coortes (sessão orgânica é sinal de hábito formado, não de falha de notificação).

### 2.2 Ação (o evento de maior valor do produto)

A **Registro de Ação** (maior RICE do produto, 40.0) é o átomo do loop. Precisa ser quase instantânea:

- **1-tap** para ações recorrentes favoritas (ex.: "Treino feito", "30 min de leitura").
- **Quick log** com fricção mínima e `client_action_id` para idempotência (anti duplo-toque, anti-farm).
- Caminho quente com alvo **p95 < 200ms** (`action.log`); XP é computado no servidor e o cliente faz *optimistic UI* com feedback imediato.
- Emite `action.logged → action.validated → xp.granted` (eventos canônicos de `docs/13-gamificacao.md`).

> **Decisão:** quanto menor a fricção da Ação, maior a frequência do loop. Investimos desproporcionalmente em velocidade e prazer aqui porque é o evento que mais se repete por dia.

### 2.3 Recompensa Variável (variável na FORMA, transparente na REGRA)

A regra de XP é **determinística e auditável** (curva `50n²+50n`, custo do próximo nível `100·(n+1)`). O que varia é a **embalagem emocional** e o **conteúdo de valor**, não a probabilidade de ganhar.

| Camada da recompensa | O que varia | Por que é ético |
|----------------------|-------------|-----------------|
| **Recompensa da Caça** (conteúdo) | Qual Insight o Coach traz, qual missão sugere amanhã, qual padrão revelou | Valor real e personalizado (RAG sobre StatSnapshot), nunca aleatoriedade vazia |
| **Recompensa da Tribo** (social, Fase 2) | Reações ao marco no Feed, posição na Liga, progresso da guilda | Baseada só em progresso real; reconhecimento, não comparação tóxica |
| **Recompensa do Eu** (maestria) | Galho de Skill Tree que destrava, Conquista surpresa, raridade do level-up | Variação na celebração AAA escala com a raridade do evento (`design`), nunca odds ocultas |

A celebração visual (`LevelUpOverlay`, partículas com teto e cleanup) **escala com a magnitude do evento** — um Nível Rise vale uma celebração maior que um +10 XP. Isso cria variabilidade emocional legítima sem mentir sobre a economia.

### 2.4 Investimento (o que carrega o próximo loop)

Cada sessão deixa o usuário com mais "pele em jogo" — e isso **devolve valor**, não aprisiona:

- **Dados acumulados** → Coach fica mais preciso (RAG cresce com o histórico).
- **Skill Tree** parcialmente destravada → puxa o próximo objetivo natural.
- **Streak ativa** → micro-compromisso saudável (com todos os amortecedores da §5).
- **Missão de amanhã** já semeada pelo Coach → o próximo gatilho interno já nasce na sessão de hoje.
- **Identidade construída** → o Dashboard "Minha Evolução" é o espelho que o usuário volta para ver.

> **Anti-padrão evitado:** investimento que só serve para *aprisionar* (ex.: "você perde tudo se sair"). No Rise, **sair nunca apaga XP, nível, Skill Tree ou Conquista.** O investimento puxa de volta por valor, não por medo de perda.

---

## 3. Ritmos de retorno (diário / semanal / sazonal)

Retenção saudável é uma **cadência de razões para voltar** em escalas temporais diferentes, para que nenhuma única alavanca vire dependência.

### 3.1 Ritmo diário — "fechar o dia"

- **Missões diárias** (2–4, algumas sugeridas pelo Coach via Haiku/Sonnet) com XP ao concluir.
- **Streak** do dia: ação em qualquer Área da Vida mantém a sequência geral.
- **Coach diário** (Sonnet, com cota no Free) — um toque, um insight acionável.
- **Anel de progresso do dia** (`AnelDeProgresso`) — fechamento visual satisfatório.
- Alvo de sessão: **densa e curta** (1–4 min). Não premiamos permanência.

### 3.2 Ritmo semanal — "ver a evolução"

- **Análise Profunda semanal** (Opus, gated Premium) — correlações, tendências, previsão de dificuldades. Razão premium para voltar.
- **Reset semanal da Liga** (Fase 2): promoção top 7 / rebaixamento bottom 5, ordenação por XP-semana **normalizado por área**.
- **Missões semanais** de maior fôlego.
- **Recap semanal** (Free, gerado por heurística+Haiku): "Sua semana em XP" — barato de produzir, alto valor percebido.

### 3.3 Ritmo sazonal — "novidade recorrente sem FOMO"

- **Temporadas mensais (~30 dias)** com desafios e **recompensas cosméticas exclusivas**.
- Reset **apenas** de leaderboard sazonal e passe — **XP, níveis, Skill Trees e Conquistas NUNCA resetam**.
- **Anti-FOMO estrutural:** cosméticos sazonais **retornam em rotação**. Quem perdeu uma Temporada não perde para sempre — reduz ansiedade e a pressão tóxica de "agora ou nunca".
- Cria o "novo capítulo" que reengaja coortes antigas (gatilho de win-back natural, §8).

| Escala | Motor de retorno | Razão emocional | Gated? |
|--------|------------------|-----------------|--------|
| Diário | Missões + Streak + Coach diário | "Fechei meu dia" | Free |
| Semanal | Análise Profunda + Liga + Recap | "Estou evoluindo de verdade" | Recap Free / Análise Profunda Premium |
| Sazonal | Temporada + cosméticos + passe | "Novo capítulo, sem perder o que conquistei" | Passe competitivo P2 |

---

## 4. Onboarding: "primeiro progresso" em < 2 minutos (aha moment)

O **aha moment do Rise** = *"Eu fiz uma coisa real e o app reconheceu na hora com XP e um nível subindo."* Precisa acontecer na **primeira sessão, em menos de 2 minutos**, antes de qualquer pedido de e-mail extra, cartão ou tutorial longo.

### 4.1 Fluxo canônico de onboarding

1. **Escolha de 1–3 Áreas da Vida** (de um conjunto curado por persona; Lia → Estudos/Sono/Idiomas; Bruno → Programação/Academia/Sono; Diego pode **criar uma área** como "Música"). *(< 30s)*
2. **Primeira ação registrada imediatamente** — algo que o usuário JÁ fez hoje ("Você leu hoje? Toque para registrar"). Não pedimos planejamento futuro; pedimos reconhecimento do presente. *(< 30s)*
3. **`xp.granted` + `level.up` na hora** com celebração AAA (`LevelUpOverlay`) — o primeiro Nível de Área sobe. **Este é o aha moment.** *(instantâneo)*
4. **Coach se apresenta** (`CoachBubble`) com 1 insight inicial e 1 missão para amanhã — semeando o próximo loop. *(< 30s)*
5. **Convite suave a ativar push** (com benefício explícito: "te aviso na melhor hora pra você"), nunca bloqueante.

> **Decisão:** a primeira ação registrada deve ser de uma coisa **já feita**, não um plano. Isso garante uma vitória imediata e honesta (a pessoa realmente evoluiu hoje), em vez de um "compromisso futuro" que ainda não foi cumprido — o oposto do aha.

### 4.2 Instrumentação do onboarding

- Funil PostHog: `signup_started → area_selected → first_action_logged → first_level_up → push_opt_in`.
- **Métrica de ativação:** % que atinge `first_level_up` em < 2 min na primeira sessão. Alvo inicial **≥ 70%**.
- Cada passo é candidato a A/B (§9): nº de áreas sugeridas, cópia da primeira ação, presença/ausência do Coach no passo 4.

---

## 5. Streaks saudáveis (compromisso, nunca culpa)

Streak no Rise é **status e compromisso**, não corrente. Herdamos integralmente o modelo de `docs/13-gamificacao.md`:

- **`mult_streak` satura** em `min(1+0.02·dias, 1.5)`, teto em **25 dias** → streak longo vira **status/Conquista**, não dependência crescente de XP. Protege contra *streak-shame*.
- **Quatro amortecedores:**
  1. **Streak Freeze** (ganho jogando ou comprável com Faíscas, máx. 2).
  2. **Perdão automático** a cada 14 dias.
  3. **Streak repair** em 24h (1×/semana).
  4. **Modo Descanso** (congela até 14 dias) — sugerido pelo **Coach** ao detectar sinais de burnout.
- **Quebrar streak NUNCA remove XP, nível ou Conquista.** A perda é só o contador.
- Eventos: `streak.extended / streak.frozen / streak.broken / streak.repaired / rest.mode.toggled`.

### 5.1 Anti-shame na linguagem e no design

| Situação | O que NÃO fazemos | O que fazemos |
|----------|-------------------|----------------|
| Streak em risco | "Você vai PERDER tudo!" / contagem regressiva ansiosa | "Faltou hoje? Um toque mantém sua sequência." Tom de mentor (`brandTone`) |
| Streak quebrada | Tela de luto, número zerado em vermelho gritante | "Recomeços fazem parte. Você ainda tem [Conquistas]. Bora de novo." (empatia persona Diego) |
| Streak muito longa | Pressão de "não pode parar nunca" | Coach sugere Modo Descanso proativamente |

> **Decisão:** o streak é a alavanca de retenção mais poderosa **e** a mais perigosa eticamente. Por isso ela é a mais protegida: o ganho de XP satura cedo (teto 1.5×) justamente para que o valor do streak seja *identidade*, não *dependência de pontuação*.

---

## 6. Missões e Temporadas como motores de retorno

- **Missões** são o "próximo objetivo" sempre pronto — eliminam o vazio do "e agora?". Diárias/semanais/personalizadas, algumas sugeridas pelo Coach (Haiku para volume, Sonnet para personalização). Concluir → `mission.completed` → XP + progresso de Temporada.
- **Temporadas** dão **novidade recorrente** sem reset destrutivo. Cada Temporada é uma razão fresca para coortes antigas voltarem (§8 — win-back natural).
- **Passe de Temporada** (camada competitiva/cosmética P2) adiciona uma trilha de progressão sazonal — sempre cosmético, nunca vantagem.

> **Equilíbrio:** missões nunca devem virar uma *checklist infinita ansiosa*. Limitamos missões diárias ativas (2–4) e o Coach ajusta a carga conforme o histórico do usuário — menos missões em semanas pesadas, mais em semanas leves. Carga adaptativa > volume fixo.

---

## 7. Comunidade como multiplicador (Fase 2 — só após o Loop Solo provado)

**Princípio inegociável:** social entra **apenas** após o critério de saída do MVP (D7/D30 e streak médio fortes + usuários querendo compartilhar). Lançar feed antes disso = cold-start de rede social com feed vazio = falha. A comunidade **amplifica** retenção; não a cria.

| Mecanismo (P2) | Como multiplica retenção | Guardrail ético |
|----------------|--------------------------|-----------------|
| **Feed inspirador** | Marcos, recordes, streaks, Conquistas de quem você segue → prova social de que evoluir é possível | Exclusivamente progresso; nada de selfie/política/conteúdo aleatório. Sem métricas de vaidade tóxicas |
| **Guildas** | Accountability coletiva: meta de guilda puxa o membro de volta ("o time conta comigo") | Papéis Líder/Oficial/Membro; pressão saudável, não tóxica |
| **Rankings/Ligas** | Competição por **esforço real** (XP-semana normalizado) gera retorno semanal | Opt-out total; nunca por dinheiro; Bronze não rebaixa (anti-ansiedade na base) |
| **Desafios** | Evento com meta+prazo → pico de engajamento sazonal | Inscrição paga (P2) dá acesso/cosmético, NUNCA XP/vantagem |
| **Criadores (Caio)** | Trazem audiência própria → aquisição + retenção via liderança de desafios/guildas | Monetização só cosmético/conveniência |

### 7.1 Accountability sem toxicidade

- **Comparação ascendente, não descendente:** o feed mostra "veja o que é possível", não "veja quem é melhor que você". Sem rankings de "piores".
- **Guilda como rede de segurança:** quando um membro vacila, o design favorece encorajamento (não exposição/vergonha pública de quem faltou).
- **Notificações sociais calibradas** (Expo/Web Push) **sem dark patterns** — reações e marcos de amigos, não pings de FOMO.

---

## 8. Ressurreição de inativos (win-back ético via IA + Resend)

Inatividade ≠ falha do usuário. O win-back é um **convite com valor**, nunca culpa ("sentimos sua falta" + chantagem emocional está PROIBIDO).

### 8.1 Escada de ressurreição (gatilhada por janelas de inatividade)

| Janela | Canal | Conteúdo (gerado/orquestrado por IA) | Tom |
|--------|-------|--------------------------------------|-----|
| 3 dias | Push (time-to-send IA) | "Sua [Área] está te esperando. 1 toque retoma." | Convite leve |
| 7 dias | E-mail (Resend) + push | **Recap do que já construiu** (XP total, melhor streak, Conquistas) — relembra o investimento real | Reconhecimento |
| 14 dias | E-mail (Resend) | Insight personalizado do Coach: "Notei que você ia bem em [X]. Que tal recomeçar por aí?" (RAG sobre StatSnapshot) | Mentor empático |
| 30 dias+ | E-mail no início de **nova Temporada** | "Novo capítulo no Rise. Seu progresso continua intacto." | Novidade + segurança |
| Qualquer | — | **Modo Descanso** detectado → win-back *suspenso* (a pessoa avisou que ia pausar) | Respeito |

- Orquestração via **Inngest** (workflows duráveis por janela de inatividade, idempotentes).
- **Cap de frequência rígido** e **opt-out de 1 toque** em todo e-mail/push. Após N tentativas sem resposta, **reduzimos a cadência** (não aumentamos) — pressão decrescente, jamais crescente.
- **Honestidade:** o e-mail de 7 dias mostra o **progresso real já conquistado** (que não foi perdido) — o gancho é o valor que a pessoa já tem, não a ameaça de perdê-lo.

---

## 9. Métricas-alvo e instrumentação (PostHog)

### 9.1 North Star e métricas de retenção

- **North Star: Dias de Evolução por usuário ativo** — dias em que o usuário registrou ≥1 ação que concedeu XP. É a métrica que toda alavanca deste doc serve.

| Métrica | Definição | Alvo inicial | Por quê |
|---------|-----------|--------------|---------|
| **Ativação** | % que atinge `first_level_up` < 2 min na 1ª sessão | ≥ 70% | Aha moment entregue |
| **D1** | volta no dia seguinte | ≥ 40% | Loop diário pegou |
| **D7** | ativo na semana 1 | ≥ 22% | Hábito iniciando |
| **D30** | ativo no mês 1 | ≥ 12% | Retenção real (gatilho de Fase 2 quando forte) |
| **WAU/MAU** (stickiness) | usuários semanais / mensais | ≥ 0,5 | Frequência de hábito |
| **Streak médio** | dias de streak por usuário ativo | crescente por coorte | Saúde do compromisso |
| **Retenção por coorte** | curva de sobrevivência por semana de signup | achatar e estabilizar | Sinal de produto que "gruda" |
| **% sessões orgânicas** | sessões não originadas de push | crescente | Gatilho interno > externo (§2.1) |

> O **gatilho de saída do MVP para a Fase 2** (social) é explicitamente "D7/D30 e streak médio fortes + usuários querendo compartilhar". Estas métricas **governam o roadmap**, não são vaidade.

### 9.2 Eventos canônicos a instrumentar

Reusar exatamente (já versionados em `packages/config` e `docs/13-gamificacao.md`):

`action_logged`, `level_up`, `streak_kept`, `streak_broken`, `quest_completed`, `coach_insight_shown`, `premium_upgraded` (analytics) + eventos de domínio `xp.granted`, `rise.level.up`, `skill.node.unlocked`, `mission.completed`, `season.started`, `league.promoted`, etc.

- **PostHog** = product analytics + **feature flags** + **A/B** + **session replay** (central para experimentos de retenção).
- Funis de retenção: onboarding (§4.2), loop diário (`action_logged → level_up`), win-back (entrega → reabertura).
- **Coortes** por semana de signup, por persona-proxy (áreas escolhidas), por plano (Free/Premium).
- **Guardrail de privacidade:** session replay com mascaramento de dados sensíveis; B2B (Fase 3) só agrega/anonimiza — privacidade individual inegociável.

---

## 10. Experimentos e A/B para retenção

Cultura de experimentação via **PostHog feature flags + A/B**. Cada experimento tem hipótese, métrica primária (sempre ligada à North Star ou a um proxy de retenção) e *guardrail metrics* (não regredir bem-estar/churn).

| # | Hipótese | Variável testada | Métrica primária |
|---|----------|------------------|------------------|
| E1 | Menos áreas no onboarding aumenta ativação | 1 vs 3 áreas sugeridas | % `first_level_up` < 2 min |
| E2 | Coach no passo 4 melhora D1 | com/sem `CoachBubble` no onboarding | D1 |
| E3 | Time-to-send por IA bate horário fixo | push IA vs 19h fixo | reabertura via push, % opt-out |
| E4 | Recap semanal Free aumenta D7 | com/sem recap Haiku | D7, sessões/semana |
| E5 | Tabela de XP-base por área (calibração) | variações de XP-base (não a fórmula) | Dias de Evolução, anti-grinding |
| E6 | Win-back de 7d com recap de progresso bate genérico | recap real vs "sentimos sua falta" | taxa de ressurreição |

> **Tabela de XP-base por área é calibrável via PostHog A/B sem alterar a fórmula** (curva `50n²+50n` é fixa; o que se ajusta é quanto cada ação concede). Permite balancear economia sem migração destrutiva.

**Disciplina ética dos experimentos:** nunca testamos dark patterns "porque convertem". Toda variante deve ser uma que ficaríamos confortáveis em manter para sempre. *Guardrail metrics* obrigatórias: churn, taxa de opt-out de notificações, e sinais de fadiga (sessões excessivamente longas → bandeira de burnout, não de sucesso).

---

## 11. Anti-padrões PROIBIDOS (tempo bem gasto)

O que **nunca** entra no Rise, mesmo que aumente métricas de curto prazo:

| Anti-padrão | Por que é proibido | O que fazemos no lugar |
|-------------|--------------------|-----------------------|
| **Loot box / gacha** | Aleatoriedade predatória, odds ocultas | Loja cosmética transparente, preço sempre visível |
| **FOMO artificial** | Ansiedade fabricada | Cosméticos sazonais **retornam em rotação** |
| **Streak-shame / chantagem** | Culpa tóxica | Amortecedores (§5), tom de mentor, Modo Descanso |
| **Pay-to-win** | Fere o canon | Faíscas estruturalmente isoladas do XP no schema |
| **Notificação-spam** | Erode confiança | Cap de frequência, time-to-send IA, opt-out 1 toque |
| **Engajamento por tempo de tela** | Vício prejudicial | Otimizamos Dias de Evolução; sessão densa e curta |
| **Vanity metrics sociais** | Comparação tóxica | Feed só de progresso, comparação ascendente |
| **Cobrança-surpresa / saída difícil** | Aprisionamento | Cancelamento simétrico, downgrade preserva tudo |
| **Infinite scroll / autoplay** | Sucção de atenção | Sem infinite scroll vicioso; feed com fechamento natural |

### 11.1 Coach como guardião do bem-estar (mecanismo formal)

O Coach monitora sinais de **uso prejudicial** (sessões noturnas crescentes, missões em excesso, padrão de fadiga) e **age**: sugere Modo Descanso, reduz carga de missões, e — diferencial do Rise — **pode recomendar não usar o app hoje.** Um produto que sabe a hora de mandar você descansar é o produto que você mantém por anos.

---

## 12. Síntese — princípios de decisão de retenção

1. **Progresso real primeiro.** Sem evolução genuína, nenhuma alavanca é legítima.
2. **Loop solo retém sozinho** antes de qualquer social (anti cold-start).
3. **Aha em < 2 min:** primeira ação já feita → `level.up` → Coach semeia o amanhã.
4. **Cadência multi-escala** (diário/semanal/sazonal) para que nenhuma alavanca vire dependência.
5. **Streak é a alavanca mais forte e a mais protegida** — satura cedo, quatro amortecedores, zero shame.
6. **Win-back devolve valor** (progresso já conquistado), nunca medo de perda.
7. **Comunidade multiplica, não substitui** — Fase 2, só com loop solo provado.
8. **Dias de Evolução é a única estrela.** Se um experimento sobe métrica de vaidade mas não move a North Star de forma honesta, não vai.
9. **A porta de saída é larga** — e por isso a confiança (e a retenção) é alta.
