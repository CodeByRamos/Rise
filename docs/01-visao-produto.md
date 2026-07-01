# 01 — Visão de Produto

> **Documento canônico.** Esta é a fonte da verdade sobre o que o Rise é. Todos os outros
> documentos (técnicos, de design, de produto) devem ser coerentes com esta visão. Em caso
> de conflito, este documento e o `docs/00-canon.md` prevalecem.

---

## 1. TL;DR

**Rise é o videogame da sua vida real.**

Um app onde toda ação positiva que você faz no mundo real — estudar, treinar, dormir bem,
ler, programar, meditar, cuidar das finanças — vira progresso visível dentro de um sistema
de RPG: você ganha **XP**, sobe de **nível**, evolui **árvores de habilidade**, mantém
**streaks**, desbloqueia **conquistas**, avança em **temporadas** e é guiado por um **Coach
de IA** que conhece a sua rotina melhor do que qualquer agenda.

Não é uma lista de tarefas com pontinhos. É um jogo AAA construído sobre a sua própria vida.

---

## 2. Por que o Rise existe

A maioria das pessoas quer evoluir — em saúde, conhecimento, carreira, relacionamentos — mas
o esforço real acontece no escuro. Você treina por seis meses e o app de hábito te mostra…
uma grade de quadradinhos verdes. Você estuda todos os dias e não há nenhuma sensação de
**ascensão**. O progresso real da vida é lento, invisível e emocionalmente pouco recompensador
no curto prazo. É por isso que as pessoas desistem.

Os videogames resolveram esse problema décadas atrás. Um jogador grinda 200 horas em um RPG
sem reclamar, porque cada ação tem **feedback imediato, progresso visível e uma narrativa de
crescimento**. O loop de "esforço → recompensa → novo objetivo" é viciante no melhor sentido.

**A tese do Rise:** se aplicarmos a engenharia de engajamento dos melhores jogos à vida real —
de forma honesta, sem manipulação e sem pay-to-win — podemos fazer milhões de pessoas
quererem voltar todos os dias para evoluir de verdade.

O Rise existe para fechar o **gap emocional** entre o esforço real e a recompensa percebida.

---

## 3. North Star

### North Star Metric (NSM)
**Dias de evolução por usuário ativo** — número de dias em que o usuário registra pelo menos
uma ação real que gera XP em alguma área da vida.

Escolhemos esta métrica porque ela só sobe quando o produto cumpre sua missão: a pessoa
**voltou** (engajamento) **e** fez algo bom pela própria vida (valor real). É inflável sem
ser vazia — não é "tempo de tela", é "tempo de tela que correspondeu a vida vivida".

### North Star Statement
> "Toda semana, mais pessoas estão evoluindo de forma consistente em mais áreas da vida —
> e sentem isso acontecendo."

### Métricas de apoio (guard rails)
- **Retenção D1 / D7 / D30** — o coração de um produto de hábito.
- **Streak médio ativo** — consistência real.
- **Nº de áreas da vida ativas por usuário** — amplitude da evolução.
- **% de ações que vêm de intenção própria vs. nudge da IA** — autonomia saudável.
- **Razão "tempo no app / tempo evoluindo na vida"** — guard rail anti-vício: queremos que o
  app seja um trampolim, não uma armadilha de tela.

---

## 4. A experiência central (o "core loop")

O Rise é construído em torno de um loop diário simples e profundamente recompensador:

```
   VIVER A VIDA  →  REGISTRAR / CONFIRMAR  →  GANHAR XP & PROGRESSO  →
   VER A EVOLUÇÃO  →  COACH DE IA ORIENTA  →  PRÓXIMO OBJETIVO  →  (volta ao início)
```

1. **Viver.** O usuário faz algo real: 45 min de academia, 2h de código, 8h de sono.
2. **Registrar.** Marca a ação no app (manual, rápido; futuramente integrações e automações).
   A fricção de registro é inimiga número um — tem que ser instantâneo e satisfatório.
3. **Ganhar progresso.** A ação dispara XP na **área da vida** correspondente, alimenta
   **streaks**, avança **missões** e **temporadas**, pode desbloquear **conquistas**.
4. **Sentir a evolução.** Microinterações, animações de level-up, barras que enchem, a
   **árvore de habilidade** daquela área crescendo. O feedback é imediato e premium.
5. **Ser orientado.** O **Coach de IA** observa padrões ("você dorme mal nas semanas que treina
   à noite"), celebra marcos, sugere o próximo passo e remonta a rotina.
6. **Novo objetivo.** Uma nova missão, um próximo nível, um desafio de temporada. O loop reinicia.

**Na Fase 2**, o loop ganha uma camada social: o progresso vira conteúdo inspirador no feed,
guildas criam responsabilidade coletiva e desafios criam eventos. Mas o loop solo precisa ser
impecável **antes** — ver Sequenciamento de Produto.

---

## 5. Os pilares do produto

1. **Progressão como linguagem.** Tudo no app comunica avanço. Nada é estático. Cada tela
   responde "você está evoluindo, e aqui está a prova".
2. **Áreas da vida com vida própria.** Estudos, Academia, Sono, Finanças, Leitura, etc. — cada
   uma é como uma "classe" de RPG, com nível, XP e árvore de habilidade independentes. O usuário
   pode criar novas áreas.
3. **Coach de IA, não chatbot.** A IA é um mentor que analisa, prevê, reorganiza e incentiva.
   Ela tem memória da sua jornada (RAG sobre suas próprias estatísticas).
4. **Estética AAA.** Premium, futurista, minimalista, fluido. Referências: Linear, Arc,
   Superhuman, Apple, Stripe, Duolingo. Nunca "planilha gamificada".
5. **Comunidade que inspira.** A rede social é 100% baseada em progresso. Sem selfies, sem
   política, sem ruído. Você segue a evolução das pessoas, não a vida performática delas.
6. **Honestidade by design.** Engajamento alto **sem** dark patterns. Sem pay-to-win. Sem loot
   box manipulativa. O sucesso do negócio está alinhado com o sucesso de vida do usuário.

---

## 6. O que o Rise **NÃO** é

Definir as fronteiras é tão importante quanto definir o produto:

- **Não é um to-do app / gerenciador de tarefas.** Tarefas existem, mas como meio para
  progressão, não como fim. Não competimos com Todoist no "gerenciar caixa de entrada de tarefas".
- **Não é uma planilha ou dashboard de produtividade.** Estatísticas existem, mas embrulhadas
  em uma experiência de jogo, não em tabelas frias.
- **Não é uma rede social de lifestyle.** Nada de selfies, fotos de viagem, opinião política,
  flame wars. O único conteúdo é evolução real.
- **Não é um app pay-to-win.** Dinheiro nunca compra XP, nível, ranking ou vantagem competitiva.
  Premium compra **profundidade de IA, conveniência e cosméticos** — nunca poder.
- **Não é um cassino de dopamina.** Não usamos recompensas variáveis manipulativas, FOMO
  artificial ou mecânicas de loot box predatórias. Engajamento vem de progresso real.
- **Não é um chatbot genérico com skin de jogo.** O Coach é especializado, contextual e com
  memória — não um wrapper de LLM.
- **Não é só web.** Mobile nativo (Expo/React Native) faz parte da arquitetura desde o início;
  o PWA é ponte, não destino. Push nativo e presença na home screen são essenciais.

---

## 7. Visão de longo prazo

No horizonte de 3–5 anos, o Rise quer ser a **camada de progressão da vida de uma pessoa** — o
lugar onde todas as suas áreas de evolução convergem, são medidas, celebradas e otimizadas por
IA, dentro de uma comunidade que puxa todo mundo para cima.

Quando alguém perguntar "como você conseguiu mudar tanto esse ano?", a resposta será: **"comecei
a jogar a minha própria vida no Rise."**

---

## 8. Princípios de decisão

Quando houver dúvida sobre uma feature, perguntar nesta ordem:

1. **Isso faz a pessoa evoluir de verdade na vida real?** (se não, cortar)
2. **Isso comunica progresso de forma satisfatória?** (se não, redesenhar)
3. **Isso é honesto — sem manipulação, sem pay-to-win?** (se não, vetar)
4. **Isso é premium e fluido o suficiente para um produto AAA?** (se não, polir)
5. **Isso escala para milhões e é manutenível?** (se não, repensar a arquitetura)
