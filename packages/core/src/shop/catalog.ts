/**
 * Catálogo cosmético do Rise — a fonte da verdade da Loja. Tudo aqui é ESTÉTICO:
 * molduras, temas, fundos de perfil, títulos e emblemas. NUNCA concede XP, nível
 * ou vantagem competitiva (guardrail anti pay-to-win, ADR 0007). Preços em Faíscas,
 * sempre visíveis; sem loot box, sem odds ocultas.
 *
 * Raridade influencia SÓ exclusividade e estética (preço/borda), jamais poder.
 */

export type Rarity =
  | "comum"
  | "incomum"
  | "raro"
  | "epico"
  | "lendario"
  | "mitico"
  | "exclusivo"
  | "evento";

export type CosmeticCategory = "frame" | "theme" | "profileBg" | "title" | "badge";

export type EventoId = "ano-novo" | "carnaval" | "halloween" | "natal" | "aniversario";

export interface CosmeticDef {
  id: string;
  name: string;
  category: CosmeticCategory;
  /** kind persistido em cosmetic_items.kind (== category). */
  rarity: Rarity;
  /** Preço em Faíscas. 0 = não vendável (só conquistado/sazonal fora de evento). */
  price: number;
  /** Dados de render (o cliente desenha a partir disto). */
  preview: Record<string, unknown>;
  desc?: string;
  /** Evento sazonal: só comprável durante a janela do evento. */
  evento?: EventoId;
}

export const RARITY_META: Record<
  Rarity,
  { label: string; ordem: number; cor: string }
> = {
  comum: { label: "Comum", ordem: 0, cor: "#8b929c" },
  incomum: { label: "Incomum", ordem: 1, cor: "#34d399" },
  raro: { label: "Raro", ordem: 2, cor: "#60a5fa" },
  epico: { label: "Épico", ordem: 3, cor: "#a78bfa" },
  lendario: { label: "Lendário", ordem: 4, cor: "#fbbf24" },
  mitico: { label: "Mítico", ordem: 5, cor: "#f472b6" },
  exclusivo: { label: "Exclusivo", ordem: 6, cor: "#22d3ee" },
  evento: { label: "Evento", ordem: 7, cor: "#fb7185" },
};

export const CATEGORY_META: Record<CosmeticCategory, { label: string; ordem: number }> = {
  frame: { label: "Molduras", ordem: 0 },
  theme: { label: "Temas", ordem: 1 },
  profileBg: { label: "Fundos de Perfil", ordem: 2 },
  title: { label: "Títulos", ordem: 3 },
  badge: { label: "Emblemas", ordem: 4 },
};

const F = (id: string, name: string, rarity: Rarity, price: number, colors: string[], evento?: EventoId): CosmeticDef =>
  ({ id, name, category: "frame", rarity, price, preview: { colors }, evento });
const T = (id: string, name: string, rarity: Rarity, price: number, accent: string, strong: string): CosmeticDef =>
  ({ id, name, category: "theme", rarity, price, preview: { accent, strong } });
const BG = (id: string, name: string, rarity: Rarity, price: number, gradient: string[], evento?: EventoId): CosmeticDef =>
  ({ id, name, category: "profileBg", rarity, price, preview: { gradient }, evento });
const TT = (id: string, name: string, rarity: Rarity, price: number, cor: string, evento?: EventoId): CosmeticDef =>
  ({ id, name, category: "title", rarity, price, preview: { text: name, cor }, evento });
const BD = (id: string, name: string, rarity: Rarity, price: number, colors: string[], desc: string): CosmeticDef =>
  ({ id, name, category: "badge", rarity, price, preview: { colors }, desc });

export const COSMETIC_CATALOG: readonly CosmeticDef[] = [
  // ── Molduras (anel do avatar) ──
  F("frame-emerald", "Esmeralda", "comum", 10, ["#10b981"]),
  F("frame-azure", "Azul", "comum", 10, ["#60a5fa"]),
  F("frame-slate", "Grafite", "comum", 10, ["#94a3b8"]),
  F("frame-rose", "Rosa", "comum", 12, ["#fb7185"]),
  F("frame-violet", "Violeta", "incomum", 20, ["#a78bfa"]),
  F("frame-ember", "Brasa", "incomum", 25, ["#fb923c", "#f472b6"]),
  F("frame-ocean", "Oceano", "incomum", 25, ["#22d3ee", "#3b82f6"]),
  F("frame-forest", "Floresta", "raro", 50, ["#34d399", "#84cc16"]),
  F("frame-solar", "Solar", "raro", 55, ["#fbbf24", "#fb923c"]),
  F("frame-aurora", "Aurora", "epico", 110, ["#10b981", "#60a5fa", "#a78bfa"]),
  F("frame-nebula", "Nebulosa", "epico", 130, ["#a78bfa", "#f472b6", "#22d3ee"]),
  F("frame-prisma", "Prisma", "lendario", 240, ["#f472b6", "#fbbf24", "#34d399", "#60a5fa"]),
  F("frame-obsidian", "Obsidiana", "lendario", 260, ["#1a1d22", "#a78bfa"]),
  F("frame-mythril", "Mithril", "mitico", 480, ["#e0f2fe", "#22d3ee", "#a78bfa"]),
  F("frame-pumpkin", "Abóbora", "evento", 40, ["#fb923c", "#1a1d22"], "halloween"),
  F("frame-pinheiro", "Pinheiro", "evento", 40, ["#22c55e", "#f4f5f7"], "natal"),
  F("frame-fogos", "Fogos", "evento", 40, ["#fbbf24", "#f472b6", "#60a5fa"], "ano-novo"),

  // ── Temas (cor-marca da interface do próprio usuário) ──
  T("theme-azure", "Azul Profundo", "incomum", 25, "#60a5fa", "#3b82f6"),
  T("theme-violet", "Violeta", "incomum", 25, "#a78bfa", "#8b5cf6"),
  T("theme-solar", "Solar", "incomum", 25, "#fbbf24", "#f59e0b"),
  T("theme-crimson", "Carmesim", "incomum", 30, "#fb7185", "#e11d48"),
  T("theme-teal", "Turquesa", "raro", 45, "#2dd4bf", "#14b8a6"),
  T("theme-mono", "Monocromático", "raro", 50, "#e2e8f0", "#94a3b8"),
  T("theme-forest", "Floresta", "raro", 50, "#4ade80", "#22c55e"),
  T("theme-sakura", "Sakura", "epico", 100, "#f9a8d4", "#ec4899"),
  T("theme-cyber", "Cyberpunk", "epico", 120, "#22d3ee", "#a21caf"),
  T("theme-gold", "Ouro", "lendario", 220, "#fcd34d", "#d97706"),
  T("theme-void", "Vazio", "mitico", 420, "#c084fc", "#6d28d9"),

  // ── Fundos de Perfil (gradiente do cartão) ──
  BG("bg-dusk", "Crepúsculo", "incomum", 25, ["#1e293b", "#0f172a"]),
  BG("bg-ocean", "Maré", "incomum", 30, ["#0c4a6e", "#082f49"]),
  BG("bg-ember", "Brasa", "raro", 50, ["#7c2d12", "#1a1d22"]),
  BG("bg-forest", "Mata", "raro", 50, ["#14532d", "#0a0b0d"]),
  BG("bg-aurora", "Aurora Boreal", "epico", 110, ["#134e4a", "#312e81", "#4c1d95"]),
  BG("bg-city", "Cidade à Noite", "epico", 120, ["#1e1b4b", "#0f172a", "#312e81"]),
  BG("bg-cyber", "Neon", "lendario", 230, ["#2e1065", "#831843", "#0e7490"]),
  BG("bg-cosmos", "Cosmos", "mitico", 460, ["#0b0b12", "#4c1d95", "#0e7490", "#831843"]),
  BG("bg-fireworks", "Réveillon", "evento", 45, ["#1e1b4b", "#7c2d12"], "ano-novo"),
  BG("bg-halloween", "Noite das Bruxas", "evento", 45, ["#431407", "#1a1d22"], "halloween"),

  // ── Títulos (aparece no perfil) ──
  TT("title-disciplina", "Mestre da Disciplina", "raro", 60, "#dc2626"),
  TT("title-foco", "Arquiteto do Foco", "raro", 60, "#06b6d4"),
  TT("title-metas", "Caçador de Metas", "raro", 60, "#34d399"),
  TT("title-estrategista", "Estrategista", "incomum", 35, "#60a5fa"),
  TT("title-incansavel", "Incansável", "incomum", 35, "#fb923c"),
  TT("title-visionario", "Visionário", "epico", 110, "#a78bfa"),
  TT("title-mentor", "Mentor", "epico", 110, "#fbbf24"),
  TT("title-executor", "Executor", "incomum", 40, "#f472b6"),
  TT("title-conquistador", "Conquistador", "epico", 120, "#22d3ee"),
  TT("title-lenda", "Lenda da Produtividade", "lendario", 250, "#fcd34d"),
  TT("title-madrugador", "Madrugador", "incomum", 35, "#f59e0b"),
  TT("title-noturno", "Coruja Noturna", "incomum", 35, "#6366f1"),
  TT("title-inabalavel", "Inabalável", "lendario", 240, "#e2e8f0"),

  // ── Emblemas (selo no perfil) ──
  BD("badge-chama", "Chama", "comum", 15, ["#fb923c"], "Para quem mantém a sequência viva."),
  BD("badge-raio", "Raio", "incomum", 30, ["#fbbf24"], "Energia constante."),
  BD("badge-escudo", "Escudo", "incomum", 30, ["#60a5fa"], "Consistência que protege o progresso."),
  BD("badge-coroa", "Coroa", "raro", 55, ["#fcd34d"], "Domínio de uma Área."),
  BD("badge-lua", "Lua", "raro", 50, ["#a78bfa"], "Disciplina do descanso."),
  BD("badge-montanha", "Montanha", "epico", 100, ["#94a3b8"], "Metas de longo prazo."),
  BD("badge-fenix", "Fênix", "lendario", 230, ["#fb7185", "#fbbf24"], "Recomeços que viram força."),
  BD("badge-atomo", "Átomo", "epico", 110, ["#22d3ee"], "Hábitos atômicos."),
];

const POR_ID = new Map(COSMETIC_CATALOG.map((c) => [c.id, c] as const));

/** Cosmético pelo id (ou undefined). */
export function cosmeticoPorId(id: string | null | undefined): CosmeticDef | undefined {
  return id ? POR_ID.get(id) : undefined;
}

/** Progresso de coleção por categoria: possuídos / total (não sazonais fora de evento contam no total). */
export function progressoColecoes(
  possuidos: ReadonlySet<string>,
): { category: CosmeticCategory; total: number; owned: number }[] {
  const cats = Object.keys(CATEGORY_META) as CosmeticCategory[];
  return cats.map((category) => {
    const doGrupo = COSMETIC_CATALOG.filter((c) => c.category === category);
    return {
      category,
      total: doGrupo.length,
      owned: doGrupo.filter((c) => possuidos.has(c.id)).length,
    };
  });
}

// ── Eventos sazonais ──────────────────────────────────────────────────────
/** Evento ativo numa data (mês/dia). Simples e determinístico. */
export function eventoAtivoEm(d: { mes: number; dia: number }): EventoId | null {
  const { mes, dia } = d;
  if ((mes === 12 && dia >= 31) || (mes === 1 && dia <= 2)) return "ano-novo";
  if (mes === 10 && dia >= 24) return "halloween";
  if (mes === 12 && dia >= 1 && dia <= 26) return "natal";
  if (mes === 2) return "carnaval";
  if (mes === 6 && dia >= 10 && dia <= 20) return "aniversario"; // aniversário do Rise
  return null;
}

/** Item comprável agora? Sazonais só durante o evento. */
export function itemCompravel(
  item: CosmeticDef,
  eventoAtivo: EventoId | null,
): boolean {
  if (item.price <= 0) return false;
  if (item.evento) return item.evento === eventoAtivo;
  return true;
}

// ── Loja Rotativa (destaques do dia) ──────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Desconto dos destaques do dia (%). */
export const DESCONTO_DESTAQUE = 0.2;

/** Ids em destaque para um seed de dia (rotação determinística, sem sazonais). */
export function idsEmDestaque(seed: string, n = 6): Set<string> {
  const elegiveis = COSMETIC_CATALOG.filter((c) => c.price > 0 && !c.evento);
  const ordenados = [...elegiveis].sort((a, b) => hash(a.id + seed) - hash(b.id + seed));
  return new Set(ordenados.slice(0, n).map((c) => c.id));
}

/** Preço efetivo: aplica desconto de destaque quando o item está em destaque. */
export function precoEfetivo(item: CosmeticDef, emDestaque: boolean): number {
  if (!emDestaque) return item.price;
  return Math.max(1, Math.round(item.price * (1 - DESCONTO_DESTAQUE)));
}
