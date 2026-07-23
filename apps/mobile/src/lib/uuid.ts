import * as Crypto from "expo-crypto";

/**
 * UUID determinístico (v5-shaped) a partir de um seed — espelho de
 * apps/web/lib/uuid.ts. Mesmo seed → mesmo UUID → clientActionId idempotente
 * (um check de hábito por dia não duplica XP: o action_log bloqueia o 2º).
 * Usa expo-crypto (crypto.subtle não existe no runtime RN).
 */
export async function uuidDeterministico(seed: string): Promise<string> {
  const full = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    seed,
  );
  const h = full.slice(0, 32).split("");
  h[12] = "5"; // versão 5
  const v = parseInt(h[16]!, 16);
  h[16] = ((v & 0x3) | 0x8).toString(16); // variante RFC 4122
  const s = h.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

/** Data local YYYY-MM-DD do dispositivo (chave estável ao longo do dia). */
export function dataLocalHoje(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
