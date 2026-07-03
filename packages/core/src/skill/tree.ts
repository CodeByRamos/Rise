/**
 * Skill Tree — tronco genérico por Área da Vida (doc 13 §4).
 * Nós destravam por Nível de Área; concedem identidade/status, nunca poder
 * competitivo. Template único serve áreas padrão e personalizadas (§4.4).
 * Ramos por marcos (Conquistas) entram numa iteração futura.
 */

export interface SkillNodeDef {
  nivel: number;
  titulo: string;
  descricao: string;
}

export const TRONCO_PADRAO: readonly SkillNodeDef[] = [
  { nivel: 1, titulo: "Despertar", descricao: "A primeira subida. Toda jornada começa com uma ação provada." },
  { nivel: 2, titulo: "Ritmo", descricao: "Duas marchas acima. O corpo começa a pedir a próxima ação." },
  { nivel: 3, titulo: "Consistência", descricao: "Não é sorte: é padrão. Você volta." },
  { nivel: 4, titulo: "Foco", descricao: "Menos ruído, mais progresso por ação." },
  { nivel: 5, titulo: "Dedicação", descricao: "A área virou parte da sua semana." },
  { nivel: 7, titulo: "Disciplina", descricao: "Você age mesmo nos dias em que não dá vontade." },
  { nivel: 10, titulo: "Maestria I", descricao: "Dois dígitos. Poucos chegam; você chegou." },
  { nivel: 13, titulo: "Fluxo", descricao: "A prática ficou natural — quase silenciosa." },
  { nivel: 16, titulo: "Profundidade", descricao: "Você enxerga camadas que iniciantes não veem." },
  { nivel: 20, titulo: "Maestria II", descricao: "Vinte níveis de esforço real e auditável." },
  { nivel: 25, titulo: "Vanguarda", descricao: "Referência para quem está subindo atrás de você." },
  { nivel: 30, titulo: "Maestria III", descricao: "A área é sua. O resto é lapidação." },
  { nivel: 40, titulo: "Lenda", descricao: "Território raro. O recorde agora é contra você mesmo." },
  { nivel: 50, titulo: "Transcendência", descricao: "Meio caminho do teto. Horizonte de longuíssimo prazo." },
] as const;

export interface SkillNodeEstado extends SkillNodeDef {
  desbloqueado: boolean;
  /** Próximo nó a destravar (o alvo atual). */
  proximo: boolean;
}

/** Estado da árvore de uma área dado seu nível atual. */
export function arvoreDaArea(nivelArea: number): SkillNodeEstado[] {
  const primeiroBloqueado = TRONCO_PADRAO.find((n) => n.nivel > nivelArea)?.nivel;
  return TRONCO_PADRAO.map((n) => ({
    ...n,
    desbloqueado: nivelArea >= n.nivel,
    proximo: n.nivel === primeiroBloqueado,
  }));
}
