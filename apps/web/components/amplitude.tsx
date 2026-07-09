"use client";

import {
  fatorAmplitude,
  AMPLITUDE_AREAS_CAP,
  AREA_ATIVA_NIVEL_MIN,
} from "@rise/core";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";

/**
 * Amplitude — o diferencial do Rise tornado legível. Evoluir em VÁRIAS Áreas da
 * Vida amplifica o XP Rise (fator_amplitude), saturando em +28% com 8 áreas
 * ativas. A Home já aplica o bônus; aqui ele vira lever visível: mostra o ganho
 * atual e aponta a próxima área a ativar. Read-only — deriva de `me` + @rise/core.
 */
export function Amplitude() {
  const me = trpc.progress.me.useQuery();
  if (!me.data) {
    return (
      <div className="mt-10 h-40 animate-pulse rounded-[24px] bg-surface-2" />
    );
  }
  const { activeAreas, areas } = me.data;
  const bonus = Math.round((fatorAmplitude(activeAreas) - 1) * 100);
  const bonusMax = Math.round((fatorAmplitude(AMPLITUDE_AREAS_CAP) - 1) * 100);
  const noTeto = activeAreas >= AMPLITUDE_AREAS_CAP;
  const faltam = Math.max(0, AMPLITUDE_AREAS_CAP - activeAreas);
  const fracaoTeto = Math.min(activeAreas / AMPLITUDE_AREAS_CAP, 1);

  // Próxima área a ativar: a mais perto do nível mínimo (maior nível, depois
  // maior fração dentro dele) entre as ainda inativas.
  const quaseAtiva = areas
    .filter((a) => a.nivel < AREA_ATIVA_NIVEL_MIN)
    .sort((a, b) => b.nivel - a.nivel || b.fracao - a.fracao)[0];

  return (
    <section className="mt-10 rounded-[24px] border border-line bg-surface-2 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Amplitude
        </h2>
        <span className="tnum text-xs text-muted">
          {activeAreas} {activeAreas === 1 ? "área ativa" : "áreas ativas"}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="tnum text-4xl font-semibold leading-none text-brand">
          +{bonus}%
        </span>
        <span className="mb-1 text-sm text-muted">no XP Rise</span>
      </div>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Evoluir em várias Áreas da Vida amplifica sua subida. O bônus satura em{" "}
        <span className="font-medium text-snow">+{bonusMax}%</span> com{" "}
        {AMPLITUDE_AREAS_CAP} áreas ativas — área ativa é nível{" "}
        {AREA_ATIVA_NIVEL_MIN} ou acima.
      </p>

      <div className="mt-4">
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-graphite)" }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={AMPLITUDE_AREAS_CAP}
          aria-valuenow={Math.min(activeAreas, AMPLITUDE_AREAS_CAP)}
          aria-label="Áreas ativas rumo ao bônus máximo de amplitude"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width]"
            style={{ width: `${fracaoTeto * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-faint">
          {noTeto
            ? "Amplitude máxima alcançada."
            : `Faltam ${faltam} ${faltam === 1 ? "área ativa" : "áreas ativas"} para o máximo.`}
        </p>
      </div>

      {!noTeto && quaseAtiva && (
        <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="text-faint">próxima a ativar</span>
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: cssColor(quaseAtiva.cor) }}
          />
          <span className="font-medium text-snow">{quaseAtiva.nome}</span>
          <span className="text-faint">
            — leve ao nível {AREA_ATIVA_NIVEL_MIN}
          </span>
        </p>
      )}
    </section>
  );
}
