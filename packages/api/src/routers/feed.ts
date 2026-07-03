import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { feedItems, profiles, cosmeticItems } from "@rise/db";
import { router, protectedProcedure } from "../trpc";

export const feedRouter = router({
  /**
   * Feed global de MARCOS de progresso (level-up, marcos de sequência, dia de
   * missões completo). Nunca expõe o conteúdo da prova — só a conquista.
   */
  list: protectedProcedure
    .input(z.object({ limite: z.number().int().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: feedItems.id,
          type: feedItems.type,
          payload: feedItems.payload,
          createdAt: feedItems.createdAt,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          framePreview: cosmeticItems.preview,
        })
        .from(feedItems)
        .innerJoin(profiles, eq(profiles.userId, feedItems.userId))
        .leftJoin(cosmeticItems, eq(cosmeticItems.id, profiles.equippedFrameId))
        .orderBy(desc(feedItems.id))
        .limit(input?.limite ?? 30);
      return rows;
    }),
});
