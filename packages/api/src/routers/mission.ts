import { and, eq } from "drizzle-orm";
import { users, userMissions, MISSION_TEMPLATES } from "@rise/db";
import { dataLocalISO } from "@rise/core";
import { router, protectedProcedure } from "../trpc";

export const missionRouter = router({
  /**
   * Missões do dia (heurística L0, doc 13 §6.1). Gera as 3 diárias na primeira
   * chamada do dia (idempotente por UNIQUE user+template+data local) e retorna
   * o estado. Reset é implícito: novo dia local ⇒ novas linhas.
   */
  today: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const u = await ctx.db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    // Bootstrap ainda não rodou ⇒ sem linhas para criar (FK users).
    if (!u[0]) return [];
    const hoje = dataLocalISO(new Date(), u[0].timezone);

    // Insert em lote (idempotente pelo UNIQUE user+template+data): um round-trip
    // em vez de um por template, em toda carga da Home.
    await ctx.db
      .insert(userMissions)
      .values(
        MISSION_TEMPLATES.map((t) => ({
          userId,
          templateId: t.id,
          title: t.title,
          metric: t.metric,
          target: t.target,
          xpReward: t.xpReward,
          sparksReward: t.sparksReward,
          assignedDate: hoje,
        })),
      )
      .onConflictDoNothing();

    const rows = await ctx.db
      .select()
      .from(userMissions)
      .where(
        and(eq(userMissions.userId, userId), eq(userMissions.assignedDate, hoje)),
      );

    const ordem = MISSION_TEMPLATES.map((t) => t.id);
    return rows
      .sort((a, b) => ordem.indexOf(a.templateId) - ordem.indexOf(b.templateId))
      .map((m) => ({
        id: m.id,
        titulo: m.title,
        progress: Math.min(m.progress, m.target),
        target: m.target,
        xpReward: m.xpReward,
        sparksReward: m.sparksReward,
        completa: m.status === "completed",
      }));
  }),
});
