/**
 * Dados de demonstração da tela "Minha Evolução".
 *
 * TUDO que é progressão aqui é DERIVADO pelo domínio puro @rise/core — a mesma
 * fonte da verdade que o servidor usará. Nada de números mágicos de nível/XP:
 * eles saem das fórmulas canônicas (curva 50n²+50n, fator de amplitude, streak).
 * Quando o banco/tRPC existir, só trocamos a origem dos `xp` — o cálculo é o mesmo.
 */
import {
  calcularNivelRise,
  progressoNoNivel,
  nivelDeArea,
  multStreak,
  type AreaProgresso,
} from "@rise/core";

export interface AreaView {
  nome: string;
  cor: string;
  xp: number;
  nivel: number;
  fracao: number;
  xpNoNivel: number;
  xpDoNivel: number;
}

interface AreaSeed extends AreaProgresso {
  nome: string;
  cor: string;
}

// XP bruto por área (viria do XPLedger). Cores semânticas por Área da Vida.
const seeds: AreaSeed[] = [
  { nome: "Programação", cor: "#5eead4", xp: 3200, ativaNoPeriodo: true },
  { nome: "Academia", cor: "#fb923c", xp: 1500, ativaNoPeriodo: true },
  { nome: "Sono", cor: "#60a5fa", xp: 2100, ativaNoPeriodo: true },
  { nome: "Leitura", cor: "#a78bfa", xp: 900, ativaNoPeriodo: true },
  { nome: "Idiomas", cor: "#f472b6", xp: 640, ativaNoPeriodo: true },
  { nome: "Saúde", cor: "#34d399", xp: 300, ativaNoPeriodo: true },
];

export const areas: AreaView[] = seeds.map((s) => {
  const p = progressoNoNivel(s.xp);
  return {
    nome: s.nome,
    cor: s.cor,
    xp: s.xp,
    nivel: nivelDeArea(s.xp),
    fracao: p.fracao,
    xpNoNivel: p.xpNoNivel,
    xpDoNivel: p.xpDoNivel,
  };
});

const rise = calcularNivelRise(seeds);
const riseProg = progressoNoNivel(Math.round(rise.xpRise * rise.fatorAmplitude));
const streakDias = 12;

export const perfil = {
  nome: "Lia",
  nivelRise: rise.nivelRise,
  xpTotal: rise.xpRise,
  areasAtivas: rise.areasAtivas,
  fatorAmplitude: rise.fatorAmplitude,
  fracaoRise: riseProg.fracao,
  xpNoNivel: riseProg.xpNoNivel,
  xpDoNivel: riseProg.xpDoNivel,
  streakDias,
  streakMult: multStreak(streakDias),
} as const;

/** Nome canônico da temporada corrente (mês civil, doc 13 §7). */
export function temporadaAtual(agora = new Date(2026, 6, 1)): string {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `Temporada de ${meses[agora.getMonth()]}`;
}
