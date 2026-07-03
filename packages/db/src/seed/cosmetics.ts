/**
 * Catálogo de cosméticos (Fase 2 MVP): molduras de avatar + temas de acento.
 * Preços transparentes em Faíscas. Sem loot box, sem raridade oculta (doc 13 §9.3).
 */
export interface CosmeticSeed {
  id: string;
  name: string;
  kind: "frame" | "theme";
  priceSparks: number;
  preview: Record<string, unknown>;
}

export const COSMETIC_CATALOG: readonly CosmeticSeed[] = [
  // Molduras de avatar (anel colorido/gradiente)
  { id: "frame-emerald", name: "Moldura Esmeralda", kind: "frame", priceSparks: 10, preview: { colors: ["#10b981"] } },
  { id: "frame-azure", name: "Moldura Azul", kind: "frame", priceSparks: 10, preview: { colors: ["#60a5fa"] } },
  { id: "frame-violet", name: "Moldura Violeta", kind: "frame", priceSparks: 15, preview: { colors: ["#a78bfa"] } },
  { id: "frame-ember", name: "Moldura Brasa", kind: "frame", priceSparks: 15, preview: { colors: ["#fb923c", "#f472b6"] } },
  { id: "frame-aurora", name: "Moldura Aurora", kind: "frame", priceSparks: 30, preview: { colors: ["#10b981", "#60a5fa", "#a78bfa"] } },
  { id: "frame-solar", name: "Moldura Solar", kind: "frame", priceSparks: 30, preview: { colors: ["#fbbf24", "#fb923c"] } },
  // Temas de acento (trocam a cor-marca da interface do próprio usuário)
  { id: "theme-azure", name: "Tema Azul Profundo", kind: "theme", priceSparks: 25, preview: { accent: "#60a5fa", strong: "#3b82f6" } },
  { id: "theme-violet", name: "Tema Violeta", kind: "theme", priceSparks: 25, preview: { accent: "#a78bfa", strong: "#8b5cf6" } },
  { id: "theme-solar", name: "Tema Solar", kind: "theme", priceSparks: 25, preview: { accent: "#fbbf24", strong: "#f59e0b" } },
];
