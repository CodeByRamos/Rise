"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Redefinição de senha — destino do link "Esqueci minha senha". O client
 * @supabase/ssr troca o código do link por uma sessão de recuperação no load
 * (detectSessionInUrl); com ela, updateUser({ password }) grava a senha nova.
 */
export function RedefinirForm() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [temSessao, setTemSessao] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    // O evento PASSWORD_RECOVERY (ou sessão já trocada) libera o formulário.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setTemSessao(true);
        setPronto(true);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setTemSessao(true);
      setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (senha !== confirma) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setErro(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      setErro(
        error.message.toLowerCase().includes("should be different")
          ? "A nova senha precisa ser diferente da atual."
          : error.message,
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (!pronto) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface" />;
  }

  if (!temSessao) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-muted">
          Link de recuperação inválido ou expirado. Peça um novo em{" "}
          <Link href="/entrar" className="text-brand hover:underline">
            Entrar → Esqueci minha senha
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
      <label className="text-xs font-medium text-muted" htmlFor="nova-senha">
        Nova senha
      </label>
      <input
        id="nova-senha"
        type="password"
        required
        minLength={6}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="new-password"
        className="rounded-xl border border-line bg-surface px-4 py-3 text-snow outline-none transition-colors focus:border-brand"
        placeholder="••••••••"
      />
      <label className="text-xs font-medium text-muted" htmlFor="confirma-senha">
        Confirme a nova senha
      </label>
      <input
        id="confirma-senha"
        type="password"
        required
        minLength={6}
        value={confirma}
        onChange={(e) => setConfirma(e.target.value)}
        autoComplete="new-password"
        className="rounded-xl border border-line bg-surface px-4 py-3 text-snow outline-none transition-colors focus:border-brand"
        placeholder="••••••••"
      />

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-brand py-3 font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
