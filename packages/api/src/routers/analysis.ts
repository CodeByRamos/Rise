import { TRPCError } from "@trpc/server";
import { and, eq, gt, gte, desc, sql } from "drizzle-orm";
import {
  users,
  lifeAreas,
  xpEvents,
  actionLogs,
  streaks,
  coachAnalyses,
} from "@rise/db";
import { nivelDeArea, calcularNivelRise } from "@rise/core";
import {
  createCoachClient,
  analisarProfundo,
  formatarFatos,
  type BlocoFatos,
  type FatoArea,
} from "@rise/ai";
import { router, planProcedure, premiumProcedure } from "../trpc";
import { inicioSemanaUTC } from "../lib/semana";

/**
 * Análise Profunda semanal (Opus, gated Premium — docs/12 §3, docs/14 §3).
 * Persistida em `coach_analyses`: uma por semana civil (UTC). Reler não recobra
 * o Opus; só a 1ª geração da semana chama o modelo.
 */
export const analysisRouter = router({
  /** Última análise + estado do paywall/geração para a UI. */
  latest: planProcedure.query(async ({ ctx }) => {
    const inicioSemana = inicioSemanaUTC(new Date());
    const ultima = await ctx.db
      .select({
        content: coachAnalyses.content,
        model: coachAnalyses.model,
        periodStart: coachAnalyses.periodStart,
        periodEnd: coachAnalyses.periodEnd,
        createdAt: coachAnalyses.createdAt,
      })
      .from(coachAnalyses)
      .where(
        and(
          eq(coachAnalyses.userId, ctx.userId),
          eq(coachAnalyses.kind, "weekly_deep"),
        ),
      )
      .orderBy(desc(coachAnalyses.periodStart))
      .limit(1);

    const temDaSemana =
      ultima[0]?.periodStart != null &&
      ultima[0].periodStart.getTime() === inicioSemana.getTime();

    return {
      isPremium: ctx.entitlements.deepAnalysis,
      analise: ultima[0] ?? null,
      // Premium e ainda sem análise da semana corrente ⇒ pode gerar.
      podeGerar: ctx.entitlements.deepAnalysis && !temDaSemana,
    };
  }),

  /** Gera (ou devolve, se já existir) a Análise Profunda da semana. */
  gerar: premiumProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;
    const inicioSemana = inicioSemanaUTC(new Date());
    const fim = new Date();

    // Já existe a da semana? Devolve sem tocar no Opus.
    const existente = await ctx.db
      .select({
        content: coachAnalyses.content,
        model: coachAnalyses.model,
        periodStart: coachAnalyses.periodStart,
        periodEnd: coachAnalyses.periodEnd,
        createdAt: coachAnalyses.createdAt,
      })
      .from(coachAnalyses)
      .where(
        and(
          eq(coachAnalyses.userId, userId),
          eq(coachAnalyses.kind, "weekly_deep"),
          eq(coachAnalyses.periodStart, inicioSemana),
        ),
      )
      .limit(1);
    if (existente[0]) return { ...existente[0], cached: true as const };

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Coach de IA ainda não configurado neste ambiente. Tente novamente em breve.",
      });
    }

    // FATOS determinísticos (SQL, nunca embeddados) — Áreas + XP da semana.
    const areasRows = await ctx.db
      .select({
        id: lifeAreas.id,
        nome: lifeAreas.name,
        totalXp: lifeAreas.totalXp,
      })
      .from(lifeAreas)
      .where(and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false)));

    const xpSemanaRows = await ctx.db
      .select({
        lifeAreaId: xpEvents.lifeAreaId,
        xp: sql<number>`sum(${xpEvents.amount})::int`,
      })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.userId, userId),
          gte(xpEvents.createdAt, inicioSemana),
          gt(xpEvents.amount, 0),
        ),
      )
      .groupBy(xpEvents.lifeAreaId);
    const xpPorArea = new Map(
      xpSemanaRows.map((r) => [r.lifeAreaId, Number(r.xp)] as const),
    );

    const streakRows = await ctx.db
      .select({ lifeAreaId: streaks.lifeAreaId, current: streaks.currentCount })
      .from(streaks)
      .where(eq(streaks.userId, userId));
    const streakPorArea = new Map(
      streakRows
        .filter((r) => r.lifeAreaId != null)
        .map((r) => [r.lifeAreaId as string, r.current] as const),
    );

    const acoesRows = await ctx.db
      .select({ n: sql<number>`count(*)::int` })
      .from(actionLogs)
      .where(
        and(eq(actionLogs.userId, userId), gte(actionLogs.createdAt, inicioSemana)),
      );
    const acoesTotalSemana = Number(acoesRows[0]?.n ?? 0);

    const nivelRise = calcularNivelRise(
      areasRows.map((a) => ({
        xp: a.totalXp,
        ativaNoPeriodo: (xpPorArea.get(a.id) ?? 0) > 0,
      })),
    ).nivelRise;

    const areasFato: FatoArea[] = areasRows.map((a) => {
      const streak = streakPorArea.get(a.id);
      return {
        area: a.nome,
        nivel: nivelDeArea(a.totalXp),
        xpSemana: xpPorArea.get(a.id) ?? 0,
        ...(streak !== undefined ? { streak } : {}),
      };
    });

    const fatos: BlocoFatos = {
      periodo: "últimos 7 dias",
      nivelRise,
      acoesTotalSemana,
      areas: areasFato,
      alertaStreak: [],
    };

    const displayNameRows = await ctx.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const resultado = await analisarProfundo({
      client: createCoachClient(),
      fatos: formatarFatos(fatos),
      displayName: displayNameRows[0]?.email?.split("@")[0] ?? null,
    });
    if (!resultado.content) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível gerar a análise agora. Tente de novo em instantes.",
      });
    }

    // Insere com dedupe: corrida de dois cliques não gera duas cobranças de
    // Opus persistidas — a 2ª bate no unique e cai no select de volta.
    const inserido = await ctx.db
      .insert(coachAnalyses)
      .values({
        userId,
        kind: "weekly_deep",
        model: resultado.model,
        periodStart: inicioSemana,
        periodEnd: fim,
        facts: fatos as unknown as Record<string, unknown>,
        content: resultado.content,
      })
      .onConflictDoNothing({
        target: [
          coachAnalyses.userId,
          coachAnalyses.kind,
          coachAnalyses.periodStart,
        ],
      })
      .returning({
        content: coachAnalyses.content,
        model: coachAnalyses.model,
        periodStart: coachAnalyses.periodStart,
        periodEnd: coachAnalyses.periodEnd,
        createdAt: coachAnalyses.createdAt,
      });
    if (inserido[0]) return { ...inserido[0], cached: false as const };

    const reload = await ctx.db
      .select({
        content: coachAnalyses.content,
        model: coachAnalyses.model,
        periodStart: coachAnalyses.periodStart,
        periodEnd: coachAnalyses.periodEnd,
        createdAt: coachAnalyses.createdAt,
      })
      .from(coachAnalyses)
      .where(
        and(
          eq(coachAnalyses.userId, userId),
          eq(coachAnalyses.kind, "weekly_deep"),
          eq(coachAnalyses.periodStart, inicioSemana),
        ),
      )
      .limit(1);
    return { ...reload[0]!, cached: true as const };
  }),
});
