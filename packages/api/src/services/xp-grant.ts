/**
 * Serviço PURO de concessão de XP — o cálculo do "registrar ação → XP".
 *
 * Isola a lógica de negócio (testável, sem DB) da persistência (routers/action.ts).
 * Toda matemática vem de @rise/core (curva canônica, streak). A camada de dados
 * só aplica o resultado. Isso é o ADR 0009 ("IA propõe / core aplica") estendido:
 * o router orquestra, mas quem decide XP é o domínio.
 */
import {
  calcularXpConcedido,
  multStreak,
  nivelPorXp,
  nivelDeArea,
} from "@rise/core";

export interface ComputeGrantInput {
  /** XP-base da ação (da tabela por área). */
  baseAcao: number;
  /** Intensidade/duração validada (1.0–2.0). */
  multDificuldade?: number;
  /** Dias de sequência atuais (viram mult_streak). */
  streakDias: number;
  /** Bônus por Missão ativa (1.0–2.0). */
  multMissao?: number;
  /** XP total atual da área (projeção). */
  totalXpAtual: number;
  /** XP restante do teto diário da área (anti-grind). */
  tetoDiarioRestante?: number;
}

export interface ComputeGrantResult {
  /** XP efetivamente concedido (após teto). */
  amount: number;
  /** XP-base antes de multiplicadores (para o ledger). */
  baseAmount: number;
  /** Multiplicador de streak aplicado. */
  streakMult: number;
  /** Novo XP total da área. */
  totalXpNovo: number;
  nivelAnterior: number;
  nivelNovo: number;
  subiuNivel: boolean;
  tetoAplicado: boolean;
}

/**
 * Computa a concessão de XP de uma ação e o novo estado da área.
 * Determinístico e puro — a mesma verdade no servidor e no optimistic UI.
 */
export function computarConcessao(input: ComputeGrantInput): ComputeGrantResult {
  const streakMult = multStreak(input.streakDias);

  const resultado = calcularXpConcedido({
    baseAcao: input.baseAcao,
    multDificuldade: input.multDificuldade,
    multStreak: streakMult,
    multMissao: input.multMissao,
    tetoDiarioRestante: input.tetoDiarioRestante,
  });

  const nivelAnterior = nivelDeArea(input.totalXpAtual);
  const totalXpNovo = input.totalXpAtual + resultado.xpConcedido;
  const nivelNovo = nivelDeArea(totalXpNovo);

  return {
    amount: resultado.xpConcedido,
    baseAmount: input.baseAcao,
    streakMult,
    totalXpNovo,
    nivelAnterior,
    nivelNovo,
    subiuNivel: nivelNovo > nivelAnterior,
    tetoAplicado: resultado.tetoAplicado,
  };
}

// Reexporta helpers usados pelo router (evita reimport de @rise/core lá).
export { nivelPorXp, nivelDeArea };
