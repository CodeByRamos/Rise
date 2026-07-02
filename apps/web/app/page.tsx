import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { DashboardLive } from "@/components/dashboard-live";

// Sessão vem dos cookies → rota dinâmica.
export const dynamic = "force-dynamic";

export default async function Home() {
  const configurado =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") === true &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem Supabase (CI/preview sem segredos): modo demonstração local.
  if (!configurado) return <DashboardClient />;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");

  const nome =
    (data.user.user_metadata?.display_name as string | undefined) ??
    data.user.email?.split("@")[0] ??
    "Você";

  return <DashboardLive displayName={nome} />;
}
