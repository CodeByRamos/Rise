/** Formatadores compartilhados do app (tempo relativo, frase de marco do feed). */

/** "há 3 h", "há 2 d", "agora" — tempo relativo curto em pt-BR. */
export function tempoRelativo(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const seg = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seg < 60) return "agora";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 7) return `há ${dias} d`;
  const sem = Math.floor(dias / 7);
  if (sem < 5) return `há ${sem} sem`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

type Payload = Record<string, unknown>;
const str = (p: Payload, k: string): string | undefined =>
  typeof p[k] === "string" ? (p[k] as string) : undefined;
const num = (p: Payload, k: string): number | undefined =>
  typeof p[k] === "number" ? (p[k] as number) : undefined;

/**
 * Frase humana para um item do feed a partir do tipo + payload (espelho de
 * fraseDoMarco da web, sem acoplar ao componente). Genérico e resiliente a
 * payloads parciais.
 */
export function fraseDoMarco(type: string, payload: Payload): string {
  switch (type) {
    case "level.up":
      return `subiu para o nível ${num(payload, "level") ?? ""} em ${str(payload, "area") ?? "uma Área"}`.trim();
    case "achievement.unlocked":
      return `desbloqueou a conquista "${str(payload, "nome") ?? "nova conquista"}"`;
    case "streak.extended":
      return `manteve a sequência por ${num(payload, "dias") ?? ""} dias`.trim();
    case "mission.completed":
      return `concluiu a missão "${str(payload, "titulo") ?? "do dia"}"`;
    case "season.milestone.claimed":
      return `alcançou um marco da Temporada`;
    default:
      return "avançou na sua jornada";
  }
}

/** Rótulo curto do tipo de marco (para o selo/kicker). */
export function tipoDoMarco(type: string): string {
  if (type.startsWith("level")) return "SUBIU DE NÍVEL";
  if (type.startsWith("achievement")) return "CONQUISTA";
  if (type.startsWith("streak")) return "SEQUÊNCIA";
  if (type.startsWith("mission")) return "MISSÃO";
  if (type.startsWith("season")) return "TEMPORADA";
  return "MARCO";
}
