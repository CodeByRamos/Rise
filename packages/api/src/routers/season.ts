import { z } from "zod";
import { and, eq, gte, gt, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  xpEvents,
  seasonClaims,
  sparksWallet,
  sparksLedger,
  cosmeticItems,
  inventory,
  outbox,
} from "@rise/db";
import {
  MARCOS_TEMPORADA,
  chaveTemporada,
  nomeTemporada,
  inicioTemporadaUTC,
  fimTemporadaUTC,
  diasRestantesTemporada,
  molduraDaTemporada,
} from "@rise/core";
import { router, protectedProcedure } from "../trpc";

/**
 * Temporada Solo (doc 13 §7, Sprint 5): ciclo mensal de novidade. XP do mês
 * destrava marcos; resgatar credita Faíscas e, no marco final, a moldura
 * exclusiva da temporada. Guardrails: reset implícito pela janela mensal
 * NUNCA toca XP/nível/conquista; recompensa é cosmética, nunca poder.
 */
export const seasonRouter = router({
  /** Estado da temporada corrente: XP do mês, marcos e resgates. */
  progress: protectedProcedure.query(async ({ ctx }) => {
    const agora = new Date();
    const chave = chaveTemporada(agora);
    const inicio = inicioTemporadaUTC(agora);
    const fim = fimTemporadaUTC(agora);

    const xpRows = await ctx.db
      .select({ xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int` })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.userId, ctx.userId),
          gte(xpEvents.createdAt, inicio),
          lt(xpEvents.createdAt, fim),
          gt(xpEvents.amount, 0),
        ),
      );
    const xpMes = Number(xpRows[0]?.xp ?? 0);

    const claims = await ctx.db
      .select({ milestoneXp: seasonClaims.milestoneXp })
      .from(seasonClaims)
      .where(
        and(eq(seasonClaims.userId, ctx.userId), eq(seasonClaims.seasonKey, chave)),
      );
    const resgatados = new Set(claims.map((c) => c.milestoneXp));

    const moldura = molduraDaTemporada(chave);
    return {
      chave,
      nome: nomeTemporada(chave),
      diasRestantes: diasRestantesTemporada(agora),
      xpMes,
      moldura: { name: moldura.name, colors: moldura.colors },
      marcos: MARCOS_TEMPORADA.map((m) => ({
        xp: m.xp,
        sparks: m.sparks,
        moldura: m.moldura ?? false,
        alcancado: xpMes >= m.xp,
        resgatado: resgatados.has(m.xp),
      })),
    };
  }),

  /**
   * Resgata um marco alcançado. Transação: claim (PK impede duplo) → crédito
   * de Faíscas (ledger + wallet) → moldura exclusiva no marco final. Toca
   * apenas season_claims/sparks/inventory — jamais o XPLedger.
   */
  claim: protectedProcedure
    .input(z.object({ milestoneXp: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const marco = MARCOS_TEMPORADA.find((m) => m.xp === input.milestoneXp);
      if (!marco) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Marco inválido." });
      }
      const agora = new Date();
      const chave = chaveTemporada(agora);
      const inicio = inicioTemporadaUTC(agora);
      // Janela FECHADA dos dois lados: sem o teto, XP carimbado pelo relógio
      // do banco já no mês seguinte contaria para o marco do mês que morre
      // (race na virada + skew app/DB) — e dobraria na temporada nova.
      const fim = fimTemporadaUTC(agora);
      const userId = ctx.userId;

      return ctx.db.transaction(async (tx) => {
        // XP do mês verificado DENTRO da transação — servidor é a verdade.
        const xpRows = await tx
          .select({ xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int` })
          .from(xpEvents)
          .where(
            and(
              eq(xpEvents.userId, userId),
              gte(xpEvents.createdAt, inicio),
              lt(xpEvents.createdAt, fim),
              gt(xpEvents.amount, 0),
            ),
          );
        const xpMes = Number(xpRows[0]?.xp ?? 0);
        if (xpMes < marco.xp) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Marco ainda não alcançado: ${xpMes}/${marco.xp} XP nesta temporada.`,
          });
        }

        // PK (user, season, marco) é o guardião contra resgate duplo.
        const inserido = await tx
          .insert(seasonClaims)
          .values({ userId, seasonKey: chave, milestoneXp: marco.xp })
          .onConflictDoNothing()
          .returning({ milestoneXp: seasonClaims.milestoneXp });
        if (inserido.length === 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Marco já resgatado." });
        }

        // Crédito de Faíscas (mesmo padrão do mission_reward em action.log).
        await tx
          .insert(sparksWallet)
          .values({ userId, balance: marco.sparks })
          .onConflictDoUpdate({
            target: sparksWallet.userId,
            set: {
              balance: sql`${sparksWallet.balance} + ${marco.sparks}`,
              updatedAt: sql`now()`,
            },
          });
        await tx.insert(sparksLedger).values({
          userId,
          delta: marco.sparks,
          reason: "season_reward",
        });

        // Marco final: moldura exclusiva da temporada. isActive=false ⇒ nunca
        // aparece na loja (exclusividade), mas é equipável como qualquer item.
        let molduraGanha: string | null = null;
        if (marco.moldura) {
          const m = molduraDaTemporada(chave);
          await tx
            .insert(cosmeticItems)
            .values({
              id: m.id,
              name: m.name,
              kind: "frame",
              priceSparks: 0,
              preview: { colors: m.colors },
              isActive: false,
            })
            .onConflictDoNothing();
          await tx
            .insert(inventory)
            .values({ userId, itemId: m.id })
            .onConflictDoNothing();
          molduraGanha = m.name;
        }

        await tx.insert(outbox).values({
          eventType: "season.milestone.claimed",
          payload: { userId, seasonKey: chave, milestoneXp: marco.xp, sparks: marco.sparks, moldura: marco.moldura ?? false },
        });

        return {
          ok: true as const,
          sparksGanhas: marco.sparks,
          molduraGanha,
        };
      });
    }),
});
