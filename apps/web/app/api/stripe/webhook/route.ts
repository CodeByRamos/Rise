import { NextResponse } from "next/server";
import { getDb, users, eq } from "@rise/db";
import { verificarWebhook, planoDoEvento } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Webhook do Stripe: única fonte que escreve `users.plan`. Verifica a assinatura
 * (HMAC), mapeia o evento → plano e atualiza o entitlement. Idempotente: reprocessar
 * o mesmo evento só reescreve o mesmo valor. Downgrade NUNCA apaga XP/dados.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const assinatura = req.headers.get("stripe-signature");

  let evento: ReturnType<typeof verificarWebhook>;
  try {
    evento = verificarWebhook(payload, assinatura);
  } catch (e) {
    // 400 → o Stripe reenvia; nunca 200 num payload não verificado.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "assinatura inválida" },
      { status: 400 },
    );
  }

  const efeito = planoDoEvento(evento);
  if (efeito) {
    await getDb()
      .update(users)
      .set({ plan: efeito.plan })
      .where(eq(users.id, efeito.userId));
  }

  return NextResponse.json({ received: true });
}
