import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { feedItems, profiles, cosmeticItems, reactions } from "@rise/db";
import { router, protectedProcedure } from "../trpc";

export const feedRouter = router({
  /**
   * Feed global de MARCOS de progresso (level-up, marcos de sequência, dia de
   * missões completo). Nunca expõe o conteúdo da prova — só a conquista.
   */
  list: protectedProcedure
    .input(z.object({ limite: z.number().int().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
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
      await ctx.db
        .insert(reactions)
        .values({ feedItemId: input.feedItemId, userId })
        .onConflictDoNothing();
      return { reagindo: true as const };
    }),
});
