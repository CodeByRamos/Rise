/**
 * @rise/db — schema Drizzle + acesso a dados do Rise (Postgres/Supabase).
 *
 * Regra de autorização (doc 08 §11): escritas de progresso e economia
 * (xp_events, levels, user_stats, sparks_*, rankings) são NEGADAS ao cliente
 * via RLS e só ocorrem via service_role em mutações tRPC server-side.
 */
export * from "./schema";
export * from "./client";
export { LIFE_AREA_CATALOG } from "./seed/life-area-catalog";
export type { LifeAreaCatalogSeed } from "./seed/life-area-catalog";
export { MISSION_TEMPLATES } from "./seed/mission-templates";
export type { MissionTemplate } from "./seed/mission-templates";
