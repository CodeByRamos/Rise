import { z } from "zod";
import { and, eq, ne, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { follows, users, profiles, userStats, cosmeticItems, notifications } from "@rise/db";
import { router, protectedProcedure } from "../trpc";

export const socialRouter = router({
  /** Descobrir pessoas: perfis públicos ativos, ordenados por Nível Rise. */
  discover: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        userId: users.id,
        handle: users.handle,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        framePreview: cosmeticItems.preview,
        nivelRise: userStats.riseLevel,
        seguindo: sql<boolean>`exists(select 1 from follows f where f.follower_id = ${ctx.userId} and f.following_id = ${users.id})`,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(userStats, eq(userStats.userId, users.id))
      .leftJoin(cosmeticItems, eq(cosmeticItems.id, profiles.equippedFrameId))
      .where(
        and(
          eq(profiles.isSearchable, true),
          eq(users.status, "active"),
          ne(users.id, ctx.userId),
        ),
      )
      .orderBy(desc(userStats.riseLevel))
      .limit(40);
    return rows.map((r) => ({ ...r, nivelRise: r.nivelRise ?? 0 }));
  }),

  /** Seguir/deixar de seguir um usuário (toggle). */
  toggleFollow: protectedProcedure
    .input(z.object({ targetUserId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.targetUserId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode seguir a si mesmo." });
      }
      const existe = await ctx.db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, ctx.userId),
            eq(follows.followingId, input.targetUserId),
          ),
        )
        .returning({ f: follows.followerId });
      if (existe.length > 0) return { seguindo: false as const };
      await ctx.db
        .insert(follows)
        .values({ followerId: ctx.userId, followingId: input.targetUserId })
        .onConflictDoNothing();
      await ctx.db.insert(notifications).values({
        userId: input.targetUserId,
        type: "follow",
        actorId: ctx.userId,
      });
      return { seguindo: true as const };
    }),

  /** O viewer segue este usuário? */
  amFollowing: protectedProcedure
    .input(z.object({ targetUserId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const r = await ctx.db
        .select({ f: follows.followerId })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.userId),
            eq(follows.followingId, input.targetUserId),
          ),
        )
        .limit(1);
      return { seguindo: r.length > 0 };
    }),
});
