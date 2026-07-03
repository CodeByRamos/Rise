import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RiseWordmark } from "@/components/rise-mark";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function EntrarPage() {
  // Já logado → direto para o dashboard.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/");
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(16,185,129,0.12), transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <RiseWordmark size={30} />
          <p className="text-sm text-muted">
            Toda ação positiva gera progresso. Comece a subir.
          </p>
        </div>
        <div className="rounded-[24px] border border-line bg-surface-2 p-6">
          <AuthForm />
        </div>
        <p className="mt-6 text-center text-xs text-faint">
          Rise — o videogame da vida real
        </p>
      </div>
    </main>
  );
}
