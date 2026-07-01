/**
 * RiseMark — o símbolo da marca: dois chevrons empilhados apontando para cima.
 *
 * Geometria fiel à identidade (Brand Identity 2026): vão de 64u, ângulo de 41°,
 * passo vertical de 26u numa grade de 120u. Topo = Ascent Emerald, base = Ash/Graphite.
 * As coordenadas abaixo reproduzem exatamente esses parâmetros no viewBox 120.
 */

type RiseMarkVariant = "brand" | "mono" | "onEmerald";

interface RiseMarkProps {
  size?: number;
  variant?: RiseMarkVariant;
  className?: string;
}

// apex(topo) y=34, braços y=62 → queda 28 sobre meio-vão 32 = atan(28/32)=41°.
// apex(base) y=60 → passo 26. Braços de x=28 a x=92 → vão 64.
const CHEVRON_TOPO = "M28 62 L60 34 L92 62";
const CHEVRON_BASE = "M28 88 L60 60 L92 88";

const CORES: Record<RiseMarkVariant, { topo: string; base: string }> = {
  brand: { topo: "var(--color-brand)", base: "var(--color-ash)" },
  mono: { topo: "currentColor", base: "currentColor" },
  onEmerald: { topo: "#04231a", base: "#0e5f47" },
};

export function RiseMark({
  size = 28,
  variant = "brand",
  className,
}: RiseMarkProps) {
  const cor = CORES[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="img"
      aria-label="Rise"
    >
      <path
        d={CHEVRON_BASE}
        stroke={cor.base}
        strokeWidth={15}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={variant === "mono" ? 0.4 : 1}
      />
      <path
        d={CHEVRON_TOPO}
        stroke={cor.topo}
        strokeWidth={15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Wordmark completo: símbolo + "Rise" na fonte display com o tracking da marca. */
export function RiseWordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <RiseMark size={size} />
      <span
        className="wordmark leading-none text-snow"
        style={{ fontSize: size * 0.92 }}
      >
        Rise
      </span>
    </span>
  );
}
