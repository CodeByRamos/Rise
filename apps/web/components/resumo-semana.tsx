"use client";

import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";
import { SparkIcon, ChevronUpIcon } from "./icons";

const nf = new Intl.NumberFormat("pt-BR");

/**
 * Momentum dos últimos 7 dias — XP da semana, tendência vs. semana anterior,
 * ações registradas e a Área em ascensão. Complementa o heatmap: este mostra
 * magnitude e direção; o heatmap, frequência. Tendência de queda em tom neutro
 * (filosofia Rise: acompanhar, nunca culpar).
 */
export function ResumoSemana() {
  const r = trpc.progress.resumoSemana.useQuery();
  if (!r.data) {
    return (
      <div className="mt-10 h-40 animate-pulse rounded-[24px] bg-surface-2" />
    );
  }
  const { xp7, tendencia, acoes7, topArea } = r.data;
  const subiu = tendencia !== null && tendencia >= 0;

  return (
    <section className="mt-10 rounded-[24px] border border-line bg-surface-2 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Esta semana
        </h2>
        {tendencia !== null ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              subiu ? "text-brand" : "text-muted"
            }`}
          >
            <ChevronUpIcon size={13} className={subiu ? "" : "rotate-180"} />
            {subiu ? "+" : ""}
            {tendencia}% vs. semana passada
          </span>
        ) : (
          <span className="text-xs text-faint">primeira semana</span>
        )}
      </div>

      <div className="mt-5 flex items-end gap-2">
        <SparkIcon size={22} className="mb-1 text-brand" />
        <span className="tnum text-4xl font-semibold leading-none text-snow">
          {nf.format(xp7)}
        </span>
        <span className="mb-1 text-sm text-muted">XP</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-muted">
          <span className="tnum font-medium text-snow">{nf.format(acoes7)}</span>{" "}
          {acoes7 === 1 ? "ação" : "ações"}
        </span>
        {topArea && (
          <span className="inline-flex items-center gap-2 text-muted">
            <span className="text-faint">em ascensão</span>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: cssColor(topArea.cor) }}
            />
            <span className="font-medium text-snow">{topArea.nome}</span>
          </span>
        )}
      </div>
    </section>
  );
}
