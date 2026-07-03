import { z } from "zod";
import { and, eq, sql, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  cosmeticItems,
  inventory,
  sparksWallet,
  sparksLedger,
  outbox,
} from "@rise/db";
import { router, protectedProcedure } from "../trpc";

export const shopRouter = router({
  /** Catálogo com flag de posse + saldo. Preços sempre visíveis (sem loot box). */
  catalog: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const itens = await ctx.db
      .select({
        id: cosmeticItems.id,
        name: cosmeticItems.name,
        kind: cosmeticItems.kind,
        priceSparks: cosmeticItems.priceSparks,
        preview: cosmeticItems.preview,
      })
      .from(cosmeticItems)
      .where(eq(cosmeticItems.isActive, true));

    const meus = await ctx.db
      .select({ itemId: inventory.itemId })
      .from(inventory)
      .where(eq(inventory.userId, userId));
    const possuo = new Set(meus.map((m) => m.itemId));

    const wallet = await ctx.db
      .select({ balance: sparksWallet.balance })
      .from(sparksWallet)
      .where(eq(sparksWallet.userId, userId))
      .limit(1);

    const ordem = { frame: 0, theme: 1 } as Record<string, number>;
    return {
      saldo: wallet[0]?.balance ?? 0,
      itens: itens
        .sort(
          (a, b) =>
            (ordem[a.kind] ?? 9) - (ordem[b.kind] ?? 9) ||
            a.priceSparks - b.priceSparks,
        )
        .map((i) => ({ ...i, owned: possuo.has(i.id) })),
    };
  }),

  /**
   * Compra com Faíscas. Guardrail estrutural (ADR 0007): esta transação toca
   * APENAS wallet/ledger/inventory — nunca XP, nível ou ranking.
   */
  buy: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      return ctx.db.transaction(async (tx) => {
        const itemRows = await tx
          .select()
          .from(cosmeticItems)
          .where(
            and(eq(cosmeticItems.id, input.itemId), eq(cosmeticItems.isActive, true)),
          )
          .limit(1);
        const item = itemRows[0];
        if (!item) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
        }

        const jaTem = await tx
          .select({ itemId: inventory.itemId })
          .from(inventory)
          .where(and(eq(inventory.userId, userId), eq(inventory.itemId, item.id)))
          .limit(1);
        if (jaTem.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Você já possui este item." });
        }

        // Débito atômico: só passa se o saldo cobre (condição no UPDATE).
        const debitado = await tx
          .update(sparksWallet)
          .set({
            balance: sql`${sparksWallet.balance} - ${item.priceSparks}`,
            updatedAt: sql`now()`,
          })
          .where(
            and(
              eq(sparksWallet.userId, userId),
              gte(sparksWallet.balance, item.priceSparks),
            ),
          )
          .returning({ balance: sparksWallet.balance });
        if (debitado.length === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Faíscas insuficientes. Complete missões para ganhar mais.",
          });
        }

        await tx.insert(sparksLedger).values({
          userId,
          delta: -item.priceSparks,
          reason: "cosmetic_buy",
        });
        await tx.insert(inventory).values({ userId, itemId: item.id });
        await tx.insert(outbox).values({
          eventType: "cosmetic.acquired",
          payload: { userId, cosmeticItemId: item.id, via: "sparks" },
        });

        return {
          ok: true as const,
          itemId: item.id,
          saldoRestante: debitado[0]!.balance,
        };
      });
    }),
});
