import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@rise/db";
import { entitlementsDe, isPremium, type PlanTier } from "@rise/core";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  // ZodError.message é um JSON.stringify das issues — sem este formatter, a
  // UI mostrava um blob JSON pro usuário. Vira a mensagem da primeira issue
  // (já escritas em pt-BR nos schemas).
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      const primeira = error.cause.issues[0]?.message;
      if (primeira) return { ...shape, message: primeira };
    }
    return shape;
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Procedure protegida: exige usuário autenticado. Estreita o tipo de `ctx.userId`
 * para `string` (não-nulo) nas procedures que a usam.
 */
export const protectedProcedure = t.procedure.use((opts) => {
  const { ctx } = opts;
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "É necessário estar logado.",
    });
  }
  return opts.next({ ctx: { ...ctx, userId: ctx.userId } });
});

/**
 * Procedure autenticada que carrega o plano do usuário e seus entitlements
 * (docs/12). Uma leitura barata (índice `users_plan_idx`) só nas procedures que
 * precisam decidir gating — não onera o caminho quente do registro de ação.
 */
export const planProcedure = protectedProcedure.use(async (opts) => {
  const rows = await opts.ctx.db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, opts.ctx.userId))
    .limit(1);
  const plan = (rows[0]?.plan ?? "free") as PlanTier;
  return opts.next({ ctx: { plan, entitlements: entitlementsDe(plan) } });
});

/**
 * Procedure Premium: exige tier pago. Progressão central NUNCA passa por aqui —
 * só profundidade de IA, analytics e cosmética (guardrail anti pay-to-win).
 */
export const premiumProcedure = planProcedure.use((opts) => {
  if (!isPremium(opts.ctx.plan)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Este é um recurso do Rise+. Assine para desbloquear.",
    });
  }
  return opts.next();
});
