import { and, eq, gte, gt, sql as dsql } from "drizzle-orm";
import { users, actionLogs, xpEvents, lifeAreas } from "@rise/db";
import { router, planProcedure, premiumProcedure } from "../trpc";

/**
 * Estatísticas avançadas (docs/12 §3 — "clareza", gated Premium). Leitura pura
 * sobre o ledger + action_logs; nunca escreve. Free vê só o estado do paywall.
 */
export const statsRouter = router({
  /** O usuário tem acesso às estatísticas profundas? (para o paywall na UI). */
  acesso: planProcedure.query(({ ctx }) => ({
    isPremium: ctx.entitlements.statsHistoryDays > 7 || !Number.isFinite(ctx.entitlements.statsHistoryDays),
  })),

  /** Painel profundo: tendência, distribuição por dia/hora, consistência, áreas. */
  avancado: premiumProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const uRows = await ctx.db
      .select({ tz: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const tz = uRows[0]?.tz ?? "America/Sao_Paulo";
    const diaLocal = dsql`to_char((${actionLogs.createdAt} at time zone ${tz}), 'YYYY-MM-DD')`;
    const diaLocalXp = dsql`to_char((${xpEvents.createdAt} at time zone ${tz}), 'YYYY-MM-DD')`;

    const [
      xpPorDiaRows,
      dowRows,
      horaRows,
      consistenciaRows,
      areaRows,
    ] = await Promise.all([
      // XP por dia (30 dias) — tendência.
      ctx.db
        .select({ dia: diaLocalXp, xp: dsql<number>`sum(${xpEvents.amount})::int` })
        .from(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, userId),
            gt(xpEvents.amount, 0),
            gte(xpEvents.createdAt, dsql`now() - interval '30 days'`),
          ),
        )
        .groupBy(dsql`1`),
      // Ações por dia da semana (90 dias) — melhor dia.
      ctx.db
        .select({
          dow: dsql<number>`extract(dow from (${actionLogs.createdAt} at time zone ${tz}))::int`,
          n: dsql<number>`count(*)::int`,
        })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.userId, userId),
            gte(actionLogs.createdAt, dsql`now() - interval '90 days'`),
          ),
        )
        .groupBy(dsql`1`),
      // Foco por hora (90 dias) — melhor janela.
      ctx.db
        .select({
          hora: dsql<number>`extract(hour from (${actionLogs.createdAt} at time zone ${tz}))::int`,
          min: dsql<number>`coalesce(sum((${actionLogs.payload}->>'focusMinutes')::int), 0)::int`,
          n: dsql<number>`count(*)::int`,
        })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.userId, userId),
            eq(actionLogs.kind, "focus_session"),
            gte(actionLogs.createdAt, dsql`now() - interval '90 days'`),
          ),
        )
        .groupBy(dsql`1`),
      // Consistência: dias ativos distintos nos últimos 30 dias.
      ctx.db
        .select({ dias: dsql<number>`count(distinct ${diaLocal})::int` })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.userId, userId),
            gte(actionLogs.createdAt, dsql`now() - interval '30 days'`),
          ),
        ),
      // XP por Área (30 dias) — distribuição.
      ctx.db
        .select({
          nome: lifeAreas.name,
          cor: lifeAreas.colorToken,
          xp: dsql<number>`sum(${xpEvents.amount})::int`,
        })
        .from(xpEvents)
        .innerJoin(lifeAreas, eq(lifeAreas.id, xpEvents.lifeAreaId))
        .where(
          and(
            eq(xpEvents.userId, userId),
            gt(xpEvents.amount, 0),
            gte(xpEvents.createdAt, dsql`now() - interval '30 days'`),
          ),
        )
        .groupBy(lifeAreas.id, lifeAreas.name, lifeAreas.colorToken)
        .orderBy(dsql`3 desc`),
    ]);

    // Série contínua de 30 dias (preenche buracos com 0) para o gráfico.
    const mapaXp = new Map(xpPorDiaRows.map((r) => [r.dia, Number(r.xp)]));
    const hoje = new Date();
    const serie: { dia: string; xp: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 86_400_000);
      const iso = d.toISOString().slice(0, 10);
      serie.push({ dia: iso, xp: mapaXp.get(iso) ?? 0 });
    }

    const porDow = new Array(7).fill(0);
    for (const r of dowRows) porDow[Number(r.dow)] = Number(r.n);
    const melhorDia = porDow.some((n) => n > 0)
      ? porDow.indexOf(Math.max(...porDow))
      : null;

    const porHora = new Array(24).fill(0);
    for (const r of horaRows) porHora[Number(r.hora)] = Number(r.min);
    const melhorHora = porHora.some((m) => m > 0)
      ? porHora.indexOf(Math.max(...porHora))
      : null;
    const focoTotalMin = porHora.reduce((s, m) => s + m, 0);

    const diasAtivos = Number(consistenciaRows[0]?.dias ?? 0);

    return {
      serieXp30d: serie,
      xpTotal30d: serie.reduce((s, d) => s + d.xp, 0),
      distribuicaoDiaSemana: porDow,
      melhorDia, // 0=Dom … 6=Sáb | null
      focoPorHora: porHora,
      melhorHora, // 0..23 | null
      focoTotalMin,
      diasAtivos30d: diasAtivos,
      consistenciaPct: Math.round((diasAtivos / 30) * 100),
      xpPorArea: areaRows.map((r) => ({ nome: r.nome, cor: r.cor, xp: Number(r.xp) })),
    };
  }),
});
