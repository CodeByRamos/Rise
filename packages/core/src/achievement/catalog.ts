/**
 * Conquistas (doc 13 §8.1) — marcos permanentes, critérios PÚBLICOS e
 * verificáveis nos dados reais. Raridade reflete dificuldade de obtenção,
 * define só o visual. Tom sóbrio: nomes curtos, zero infantilização.
 */

export type Raridade = "comum" | "rara" | "epica" | "lendaria";
export type CategoriaConquista =
  | "jornada"
  | "sequencia"
  | "area"
  | "amplitude"
  | "volume";

export interface AchievementDef {
  id: string;
  nome: string;
  /** Critério em linguagem clara — mostrado mesmo bloqueada (transparência). */
  criterio: string;
  categoria: CategoriaConquista;
  raridade: Raridade;
}

export const ACHIEVEMENT_CATALOG: readonly AchievementDef[] = [
  // Jornada
  { id: "primeira-prova", nome: "Primeira prova", criterio: "Registre sua primeira ação com prova.", categoria: "jornada", raridade: "comum" },
  { id: "dia-perfeito", nome: "Dia perfeito", criterio: "Complete todas as missões de um dia.", categoria: "jornada", raridade: "comum" },

  // Sequência
  { id: "sete-dias", nome: "Sete dias", criterio: "Alcance 7 dias de sequência.", categoria: "sequencia", raridade: "comum" },
  { id: "constancia", nome: "Constância", criterio: "Alcance 30 dias de sequência.", categoria: "sequencia", raridade: "rara" },
  { id: "sequencia-de-ferro", nome: "Sequência de ferro", criterio: "Alcance 100 dias de sequência.", categoria: "sequencia", raridade: "epica" },
  { id: "um-ano-de-subida", nome: "Um ano de subida", criterio: "Alcance 365 dias de sequência.", categoria: "sequencia", raridade: "lendaria" },

  // Área (profundidade)
  { id: "decada", nome: "Década", criterio: "Alcance o nível 10 em uma Área da Vida.", categoria: "area", raridade: "rara" },
  { id: "profundidade", nome: "Profundidade", criterio: "Alcance o nível 20 em uma Área da Vida.", categoria: "area", raridade: "epica" },
  { id: "maestria", nome: "Maestria", criterio: "Alcance o nível 30 em uma Área da Vida.", categoria: "area", raridade: "lendaria" },

  // Amplitude
  { id: "equilibrio", nome: "Equilíbrio", criterio: "Tenha 3 Áreas da Vida no nível 2 ou acima.", categoria: "amplitude", raridade: "comum" },
  { id: "renascenca", nome: "Renascença", criterio: "Tenha 5 Áreas da Vida no nível 5 ou acima.", categoria: "amplitude", raridade: "epica" },

  // Volume
  { id: "centuria", nome: "Centúria", criterio: "Registre 100 ações com prova.", categoria: "volume", raridade: "rara" },
  { id: "mil-provas", nome: "Mil provas", criterio: "Registre 1.000 ações com prova.", categoria: "volume", raridade: "lendaria" },

  // XP
  { id: "dez-mil", nome: "Dez mil", criterio: "Acumule 10.000 XP no total.", categoria: "volume", raridade: "rara" },
] as const;

/** Fotografia do progresso no momento da avaliação (pós-ação). */
export interface DadosAvaliacao {
  streakAtual: number;
  /** Níveis atuais de todas as Áreas da Vida do usuário. */
  niveisAreas: number[];
  totalAcoes: number;
  xpTotal: number;
  /** Todas as missões do dia foram completadas nesta ação? */
  diaPerfeito: boolean;
}

const CRITERIOS: Record<string, (d: DadosAvaliacao) => boolean> = {
  "primeira-prova": (d) => d.totalAcoes >= 1,
  "dia-perfeito": (d) => d.diaPerfeito,
  "sete-dias": (d) => d.streakAtual >= 7,
  constancia: (d) => d.streakAtual >= 30,
  "sequencia-de-ferro": (d) => d.streakAtual >= 100,
  "um-ano-de-subida": (d) => d.streakAtual >= 365,
  decada: (d) => d.niveisAreas.some((n) => n >= 10),
  profundidade: (d) => d.niveisAreas.some((n) => n >= 20),
  maestria: (d) => d.niveisAreas.some((n) => n >= 30),
  equilibrio: (d) => d.niveisAreas.filter((n) => n >= 2).length >= 3,
  renascenca: (d) => d.niveisAreas.filter((n) => n >= 5).length >= 5,
  centuria: (d) => d.totalAcoes >= 100,
  "mil-provas": (d) => d.totalAcoes >= 1000,
  "dez-mil": (d) => d.xpTotal >= 10_000,
};

/**
 * Avalia quais conquistas AINDA NÃO desbloqueadas passam a valer agora.
 * Pura e determinística — roda na transação do registro de ação.
 */
export function avaliarConquistas(
  dados: DadosAvaliacao,
  jaDesbloqueadas: ReadonlySet<string>,
): AchievementDef[] {
  return ACHIEVEMENT_CATALOG.filter(
    (a) => !jaDesbloqueadas.has(a.id) && (CRITERIOS[a.id]?.(dados) ?? false),
  );
}
