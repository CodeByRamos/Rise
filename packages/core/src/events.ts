/**
 * Eventos canônicos de gamificação — a API interna do domínio.
 *
 * Spec canônico: `docs/13-gamificacao.md` §12.
 * Toda mecânica emite eventos em `dot.case`, consumidos por `packages/db`,
 * `packages/ai` (RAG/insights), feed (Fase 2), notificações, PostHog e Inngest.
 *
 * Regra de ouro: toda concessão de XP nasce de `xp.granted`; todo nível nasce de
 * `level.up` / `rise.level.up`. Os eventos de cosmético (`sparks.*`, `cosmetic.*`)
 * vivem num namespace ISOLADO do XP — a separação anti pay-to-win é estrutural.
 *
 * Aqui ficam apenas os nomes/tipos canônicos; os payloads tipados completos
 * serão adicionados por evento conforme cada mecânica é implementada.
 */

export const EVENTOS_GAMIFICACAO = [
  "action.logged",
  "action.validated",
  "xp.granted",
  "xp.reversed",
  "level.up",
  "rise.level.up",
  "prestige.entered",
  "skill.node.unlocked",
  "streak.extended",
  "streak.frozen",
  "streak.broken",
  "streak.repaired",
  "rest.mode.toggled",
  "mission.assigned",
  "mission.completed",
  "challenge.joined",
  "challenge.completed",
  "achievement.unlocked",
  "badge.equipped",
  "season.started",
  "season.ended",
  "season.progress",
  "league.promoted",
  "league.demoted",
  "league.week.reset",
  "guild.goal.reached",
  "sparks.earned",
  "sparks.spent",
  "cosmetic.acquired",
  "antifraud.flagged",
] as const;

/** União de todos os nomes de evento canônicos. */
export type EventoGamificacao = (typeof EVENTOS_GAMIFICACAO)[number];

/** Guard de tipo: o nome é um evento canônico conhecido? */
export function isEventoGamificacao(nome: string): nome is EventoGamificacao {
  return (EVENTOS_GAMIFICACAO as readonly string[]).includes(nome);
}
