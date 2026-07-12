import { and, eq, inArray } from "drizzle-orm";
import {
  users,
  profiles,
  lifeAreas,
  userMissions,
  DAILY_TEMPLATES,
  WEEKLY_TEMPLATES,
  selecionarMissoes,
  ehMissaoSemanal,
} from "@rise/db";
import { dataLocalISO, classePorId } from "@rise/core";
import { router, protectedProcedure } from "../trpc";
import { segundaDaSemanaLocal } from "../lib/semana";

export const missionRouter = router({
  /**
   * Missões do dia + da semana (heurística L0). Gera 3 diárias (rotação
   * determinística por data) e 2 semanais (por semana) na primeira chamada, de
   * forma idempotente (UNIQUE user+template+data). Reset implícito pela data.
   */
  today: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const u = await ctx.db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!u[0]) return [];
    const hoje = dataLocalISO(new Date(), u[0].timezone);
    const semana = segundaDaSemanaLocal(hoje);

    const diarias = selecionarMissoes(DAILY_TEMPLATES, hoje, 3).map((t) => ({
      t,
      data: hoje,
    }));
    const semanais = selecionarMissoes(WEEKLY_TEMPLATES, semana, 2).map((t) => ({
      t,
      data: semana,
    }));

    // Missão de Classe: se o usuário declarou uma Classe e tem a Área afim,
    // uma semanal temática (ex.: 5 ações na Área da Classe). Liga Classe ↔
    // Missão ↔ Área sem conceder vantagem (mesma recompensa das outras).
    const perfil = await ctx.db
      .select({ classId: profiles.mainClassId })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    const classe = classePorId(perfil[0]?.classId);
    if (classe) {
      const temArea = await ctx.db
        .select({ id: lifeAreas.id })
        .from(lifeAreas)
        .where(
          and(
            eq(lifeAreas.userId, userId),
            eq(lifeAreas.catalogId, classe.areaAfim),
            eq(lifeAreas.isArchived, false),
          ),
        )
        .limit(1);
      if (temArea[0]) {
        semanais.push({
          t: {
            id: `classe-${classe.areaAfim}`,
            title: `Caminho do ${classe.nome}: 5 ações em ${classe.nome}`,
            scope: "weekly",
            metric: `area:${classe.areaAfim}`,
            target: 5,
            xpReward: 90,
            sparksReward: 14,
          },
          data: semana,
        });
      }
    }

    // Insert em lote idempotente.
    await ctx.db
      .insert(userMissions)
      .values(
        [...diarias, ...semanais].map(({ t, data }) => ({
          userId,
          templateId: t.id,
          title: t.title,
          metric: t.metric,
          target: t.target,
          xpReward: t.xpReward,
          sparksReward: t.sparksReward,
          assignedDate: data,
        })),
      )
      .onConflictDoNothing();

    // Busca as vigentes (dia + semana).
    const datas = hoje === semana ? [hoje] : [hoje, semana];
    const rows = await ctx.db
      .select()
      .from(userMissions)
      .where(
        and(
          eq(userMissions.userId, userId),
          inArray(userMissions.assignedDate, datas),
        ),
      );

    const ordemDia = DAILY_TEMPLATES.map((t) => t.id);
    return rows
      .map((m) => ({
        id: m.id,
        titulo: m.title,
        scope: ehMissaoSemanal(m.templateId)
          ? ("weekly" as const)
          : ("daily" as const),
        progress: Math.min(m.progress, m.target),
        target: m.target,
        xpReward: m.xpReward,
        sparksReward: m.sparksReward,
        completa: m.status === "completed",
      }))
      .sort((a, b) => {
        // Diárias primeiro, depois semanais; dentro de cada, pela ordem do pool.
        if (a.scope !== b.scope) return a.scope === "daily" ? -1 : 1;
        return (
          ordemDia.indexOf(a.id) - ordemDia.indexOf(b.id) ||
          a.target - b.target
        );
      });
  }),
});
