/**
 * Concessão de XP por ação — o motor que transforma uma ação real em XP.
 *
 * Spec canônico: `docs/13-gamificacao.md` §2.2.
 *
 *   XP_acao      = round(base_acao × mult_dificuldade × mult_streak × mult_missao)
 *   XP_concedido = min(XP_acao, teto_diario_area_restante)
 *
 * Este cálculo roda no SERVIDOR como verdade (e no cliente para optimistic UI).
 * Os multiplicadores são capados nas faixas do spec para impedir inflação por
 * exagero de intensidade/missão. XP nunca é comprável: nada aqui aceita dinheiro.
 */

/** Faixas canônicas dos multiplicadores (doc 13 §2.2). */
export const MULT_DIFICULDADE_MIN = 1.0;
export const MULT_DIFICULDADE_MAX = 2.0;
export const MULT_MISSAO_MIN = 1.0;
export const MULT_MISSAO_MAX = 2.0;

export interface XpGrantInput {
  /** Valor-base da ação, da tabela por área (5–50). */
  baseAcao: number;
  /** Intensidade/duração validada (1.0–2.0). Default 1.0. */
  multDificuldade?: number;
  /** Bônus de sequência vindo de `multStreak` (1.0–1.5). Default 1.0. */
  multStreak?: number;
  /** Bônus por cumprir Missão ativa (1.0–2.0). Default 1.0. */
  multMissao?: number;
  /**
   * XP restante do teto diário da área. Se informado, corta o excedente
   * (anti-grinding, §10.1). Se omitido, não há corte por teto.
   */
  tetoDiarioRestante?: number;
}

export interface XpGrantResultado {
  /** XP calculado pela fórmula, antes do teto diário. */
  xpBruto: number;
  /** XP efetivamente concedido, após aplicar o teto diário. */
  xpConcedido: number;
  /** true se o teto diário da área cortou parte do XP. */
  tetoAplicado: boolean;
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

/**
 * Calcula o XP concedido por uma ação, aplicando multiplicadores capados e o
 * teto diário da área. Determinístico e puro — a base de `xp.granted`.
 */
export function calcularXpConcedido(input: XpGrantInput): XpGrantResultado {
  const { baseAcao } = input;
  if (!Number.isFinite(baseAcao) || baseAcao < 0) {
    throw new RangeError(`baseAcao deve ser >= 0, recebido: ${baseAcao}`);
  }

  const multDificuldade = clamp(
    input.multDificuldade ?? 1.0,
    MULT_DIFICULDADE_MIN,
    MULT_DIFICULDADE_MAX,
  );
  const multMissao = clamp(
    input.multMissao ?? 1.0,
    MULT_MISSAO_MIN,
    MULT_MISSAO_MAX,
  );
  const multStreakAplicado = Math.max(input.multStreak ?? 1.0, 1.0);

  const xpBruto = Math.round(
    baseAcao * multDificuldade * multStreakAplicado * multMissao,
  );

  const teto = input.tetoDiarioRestante;
  if (teto === undefined) {
    return { xpBruto, xpConcedido: xpBruto, tetoAplicado: false };
  }

  const restante = Math.max(teto, 0);
  const xpConcedido = Math.min(xpBruto, restante);
  return { xpBruto, xpConcedido, tetoAplicado: xpConcedido < xpBruto };
}
