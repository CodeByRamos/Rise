import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware de sessão (@supabase/ssr): renova o token expirado e PERSISTE os
 * cookies rotacionados na resposta. Sem isto, a rotação acontecia só em
 * memória durante RSC (Server Component não pode escrever cookie), o refresh
 * token antigo era reutilizado e o GoTrue revogava a sessão inteira —
 * logout aleatório ~1h depois do login.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.startsWith("http") || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() valida o JWT e dispara o refresh quando expirado — o setAll
  // acima grava os novos tokens no request (para este render) e na response
  // (para o browser).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Tudo, exceto estáticos e imagens (sem sessão não há o que renovar).
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
