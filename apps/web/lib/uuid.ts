/**
 * UUID determinístico (v5-shaped) a partir de um seed. Mesmo seed → mesmo UUID.
 * Usado como clientActionId idempotente: um check de hábito por dia não duplica
 * XP mesmo com múltiplos cliques (a idempotência do action_log bloqueia o 2º).
 */
export async function uuidDeterministico(seed: string): Promise<string> {
  const data = new TextEncoder().encode(seed);
  const buf = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const b = buf.slice(0, 16);
  b[6] = (b[6]! & 0x0f) | 0x50; // versão 5
  b[8] = (b[8]! & 0x3f) | 0x80; // variante RFC 4122
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Data local YYYY-MM-DD do dispositivo (chave estável ao longo do dia). */
export function dataLocalHoje(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
