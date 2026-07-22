/**
 * Estipêndio mensal de Faíscas do Rise+/Founder (docs/12 §2, docs/18 C5).
 *
 * IDEMPOTENTE por (userId, período): a PK de `sparks_stipends` é o guardião. O
 * INSERT ... ON CONFLICT DO NOTHING só credita a carteira quando de fato inseriu a
 * linha do mês — então o cron diário e o webhook podem chamar em paralelo, N vezes,
 * sem nunca duplicar. Guardrail ADR 0007: Faíscas são cosméticas, isoladas do XP.
 */
import type { Database } from "@rise/db";
import { sparksStipends, sparksWallet, sparksLedger, sql } from "@rise/db";
import { entitlementsDe, type PlanTier } from "@rise/core";

/** Período civil corrente em UTC no formato 'YYYY-MM'. */
export function periodoEstipendio(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface CreditarEstipendioResult {
  creditado: boolean;
  amount: number;
  period: string;
}

/**
 * Credita o estipêndio do mês para um usuário, se o plano tiver direito e ainda
 * não houver crédito no período. Retorna se creditou (falso = já creditado ou
 * plano sem estipêndio).
 */
export async function creditarEstipendioMensal(
  db: Database,
  userId: string,
  plan: PlanTier,
  agora = new Date(),
): Promise<CreditarEstipendioResult> {
  const period = periodoEstipendio(agora);
  const amount = entitlementsDe(plan).monthlySparksStipend;
  if (!amount || amount <= 0) return { creditado: false, amount: 0, period };

  return db.transaction(async (tx) => {
    // A linha só nasce uma vez por (user, mês). Se já existe, `inserida` vem vazio
    // e nada é creditado — idempotência garantida pela PK.
    const inserida = await tx
      .insert(sparksStipends)
      .values({ userId, period, amount, plan })
      .onConflictDoNothing()
      .returning({ userId: sparksStipends.userId });

    if (inserida.length === 0) return { creditado: false, amount, period };

    await tx
      .insert(sparksWallet)
      .values({ userId, balance: amount })
      .onConflictDoUpdate({
        target: sparksWallet.userId,
        set: {
          balance: sql`${sparksWallet.balance} + ${amount}`,
          updatedAt: sql`now()`,
        },
      });
    await tx.insert(sparksLedger).values({
      userId,
      delta: amount,
      reason: "stipend",
    });
    return { creditado: true, amount, period };
  });
}
