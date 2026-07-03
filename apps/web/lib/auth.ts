import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

/** Guard de página autenticada: retorna o usuário ou redireciona. */
export async function requireUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) redirect("/");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");
  const nome =
    (data.user.user_metadata?.display_name as string | undefined) ??
    data.user.email?.split("@")[0] ??
    "Você";
  return { userId: data.user.id, nome };
}
