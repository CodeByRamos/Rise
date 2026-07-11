import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { feedItems, profiles, cosmeticItems, reactions, follows, notifications } from "@rise/db";
import { router, protectedProcedure } from "../trpc";
import { enviarPush } from "../lib/push";

export const feedRouter = router({
  /**
   * Feed de MARCOS de progresso. Escopo global (comunidade) ou "seguindo"
   * (só quem o viewer segue). Nunca expõe o conteúdo da prova — só a conquista.
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limite: z.number().int().min(1).max(50).default(30),
          escopo: z.enum(["global", "seguindo"]).default("global"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const escopo = input?.escopo ?? "global";

      let filtroSeguindo;
      if (escopo === "seguindo") {
        const seguidos = await ctx.db
          .select({ id: follows.followingId })
          .from(follows)
          .where(eq(follows.followerId, userId));
        const ids = seguidos.map((s) => s.id);
        if (ids.length === 0) return [];
        filtroSeguindo = inArray(feedItems.userId, ids);
      }

      const rows = await ctx.db
        .select({
          id: feedItems.id,
          type: feedItems.type,
          payload: feedItems.payload,
          createdAt: feedItems.createdAt,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          framePreview: cosmeticItems.preview,
          forcas: sql<number>`(select count(*)::int from reactions r where r.feed_item_id = ${feedItems.id})`,
          deiForca: sql<boolean>`exists(select 1 from reactions r where r.feed_item_id = ${feedItems.id} and r.user_id = ${userId})`,
        })
        .from(feedItems)
        .innerJoin(profiles, eq(profiles.userId, feedItems.userId))
        .leftJoin(cosmeticItems, eq(cosmeticItems.id, profiles.equippedFrameId))
        .where(filtroSeguindo)
        .orderBy(desc(feedItems.id))
        .limit(input?.limite ?? 30);
      return rows;
    }),

  /** Dar/retirar "Força" (reação positiva única — o chevron da marca). */
  react: protectedProcedure
    .input(z.object({ feedItemId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const removed = await ctx.db
        .delete(reactions)
        .where(
          and(
            eq(reactions.feedItemId, input.feedItemId),
            eq(reactions.userId, userId),
          ),
        )
        .returning({ feedItemId: reactions.feedItemId });
      if (removed.length > 0) return { reagindo: false as const };
      // Marco precisa existir ANTES do insert — FK inválido virava 500 opaco.
      const dono = await ctx.db
        .select({ userId: feedItems.userId })
        .from(feedItems)
        .where(eq(feedItems.id, input.feedItemId))
        .limit(1);
      if (!dono[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Marco não encontrado." });
      }
      await ctx.db
        .insert(reactions)
        .values({ feedItemId: input.feedItemId, userId })
        .onConflictDoNothing();
      // Notifica o dono do marco (nunca a si mesmo).
      if (dono[0] && dono[0].userId !== userId) {
        await ctx.db.insert(notifications).values({
          userId: dono[0].userId,
          type: "reaction",
          actorId: userId,
          feedItemId: input.feedItemId,
        });
        // Push best-effort (nunca bloqueia nem quebra a reação).
        const quem = await ctx.db
          .select({ nome: profiles.displayName })
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1);
        void enviarPush(ctx.db, dono[0].userId, {
          title: "Força recebida",
          body: `${quem[0]?.nome ?? "Alguém"} deu Força ao seu marco.`,
          url: "/notificacoes",
        });
      }
      return { reagindo: true as const };
    }),
});
