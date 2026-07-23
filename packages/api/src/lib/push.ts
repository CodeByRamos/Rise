import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { pushSubscriptions, expoPushTokens } from "@rise/db";
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
  // Web Push (VAPID) e push nativo (Expo) são independentes: rodam em paralelo,
  // cada um best-effort. Um sem o outro configurado não impede o parceiro.
  await Promise.all([
    enviarWebPush(db, userId, payload),
    enviarExpoPush(db, userId, payload),
  ]);
}

/**
 * Push nativo via Expo Push API (não usa VAPID). Envia a todos os tokens do
 * usuário; DeviceNotRegistered → remove o token morto. Best-effort.
 */
async function enviarExpoPush(
  db: Database,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  try {
    const tokens = await db
      .select({ token: expoPushTokens.token })
      .from(expoPushTokens)
      .where(eq(expoPushTokens.userId, userId));
    if (tokens.length === 0) return;

    const mensagens = tokens.map((t) => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      sound: "default" as const,
      data: payload.url ? { url: payload.url } : {},
    }));

    const resp = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(mensagens),
    });
    if (!resp.ok) return;
    const json = (await resp.json()) as {
      data?: { status: string; details?: { error?: string } }[];
    };

    // Remove tokens que a Expo reportou como não registrados (app desinstalado).
    const mortos: string[] = [];
    (json.data ?? []).forEach((r, i) => {
      if (r.status === "error" && r.details?.error === "DeviceNotRegistered") {
        const tk = tokens[i]?.token;
        if (tk) mortos.push(tk);
      }
    });
    if (mortos.length > 0) {
      await db.delete(expoPushTokens).where(inArray(expoPushTokens.token, mortos));
    }
  } catch {
    // Best-effort por contrato — nunca propaga.
  }
}

async function enviarWebPush(
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
