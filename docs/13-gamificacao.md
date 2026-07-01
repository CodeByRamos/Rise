# Sistema de Gamificação do Rise

> Documento canônico. Escopo: especificação completa, fechada e acionável do sistema de gamificação do Rise — fórmulas, regras, eventos e guardrails. Expande o `gamificationCore` do canon (`docs/00-canon.md`) sem contradizê-lo. Esta é a fonte da verdade para `packages/core`, schema (`packages/db`), Coach de IA (`packages/ai`) e UI. Em caso de conflito, o canon prevalece.

O Rise não distribui pontos por abrir o app. Distribui **XP/Pontos de Evolução** por ações reais positivas, registradas com fricção mínima e validadas contra abuso. Toda mecânica aqui — níveis, Skill Trees, Streaks, Missões, Temporadas, Ligas, Guildas, Faíscas — existe para uma só coisa: tornar visível e prazerosa a evolução que a pessoa já está construindo na vida real. O sistema é AAA na sensação e cirúrgico nas regras: progride quem age, nunca quem paga. Este documento define os números, as fórmulas e os limites que tornam isso verdade — e à prova de exploit.

---

## TL;DR

- **XP** é a única moeda de progresso. Concedida por ação real, por **Área da Vida**, registrada num livro-razão imutável (`XPLedger`). Nunca comprável.
- **Curva de nível** explícita e idêntica para toda área: `XP_acumulado(n) = 50·n² + 50·n`. **Nível Rise** agrega áreas. **Prestígio** reseta visualmente após o nível-teto, preservando histórico.
- **Skill Tree** por Área da Vida: nós destravados por nível de área + marcos; ramos de profundidade e largura. Sem poder competitivo — só foco e identidade.
- **Streaks** com **Streak Freeze** (ganho jogando), **perdão automático** e **Modo Descanso** — compromisso saudável, nunca culpa.
- **Missões** diárias/semanais geradas por heurística + Coach; **Desafios** com prazo; **Temporadas** mensais com leaderboard sazonal e recompensas cosméticas.
- **Conquistas/Badges** em categorias e raridades transparentes. **Ligas** estilo Duolingo (10 divisões, promoção/rebaixamento por XP semanal). **Guildas** com papéis e metas coletivas (Fase 2).
- **Faíscas/Sparks**: moeda cosmética ganha jogando, gasta só em cosméticos. Anti-inflação e anti-gaming embutidos.
- **Equilíbrio emocional** é requisito de produto, não enfeite: sem streak-shame, sem FOMO, progresso que perdoa.
- Tudo emite **eventos canônicos** (`xp.granted`, `level.up`, `streak.extended`…) que banco, Coach e feed reusam.

---

## 1. Princípios de design (não negociáveis)

| # | Princípio | Implicação prática |
|---|-----------|--------------------|
| 1 | **Progresso = ação real** | XP só nasce de `ActionLog` validado. Nada de XP por engajamento vazio (abrir app, rolar feed). |
| 2 | **Honestidade by design** | Faíscas/dinheiro nunca compram XP, nível, skill, ranking. Pago é cosmético/conveniência/profundidade de IA. |
| 3 | **Competição só por esforço** | Ligas e rankings ordenam por XP/progresso real. Reset sazonal evita acúmulo de vantagem perpétua. |
| 4 | **Perdão > punição** | Streak quebra com amortecedores. Modo Descanso pausa sem culpa. Nunca remover XP/nível já conquistado. |
| 5 | **Transparência total** | Sem loot box predatória. Toda recompensa cosmética mostra o que é antes da troca. Odds, quando houver, são públicas. |
| 6 | **AAA na sensação, cirúrgico na regra** | Animações e microinterações fortes; mas o motor de XP é determinístico, auditável e idempotente. |
| 7 | **Anti-gaming desde o dia 1** | Limites diários, validação, detecção de auto-report falso. O sistema assume que será atacado. |

---

## 2. XP — a moeda de progresso

### 2.1 Conceito e invariantes

XP é concedido **por ação** e **por Área da Vida**. Cada concessão vira uma linha imutável no `XPLedger` (`XPGrant`). O nível é **derivado** do XP acumulado — nunca armazenado como verdade primária. Isso garante auditabilidade e permite recomputar tudo a partir do ledger.

**Invariantes:**
- XP nunca é negativo num grant válido. Correções de fraude usam grants de **estorno** explícitos (`reason: "reversal"`), preservando a trilha.
- XP nunca é removido por inatividade, quebra de streak ou rebaixamento de liga. O que sobe, fica.
- XP é **idempotente por ação**: cada `ActionLog` gera no máximo um conjunto de grants; reprocessar não duplica.

### 2.2 Fórmula de XP por ação

XP de uma ação combina valor-base da ação, multiplicador de esforço/dificuldade e bônus contextuais (streak, missão), com teto anti-inflação.

```
XP_acao = round(
  base_acao
  × mult_dificuldade
  × mult_streak
  × mult_missao
)
XP_concedido = min(XP_acao, teto_diario_area_restante)
```

| Fator | Faixa | Origem |
|-------|-------|--------|
| `base_acao` | 5–50 | Tabela de ações por área (ver 2.3). Quanto mais custosa/rara a ação, maior. |
| `mult_dificuldade` | 1.0–2.0 | Intensidade/duração informada e validada (ex.: 1h de estudo vs 15min). Capado para evitar inflação por exagero. |
| `mult_streak` | 1.0–1.5 | Bônus de sequência (ver §5). Cresce devagar e satura. |
| `mult_missao` | 1.0–2.0 | Ação que cumpre Missão ativa ganha bônus pontual (não acumulável com outra missão na mesma ação). |
| `teto_diario_area_restante` | — | Limite diário de XP por área (anti-grinding, ver §10). |

### 2.3 Tabela de XP-base por ação (exemplos canônicos)

Valores de referência para Fase 1. Calibráveis por PostHog/A-B sem mudar a fórmula.

| Área da Vida | Ação (ActionLog) | `base_acao` | Observação |
|--------------|------------------|-------------|------------|
| Estudos | Sessão de estudo focado (bloco 25min) | 15 | Multiplicador por nº de blocos, capado a 4/registro. |
| Programação | Commit/PR/feature registrada | 20 | Integração futura com GitHub valida (anti-fake). |
| Programação | Sessão de deep work (50min) | 25 | Persona Bruno: profundidade > frequência. |
| Academia | Treino concluído | 30 | Recorde/PR dá Conquista, não mais XP bruto. |
| Saúde | Meta de passos/hidratação do dia | 10 | Idealmente sensor/integração; manual tem limite. |
| Sono | Noite dentro da meta de horário/duração | 20 | Validação por janela de horário declarada. |
| Alimentação | Refeição registrada dentro do plano | 8 | Volume alto → base baixa (anti-spam). |
| Leitura | Sessão de leitura (20min ou capítulo) | 12 | — |
| Finanças | Aporte/registro de orçamento cumprido | 15 | — |
| Idiomas | Lição/prática de idioma | 12 | — |
| Música | Sessão de prática (instrumento/voz) | 15 | Área criável (persona Diego). |
| Surf / Skate | Sessão registrada | 20 | Áreas de baixa frequência, base maior. |
| Espiritualidade | Meditação/prática | 10 | — |
| Relacionamentos | Tempo de qualidade registrado | 10 | — |
| Trabalho | Bloco de foco/entrega registrada | 15 | — |

> Princípio de calibração: **frequência alta → base baixa; ação rara/custosa → base alta**. Isso achata incentivos a spam de microações e valoriza o esforço real. A área criada pelo usuário herda um template de base configurável dentro de uma faixa segura (5–30) para impedir auto-inflação.

### 2.4 Exemplo numérico

Bruno faz um deep work de 50min em Programação, está em streak de 12 dias (mult 1.3) e a sessão cumpre a Missão diária "1 bloco de foco" (mult 1.5):

```
XP = round(25 × 1.0 × 1.3 × 1.5) = round(48.75) = 49 XP em Programação
```

Se ele repetir 6 sessões no mesmo dia, o **teto diário da área** (ex.: 150 XP/dia em Programação) corta o excedente — as 3 primeiras contam cheio, depois satura. O Coach reconhece o esforço extra, mas a barra de XP protege a economia.

---

## 3. Níveis — Área, Rise e Prestígio

### 3.1 Curva de nível (fórmula explícita)

Uma única curva quadrática vale para **toda Área da Vida**. Quadrática (não exponencial) porque queremos progressão constante e justa por décadas de uso, sem o "muro" desmotivador de curvas exponenciais e sem o anti-clímax de curvas lineares.

**XP acumulado necessário para atingir o nível `n`:**

```
XP_total(n) = 50·n² + 50·n          (n = 0, 1, 2, …)
```

**XP para passar do nível `n` para `n+1` (custo do próximo nível):**

```
XP_proximo(n) = XP_total(n+1) − XP_total(n) = 100·(n+1)
```

Ou seja: nível 1 custa 100 XP, nível 2 custa +200, nível 3 custa +300… Incremento linear e legível ("cada nível pede 100 XP a mais que o anterior").

| Nível `n` | XP acumulado `XP_total(n)` | Custo do nível (`100·n`) |
|-----------|----------------------------|--------------------------|
| 1 | 100 | 100 |
| 2 | 300 | 200 |
| 3 | 600 | 300 |
| 5 | 1.500 | 500 |
| 10 | 5.500 | 1.000 |
| 20 | 21.000 | 2.000 |
| 50 | 127.500 | 5.000 |
| 100 (teto) | 505.000 | 10.000 |

**Nível derivado a partir do XP** (inverso da curva):

```
nivel(xp) = floor( ( -50 + sqrt(2500 + 200·xp) ) / 100 )
```

Função pura, determinística, testável — implementada em `packages/core` e reusada por web e mobile.

### 3.2 Nível Rise (Rank de Vida)

O **Nível Rise** agrega a evolução de todas as áreas. Não é a soma bruta de XP (isso premiaria quem grinda uma única área); é uma média que valoriza **amplitude + profundidade**.

```
XP_rise = Σ_areas ( XP_area )                         // base de progresso total
NivelRise = nivel( XP_rise × fator_amplitude )

fator_amplitude = 1 + 0.04 × (areas_ativas − 1)        // capado em areas_ativas = 8 → +28%
```

- `areas_ativas` = áreas com pelo menos nível 2 e ação nos últimos 30 dias.
- O `fator_amplitude` recompensa equilíbrio (persona Diego, multi-frentes) sem punir o especialista (persona Bruno), que ainda sobe pela massa de XP em poucas áreas.
- O Nível Rise tem **teto 100** antes do Prestígio.

### 3.3 Prestígio

Ao atingir **Nível Rise 100**, o usuário pode (opt-in, nunca forçado) entrar em **Prestígio**:

- O selo visual de Prestígio (I, II, III…) aparece no perfil; o Nível Rise "reinicia" a barra visual, mas **todo XP histórico, áreas, conquistas e níveis de área permanecem intactos**.
- Prestígio é puramente **cosmético/status** — destrava molduras e efeitos exclusivos. **Não dá vantagem competitiva** (não altera ranking, não multiplica XP).
- Existe para dar horizonte de longuíssimo prazo aos veteranos sem inflar a economia.

> Decisão / trade-off: oferecer Prestígio só no Nível Rise (não por área) evita poluir cada Skill Tree com resets e mantém a profundidade por área intacta e legível para Bruno. Prestígio por área seria complexidade desnecessária — rejeitado.

---

## 4. Áreas da Vida como Skill Trees

Cada **Área da Vida** é uma "classe" de RPG com sua própria **Skill Tree (Árvore de Habilidade)**. A árvore traduz XP e marcos em **profundidade e identidade**, sem jamais virar poder competitivo.

### 4.1 Anatomia da árvore

- **Tronco (linha principal):** nós destravados puramente por **Nível de Área** (cada N níveis). Representam a progressão garantida — todo mundo que sobe destrava.
- **Ramos (specializations):** bifurcações que pedem **marcos específicos** (ex.: Conquistas, recordes, missões temáticas). Representam escolha de foco. Ex.: em Academia, ramo "Força" vs ramo "Resistência".
- **Folhas (nós de maestria):** nós raros de fim de ramo, ligados a Conquistas de alta raridade.

### 4.2 O que um nó (`SkillNode`) concede

Cosmético, informacional ou de conveniência — **nunca** XP-boost competitivo nem vantagem sobre outros:

| Tipo de nó | Exemplo | Natureza |
|------------|---------|----------|
| Identidade | Título/insígnia "Maratonista" em Academia | Cosmético |
| Insight | Desbloqueia métrica avançada da área no painel | Informacional (depth, ok no Free com limites; profundo no Premium) |
| Ritual | Novo tipo de Missão temática disponível | Conveniência (mais formas de jogar, não mais poder) |
| Cosmético | Efeito visual de level-up específico da área | Cosmético |

> Guardrail: nós **podem** dar um pequeno bônus de XP **dentro da própria área** (ex.: +2% em Leitura) como recompensa de profundidade — mas isso **não cruza áreas** e é capado para não distorcer rankings (rankings usam XP normalizado por período; ver §8). Nunca há nó que dê vantagem **contra** outro usuário.

### 4.3 Desbloqueio (regra)

```
no_destravavel = (nivel_area ≥ no.nivel_requerido)
                 AND (marcos_requeridos ⊆ conquistas_do_usuario)
                 AND (pre_requisitos ⊆ nos_ja_destravados)
```

Destravar um nó disponível é gratuito (custo já foi o esforço de chegar lá) e emite `skill.node.unlocked`. Não há "respec pago" — a árvore é cumulativa e não competitiva, então reset pago seria um dark pattern desnecessário.

### 4.4 Áreas personalizadas

O usuário cria Áreas da Vida (ex.: Diego cria "Música"). A área nova recebe um **template de Skill Tree genérico** (tronco por nível + 2 ramos configuráveis) e uma `base_acao` dentro da faixa segura. Isso garante que áreas custom tenham a mesma sensação AAA sem virar vetor de auto-inflação.

---

## 5. Streaks — compromisso sem culpa

### 5.1 Definição

**Streak/Sequência** = dias consecutivos com ao menos uma ação válida. Existem streaks **por área** e um streak **geral** (qualquer ação em qualquer área conta para o geral).

### 5.2 Bônus de streak (mult_streak)

Cresce devagar e **satura** — para não criar pânico de "não posso perder meus 200 dias".

```
mult_streak = min( 1 + 0.02 × dias_streak, 1.5 )
```

| Dias de streak | Multiplicador |
|----------------|---------------|
| 1 | 1.02 |
| 7 | 1.14 |
| 14 | 1.28 |
| 25 | 1.50 (teto) |
| 200 | 1.50 (igual) |

> Por quê saturar em 25 dias: o valor mecânico do streak para quando o hábito já está formado. Quem está em 200 dias não perde XP relevante ao quebrar — o que protege contra **streak-shame** e ansiedade. O streak longo vira **status/Conquista**, não dependência de XP.

### 5.3 Amortecedores (anti-burnout)

| Mecanismo | Regra | Propósito |
|-----------|-------|-----------|
| **Streak Freeze (Congelamento)** | Item ganho jogando (Missões/Conquistas) ou comprável com **Faíscas**. Protege 1 dia perdido automaticamente. Máx. 2 ativos por vez. | Perdão sem comprar progresso (freeze não é vantagem competitiva — é alívio). |
| **Perdão automático** | 1 "falha esquecida" a cada 14 dias de streak é absorvida sem quebrar, mesmo sem freeze. | Imprevistos da vida real não punem. |
| **Streak repair (recuperação)** | Até 24h após quebrar, registrar uma ação restaura o streak ao valor anterior. Gratuito, 1x por semana. | Reduz o "tudo ou nada". |
| **Modo Descanso** | Usuário ativa pausa planejada (viagem, doença). Streak **congela** (não zera, não conta como falha) por até 14 dias. | Vida acontece. Descanso é saudável, não derrota. |

### 5.4 Regras anti-toxicidade

- **Notificação de streak** é informativa e calorosa, nunca culpada ("Faltam 4h para manter sua Sequência de Leitura" — sim; "Você vai perder TUDO!" — proibido). Sem contagem regressiva agressiva, sem badge de vergonha.
- Quebrar streak **nunca remove XP, nível ou conquistas**. Só zera o contador da sequência atual; o **recorde de streak** fica salvo como Conquista permanente.
- O Coach detecta padrão de burnout (streaks longos + queda de bem-estar/sono) e **sugere ativamente o Modo Descanso** — o produto protege o usuário de si mesmo.

---

## 6. Missões e Desafios

### 6.1 Missões

**Missão** = objetivo acionável que concede XP ao concluir. Geradas por heurística (regras determinísticas baratas) e refinadas pelo **Coach de IA** (Haiku no cotidiano).

| Tipo | Cadência | Exemplo | Recompensa |
|------|----------|---------|------------|
| Diária | Reset 00h local | "Faça 1 sessão de estudo" | XP + progresso de temporada + 1–3 Faíscas |
| Semanal | Reset segunda 00h | "5 treinos esta semana" | XP maior + Faíscas + chance de Conquista |
| Personalizada (Coach) | Sob demanda | "Durma antes de 0h por 3 noites" (gerada do padrão do usuário) | XP + Insight do Coach |

Regras:
- Máx. 3 Missões diárias ativas (evita sobrecarga/ansiedade). Missões não concluídas **não punem** — somem no reset.
- A `mult_missao` de uma ação só se aplica a **uma** missão (a de maior recompensa elegível), evitando empilhamento abusivo.
- Missões são **alcançáveis e personalizadas ao nível** do usuário (anti-frustração; persona Diego no recomeço frágil).

### 6.2 Desafios

**Desafio** = evento com meta e prazo. Fase 1: individuais sugeridos pelo Coach (ex.: "Maratona de Leitura: 7 dias"). Fase 2: de guilda/comunidade e de criador (Caio), inclusive pagos.

- Desafios pagos vendem **acesso/curadoria/comunidade**, jamais vantagem de XP. Recompensa de desafio pago é cosmética/status.
- Conclusão emite `challenge.completed`, podendo destravar Conquista e cosmético sazonal.

---

## 7. Temporadas (Seasons)

### 7.1 Estrutura

| Parâmetro | Valor canônico | Justificativa |
|-----------|----------------|---------------|
| Duração | **~30 dias** (mensal, alinhado ao mês civil) | Novidade recorrente sem pressa; legível ("a Temporada de Julho"). |
| Tema | Cosmético + desafios temáticos | Renova a vitrine sem mudar o motor de XP. |
| Trilha de progresso | "Passe de Temporada" gratuito + faixa Premium | Free recebe recompensas reais; Premium amplia (mais cosméticos, não poder). |
| Reset | **Leaderboard sazonal** e progresso do passe zeram | XP, níveis, conquistas e Skill Trees **NÃO** resetam, nunca. |
| Recompensas | Cosméticos exclusivos da temporada (temas, molduras, efeitos, avatares) + Faíscas | Exclusividade temporal cria valor sem FOMO predatório (volta como item de loja meses depois, sem ser "perdido para sempre" de forma manipuladora). |

### 7.2 Progresso de temporada

Ganha-se **Pontos de Temporada (PT)** ao completar Missões e Desafios e ao registrar ações (fração do XP vira PT). PT avançam a trilha do passe. PT são **derivados de esforço**, idênticos para Free e Premium — o Premium só destrava trilhas cosméticas extras na mesma quantidade de esforço.

> Guardrail anti-FOMO: a barra de temporada nunca usa linguagem de medo. Recompensas perdidas retornam em rotação. A temporada é um "novo capítulo", não um "agora ou nunca".

---

## 8. Conquistas, Badges e Rankings

### 8.1 Conquistas e Badges

**Conquista** = marco permanente desbloqueável. **Badge/Insígnia** = sua representação visual exibível. Categorias e raridades são **transparentes**.

**Categorias:**

| Categoria | Exemplos |
|-----------|----------|
| Marco de área | "Leitura Nível 10", "Maratonista" (Academia) |
| Streak | "30 Dias de Sono", "Sequência de Ferro (100 dias)" |
| Recorde/PR | Melhor desempenho pessoal registrado numa área |
| Amplitude | "Renascença" (nível 5+ em 5 áreas) — premia Diego/Rise equilibrado |
| Comunidade (Fase 2) | "Pilar da Guilda", "Líder de Liga" |
| Jornada | "Primeira Semana", "Um Ano de Evolução" |

**Raridades (cosmético/status, sem poder):** Comum, Rara, Épica, Lendária, Mítica. A raridade reflete dificuldade real de obtenção e define o brilho/efeito do badge. Odds e critérios são públicos — **sem aleatoriedade oculta**.

### 8.2 Rankings — Ligas estilo Duolingo

Rankings ordenam **exclusivamente por progresso real (XP da semana)**, com reset semanal para manter a competição fresca e justa para recém-chegados.

**10 divisões (Ligas):**

| # | Liga | Faixa |
|---|------|-------|
| 1 | Bronze | Entrada |
| 2 | Prata | — |
| 3 | Ouro | — |
| 4 | Safira | — |
| 5 | Rubi | — |
| 6 | Esmeralda | — |
| 7 | Ametista | — |
| 8 | Diamante | — |
| 9 | Mestre | — |
| 10 | Lendária | Topo |

**Mecânica:**
- Grupos de ~30 usuários por liga. Ranking ordenado por **XP-semana normalizado** (ver anti-gaming abaixo).
- **Promoção:** top 7 sobem de divisão ao fim da semana. **Rebaixamento:** bottom 5 descem (exceto na Bronze, que não rebaixa — recomeços não são punidos). Meio da tabela permanece.
- Reset semanal de XP-semana; **XP total/níveis nunca resetam**.

**Anti-distorção da liga:**
- O XP que conta para liga é **normalizado por área** para impedir que uma única área com base alta domine (ex.: Surf vs Alimentação). Usa-se o XP convertido em "progresso de nível" relativo, não XP bruto.
- Tetos diários (§10) já limitam grind.
- Matchmaking agrupa por nível Rise e atividade, para ligas justas (Lia iniciante não compete com veterano).

> Por quê liga semanal e não ranking global eterno: ranking global premia veteranos para sempre e desmotiva novatos (cold-start de motivação). Ligas com reset dão a todo mundo uma corrida nova toda semana — competição por **esforço da semana**, exatamente o guardrail do canon. Rankings são **opt-out**: quem joga solo (Bruno em modo foco) pode ocultar-se sem perder XP.

### 8.3 Guildas (Fase 2)

**Guilda** = grupo para responsabilidade coletiva, desafios e identidade.

**Papéis:** Líder, Oficial, Membro. Permissões: Líder gerencia guilda e metas; Oficial cria/modera desafios; Membro participa.

**Metas coletivas:** XP somado da guilda em desafios de temporada destrava recompensas **para todos os membros** (cosméticos, emblema de guilda). A contribuição individual respeita os mesmos tetos — não dá para "comprar" um carregador. Guilda premium (Fase 2) vende **capacidade/ferramentas/cosméticos**, nunca multiplicador competitivo.

---

## 9. Economia — Faíscas (Sparks) e Loja de Cosméticos

### 9.1 Natureza das Faíscas

**Faíscas/Sparks** = moeda **cosmética**. Ganha **jogando** (Missões, Conquistas, Temporada, level-up) e **opcionalmente comprável** com dinheiro. Gasta **somente** em cosméticos e conveniências sem impacto competitivo (ex.: Streak Freeze extra).

**Guardrail absoluto:** Faíscas **nunca** compram XP, nível, skill, ranking, posição em liga ou qualquer vantagem. Comprar Faíscas é comprar **aparência**, não progresso.

### 9.2 Fontes e sinks (sumidouros)

| Fonte (ganho) | Faíscas típicas |
|---------------|-----------------|
| Missão diária | 1–3 |
| Missão semanal | 10–20 |
| Conquista (por raridade) | 5–100 |
| Level-up de área | 5 |
| Recompensa de temporada | variável |

| Sink (gasto) | Custo | Tipo |
|--------------|-------|------|
| Tema visual | médio | Cosmético |
| Avatar / quadro de avatar | baixo–médio | Cosmético |
| Moldura de perfil | baixo | Cosmético |
| Efeito de level-up | médio | Cosmético |
| Streak Freeze extra | baixo | Conveniência (alívio, não vantagem) |

### 9.3 Loja de cosméticos

- Itens **sempre mostrados antes da compra** — preço fixo e transparente. **Sem loot box, sem gacha, sem aleatoriedade predatória.**
- Catálogo permanente + rotação sazonal. Itens sazonais retornam em rotação (não "perdidos para sempre" de forma manipuladora).
- Cosméticos premium pagos coexistem com cosméticos grátis fortes — **o usuário Free tem identidade visual rica** (anti pay-to-win estético também: ninguém parece "de segunda classe" por não pagar).

### 9.4 Regras anti-inflação e anti-gaming da economia

| Risco | Mitigação |
|-------|-----------|
| Inflação (Faíscas demais circulando barateiam tudo) | **Tetos diários/semanais** de ganho de Faíscas por fonte; sinks suficientes (catálogo amplo, sazonais); preços ancorados, revisados por telemetria. |
| Grind de XP/Faíscas | **Teto diário de XP por área** (curva de retornos decrescentes, ver §10). |
| Auto-report falso (lançar ação que não fez) | Ver §10.3 — validação, plausibilidade, integrações, limites e detecção de padrão. |
| Compra disfarçada de vantagem | Separação dura no schema: `SparksWallet` e cosméticos **não têm relação** com `XPLedger`/níveis. Impossível por design, não só por política. |

---

## 10. Anti-abuso, anti-grinding e validação

### 10.1 Tetos diários por área (retornos decrescentes)

Cada área tem um **teto diário de XP**. Antes do teto, XP cheio; ao se aproximar, retornos decrescem; após o teto, ações ainda são registradas e celebradas pelo Coach, mas geram XP simbólico.

```
teto_diario_area = base_teto_area            (ex.: Programação 150, Alimentação 40)
XP_efetivo = XP_acao,                         se xp_dia_area + XP_acao ≤ teto
           = decaimento(...),                 acima do teto (cap suave)
```

Propósito: impedir maratonas artificiais e proteger a economia/liga, sem dizer "pare de viver". A ação registrada acima do teto **conta para streak e estatísticas**, só não inflaciona XP.

### 10.2 Idempotência e janelas

- Cada `ActionLog` tem chave de idempotência (cliente gera `client_action_id`); reenvio não duplica XP.
- Ações da mesma categoria têm **janela mínima** entre registros (ex.: não dá para registrar 20 "sessões de estudo de 25min" em 10 minutos). Violações viram registro sem XP + sinal anti-fraude.

### 10.3 Detecção de auto-report falso

O Rise depende de auto-relato — então a integridade é tratada como problema de produto.

| Camada | Mecanismo |
|--------|-----------|
| **Validação de plausibilidade** | Limites físicos/temporais (ex.: 40 treinos num dia é implausível; capado e sinalizado). |
| **Integrações como verdade preferencial** | Sempre que possível, ação validada por fonte externa (HealthKit/Google Fit para Saúde/Sono/Academia; GitHub para Programação) vale XP cheio; manual tem tetos mais conservadores. |
| **Detecção de padrão** | Modelo barato (heurística + Haiku) sinaliza anomalias: bursts não-humanos, registros idênticos em lote, picos só perto do reset de liga. |
| **Consequência proporcional** | Primeiro: XP daquele lote não conta (silencioso, sem acusação ao usuário honesto). Reincidência clara: revisão da liga/ranking (shadow). **Nunca** remoção de XP histórico legítimo por engano — falso positivo é pior que falso negativo na sensação. |
| **Impacto contido** | Como rankings resetam semanalmente e são normalizados, o ganho de trapacear é baixo por design — reduz o incentivo a trapacear. |

> Filosofia: o objetivo do anti-fraude é **proteger a economia e a justiça das ligas**, não policiar o usuário. O Free honesto nunca sente atrito. O batoteiro só vê seus ganhos não renderem.

---

## 11. Equilíbrio emocional (requisito de produto)

O Rise é alto engajamento **porque a pessoa evolui de verdade** — nunca por ansiedade. Regras transversais:

- **Sem streak-shame:** notificações calorosas, nunca culpadas; quebrar streak não remove nada conquistado; recorde de streak vira Conquista permanente.
- **Modo Descanso de primeira classe:** acessível, sugerido pelo Coach em sinais de burnout, sem custo, sem penalidade. Descanso é evolução também.
- **Progresso que perdoa:** Streak Freeze, perdão automático, streak repair (§5.3). A vida real fura a rotina e o app sabe disso.
- **Missões alcançáveis e personalizadas:** dificuldade calibrada ao nível e ao momento do usuário (Diego no recomeço recebe metas menores; Bruno recebe profundidade). Sem metas impossíveis que geram desistência.
- **Comparação saudável:** rankings opt-out; ligas com matchmaking justo e reset semanal; feed (Fase 2) só inspira progresso, sem vaidade tóxica.
- **Celebração genuína:** level-up, Conquista e PR disparam feedback AAA (animação, som, microinteração) proporcional ao feito — o app comemora com a pessoa.
- **Coach como guardião do bem-estar:** detecta padrões de excesso (sono caindo + grind subindo) e intervém com empatia, sugerindo descanso — alinhado à missão de evolução **constante e sustentável**.

---

## 12. Eventos canônicos de gamificação

Toda mecânica **emite eventos**, consumidos por banco (`packages/db`), Coach (`packages/ai`, RAG/insights), feed (Fase 2), notificações, PostHog e Inngest (jobs duráveis: reset de temporada, liga semanal, streaks). Nomes em `dot.case`, payload tipado em `packages/core`. Eventos são a **API interna** da gamificação — fonte única para reuso.

| Evento | Quando | Payload essencial |
|--------|--------|-------------------|
| `action.logged` | Ação registrada (pré-validação) | `userId, lifeAreaId, actionType, clientActionId, intensity, ts` |
| `action.validated` | Ação passou anti-fraude/tetos | `actionLogId, accepted, cappedXp` |
| `xp.granted` | XP concedido a uma área | `userId, lifeAreaId, amount, sourceActionId, multipliers{}` |
| `xp.reversed` | Estorno por fraude/correção | `userId, lifeAreaId, amount, reason, refGrantId` |
| `level.up` | Nível de Área subiu | `userId, lifeAreaId, fromLevel, toLevel` |
| `rise.level.up` | Nível Rise subiu | `userId, fromLevel, toLevel, fatorAmplitude` |
| `prestige.entered` | Usuário entrou em Prestígio | `userId, prestigeTier` |
| `skill.node.unlocked` | Nó de Skill Tree destravado | `userId, lifeAreaId, nodeId, branch` |
| `streak.extended` | Streak avançou | `userId, scope(lifeAreaId|'global'), days, multiplier` |
| `streak.frozen` | Streak Freeze aplicado | `userId, scope, source('item'|'auto-forgive')` |
| `streak.broken` | Streak zerou | `userId, scope, previousDays, recordKept` |
| `streak.repaired` | Streak recuperado em 24h | `userId, scope, restoredDays` |
| `rest.mode.toggled` | Modo Descanso ligado/desligado | `userId, enabled, until` |
| `mission.assigned` | Missão atribuída | `userId, missionId, type, source('heuristic'|'coach')` |
| `mission.completed` | Missão concluída | `userId, missionId, xpReward, sparksReward` |
| `challenge.joined` | Entrou em desafio | `userId, challengeId, paid` |
| `challenge.completed` | Desafio concluído | `userId, challengeId, rewards{}` |
| `achievement.unlocked` | Conquista desbloqueada | `userId, achievementId, category, rarity` |
| `badge.equipped` | Badge exibido no perfil | `userId, badgeId` |
| `season.started` | Temporada iniciou | `seasonId, theme, startsAt, endsAt` |
| `season.ended` | Temporada encerrou (reset) | `seasonId, leaderboardSnapshotId` |
| `season.progress` | Pontos de Temporada ganhos | `userId, seasonId, points, passTier` |
| `league.promoted` | Subiu de divisão | `userId, fromLeague, toLeague, weekId` |
| `league.demoted` | Desceu de divisão | `userId, fromLeague, toLeague, weekId` |
| `league.week.reset` | Reset semanal da liga | `weekId, snapshotId` |
| `guild.goal.reached` | Meta coletiva da guilda batida | `guildId, goalId, rewards{}` |
| `sparks.earned` | Faíscas ganhas | `userId, amount, source` |
| `sparks.spent` | Faíscas gastas | `userId, amount, cosmeticItemId` |
| `cosmetic.acquired` | Cosmético obtido | `userId, cosmeticItemId, via('sparks'|'reward'|'purchase')` |
| `antifraud.flagged` | Sinal de auto-report falso | `userId, actionLogId, signal, severity` |

> Regra de ouro de eventos: **toda concessão de XP nasce de `xp.granted`; todo nível nasce de `level.up`/`rise.level.up`.** O Coach lê esse fluxo (via `StatSnapshot` + embeddings pgvector) para gerar Insights. Cosméticos (`sparks.*`, `cosmetic.*`) vivem num namespace **isolado** do XP — a separação anti pay-to-win é estrutural.

---

## 13. Síntese — princípios de decisão

1. **XP nasce de ação real, é auditável e idempotente; nível é derivado, nunca a verdade primária.**
2. **Curva quadrática única** (`50n²+50n`) por área; Nível Rise agrega com bônus de amplitude; Prestígio é horizonte cosmético.
3. **Skill Trees dão profundidade e identidade, jamais poder contra outros.**
4. **Streaks perdoam** (freeze, perdão, repair, Modo Descanso) e **saturam** — compromisso, não vício.
5. **Ligas competem por esforço da semana**, normalizadas e reset semanais; rankings são opt-out.
6. **Faíscas são só cosmético**, separadas estruturalmente do XP — pay-to-win é impossível por design, não só por regra.
7. **Anti-abuso protege a economia, não pune o honesto;** tetos diários, validação, integrações e detecção de padrão.
8. **Equilíbrio emocional é requisito**, com o Coach como guardião do bem-estar.
9. **Tudo emite eventos canônicos** — a gamificação é uma API interna reutilizável por banco, IA e feed.

Toda ação conta. Toda evolução aparece. E ninguém compra o caminho.
