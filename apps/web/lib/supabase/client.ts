import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase para o browser (Auth do lado do cliente). Usa as chaves
 * públicas (anon). Precisa de NEXT_PUBLIC_SUPABASE_URL e
 * NEXT_PUBLIC_SUPABASE_ANON_KEY — ver apps/web/.env.example.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
