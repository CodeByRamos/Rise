import { and, gte, gt, sql, inArray, eq } from "drizzle-orm";
import { xpEvents, profiles, cosmeticItems } from "@rise/db";
import { router, protectedProcedure } from "../trpc";
import { inicioSemanaUTC } from "../lib/semana";

export const leagueRouter = router({
  /**
   * Liga da semana: ranking por XP ganho na semana ISO (reset implícito pela
   * janela). Competição por esforço real — nunca por dinheiro (guardrail canon).
   * MVP global; divisões/normalização por área entram depois (com cron).
   */
  week: protectedProcedure.query(async ({ ctx }) => {
    const inicio = inicioSemanaUTC(new Date());

    // Top 50 por XP na semana, ordenado e cortado NO SQL — a versão anterior
    // carregava todos os usuários pro Node e ordenava em JS (O(n) por request).
    const top = await ctx.db
      .select({
        userId: xpEvents.userId,
        xp: sql<number>`sum(${xpEvents.amount})::int`,
      })
      .from(xpEvents)
      .where(and(gte(xpEvents.createdAt, inicio), gt(xpEvents.amount, 0)))
      .groupBy(xpEvents.userId)
      .orderBy(sql`2 desc`)
      .limit(50);

    // Posição do caller: XP próprio + quantos somaram mais (2 queries baratas).
    const meuRows = await ctx.db
      .select({ xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int` })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.userId, ctx.userId),
          gte(xpEvents.createdAt, inicio),
          gt(xpEvents.amount, 0),
        ),
      );
    const meuXp = Number(meuRows[0]?.xp ?? 0);

    const statsRows = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        acima: sql<number>`count(*) filter (where soma > ${meuXp})::int`,
      })
      .from(
        ctx.db
          .select({
            uid: xpEvents.userId,
            soma: sql<number>`sum(${xpEvents.amount})`.as("soma"),
          })
          .from(xpEvents)
          .where(and(gte(xpEvents.createdAt, inicio), gt(xpEvents.amount, 0)))
          .groupBy(xpEvents.userId)
          .as("semana"),
      );
    const totalParticipantes = Number(statsRows[0]?.total ?? 0);
    const eu =
      meuXp > 0
        ? { rank: Number(statsRows[0]?.acima ?? 0) + 1, xp: meuXp }
        : { rank: null, xp: 0 };
    const ids = top.map((t) => t.userId);
    const perfis =
      ids.length > 0
        ? await ctx.db
            .select({
              userId: profiles.userId,
              displayName: profiles.displayName,
              avatarUrl: profiles.avatarUrl,
              framePreview: cosmeticItems.preview,
            })
            .from(profiles)
            .leftJoin(
              cosmeticItems,
              eq(cosmeticItems.id, profiles.equippedFrameId),
            )
            .where(inArray(profiles.userId, ids))
        : [];
    const mapa = new Map(perfis.map((p) => [p.userId, p]));

    return {
      inicioSemana: inicio,
      totalParticipantes,
      eu,
      ranking: top.map((t, i) => {
        const p = mapa.get(t.userId);
        return {
          rank: i + 1,
          userId: t.userId,
          xp: t.xp,
          displayName: p?.displayName ?? "Alguém",
          avatarUrl: p?.avatarUrl ?? null,
          framePreview: p?.framePreview ?? null,
          souEu: t.userId === ctx.userId,
        };
      }),
    };
  }),
});
