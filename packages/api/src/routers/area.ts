import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { lifeAreas, lifeAreaCatalog, LIFE_AREA_CATALOG } from "@rise/db";
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
    // Une o catálogo do banco com o do código (áreas novas ainda não seedadas
    // aparecem sem re-seed — o add cria a linha de catálogo sob demanda).
    const dbIds = new Set(cat.map((c) => c.id));
    const doCodigo = LIFE_AREA_CATALOG.filter((c) => !dbIds.has(c.id));
    return [
      ...cat.map((c) => ({ id: c.id, nome: c.namePt, cor: c.colorToken, icon: c.icon })),
      ...doCodigo.map((c) => ({ id: c.id, nome: c.namePt, cor: c.colorToken, icon: c.icon })),
    ].filter((c) => !tenho.has(c.id));
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
      let c: { id: string; namePt: string; colorToken: string; icon: string } | undefined = cat[0];
      if (!c) {
        // Catálogo do banco desatualizado: cria a linha a partir do código
        // (idempotente) antes de vincular a Área — evita FK quebrada.
        const code = LIFE_AREA_CATALOG.find((x) => x.id === input.catalogId);
        if (!code) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Área não encontrada." });
        }
        await ctx.db
          .insert(lifeAreaCatalog)
          .values({
            id: code.id,
            namePt: code.namePt,
            nameEn: code.nameEn,
            colorToken: code.colorToken,
            icon: code.icon,
            baseXpTable: { quick_log: code.baseXp, habit_check: code.baseXp },
            isDefault: true,
          })
          .onConflictDoNothing();
        c = { id: code.id, namePt: code.namePt, colorToken: code.colorToken, icon: code.icon };
      }

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
      // onConflictDoNothing: duplo-toque concorrente no mesmo chip do
      // catálogo batia no unique parcial (user, catalog) → 23505 → 500.
      await ctx.db
        .insert(lifeAreas)
        .values({
          userId: ctx.userId,
          catalogId: c.id,
          name: c.namePt,
          colorToken: c.colorToken,
          icon: c.icon,
        })
        .onConflictDoNothing();
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
