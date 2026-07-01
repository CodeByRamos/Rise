# 12 — Estratégia de Monetização

> **Documento canônico.** Define o modelo de receita recorrente do Rise: tiers (Free vs Premium),
> o que é grátis vs pago, preços sugeridos (BRL/USD), marketplace, desafios pagos, recursos para
> criadores, B2B (Rise for Teams), unit economics e princípios éticos. Subordinado ao canon
> (`docs/00-canon.md`) e ao modelo de gamificação (`docs/13-gamificacao.md`). NUNCA contradiz os
> guardrails anti pay-to-win.

---

## TL;DR

O Rise monetiza **profundidade, conveniência e cosmética — nunca poder competitivo**. A tese
central: *a progressão de vida é sempre 100% gratuita; o que se paga é evoluir com mais
inteligência (IA), mais clareza (analytics) e mais beleza (cosméticos)*. A receita é
majoritariamente recorrente (assinatura **Rise+**), complementada por marketplace de cosméticos
(revenue share com criadores), desafios pagos curados, ferramentas de criador e, na Fase 3,
licenças **Rise for Teams** (B2B). A IA em camadas (Haiku→Sonnet→Opus) é simultaneamente o
principal driver de assinatura e o maior custo variável — controlá-lo é a disciplina central de
unit economics.

| Linha de receita | Fase | Tipo | Driver |
|---|---|---|---|
| **Rise+** (assinatura) | 1 | Recorrente (MRR) | IA Sonnet/Opus + analytics profundas + cosméticos |
| **Marketplace de cosméticos** | 2 | Transacional + rev share | Faíscas / criadores |
| **Desafios pagos curados** | 2 | Transacional | Criadores (persona Caio) |
| **Ferramentas de criador** | 2 | Recorrente + take rate | Caio |
| **Rise for Teams** (B2B) | 3 | Recorrente por assento | Renata |

---

## 1. Princípios de monetização (inegociáveis)

Estes princípios prevalecem sobre qualquer meta de receita. Se um experimento de monetização
conflita com um deles, o experimento é descartado.

1. **A progressão central é sempre grátis.** XP, Áreas da Vida, Nível de Área, Nível Rise,
   Streaks, Missões, Conquistas e o registro de ações nunca são limitados por paywall. Pagar
   jamais acelera ou compra progresso. (Reforça guardrail 1 do canon.)
2. **Pago = profundidade + conveniência + cosmética.** As três únicas categorias monetizáveis:
   profundidade de IA/analytics, conveniências que poupam tempo, e cosméticos sem impacto
   competitivo. (Guardrails 2 e 5.)
3. **Competição só por esforço real.** Faíscas e dinheiro nunca alteram Rankings, Ligas ou
   resultado de Desafios. (Guardrail 2.)
4. **Cosmética transparente, sem loot box.** Todo item cosmético tem preço e aparência visíveis
   antes da compra. Sem caixas aleatórias, sem odds ocultas, sem mecânica de azar predatória.
   (Guardrail 3.)
5. **Sem dark patterns no funil de pagamento.** Sem contagens regressivas falsas, sem culpa por
   cancelar, sem "downgrade escondido", sem cobrança-surpresa. Cancelar é tão fácil quanto
   assinar. (Detalhado na §9.)
6. **Free é generoso de verdade, não isca frustrante.** O usuário Free precisa amar o produto e
   evoluir de verdade — o paywall vende um "a mais", nunca destrava o "mínimo viável".

> Tese: produtos que respeitam o usuário retêm melhor. O Rise aposta que honestidade é vantagem
> competitiva de retenção (e portanto de LTV), não custo.

---

## 2. Arquitetura de tiers

Três tiers no lançamento da monetização. **Rise Free** e **Rise+** são o núcleo; **Rise Founder**
é um tier de lançamento por tempo limitado (apoiadores iniciais), não um "pay-to-win premium".

| Recurso | Free | Rise+ | Founder¹ |
|---|---|---|---|
| Áreas da Vida (padrão + criadas) | Ilimitadas | Ilimitadas | Ilimitadas |
| XP, Níveis, Skill Trees, Streaks, Missões, Conquistas | Completo | Completo | Completo |
| Registro de ações + feedback AAA (level-up etc.) | Completo | Completo | Completo |
| **Coach de IA — cotidiano** (heurísticas + Haiku) | Sim | Sim | Sim |
| **Coach de IA — diário conversacional** (Sonnet) | Limite² | Ilimitado | Ilimitado |
| **Análise Profunda semanal** (Opus, RAG sobre stats) | — | Sim | Sim |
| **Estatísticas** | Básicas (7 dias) | Profundas (histórico ilimitado, correlações, tendências) | Profundas |
| Temporadas | Participa | Participa + recompensas cosméticas Premium | Participa |
| Histórico de Temporadas anteriores (multi-temporada) | Atual | Ilimitado | Ilimitado |
| Faíscas mensais (estipêndio cosmético) | — | Sim (mensal) | Sim (mensal, maior) |
| Temas, molduras, efeitos exclusivos | Catálogo base | Catálogo Premium + descontos | Catálogo + badge Founder permanente |
| Suporte | Comunidade | Prioritário | Prioritário + canal direto |
| Influência em roadmap | — | Votação | Votação + early access |

¹ *Founder:* oferta de lançamento, vagas/tempo limitados, preço travado vitalício ("lifetime price
lock"). Mesmos recursos do Rise+ recorrente + badge **Founder** permanente (cosmético, status,
nunca vantagem) + acesso antecipado a features. Objetivo: capital inicial + comunidade evangelista,
sem violar anti pay-to-win (o badge não dá XP nem ranking).

² *Limite Free do Coach Sonnet:* cota diária de mensagens (ex.: ~5–10/dia) — generosa o bastante
para provar valor, suficiente para criar desejo do ilimitado. Calibrar via PostHog.

### Por que NÃO existe um "Rise Pro" separado de cara

Avaliado e **rejeitado para a Fase 1**: fragmentar Premium em "Rise+" e "Rise Pro" cedo cria
confusão de proposta e canibaliza conversão. A profundidade que justificaria um "Pro" (IA Opus,
analytics avançadas) já está no Rise+. **"Rise Pro" fica reservado como nome futuro** para um tier
de power-user/criador na Fase 2, se os dados mostrarem demanda por um patamar acima (ex.: cotas
maiores de IA Opus, ferramentas de criador embutidas). Não inventamos tier antes da necessidade
(regra de ouro do sequenciamento).

---

## 3. O que é grátis vs pago — e por quê

### Sempre grátis (a linha que não se cruza)
Todo o **Loop Solo** essencial: viver → registrar → ganhar XP → ver evolução → Coach orienta →
próximo objetivo. Isso inclui Skill Trees, Streaks, Missões, Conquistas e o Coach cotidiano
(heurísticas + Haiku, barato). **Razão:** a North Star é *Dias de Evolução por usuário ativo*;
travar a progressão mataria a métrica que define o produto. Free precisa encantar para que a base
orgânica e o boca-a-boca (e depois a camada social) funcionem.

### Pago (Rise+) — as três alavancas
| Alavanca | O que destrava | Por que é justo cobrar |
|---|---|---|
| **Inteligência (IA)** | Coach diário ilimitado (Sonnet) + Análise Profunda semanal (Opus) com RAG sobre as próprias stats | Custo marginal real (tokens). É o recurso de maior valor percebido e maior custo — paywall natural e honesto. |
| **Clareza (analytics)** | Estatísticas profundas, histórico ilimitado, correlações (ex.: sono × performance de estudo), tendências, multi-temporada | Profundidade analítica é valor para o power-user (Bruno), não trava ninguém. |
| **Beleza (cosmética)** | Temas, molduras, efeitos Premium + estipêndio de Faíscas + descontos no marketplace | 100% estético. Expressão de identidade, zero vantagem. |

> **Critério de paywall:** uma feature só pode ir para trás do paywall se sua ausência **não impede
> o usuário Free de evoluir de verdade**. Se impedir, é Free por definição.

---

## 4. Preços sugeridos

Ancoragem: mercado de assinaturas de produtividade/bem-estar (Duolingo Super ~R$45/mês no varejo,
Notion, Superhuman). Posicionamento Rise+: **premium acessível** — abaixo de Superhuman, na faixa
de um app de hábito premium, com forte desconto anual (padrão de SaaS para reduzir churn e melhorar
caixa).

| Plano | BRL (mês) | BRL (ano) | USD (mês) | USD (ano) | Notas |
|---|---|---|---|---|---|
| **Rise Free** | R$0 | R$0 | $0 | $0 | Generoso por design |
| **Rise+ mensal** | R$29,90 | — | $7,99 | — | Entrada de baixo atrito |
| **Rise+ anual** | — | R$199 (~R$16,58/mês) | — | $59,99 (~$5/mês) | ~45% de desconto vs mensal; foco de conversão |
| **Rise Founder** | — | R$299 vitalício (price lock) | — | $89 vitalício | Lançamento, vagas limitadas |

### Justificativa de preço
- **R$29,90/mês** fica abaixo da dor psicológica de R$30 e alinhado à percepção "vale um cafezinho
  por semana para evoluir na vida". Atrito de entrada baixo para conversão de trial.
- **Anual com ~45% off** é a oferta-âncora: melhora drasticamente caixa e LTV, reduz churn
  (compromisso anual) e é o plano que empurramos no paywall. Padrão validado por Duolingo/Calm.
- **USD ~$59,99/ano** posiciona o Rise competitivo globalmente sem desvalorizar (acima de apps
  baratos, abaixo de Superhuman). Preço regionalizado (purchasing power parity) por país via
  loja/Stripe — essencial para LatAm e mercados emergentes.
- **Founder vitalício R$299:** capta apoiadores, gera caixa inicial e comunidade. Limitado para não
  comprometer MRR de longo prazo. Trade-off consciente: troca-se LTV recorrente futuro desses poucos
  usuários por capital + evangelismo no momento mais frágil do produto.

> **Trial:** 7 dias de Rise+ completo, sem cartão obrigatório no início do trial onde a plataforma
> permitir (reduz atrito e desconfiança — anti dark pattern). Conversão medida e otimizada via
> PostHog/experimentos.

---

## 5. Marketplace de cosméticos

Marketplace (Fase 2) onde **criadores** publicam cosméticos — temas, molduras de perfil, avatares,
efeitos de level-up, packs de Temporada. Comprados com **Faíscas** (ou compra direta de Faíscas).

### Regras econômicas
- **Revenue share criador:** sugestão inicial **70% criador / 30% Rise** (alinhado a App Store/
  Steam de mercado, generoso para atrair criadores). Revisável conforme volume.
- **Faíscas** são a moeda de compra; preço de cada item é fixo e visível.
- **Curadoria de qualidade e marca:** todo item passa por revisão (estética premium + diretrizes de
  marca + segurança/conteúdo). Sem itens que imitem vantagem (ex.: "moldura de XP em dobro" — proibido).

### Guardrails anti loot box (reforço do guardrail 3)
1. **Sem caixas aleatórias.** Nada de "abra e descubra". Você vê exatamente o que compra.
2. **Sem odds ocultas.** Não existe mecânica probabilística de obtenção paga.
3. **Faíscas têm preço transparente** e não expiram de forma predatória.
4. **Sem moeda dupla confusa** para ofuscar preço real: a conversão R$↔Faíscas é exibida claramente.
5. **Nada cosmético altera percepção de progresso de terceiros** (ex.: não dá pra "fingir" um nível).

> Por que cosmético funciona como receita sem ferir ética: identidade e expressão são desejos reais
> e legítimos (vide skins em jogos AAA). O Rise captura esse desejo **sem** vender poder — o jogador
> que paga fica mais bonito, nunca mais forte.

---

## 6. Desafios pagos (Fase 2)

Desafios com inscrição paga, criados/curados por criadores (persona Caio) ou pelo Rise. Ex.: "Desafio
de 30 dias de Leitura com o Caio", com programa estruturado, marcos e recompensa cosmética exclusiva.

### Anti-vantagem (inegociável)
- A inscrição paga compra **acesso ao programa/conteúdo/curadoria e a um cosmético exclusivo** — nunca
  XP, vantagem no Ranking do desafio, nem boost. Quem paga e quem é convidado competem em pé de igualdade.
- O **resultado** do desafio depende exclusivamente do progresso real registrado.
- Cosmético exclusivo do desafio é recompensa de participação/conclusão, transparente e não-competitiva.

### Curadoria
- Todo desafio pago passa por revisão (qualidade do programa, honestidade das promessas, conformidade
  com guardrails). Sem "desafios" que prometam atalho ou vendam falsa vantagem.
- **Take rate Rise** sobre inscrição: sugestão **15–20%** (abaixo do rev share de cosmético porque o
  criador entrega trabalho de programa contínuo).

---

## 7. Recursos para criadores (Fase 2)

Caio é vetor de crescimento; monetizá-lo bem alinha incentivos (ele cresce, o Rise cresce).

| Recurso | Modelo | Observação |
|---|---|---|
| **Criação de cosméticos** | Rev share 70/30 | Via marketplace (§5) |
| **Desafios pagos / programas** | Take rate 15–20% | Curadoria obrigatória (§6) |
| **Guildas premium** | Assinatura da guilda | Só conveniência/identidade (cosmético, ferramentas de organização) — nunca vantagem |
| **Dashboard de criador** | Incluído no tier criador | Métricas de audiência, progresso dos seguidores (agregado/consentido), receita |
| **Tier "Rise Pro" (criador)** | Recorrente | *Reservado* — ativar se dados de Fase 2 justificarem cotas/ferramentas avançadas |

Princípio: ferramentas de criador vendem **alcance, organização e monetização do próprio trabalho** —
nunca a capacidade de dar vantagem competitiva aos seguidores.

---

## 8. B2B — Rise for Teams (Fase 3)

Compradora: **Renata** (Head de People & Cultura, ~600 pessoas). Dor: ferramentas de bem-estar com
adesão pífia. Proposta: um benefício que o time **quer** usar (porque é um bom produto solo primeiro)
+ visibilidade agregada para RH **com privacidade individual inegociável**.

### Oferta
- **Licença por assento** (Seat) com Rise+ incluso para colaboradores.
- **Dashboards agregados e anônimos** de engajamento e bem-estar (jamais dados individuais
  identificáveis — privacidade é a condição de venda e de confiança).
- **Desafios corporativos** e **Guildas por time** (responsabilidade coletiva saudável).
- **Admin/SSO**, faturamento centralizado, onboarding.

### Pricing B2B (sugestão inicial)
| Item | Faixa | Notas |
|---|---|---|
| **Rise for Teams — por assento/mês** | R$25–40 / ~$6–10 | Desconto por volume; menor que somar Rise+ individual |
| **Piso de contrato** | Anual | Reduz churn, melhora previsibilidade |
| **Enterprise (SSO, dashboards avançados, CSM)** | Sob consulta | Para contas grandes |

> Trade-off: B2B tem ciclo de venda longo e exige SOC2/privacidade robusta — por isso é **Fase 3**,
> só após massa orgânica e produto consolidado. Mas a margem e a previsibilidade de receita B2B
> ancoram o negócio em escala. O motor de adoção é o produto solo já amado (bottom-up), não venda
> top-down de "wellness".

---

## 9. Ética de monetização — sem dark patterns

Operacionalização do princípio 5. O funil de pagamento segue regras explícitas:

- **Cancelamento simétrico:** cancelar leva o mesmo número de cliques que assinar. Sem "ligue para
  cancelar", sem labirinto de retenção, sem culpa.
- **Sem cobrança-surpresa:** trial avisa antes de cobrar; renovação anual avisa por e-mail (Resend)
  com antecedência.
- **Sem FOMO artificial:** ofertas têm prazo real quando têm prazo; nada de "timer" que reinicia.
- **Downgrade preserva o usuário:** ao voltar para Free, o usuário **não perde XP, níveis,
  conquistas, áreas ou histórico** — perde apenas o acesso aos recursos Premium (IA profunda,
  analytics, cosméticos Premium). Dados do usuário são do usuário.
- **Faíscas e cosméticos transparentes:** preço sempre visível, sem aleatoriedade (§5).
- **Paywall honesto:** comunica claramente o valor ("Coach diário ilimitado + Análise Profunda")
  sem prometer resultado que não entrega.
- **Acessibilidade do Free:** o Free nunca é degradado artificialmente para forçar upgrade
  (ex.: não lentificamos, não inserimos anúncios intrusivos — o canon proíbe ads intrusivos).

---

## 10. Unit economics e custo de IA

A IA é o coração do valor **e** o maior custo variável. A disciplina de unit economics é arquitetural,
não acessória.

### Modelo de IA em camadas (já canônico) como controle de custo
| Camada | Modelo | Uso | Quem paga |
|---|---|---|---|
| 0 | Heurísticas (sem LLM) | Classificação trivial, regras de XP/streak | — |
| 1 | `claude-haiku-4-5` | Microtarefas, classificação em volume, Coach cotidiano | Free + Premium |
| 2 | `claude-sonnet-4-6` | Coach diário conversacional | Free (cota) / Premium (ilimitado) |
| 3 | `claude-opus-4-8` | Análise Profunda semanal (RAG sobre stats) | **Premium only** |

**Alavancas de controle de custo de IA por usuário:**
1. **Roteamento por camada:** a maioria das interações resolve em heurística/Haiku; Opus é raro
   (semanal) e gated no Premium — ou seja, **o custo caro só existe para quem paga**.
2. **Caching de prompt** (system prompts, contexto de RAG estável) reduz tokens repetidos.
3. **Batch** de análises de IA (Inngest) fora de horário de pico; agregação de stats antes do LLM.
4. **RAG enxuto:** pgvector entrega só o contexto relevante das stats, evitando despejar histórico bruto.
5. **Cotas e rate-limit** no Free (Sonnet) blindam o CAC de abuso de IA por não-pagantes.
6. **Observabilidade de custo** (PostHog + logs Axiom/OTel): custo de IA por usuário é métrica de
   produto monitorada; alertas se o custo/usuário Premium ultrapassar teto.

### Projeção ilustrativa (premissas a validar com dados reais)
> Números abaixo são **estimativas de modelagem**, não compromissos. Servem para validar a viabilidade
> da margem e calibrar cotas.

| Métrica | Free | Premium (Rise+) |
|---|---|---|
| Custo de IA/usuário/mês (estimado) | ~R$0,10–0,40 (só Haiku + cota Sonnet) | ~R$3–8 (Sonnet ilimitado + Opus semanal, com caching/batch) |
| Receita/usuário/mês | R$0 | ~R$16,58 (anual) a R$29,90 (mensal) |
| **Margem bruta estimada (Premium)** | — | **~70–85%** (após IA + infra) |

- **Free é subsidiado** mas barato (Haiku/heurística + cota). É CAC orgânico: cada Free encantado vira
  boca-a-boca e funil de conversão.
- **Premium tem margem bruta saudável (70%+)** mesmo com IA, graças ao roteamento em camadas. Se a
  margem cair, a alavanca é **cota/caching/batch**, não cortar valor.

### CAC / LTV (alvos de modelagem)
| Indicador | Alvo inicial | Racional |
|---|---|---|
| **Conversão Free→Premium** | 3–6% | Faixa saudável de freemium de consumo (Duolingo ~5–8% após maturidade) |
| **Churn mensal Premium** | <5% (anual reduz para <3%) | Anual e profundidade de IA/analytics aumentam stickiness |
| **LTV Premium** | R$300–600+ | Função de retenção; profundidade de IA + identidade cosmética sustentam |
| **CAC inicial** | Baixo (orgânico) | Produto compartilhável (Fase 2 social) + boca-a-boca; pago vem depois |
| **LTV/CAC** | **>3** | Limiar de SaaS saudável; protegido por baixo CAC orgânico + LTV de IA |

> Tese de unit economics: **o motor de crescimento é o produto (orgânico/social), não o ad spend**;
> o motor de margem é **a IA em camadas**. Os dois juntos é o que torna "produto para milhões"
> financeiramente viável sem dark patterns.

---

## 11. Sequenciamento da monetização

Alinhado ao `productSequencing` do canon — monetizar sem atropelar o Loop Solo.

| Quando | O que ativar |
|---|---|
| **Fase 1 (loop solo provado)** | Rise+ (mensal + anual) + Founder no lançamento. IA profunda + analytics + cosméticos base. |
| **Fase 2 (social)** | Marketplace de cosméticos, desafios pagos, ferramentas/rev share de criador, guildas premium. Avaliar "Rise Pro" criador. |
| **Fase 3 (B2B/escala)** | Rise for Teams (assentos, dashboards anônimos, desafios corporativos), enterprise. |

**Critério de gate:** não introduzir paywall agressivo antes de retenção D7/D30 forte (critério de
saída da Fase 1). Cobrar cedo demais de um produto ainda não amado mata o boca-a-boca.

---

## 12. Princípios de decisão

- **A vida grátis, a inteligência paga.** Progresso nunca tem paywall; profundidade de IA, clareza
  de dados e beleza cosmética sim.
- **Margem vem da arquitetura, não do corte de valor.** IA em camadas + caching + cotas é como se
  paga IA premium e ainda sobra margem.
- **Honestidade é retenção.** Sem dark patterns, sem pay-to-win, sem loot box — porque respeitar o
  usuário é a estratégia de LTV.
- **Não inventar tier antes da necessidade.** Free + Rise+ + Founder bastam na Fase 1; "Rise Pro" e
  B2B chegam quando os dados pedirem.
- **Cosmético é identidade, nunca poder.** Quem paga fica mais bonito, jamais mais forte.
