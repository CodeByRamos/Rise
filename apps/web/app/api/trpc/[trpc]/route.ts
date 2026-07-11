import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createClient } from "@supabase/supabase-js";
import { appRouter, createContext } from "@rise/api";
import { getDb } from "@rise/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// postgres.js precisa do runtime Node (não edge).
export const runtime = "nodejs";

/**
 * Endpoint HTTP do tRPC. Deriva o `userId` da sessão do Supabase e injeta o
 * db no contexto. Duas formas de auth, mesma verificação de JWT:
 * - Web: sessão nos cookies (@supabase/ssr).
 * - Mobile (Expo): header `Authorization: Bearer <access_token>` — app
 *   nativo não tem cookie de site.
 * `createDb()` é lazy — só falha em runtime se faltar DATABASE_URL.
 */
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      let userId: string | null = null;
      let email: string | null = null;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url?.startsWith("http") && anon) {
        const bearer = req.headers.get("authorization");
        if (bearer?.startsWith("Bearer ")) {
          // Caminho mobile: valida o access token direto no Supabase Auth.
          const supabase = createClient(url, anon, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await supabase.auth.getUser(bearer.slice(7));
          // Token presente mas inválido/erro ⇒ falha explícita (o client
          // renova e re-tenta) — nunca degradar silenciosamente p/ anônimo.
          if (error && error.status !== 401 && error.status !== 403) {
            throw new Error(`Auth indisponível: ${error.message}`);
          }
          userId = data.user?.id ?? null;
          email = data.user?.email ?? null;
        } else {
          // Caminho web: sessão nos cookies.
          const supabase = await createSupabaseServerClient();
          const { data, error } = await supabase.auth.getUser();
          // Sem sessão é normal (rota pública); falha transitória do Auth
          // com sessão presente não pode virar "anônimo" (UNAUTHORIZED falso).
          if (error && error.status !== 400 && !/session/i.test(error.message)) {
            throw new Error(`Auth indisponível: ${error.message}`);
          }
          userId = data.user?.id ?? null;
          email = data.user?.email ?? null;
        }
      }
      // Singleton por processo — nunca um pool novo por request.
      const db = getDb();
      return createContext({ db, userId, email });
    },
  });
}

export { handler as GET, handler as POST };
