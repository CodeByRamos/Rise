"use client";

import { useState } from "react";
import { arvoreDaArea } from "@rise/core";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";
import { CheckIcon, LockIcon } from "./icons";
import { GerenciarAreas } from "./gerenciar-areas";
import { Amplitude } from "./amplitude";
import { ResumoSemana } from "./resumo-semana";
import { Metas } from "./metas";
import { AnaliseProfunda } from "./analise-profunda";
import { Heatmap } from "./heatmap";

const nf = new Intl.NumberFormat("pt-BR");

/**
 * Árvore de Habilidade por Área da Vida (doc 13 §4): tronco de nós destravados
 * pelo Nível de Área. Identidade e status — nunca poder competitivo.
 */
export function EvolucaoClient() {
  const me = trpc.progress.me.useQuery();
  const [areaSel, setAreaSel] = useState<string | null>(null);

  if (!me.data) {
    return <div className="h-96 animate-pulse rounded-[20px] bg-surface" />;
  }
  const areas = me.data.areas;
  if (areas.length === 0) {
    return (
      <p className="text-sm text-muted">
        Registre sua primeira ação para abrir suas Áreas da Vida.
      </p>
    );
  }

  const area = areas.find((a) => a.id === areaSel) ?? areas[0]!;
  const arvore = arvoreDaArea(area.nivel);
  const cor = cssColor(area.cor);
  const desbloqueados = arvore.filter((n) => n.desbloqueado).length;

  return (
    <div>
      {/* Seletor de área */}
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => {
          const ativo = a.id === area.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAreaSel(a.id)}
              aria-pressed={ativo}
              className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3.5 py-2 text-xs font-medium transition-colors ${
                ativo
                  ? "border-brand bg-brand/10 text-snow"
                  : "border-line bg-surface text-muted hover:text-snow"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: cssColor(a.cor) }}
              />
              {a.nome}
              <span className="tnum text-faint">{a.nivel}</span>
            </button>
          );
        })}
      </div>

      {/* Cabeçalho da área */}
      <div className="mt-6 flex items-end justify-between rounded-[20px] border border-line bg-surface-2 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
            {area.nome}
          </p>
          <p className="font-display tnum mt-1 text-3xl font-semibold leading-none text-snow">
            Nível {area.nivel}
          </p>
        </div>
        <div className="text-right">
          <p className="tnum text-xs text-muted">
            {nf.format(area.xpNoNivel)} / {nf.format(area.xpDoNivel)} XP
          </p>
          <p className="tnum mt-0.5 text-xs text-faint">
            {desbloqueados}/{arvore.length} nós
          </p>
        </div>
      </div>

      {/* Tronco */}
      <ol className="relative mt-8 space-y-0 pl-5">
        <span
          aria-hidden
          className="absolute bottom-4 left-[27px] top-4 w-px bg-line"
        />
        {arvore.map((no) => (
          <li key={no.nivel} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Nó */}
            <span
              className={`relative z-10 mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border ${
                no.desbloqueado
                  ? "border-transparent text-void"
                  : no.proximo
                    ? "border-brand bg-surface text-brand"
                    : "border-line bg-surface text-faint"
              }`}
              style={
                no.desbloqueado
                  ? {
                      background: cor,
                      boxShadow: `0 0 14px color-mix(in srgb, ${cor} 45%, transparent)`,
                    }
                  : undefined
              }
            >
              {no.desbloqueado ? (
                <CheckIcon size={15} />
              ) : no.proximo ? (
                <span className="tnum text-[11px] font-bold">{no.nivel}</span>
              ) : (
                <LockIcon size={13} />
              )}
            </span>
            <div
              className={`min-w-0 pt-1 ${no.desbloqueado || no.proximo ? "" : "opacity-50"}`}
            >
              <div className="flex items-baseline gap-2">
                <h3
                  className={`font-display text-base font-semibold ${
                    no.desbloqueado ? "text-snow" : "text-muted"
                  }`}
                >
                  {no.titulo}
                </h3>
                <span className="tnum text-[11px] text-faint">
                  nível {no.nivel}
                </span>
                {no.proximo && (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                    próximo
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {no.descricao}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Amplitude />
      <ResumoSemana />
      <Metas />
      <AnaliseProfunda />
      <Heatmap />
      <GerenciarAreas />
    </div>
  );
}
