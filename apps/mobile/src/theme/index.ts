/**
 * Design system do Rise mobile — fonte da verdade dos tokens (espelho de
 * apps/web/app/globals.css, Brand Identity 2026). Dark é o único tema.
 *
 * Quando packages/ui/tokens existir (docs/16, docs/18 M4), este arquivo passa a
 * ser gerado a partir dele. Até lá, é a referência única — nenhum componente usa
 * cor/tamanho hardcoded fora daqui.
 */

export const cores = {
  void: "#0a0b0d",
  graphite: "#1a1d22",
  ash: "#3a3f47",
  snow: "#f4f5f7",
  brand: "#10b981",
  brandStrong: "#0e9f6e",
  brandSoft: "rgba(16,185,129,0.12)",
  surface: "#101319",
  surface2: "#161a21",
  surface3: "#1c212a",
  line: "rgba(244,245,247,0.08)",
  lineStrong: "rgba(244,245,247,0.14)",
  muted: "#8b929c",
  faint: "#5b616b",
  erro: "#f87171",
  aviso: "#fbbf24",
  overlay: "rgba(10,11,13,0.86)",
} as const;

export const raio = {
  sm: 10,
  md: 14,
  card: 20,
  lg: 24,
  pill: 999,
} as const;

/** Escala de espaçamento (base 4) — consistência de ritmo vertical/horizontal. */
export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Escala tipográfica. `display` usa a família da marca (Sora, quando a fonte for
 * carregada via expo-font); por ora system com peso/kerning aproximados. Números
 * grandes de XP/nível devem usar `tabular` para não "dançar" ao animar.
 */
export const tipo = {
  display: { fontSize: 44, fontWeight: "800", letterSpacing: -1.2 },
  h1: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "700" },
  corpo: { fontSize: 15, fontWeight: "500" },
  corpoForte: { fontSize: 15, fontWeight: "700" },
  peq: { fontSize: 13, fontWeight: "500" },
  micro: { fontSize: 11, fontWeight: "600", letterSpacing: 1.5 },
} as const;

export const sombra = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export type NomeCor = keyof typeof cores;
