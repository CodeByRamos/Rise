import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  actionLogs,
  lifeAreas,
  xpEvents,
  streaks,
  userStats,
  outbox,
  LIFE_AREA_CATALOG,
} from "@rise/db";
import { calcularNivelRise, nivelDeArea } from "@rise/core";
import { router, protectedProcedure } from "../trpc";
import { computarConcessao } from "../services/xp-grant";

// XP-base por área a partir do catálogo canônico (fallback seguro p/ áreas custom).
const BASE_POR_CATALOGO = new Map(
  LIFE_AREA_CATALOG.map((a) => [a.id, a.baseXp] as const),
);
const BASE_CUSTOM_PADRAO = 10;

function baseXpDaArea(catalogId: string | null): number {
  if (catalogId && BASE_POR_CATALOGO.has(catalogId)) {
    return BASE_POR_CATALOGO.get(catalogId)!;
  }
  return BASE_CUSTOM_PADRAO;
}

export const actionRouter = router({
  /**
   * Registrar Ação → conceder XP. A operação de maior RICE do produto (doc 10).
   * Idempotente por (userId, clientActionId): reenvio/duplo-tap não duplica XP.
   * Toda a escrita de progresso acontece numa transação; o outbox dispara o
   * trabalho assíncrono (level.up, etc.) na MESMA transação.
   */
  log: protectedProcedure
    .input(
      z.object({
        lifeAreaId: z.string().uuid(),
        clientActionId: z.string().uuid(),
        kind: z
          .enum(["quick_log", "habit_check", "integration"])
          .default("quick_log"),
        intensity: z.number().min(1).max(2).optional(),
        taskId: z.string().uuid().optional(),
        payload: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      return ctx.db.transaction(async (tx) => {
        // 1. Idempotência: já registramos esta ação do cliente?
        const jaExiste = await tx
          .select({ id: actionLogs.id })
          .from(actionLogs)
          .where(
            and(
              eq(actionLogs.userId, userId),
              eq(actionLogs.clientActionId, input.clientActionId),
            ),
          )
          .limit(1);
        if (jaExiste.length > 0) {
          return { deduped: true as const, actionLogId: jaExiste[0]!.id };
        }

        // 2. Carrega a Área da Vida do usuário.
        const areaRows = await tx
          .select()
          .from(lifeAreas)
          .where(
            and(eq(lifeAreas.id, input.lifeAreaId), eq(lifeAreas.userId, userId)),
          )
          .limit(1);
        const area = areaRows[0];
        if (!area) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Área da Vida não encontrada.",
          });
        }

        // 3. Estado do streak da área (dias atuais → mult_streak).
        const streakRows = await tx
          .select({ current: streaks.currentCount })
          .from(streaks)
          .where(
            and(eq(streaks.userId, userId), eq(streaks.lifeAreaId, area.id)),
          )
          .limit(1);
        const streakDias = streakRows[0]?.current ?? 0;

        // 4. Domínio decide o XP (nada de número mágico aqui).
        const grant = computarConcessao({
          baseAcao: baseXpDaArea(area.catalogId),
          multDificuldade: input.intensity,
          streakDias,
          totalXpAtual: area.totalXp,
        });

        // 5. action_log (imutável, idempotente).
        const inseridos = await tx
          .insert(actionLogs)
          .values({
            userId,
            lifeAreaId: area.id,
            taskId: input.taskId ?? null,
            clientActionId: input.clientActionId,
            kind: input.kind,
            source: "manual",
            payload: input.payload ?? {},
          })
          .returning({ id: actionLogs.id });
        const actionLogId = inseridos[0]!.id;

        // 6. xp_events: o ledger imutável (fonte da verdade).
        await tx.insert(xpEvents).values({
          userId,
          lifeAreaId: area.id,
          actionLogId,
          eventType: "xp.granted",
          amount: grant.amount,
          baseAmount: grant.baseAmount,
          streakMult: grant.streakMult.toFixed(2),
          idempotencyKey: `act:${input.clientActionId}`,
        });

        // 7. Projeção da área (recomputável do ledger; cache p/ leitura).
        await tx
          .update(lifeAreas)
          .set({
            totalXp: grant.totalXpNovo,
            level: nivelDeArea(grant.totalXpNovo),
          })
          .where(eq(lifeAreas.id, area.id));

        // 8. Recomputa o Nível Rise (agregado) para user_stats.
        const todas = await tx
          .select({ xp: lifeAreas.totalXp, level: lifeAreas.level })
          .from(lifeAreas)
          .where(
            and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false)),
          );
        const rise = calcularNivelRise(
          todas.map((a) => ({ xp: a.xp, ativaNoPeriodo: a.level >= 2 })),
        );
        await tx
          .insert(userStats)
          .values({
            userId,
            riseLevel: rise.nivelRise,
            totalXpAll: rise.xpRise,
            activeAreas: rise.areasAtivas,
          })
          .onConflictDoUpdate({
            target: userStats.userId,
            set: {
              riseLevel: rise.nivelRise,
              totalXpAll: rise.xpRise,
              activeAreas: rise.areasAtivas,
              updatedAt: sql`now()`,
            },
          });

        // 9. Outbox (mesma transação): xp.granted sempre; level.up se subiu.
        await tx.insert(outbox).values({
          eventType: "xp.granted",
          payload: {
            userId,
            lifeAreaId: area.id,
            amount: grant.amount,
            actionLogId,
          },
        });
        if (grant.subiuNivel) {
          await tx.insert(outbox).values({
            eventType: "level.up",
            payload: {
              userId,
              lifeAreaId: area.id,
              fromLevel: grant.nivelAnterior,
              toLevel: grant.nivelNovo,
            },
          });
        }

        return {
          deduped: false as const,
          xpGained: grant.amount,
          areaLevel: grant.nivelNovo,
          leveledUp: grant.subiuNivel,
          riseLevel: rise.nivelRise,
          tetoAplicado: grant.tetoAplicado,
        };
      });
    }),
});
