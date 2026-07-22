import { NextResponse } from "next/server";
import { getDb, users, sql, inArray } from "@rise/db";
import { creditarEstipendioMensal } from "@rise/api";
import type { PlanTier } from "@rise/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron de manutenção (docs/18 C7). Um único job destrava três dívidas:
 *   1. Credita o estipêndio mensal de Faíscas do Rise+/Founder (idempotente).
 *   2. Drena a outbox — hoje SEM consumidor (notificações são criadas direto em
 *      feed/social), então os eventos são custo puro e a tabela cresce sem fim.
 *      Prune limitado por execução estanca o crescimento. Quando existir um
 *      downstream real (push/analytics), trocar o DELETE por dispatch aqui.
 *
 * Auth: Vercel Cron envia `Authorization: Bearer <CRON_SECRET>`. Sem CRON_SECRET
 * configurado, o endpoint recusa (nunca roda aberto).
 */
const PREMIUM_TIERS: PlanTier[] = ["plus", "founder", "team"];
const OUTBOX_PRUNE_MAX = 20_000; // teto por execução (batches de 5k)

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const db = getDb();
  const inicio = Date.now();

  // 1) Estipêndios — todos os usuários pagantes; idempotente por (user, mês).
  let creditados = 0;
  let faiscasTotal = 0;
  const pagantes = await db
    .select({ id: users.id, plan: users.plan })
    .from(users)
    .where(inArray(users.plan, PREMIUM_TIERS));
  for (const u of pagantes) {
    try {
      const r = await creditarEstipendioMensal(db, u.id, u.plan as PlanTier);
      if (r.creditado) {
        creditados += 1;
        faiscasTotal += r.amount;
      }
    } catch {
      // Falha em um usuário não derruba o lote; o próximo run tenta de novo.
    }
  }

  // 2) Prune da outbox em batches (bound de lock). Sem consumidor hoje, então a
  //    linha processada é apenas removida para capar o crescimento.
  let outboxRemovidos = 0;
  for (let i = 0; i < OUTBOX_PRUNE_MAX / 5000; i++) {
    const res = await db.execute(
      sql`DELETE FROM outbox WHERE id IN (SELECT id FROM outbox ORDER BY id LIMIT 5000)`,
    );
    const n = (res as unknown as { count?: number }).count ?? 0;
    outboxRemovidos += n;
    if (n < 5000) break; // esvaziou
  }

  return NextResponse.json({
    ok: true,
    estipendios: { creditados, faiscas: faiscasTotal, pagantes: pagantes.length },
    outbox: { removidos: outboxRemovidos },
    duracaoMs: Date.now() - inicio,
  });
}
