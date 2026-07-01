/**
 * Sementes das Áreas da Vida para a demo interativa.
 *
 * Optimistic UI: o cliente registra a ação e computa o XP com o MESMO @rise/core
 * que o servidor usa (curva canônica). Quando `@rise/api` estiver ligado, a
 * mutação apenas confirma o que a tela já mostrou. `baseXp` vem do catálogo (doc 13).
 */
export interface AreaSeed {
  id: string;
  nome: string;
  cor: string;
  baseXp: number;
  xpInicial: number;
}

export const AREA_SEEDS: readonly AreaSeed[] = [
  { id: "programacao", nome: "Programação", cor: "#5eead4", baseXp: 20, xpInicial: 3200 },
  { id: "academia", nome: "Academia", cor: "#fb923c", baseXp: 30, xpInicial: 1500 },
  { id: "sono", nome: "Sono", cor: "#60a5fa", baseXp: 20, xpInicial: 2100 },
  { id: "leitura", nome: "Leitura", cor: "#a78bfa", baseXp: 12, xpInicial: 900 },
  { id: "idiomas", nome: "Idiomas", cor: "#f472b6", baseXp: 12, xpInicial: 640 },
  { id: "saude", nome: "Saúde", cor: "#34d399", baseXp: 10, xpInicial: 300 },
];

export const STREAK_DIAS = 12;
export const NOME_USUARIO = "Lia";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Temporada corrente (mês civil, doc 13 §7). Default: Julho. */
export function temporadaAtual(mesIndex = 6): string {
  return `Temporada de ${MESES[mesIndex]}`;
}
