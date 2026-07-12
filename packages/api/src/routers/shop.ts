import { z } from "zod";
import { and, eq, sql, gte, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  cosmeticItems,
  inventory,
  sparksWallet,
  sparksLedger,
  userSettings,
  outbox,
  type Database,
} from "@rise/db";
import {
  COSMETIC_CATALOG,
  cosmeticoPorId,
  progressoColecoes,
  idsEmDestaque,
  precoEfetivo,
  eventoAtivoEm,
  itemCompravel,
  DESCONTO_DESTAQUE,
} from "@rise/core";
import { router, protectedProcedure } from "../trpc";

function seedHoje(): string {
  return new Date().toISOString().slice(0, 10);
}
function eventoAtivoAgora() {
  const d = new Date();
  return eventoAtivoEm({ mes: d.getUTCMonth() + 1, dia: d.getUTCDate() });
}

async function lerFavoritos(db: Database, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ prefs: userSettings.prefs })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  const fav = (rows[0]?.prefs as { favoritos?: string[] } | undefined)?.favoritos;
  return new Set(Array.isArray(fav) ? fav : []);
}

export const shopRouter = router({
  /** Catálogo completo com posse, favoritos, destaques do dia e coleções. */
  catalog: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const [meus, wallet, favoritos] = await Promise.all([
      ctx.db
        .select({ itemId: inventory.itemId })
        .from(inventory)
        .where(eq(inventory.userId, userId)),
      ctx.db
        .select({ balance: sparksWallet.balance })
        .from(sparksWallet)
        .where(eq(sparksWallet.userId, userId))
        .limit(1),
      lerFavoritos(ctx.db, userId),
    ]);
    const possuidos = new Set(meus.map((m) => m.itemId));
    const destaque = idsEmDestaque(seedHoje());
    const evento = eventoAtivoAgora();

    const itens = COSMETIC_CATALOG.map((c) => {
      const emDestaque = destaque.has(c.id);
      return {
        id: c.id,
        name: c.name,
        category: c.category,
        rarity: c.rarity,
        preview: c.preview,
        desc: c.desc ?? null,
        precoBase: c.price,
        preco: precoEfetivo(c, emDestaque),
        emDestaque,
        evento: c.evento ?? null,
        compravel: itemCompravel(c, evento),
        owned: possuidos.has(c.id),
        favorito: favoritos.has(c.id),
      };
    });

    return {
      saldo: wallet[0]?.balance ?? 0,
      descontoDestaque: Math.round(DESCONTO_DESTAQUE * 100),
      eventoAtivo: evento,
      itens,
      colecoes: progressoColecoes(possuidos),
    };
  }),

  /** Histórico de compras (data, item, raridade, preço pago estimado). */
  historico: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ itemId: inventory.itemId, acquiredAt: inventory.acquiredAt })
      .from(inventory)
      .where(eq(inventory.userId, ctx.userId))
      .orderBy(desc(inventory.acquiredAt))
      .limit(100);
    return rows
      .map((r) => {
        const c = cosmeticoPorId(r.itemId);
        return c
          ? {
              id: c.id,
              name: c.name,
              category: c.category,
              rarity: c.rarity,
              preco: c.price,
              acquiredAt: r.acquiredAt,
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }),

  /** Alterna um item como favorito (desejo salvo). */
  favoritar: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!cosmeticoPorId(input.itemId)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      const atuais = await lerFavoritos(ctx.db, ctx.userId);
      const favorito = !atuais.has(input.itemId);
      if (favorito) atuais.add(input.itemId);
      else atuais.delete(input.itemId);
      const lista = [...atuais];
      await ctx.db
        .insert(userSettings)
        .values({ userId: ctx.userId, prefs: { favoritos: lista } })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            prefs: sql`coalesce(${userSettings.prefs}, '{}'::jsonb) || ${JSON.stringify({ favoritos: lista })}::jsonb`,
            updatedAt: sql`now()`,
          },
        });
      return { favorito };
    }),

  /**
   * Compra com Faíscas. Preço é RECOMPUTADO no servidor (nunca confiar no
   * cliente): aplica o desconto de destaque do dia e barra itens sazonais fora
   * de evento. Guardrail (ADR 0007): toca só wallet/ledger/inventory — nunca XP.
   */
  buy: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const def = cosmeticoPorId(input.itemId);
      if (!def) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      }
      const evento = eventoAtivoAgora();
      if (!itemCompravel(def, evento)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: def.evento
            ? "Item sazonal — volta no próximo evento."
            : "Item indisponível para compra.",
        });
      }
      const preco = precoEfetivo(def, idsEmDestaque(seedHoje()).has(def.id));

      return ctx.db.transaction(async (tx) => {
        // Espelha o item no banco (FK do inventory) — idempotente.
        await tx
          .insert(cosmeticItems)
          .values({
            id: def.id,
            name: def.name,
            kind: def.category,
            priceSparks: def.price,
            preview: def.preview,
            isActive: true,
          })
          .onConflictDoNothing();

        const jaTem = await tx
          .select({ itemId: inventory.itemId })
          .from(inventory)
          .where(and(eq(inventory.userId, userId), eq(inventory.itemId, def.id)))
          .limit(1);
        if (jaTem.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Você já possui este item." });
        }

        // Débito atômico condicionado ao saldo (nunca fica negativo).
        const debitado = await tx
          .update(sparksWallet)
          .set({
            balance: sql`${sparksWallet.balance} - ${preco}`,
            updatedAt: sql`now()`,
          })
          .where(and(eq(sparksWallet.userId, userId), gte(sparksWallet.balance, preco)))
          .returning({ balance: sparksWallet.balance });
        if (debitado.length === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Faíscas insuficientes. Complete missões para ganhar mais.",
          });
        }

        await tx.insert(sparksLedger).values({
          userId,
          delta: -preco,
          reason: "cosmetic_buy",
        });
        await tx.insert(inventory).values({ userId, itemId: def.id });
        await tx.insert(outbox).values({
          eventType: "cosmetic.acquired",
          payload: { userId, cosmeticItemId: def.id, via: "sparks", preco },
        });

        return {
          ok: true as const,
          itemId: def.id,
          precoPago: preco,
          saldoRestante: debitado[0]!.balance,
        };
      });
    }),
});
