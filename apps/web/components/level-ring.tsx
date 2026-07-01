/**
 * LevelRing — anel de progresso do Nível Rise. SVG puro (server component),
 * sem JS no cliente. O arco esmeralda tem glow contido (feedback AAA, §motion do design).
 */

interface LevelRingProps {
  nivel: number;
  /** Fração 0..1 de progresso rumo ao próximo nível. */
  fracao: number;
  size?: number;
  legenda?: string;
}

export function LevelRing({
  nivel,
  fracao,
  size = 232,
  legenda = "Nível Rise",
}: LevelRingProps) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(fracao, 1)) * circ;
  const center = size / 2;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${legenda} ${nivel}, ${Math.round(fracao * 100)}% para o próximo`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-graphite)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            filter: "drop-shadow(0 0 10px rgba(16,185,129,0.45))",
            transition: "stroke-dasharray 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
          {legenda}
        </span>
        <span className="font-display tnum text-[64px] font-semibold leading-none text-snow">
          {nivel}
        </span>
        <span className="tnum mt-1 text-sm font-medium text-brand">
          {Math.round(fracao * 100)}%
        </span>
      </div>
    </div>
  );
}
