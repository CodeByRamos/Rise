/**
 * Templates de Missão diária (heurística L0 — doc 13 §6.1, doc 14 §3.2).
 * Máx. 3 ativas/dia; alcançáveis; recompensa = XP + Faíscas ao concluir.
 * A ação que avança missão pendente ganha mult_missao (aplicado no motor).
 */
export interface MissionTemplate {
  id: string;
  title: string;
  metric: "acoes" | "areas_distintas" | "nota_longa";
  target: number;
  xpReward: number;
  sparksReward: number;
}

export const MISSION_TEMPLATES: readonly MissionTemplate[] = [
  {
    id: "primeira-acao",
    title: "Registre sua primeira ação do dia",
    metric: "acoes",
    target: 1,
    xpReward: 10,
    sparksReward: 2,
  },
  {
    id: "tres-acoes",
    title: "Registre 3 ações hoje",
    metric: "acoes",
    target: 3,
    xpReward: 20,
    sparksReward: 3,
  },
  {
    id: "duas-areas",
    title: "Evolua em 2 Áreas da Vida diferentes",
    metric: "areas_distintas",
    target: 2,
    xpReward: 15,
    sparksReward: 2,
  },
];
