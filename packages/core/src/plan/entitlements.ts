/**
 * Entitlements por plano — a fonte da verdade do que cada tier destrava
 * (docs/12-monetizacao.md §2, §3). Domínio PURO: nenhuma menção a Stripe, preço
 * ou cobrança aqui — só "o que o plano libera". Consumido pelo servidor (gating
 * real) e pelo cliente (paywall/estado da UI).
 *
 * Guardrail inegociável: nada aqui toca progressão (XP/nível/streak/conquista).
 * O paywall vende profundidade de IA, clareza de dados e beleza cosmética — nunca
 * poder competitivo (docs/12 §1).
 */

export type PlanTier = "free" | "plus" | "founder" | "team";

export interface Entitlements {
  /** Mensagens/dia do Coach conversacional (Sonnet). Infinity = ilimitado. */
  coachDailyMessages: number;
  /** Análise Profunda semanal (Opus com RAG sobre stats). */
  deepAnalysis: boolean;
  /** Janela do histórico de estatísticas em dias. Infinity = ilimitado. */
  statsHistoryDays: number;
  /** Estipêndio mensal de Faíscas (moeda cosmética, isolada do XP). */
  monthlySparksStipend: number;
  /** Acesso ao catálogo cosmético Premium (temas/molduras/efeitos). */
  premiumCosmetics: boolean;
  /** Histórico de Temporadas anteriores além da atual. */
  multiSeasonHistory: boolean;
  /** Direito a votar no roadmap. */
  roadmapVote: boolean;
}

/** Cota Free do Coach Sonnet (docs/12 §2 nota² — calibrável via PostHog). */
export const COACH_FREE_DAILY = 8;

/** Estipêndio mensal de Faíscas por tier pago (docs/12 §2). */
export const SPARKS_STIPEND_PLUS = 300;
export const SPARKS_STIPEND_FOUNDER = 500;

const PREMIUM_BASE: Omit<Entitlements, "monthlySparksStipend"> = {
  coachDailyMessages: Infinity,
  deepAnalysis: true,
  statsHistoryDays: Infinity,
  premiumCosmetics: true,
  multiSeasonHistory: true,
  roadmapVote: true,
};

export const ENTITLEMENTS: Record<PlanTier, Entitlements> = {
  free: {
    coachDailyMessages: COACH_FREE_DAILY,
    deepAnalysis: false,
    statsHistoryDays: 7,
    monthlySparksStipend: 0,
    premiumCosmetics: false,
    multiSeasonHistory: false,
    roadmapVote: false,
  },
  plus: { ...PREMIUM_BASE, monthlySparksStipend: SPARKS_STIPEND_PLUS },
  // Founder = Rise+ com estipêndio maior + badge permanente (o badge é
  // cosmético, resolvido no catálogo — aqui só a economia de Faíscas difere).
  founder: { ...PREMIUM_BASE, monthlySparksStipend: SPARKS_STIPEND_FOUNDER },
  // Team (B2B, Fase 3): mesmos destravamentos de profundidade do Rise+.
  team: { ...PREMIUM_BASE, monthlySparksStipend: SPARKS_STIPEND_PLUS },
};

/** Todo tier pago. Free é o único não-premium. */
export function isPremium(plan: PlanTier): boolean {
  return plan !== "free";
}

/** Entitlements do plano (fallback conservador para `free` em valor inesperado). */
export function entitlementsDe(plan: string | null | undefined): Entitlements {
  return ENTITLEMENTS[(plan as PlanTier) ?? "free"] ?? ENTITLEMENTS.free;
}
