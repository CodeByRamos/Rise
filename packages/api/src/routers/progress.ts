import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import {
  users,
  profiles,
  userSettings,
  userStats,
  sparksWallet,
  lifeAreas,
  lifeAreaCatalog,
} from "@rise/db";
import { progressoNoNivel, nivelDeArea } from "@rise/core";
import { router, protectedProcedure } from "../trpc";

// Áreas criadas no onboarding inicial (o usuário pode adicionar/arquivar depois).
const AREAS_INICIAIS = [
  "programacao",
  "academia",
  "sono",
  "leitura",
  "idiomas",
  "saude",
];

/** Deriva um @handle válido (^[a-z0-9_]{3,20}$) a partir do e-mail + id. */
function derivarHandle(base: string, userId: string): string {
  const limpo = base.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 12) || "rise";
  const sufixo = userId.replace(/-/g, "").slice(0, 6);
  return `${limpo}_${sufixo}`.slice(0, 20);
}

export const progressRouter = router({
  /**
   * Cria os dados de domínio do usuário no primeiro acesso (idempotente):
   * users, profile, settings, stats, carteira de Faíscas e as Áreas iniciais.
   */
  bootstrap: protectedProcedure
    .input(
      z
        .object({
          email: z.string().email().optional(),
          displayName: z.string().max(60).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      return ctx.db.transaction(async (tx) => {
        const jaTem = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        if (jaTem.length > 0) return { criado: false as const, areas: 0 };

        const email = input?.email ?? ctx.email ?? `${userId}@rise.local`;
        const prefixo = email.split("@")[0] ?? "rise";
        const nome = input?.displayName ?? prefixo;

        await tx.insert(users).values({
          id: userId,
          email,
          handle: derivarHandle(prefixo, userId),
        });
        await tx.insert(profiles).values({ userId, displayName: nome });
        await tx.insert(userSettings).values({ userId });
        await tx.insert(userStats).values({ userId });
        await tx.insert(sparksWallet).values({ userId });

        const catalogo = await tx
          .select()
          .from(lifeAreaCatalog)
          .where(inArray(lifeAreaCatalog.id, AREAS_INICIAIS));
        for (const c of catalogo) {
          await tx.insert(lifeAreas).values({
            userId,
            catalogId: c.id,
            name: c.namePt,
            colorToken: c.colorToken,
            icon: c.icon,
          });
        }
        return { criado: true as const, areas: catalogo.length };
      });
    }),

  /** Dados da tela "Minha Evolução": Nível Rise + stats + Áreas da Vida. */
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const statsRows = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);
    const stats = statsRows[0];

    const areasRows = await ctx.db
      .select()
      .from(lifeAreas)
      .where(and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false)));

    return {
      riseLevel: stats?.riseLevel ?? 0,
      totalXp: stats?.totalXpAll ?? 0,
      activeAreas: stats?.activeAreas ?? 0,
      areas: areasRows.map((a) => {
        const p = progressoNoNivel(a.totalXp);
        return {
          id: a.id,
          nome: a.name,
          cor: a.colorToken,
          nivel: nivelDeArea(a.totalXp),
          fracao: p.fracao,
          xpNoNivel: p.xpNoNivel,
          xpDoNivel: p.xpDoNivel,
        };
      }),
    };
  }),
});
