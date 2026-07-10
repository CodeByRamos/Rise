/**
 * Temporada Solo (doc 13 §7, doc 17 Sprint 5) — ciclo mensal de novidade com
 * recompensas cosméticas individuais. A temporada é o MÊS CIVIL UTC (chave
 * "2026-07"): determinística, sem tabela de temporadas, sem cron — mesma
 * filosofia da janela semanal da Liga (reset implícito pela janela).
 *
 * Regras invioláveis (doc 13): reset de temporada NUNCA toca XP, nível,
 * Skill Tree ou Conquista — o que sobe, fica. Recompensas são Faíscas e
 * cosmético exclusivo (moldura da temporada), jamais poder competitivo.
 */

export interface MarcoTemporada {
  /** XP acumulado no mês para destravar o marco. */
  xp: number;
  /** Faíscas creditadas ao resgatar. */
  sparks: number;
  /** O marco final concede a moldura exclusiva da temporada. */
  moldura?: boolean;
}

/** Marcos fixos da Fase 1 — calibráveis via PostHog sem mudar a mecânica. */
export const MARCOS_TEMPORADA: readonly MarcoTemporada[] = [
  { xp: 500, sparks: 50 },
  { xp: 1500, sparks: 100 },
  { xp: 3500, sparks: 200 },
  { xp: 7000, sparks: 400, moldura: true },
] as const;

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

/** Gradientes exclusivos por mês (index 0 = janeiro) — moldura da temporada. */
const CORES_TEMPORADA: readonly string[][] = [
  ["#60a5fa", "#a78bfa"], // jan — gelo
  ["#f472b6", "#fb7185"], // fev — carnaval
  ["#34d399", "#a3e635"], // mar — outono-verde
  ["#fbbf24", "#fb923c"], // abr — âmbar
  ["#818cf8", "#c084fc"], // mai — lavanda
  ["#22d3ee", "#0ea5e9"], // jun — maré
  ["#10b981", "#fbbf24"], // jul — esmeralda-sol
  ["#f97316", "#f43f5e"], // ago — brasa
  ["#5eead4", "#38bdf8"], // set — céu-mar
  ["#e879f9", "#a78bfa"], // out — místico
  ["#94a3b8", "#e2e8f0"], // nov — prata
  ["#dc2626", "#fbbf24"], // dez — festivo
];

/** Chave canônica da temporada corrente: "AAAA-MM" (mês civil UTC). */
export function chaveTemporada(now: Date): string {
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${m}`;
}

/** Nome de exibição: "Temporada de Julho". */
export function nomeTemporada(chave: string): string {
  const mes = Number(chave.slice(5, 7));
  return `Temporada de ${MESES_PT[mes - 1] ?? "?"}`;
}

/** Primeiro instante do mês corrente (UTC). */
export function inicioTemporadaUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Primeiro instante do mês seguinte (UTC) — fim exclusivo da temporada. */
export function fimTemporadaUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/** Dias inteiros restantes até o fim (mínimo 0). */
export function diasRestantesTemporada(now: Date): number {
  const ms = fimTemporadaUTC(now).getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Id do item de moldura exclusivo da temporada (catálogo de cosméticos). */
export function molduraDaTemporadaId(chave: string): string {
  return `frame-season-${chave}`;
}

/** Definição da moldura exclusiva — nome + gradiente do mês. */
export function molduraDaTemporada(chave: string): {
  id: string;
  name: string;
  colors: string[];
} {
  const mes = Number(chave.slice(5, 7));
  return {
    id: molduraDaTemporadaId(chave),
    name: `Moldura ${nomeTemporada(chave).replace("Temporada de ", "")} ${chave.slice(0, 4)}`,
    colors: [...(CORES_TEMPORADA[mes - 1] ?? CORES_TEMPORADA[0]!)],
  };
}

/** Marcos já alcançados pelo XP do mês (não implica resgatados). */
export function marcosAlcancados(xpMes: number): MarcoTemporada[] {
  return MARCOS_TEMPORADA.filter((m) => xpMes >= m.xp);
}

/** Próximo marco a alcançar, ou null se todos alcançados. */
export function proximoMarco(xpMes: number): MarcoTemporada | null {
  return MARCOS_TEMPORADA.find((m) => xpMes < m.xp) ?? null;
}
