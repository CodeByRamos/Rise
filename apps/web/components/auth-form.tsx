"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Modo = "entrar" | "criar";

export function AuthForm() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setMsg(null);
    // Client criado sob demanda (evita crash de build sem envs).
    const supabase = createSupabaseBrowserClient();
    const { error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha });
    setLoading(false);
    if (error) {
      setErro(error.message);
      return;
    }
    if (modo === "criar") {
      setMsg("Conta criada. Verifique seu e-mail se a confirmação estiver ativa.");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
      <label className="text-xs font-medium text-muted" htmlFor="email">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        className="rounded-xl border border-line bg-surface px-4 py-3 text-snow outline-none transition-colors focus:border-brand"
        placeholder="voce@email.com"
      />
      <label className="text-xs font-medium text-muted" htmlFor="senha">
        Senha
      </label>
      <input
        id="senha"
        type="password"
        required
        minLength={6}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete={modo === "entrar" ? "current-password" : "new-password"}
        className="rounded-xl border border-line bg-surface px-4 py-3 text-snow outline-none transition-colors focus:border-brand"
        placeholder="••••••••"
      />

      {erro && <p className="text-sm text-red-400">{erro}</p>}
      {msg && <p className="text-sm text-brand">{msg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-brand py-3 font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      >
        {loading
          ? "Aguarde…"
          : modo === "entrar"
            ? "Entrar"
            : "Criar minha conta"}
      </button>

      <button
        type="button"
        onClick={() => {
          setModo((m) => (m === "entrar" ? "criar" : "entrar"));
          setErro(null);
          setMsg(null);
        }}
        className="mt-1 text-center text-sm text-muted transition-colors hover:text-snow"
      >
        {modo === "entrar"
          ? "Não tem conta? Criar uma"
          : "Já tem conta? Entrar"}
      </button>
    </form>
  );
}
