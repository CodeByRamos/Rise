import { Camada } from "./models";

/**
 * Roteamento de custo do Coach (docs/14 §3.3). Função pura e testável — decide
 * qual camada atende cada requisição, respeitando gating de Premium e cota Free.
 */

export type TipoRequisicao =
  | "classify" // classificar texto (quick-log) → Haiku
  | "shortDraft" // redação curta (notificação) → Haiku
  | "weeklyDeepAnalysis" // Análise Profunda semanal → Opus (Premium)
  | "dailyCoach" // check-in do dia → Sonnet
  | "chat"; // conversa sob demanda → Sonnet

export interface CoachRequest {
  kind: TipoRequisicao;
  texto?: string;
  /** L0 upstream já resolveu isto sem LLM? (ex.: classificação de alta confiança) */
  heuristicaResolve?: boolean;
}

export interface UserContext {
  isPremium: boolean;
  /** Free estourou a cota diária de Sonnet? */
  sonnetQuotaExhausted: boolean;
}

export function routeCoachRequest(
  req: CoachRequest,
  ctx: UserContext,
): Camada {
  // L0 primeiro: dá para resolver sem LLM?
  if (req.heuristicaResolve) return Camada.Heuristica;

  // Microtarefa / classificação em volume → Haiku.
  if (req.kind === "classify" || req.kind === "shortDraft") return Camada.Haiku;

  // Análise profunda semanal → Opus, mas só Premium (Free cai para Sonnet resumido).
  if (req.kind === "weeklyDeepAnalysis") {
    return ctx.isPremium ? Camada.Opus : Camada.Sonnet;
  }

  // Coach diário / conversa → Sonnet, respeitando a cota Free.
  if (req.kind === "dailyCoach" || req.kind === "chat") {
    if (!ctx.isPremium && ctx.sonnetQuotaExhausted) return Camada.Heuristica;
    return Camada.Sonnet;
  }

  return Camada.Sonnet; // default conservador
}
