import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { habits, lifeAreas, actionLogs, users } from "@rise/db";
import { dataLocalISO } from "@rise/core";
import { router, protectedProcedure } from "../trpc";

/** Cadência: dias da semana (0=Dom … 6=Sáb) em que o hábito vale. Vazio = todo dia. */
interface Cadence {
  days: number[];
}

function diasDaCadence(c: unknown): number[] {
  const d = (c as Cadence | null)?.days;
  return Array.isArray(d) ? d.filter((n) => n >= 0 && n <= 6) : [];
}

export const habitRouter = router({
  /**
   * Hábitos ativos agendados para HOJE (fuso do usuário) + se já foram feitos.
   * "Feito hoje" vem dos action_logs de hábito do dia — a mesma verdade do XP.
   */
  hoje: protectedProcedure.query(async ({ ctx }) => {
    const uRows = await ctx.db
      .select({ tz: users.timezone })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);
    if (!uRows[0]) return { habitos: [], weekday: 0 };
    const tz = uRows[0].tz;
    const hoje = dataLocalISO(new Date(), tz);
    const meiaNoite = sql`(${hoje}::date::timestamp AT TIME ZONE ${tz})`;

    const [lista, dowRows, feitosRows] = await Promise.all([
      ctx.db
        .select({
          id: habits.id,
          title: habits.title,
          cadence: habits.cadence,
          lifeAreaId: habits.lifeAreaId,
          areaNome: lifeAreas.name,
          areaCor: lifeAreas.colorToken,
        })
        .from(habits)
        .innerJoin(lifeAreas, eq(habits.lifeAreaId, lifeAreas.id))
        .where(and(eq(habits.userId, ctx.userId), eq(habits.isActive, true))),
      ctx.db.execute(
        sql`select extract(dow from (now() at time zone ${tz}))::int as dow`,
      ),
      ctx.db
        .select({ habitId: sql<string>`${actionLogs.payload}->>'habitId'` })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.userId, ctx.userId),
            eq(actionLogs.kind, "habit_check"),
            gte(actionLogs.createdAt, meiaNoite),
          ),
        ),
    ]);

    const weekday = Number((dowRows as unknown as { dow: number }[])[0]?.dow ?? 0);
    const feitos = new Set(feitosRows.map((r) => r.habitId).filter(Boolean));

    const habitos = lista
      .filter((h) => {
        const dias = diasDaCadence(h.cadence);
        return dias.length === 0 || dias.includes(weekday);
      })
      .map((h) => ({
        id: h.id,
        title: h.title,
        lifeAreaId: h.lifeAreaId,
        areaNome: h.areaNome,
        areaCor: h.areaCor,
        feitoHoje: feitos.has(h.id),
      }));

    return { habitos, weekday };
  }),

  /** Todos os hábitos (para gerenciar). */
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: habits.id,
        title: habits.title,
        cadence: habits.cadence,
        areaNome: lifeAreas.name,
        areaCor: lifeAreas.colorToken,
      })
      .from(habits)
      .innerJoin(lifeAreas, eq(habits.lifeAreaId, lifeAreas.id))
      .where(and(eq(habits.userId, ctx.userId), eq(habits.isActive, true)))
      .orderBy(habits.createdAt);
    return rows.map((r) => ({ ...r, dias: diasDaCadence(r.cadence) }));
  }),

  criar: protectedProcedure
    .input(
      z.object({
        lifeAreaId: z.string().uuid(),
        title: z.string().trim().min(2, "Dê um nome ao hábito.").max(60),
        dias: z.array(z.number().int().min(0).max(6)).max(7).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const area = await ctx.db
        .select({ id: lifeAreas.id })
        .from(lifeAreas)
        .where(
          and(
            eq(lifeAreas.id, input.lifeAreaId),
            eq(lifeAreas.userId, ctx.userId),
            eq(lifeAreas.isArchived, false),
          ),
        )
        .limit(1);
      if (area.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Área da Vida não encontrada." });
      }
      const ins = await ctx.db
        .insert(habits)
        .values({
          userId: ctx.userId,
          lifeAreaId: input.lifeAreaId,
          title: input.title,
          cadence: { days: input.dias ?? [] },
          targetCount: 1,
        })
        .returning({ id: habits.id });
      return { id: ins[0]!.id };
    }),

  remover: protectedProcedure
    .input(z.object({ habitId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Soft-delete: preserva o histórico de check-ins (action_logs) intacto.
      const upd = await ctx.db
        .update(habits)
        .set({ isActive: false })
        .where(and(eq(habits.id, input.habitId), eq(habits.userId, ctx.userId)))
        .returning({ id: habits.id });
      if (upd.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hábito não encontrado." });
      }
      return { ok: true as const };
    }),
});
