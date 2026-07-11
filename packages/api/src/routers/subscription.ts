import { router, planProcedure } from "../trpc";

/**
 * Assinatura / plano do usuário (docs/12). Fonte da verdade do gating para a UI:
 * o cliente lê `status` para decidir paywalls e estados Premium. A cobrança em si
 * (Stripe) é externa e opcional — o plano vive em `users.plan`, escrito pelo
 * webhook de billing (ver MANUAL_DE_CONFIGURACAO.md). Sem Stripe configurado, o
 * app funciona 100% no tier Free.
 */
export const subscriptionRouter = router({
  /** Plano atual + entitlements derivados (docs/12 §2). */
  status: planProcedure.query(({ ctx }) => {
    const e = ctx.entitlements;
    return {
      plan: ctx.plan,
      isPremium: ctx.plan !== "free",
      entitlements: {
        // Infinity não sobrevive à serialização JSON — expõe null = ilimitado.
        coachDailyMessages: Number.isFinite(e.coachDailyMessages)
          ? e.coachDailyMessages
          : null,
        deepAnalysis: e.deepAnalysis,
        statsHistoryDays: Number.isFinite(e.statsHistoryDays)
          ? e.statsHistoryDays
          : null,
        monthlySparksStipend: e.monthlySparksStipend,
        premiumCosmetics: e.premiumCosmetics,
        multiSeasonHistory: e.multiSeasonHistory,
        roadmapVote: e.roadmapVote,
      },
    };
  }),
});
