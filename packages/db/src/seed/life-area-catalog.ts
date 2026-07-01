/**
 * Catálogo das 15 Áreas da Vida canônicas (docs/00-canon.md §3, docs/13 §2.3).
 * `baseXp` = XP-base de referência da Fase 1 (calibrável via PostHog A/B sem
 * mudar a fórmula). Consumido pelo seed de `life_area_catalog`.
 */
export interface LifeAreaCatalogSeed {
  id: string;
  namePt: string;
  nameEn: string;
  colorToken: string;
  icon: string;
  baseXp: number;
}

export const LIFE_AREA_CATALOG: readonly LifeAreaCatalogSeed[] = [
  { id: "estudos", namePt: "Estudos", nameEn: "Studies", colorToken: "--area-estudos", icon: "book-open", baseXp: 15 },
  { id: "programacao", namePt: "Programação", nameEn: "Programming", colorToken: "--area-programacao", icon: "code", baseXp: 20 },
  { id: "academia", namePt: "Academia", nameEn: "Gym", colorToken: "--area-academia", icon: "dumbbell", baseXp: 30 },
  { id: "saude", namePt: "Saúde", nameEn: "Health", colorToken: "--area-saude", icon: "heart-pulse", baseXp: 10 },
  { id: "sono", namePt: "Sono", nameEn: "Sleep", colorToken: "--area-sono", icon: "moon", baseXp: 20 },
  { id: "alimentacao", namePt: "Alimentação", nameEn: "Nutrition", colorToken: "--area-alimentacao", icon: "apple", baseXp: 8 },
  { id: "leitura", namePt: "Leitura", nameEn: "Reading", colorToken: "--area-leitura", icon: "book", baseXp: 12 },
  { id: "financas", namePt: "Finanças", nameEn: "Finance", colorToken: "--area-financas", icon: "wallet", baseXp: 15 },
  { id: "idiomas", namePt: "Idiomas", nameEn: "Languages", colorToken: "--area-idiomas", icon: "languages", baseXp: 12 },
  { id: "musica", namePt: "Música", nameEn: "Music", colorToken: "--area-musica", icon: "music", baseXp: 15 },
  { id: "surf", namePt: "Surf", nameEn: "Surf", colorToken: "--area-surf", icon: "waves", baseXp: 20 },
  { id: "skate", namePt: "Skate", nameEn: "Skate", colorToken: "--area-skate", icon: "activity", baseXp: 20 },
  { id: "espiritualidade", namePt: "Espiritualidade", nameEn: "Spirituality", colorToken: "--area-espiritualidade", icon: "sparkles", baseXp: 10 },
  { id: "relacionamentos", namePt: "Relacionamentos", nameEn: "Relationships", colorToken: "--area-relacionamentos", icon: "users", baseXp: 10 },
  { id: "trabalho", namePt: "Trabalho", nameEn: "Work", colorToken: "--area-trabalho", icon: "briefcase", baseXp: 15 },
];
