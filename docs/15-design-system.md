# Design System do Rise

> Documento canônico. Escopo: a especificação completa e acionável do Design System do Rise — princípios, design tokens, tipografia, espaçamento, motion, biblioteca de componentes, feedback, acessibilidade e estratégia de compartilhamento web (Tailwind) ↔ mobile (NativeWind). Fonte da verdade para `packages/ui` e `packages/ui/tokens`. Não contradiz o canon (`docs/00-canon.md`); em conflito, o canon prevalece.

> **Atualização — identidade visual oficial (Brand Identity 2026).** A marca oficial foi definida e está registrada em `docs/00-canon.md` §8. Ela **supera** quaisquer valores placeholder deste documento: a paleta oficial é Void `#0A0B0D` · Graphite `#1A1D22` · Ash `#3A3F47` · Snow `#F4F5F7` · Ascent Emerald `#10B981`; as fontes são **Sora** (wordmark/display) e **Manrope** (interface) — não Geist. Os tokens implementados em `apps/web/app/globals.css` são a referência viva.

O Rise precisa **parecer um jogo AAA, não uma planilha**. O Design System é o que transforma essa promessa em código reutilizável: um conjunto único de tokens e componentes que entrega a mesma sensação premium na web (Next.js + Tailwind + shadcn/ui + Motion) e no mobile (Expo + NativeWind), sem divergência visual nem reescrita. A estética é destilada de seis referências — a **precisão calma** de Linear e Stripe, a **profundidade futurista** de Arc, o **polimento físico** de Apple/Superhuman e a **alegria controlada** de Duolingo para os momentos de celebração. A regra que costura tudo: cada pixel comunica **progresso**, e nada nunca trai os guardrails (sem dark pattern, sem pay-to-win — nem na UI).

---

## TL;DR

- **Dark mode é o padrão** (canvas profundo, near-black azulado), light mode é first-class. Tokens são semânticos, nunca cores cruas no componente.
- **14 Áreas da Vida têm cor canônica própria** (`--area-*`), que tinge anel de progresso, Skill Tree, badges e barra de XP daquela área. Cor = identidade da "classe de RPG".
- **Tokens vivem em `packages/ui/tokens`** como fonte única (JSON), gerados para CSS vars (web) e objeto JS (NativeWind). Mesma chave nos dois ambientes.
- **Tipografia:** Geist Sans (UI) + Geist Mono (números/stats). Escala modular type-scale 1.2/1.25. Números de XP/nível sempre em tabular-nums.
- **Grid 4px**, raios suaves, sombras discretas + **elevação por luz** (glow contido só em estados de progresso/level-up, nunca decorativo).
- **Motion com orçamento:** durações 120–520ms, easings nomeados, sempre `transform`/`opacity` (GPU). Celebrações (level-up, streak, conquista) são performáticas, contidas e respeitam `prefers-reduced-motion`.
- **Componentes Rise canônicos:** `AnelDeProgresso`, `BarraDeXP`, `CardDeConquista`, `BadgeInsignia`, `SkillTree`/`SkillNode`, `StreakFlame`, `FeedItem`, `MissaoCard`, `CoachBubble`, `LevelUpOverlay`, `AreaIcon`, `LigaTier` — todos sobre primitivos shadcn/ui.
- **Acessibilidade não é opcional:** contraste AA mínimo, foco visível, leitores de tela, e toda celebração tem fallback `motion-reduce`.

---

## 1. Princípios de design (não negociáveis)

| # | Princípio | Implicação prática |
|---|-----------|--------------------|
| 1 | **Progresso é a estética** | Todo componente de destaque visualiza evolução (anel, barra, tier). Espaço em branco serve para o progresso respirar, não para enfeite. |
| 2 | **Calmo por padrão, eufórico nos marcos** | A UI cotidiana é silenciosa e precisa (Linear/Stripe). A energia (glow, confete, haptic) é **gastada com avareza** só em level-up, streak e conquista. Euforia barata vira ruído. |
| 3 | **Tokens, nunca cores cruas** | Componentes consomem tokens semânticos (`--surface-1`, `--area-academia`). Trocar tema/área não toca o componente. |
| 4 | **Uma fonte, dois renderers** | O mesmo token alimenta Tailwind e NativeWind. Divergência web/mobile é bug, não decisão. |
| 5 | **Performance é UX** | 60fps inegociável. Só animar `transform`/`opacity`. Celebração com partículas tem teto e cleanup. Bundle de motion é tree-shakeable. |
| 6 | **Acessível ou não envia** | AA de contraste, foco visível, navegação por teclado, SR labels e `motion-reduce` são critério de Definition of Done de componente. |
| 7 | **Honestidade visual** | Nada de UI manipulativa: sem timers de pressão falsos, sem "compre para vencer", sem badge cosmético disfarçado de vantagem. O guardrail do produto vale para o pixel. |

---

## 2. Design Tokens — arquitetura

### 2.1 Fonte única da verdade

Tokens vivem em `C:/Users/Ramos/Documents/Rise/packages/ui/tokens/` como JSON tipado (W3C-ish Design Tokens), em **três camadas**:

1. **Primitivos** (`tokens/primitives.json`) — a paleta crua, sem semântica. Ex.: `blue.500`, `slate.950`. Nunca usados direto em componente.
2. **Semânticos** (`tokens/semantic.json`) — mapeiam primitivos a papéis e **a tema** (dark/light). Ex.: `surface.1`, `text.primary`, `border.subtle`, `accent.default`. Esta é a camada que os componentes consomem.
3. **De Área da Vida** (`tokens/areas.json`) — a cor canônica de cada uma das 14 Áreas + áreas custom (fallback determinístico por hash do id).

Um script de build (`packages/ui/tokens/build.ts`, via Style Dictionary ou gerador próprio) emite:
- `tokens.css` — `:root` (light) + `[data-theme="dark"]` com CSS custom properties (web/Tailwind).
- `tokens.native.ts` — objeto JS para o preset NativeWind/Tailwind do mobile.
- `tailwind.tokens.ts` — extensão do `theme` consumida por ambos os apps.

> **Decisão (registrar em ADR `docs/adr/`):** tokens como JSON gerado, não como classes hard-coded em cada app. Custo: um passo de build a mais. Ganho: web e mobile **nunca divergem**, e rebrand/temazação é trocar JSON. Alternativa rejeitada (Tailwind config duplicado por app) garante drift em escala.

### 2.2 Paleta — dark mode como padrão

O Rise nasce dark: canvas near-black com leve viés azul-frio (futurista, descansado para uso diário e noturno). Light mode é completo e mantém os mesmos papéis.

**Neutros (estrutura) — dark default:**

| Token semântico | Papel | Dark (hex) | Light (hex) |
|---|---|---|---|
| `--bg-canvas` | Fundo da app | `#0A0B0F` | `#FBFBFD` |
| `--surface-1` | Cards, painéis | `#111319` | `#FFFFFF` |
| `--surface-2` | Cards elevados, popovers | `#181B23` | `#F4F5F8` |
| `--surface-3` | Hover/inset, inputs | `#20242E` | `#ECEEF3` |
| `--border-subtle` | Divisórias suaves | `#22262F` | `#E6E8EE` |
| `--border-strong` | Bordas de foco/contorno | `#363B47` | `#CDD1DB` |
| `--text-primary` | Texto principal | `#F4F6FB` | `#0B0D12` |
| `--text-secondary` | Texto de apoio | `#A9B0BE` | `#4A515E` |
| `--text-muted` | Legendas, placeholders | `#6B7280` | `#828A98` |

**Marca e semânticos de estado:**

| Token | Papel | Dark | Light |
|---|---|---|---|
| `--accent` | Ação primária / marca Rise | `#6D7BFF` (indigo-violeta) | `#4E5BE6` |
| `--accent-hover` | Hover do primário | `#8189FF` | `#3D49D6` |
| `--accent-glow` | Halo de progresso (uso contido) | `rgba(109,123,255,.45)` | `rgba(78,91,230,.30)` |
| `--success` | XP ganho, meta concluída | `#34D399` | `#0E9F6E` |
| `--warning` | Streak em risco (calmo, não alarmista) | `#FBBF24` | `#D97706` |
| `--danger` | Erro/destruição | `#F87171` | `#DC2626` |
| `--xp` | Cor da energia/XP | `#7DD3FC` | `#0284C7` |
| `--streak` | Chama de Streak | `#FB923C` | `#EA580C` |
| `--premium` | Selo Premium / Faíscas | `#C4B5FD` → gradiente | `#7C3AED` |

> **Regra de glow:** `--accent-glow` e gradientes só aparecem em **superfícies de progresso** (anel, barra de XP cheia, level-up, hover de CTA primário). Glow decorativo em card comum é proibido — diferencia momento de marco de ruído visual.

### 2.3 Cores por Área da Vida (a identidade de "classe")

Cada Área da Vida tem cor canônica que percorre todo o app: anel, ícone, Skill Tree, badge, barra de XP, item de feed daquela área. São escolhidas para **distinção a relance**, contraste AA sobre `--surface-1`, e harmonia entre si.

| Área da Vida | Token | Hex (base) | Mnemônico |
|---|---|---|---|
| Estudos | `--area-estudos` | `#6366F1` | índigo foco |
| Programação | `--area-programacao` | `#22D3EE` | ciano terminal |
| Academia | `--area-academia` | `#F97316` | laranja força |
| Saúde | `--area-saude` | `#10B981` | verde vital |
| Sono | `--area-sono` | `#818CF8` | lavanda noturno |
| Alimentação | `--area-alimentacao` | `#84CC16` | verde-lima |
| Leitura | `--area-leitura` | `#F59E0B` | âmbar papel |
| Finanças | `--area-financas` | `#14B8A6` | teal capital |
| Idiomas | `--area-idiomas` | `#EC4899` | magenta fala |
| Música | `--area-musica` | `#A855F7` | roxo som |
| Surf | `--area-surf` | `#0EA5E9` | azul-mar |
| Skate | `--area-skate` | `#EF4444` | vermelho asfalto |
| Espiritualidade | `--area-espiritualidade` | `#D6B4FC` | violeta sereno |
| Relacionamentos | `--area-relacionamentos` | `#FB7185` | coral |
| Trabalho | `--area-trabalho` | `#64748B` | ardósia |

**Áreas custom (ex.: Diego cria "Música" própria ou "Jiu-jitsu"):** a cor é escolhida pelo usuário num **picker restrito** a uma paleta validada por contraste (12 matizes), ou atribuída por fallback determinístico `cor = paleta[hash(areaId) % 12]`. Nunca cor livre — preserva harmonia e acessibilidade.

Cada `--area-*` expande em uma rampa derivada em build: `--area-X-bg` (12% alpha para fundos suaves), `--area-X-border`, `--area-X-glow`. O componente pede `area="academia"` e recebe a rampa inteira.

### 2.4 Gradientes (contidos)

Gradientes existem só para **energia de progresso** e selo Premium. Catálogo fechado:

- `--grad-xp`: `linear-gradient(90deg, var(--xp), var(--accent))` — barra de XP em preenchimento.
- `--grad-levelup`: `radial-gradient(var(--accent-glow), transparent 70%)` — halo de level-up.
- `--grad-premium`: `linear-gradient(135deg, #C4B5FD, #7DD3FC, #FB923C)` — selo Premium/Faíscas, usado com parcimônia.
- `--grad-area`: gerado por área para o anel cheio (`from var(--area-X)` → `var(--area-X)` mais claro 12%).

---

## 3. Tipografia

| Aspecto | Decisão | Por quê |
|---|---|---|
| Fonte UI | **Geist Sans** (fallback `Inter`, depois system-ui) | Geométrica, neutra, premium — alinhada a Linear/Vercel. Carrega via `next/font` (web) e `expo-font` (mobile). |
| Fonte numérica | **Geist Mono** (tabular) | Stats, XP, níveis, contagens não devem "pular" — `font-variant-numeric: tabular-nums`. |
| Display (opcional) | Geist Sans peso 600/700, tracking apertado | Títulos de marco/level-up. Sem fonte display exótica — consistência > novidade. |

**Escala modular** (base 16px, razão 1.2 mobile / 1.25 web):

| Token | rem | px (web) | Uso |
|---|---|---|---|
| `--text-xs` | 0.75 | 12 | legendas, metadados |
| `--text-sm` | 0.875 | 14 | corpo secundário, labels |
| `--text-base` | 1.0 | 16 | corpo padrão |
| `--text-lg` | 1.125 | 18 | subtítulos |
| `--text-xl` | 1.375 | 22 | títulos de seção |
| `--text-2xl` | 1.75 | 28 | título de tela |
| `--text-3xl` | 2.25 | 36 | número de nível, hero |
| `--text-4xl` | 3.0 | 48 | level-up overlay |

Pesos: 400 (corpo), 500 (ênfase/labels), 600 (títulos), 700 (números de marco). Line-height: 1.5 corpo, 1.2 títulos, 1.0 números grandes. Tracking: -0.01em em títulos ≥`--text-xl`.

---

## 4. Espaçamento, grid, raios, elevação

### 4.1 Escala de espaço (base 4px)

`--space-0:0` · `--space-1:4` · `--space-2:8` · `--space-3:12` · `--space-4:16` · `--space-5:20` · `--space-6:24` · `--space-8:32` · `--space-10:40` · `--space-12:48` · `--space-16:64` · `--space-20:80` (px). Componentes só usam tokens de espaço — nunca valores soltos.

### 4.2 Grid e layout

- **Web:** container máx. 1200px, grid 12 colunas, gutter `--space-6`. Conteúdo de leitura limitado a ~72ch.
- **Mobile:** padding lateral `--space-4`, listas com gutter `--space-3`.
- Densidade calma estilo Linear: respiro generoso entre seções (`--space-12`+).

### 4.3 Raios

| Token | px | Uso |
|---|---|---|
| `--radius-sm` | 6 | inputs, tags |
| `--radius-md` | 10 | botões, badges |
| `--radius-lg` | 14 | cards |
| `--radius-xl` | 20 | painéis, sheets |
| `--radius-2xl` | 28 | overlays de marco |
| `--radius-full` | 9999 | anel, avatar, pílulas |

### 4.4 Elevação (sombra discreta + luz)

Dark mode usa **menos sombra e mais separação por superfície/borda** (sombra preta some no fundo escuro); o glow substitui sombra em estados de progresso.

| Token | Definição (dark) | Uso |
|---|---|---|
| `--elev-0` | nenhuma | inline |
| `--elev-1` | `0 1px 2px rgba(0,0,0,.4)` + `--surface-1` | cards |
| `--elev-2` | `0 4px 16px rgba(0,0,0,.45)` + `--surface-2` | popovers, dropdowns |
| `--elev-3` | `0 12px 40px rgba(0,0,0,.55)` | modais, sheets |
| `--elev-glow` | `0 0 24px var(--accent-glow)` | level-up, CTA focado, anel cheio |

---

## 5. Iconografia

- **Base:** Lucide (linha, 1.5–2px stroke, grid 24px) — casa com Geist e funciona em RN (`lucide-react` / `lucide-react-native`).
- **Ícones de Área da Vida:** set custom em `packages/ui` (`AreaIcon`), um glyph por área, herdando `--area-*`. Ex.: Programação `</>`, Academia halter, Surf onda, Sono lua.
- **Ícones de sistema de jogo:** XP (raio), Streak (chama), Conquista (medalha/estrela), Faíscas (centelha), Missão (alvo), Liga (escudo) — set proprietário, estilo consistente.
- Regra: stroke ≥1.5px, alvo de toque ≥44px (mobile), label SR sempre presente.

---

## 6. Motion — princípios e orçamento

> Motion é onde "AAA na sensação" acontece. Mas é também onde performance morre. Regra-mestre: **animar só `transform` e `opacity`** (compositor GPU), nunca `width`/`top`/`box-shadow` em loop. Toda animação tem cleanup e teto de partículas.

### 6.1 Durações e easings (tokens)

| Token | Valor | Uso |
|---|---|---|
| `--dur-instant` | 80ms | feedback de toque, ripple |
| `--dur-fast` | 140ms | hover, foco, troca de estado |
| `--dur-base` | 220ms | entrada de card, transição de aba |
| `--dur-slow` | 360ms | sheets, overlays |
| `--dur-celebrate` | 520ms | level-up, conquista (pico de euforia) |

| Easing | Curva | Uso |
|---|---|---|
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | maioria das transições (Linear-like) |
| `--ease-out` | `cubic-bezier(0,0,.2,1)` | entradas |
| `--ease-spring` | spring `stiffness:380, damping:30` (Motion) | level-up, anel preenchendo, "pop" |
| `--ease-emphasis` | `cubic-bezier(.34,1.56,.64,1)` | overshoot lúdico (Duolingo-like), só em celebração |

### 6.2 Microinterações cotidianas

- **Hover/press:** escala 0.98 no press, 1.0 ao soltar (`--dur-instant`, `--ease-standard`).
- **Ganho de XP:** número "+XP" sobe e dissolve (`translateY(-12px)` + fade, `--dur-base`); barra de XP preenche com `--ease-spring`.
- **Conclusão de Missão:** checkbox "pop" com overshoot leve + tick desenhando.
- **Troca de aba/rota:** crossfade + slide 8px, `--dur-base`.

### 6.3 Celebrações (contidas e performáticas)

| Evento | Animação | Custo controlado |
|---|---|---|
| **Level-up** (`level.up`) | `LevelUpOverlay`: número escala com `--ease-emphasis`, halo `--elev-glow` pulsa 1×, ~24 partículas leves | partículas via canvas/transform, teto fixo, cleanup ≤700ms, dismiss imediato |
| **Streak estendido** (`streak.extended`) | `StreakFlame` cresce com spring, contador rola, micro-shake ≤4px | nenhuma partícula em uso diário; brilho extra só em marcos (7/30/100) |
| **Conquista** (`achievement.unlocked`) | `CardDeConquista` entra com flip 3D leve + glow da raridade | uma vez, dispensável |
| **Confete** | reservado a marcos raros (Temporada concluída, nível redondo) | ≤80 partículas, 1.2s, off por `prefers-reduced-motion` |

**Princípio anti-fadiga:** celebração escala com a **raridade do evento**. XP diário = microfeedback silencioso. Level-up = momento. Conquista épica = pico. Nunca confete por abrir o app.

### 6.4 Stack de motion

- **Web:** Motion (Framer Motion) com `LazyMotion`/`domAnimation` (bundle mínimo). `useReducedMotion` em todo componente animado.
- **Mobile:** `react-native-reanimated` (UI thread, 60fps) + `react-native-gesture-handler`. Mesmos tokens de duração/easing importados de `packages/ui/tokens`.

---

## 7. Biblioteca de componentes

Camadas: **(a) primitivos shadcn/ui** (Button, Card, Dialog, Sheet, Tabs, Tooltip, Toast, Popover, Avatar, Progress, Skeleton) — instalados em `packages/ui`, retematizados pelos tokens; **(b) componentes Rise** — a linguagem do "videogame da vida real", construídos sobre os primitivos. Nomes canônicos abaixo (PT-BR na UI, mas export em código mantém clareza):

| Componente Rise | Props-chave | Função | Tokens/áreas |
|---|---|---|---|
| `AnelDeProgresso` | `value`, `max`, `area`, `size`, `showLabel` | Anel circular de progresso de nível de Área ou Nível Rise | `--area-*`, `--grad-area`, glow no completar |
| `BarraDeXP` | `current`, `next`, `area`, `animated` | Barra linear de XP até o próximo nível | `--grad-xp`, spring fill |
| `AreaIcon` | `area`, `size`, `state` | Ícone canônico da Área da Vida | `--area-*` |
| `AreaCard` | `area`, `level`, `xp`, `streak` | Card-resumo de uma Área da Vida | rampa de área |
| `LevelBadge` | `level`, `area?`, `prestige?` | Selo numérico de nível (Área ou Rise) | tabular-nums |
| `CardDeConquista` | `achievement`, `rarity`, `unlockedAt` | Card de Conquista com glow por raridade | raridade → cor |
| `BadgeInsignia` | `badge`, `size`, `earned` | Insígnia exibível (grade no perfil) | — |
| `StreakFlame` | `count`, `atRisk`, `frozen` | Chama de Streak com estados (ativa/risco/freeze) | `--streak`, `--warning` |
| `MissaoCard` | `mission`, `progress`, `reward`, `source` | Card de Missão (diária/semanal/Coach) | `--success` ao concluir |
| `SkillTree` | `area`, `nodes`, `onUnlock` | Árvore de Habilidade da Área (canvas/SVG pan-zoom) | `--area-*` |
| `SkillNode` | `node`, `state`(locked/available/unlocked) | Nó da Skill Tree | estados visuais distintos |
| `CoachBubble` | `message`, `tone`, `actions` | Mensagem do Coach de IA (nunca "chatbot") | `--accent`, avatar mentor |
| `InsightCard` | `insight`, `area?`, `cta` | Recomendação/insight do Coach | — |
| `FeedItem` | `milestone`, `author`, `reactions` | Item do Feed (só progresso: marco/recorde/streak) | herda cor da área do marco |
| `MilestoneCard` | `type`, `area`, `value` | Marco publicável (recorde, nível, streak) | — |
| `LigaTier` | `division`, `rank`, `delta` | Posição/divisão na Liga da Temporada | escudo por divisão |
| `SeasonBanner` | `season`, `daysLeft`, `rewards` | Faixa de Temporada ativa | `--grad-premium` discreto |
| `SparksWalletChip` | `balance` | Saldo de Faíscas (cosmético) | `--premium` |
| `LevelUpOverlay` | `from`, `to`, `area?` | Overlay de celebração de level-up | `--ease-emphasis`, glow |
| `StatTile` | `label`, `value`, `trend` | Bloco de estatística pessoal | Geist Mono tabular |
| `EmptyState` | `illustration`, `title`, `cta` | Vazios encorajadores (anti-cold-start) | tom mentor |
| `Paywall`/`PremiumGate` | `feature` | Gate honesto de Premium (profundidade, nunca poder) | sem dark pattern |

**Convenções:** todo componente é controlled-first, com variantes via CVA (`class-variance-authority`), `forwardRef`, e exporta tipos. Stories no Storybook (web). Versão RN mora ao lado (`*.native.tsx`) compartilhando lógica e tokens — divergência apenas de primitivo de render.

---

## 8. Padrões de feedback

| Canal | Quando | Como |
|---|---|---|
| **Toast** (shadcn/sonner) | confirmação leve (ação registrada, missão concluída) | curto, com ícone de área, auto-dismiss ~3s, ação "desfazer" quando aplicável |
| **Inline** | validação de form, estado de campo | mensagem sob o campo, `--danger`/`--success`, nunca só cor (texto+ícone) |
| **Overlay/Modal** | level-up, conquista épica | `LevelUpOverlay`, dispensável, sem trap de foco indefinido |
| **Confete contido** | marco raro | ≤80 partículas, 1×, off em `motion-reduce` |
| **Haptics (mobile)** | toque, XP, level-up, erro | `expo-haptics`: `selection` (toque), `success` (XP/missão), `notification(.success)` (level-up), `notification(.error)` (falha). Nunca em loop/spam. |
| **Push** | engajamento (streak em risco, missão do dia) | calibrado, sem FOMO/culpa — copy de mentor, opt-out fácil |

Princípio: **feedback proporcional**. Microação → microfeedback. Marco → celebração. Erro → claro e gentil, nunca alarmista.

---

## 9. Acessibilidade (Definition of Done de componente)

- **Contraste:** texto normal ≥ 4.5:1, texto grande/ícones ≥ 3:1 (WCAG AA). Cores de Área validadas em build contra `--surface-1` nos dois temas; falha quebra o build.
- **Cor nunca sozinha:** estado (sucesso/risco/erro, área) sempre acompanhado de ícone/label/forma. Daltonismo-safe.
- **Foco visível:** anel de foco `--border-strong` 2px + offset, nunca `outline:none` sem substituto. Ordem de tabulação lógica.
- **Teclado:** toda ação acessível por teclado; Skill Tree e Feed navegáveis por seta/tab; Esc fecha overlays.
- **Leitores de tela:** `aria-label`/`role` em ícones e anéis; `AnelDeProgresso` expõe `role="progressbar"` com `aria-val-now/min/max`; level-up anuncia via `aria-live="polite"`.
- **`prefers-reduced-motion`:** toda celebração tem fallback estático (fade simples, sem partículas/shake/parallax). `useReducedMotion` (web) e `AccessibilityInfo.isReduceMotionEnabled` (RN).
- **Toque:** alvos ≥44×44px no mobile.
- **i18n-safe:** componentes não assumem largura de texto fixa; pt-BR e en (canon) sem truncar; números via `Intl`.

---

## 10. Compartilhamento web (Tailwind) ↔ mobile (NativeWind)

1. `packages/ui/tokens` gera **um** `tailwind.tokens.ts` (cores semânticas, áreas, espaço, raios, durações).
2. `apps/web/tailwind.config.ts` e `apps/mobile/tailwind.config.ts` ambos importam esse preset → mesmas classes (`bg-surface-1`, `text-area-academia`, `rounded-lg`).
3. Componentes Rise vivem em `packages/ui` com par `Componente.tsx` (web) + `Componente.native.tsx` (RN) compartilhando tipos, lógica e tokens; só o primitivo de render difere.
4. Tokens não-cor que NativeWind não cobre (durações/easings de motion) são importados como JS de `tokens.native.ts` por Reanimated.
5. Dark/light: web via `[data-theme]` + `class`; mobile via provider de tema lendo o mesmo JSON. **Mesmas chaves, mesmos valores.**

---

## 11. Exemplos de tokens

### 11.1 CSS custom properties (web — `tokens.css`)

```css
:root {
  /* light default-fallback; dark é o tema padrão da app */
  --bg-canvas: #FBFBFD;
  --surface-1: #FFFFFF;
  --surface-2: #F4F5F8;
  --text-primary: #0B0D12;
  --text-secondary: #4A515E;
  --accent: #4E5BE6;
  --success: #0E9F6E;
  --xp: #0284C7;
  --streak: #EA580C;
  --radius-lg: 14px;
  --dur-base: 220ms;
  --ease-standard: cubic-bezier(.2, 0, 0, 1);
}

[data-theme="dark"] {
  --bg-canvas: #0A0B0F;
  --surface-1: #111319;
  --surface-2: #181B23;
  --text-primary: #F4F6FB;
  --text-secondary: #A9B0BE;
  --accent: #6D7BFF;
  --accent-glow: rgba(109, 123, 255, .45);
  --success: #34D399;
  --xp: #7DD3FC;
  --streak: #FB923C;

  /* Áreas da Vida */
  --area-estudos: #6366F1;
  --area-programacao: #22D3EE;
  --area-academia: #F97316;
  --area-saude: #10B981;
  --area-sono: #818CF8;
  --area-leitura: #F59E0B;
  --area-financas: #14B8A6;
  --area-idiomas: #EC4899;
  --area-musica: #A855F7;

  /* Elevação / motion */
  --elev-glow: 0 0 24px var(--accent-glow);
  --grad-xp: linear-gradient(90deg, var(--xp), var(--accent));
}
```

### 11.2 JSON de tokens (`tokens/semantic.json`, fonte de build)

```json
{
  "color": {
    "surface": {
      "1": { "dark": "#111319", "light": "#FFFFFF" },
      "2": { "dark": "#181B23", "light": "#F4F5F8" }
    },
    "text": {
      "primary": { "dark": "#F4F6FB", "light": "#0B0D12" },
      "secondary": { "dark": "#A9B0BE", "light": "#4A515E" }
    },
    "accent": { "dark": "#6D7BFF", "light": "#4E5BE6" },
    "xp": { "dark": "#7DD3FC", "light": "#0284C7" },
    "area": {
      "academia": "#F97316",
      "programacao": "#22D3EE",
      "estudos": "#6366F1",
      "saude": "#10B981"
    }
  },
  "radius": { "md": "10px", "lg": "14px", "full": "9999px" },
  "duration": { "fast": "140ms", "base": "220ms", "celebrate": "520ms" },
  "easing": {
    "standard": "cubic-bezier(.2,0,0,1)",
    "emphasis": "cubic-bezier(.34,1.56,.64,1)"
  }
}
```

### 11.3 NativeWind (`tokens.native.ts`)

```ts
export const tokens = {
  colors: {
    bgCanvas: "#0A0B0F",
    surface1: "#111319",
    textPrimary: "#F4F6FB",
    accent: "#6D7BFF",
    xp: "#7DD3FC",
    area: { academia: "#F97316", programacao: "#22D3EE" },
  },
  radius: { md: 10, lg: 14, full: 9999 },
  duration: { fast: 140, base: 220, celebrate: 520 },
} as const;
```

---

## 12. Princípios de decisão (síntese)

1. **Calmo por padrão, eufórico por mérito** — a euforia é a moeda mais cara da UI; gaste só em marco real.
2. **Token é contrato** — componente pede papel/área, nunca cor crua; tema e área trocam sem tocar código.
3. **Uma fonte, dois renderers** — web e mobile bebem do mesmo JSON; divergência é bug.
4. **Performance e acessibilidade são gate** — 60fps, AA, `motion-reduce` e SR são Definition of Done, não polimento futuro.
5. **A estética obedece aos guardrails** — sem dark pattern visual, sem glow vendendo vantagem; o pixel é tão honesto quanto o produto.
