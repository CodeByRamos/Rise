/**
 * Streaks (Sequências) — compromisso saudável, nunca culpa.
 *
 * Spec canônico: `docs/13-gamificacao.md` §5.
 * O multiplicador cresce devagar e SATURA cedo (teto em 25 dias), de propósito:
 * o valor mecânico do streak acaba quando o hábito já está formado. Quem está em
 * 200 dias não perde XP relevante ao quebrar — isso protege contra streak-shame.
 * O streak longo vira status/Conquista, não dependência de XP.
 *
 *   mult_streak = min(1 + 0.02 × dias, 1.5)
 */

/** Incremento do multiplicador por dia de sequência. */
export const STREAK_MULT_INCREMENTO = 0.02;
/** Teto do multiplicador de streak. */
export const STREAK_MULT_MAX = 1.5;
/** Dia em que o multiplicador satura (atinge o teto). */
export const STREAK_DIAS_TETO = 25;

/**
 * Multiplicador de XP dado o tamanho atual da sequência (em dias).
 * Ex.: 1 dia → 1.02, 7 → 1.14, 14 → 1.28, 25+ → 1.50 (teto).
 */
export function multStreak(diasStreak: number): number {
  if (!Number.isFinite(diasStreak) || diasStreak < 0) {
    throw new RangeError(`diasStreak deve ser >= 0, recebido: ${diasStreak}`);
  }
  return Math.min(1 + STREAK_MULT_INCREMENTO * diasStreak, STREAK_MULT_MAX);
}

/** Já atingiu o teto do multiplicador? (útil para copy/telemetria, não para punir). */
export function streakSaturado(diasStreak: number): boolean {
  return diasStreak >= STREAK_DIAS_TETO;
}
