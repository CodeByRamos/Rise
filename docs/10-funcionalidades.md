# 10 — Lista Priorizada de Funcionalidades

> Documento canônico do Rise. Escopo: catálogo completo de funcionalidades organizadas por épico, com esforço, prioridade (RICE + MoSCoW) e marcação clara de MVP (P0) vs P1/P2/P3, respeitando o **productSequencing** (loop solo impecável antes do social; B2B por último). Fonte da verdade: `docs/00-canon.md` e docs 01–05. Não contradiz o canon; usa os termos do glossário.

## TL;DR

O Rise se ganha ou se perde no **Loop Solo** (Fase 1): VIVER → REGISTRAR → GANHAR XP → VER EVOLUÇÃO → COACH ORIENTA → PRÓXIMO OBJETIVO. Tudo em P0 existe para tornar esse loop impecável para Lia, Bruno, Marina e Diego — registro de ação com fricção mínima, feedback AAA de progresso, Áreas da Vida com Nível e XP, Coach de IA em camadas e Premium honesto. Social (Feed, Guildas, Rankings), Criadores e B2B são fases posteriores e **não entram antes do necessário**: nada de feed vazio, nada de cold-start. A regra de ouro de priorização é simples — **nada antes da hora, nada que viole os guardrails anti pay-to-win**.

Convenções deste doc:
- **Esforço:** P (≤3 dias dev), M (≤2 semanas), G (≥2 semanas / vários sprints).
- **Prioridade:** P0 = MVP (Fase 1, must-have), P1 = pós-MVP solo / início Fase 2, P2 = Fase 2 social, P3 = Fase 3 B2B/maturidade.
- **MoSCoW:** Must / Should / Could / Won't-now.
- **RICE:** `(Reach × Impact × Confidence) / Effort`. Reach = fração de usuários ativos atingidos por trimestre (0–1 × 10). Impact: 3=massivo, 2=alto, 1=médio, 0.5=baixo. Confidence: 1.0 / 0.8 / 0.5. Effort em pessoa-semana. Score relativo, para ordenar dentro da fase — não é verdade absoluta.

---

## 1. Tabela-resumo priorizada (top do backlog)

Ordenada por prioridade e, dentro de cada faixa, por RICE. As linhas P0 formam o MVP.

| # | Funcionalidade | Épico | Esf. | MoSCoW | Prio | RICE |
|---|---|---|---|---|---|---|
| 1 | Registro de Ação (1-tap + quick log) | Hábitos & Metas | M | Must | **P0** | 40.0 |
| 2 | XP, Nível de Área e Nível Rise | Progressão | G | Must | **P0** | 33.3 |
| 3 | Áreas da Vida (padrão + criação) | Progressão | M | Must | **P0** | 32.0 |
| 4 | Feedback AAA de progresso (level-up, microanimações) | Progressão | M | Must | **P0** | 24.0 |
| 5 | XP Ledger imutável (auditável) | Progressão | M | Must | **P0** | 20.0 |
| 6 | Onboarding guiado (escolha de áreas + 1ª ação) | Onboarding | M | Must | **P0** | 19.2 |
| 7 | Streaks por área e geral | Progressão | P | Must | **P0** | 18.0 |
| 8 | Auth (email + OAuth + magic link) | Onboarding | M | Must | **P0** | 16.0 |
| 9 | Missões diárias/semanais | Hábitos & Metas | M | Must | **P0** | 16.0 |
| 10 | Coach de IA — coach diário (Sonnet) | IA Coach | G | Must | **P0** | 14.4 |
| 11 | Dashboard "Minha Evolução" (home) | Estatísticas | M | Must | **P0** | 14.0 |
| 12 | Conquistas e Badges | Progressão | M | Must | **P0** | 12.0 |
| 13 | Metas pessoais (objetivos com prazo) | Hábitos & Metas | M | Must | **P0** | 12.0 |
| 14 | Skill Trees por Área da Vida | Progressão | G | Must | **P0** | 10.7 |
| 15 | Coach — Insights (RAG sobre stats) | IA Coach | M | Must | **P0** | 10.4 |
| 16 | Push nativo + Web Push (engajamento) | Notificações | M | Must | **P0** | 10.0 |
| 17 | App mobile nativo (Expo) | Plataforma | G | Must | **P0** | 9.6 |
| 18 | Premium + Billing (Stripe) | Premium/Billing | G | Must | **P0** | 8.0 |
| 19 | Temporadas (ciclos + recompensa cosmética) | Temporadas | M | Should | **P1** | 9.0 |
| 20 | Faíscas (carteira + ganho não-pago) | Perfil/Cosméticos | M | Should | **P1** | 8.0 |
| 21 | Coach — Análise Profunda Semanal (Opus, Premium) | IA Coach | M | Should | **P1** | 7.2 |
| 22 | Estatísticas avançadas (Premium) | Estatísticas | M | Should | **P1** | 6.4 |
| 23 | Cosméticos (temas, avatares, molduras) | Perfil/Cosméticos | M | Should | **P1** | 6.0 |
| 24 | Loja de cosméticos (Faíscas + Premium) | Perfil/Cosméticos | M | Should | **P1** | 5.0 |
| 25 | Perfil público de progresso | Perfil/Cosméticos | M | Should | **P1** | 4.8 |
| 26 | Grafo social (follow/amigos) | Social/Feed | M | Could | P2 | 6.0 |
| 27 | Feed de progresso (marcos, recordes) | Social/Feed | G | Could | P2 | 5.3 |
| 28 | Desafios (individual/comunidade) | Rankings | G | Could | P2 | 4.8 |
| 29 | Rankings / Ligas por temporada | Rankings | M | Could | P2 | 4.0 |
| 30 | Guildas + membership | Guildas | G | Could | P2 | 3.2 |
| 31 | Marketplace de cosméticos | Premium/Billing | G | Could | P2 | 2.7 |
| 32 | Ferramentas de Criador (desafios pagos, guilda premium) | Criadores | G | Could | P2 | 2.4 |
| 33 | B2B — Org/Time/Assento + dashboards anônimos | B2B | G | Could | P3 | 2.0 |
| 34 | Desafios corporativos + guildas por time | B2B | G | Could | P3 | 1.6 |
| 35 | Admin / Trust & Safety / moderação | Admin | M | Should | **P0** | (transversal) |

> Nota: a linha 35 (Admin) é P0 em escopo mínimo desde o dia 1 (feature flags, kill switch, suporte, moderação básica de abuso) e cresce por fase. Listada por último por ser transversal, não por baixa prioridade.

---

## 2. Onboarding

A primeira sessão decide a ativação. North Star = **Dias de Evolução**; logo a meta do onboarding é **uma ação registrada nas primeiras 2 minutos** (o primeiro "ding" de XP).

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Auth** | Email + OAuth (Google/Apple) + magic link via Supabase Auth; funciona em RN. | Entrada sem fricção; Apple obrigatório em iOS. | M | **P0** | Must |
| **Onboarding guiado** | Fluxo curto: "o que você quer evoluir?" → seleção de 3–5 Áreas da Vida → registro da 1ª ação com level-up imediato. | Lia sente que já está "upando" antes de sair. Mata o tempo-até-valor. | M | **P0** | Must |
| **Setup de metas iniciais (Coach)** | Coach sugere 1 missão por área escolhida a partir de heurísticas + Haiku. | Direção imediata; Diego não trava na tela vazia. | M | **P0** | Must |
| **Import opcional (Strava/Health/Apple Fitness)** | Conectores para puxar treinos/sono e pré-popular áreas. | Marina consolida apps fragmentados; valor instantâneo. | G | P1 | Should |
| **Convite/refer-a-friend** | Link de convite com recompensa cosmética (Faíscas), nunca XP. | Crescimento orgânico sem violar guardrails. | M | P1 | Could |

**Decisão / trade-off:** o onboarding **não** pede cartão nem trava nada atrás de paywall. O objetivo é ativação, não conversão. Premium é oferecido depois do primeiro "aha" (ex.: ao tentar a Análise Profunda Semanal). Importes de terceiros são P1 — valiosos (sobretudo p/ Marina) mas com custo de integração e manutenção alto; não bloqueiam o loop.

---

## 3. Progressão / Gamificação (coração do P0)

Este é o motor. Se falhar aqui, nada mais importa.

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **XP, Nível de Área e Nível Rise** | XP (Pontos de Evolução) concedido por ação real à Área correspondente; Nível de Área por área; Nível Rise agregado. Curvas de XP versionadas em `packages/core`. | Toda ação positiva vira progresso visível. A promessa central do produto. | G | **P0** | Must |
| **Áreas da Vida** | 15 áreas padrão + criação de áreas personalizadas (Diego cria "Música"). Cada uma é uma "classe" com progressão própria. | Cobre a vida inteira; extensível. | M | **P0** | Must |
| **XP Ledger imutável** | Livro-razão append-only (`XPGrant`) por ação/área, auditável. Níveis são **derivados** do ledger, não armazenados como verdade. | Confiança e justiça do sistema; base anti-fraude e de recálculo. | M | **P0** | Must |
| **Feedback AAA de progresso** | Animação de level-up, barra de XP fluida, microinterações, haptics no mobile, contadores animados. | Sensação de jogo AAA, não de planilha. Diferencial vs concorrentes. | M | **P0** | Must |
| **Streaks** | Sequências por área e geral; bônus de consistência; recuperação suave (sem culpa punitiva). | Compromisso diário saudável. Driver direto da North Star. | P | **P0** | Must |
| **Conquistas e Badges** | Marcos permanentes desbloqueáveis (ex.: "30 dias de leitura", PRs) + insígnias exibíveis. | Recompensa de longo prazo; colecionismo saudável. | M | **P0** | Must |
| **Skill Trees** | Árvore por Área da Vida; destrava galhos com XP e marcos. Profundidade e especialização. | Chave para Bruno: progressão profunda, não rasa. | G | **P0** | Must |
| **Anti-fraude de XP** | Validação de inputs, rate limits, detecção de logs improváveis, capôs diários por área. | Mantém rankings e progresso honestos. | M | P1 | Should |

**Decisões / trade-offs (registrar em ADR):**
- **Níveis derivados do ledger, não persistidos como verdade.** O `XPLedger` é a única fonte; níveis/agregados são projeções materializadas (cache) recomputáveis. Isso permite rebalancear curvas de XP sem migração destrutiva e auditar qualquer saldo. Custo: precisamos de jobs (Inngest) para manter materializações e de cuidado com consistência eventual — aceitável.
- **Skill Tree é P0, não P1.** Tentação de adiar como "nice-to-have". Recuso: é o que diferencia o Rise de um app de hábitos e o que retém Bruno. Entra com escopo enxuto (3–5 galhos por área padrão), expandível depois.
- **Streaks sem punição tóxica (guardrail 4).** Sem "perdeu tudo", sem FOMO. Há "congelamento" limitado e recomeço dignificado — o Coach reenquadra a quebra como dado, não fracasso (caso Diego).

---

## 4. Hábitos & Metas

A camada de entrada de dados do loop. Tem de ser **mais rápida que abrir o Notion**.

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Registro de Ação (1-tap + quick log)** | Ações recorrentes viram botões 1-tap; ação livre via quick log (texto + área + quantidade). Classificação assistida por Haiku. | Fricção mínima = consistência. O input mais usado do app. | M | **P0** | Must |
| **Missões** | Objetivos acionáveis diários/semanais/personalizados; concluir concede XP e progride temporada. Alguns sugeridos pelo Coach. | Direção diária; transforma intenção em ação. | M | **P0** | Must |
| **Metas pessoais** | Objetivos com prazo e métrica (ex.: "ler 12 livros em 2026"), com progresso visível e sub-missões. | Bruno/Marina querem rigor e alvos claros. | M | **P0** | Must |
| **Hábitos recorrentes / agenda leve** | Agendamento de hábitos (frequência, lembrete), check-in rápido. | Estrutura de rotina sem virar "agenda". | M | P1 | Should |
| **Rotinas/templates** | Conjuntos prontos (ex.: "Manhã produtiva") + sugestões do Coach. | Acelera setup; reduz decisão. | M | P1 | Could |
| **Reorganização de rotina pelo Coach** | Coach propõe replanejamento da semana com base em padrões. | Anti-desistência; valor de IA real. | M | P1 | Should |

**Decisão / trade-off:** **Registro de Ação tem o maior RICE do produto** porque é o evento que alimenta todo o resto e roda múltiplas vezes ao dia. Investimos desproporcionalmente em sua velocidade e prazer (haptics, animação, undo). Quick log usa Haiku para sugerir área/qtde, mas **sempre confirmável** pelo usuário — IA assiste, não decide silenciosamente.

---

## 5. IA Coach

Mentor pessoal, nunca "chatbot". Em camadas por custo (unit economics importa).

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Coach diário (Sonnet)** | Mensagem/orientação contextual diária; responde no chat do mentor; sugere missão. RAG sobre stats recentes. | Acompanhamento constante; sensação de mentor real. | G | **P0** | Must |
| **Insights (RAG sobre stats)** | Identifica padrões ("você rende mais de manhã"), prevê dificuldades, recomenda ajustes. pgvector sobre `StatSnapshot`. | Valor acionável e personalizado; retenção. | M | **P0** | Must |
| **Microtarefas/classificação (Haiku)** | Classificação de ações, geração de missões simples, tagging — volume barato. | Invisível, mas torna o cotidiano fluido e barato de operar. | M | **P0** | Must |
| **Análise Profunda Semanal (Opus)** | Relatório semanal profundo gated no Premium: tendências, trade-offs entre áreas, plano. | Profundidade que Bruno paga; âncora do Premium. | M | **P1** | Should |
| **Coach proativo (nudges inteligentes)** | Coach inicia contato em momentos-chave (risco de quebra de streak, marco perto). | Engajamento sem dark pattern (timing, não culpa). | M | P1 | Should |
| **Tool use (Coach age no app)** | Coach cria missão/meta, ajusta rotina via tool use estruturado, sob confirmação. | IA que executa, não só fala. | M | P1 | Could |

**Decisão / trade-off (ADR — IA em camadas):** Haiku no volume, Sonnet no diário, Opus semanal/Premium. Recuso usar Opus no cotidiano — quebra unit economics. O gating do Opus no Premium **destrava profundidade, não poder competitivo** (guardrail 5). Custo do Coach é orçado por usuário/mês; quando exceder limites do Free, degradar para Sonnet/Haiku com transparência, nunca cortar abruptamente.

---

## 6. Estatísticas

Stats são produto, não relatório. Premium aprofunda.

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Dashboard "Minha Evolução"** | Home: Nível Rise, XP por área, streaks ativos, missão do dia, último marco. | Visão de progresso ao abrir o app. Tela mais vista. | M | **P0** | Must |
| **Histórico por Área** | Linha do tempo de ações, XP e recordes por área. | Senso de jornada; Marina vê consolidação. | M | **P0** | Must |
| **Estatísticas avançadas (Premium)** | Tendências, correlações entre áreas, comparativos temporais, exportação. | Bruno paga por dados; profundidade. | M | P1 | Should |
| **StatSnapshot + Embedding** | Snapshots periódicos + vetores pgvector que alimentam o RAG do Coach. | Infra que torna o Coach inteligente. | M | **P0** | Must |

---

## 7. Perfil / Cosméticos

Monetização honesta: **apenas cosmético/conveniência**.

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Perfil de progresso (privado)** | Perfil com Nível Rise, áreas, badges, streaks. Privado por padrão. | Identidade de progresso; base para social depois. | M | **P0** | Must |
| **Faíscas (carteira + ganho)** | Moeda cosmética ganha por marcos/temporada; carteira e histórico. NUNCA compra vantagem. | Recompensa que celebra sem pay-to-win. | M | P1 | Should |
| **Cosméticos** | Temas, avatares, molduras, efeitos de level-up. | Personalização desejável; expressão. | M | P1 | Should |
| **Loja de cosméticos** | Compra com Faíscas ou Premium. Preços e itens transparentes (sem loot box). | Sink de Faíscas; receita honesta (guardrail 3). | M | P1 | Should |
| **Perfil público de progresso** | Tornar perfil compartilhável (link), opt-in. | Prepara camada social; Caio mostra evolução. | M | P1 | Should |

**Decisão / trade-off:** **Sem loot box, odds ocultas ou aleatoriedade predatória** (guardrail 3). Toda compra cosmética mostra exatamente o que entrega. Faíscas nunca são vendidas como atalho de progresso. Recusamos a alavanca de receita mais fácil (caixas surpresa) por princípio de produto — e porque mina a confiança que sustenta retenção de longo prazo.

---

## 8. Notificações

Engajamento calibrado, sem dark pattern.

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Push nativo (Expo) + Web Push** | Lembretes de hábito, missão do dia, risco de streak, nudge do Coach. | Traz a pessoa de volta no momento certo. Requisito de engajamento. | M | **P0** | Must |
| **E-mail transacional (Resend)** | Magic link, recibos, resumo semanal opt-in. | Confiabilidade e canal secundário. | P | **P0** | Must |
| **Central de preferências de notificação** | Controle granular por tipo/canal/horário; quiet hours. | Respeito ao usuário; reduz churn por irritação. | M | **P0** | Must |
| **Notificações sociais** | Reações no feed, convites de guilda, resultados de desafio. | Loop social (Fase 2). | M | P2 | Could |

**Decisão / trade-off:** notificações são **timing-based, nunca guilt-based**. Sem "você está decepcionando seu streak". Frequência conservadora por padrão, A/B testada via PostHog. Central de preferências é P0 — confiança importa desde o dia 1.

---

## 9. Premium / Billing

Receita recorrente honesta.

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Premium + Billing (Stripe)** | Assinatura recorrente; entitlements (`Subscription/Plan`); paywall contextual; gestão de plano. | Sustenta o produto; destrava profundidade. | G | **P0** | Must |
| **Entitlements/feature gating** | Camada de checagem de plano em tRPC para gatear IA Opus, stats avançadas, cosméticos. | Infra que torna Premium confiável. | M | **P0** | Must |
| **Trial + paywall A/B** | Trial de Premium; variações de paywall medidas no PostHog. | Otimiza conversão sem enganar. | M | P1 | Should |
| **Marketplace de cosméticos** | Catálogo de cosméticos de terceiros/criadores; revenue share. | Receita e expressão (Fase 2). | G | P2 | Could |

**Decisão / trade-off:** Premium destrava **profundidade (IA Opus/Sonnet, analytics, cosméticos), nunca poder competitivo** (guardrail 5). Free precisa ser genuinamente bom — o loop solo completo funciona grátis; Premium é aprofundamento. Stripe entra no P0 porque receita desde a Fase 1 valida unit economics e disciplina o produto.

---

## 10. Social / Feed (Fase 2 — só após loop solo provado)

> Bloqueado por **critério de saída da Fase 1**: D7/D30 e streak médio fortes. Não construir contra feed vazio.

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Grafo social (follow/amigos)** | `FriendEdge/Follow`; seguir por progresso. | Base da rede; responsabilidade social. | M | P2 | Could |
| **Feed de progresso** | Timeline **exclusiva de progresso**: marcos, recordes, streaks, conquistas. Sem selfies/política. | Inspiração; Caio mostra evolução autêntica. | G | P2 | Could |
| **Reações/comentários positivos** | Interações restritas a apoio/celebração. | Comunidade saudável sem toxicidade (Marina). | M | P2 | Could |
| **Moderação de feed** | Filtros, report, limites — feed só de progresso por design. | Mantém a rede limpa e segura. | M | P2 | Should |

**Decisão / trade-off:** o feed é **estruturalmente** só de progresso — não há campo de "post livre". Isso elimina por design as patologias de redes sociais. Custo: menos volume de conteúdo; ganho: posicionamento único e segurança.

---

## 11. Guildas (Fase 2)

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Guildas + membership** | Criar/entrar em guildas; identidade, papéis, mural de progresso. | Responsabilidade coletiva; pertencimento. | G | P2 | Could |
| **Desafios de guilda** | Metas coletivas com prazo; progresso somado. | Cooperação; engajamento de grupo. | M | P2 | Could |
| **Guilda premium (criador)** | Recursos extras para guildas de criadores — cosmético/conveniência. | Monetização de criador (Caio), nunca vantagem. | M | P2 | Could |

---

## 12. Rankings (Fase 2)

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Rankings / Ligas por temporada** | Classificação **só por progresso real**; ligas com promoção/rebaixamento por esforço. | Competição saudável; motivação. | M | P2 | Could |
| **Desafios (individual/comunidade)** | Eventos com meta/prazo; alguns pagos/de criador (Fase 2). | Novidade recorrente; engajamento. | G | P2 | Could |

**Guardrail:** competição **apenas por esforço/progresso real**; dinheiro/Faíscas jamais compram posição (guardrails 1–2).

---

## 13. Temporadas

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Temporadas (ciclos + recompensa cosmética)** | Ciclos com início/fim, desafios e recompensas cosméticas exclusivas; reset de certos rankings. | Novidade recorrente sem FOMO manipulativo. | M | P1 | Should |
| **Passe de Temporada (cosmético)** | Trilha de recompensas cosméticas por progresso na temporada; versão Premium adiciona cosméticos. | Engajamento sazonal; receita cosmética honesta. | M | P2 | Could |

**Decisão:** Temporadas entram **P1** (solo) com recompensas cosméticas individuais — criam novidade já na Fase 1. A camada competitiva/social da temporada (ligas, passe) é P2. Sem FOMO artificial: perder uma temporada não destrói progresso permanente.

---

## 14. Criadores (Fase 2)

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Ferramentas de Criador** | Criar/liderar desafios pagos, guilda premium, página de criador, analytics de audiência. | Caio monetiza e traz audiência; vetor de crescimento. | G | P2 | Could |
| **Revenue share** | Repasse de receita de desafios/cosméticos de criador. | Incentiva criadores; sempre cosmético/conveniência. | M | P2 | Could |

---

## 15. B2B (Fase 3 — só após massa orgânica)

| Funcionalidade | Descrição | Valor p/ usuário | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Org/Time/Assento** | `Organization/Team/Seat`; provisionamento de assentos; billing B2B. | Renata oferece benefício real ao time. | G | P3 | Could |
| **Dashboards agregados e anônimos** | Engajamento/bem-estar do time, **sem dados individuais**. Privacidade inegociável. | Visão de RH sem violar privacidade. | G | P3 | Could |
| **Desafios corporativos + guildas por time** | Competições internas, guildas por área/time. | Engajamento corporativo. | G | P3 | Could |

**Guardrail B2B:** **privacidade individual inegociável** — empresa vê agregados anônimos, nunca o progresso pessoal nominal.

---

## 16. Admin / Trust & Safety (transversal, escopo mínimo em P0)

| Funcionalidade | Descrição | Valor (interno) | Esf. | Prio | MoSCoW |
|---|---|---|---|---|---|
| **Feature flags + kill switch** | PostHog flags; desligar features problemáticas sem deploy. | Operar com segurança desde o dia 1. | P | **P0** | Must |
| **Painel de suporte/contas** | Ver/ajustar conta, reembolsos, recálculo de XP. | Suporte e correção. | M | **P0** | Should |
| **Moderação básica de abuso** | Detecção de fraude de XP, report, banimento. | Integridade do sistema. | M | **P0** | Should |
| **Console de moderação social** | Fila de report do feed/guildas, ações. | Segurança da rede (Fase 2). | M | P2 | Should |
| **Admin B2B** | Gestão de orgs, assentos, faturas. | Operação B2B (Fase 3). | M | P3 | Could |

---

## 17. Princípios de decisão (como cortar escopo sob pressão)

1. **Se atrasar, atrase o social — nunca o loop solo.** O P0 é inegociável; Fase 2 é folga de cronograma.
2. **Registro de Ação e feedback AAA antes de qualquer feature "rica".** Sem o input rápido e o prazer do progresso, nada retém.
3. **Nunca corte um guardrail para ganhar receita.** Loot box, pay-to-win e dark pattern estão fora — mesmo que "convertam".
4. **IA em camadas sempre.** Nenhuma feature de IA entra sem orçamento de custo por usuário definido.
5. **Free precisa encantar sozinho.** Premium é profundidade, não a única razão de o app ser bom.
6. **Mobile nativo desde a arquitetura.** Push e presença na home são P0 de engajamento, não polimento futuro.

---

## 18. Síntese — escopo do MVP (P0)

O MVP é a Fase 1 completa do loop solo. Entregar, nesta ordem de dependência:

1. **Fundação:** Auth, monorepo, schema de domínio, observabilidade, i18n, feature flags.
2. **Motor:** Áreas da Vida, XP/Níveis, XP Ledger, Streaks, feedback AAA.
3. **Input:** Registro de Ação (1-tap + quick log), Missões, Metas.
4. **Profundidade:** Skill Trees, Conquistas/Badges.
5. **Inteligência:** Coach diário (Sonnet) + Insights (RAG/pgvector) + Haiku no volume; StatSnapshot/Embedding.
6. **Visão:** Dashboard "Minha Evolução", Histórico por Área.
7. **Engajamento:** Push nativo/Web Push + e-mail + central de preferências; app mobile Expo.
8. **Receita:** Premium + Billing (Stripe) + entitlements.
9. **Operação:** Admin mínimo (flags, suporte, anti-fraude).

**Critério de saída do MVP:** D7/D30 e streak médio fortes; usuários evoluindo com valor real e **querendo compartilhar** — o gatilho que autoriza a Fase 2.
