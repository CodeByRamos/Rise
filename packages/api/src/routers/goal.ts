import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { goals, lifeAreas } from "@rise/db";
import { router, protectedProcedure } from "../trpc";

/**
 * Metas pessoais (doc 10 — metas com prazo e progresso). Camada de INTENÇÃO e
 * direção: uma meta é um alvo declarado numa Área da Vida ("ler 12 livros"),
 * com progresso acompanhado manualmente. Não concede XP nem Faíscas — progresso
 * de verdade nasce de Ações com prova; a Meta dá clareza de para onde subir.
 */
export const goalRouter = router({
  /** Metas do usuário (ativas primeiro, depois por prazo). */
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: goals.id,
        title: goals.title,
        targetValue: goals.targetValue,
        currentValue: goals.currentValue,
        unit: goals.unit,
        dueAt: goals.dueAt,
        status: goals.status,
        lifeAreaId: goals.lifeAreaId,
        areaNome: lifeAreas.name,
        areaCor: lifeAreas.colorToken,
      })
      .from(goals)
      .innerJoin(lifeAreas, eq(goals.lifeAreaId, lifeAreas.id))
      .where(eq(goals.userId, ctx.userId))
      .orderBy(
        // ativas (status='active') no topo; depois as mais próximas do prazo.
        sql`case when ${goals.status} = 'active' then 0 else 1 end`,
        sql`${goals.dueAt} asc nulls last`,
        sql`${goals.createdAt} desc`,
      );

    return rows.map((g) => ({
      ...g,
      targetValue: Number(g.targetValue),
      currentValue: Number(g.currentValue),
    }));
  }),

  /** Cria uma meta numa Área da Vida do próprio usuário. */
  criar: protectedProcedure
    .input(
      z.object({
        lifeAreaId: z.string().uuid(),
        title: z.string().trim().min(3, "Dê um nome claro à meta.").max(80),
        targetValue: z
          .number()
          .positive("O alvo precisa ser maior que zero.")
          .max(1_000_000),
        unit: z.string().trim().max(20).optional(),
        dueAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // A Área precisa ser do usuário e estar ativa.
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Área da Vida não encontrada.",
        });
      }

      const inserido = await ctx.db
        .insert(goals)
        .values({
          userId: ctx.userId,
          lifeAreaId: input.lifeAreaId,
          title: input.title,
          targetValue: input.targetValue.toString(),
          unit: input.unit || null,
          dueAt: input.dueAt ?? null,
        })
        .returning({ id: goals.id });
      return { id: inserido[0]!.id };
    }),

  /**
   * Ajusta o progresso (delta +/−). Satura em [0, alvo] e conclui a meta
   * automaticamente ao bater o alvo. Guard de userId no WHERE — ninguém mexe
   * na meta de outro.
   */
  ajustar: protectedProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        delta: z.number().refine((v) => v !== 0, "Nada para ajustar."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const atualizado = await ctx.db
        .update(goals)
        .set({
          currentValue: sql`least(greatest(${goals.currentValue} + ${input.delta}, 0), ${goals.targetValue})`,
          status: sql`case when ${goals.currentValue} + ${input.delta} >= ${goals.targetValue} then 'completed'::goal_status else 'active'::goal_status end`,
        })
        .where(and(eq(goals.id, input.goalId), eq(goals.userId, ctx.userId)))
        .returning({
          currentValue: goals.currentValue,
          targetValue: goals.targetValue,
          status: goals.status,
        });
      if (atualizado.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta não encontrada." });
      }
      const g = atualizado[0]!;
      return {
        currentValue: Number(g.currentValue),
        concluida: g.status === "completed",
      };
    }),

  /** Remove (ou abandona) uma meta. */
  remover: protectedProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const del = await ctx.db
        .delete(goals)
        .where(and(eq(goals.id, input.goalId), eq(goals.userId, ctx.userId)))
        .returning({ id: goals.id });
      if (del.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta não encontrada." });
      }
      return { ok: true as const };
    }),
});
