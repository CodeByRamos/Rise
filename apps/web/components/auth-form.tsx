"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Modo = "entrar" | "criar" | "recuperar";

/** Erros do Supabase Auth traduzidos para ações claras (nunca inglês cru). */
function traduzirErro(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou senha incorretos. Se você acabou de criar a conta, confirme o e-mail antes de entrar.";
  if (m.includes("email not confirmed"))
    return "Este e-mail ainda não foi confirmado. Reenvie a confirmação abaixo e confira sua caixa de entrada (e o spam).";
  if (m.includes("user already registered"))
    return "Este e-mail já tem conta. Entre com sua senha ou recupere-a.";
  if (m.includes("password should be at least"))
    return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  return message;
}

export function AuthForm() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oferecerReenvio, setOferecerReenvio] = useState(false);

  function trocarModo(m: Modo) {
    setModo(m);
    setErro(null);
    setMsg(null);
    setOferecerReenvio(false);
  }

  async function reenviarConfirmacao() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    if (error) {
      setErro(traduzirErro(error.message));
      return;
    }
    setErro(null);
    setOferecerReenvio(false);
    setMsg("Confirmação reenviada — confira sua caixa de entrada (e o spam).");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setMsg(null);
    setOferecerReenvio(false);
    // Client criado sob demanda (evita crash de build sem envs).
    const supabase = createSupabaseBrowserClient();

    if (modo === "recuperar") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir`,
      });
      setLoading(false);
      if (error) {
        setErro(traduzirErro(error.message));
        return;
      }
      setMsg(
        "Se este e-mail tiver conta, você receberá um link para redefinir a senha.",
      );
      return;
    }

    if (modo === "criar") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
      });
      setLoading(false);
      if (error) {
        setErro(traduzirErro(error.message));
        return;
      }
      // Supabase (anti-enumeração): e-mail JÁ cadastrado retorna "sucesso"
      // com identities vazio — sem este check o usuário acha que criou uma
      // conta nova e a senha nova nunca vale.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setErro(
          "Este e-mail já tem conta. Entre com sua senha ou use “Esqueci minha senha”.",
        );
        setModo("entrar");
        return;
      }
      // Confirmação de e-mail ativa ⇒ ainda SEM sessão: não adianta ir pra
      // Home (voltaria ao login e pareceria “senha errada”). Atenção: se o
      // e-mail JÁ tinha cadastro pendente, o Supabase reenvia a confirmação
      // ORIGINAL e a senha digitada agora NÃO é salva — por isso a ressalva.
      if (!data.session) {
        setMsg(
          "Confirme seu e-mail pelo link que enviamos — só depois dá para entrar. " +
            "Se este e-mail já tinha um cadastro pendente, vale a senha original; " +
            "esqueceu? Use “Esqueci minha senha” após confirmar.",
        );
        setModo("entrar");
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    // Entrar
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setLoading(false);
    if (error) {
      setErro(traduzirErro(error.message));
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setOferecerReenvio(true);
      }
      return;
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

      {modo !== "recuperar" && (
        <>
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
        </>
      )}

      {erro && <p className="text-sm text-red-400">{erro}</p>}
      {msg && <p className="text-sm text-brand">{msg}</p>}

      {oferecerReenvio && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void reenviarConfirmacao()}
          className="rounded-xl border border-line bg-surface py-2.5 text-sm font-medium text-snow transition-colors hover:border-brand disabled:opacity-60"
        >
          Reenviar e-mail de confirmação
        </button>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-brand py-3 font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      >
        {loading
          ? "Aguarde…"
          : modo === "entrar"
            ? "Entrar"
            : modo === "criar"
              ? "Criar minha conta"
              : "Enviar link de recuperação"}
      </button>

      <div className="mt-1 flex flex-col gap-1 text-center text-sm">
        {modo !== "criar" && (
          <button
            type="button"
            onClick={() => trocarModo("criar")}
            className="text-muted transition-colors hover:text-snow"
          >
            Não tem conta? Criar uma
          </button>
        )}
        {modo !== "entrar" && (
          <button
            type="button"
            onClick={() => trocarModo("entrar")}
            className="text-muted transition-colors hover:text-snow"
          >
            Já tem conta? Entrar
          </button>
        )}
        {modo === "entrar" && (
          <button
            type="button"
            onClick={() => trocarModo("recuperar")}
            className="text-muted transition-colors hover:text-snow"
          >
            Esqueci minha senha
          </button>
        )}
      </div>
    </form>
  );
}
