"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { RiseMark } from "./rise-mark";

const SUGESTOES = [
  "Por onde começo hoje?",
  "Como está minha evolução esta semana?",
  "Estou sem tempo — o que priorizo?",
];

/**
 * Coach conversacional (Sonnet, cota no Free). Um mentor ancorado nos dados
 * reais do usuário — nunca um chatbot. A cota diária protege o custo de IA no
 * Free; o Rise+ libera conversas ilimitadas.
 */
export function CoachClient() {
  const utils = trpc.useUtils();
  const historico = trpc.coach.historico.useQuery(undefined, {
    staleTime: 10_000,
  });
  const quota = trpc.coach.quota.useQuery();
  const [texto, setTexto] = useState("");
  const [pendente, setPendente] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  const conversar = trpc.coach.conversar.useMutation({
    onSuccess: () => {
      setPendente(null);
      void utils.coach.historico.invalidate();
      void utils.coach.quota.invalidate();
    },
    onError: (e) => {
      setErro(e.message);
      setPendente(null);
    },
  });

  const msgs = historico.data ?? [];

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, pendente, conversar.isPending]);

  const semCota =
    quota.data && !quota.data.ilimitado && (quota.data.restante ?? 0) <= 0;

  function enviar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || conversar.isPending) return;
    setErro(null);
    setPendente(t);
    setTexto("");
    conversar.mutate({ texto: t });
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      {/* Cota / estado */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-muted">
          <RiseMark size={18} className="shrink-0" />
          Seu mentor, ancorado nos seus números reais.
        </p>
        {quota.data &&
          (quota.data.ilimitado ? (
            <span className="rounded-[var(--radius-pill)] border border-brand/40 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
              Ilimitado
            </span>
          ) : (
            <span className="tnum rounded-[var(--radius-pill)] border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
              {quota.data.restante} de conversas hoje
            </span>
          ))}
      </div>

      {/* Conversa */}
      <div className="flex-1 space-y-4">
        {msgs.length === 0 && !pendente && (
          <div className="rounded-[20px] border border-line bg-surface-2 p-6">
            <p className="text-sm leading-relaxed text-muted">
              Pergunte o que quiser sobre sua evolução. Eu leio suas Áreas,
              sequências, missões e metas — e oriento o próximo passo. Sem culpa,
              sem números inventados.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTexto(s)}
                  className="rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-snow"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) => (
          <Bolha key={m.id} role={m.role} texto={m.content} />
        ))}
        {pendente && <Bolha role="user" texto={pendente} />}
        {conversar.isPending && (
          <div className="flex items-center gap-2 text-sm text-faint">
            <RiseMark size={16} />
            <span className="inline-flex gap-1">
              <Ponto /> <Ponto /> <Ponto />
            </span>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

      {semCota ? (
        <div className="mt-4 rounded-[20px] border border-brand/40 bg-brand/[0.06] p-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            Você aproveitou bastante o Coach hoje. O Rise+ libera conversas
            ilimitadas e a Análise Profunda semanal.
          </p>
          <Link
            href="/rise-plus"
            className="mt-3 inline-flex rounded-[var(--radius-pill)] bg-brand px-4 py-2 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Conhecer o Rise+
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-4 flex items-end gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(e);
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Escreva para o Coach…"
            className="max-h-32 flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-brand"
          />
          <button
            type="submit"
            disabled={!texto.trim() || conversar.isPending}
            className="shrink-0 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

function Bolha({ role, texto }: { role: string; texto: string }) {
  const eu = role === "user";
  return (
    <div className={`flex gap-2.5 ${eu ? "flex-row-reverse" : ""}`}>
      {!eu && <RiseMark size={22} className="mt-1 shrink-0" />}
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          eu
            ? "bg-brand/15 text-snow"
            : "border border-line bg-surface-2 text-muted"
        }`}
      >
        {texto}
      </div>
    </div>
  );
}

function Ponto() {
  return (
    <span className="size-1.5 animate-pulse rounded-full bg-current [animation-duration:1s]" />
  );
}
