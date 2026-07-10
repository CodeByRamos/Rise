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

    // XP ganho por usuário na semana (só ganhos, não estornos).
    const agregado = await ctx.db
      .select({
        userId: xpEvents.userId,
        xp: sql<number>`sum(${xpEvents.amount})::int`,
      })
      .from(xpEvents)
      .where(and(gte(xpEvents.createdAt, inicio), gt(xpEvents.amount, 0)))
      .groupBy(xpEvents.userId);

    const ordenado = agregado
      .map((r) => ({ userId: r.userId, xp: r.xp }))
      .sort((a, b) => b.xp - a.xp);

    const minhaPos = ordenado.findIndex((r) => r.userId === ctx.userId);
    const eu =
      minhaPos >= 0
        ? { rank: minhaPos + 1, xp: ordenado[minhaPos]!.xp }
        : { rank: null, xp: 0 };

    const top = ordenado.slice(0, 50);
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
      totalParticipantes: ordenado.length,
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
