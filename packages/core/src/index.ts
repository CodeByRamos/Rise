/**
 * @rise/core — domínio puro do Rise.
 *
 * Anel mais interno da arquitetura (ver `docs/16-estrutura-pastas.md`): TypeScript
 * puro, sem React/Drizzle/Next/tRPC. É a fonte da verdade do cálculo de XP,
 * níveis, streaks e Nível Rise — consumida por servidor (verdade) e cliente
 * (optimistic UI), Coach de IA e jobs.
 */

export * from "./xp/curve";
export * from "./xp/grant";
export * from "./streak/streak";
export * from "./streak/engine";
export * from "./level/rise-level";
export * from "./skill/tree";
export * from "./achievement/catalog";
export * from "./class/catalog";
export * from "./action/templates";
export * from "./season/season";
export * from "./events";
