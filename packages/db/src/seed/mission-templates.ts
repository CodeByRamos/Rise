/**
 * Templates de Missão (doc 13 §6.1). Dois escopos:
 *  - daily  → 3 por dia, rotação determinística por data (variedade sem repetir);
 *  - weekly → 2 por semana, alvos maiores que ligam Foco/Hábitos/Sequências.
 *
 * A ação que avança uma missão pendente ganha mult_missao (aplicado no motor).
 * Métricas são resolvidas em packages/api (action.log) a partir do contexto da
 * ação — foco em minutos, hábitos, sequência, área específica, etc.
 */
export type MissionScope = "daily" | "weekly";

export interface MissionTemplate {
  id: string;
  title: string;
  scope: MissionScope;
  /**
   * acoes | areas_distintas | nota_longa | foco_sessoes | foco_min | habitos |
   * sequencia | area:<catalogId>
   */
  metric: string;
  target: number;
  xpReward: number;
  sparksReward: number;
}

// Pool DIÁRIO — contextual e acionável. 3 são sorteados por dia.
export const DAILY_TEMPLATES: readonly MissionTemplate[] = [
  { id: "primeira-acao", title: "Registre sua primeira ação do dia", scope: "daily", metric: "acoes", target: 1, xpReward: 10, sparksReward: 2 },
  { id: "tres-acoes", title: "Complete 3 ações hoje", scope: "daily", metric: "acoes", target: 3, xpReward: 20, sparksReward: 3 },
  { id: "cinco-acoes", title: "Um dia produtivo: 5 ações", scope: "daily", metric: "acoes", target: 5, xpReward: 30, sparksReward: 4 },
  { id: "duas-areas", title: "Evolua em 2 Áreas da Vida diferentes", scope: "daily", metric: "areas_distintas", target: 2, xpReward: 15, sparksReward: 2 },
  { id: "tres-areas", title: "Equilíbrio: avance em 3 Áreas hoje", scope: "daily", metric: "areas_distintas", target: 3, xpReward: 25, sparksReward: 4 },
  { id: "foco-sessao", title: "Faça 1 sessão de foco", scope: "daily", metric: "foco_sessoes", target: 1, xpReward: 15, sparksReward: 3 },
  { id: "foco-50", title: "Concentre 50 minutos no total hoje", scope: "daily", metric: "foco_min", target: 50, xpReward: 25, sparksReward: 4 },
  { id: "deep-work-90", title: "Deep Work: acumule 90 min de foco", scope: "daily", metric: "foco_min", target: 90, xpReward: 40, sparksReward: 6 },
  { id: "habitos-2", title: "Cumpra 2 hábitos", scope: "daily", metric: "habitos", target: 2, xpReward: 15, sparksReward: 3 },
  { id: "habitos-3", title: "Mantenha a rotina: 3 hábitos", scope: "daily", metric: "habitos", target: 3, xpReward: 25, sparksReward: 4 },
  { id: "reflexao", title: "Registre uma reflexão detalhada", scope: "daily", metric: "nota_longa", target: 1, xpReward: 15, sparksReward: 3 },
  { id: "ciclo-completo", title: "Ciclo completo: foque e registre uma ação", scope: "daily", metric: "foco_sessoes", target: 2, xpReward: 30, sparksReward: 5 },
];

// Pool SEMANAL — alvos de compromisso. 2 são sorteados por semana.
export const WEEKLY_TEMPLATES: readonly MissionTemplate[] = [
  { id: "semana-acoes", title: "Registre 20 ações nesta semana", scope: "weekly", metric: "acoes", target: 20, xpReward: 80, sparksReward: 12 },
  { id: "semana-areas", title: "Evolua em 4 Áreas diferentes na semana", scope: "weekly", metric: "areas_distintas", target: 4, xpReward: 90, sparksReward: 14 },
  { id: "semana-sequencia-5", title: "Mantenha uma sequência de 5 dias", scope: "weekly", metric: "sequencia", target: 5, xpReward: 100, sparksReward: 16 },
  { id: "semana-sequencia-7", title: "Semana perfeita: 7 dias de sequência", scope: "weekly", metric: "sequencia", target: 7, xpReward: 150, sparksReward: 24 },
  { id: "semana-foco-sessoes", title: "Faça 5 sessões de foco na semana", scope: "weekly", metric: "foco_sessoes", target: 5, xpReward: 90, sparksReward: 14 },
  { id: "semana-foco-min", title: "Concentre 300 minutos nesta semana", scope: "weekly", metric: "foco_min", target: 300, xpReward: 120, sparksReward: 20 },
  { id: "semana-habitos", title: "Cumpra 15 hábitos na semana", scope: "weekly", metric: "habitos", target: 15, xpReward: 100, sparksReward: 16 },
  { id: "semana-reflexoes", title: "Escreva 3 reflexões detalhadas", scope: "weekly", metric: "nota_longa", target: 3, xpReward: 70, sparksReward: 10 },
];

/** Compat: alguns consumidores antigos esperam MISSION_TEMPLATES (agora = diários). */
export const MISSION_TEMPLATES = DAILY_TEMPLATES;

/** Hash estável (FNV-1a) — seleção determinística por data, sem Math.random. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * É missão semanal? Cobre o pool fixo ("semana-*") e as de Classe ("classe-*"),
 * geradas dinamicamente para quem declarou uma Classe principal.
 */
export function ehMissaoSemanal(templateId: string): boolean {
  return templateId.startsWith("semana-") || templateId.startsWith("classe-");
}

/** Sorteia `n` templates do pool de forma estável para um dado seed (data/semana). */
export function selecionarMissoes(
  pool: readonly MissionTemplate[],
  seed: string,
  n: number,
): MissionTemplate[] {
  return [...pool]
    .sort((a, b) => hash(a.id + seed) - hash(b.id + seed))
    .slice(0, n);
}
