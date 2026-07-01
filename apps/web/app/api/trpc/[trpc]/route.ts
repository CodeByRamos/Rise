import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@rise/api";
import { createDb } from "@rise/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// postgres.js precisa do runtime Node (não edge).
export const runtime = "nodejs";

/**
 * Endpoint HTTP do tRPC. Deriva o `userId` da sessão do Supabase (JWT nos
 * cookies) e injeta o db no contexto. `createDb()` é lazy — só falha em runtime
 * se faltar DATABASE_URL; o build não é afetado.
 */
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      let userId: string | null = null;
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id ?? null;
      }
      const db = createDb();
      return createContext({ db, userId });
    },
  });
}

export { handler as GET, handler as POST };
