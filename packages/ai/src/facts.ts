/**
 * Bloco FATOS — a âncora anti-alucinação do Coach (docs/14 §4.3, §5.3).
 *
 * Separa FATOS (números EXATOS, buscados por SQL determinístico, jamais
 * embeddados) do CONTEXTO (trechos semânticos via pgvector). O modelo é instruído
 * a citar APENAS números deste bloco — nunca estimar, nunca calcular XP/nível.
 */

export type Tendencia = "alta" | "queda" | "estavel";

export interface FatoArea {
  area: string;
  nivel: number;
  xpSemana?: number;
  streak?: number;
  mediaHoras?: number;
  tendencia?: Tendencia;
}

export interface AlertaStreak {
  area: string;
  horasParaQuebrar: number;
}

export interface BlocoFatos {
  periodo: string;
  areas: FatoArea[];
  nivelRise: number;
  acoesTotalSemana: number;
  alertaStreak: AlertaStreak[];
}

/**
 * Renderiza o bloco FATOS como texto autoritativo para o prompt. Determinístico
 * (chaves ordenadas) para permitir prompt caching.
 */
export function formatarFatos(f: BlocoFatos): string {
  const payload = {
    periodo: f.periodo,
    nivel_rise: f.nivelRise,
    acoes_total_semana: f.acoesTotalSemana,
    areas: f.areas.map((a) => ({
      area: a.area,
      nivel: a.nivel,
      ...(a.xpSemana !== undefined ? { xp_semana: a.xpSemana } : {}),
      ...(a.streak !== undefined ? { streak: a.streak } : {}),
      ...(a.mediaHoras !== undefined ? { media_horas: a.mediaHoras } : {}),
      ...(a.tendencia !== undefined ? { tendencia: a.tendencia } : {}),
    })),
    alerta_streak: f.alertaStreak.map((s) => ({
      area: s.area,
      horas_para_quebrar: s.horasParaQuebrar,
    })),
  };

  return [
    "FATOS (dados exatos e autoritativos — cite APENAS estes números; se um dado não estiver aqui, peça a ferramenta ou diga que não tem, NUNCA estime):",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}
