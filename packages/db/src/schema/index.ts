/**
 * Schema Drizzle do Rise — barrel único consumido pelo drizzle-kit e por @rise/api.
 * Fonte da verdade: docs/08-banco-de-dados.md (+ docs/13 para regras de gamificação).
 *
 * Fase 1 (loop solo) + os três invariantes estruturais:
 *  1. Event sourcing de XP (xp_events append-only; levels/user_stats = projeções) — ADR 0006
 *  2. Isolamento Faíscas × XP (economy.ts sem FK para xp/levels) — ADR 0007
 *  3. Outbox transacional (platform.ts) → Inngest
 *
 * Tabelas de social/guilda/temporada/liga/IA/billing/B2B são documentadas no doc 08
 * e entram nas Fases 2/3 — não implementadas aqui (anti pré-otimização).
 */
export * from "./types";
export * from "./enums";
export * from "./identity";
export * from "./progress";
export * from "./xp";
export * from "./gamification";
export * from "./economy";
export * from "./cosmetics";
export * from "./platform";
