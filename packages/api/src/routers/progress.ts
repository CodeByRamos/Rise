import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull, inArray, desc, like } from "drizzle-orm";
import {
  users,
  profiles,
  userSettings,
  userStats,
  sparksWallet,
  lifeAreas,
  lifeAreaCatalog,
  streaks,
  actionLogs,
  xpEvents,
  cosmeticItems,
  LIFE_AREA_CATALOG,
} from "@rise/db";
import { progressoNoNivel, nivelDeArea, calcularNivelRise, cosmeticoPorId } from "@rise/core";
import { sql as dsql, gte } from "drizzle-orm";
import { outbox } from "@rise/db";
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
          displayName: z.string().max(60).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      // E-mail SEMPRE do JWT verificado (ctx) — aceitar do cliente permitia
      // "ocupar" o e-mail de outra pessoa e quebrar o bootstrap dela p/ sempre.
      const email = ctx.email ?? `${userId}@rise.local`;
      const prefixo = email.split("@")[0] ?? "rise";
      const nome = input?.displayName ?? prefixo;

      try {
        return await ctx.db.transaction(async (tx) => {
          // onConflictDoNothing + returning: corrida de dois bootstraps
          // simultâneos (mobile re-monta, web em outra aba) nunca vira 23505.
          const inseridos = await tx
            .insert(users)
            .values({ id: userId, email, handle: derivarHandle(prefixo, userId) })
            .onConflictDoNothing({ target: users.id })
            .returning({ id: users.id });
          if (inseridos.length === 0) return { criado: false as const, areas: 0 };

          await tx.insert(profiles).values({ userId, displayName: nome }).onConflictDoNothing();
          await tx.insert(userSettings).values({ userId }).onConflictDoNothing();
          await tx.insert(userStats).values({ userId }).onConflictDoNothing();
          await tx.insert(sparksWallet).values({ userId }).onConflictDoNothing();

          let catalogo = await tx
            .select()
            .from(lifeAreaCatalog)
            .where(inArray(lifeAreaCatalog.id, AREAS_INICIAIS));
          // Banco migrado mas sem seed: cai no catálogo do código em vez de
          // criar silenciosamente um usuário com zero Áreas (irrecuperável).
          if (catalogo.length === 0) {
            const doCodigo = LIFE_AREA_CATALOG.filter((c) =>
              AREAS_INICIAIS.includes(c.id),
            );
            for (const c of doCodigo) {
              await tx
                .insert(lifeAreaCatalog)
                .values({
                  id: c.id,
                  namePt: c.namePt,
                  nameEn: c.nameEn,
                  colorToken: c.colorToken,
                  icon: c.icon,
                  baseXpTable: { quick_log: c.baseXp, habit_check: c.baseXp },
                  isDefault: true,
                })
                .onConflictDoNothing();
            }
            catalogo = await tx
              .select()
              .from(lifeAreaCatalog)
              .where(inArray(lifeAreaCatalog.id, AREAS_INICIAIS));
          }
          for (const c of catalogo) {
            await tx
              .insert(lifeAreas)
              .values({
                userId,
                catalogId: c.id,
                name: c.namePt,
                colorToken: c.colorToken,
                icon: c.icon,
              })
              .onConflictDoNothing();
          }
          return { criado: true as const, areas: catalogo.length };
        });
      } catch (e) {
        // UNIQUE(email): conta de Auth recriada com o mesmo e-mail (uuid novo)
        // — erro claro em vez de 500 opaco e permanente.
        if (e instanceof Error && /users_email_unique|duplicate key/i.test(e.message)) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Já existe um perfil Rise com este e-mail (de uma conta anterior). Fale com o suporte para religar seus dados.",
          });
        }
        throw e;
      }
    }),

  /**
   * Modo Descanso (doc 13 §5.3): pausa planejada de até 14 dias — a sequência
   * congela, não quebra. Sem custo, sem culpa. `ateDias: null` desativa.
   */
  restMode: protectedProcedure
    .input(z.object({ ateDias: z.number().int().min(1).max(14).nullable() }))
    .mutation(async ({ ctx, input }) => {
      const until =
        input.ateDias === null
          ? null
          : dsql`now() + make_interval(days => ${input.ateDias})`;
      await ctx.db
        .insert(userSettings)
        .values({ userId: ctx.userId, restModeUntil: until as never })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: { restModeUntil: until as never, updatedAt: dsql`now()` },
        });
      await ctx.db.insert(outbox).values({
        eventType: "rest.mode.toggled",
        payload: { userId: ctx.userId, enabled: input.ateDias !== null, dias: input.ateDias },
      });
      return { ok: true as const };
    }),

  /**
   * Diário de Evolução: últimas ações com PROVA (nota/foto) + área + XP ganho.
   * É a matéria-prima do feed social da Fase 2.
   */
  diario: protectedProcedure
    .input(z.object({ limite: z.number().int().min(1).max(50).default(12) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: actionLogs.id,
          note: actionLogs.note,
          photoPath: actionLogs.photoPath,
          createdAt: actionLogs.createdAt,
          areaNome: lifeAreas.name,
          areaCor: lifeAreas.colorToken,
          xp: xpEvents.amount,
        })
        .from(actionLogs)
        .innerJoin(lifeAreas, eq(actionLogs.lifeAreaId, lifeAreas.id))
        // Só o evento DA AÇÃO (act:%): missão concluída grava um 2º xp_event
        // no mesmo action_log e duplicava a linha no diário.
        .leftJoin(
          xpEvents,
          and(
            eq(xpEvents.actionLogId, actionLogs.id),
            like(xpEvents.idempotencyKey, "act:%"),
          ),
        )
        .where(eq(actionLogs.userId, ctx.userId))
        .orderBy(desc(actionLogs.id))
        .limit(input?.limite ?? 12);
      return rows;
    }),

  /**
   * Heatmap de consistência: ações por dia (fuso do usuário) nos últimos ~26
   * semanas. "Toda ação aparece" virou visual.
   */
  heatmap: protectedProcedure.query(async ({ ctx }) => {
    const u = await ctx.db
      .select({ tz: users.timezone })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);
    const tz = u[0]?.tz ?? "America/Sao_Paulo";
    const diaExpr = dsql<string>`to_char((${actionLogs.createdAt} at time zone ${tz}), 'YYYY-MM-DD')`;
    const rows = await ctx.db
      .select({ dia: diaExpr, n: dsql<number>`count(*)::int` })
      .from(actionLogs)
      .where(
        and(
          eq(actionLogs.userId, ctx.userId),
          gte(actionLogs.createdAt, dsql`now() - interval '182 days'`),
        ),
      )
      .groupBy(dsql`1`);
    return rows.map((r) => ({ dia: r.dia, n: Number(r.n) }));
  }),

  /**
   * Resumo de momentum dos últimos 7 dias (Sprint 5 — estatísticas no Free):
   * XP da semana vs. semana anterior (tendência), ações registradas e a Área
   * que mais subiu. Derivado do ledger imutável — leitura, nunca escreve.
   */
  resumoSemana: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    // XP das duas janelas de 7 dias numa passada só (FILTER agrega ambas).
    const janelasRows = await ctx.db
      .select({
        xp7: dsql<number>`coalesce(sum(${xpEvents.amount}) filter (where ${xpEvents.createdAt} >= now() - interval '7 days'), 0)::bigint`,
        xpAnterior: dsql<number>`coalesce(sum(${xpEvents.amount}) filter (where ${xpEvents.createdAt} >= now() - interval '14 days' and ${xpEvents.createdAt} < now() - interval '7 days'), 0)::bigint`,
      })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.userId, userId),
          gte(xpEvents.createdAt, dsql`now() - interval '14 days'`),
        ),
      );
    const xp7 = Number(janelasRows[0]?.xp7 ?? 0);
    const xpAnterior = Number(janelasRows[0]?.xpAnterior ?? 0);

    const acoesRows = await ctx.db
      .select({ n: dsql<number>`count(*)::int` })
      .from(actionLogs)
      .where(
        and(
          eq(actionLogs.userId, userId),
          gte(actionLogs.createdAt, dsql`now() - interval '7 days'`),
        ),
      );
    const acoes7 = Number(acoesRows[0]?.n ?? 0);

    // Área que mais subiu na semana (por XP), com nome/cor para a UI.
    const topRows = await ctx.db
      .select({
        nome: lifeAreas.name,
        cor: lifeAreas.colorToken,
        xp: dsql<number>`sum(${xpEvents.amount})::bigint`,
      })
      .from(xpEvents)
      .innerJoin(lifeAreas, eq(xpEvents.lifeAreaId, lifeAreas.id))
      .where(
        and(
          eq(xpEvents.userId, userId),
          gte(xpEvents.createdAt, dsql`now() - interval '7 days'`),
        ),
      )
      .groupBy(lifeAreas.id, lifeAreas.name, lifeAreas.colorToken)
      .orderBy(dsql`3 desc`)
      .limit(1);
    const top = topRows[0];
    const topArea =
      top && Number(top.xp) > 0
        ? { nome: top.nome, cor: top.cor, xp: Number(top.xp) }
        : null;

    // Tendência % vs. semana anterior. Sem base (0 na anterior) ⇒ null.
    const tendencia =
      xpAnterior > 0 ? Math.round(((xp7 - xpAnterior) / xpAnterior) * 100) : null;

    return { xp7, xpAnterior, tendencia, acoes7, topArea };
  }),

  /**
   * Dados da tela "Minha Evolução": Nível Rise + stats + Áreas da Vida.
   * Totais derivados DAS ÁREAS na leitura (via @rise/core) — não da projeção
   * user_stats, que pode ficar momentaneamente atrás sob ações concorrentes.
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    // As cinco leituras abaixo são independentes — uma passada concorrente em
    // vez de seis round-trips sequenciais (caminho mais quente do app).
    const [areasRows, streakRows, walletRows, perfilRows, settingsRows] =
      await Promise.all([
        ctx.db
          .select()
          .from(lifeAreas)
          .where(
            and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false)),
          ),
        ctx.db
          .select({
            current: streaks.currentCount,
            longest: streaks.longestCount,
            freezes: streaks.freezesAvailable,
            pendingRepairValue: streaks.pendingRepairValue,
            repairDeadline: streaks.repairDeadline,
          })
          .from(streaks)
          .where(and(eq(streaks.userId, userId), isNull(streaks.lifeAreaId)))
          .limit(1),
        ctx.db
          .select({ balance: sparksWallet.balance })
          .from(sparksWallet)
          .where(eq(sparksWallet.userId, userId))
          .limit(1),
        ctx.db
          .select({
            avatarUrl: profiles.avatarUrl,
            equippedFrameId: profiles.equippedFrameId,
            equippedThemeId: profiles.equippedThemeId,
          })
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1),
        ctx.db
          .select({ restModeUntil: userSettings.restModeUntil, prefs: userSettings.prefs })
          .from(userSettings)
          .where(eq(userSettings.userId, userId))
          .limit(1),
      ]);

    const sr = streakRows[0];
    const streakRepair =
      sr?.pendingRepairValue != null &&
      sr.repairDeadline != null &&
      sr.repairDeadline.getTime() > Date.now()
        ? { valor: sr.pendingRepairValue, prazo: sr.repairDeadline }
        : null;

    const rise = calcularNivelRise(
      areasRows.map((a) => ({
        xp: a.totalXp,
        ativaNoPeriodo: nivelDeArea(a.totalXp) >= 2,
      })),
    );

    const restRaw = settingsRows[0]?.restModeUntil ?? null;
    const restModeUntil =
      restRaw && restRaw.getTime() > Date.now() ? restRaw : null;
    const perfil = perfilRows[0];
    let framePreview: Record<string, unknown> | null = null;
    let themePreview: Record<string, unknown> | null = null;
    if (perfil?.equippedFrameId || perfil?.equippedThemeId) {
      const ids = [perfil.equippedFrameId, perfil.equippedThemeId].filter(
        (x): x is string => !!x,
      );
      const itens = await ctx.db
        .select({ id: cosmeticItems.id, preview: cosmeticItems.preview })
        .from(cosmeticItems)
        .where(inArray(cosmeticItems.id, ids));
      framePreview =
        itens.find((i) => i.id === perfil.equippedFrameId)?.preview ?? null;
      themePreview =
        itens.find((i) => i.id === perfil.equippedThemeId)?.preview ?? null;
    }

    // Fundo de perfil + título vêm do catálogo (prefs guardam só o id).
    const prefs = (settingsRows[0]?.prefs ?? {}) as {
      equippedProfileBg?: string | null;
      equippedTitle?: string | null;
    };
    const bgDef = cosmeticoPorId(prefs.equippedProfileBg);
    const titleDef = cosmeticoPorId(prefs.equippedTitle);

    return {
      avatarUrl: perfil?.avatarUrl ?? null,
      framePreview,
      themePreview,
      profileBgPreview: bgDef?.preview ?? null,
      titulo: titleDef ? { texto: titleDef.name, cor: (titleDef.preview as { cor?: string }).cor ?? null } : null,
      restModeUntil,
      riseLevel: rise.nivelRise,
      totalXp: rise.xpRise,
      activeAreas: rise.areasAtivas,
      sparks: walletRows[0]?.balance ?? 0,
      streakDias: sr?.current ?? 0,
      streakRecorde: sr?.longest ?? 0,
      freezes: sr?.freezes ?? 0,
      streakRepair,
      areas: areasRows.map((a) => {
        const p = progressoNoNivel(a.totalXp);
        return {
          id: a.id,
          nome: a.name,
          cor: a.colorToken,
          catalogId: a.catalogId,
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

  /**
   * Calendário de atividade: contagem de ações por dia (fuso do usuário) de um
   * mês. Alimenta a grade mensal navegável do Histórico.
   */
  calendario: protectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2020).max(2100),
        mes: z.number().int().min(1).max(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const uRows = await ctx.db
        .select({ tz: users.timezone })
        .from(users)
        .where(eq(users.id, ctx.userId))
        .limit(1);
      const tz = uRows[0]?.tz ?? "America/Sao_Paulo";
      const ym = `${input.ano}-${String(input.mes).padStart(2, "0")}`;
      const diaExpr = dsql<string>`to_char((${actionLogs.createdAt} at time zone ${tz}), 'YYYY-MM-DD')`;
      const rows = await ctx.db
        .select({ dia: diaExpr, n: dsql<number>`count(*)::int` })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.userId, ctx.userId),
            dsql`to_char((${actionLogs.createdAt} at time zone ${tz}), 'YYYY-MM') = ${ym}`,
          ),
        )
        .groupBy(dsql`1`);
      return { ym, dias: rows.map((r) => ({ dia: r.dia, n: Number(r.n) })) };
    }),

  /** Detalhe de um dia (fuso do usuário): as provas registradas naquela data. */
  diaDetalhe: protectedProcedure
    .input(z.object({ data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const uRows = await ctx.db
        .select({ tz: users.timezone })
        .from(users)
        .where(eq(users.id, ctx.userId))
        .limit(1);
      const tz = uRows[0]?.tz ?? "America/Sao_Paulo";
      const rows = await ctx.db
        .select({
          id: actionLogs.id,
          note: actionLogs.note,
          photoPath: actionLogs.photoPath,
          kind: actionLogs.kind,
          createdAt: actionLogs.createdAt,
          areaNome: lifeAreas.name,
          areaCor: lifeAreas.colorToken,
          xp: xpEvents.amount,
        })
        .from(actionLogs)
        .innerJoin(lifeAreas, eq(actionLogs.lifeAreaId, lifeAreas.id))
        .leftJoin(
          xpEvents,
          and(
            eq(xpEvents.actionLogId, actionLogs.id),
            like(xpEvents.idempotencyKey, "act:%"),
          ),
        )
        .where(
          and(
            eq(actionLogs.userId, ctx.userId),
            dsql`to_char((${actionLogs.createdAt} at time zone ${tz}), 'YYYY-MM-DD') = ${input.data}`,
          ),
        )
        .orderBy(desc(actionLogs.id));
      return rows;
    }),
});
