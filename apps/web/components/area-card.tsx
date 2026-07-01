import type { AreaView } from "@/lib/demo";

const nf = new Intl.NumberFormat("pt-BR");

/**
 * AreaCard — uma Área da Vida como "classe" de RPG: nível grande, barra de XP
 * esmeralda e um ponto com a cor semântica da área.
 */
export function AreaCard({ area }: { area: AreaView }) {
  const pct = Math.round(area.fracao * 100);
  return (
    <div className="group rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2.5 rounded-full"
            style={{
              backgroundColor: area.cor,
              boxShadow: `0 0 10px ${area.cor}66`,
            }}
          />
          <span className="text-sm font-semibold text-snow">{area.nome}</span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-faint">
          Nível
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="font-display tnum text-4xl font-semibold leading-none text-snow">
          {area.nivel}
        </span>
        <span className="tnum pb-1 text-xs text-muted">
          {nf.format(area.xpNoNivel)} / {nf.format(area.xpDoNivel)} XP
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-graphite">
        <div
          className="h-full rounded-full bg-brand"
          style={{
            width: `${pct}%`,
            boxShadow: "0 0 8px rgba(16,185,129,0.5)",
          }}
        />
      </div>
    </div>
  );
}
