import { z } from "zod";
import { and, eq, isNull, inArray, sql } from "drizzle-orm";
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
  ehMissaoSemanal,
} from "@rise/db";
import {
  calcularNivelRise,
  nivelDeArea,
  dataLocalISO,
  aplicarAcaoComAmortecedores,
  avaliarConquistas,
  FREEZES_MAX,
  TETO_DIARIO_FATOR,
  type StreakResultadoAmortecido,
} from "@rise/core";
import { router, protectedProcedure } from "../trpc";
import { computarConcessao } from "../services/xp-grant";
import { segundaDaSemanaLocal } from "../lib/semana";

/**
 * Avalia quanto ESTA ação avança uma missão pendente, conforme a métrica.
 * `delta` = incremento aditivo; `absoluto` = novo valor absoluto (métricas de
 * estado, ex.: sequência). Retorna null quando a ação não afeta a missão.
 */
function avaliarMissao(
  m: { metric: string; payload: unknown; progress: number },
  c: {
    kind: string;
    areaId: string;
    areaCatalogId: string | null;
    noteLen: number;
    focusMin: number;
    streakGeral: number;
  },
): { delta: number; absoluto?: number; novasAreas?: string[] } | null {
  const metric = m.metric;
  if (metric === "acoes") return { delta: 1 };
  if (metric === "areas_distintas") {
    const vistas = (m.payload as { areas?: string[] })?.areas ?? [];
    if (vistas.includes(c.areaId)) return null;
    return { delta: 1, novasAreas: [...vistas, c.areaId] };
  }
  if (metric === "nota_longa") return c.noteLen >= 50 ? { delta: 1 } : null;
  if (metric === "foco_sessoes")
    return c.kind === "focus_session" ? { delta: 1 } : null;
  if (metric === "foco_min")
    return c.kind === "focus_session" && c.focusMin > 0
      ? { delta: c.focusMin }
      : null;
  if (metric === "habitos")
    return c.kind === "habit_check" ? { delta: 1 } : null;
  if (metric === "sequencia")
    return c.streakGeral > m.progress ? { delta: 0, absoluto: c.streakGeral } : null;
  if (metric.startsWith("area:"))
    return c.areaCatalogId === metric.slice(5) ? { delta: 1 } : null;
  return null;
}

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
      .enum(["quick_log", "habit_check", "integration", "focus_session"])
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
      // 1. Leituras de contexto (sem efeito): usuário, descanso e Área.
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
      // Área arquivada não aceita ação: o XP entraria no ledger mas sumiria
      // das telas (todas filtram isArchived=false) — confusão garantida.
      if (area.isArchived) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Esta Área está arquivada. Reative-a para registrar ações.",
        });
      }

      // 2. Idempotência ATÔMICA: o INSERT do action_log é a PRIMEIRA escrita
      // da transação. Replay concorrente do mesmo clientActionId bloqueia no
      // unique (user, client_action_id) e recebe 0 linhas → deduped, sem
      // nenhum efeito duplicado (streak/missão/XP rodam só depois daqui).
      const logInserido = await tx
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
        .onConflictDoNothing({
          target: [actionLogs.userId, actionLogs.clientActionId],
        })
        .returning({ id: actionLogs.id });
      if (logInserido.length === 0) {
        const existente = await tx
          .select({ id: actionLogs.id })
          .from(actionLogs)
          .where(
            and(
              eq(actionLogs.userId, userId),
              eq(actionLogs.clientActionId, input.clientActionId),
            ),
          )
          .limit(1);
        return { deduped: true as const, actionLogId: existente[0]?.id ?? 0 };
      }
      const actionLogId = logInserido[0]!.id;

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
        // Streak repair: dentro de 24h da quebra anterior e 1×/semana; esta
        // ação (que NÃO quebrou) restaura a sequência perdida.
        const nowMs = Date.now();
        const orcamentoRepairOk =
          !atual?.lastRepairAt ||
          nowMs - atual.lastRepairAt.getTime() > 7 * 86_400_000;
        const janelaRepairOk =
          atual?.pendingRepairValue != null &&
          atual.repairDeadline != null &&
          atual.repairDeadline.getTime() >= nowMs;
        const reparou =
          !!atual && janelaRepairOk && orcamentoRepairOk && !r.broke;
        if (reparou) {
          r.currentCount = (atual!.pendingRepairValue ?? 0) + (r.currentCount - 1);
          r.longestCount = Math.max(atual!.longestCount, r.currentCount);
        }

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
              pendingRepairValue: reparou
                ? null
                : r.broke
                  ? r.previousDays
                  : atual.pendingRepairValue,
              repairDeadline: reparou
                ? null
                : r.broke
                  ? sql`now() + interval '24 hours'`
                  : atual.repairDeadline,
              ...(reparou ? { lastRepairAt: sql`now()` } : {}),
              updatedAt: sql`now()`,
            })
            .where(eq(streaks.id, atual.id));
        } else {
          // onConflictDoNothing: corrida de duas primeiras-ações simultâneas
          // não pode duplicar a linha (o índice parcial global garante 1 por
          // usuário; a 1ª tx vence e já registrou o dia).
          await tx
            .insert(streaks)
            .values({
              userId,
              lifeAreaId,
              currentCount: r.currentCount,
              longestCount: r.longestCount,
              lastActiveDate: r.lastActiveDate,
            })
            .onConflictDoNothing();
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
        if (reparou) {
          await tx.insert(outbox).values({
            eventType: "streak.repaired",
            payload: {
              userId,
              scope: lifeAreaId ?? "global",
              restoredDays: r.currentCount,
            },
          });
        }
        return r;
      };

      const streakArea = await aplicarStreak(area.id);
      const streakGeral = await aplicarStreak(null);

      // 3b. Missões do dia pendentes — quais esta ação avança? (doc 13 §6.1)
      // Missões vigentes: diárias (hoje) + semanais (segunda desta semana).
      const semanaLocal = segundaDaSemanaLocal(hojeLocal);
      const datasMissao =
        hojeLocal === semanaLocal ? [hojeLocal] : [hojeLocal, semanaLocal];
      const missoesPendentes = await tx
        .select()
        .from(userMissions)
        .where(
          and(
            eq(userMissions.userId, userId),
            inArray(userMissions.assignedDate, datasMissao),
            eq(userMissions.status, "pending"),
          ),
        );
      const ctxMissao = {
        kind: input.kind,
        areaId: area.id,
        areaCatalogId: area.catalogId,
        noteLen: input.note?.length ?? 0,
        focusMin:
          input.kind === "focus_session"
            ? Number((input.payload as { focusMinutes?: number })?.focusMinutes ?? 0)
            : 0,
        streakGeral: streakGeral.currentCount,
      };
      // Cada missão avaliada pela sua métrica → (delta | absoluto).
      const avancam = missoesPendentes
        .map((m) => ({ m, av: avaliarMissao(m, ctxMissao) }))
        .filter(
          (x): x is { m: (typeof missoesPendentes)[number]; av: NonNullable<ReturnType<typeof avaliarMissao>> } =>
            x.av !== null,
        );
      // Bônus pontual só quando alguma missão realmente avança (anti-empilhamento).
      const multMissao = avancam.length > 0 ? 1.5 : 1.0;

      // 4. Domínio decide o XP — com o streak da área JÁ estendido por hoje
      // e o teto diário anti-grinding (doc 13 §10.1): soma o que a área já
      // concedeu HOJE (dia civil do usuário) e passa só o restante.
      const baseArea = baseXpDaArea(area.catalogId);
      const tetoDiario = baseArea * TETO_DIARIO_FATOR;
      const hojeXpRows = await tx
        .select({
          total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int`,
        })
        .from(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, userId),
            eq(xpEvents.lifeAreaId, area.id),
            sql`${xpEvents.amount} > 0`,
            sql`to_char(${xpEvents.createdAt} at time zone ${timezone}, 'YYYY-MM-DD') = ${hojeLocal}`,
          ),
        );
      const jaHoje = Number(hojeXpRows[0]?.total ?? 0);
      const grant = computarConcessao({
        baseAcao: baseArea,
        multDificuldade: input.intensity,
        streakDias: streakArea.currentCount,
        multMissao,
        totalXpAtual: area.totalXp,
        tetoDiarioRestante: Math.max(0, tetoDiario - jaHoje),
      });

      // 5. xp_events: o ledger imutável (fonte da verdade). Chave inclui o
      // userId — clientActionId vem do cliente e não pode colidir entre
      // contas. Teto zerou o XP? A ação vale (streak/missões), o ledger não
      // ganha linha de 0.
      if (grant.amount > 0) {
        await tx.insert(xpEvents).values({
          userId,
          lifeAreaId: area.id,
          actionLogId,
          eventType: "xp.granted",
          amount: grant.amount,
          baseAmount: grant.baseAmount,
          streakMult: grant.streakMult.toFixed(2),
          idempotencyKey: `act:${userId}:${input.clientActionId}`,
        });
      }

      // 6b. Avança missões; conclui as que bateram a meta (XP + Faíscas).
      const missoesCompletadas: {
        titulo: string;
        xpReward: number;
        sparksReward: number;
      }[] = [];
      let xpBonusMissoes = 0;
      let sparksGanhas = 0;
      const completadasIds = new Set<string>();
      for (const { m, av } of avancam) {
        const novoPayload = av.novasAreas
          ? { ...(m.payload as Record<string, unknown>), areas: av.novasAreas }
          : (m.payload as Record<string, unknown>);

        // Métrica de estado (sequência) grava valor ABSOLUTO; as demais somam
        // `delta`. Guard de status torna a operação segura sob concorrência
        // (a 2ª ação vê status != 'pending' → 0 linhas, nunca duplica reward).
        const novoProgresso =
          av.absoluto !== undefined
            ? sql`greatest(${userMissions.progress}, least(${av.absoluto}, ${userMissions.target}))`
            : sql`${userMissions.progress} + ${av.delta}`;
        const atinge =
          av.absoluto !== undefined
            ? sql`${av.absoluto} >= ${userMissions.target}`
            : sql`${userMissions.progress} + ${av.delta} >= ${userMissions.target}`;
        const upd = await tx
          .update(userMissions)
          .set({
            progress: novoProgresso,
            payload: novoPayload,
            status: sql`case when ${atinge} then 'completed'::mission_status else ${userMissions.status} end`,
            completedAt: sql`case when ${atinge} then now() else ${userMissions.completedAt} end`,
          })
          .where(
            and(eq(userMissions.id, m.id), eq(userMissions.status, "pending")),
          )
          .returning({ status: userMissions.status });
        const completou = upd[0]?.status === "completed";

        if (completou) {
          completadasIds.add(m.id);
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

      // 6b². Fechou TODAS as missões DIÁRIAS ainda pendentes → ganha 1 Streak
      // Freeze (cap 2). Semanais não contam (raramente fecham no mesmo dia).
      // "Ganho jogando" (doc 13 §5.3) — protege 1 dia perdido no futuro.
      let freezeGanho = false;
      const diariasPendentes = missoesPendentes.filter(
        (m) => !ehMissaoSemanal(m.templateId),
      );
      const diariasFechadasAgora = diariasPendentes.filter((m) =>
        completadasIds.has(m.id),
      ).length;
      if (
        diariasPendentes.length > 0 &&
        diariasFechadasAgora === diariasPendentes.length
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

  /**
   * Resumo do Sistema de Foco: sessões e minutos concentrados (semana + total).
   * Derivado dos action_logs de foco (kind='focus_session') — leitura pura.
   */
  focoResumo: protectedProcedure.query(async ({ ctx }) => {
    const minutos = sql<number>`coalesce((${actionLogs.payload}->>'focusMinutes')::int, 0)`;
    const rows = await ctx.db
      .select({
        sessoesSemana: sql<number>`count(*) filter (where ${actionLogs.createdAt} >= now() - interval '7 days')::int`,
        minutosSemana: sql<number>`coalesce(sum(${minutos}) filter (where ${actionLogs.createdAt} >= now() - interval '7 days'), 0)::int`,
        sessoesTotal: sql<number>`count(*)::int`,
        minutosTotal: sql<number>`coalesce(sum(${minutos}), 0)::int`,
      })
      .from(actionLogs)
      .where(
        and(
          eq(actionLogs.userId, ctx.userId),
          eq(actionLogs.kind, "focus_session"),
        ),
      );
    const r = rows[0];
    return {
      sessoesSemana: Number(r?.sessoesSemana ?? 0),
      minutosSemana: Number(r?.minutosSemana ?? 0),
      sessoesTotal: Number(r?.sessoesTotal ?? 0),
      minutosTotal: Number(r?.minutosTotal ?? 0),
    };
  }),
});
