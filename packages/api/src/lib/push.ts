import webpush from "web-push";
import { eq } from "drizzle-orm";
import { pushSubscriptions } from "@rise/db";
import type { Database } from "@rise/db";

/**
 * Web Push (Sprint 6) — envio fire-and-forget, event-driven.
 *
 * Regras:
 * - Sem VAPID configurado (env), vira no-op silencioso: o app funciona 100%
 *   sem push; a feature "liga" quando as chaves existem.
 * - NUNCA propaga erro: push é cortesia, jamais quebra a mutation que o
 *   disparou (follow/reação continuam válidos se o push falhar).
 * - 404/410 do serviço de push = inscrição morta → remove a linha.
 */

export interface PushPayload {
  title: string;
  body: string;
  /** Rota interna aberta ao tocar (ex.: "/notificacoes"). */
  url?: string;
}

function vapidConfigurado(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

/** Chave pública p/ o cliente assinar a inscrição — null se push desligado. */
export function vapidPublicKey(): string | null {
  return vapidConfigurado() ? (process.env.VAPID_PUBLIC_KEY ?? null) : null;
}

/**
 * Envia o payload a TODAS as inscrições do usuário (multi-dispositivo).
 * Chame com `void enviarPush(...)` — nunca await no caminho da mutation.
 */
export async function enviarPush(
  db: Database,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  try {
    if (!vapidConfigurado()) return;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    if (subs.length === 0) return;

    const corpo = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            corpo,
          );
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            // Inscrição expirada/revogada — limpa.
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.endpoint, s.endpoint));
          }
          // Qualquer outro erro: engole (push é best-effort).
        }
      }),
    );
  } catch {
    // Best-effort por contrato — nunca propaga.
  }
}
