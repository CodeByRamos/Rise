/**
 * Tokens do design system (espelho de apps/web/app/globals.css — Brand
 * Identity 2026). Dark é o único tema do MVP mobile. Quando o build de
 * tokens (packages/ui/tokens) existir, este arquivo passa a ser gerado.
 */
export const cores = {
  void: "#0a0b0d",
  graphite: "#1a1d22",
  ash: "#3a3f47",
  snow: "#f4f5f7",
  brand: "#10b981",
  brandStrong: "#0e9f6e",
  surface: "#101319",
  surface2: "#161a21",
  line: "rgba(244,245,247,0.08)",
  muted: "#8b929c",
  faint: "#5b616b",
  erro: "#f87171",
} as const;

export const raio = {
  card: 20,
  pill: 999,
} as const;
