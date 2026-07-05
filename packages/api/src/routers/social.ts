import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { follows } from "@rise/db";
import { router, protectedProcedure } from "../trpc";

export const socialRouter = router({
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
