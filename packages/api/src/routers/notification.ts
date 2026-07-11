import { z } from "zod";
import { and, desc, eq, isNull, sql, aliasedTable } from "drizzle-orm";
import { notifications, profiles, cosmeticItems, feedItems } from "@rise/db";
import { router, protectedProcedure } from "../trpc";

const ator = aliasedTable(profiles, "ator");

export const notificationRouter = router({
  /** Contagem de não lidas (para o badge do sino). */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const r = await ctx.db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, ctx.userId), isNull(notifications.readAt)),
      );
    return r[0]?.n ?? 0;
  }),

  /** Lista as notificações recentes com dados do ator. */
  list: protectedProcedure
    .input(z.object({ limite: z.number().int().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: notifications.id,
          type: notifications.type,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
          feedItemId: notifications.feedItemId,
          actorName: ator.displayName,
          actorAvatar: ator.avatarUrl,
          actorFrame: cosmeticItems.preview,
          marcoType: feedItems.type,
          marcoPayload: feedItems.payload,
        })
        .from(notifications)
        .innerJoin(ator, eq(ator.userId, notifications.actorId))
        .leftJoin(cosmeticItems, eq(cosmeticItems.id, ator.equippedFrameId))
        .leftJoin(feedItems, eq(feedItems.id, notifications.feedItemId))
        .where(eq(notifications.userId, ctx.userId))
        .orderBy(desc(notifications.id))
        .limit(input?.limite ?? 30);
    }),

  /** Marca todas como lidas. */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ readAt: sql`now()` })
      .where(
        and(eq(notifications.userId, ctx.userId), isNull(notifications.readAt)),
      );
    return { ok: true as const };
  }),
});
