/**
 * @rise/api — a superfície tRPC do Rise (type-safe ponta a ponta web+mobile).
 *
 * O adaptador HTTP (fetch handler + verificação de JWT do Supabase) e o client
 * tRPC no apps/web entram no próximo passo. Aqui ficam o router, o contexto e o
 * serviço de domínio já testáveis.
 */
export { appRouter, type AppRouter } from "./root";
export { createContext, type Context } from "./context";
export { router, publicProcedure, protectedProcedure, createCallerFactory } from "./trpc";
export {
  computarConcessao,
  type ComputeGrantInput,
  type ComputeGrantResult,
} from "./services/xp-grant";
export {
  creditarEstipendioMensal,
  periodoEstipendio,
  type CreditarEstipendioResult,
} from "./services/stipend";
