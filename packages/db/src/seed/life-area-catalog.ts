/**
 * Catálogo das Áreas da Vida canônicas (docs/00-canon.md §3, docs/13 §2.3).
 * `baseXp` = XP-base de referência da Fase 1 (calibrável via PostHog A/B sem
 * mudar a fórmula). Consumido pelo seed de `life_area_catalog`.
 *
 * Ampliado para cobrir mais tópicos (esporte, arte, mente, ofícios, ar livre) —
 * quanto mais Áreas fizerem sentido, mais gente encontra a sua. Toda nova Área
 * precisa de um token de cor `--area-<id>` em `apps/web/app/globals.css`.
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
  // — Núcleo original —
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

  // — Esporte & movimento —
  { id: "corrida", namePt: "Corrida", nameEn: "Running", colorToken: "--area-corrida", icon: "footprints", baseXp: 22 },
  { id: "ciclismo", namePt: "Ciclismo", nameEn: "Cycling", colorToken: "--area-ciclismo", icon: "bike", baseXp: 22 },
  { id: "natacao", namePt: "Natação", nameEn: "Swimming", colorToken: "--area-natacao", icon: "waves", baseXp: 24 },
  { id: "yoga", namePt: "Yoga", nameEn: "Yoga", colorToken: "--area-yoga", icon: "activity", baseXp: 15 },
  { id: "escalada", namePt: "Escalada", nameEn: "Climbing", colorToken: "--area-escalada", icon: "mountain", baseXp: 24 },
  { id: "danca", namePt: "Dança", nameEn: "Dance", colorToken: "--area-danca", icon: "activity", baseXp: 18 },
  { id: "natureza", namePt: "Natureza", nameEn: "Outdoors", colorToken: "--area-natureza", icon: "mountain", baseXp: 18 },

  // — Arte & criação —
  { id: "arte", namePt: "Arte", nameEn: "Art", colorToken: "--area-arte", icon: "palette", baseXp: 15 },
  { id: "escrita", namePt: "Escrita", nameEn: "Writing", colorToken: "--area-escrita", icon: "pen-tool", baseXp: 15 },
  { id: "fotografia", namePt: "Fotografia", nameEn: "Photography", colorToken: "--area-fotografia", icon: "camera", baseXp: 12 },
  { id: "culinaria", namePt: "Culinária", nameEn: "Cooking", colorToken: "--area-culinaria", icon: "utensils", baseXp: 12 },
  { id: "jardinagem", namePt: "Jardinagem", nameEn: "Gardening", colorToken: "--area-jardinagem", icon: "sprout", baseXp: 10 },

  // — Mente & mundo —
  { id: "meditacao", namePt: "Meditação", nameEn: "Meditation", colorToken: "--area-meditacao", icon: "brain", baseXp: 12 },
  { id: "games", namePt: "Games", nameEn: "Gaming", colorToken: "--area-games", icon: "gamepad-2", baseXp: 10 },
  { id: "voluntariado", namePt: "Voluntariado", nameEn: "Volunteering", colorToken: "--area-voluntariado", icon: "heart-handshake", baseXp: 18 },
];
