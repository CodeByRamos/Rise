import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@rise/api";
import { createDb } from "@rise/db";

// postgres.js precisa do runtime Node (não edge).
export const runtime = "nodejs";

/**
 * Endpoint HTTP do tRPC. A verificação do JWT do Supabase → `userId` real entra
 * quando o Auth estiver ligado; por ora o contexto nasce sem usuário (as
 * procedures protegidas respondem UNAUTHORIZED). `createDb()` é lazy: só falha
 * em runtime se faltar DATABASE_URL — o build não é afetado.
 */
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const db = createDb();
      // TODO(auth): extrair e verificar o access token do Supabase do header.
      return createContext({ db, userId: null });
    },
  });
}

export { handler as GET, handler as POST };
