import { and, eq, gte, gt, lte, isNotNull, sql } from "drizzle-orm";
import { xpEvents, profiles } from "@rise/db";
import { CLASS_CATALOG } from "@rise/core";
import { router, protectedProcedure } from "../trpc";
import { inicioSemanaUTC } from "../lib/semana";

/**
 * Guerras de Classe: XP agregado por Classe principal declarada no perfil
 * (surfistas vs. desenvolvedores...). Mesma janela e mesmo espírito da Liga
 * (docs canon: competição só por progresso real, nunca por dinheiro) — aqui a
 * unidade é a Classe, não o indivíduo. Quem não declarou Classe não entra na
 * disputa (incentivo honesto a declarar, não penalidade).
 *
 * Elegibilidade anti-exploit: só conta XP de quem já estava na Classe ANTES
 * do início da semana (`mainClassSince <= inicio`). Sem isso, dava para virar
 * de Classe na sexta-feira e "roubar" retroativamente uma semana inteira de
 * XP para a Classe líder. Trocar de Classe nunca perde XP/nível — só adia a
 * contagem coletiva para a segunda seguinte.
 */
export const classWarRouter = router({
  week: protectedProcedure.query(async ({ ctx }) => {
    const inicio = inicioSemanaUTC(new Date());

    // XP ganho por Classe na semana (só ganhos, não estornos), só de membros
    // elegíveis (na Classe desde antes desta semana).
    const agregado = await ctx.db
      .select({
        classId: profiles.mainClassId,
        xp: sql<number>`sum(${xpEvents.amount})::int`,
        membros: sql<number>`count(distinct ${xpEvents.userId})::int`,
      })
      .from(xpEvents)
      .innerJoin(profiles, eq(profiles.userId, xpEvents.userId))
      .where(
        and(
          gte(xpEvents.createdAt, inicio),
          gt(xpEvents.amount, 0),
          isNotNull(profiles.mainClassId),
          isNotNull(profiles.mainClassSince),
          lte(profiles.mainClassSince, inicio),
        ),
      )
      .groupBy(profiles.mainClassId);

    const porClasse = new Map(
      agregado
        .filter((r): r is typeof r & { classId: string } => r.classId !== null)
        .map((r) => [r.classId, r] as const),
    );

    const meuPerfil = await ctx.db
      .select({
        mainClassId: profiles.mainClassId,
        mainClassSince: profiles.mainClassSince,
      })
      .from(profiles)
      .where(eq(profiles.userId, ctx.userId))
      .limit(1);
    const minhaClasseId = meuPerfil[0]?.mainClassId ?? null;
    const minhaClasseDesde = meuPerfil[0]?.mainClassSince ?? null;
    // Elegível = já estava na Classe antes desta semana começar.
    const souElegivel =
      minhaClasseDesde !== null && minhaClasseDesde.getTime() <= inicio.getTime();

    const ranking = CLASS_CATALOG.map((c) => {
      const r = porClasse.get(c.id);
      return {
        classId: c.id,
        nome: c.nome,
        colorToken: c.colorToken,
        xp: r?.xp ?? 0,
        membros: r?.membros ?? 0,
        souMinhaClasse: c.id === minhaClasseId,
      };
    })
      .sort((a, b) => b.xp - a.xp)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    const minhaPos = minhaClasseId
      ? (ranking.find((r) => r.classId === minhaClasseId)?.rank ?? null)
      : null;

    return {
      inicioSemana: inicio,
      minhaClasseId,
      minhaPos,
      souElegivel,
      ranking,
    };
  }),
});
