import { and, eq, isNull } from "drizzle-orm";
import { lifeAreas, userStats, streaks } from "@rise/db";
import { progressoNoNivel, nivelDeArea } from "@rise/core";
import { router, protectedProcedure } from "../trpc";

export const progressRouter = router({
  /**
   * Dados da tela "Minha Evolução": Nível Rise + stats + Áreas da Vida.
   * Substitui o mock de `apps/web/lib/demo.ts` por dados reais quando ligado.
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const statsRows = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);
    const stats = statsRows[0];

    const areasRows = await ctx.db
      .select()
      .from(lifeAreas)
      .where(and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false)));

    const streakRows = await ctx.db
      .select({ current: streaks.currentCount })
      .from(streaks)
      .where(and(eq(streaks.userId, userId), isNull(streaks.lifeAreaId)))
      .limit(1);

    return {
      riseLevel: stats?.riseLevel ?? 0,
      totalXp: stats?.totalXpAll ?? 0,
      activeAreas: stats?.activeAreas ?? 0,
      streakDias: streakRows[0]?.current ?? 0,
      areas: areasRows.map((a) => {
        const p = progressoNoNivel(a.totalXp);
        return {
          id: a.id,
          nome: a.name,
          cor: a.colorToken,
          nivel: nivelDeArea(a.totalXp),
          fracao: p.fracao,
          xpNoNivel: p.xpNoNivel,
          xpDoNivel: p.xpDoNivel,
        };
      }),
    };
  }),
});
