/**
 * Curva de nível do Rise — fonte da verdade do cálculo de XP.
 *
 * Spec canônico: `docs/13-gamificacao.md` §3.1 e `docs/00-canon.md` §3.
 * Uma única curva quadrática vale para TODA Área da Vida (e é a base do Nível Rise).
 *
 *   XP_total(n) = 50·n² + 50·n            (XP acumulado para atingir o nível n)
 *   XP_proximo(n) = 100·(n + 1)           (custo para ir de n → n+1)
 *   nivel(xp) = floor((-50 + sqrt(2500 + 200·xp)) / 100)
 *
 * Funções puras, determinísticas e testáveis — reusadas por servidor (verdade),
 * cliente (optimistic UI), Coach de IA e jobs. Nível é SEMPRE derivado do XP,
 * nunca persistido como verdade primária (ADR 0006).
 */

/** Nível-teto exibível de uma Área da Vida e do Nível Rise antes do Prestígio. */
export const NIVEL_TETO = 100;

function assertXpValido(xp: number): void {
  if (!Number.isFinite(xp) || xp < 0) {
    throw new RangeError(`xp deve ser um número finito >= 0, recebido: ${xp}`);
  }
}

function assertNivelValido(nivel: number): void {
  if (!Number.isInteger(nivel) || nivel < 0) {
    throw new RangeError(`nivel deve ser um inteiro >= 0, recebido: ${nivel}`);
  }
}

/**
 * XP acumulado necessário para atingir o nível `n`.
 * `XP_total(n) = 50·n² + 50·n`. Ex.: n=1 → 100, n=2 → 300, n=10 → 5.500.
 */
export function xpTotalParaNivel(nivel: number): number {
  assertNivelValido(nivel);
  return 50 * nivel * nivel + 50 * nivel;
}

/**
 * Custo em XP para passar do nível `n` para `n+1`.
 * `XP_proximo(n) = 100·(n + 1)`. Ex.: 0→1 custa 100, 1→2 custa 200.
 */
export function custoProximoNivel(nivel: number): number {
  assertNivelValido(nivel);
  return 100 * (nivel + 1);
}

/**
 * Nível derivado a partir do XP acumulado (inverso da curva).
 *
 * Usa a fórmula fechada e corrige erros de ponto flutuante nas fronteiras
 * garantindo o invariante: `nivelPorXp(xpTotalParaNivel(n)) === n`.
 */
export function nivelPorXp(xp: number): number {
  assertXpValido(xp);
  let n = Math.floor((-50 + Math.sqrt(2500 + 200 * xp)) / 100);
  if (n < 0) n = 0;
  // Correção de fronteira (robustez a imprecisão de sqrt em floats grandes).
  while (xpTotalParaNivel(n + 1) <= xp) n++;
  while (n > 0 && xpTotalParaNivel(n) > xp) n--;
  return n;
}

/** Progresso detalhado do usuário dentro do nível atual — pronto para a UI (BarraDeXP). */
export interface ProgressoNivel {
  /** Nível atual derivado do XP. */
  nivel: number;
  /** XP total acumulado. */
  xpTotal: number;
  /** XP já conquistado dentro do nível atual. */
  xpNoNivel: number;
  /** XP necessário para completar o nível atual (custo do próximo). */
  xpDoNivel: number;
  /** XP que ainda falta para o próximo nível. */
  xpFaltando: number;
  /** Fração 0..1 de progresso no nível atual. */
  fracao: number;
}

/** Decompõe o XP total em progresso legível para a UI. */
export function progressoNoNivel(xp: number): ProgressoNivel {
  assertXpValido(xp);
  const nivel = nivelPorXp(xp);
  const baseNivel = xpTotalParaNivel(nivel);
  const xpDoNivel = custoProximoNivel(nivel);
  const xpNoNivel = xp - baseNivel;
  const xpFaltando = xpDoNivel - xpNoNivel;
  return {
    nivel,
    xpTotal: xp,
    xpNoNivel,
    xpDoNivel,
    xpFaltando,
    fracao: xpDoNivel === 0 ? 1 : xpNoNivel / xpDoNivel,
  };
}

/** Nível de uma Área da Vida, com o teto de produto aplicado (§3.1). */
export function nivelDeArea(xp: number): number {
  return Math.min(nivelPorXp(xp), NIVEL_TETO);
}
