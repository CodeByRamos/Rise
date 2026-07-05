import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { lifeAreas, lifeAreaCatalog } from "@rise/db";
import { router, protectedProcedure } from "../trpc";

// Paleta restrita para Áreas personalizadas (doc 15 — picker restrito, sem cor livre).
const CORES_CUSTOM = [
  "#5eead4", "#60a5fa", "#a78bfa", "#f472b6", "#fb923c",
  "#34d399", "#fbbf24", "#22d3ee", "#c084fc", "#fb7185",
] as const;

export const areaRouter = router({
  /** Áreas do catálogo que o usuário ainda NÃO adicionou. */
  available: protectedProcedure.query(async ({ ctx }) => {
    const minhas = await ctx.db
      .select({ catalogId: lifeAreas.catalogId })
      .from(lifeAreas)
      .where(eq(lifeAreas.userId, ctx.userId));
    const tenho = new Set(
      minhas.map((m) => m.catalogId).filter((x): x is string => !!x),
    );
    const cat = await ctx.db.select().from(lifeAreaCatalog);
    return cat
      .filter((c) => !tenho.has(c.id))
      .map((c) => ({ id: c.id, nome: c.namePt, cor: c.colorToken, icon: c.icon }));
  }),

  /** Adiciona uma Área do catálogo (ou reativa se estava arquivada). */
  add: protectedProcedure
    .input(z.object({ catalogId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cat = await ctx.db
        .select()
        .from(lifeAreaCatalog)
        .where(eq(lifeAreaCatalog.id, input.catalogId))
        .limit(1);
      const c = cat[0];
      if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Área não encontrada." });

      const existente = await ctx.db
        .select({ id: lifeAreas.id, isArchived: lifeAreas.isArchived })
        .from(lifeAreas)
        .where(
          and(eq(lifeAreas.userId, ctx.userId), eq(lifeAreas.catalogId, c.id)),
        )
        .limit(1);
      if (existente[0]) {
        // Já existe (arquivada) → reativa, preservando XP.
        await ctx.db
          .update(lifeAreas)
          .set({ isArchived: false })
          .where(eq(lifeAreas.id, existente[0].id));
        return { ok: true as const, reativada: true };
      }
      await ctx.db.insert(lifeAreas).values({
        userId: ctx.userId,
        catalogId: c.id,
        name: c.namePt,
        colorToken: c.colorToken,
        icon: c.icon,
      });
      return { ok: true as const, reativada: false };
    }),

  /** Cria uma Área da Vida personalizada (ex.: "Música"). */
  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().trim().min(2).max(24),
        cor: z.enum(CORES_CUSTOM),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ativas = await ctx.db
        .select({ id: lifeAreas.id })
        .from(lifeAreas)
        .where(
          and(eq(lifeAreas.userId, ctx.userId), eq(lifeAreas.isArchived, false)),
        );
      if (ativas.length >= 20) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Limite de 20 Áreas ativas. Arquive alguma antes.",
        });
      }
      const [nova] = await ctx.db
        .insert(lifeAreas)
        .values({
          userId: ctx.userId,
          catalogId: null,
          name: input.nome,
          colorToken: input.cor,
          icon: "sparkles",
        })
        .returning({ id: lifeAreas.id });
      return { ok: true as const, id: nova!.id };
    }),

  /** Arquiva/desarquiva uma Área (XP preservado — nunca some). */
  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid(), arquivar: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .update(lifeAreas)
        .set({ isArchived: input.arquivar })
        .where(
          and(eq(lifeAreas.id, input.id), eq(lifeAreas.userId, ctx.userId)),
        )
        .returning({ id: lifeAreas.id });
      if (res.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Área não encontrada." });
      }
      return { ok: true as const };
    }),

  /** Cores disponíveis para Área personalizada. */
  cores: protectedProcedure.query(() => CORES_CUSTOM as readonly string[]),
});
