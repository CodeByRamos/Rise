import { z } from "zod";
import { and, eq, isNull, inArray } from "drizzle-orm";
import {
  users,
  profiles,
  userSettings,
  userStats,
  sparksWallet,
  lifeAreas,
  lifeAreaCatalog,
  streaks,
  LIFE_AREA_CATALOG,
} from "@rise/db";
import { progressoNoNivel, nivelDeArea, calcularNivelRise } from "@rise/core";
import { router, protectedProcedure } from "../trpc";

// XP-base por área do catálogo (para o optimistic UI do cliente).
const BASE_XP = new Map(LIFE_AREA_CATALOG.map((a) => [a.id, a.baseXp] as const));
const BASE_CUSTOM = 10;

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

  /**
   * Dados da tela "Minha Evolução": Nível Rise + stats + Áreas da Vida.
   * Totais derivados DAS ÁREAS na leitura (via @rise/core) — não da projeção
   * user_stats, que pode ficar momentaneamente atrás sob ações concorrentes.
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const areasRows = await ctx.db
      .select()
      .from(lifeAreas)
      .where(and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false)));

    const streakRows = await ctx.db
      .select({ current: streaks.currentCount })
      .from(streaks)
      .where(and(eq(streaks.userId, userId), isNull(streaks.lifeAreaId)))
      .limit(1);

    const rise = calcularNivelRise(
      areasRows.map((a) => ({
        xp: a.totalXp,
        ativaNoPeriodo: nivelDeArea(a.totalXp) >= 2,
      })),
    );

    return {
      riseLevel: rise.nivelRise,
      totalXp: rise.xpRise,
      activeAreas: rise.areasAtivas,
      streakDias: streakRows[0]?.current ?? 0,
      areas: areasRows.map((a) => {
        const p = progressoNoNivel(a.totalXp);
        return {
          id: a.id,
          nome: a.name,
          cor: a.colorToken,
          baseXp:
            a.catalogId && BASE_XP.has(a.catalogId)
              ? BASE_XP.get(a.catalogId)!
              : BASE_CUSTOM,
          nivel: nivelDeArea(a.totalXp),
          fracao: p.fracao,
          xpNoNivel: p.xpNoNivel,
          xpDoNivel: p.xpDoNivel,
        };
      }),
    };
  }),
});
