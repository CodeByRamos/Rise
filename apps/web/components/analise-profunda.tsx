"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { SparklesIcon, LockIcon, ChevronUpIcon } from "./icons";

const dtf = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/** Render mínimo do Markdown do Coach: ## títulos, listas e **negrito**. */
function Markdown({ texto }: { texto: string }) {
  const linhas = texto.split("\n");
  const blocos: React.ReactNode[] = [];
  let lista: string[] = [];

  const fecharLista = (chave: string) => {
    if (lista.length === 0) return;
    blocos.push(
      <ul key={`ul-${chave}`} className="my-2 space-y-1.5">
        {lista.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
            <ChevronUpIcon size={14} className="mt-1 shrink-0 text-brand" />
            <span>{inline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    lista = [];
  };

  linhas.forEach((raw, idx) => {
    const l = raw.trim();
    if (!l) {
      fecharLista(String(idx));
      return;
    }
    if (l.startsWith("## ")) {
      fecharLista(String(idx));
      blocos.push(
        <h3
          key={idx}
          className="font-display mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-faint first:mt-0"
        >
          {l.slice(3)}
        </h3>,
      );
      return;
    }
    if (l.startsWith("# ")) {
      fecharLista(String(idx));
      blocos.push(
        <h3 key={idx} className="font-display mt-4 text-base font-semibold text-snow first:mt-0">
          {l.slice(2)}
        </h3>,
      );
      return;
    }
    if (/^[-*]\s+/.test(l) || /^\d+[.)]\s+/.test(l)) {
      lista.push(l.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, ""));
      return;
    }
    fecharLista(String(idx));
    blocos.push(
      <p key={idx} className="mt-2 text-sm leading-relaxed text-muted first:mt-0">
        {inline(l)}
      </p>,
    );
  });
  fecharLista("fim");
  return <>{blocos}</>;
}

/** Negrito inline (**...**) → <strong>. */
function inline(texto: string): React.ReactNode {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-snow">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

/**
 * Análise Profunda semanal (Opus, Rise+). Free vê o convite honesto; Premium
 * gera/relê a análise da semana. Nunca bloqueia progressão — só profundidade.
 */
export function AnaliseProfunda() {
  const utils = trpc.useUtils();
  const latest = trpc.analysis.latest.useQuery();
  const gerar = trpc.analysis.gerar.useMutation({
    onSuccess: () => utils.analysis.latest.invalidate(),
  });

  if (!latest.data) {
    return <div className="mt-8 h-40 animate-pulse rounded-[20px] bg-surface" />;
  }

  const { isPremium, analise, podeGerar } = latest.data;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon size={16} className="text-brand" />
        <h2 className="font-display text-lg font-semibold text-snow">
          Análise Profunda
        </h2>
        <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
          Rise+
        </span>
      </div>

      {!isPremium ? (
        <div className="rounded-[20px] border border-line bg-surface-2 p-6">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
            <LockIcon size={16} className="mt-0.5 shrink-0 text-faint" />
            <span>
              Toda semana, o Coach lê suas estatísticas e escreve uma leitura
              estratégica da sua evolução — correlações entre Áreas e até 3
              alavancas para a próxima semana. Sua progressão continua 100%
              gratuita; isto é profundidade de leitura, não vantagem.
            </span>
          </p>
          <Link
            href="/rise-plus"
            className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-brand px-4 py-2.5 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Conhecer o Rise+
          </Link>
        </div>
      ) : (
        <div className="rounded-[20px] border border-line bg-surface-2 p-6">
          {analise ? (
            <>
              <p className="tnum mb-3 text-xs text-faint">
                Semana de {dtf.format(new Date(analise.periodStart))} —{" "}
                {dtf.format(new Date(analise.periodEnd))}
              </p>
              <Markdown texto={analise.content} />
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              Sua primeira Análise Profunda está a um clique. O Coach vai ler a
              semana e trazer as alavancas que mais importam.
            </p>
          )}

          {gerar.error && (
            <p className="mt-3 text-sm text-red-400">{gerar.error.message}</p>
          )}

          {(podeGerar || !analise) && (
            <button
              type="button"
              disabled={gerar.isPending}
              onClick={() => gerar.mutate()}
              className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-brand px-4 py-2.5 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <SparklesIcon size={15} />
              {gerar.isPending
                ? "Analisando sua semana…"
                : analise
                  ? "Gerar análise desta semana"
                  : "Gerar minha primeira análise"}
            </button>
          )}
          {!podeGerar && analise && (
            <p className="mt-3 text-xs text-faint">
              Próxima análise disponível na virada da semana.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
