import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
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
