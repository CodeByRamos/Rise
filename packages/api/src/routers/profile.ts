import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  users,
  profiles,
  inventory,
  cosmeticItems,
  userAchievements,
} from "@rise/db";
import { ACHIEVEMENT_CATALOG } from "@rise/core";
import { router, protectedProcedure } from "../trpc";

export const profileRouter = router({
  /** Perfil próprio + itens possuídos. */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const rows = await ctx.db
      .select({
        displayName: profiles.displayName,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        equippedFrameId: profiles.equippedFrameId,
        equippedThemeId: profiles.equippedThemeId,
        handle: users.handle,
      })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(eq(profiles.userId, userId))
      .limit(1);
    const p = rows[0];
    if (!p) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado." });
    }

    const owned = await ctx.db
      .select({
        id: cosmeticItems.id,
        name: cosmeticItems.name,
        kind: cosmeticItems.kind,
        preview: cosmeticItems.preview,
      })
      .from(inventory)
      .innerJoin(cosmeticItems, eq(cosmeticItems.id, inventory.itemId))
      .where(eq(inventory.userId, userId));

    return { ...p, owned };
  }),

  /** Catálogo completo de conquistas com estado (critérios sempre visíveis). */
  achievements: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, ctx.userId));
    const unlocked = new Map(rows.map((r) => [r.id, r.unlockedAt]));
    return ACHIEVEMENT_CATALOG.map((a) => ({
      ...a,
      unlockedAt: unlocked.get(a.id) ?? null,
    }));
  }),

  /** Atualiza nome, bio e/ou avatar (caminho no bucket público `avatars`). */
  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().trim().min(2).max(40).optional(),
        bio: z.string().trim().max(280).optional(),
        avatarPath: z.string().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.displayName && input.bio === undefined && !input.avatarPath) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nada para atualizar." });
      }
      await ctx.db
        .update(profiles)
        .set({
          ...(input.displayName ? { displayName: input.displayName } : {}),
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
          ...(input.avatarPath ? { avatarUrl: input.avatarPath } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, ctx.userId));
      return { ok: true as const };
    }),

  /** Equipa (ou remove com null) um cosmético POSSUÍDO. */
  equip: protectedProcedure
    .input(
      z.object({
        kind: z.enum(["frame", "theme"]),
        itemId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.itemId) {
        const owned = await ctx.db
          .select({ itemId: inventory.itemId, kind: cosmeticItems.kind })
          .from(inventory)
          .innerJoin(cosmeticItems, eq(cosmeticItems.id, inventory.itemId))
          .where(
            and(eq(inventory.userId, ctx.userId), eq(inventory.itemId, input.itemId)),
          )
          .limit(1);
        if (!owned[0] || owned[0].kind !== input.kind) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não possui este cosmético.",
          });
        }
      }
      await ctx.db
        .update(profiles)
        .set(
          input.kind === "frame"
            ? { equippedFrameId: input.itemId, updatedAt: new Date() }
            : { equippedThemeId: input.itemId, updatedAt: new Date() },
        )
        .where(eq(profiles.userId, ctx.userId));
      return { ok: true as const };
    }),
});
