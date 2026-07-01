/**
 * Nível Rise (Rank de Vida) — agrega a evolução de todas as Áreas da Vida.
 *
 * Spec canônico: `docs/13-gamificacao.md` §3.2.
 * Não é a soma bruta de XP (isso premiaria quem grinda uma única área): é o XP
 * total amplificado por um fator que recompensa AMPLITUDE (várias áreas ativas)
 * sem punir o especialista, que ainda sobe pela massa de XP.
 *
 *   XP_rise        = Σ XP_area
 *   fator_amplitude = 1 + 0.04 × (areas_ativas − 1)   // capado em areas_ativas = 8 → +28%
 *   NivelRise      = min(nivel(XP_rise × fator_amplitude), 100)
 */

import { nivelPorXp, NIVEL_TETO } from "../xp/curve";

export const AMPLITUDE_INCREMENTO = 0.04;
/** A partir de 8 áreas ativas o fator satura em +28%. */
export const AMPLITUDE_AREAS_CAP = 8;
/** Nível mínimo de uma área para contar como "ativa" (§3.2). */
export const AREA_ATIVA_NIVEL_MIN = 2;

/** Progresso de uma Área da Vida para fins de agregação do Nível Rise. */
export interface AreaProgresso {
  /** XP acumulado da área. */
  xp: number;
  /**
   * A área teve ação nos últimos 30 dias? Informado pela camada de dados —
   * o domínio puro não conhece tempo. Default: false (conservador).
   */
  ativaNoPeriodo?: boolean;
}

/**
 * Fator de amplitude dado o número de áreas ativas.
 * 1 área → 1.0, 2 → 1.04, 8+ → 1.28 (teto).
 */
export function fatorAmplitude(areasAtivas: number): number {
  const a = Math.min(Math.max(areasAtivas, 1), AMPLITUDE_AREAS_CAP);
  return 1 + AMPLITUDE_INCREMENTO * (a - 1);
}

/**
 * Conta as áreas ativas: nível ≥ 2 (por XP) E com ação nos últimos 30 dias.
 */
export function contarAreasAtivas(areas: readonly AreaProgresso[]): number {
  return areas.filter(
    (area) =>
      area.ativaNoPeriodo === true &&
      nivelPorXp(Math.max(area.xp, 0)) >= AREA_ATIVA_NIVEL_MIN,
  ).length;
}

export interface NivelRiseResultado {
  nivelRise: number;
  xpRise: number;
  areasAtivas: number;
  fatorAmplitude: number;
  /** true se atingiu o teto e está elegível a Prestígio (opt-in). */
  noTeto: boolean;
}

/** Calcula o Nível Rise agregado a partir do progresso por área. */
export function calcularNivelRise(
  areas: readonly AreaProgresso[],
): NivelRiseResultado {
  const xpRise = areas.reduce((soma, area) => soma + Math.max(area.xp, 0), 0);
  const areasAtivas = contarAreasAtivas(areas);
  const fator = fatorAmplitude(areasAtivas);
  const nivelBruto = nivelPorXp(xpRise * fator);
  const nivelRise = Math.min(nivelBruto, NIVEL_TETO);
  return {
    nivelRise,
    xpRise,
    areasAtivas,
    fatorAmplitude: fator,
    noTeto: nivelRise >= NIVEL_TETO,
  };
}
