import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  users,
  userSettings,
  actionLogs,
  lifeAreas,
  xpEvents,
  streaks,
  userStats,
  userMissions,
  userAchievements,
  sparksWallet,
  sparksLedger,
  feedItems,
  outbox,
  LIFE_AREA_CATALOG,
} from "@rise/db";
import {
  calcularNivelRise,
  nivelDeArea,
  dataLocalISO,
  aplicarAcaoComAmortecedores,
  avaliarConquistas,
  FREEZES_MAX,
  type StreakResultadoAmortecido,
} from "@rise/core";
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

const logInput = z
  .object({
    lifeAreaId: z.string().uuid(),
    clientActionId: z.string().uuid(),
    kind: z
      .enum(["quick_log", "habit_check", "integration"])
      .default("quick_log"),
    intensity: z.number().min(1).max(2).optional(),
    taskId: z.string().uuid().optional(),
    // PROVA da ação: nota (≥ 3 chars úteis) OU foto. Obrigatória.
    note: z.string().trim().max(500).optional(),
    photoPath: z.string().max(300).optional(),
    payload: z.record(z.unknown()).optional(),
  })
  .refine((i) => (i.note && i.note.length >= 3) || !!i.photoPath, {
    message:
      "Toda ação precisa de uma prova: escreva o que você fez (mínimo 3 caracteres) ou anexe uma foto.",
    path: ["note"],
  });

export const actionRouter = router({
  /**
   * Registrar Ação → conceder XP. A operação de maior RICE do produto (doc 10).
   * - Idempotente por (userId, clientActionId).
   * - PROVA obrigatória (nota ou foto) — doc 13 §10.3, integridade por design.
   * - Atualiza as Sequências (área + geral) no fuso do usuário e usa o novo
   *   streak no multiplicador de XP.
   * - Transação única: action_log → xp_events (ledger) → projeções → outbox.
   */
  log: protectedProcedure.input(logInput).mutation(async ({ ctx, input }) => {
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

      // 2. Usuário (timezone p/ dia civil do streak) + Área da Vida.
      const userRows = await tx
        .select({ timezone: users.timezone })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const timezone = userRows[0]?.timezone ?? "America/Sao_Paulo";
      const hojeLocal = dataLocalISO(new Date(), timezone);

      // Modo Descanso ativo/recente → dias cobertos não quebram a sequência.
      const settingsRows = await tx
        .select({ restModeUntil: userSettings.restModeUntil })
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      const restUntil = settingsRows[0]?.restModeUntil ?? null;
      const descansoAte = restUntil ? dataLocalISO(restUntil, timezone) : null;

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

      // 3. Sequências (área + geral) com amortecedores (doc 13 §5.3):
      //    perdão automático (grátis, streak ≥ 14, 1×/14 dias via grace_until)
      //    e Streak Freeze (recurso, cobre 1 dia perdido).
      const aplicarStreak = async (
        lifeAreaId: string | null,
      ): Promise<StreakResultadoAmortecido> => {
        const cond =
          lifeAreaId === null
            ? and(eq(streaks.userId, userId), isNull(streaks.lifeAreaId))
            : and(eq(streaks.userId, userId), eq(streaks.lifeAreaId, lifeAreaId));
        const rows = await tx.select().from(streaks).where(cond).limit(1);
        const atual = rows[0];
        const perdaoDisponivel =
          !atual?.graceUntil || atual.graceUntil.getTime() <= Date.now();
        const r = aplicarAcaoComAmortecedores(
          atual
            ? {
                currentCount: atual.currentCount,
                longestCount: atual.longestCount,
                lastActiveDate: atual.lastActiveDate,
              }
            : null,
          hojeLocal,
          {
            freezesAvailable: atual?.freezesAvailable ?? 0,
            perdaoDisponivel,
            descansoAte,
          },
        );
        if (atual) {
          await tx
            .update(streaks)
            .set({
              currentCount: r.currentCount,
              longestCount: r.longestCount,
              lastActiveDate: r.lastActiveDate,
              state: "active",
              ...(r.freezeUsado
                ? { freezesAvailable: atual.freezesAvailable - 1 }
                : {}),
              ...(r.perdaoUsado
                ? { graceUntil: sql`now() + interval '14 days'` }
                : {}),
              updatedAt: sql`now()`,
            })
            .where(eq(streaks.id, atual.id));
        } else {
          await tx.insert(streaks).values({
            userId,
            lifeAreaId,
            currentCount: r.currentCount,
            longestCount: r.longestCount,
            lastActiveDate: r.lastActiveDate,
          });
        }
        if (r.freezeUsado || r.perdaoUsado) {
          await tx.insert(outbox).values({
            eventType: "streak.frozen",
            payload: {
              userId,
              scope: lifeAreaId ?? "global",
              source: r.perdaoUsado ? "auto-forgive" : "item",
            },
          });
        }
        return r;
      };

      const streakArea = await aplicarStreak(area.id);
      const streakGeral = await aplicarStreak(null);

      // 3b. Missões do dia pendentes — quais esta ação avança? (doc 13 §6.1)
      const missoesPendentes = await tx
        .select()
        .from(userMissions)
        .where(
          and(
            eq(userMissions.userId, userId),
            eq(userMissions.assignedDate, hojeLocal),
            eq(userMissions.status, "pending"),
          ),
        );
      const avancam = missoesPendentes.filter((m) => {
        if (m.metric === "acoes") return true;
        if (m.metric === "areas_distintas") {
          const vistas = (m.payload as { areas?: string[] }).areas ?? [];
          return !vistas.includes(area.id);
        }
        if (m.metric === "nota_longa") {
          return (input.note?.length ?? 0) >= 50;
        }
        return false;
      });
      // Bônus pontual aplica a UMA missão só (anti-empilhamento).
      const multMissao = avancam.length > 0 ? 1.5 : 1.0;

      // 4. Domínio decide o XP — com o streak da área JÁ estendido por hoje.
      const grant = computarConcessao({
        baseAcao: baseXpDaArea(area.catalogId),
        multDificuldade: input.intensity,
        streakDias: streakArea.currentCount,
        multMissao,
        totalXpAtual: area.totalXp,
      });

      // 5. action_log (imutável, idempotente) com a PROVA.
      const inseridos = await tx
        .insert(actionLogs)
        .values({
          userId,
          lifeAreaId: area.id,
          taskId: input.taskId ?? null,
          clientActionId: input.clientActionId,
          kind: input.kind,
          source: "manual",
          note: input.note ?? null,
          photoPath: input.photoPath ?? null,
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

      // 6b. Avança missões; conclui as que bateram a meta (XP + Faíscas).
      const missoesCompletadas: {
        titulo: string;
        xpReward: number;
        sparksReward: number;
      }[] = [];
      let xpBonusMissoes = 0;
      let sparksGanhas = 0;
      for (const m of avancam) {
        const novoPayload =
          m.metric === "areas_distintas"
            ? {
                ...(m.payload as Record<string, unknown>),
                areas: [
                  ...((m.payload as { areas?: string[] }).areas ?? []),
                  area.id,
                ],
              }
            : (m.payload as Record<string, unknown>);
        const novoProgress = m.progress + 1;
        const completou = novoProgress >= m.target;
        await tx
          .update(userMissions)
          .set({
            progress: novoProgress,
            payload: novoPayload,
            ...(completou
              ? { status: "completed" as const, completedAt: sql`now()` }
              : {}),
          })
          .where(eq(userMissions.id, m.id));

        if (completou) {
          missoesCompletadas.push({
            titulo: m.title,
            xpReward: m.xpReward,
            sparksReward: m.sparksReward,
          });
          xpBonusMissoes += m.xpReward;
          sparksGanhas += m.sparksReward;
          // XP da missão entra no ledger (crédito na área da ação que concluiu).
          await tx.insert(xpEvents).values({
            userId,
            lifeAreaId: area.id,
            actionLogId,
            eventType: "xp.granted",
            amount: m.xpReward,
            baseAmount: m.xpReward,
            streakMult: "1.00",
            idempotencyKey: `mission:${m.id}`,
          });
          await tx.insert(outbox).values({
            eventType: "mission.completed",
            payload: {
              userId,
              missionId: m.id,
              xpReward: m.xpReward,
              sparksReward: m.sparksReward,
            },
          });
        }
      }

      // 6b². Fechou TODAS as missões do dia → ganha 1 Streak Freeze (cap 2).
      // "Ganho jogando" (doc 13 §5.3) — protege 1 dia perdido no futuro.
      let freezeGanho = false;
      if (
        missoesCompletadas.length > 0 &&
        missoesPendentes.length - missoesCompletadas.length === 0
      ) {
        const geral = await tx
          .select({ id: streaks.id, freezes: streaks.freezesAvailable })
          .from(streaks)
          .where(and(eq(streaks.userId, userId), isNull(streaks.lifeAreaId)))
          .limit(1);
        if (geral[0] && geral[0].freezes < FREEZES_MAX) {
          await tx
            .update(streaks)
            .set({ freezesAvailable: geral[0].freezes + 1 })
            .where(eq(streaks.id, geral[0].id));
          freezeGanho = true;
        }
      }

      // 6c. Faíscas — namespace isolado do XP (ADR 0007): só wallet + ledger.
      if (sparksGanhas > 0) {
        await tx
          .insert(sparksWallet)
          .values({ userId, balance: sparksGanhas })
          .onConflictDoUpdate({
            target: sparksWallet.userId,
            set: {
              balance: sql`${sparksWallet.balance} + ${sparksGanhas}`,
              updatedAt: sql`now()`,
            },
          });
        await tx.insert(sparksLedger).values({
          userId,
          delta: sparksGanhas,
          reason: "mission_reward",
        });
        await tx.insert(outbox).values({
          eventType: "sparks.earned",
          payload: { userId, amount: sparksGanhas, source: "mission" },
        });
      }

      // 7. Projeção da área (recomputável do ledger; cache p/ leitura).
      const totalXpFinal = grant.totalXpNovo + xpBonusMissoes;
      const nivelFinal = nivelDeArea(totalXpFinal);
      const leveledUp = nivelFinal > grant.nivelAnterior;
      await tx
        .update(lifeAreas)
        .set({
          totalXp: totalXpFinal,
          level: nivelFinal,
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

      // 9. Outbox (mesma transação): xp.granted sempre; level.up e streak.* quando houver.
      await tx.insert(outbox).values({
        eventType: "xp.granted",
        payload: {
          userId,
          lifeAreaId: area.id,
          amount: grant.amount,
          actionLogId,
        },
      });
      if (leveledUp) {
        await tx.insert(outbox).values({
          eventType: "level.up",
          payload: {
            userId,
            lifeAreaId: area.id,
            fromLevel: grant.nivelAnterior,
            toLevel: nivelFinal,
          },
        });
      }

      // 9b. Feed de MARCOS (nunca a prova em si — privacidade por design).
      const MARCOS_STREAK = [3, 7, 14, 30, 50, 100, 200, 365];
      if (leveledUp) {
        await tx.insert(feedItems).values({
          userId,
          type: "level.up",
          payload: { area: area.name, toLevel: nivelFinal },
        });
      }
      if (
        streakGeral.extended &&
        MARCOS_STREAK.includes(streakGeral.currentCount)
      ) {
        await tx.insert(feedItems).values({
          userId,
          type: "streak.milestone",
          payload: { days: streakGeral.currentCount },
        });
      }
      if (
        missoesCompletadas.length > 0 &&
        missoesPendentes.length - missoesCompletadas.length === 0
      ) {
        await tx.insert(feedItems).values({
          userId,
          type: "missions.day",
          payload: { total: missoesPendentes.length },
        });
      }

      // 9c. Conquistas — avalia critérios com a fotografia PÓS-ação.
      const acoesCount = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(actionLogs)
        .where(eq(actionLogs.userId, userId));
      const desbloqueadasRows = await tx
        .select({ id: userAchievements.achievementId })
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));
      const novasConquistas = avaliarConquistas(
        {
          streakAtual: streakGeral.currentCount,
          niveisAreas: todas.map((a) => a.level),
          totalAcoes: acoesCount[0]?.n ?? 0,
          xpTotal: rise.xpRise,
          diaPerfeito:
            missoesCompletadas.length > 0 &&
            missoesPendentes.length - missoesCompletadas.length === 0,
        },
        new Set(desbloqueadasRows.map((r) => r.id)),
      );
      for (const c of novasConquistas) {
        await tx
          .insert(userAchievements)
          .values({ userId, achievementId: c.id })
          .onConflictDoNothing();
        await tx.insert(outbox).values({
          eventType: "achievement.unlocked",
          payload: { userId, achievementId: c.id, category: c.categoria, rarity: c.raridade },
        });
        await tx.insert(feedItems).values({
          userId,
          type: "achievement",
          payload: { nome: c.nome, raridade: c.raridade },
        });
      }
      if (streakGeral.broke) {
        await tx.insert(outbox).values({
          eventType: "streak.broken",
          payload: {
            userId,
            scope: "global",
            previousDays: streakGeral.previousDays,
            recordKept: streakGeral.longestCount,
          },
        });
      }
      if (streakGeral.extended) {
        await tx.insert(outbox).values({
          eventType: "streak.extended",
          payload: {
            userId,
            scope: "global",
            days: streakGeral.currentCount,
            multiplier: grant.streakMult,
          },
        });
      }

      return {
        deduped: false as const,
        xpGained: grant.amount + xpBonusMissoes,
        areaLevel: nivelFinal,
        leveledUp,
        riseLevel: rise.nivelRise,
        streakDias: streakGeral.currentCount,
        streakAreaDias: streakArea.currentCount,
        tetoAplicado: grant.tetoAplicado,
        missoesCompletadas,
        sparksGanhas,
        freezeGanho,
        streakProtegido: streakGeral.freezeUsado || streakGeral.perdaoUsado,
        conquistas: novasConquistas.map((c) => ({
          id: c.id,
          nome: c.nome,
          raridade: c.raridade,
        })),
      };
    });
  }),
});
