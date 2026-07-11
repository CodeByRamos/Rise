"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TRPCProvider } from "@/lib/trpc/provider";
import { trpc } from "@/lib/trpc/react";
import { RiseWordmark } from "./rise-mark";
import { CrownIcon, CheckIcon, SparkIcon } from "./icons";

type PlanoKey = "plus_mensal" | "plus_anual" | "founder";

interface Plano {
  key: PlanoKey;
  nome: string;
  preco: string;
  cadencia: string;
  nota?: string;
  destaque?: boolean;
  selo?: string;
}

const PLANOS: Plano[] = [
  {
    key: "plus_mensal",
    nome: "Rise+ Mensal",
    preco: "R$ 29,90",
    cadencia: "por mês",
    nota: "Sem fidelidade. Cancele quando quiser.",
  },
  {
    key: "plus_anual",
    nome: "Rise+ Anual",
    preco: "R$ 199",
    cadencia: "por ano",
    nota: "~R$ 16,58/mês · economize ~45%",
    destaque: true,
    selo: "Melhor valor",
  },
  {
    key: "founder",
    nome: "Rise Founder",
    preco: "R$ 299",
    cadencia: "pagamento único",
    nota: "Vitalício · vagas limitadas · selo Founder permanente",
  },
];

const BENEFICIOS = [
  "Coach diário ilimitado (Sonnet)",
  "Análise Profunda semanal (Opus) sobre suas estatísticas",
  "Estatísticas profundas + histórico ilimitado e correlações",
  "Estipêndio mensal de Faíscas",
  "Temas, molduras e efeitos exclusivos",
  "Votação no roadmap do Rise",
];

function Conteudo() {
  const router = useRouter();
  const status = trpc.subscription.status.useQuery();
  const [carregando, setCarregando] = useState<PlanoKey | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const jaPremium = status.data?.isPremium ?? false;

  async function assinar(plano: PlanoKey) {
    setCarregando(plano);
    setAviso(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano }),
      });
      if (res.status === 401) {
        router.push("/entrar");
        return;
      }
      const data = (await res.json()) as {
        url?: string;
        configured?: boolean;
        error?: string;
      };
      if (data.configured === false) {
        setAviso(
          "Assinaturas abrindo em breve — estamos finalizando o pagamento. Enquanto isso, todo o Rise segue liberado no plano gratuito.",
        );
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setAviso(data.error ?? "Não foi possível iniciar o checkout agora.");
    } catch {
      setAviso("Falha de conexão. Tente novamente em instantes.");
    } finally {
      setCarregando(null);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl px-5 pb-24 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Início">
          <RiseWordmark size={24} />
        </Link>
        <Link
          href="/perfil"
          className="text-xs font-semibold text-muted transition-colors hover:text-snow"
        >
          Voltar
        </Link>
      </header>

      {/* Hero */}
      <div className="animate-rise-in mt-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
          <CrownIcon size={14} /> Rise+
        </span>
        <h1 className="font-display mx-auto mt-5 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight text-snow sm:text-4xl">
          A vida é grátis. A inteligência é Rise+.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted sm:text-base">
          Sua progressão — XP, níveis, streaks, conquistas — é 100% gratuita, para
          sempre. O Rise+ aprofunda a leitura da sua evolução: mais inteligência de
          IA, mais clareza de dados e mais beleza. Nunca vantagem competitiva.
        </p>
      </div>

      {jaPremium && (
        <div className="animate-rise-in mx-auto mt-8 flex max-w-md items-center justify-center gap-2 rounded-[16px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
          <CheckIcon size={16} /> Você já é Rise+. Obrigado por evoluir com a gente.
        </div>
      )}

      {/* Planos */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {PLANOS.map((p) => (
          <div
            key={p.key}
            className={`animate-rise-in relative flex flex-col rounded-[24px] border p-6 ${
              p.destaque
                ? "border-brand/60 bg-surface-2 shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)]"
                : "border-line bg-surface-2"
            }`}
          >
            {p.selo && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-void">
                {p.selo}
              </span>
            )}
            <p className="text-sm font-semibold text-snow">{p.nome}</p>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display tnum text-3xl font-semibold text-snow">
                {p.preco}
              </span>
              <span className="text-xs text-faint">{p.cadencia}</span>
            </div>
            {p.nota && (
              <p className="mt-2 min-h-[2.5rem] text-xs leading-relaxed text-muted">
                {p.nota}
              </p>
            )}
            <button
              type="button"
              disabled={jaPremium || carregando !== null}
              onClick={() => void assinar(p.key)}
              className={`mt-5 inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 ${
                p.destaque
                  ? "bg-brand text-void"
                  : "border border-line bg-surface text-snow hover:border-brand"
              }`}
            >
              {carregando === p.key
                ? "Abrindo…"
                : jaPremium
                  ? "Plano ativo"
                  : "Assinar"}
            </button>
          </div>
        ))}
      </div>

      {aviso && (
        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-muted">
          {aviso}
        </p>
      )}

      {/* Benefícios */}
      <div className="mx-auto mt-14 max-w-xl">
        <h2 className="font-display text-center text-lg font-semibold text-snow">
          Tudo que o Rise+ destrava
        </h2>
        <ul className="mt-6 space-y-3">
          {BENEFICIOS.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                <CheckIcon size={13} />
              </span>
              <span className="text-sm leading-relaxed text-muted">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Honestidade */}
      <div className="mx-auto mt-14 max-w-xl rounded-[20px] border border-line bg-surface p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-snow">
          <SparkIcon size={15} className="text-brand" /> Nossa promessa
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>• Cancelar é tão fácil quanto assinar — em um clique, sem labirinto.</li>
          <li>• Voltar ao Free nunca apaga seu XP, níveis, conquistas ou histórico.</li>
          <li>• Sem loot box, sem pay-to-win, sem FOMO artificial. Preço sempre visível.</li>
          <li>• 7 dias de teste. Avisamos antes de qualquer cobrança.</li>
        </ul>
      </div>
    </div>
  );
}

export function PlanosClient() {
  return (
    <TRPCProvider>
      <main className="relative min-h-dvh overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(16,185,129,0.10), transparent 70%)",
          }}
        />
        <div className="relative">
          <Conteudo />
        </div>
      </main>
    </TRPCProvider>
  );
}
