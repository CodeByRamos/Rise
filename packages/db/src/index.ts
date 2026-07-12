/**
 * @rise/db — schema Drizzle + acesso a dados do Rise (Postgres/Supabase).
 *
 * Regra de autorização (doc 08 §11): escritas de progresso e economia
 * (xp_events, levels, user_stats, sparks_*, rankings) são NEGADAS ao cliente
 * via RLS e só ocorrem via service_role em mutações tRPC server-side.
 */
export * from "./schema";
export * from "./client";
// Operadores de query re-exportados: consumidores (apps) não dependem de
// drizzle-orm diretamente — a camada de dados é @rise/db.
export { eq, and, or, isNull, desc, asc, gte, lte, inArray, sql } from "drizzle-orm";
export { LIFE_AREA_CATALOG } from "./seed/life-area-catalog";
export type { LifeAreaCatalogSeed } from "./seed/life-area-catalog";
export {
  MISSION_TEMPLATES,
  DAILY_TEMPLATES,
  WEEKLY_TEMPLATES,
  selecionarMissoes,
} from "./seed/mission-templates";
export type { MissionTemplate, MissionScope } from "./seed/mission-templates";
export { COSMETIC_CATALOG } from "./seed/cosmetics";
export type { CosmeticSeed } from "./seed/cosmetics";
