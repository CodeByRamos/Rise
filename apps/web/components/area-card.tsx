"use client";

const nf = new Intl.NumberFormat("pt-BR");

export interface AreaCardProps {
  nome: string;
  cor: string;
  nivel: number;
  fracao: number;
  xpNoNivel: number;
  xpDoNivel: number;
  onRegister?: () => void;
}

/**
 * AreaCard — uma Área da Vida como "classe" de RPG. Clicável: registra uma ação
 * naquela área (optimistic +XP). A barra anima a fração de progresso.
 */
export function AreaCard({
  nome,
  cor,
  nivel,
  fracao,
  xpNoNivel,
  xpDoNivel,
  onRegister,
}: AreaCardProps) {
  const pct = Math.round(fracao * 100);
  return (
    <button
      type="button"
      onClick={onRegister}
      aria-label={`Registrar ação em ${nome}`}
      className="group w-full rounded-[var(--radius-card)] border border-line bg-surface p-5 text-left transition-colors hover:border-[color-mix(in_srgb,var(--color-brand)_45%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: cor, boxShadow: `0 0 10px ${cor}66` }}
          />
          <span className="text-sm font-semibold text-snow">{nome}</span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-faint opacity-0 transition-opacity group-hover:opacity-100">
          registrar +
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="font-display tnum text-4xl font-semibold leading-none text-snow">
          {nivel}
        </span>
        <span className="tnum pb-1 text-xs text-muted">
          {nf.format(xpNoNivel)} / {nf.format(xpDoNivel)} XP
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-graphite">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(16,185,129,0.5)" }}
        />
      </div>
    </button>
  );
}
