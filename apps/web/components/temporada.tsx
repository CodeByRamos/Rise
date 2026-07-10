"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { SparkIcon, CheckIcon } from "./icons";

const nf = new Intl.NumberFormat("pt-BR");

/**
 * Temporada Solo (doc 13 §7) — ciclo mensal de novidade. XP do mês destrava
 * marcos; resgatar dá Faíscas e, no marco final, a moldura exclusiva do mês.
 * Reset nunca toca XP/nível/conquista — só a trilha recomeça.
 */
export function Temporada() {
  const utils = trpc.useUtils();
  const s = trpc.season.progress.useQuery();
  const [msg, setMsg] = useState<string | null>(null);
  const claim = trpc.season.claim.useMutation({
    onSuccess: (res) => {
      setMsg(
        res.molduraGanha
          ? `+${res.sparksGanhas} Faíscas · ${res.molduraGanha} desbloqueada`
          : `+${res.sparksGanhas} Faíscas resgatadas`,
      );
      void utils.season.progress.invalidate();
      void utils.progress.me.invalidate();
      void utils.profile.get.invalidate();
      window.setTimeout(() => setMsg(null), 3200);
    },
    onError: (e) => {
      setMsg(e.message);
      window.setTimeout(() => setMsg(null), 3200);
    },
  });

  if (!s.data) return null;
  const { nome, diasRestantes, xpMes, marcos, moldura } = s.data;
  const ultimo = marcos[marcos.length - 1]!;
  const fracao = Math.min(xpMes / ultimo.xp, 1);
  const resgatavel = marcos.find((m) => m.alcancado && !m.resgatado);

  return (
    <section className="animate-rise-in mt-10" style={{ animationDelay: "105ms" }}>
      <div className="rounded-[24px] border border-line bg-surface-2 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
            {nome}
          </h2>
          <span className="tnum text-xs text-muted">
            {diasRestantes} {diasRestantes === 1 ? "dia restante" : "dias restantes"} ·{" "}
            {nf.format(xpMes)} XP no mês
          </span>
        </div>

        {/* Trilha de marcos */}
        <div className="mt-5">
          <div className="relative h-2 overflow-hidden rounded-full bg-graphite">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
              style={{ width: `${fracao * 100}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between">
            {marcos.map((m) => {
              const podeResgatar = m.alcancado && !m.resgatado;
              return (
                <button
                  key={m.xp}
                  type="button"
                  disabled={!podeResgatar || claim.isPending}
                  onClick={() => claim.mutate({ milestoneXp: m.xp })}
                  title={
                    m.moldura
                      ? `${nf.format(m.xp)} XP — +${m.sparks} Faíscas + ${moldura.name}`
                      : `${nf.format(m.xp)} XP — +${m.sparks} Faíscas`
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-center transition-colors ${
                    podeResgatar
                      ? "cursor-pointer bg-brand/10 hover:bg-brand/20"
                      : ""
                  }`}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full border ${
                      m.resgatado
                        ? "border-brand bg-brand text-void"
                        : m.alcancado
                          ? "border-brand text-brand"
                          : "border-line text-faint"
                    }`}
                  >
                    {m.resgatado ? (
                      <CheckIcon size={13} />
                    ) : m.moldura ? (
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${moldura.colors.join(", ")})`,
                        }}
                      />
                    ) : (
                      <SparkIcon size={11} />
                    )}
                  </span>
                  <span className="tnum text-[10px] text-faint">
                    {nf.format(m.xp)}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      podeResgatar ? "text-brand" : "text-muted"
                    }`}
                  >
                    {m.resgatado
                      ? "resgatado"
                      : podeResgatar
                        ? "resgatar"
                        : m.moldura
                          ? "moldura"
                          : `+${m.sparks}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {resgatavel && !msg && (
          <p className="mt-3 text-xs text-brand">
            Marco de {nf.format(resgatavel.xp)} XP alcançado — toque para resgatar.
          </p>
        )}
        {msg && <p className="mt-3 text-xs font-medium text-brand">{msg}</p>}
      </div>
    </section>
  );
}
