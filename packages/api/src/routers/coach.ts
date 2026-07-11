import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, isNull, desc, sql as dsql } from "drizzle-orm";
import {
  users,
  lifeAreas,
  actionLogs,
  streaks,
  userMissions,
  goals,
  coachMessages,
  type Database,
} from "@rise/db";
import { dataLocalISO, nivelDeArea, calcularNivelRise, isPremium } from "@rise/core";
import {
  createCoachClient,
  responderCoach,
  formatarFatos,
  type BlocoFatos,
  type CoachMensagem,
} from "@rise/ai";
import { router, protectedProcedure, planProcedure } from "../trpc";

interface DadosCheckin {
  displayName: string | null;
  acoesHoje: number;
  acoes7d: number;
  streakGeral: number;
  nivelRise: number;
  areas: { nome: string; nivel: number; xp: number }[];
  missoesPendentes: { titulo: string; progress: number; target: number }[];
  metas: { titulo: string; atual: number; alvo: number; unidade: string | null }[];
}

interface ContextoCoach {
  timezone: string;
  hoje: string;
  dados: DadosCheckin;
  fatos: BlocoFatos;
  /** Estado factual em texto (ações/sequência/missões/metas) para o prompt. */
  resumo: string;
}

/**
 * Coleta o contexto do Coach uma vez (stats + FATOS) — compartilhado pelo
 * check-in e pela conversa, evitando duplicar as leituras. Retorna null se o
 * usuário de domínio ainda não existe (bootstrap não rodou).
 */
async function coletarContexto(
  db: Database,
  userId: string,
): Promise<ContextoCoach | null> {
  const u = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u[0]) return null;
  const timezone: string = u[0].timezone;
  const hoje = dataLocalISO(new Date(), timezone);
  const ontem = dataLocalISO(new Date(Date.now() - 86_400_000), timezone);

  const meiaNoiteLocal = dsql`(${hoje}::date::timestamp AT TIME ZONE ${timezone})`;
  // Leituras independentes em paralelo (todas dependem só de userId + hoje).
  const [areasRows, streakRows, hojeCount, semanaCount, pendentes, metasRows] =
    await Promise.all([
      db
        .select({ nome: lifeAreas.name, xp: lifeAreas.totalXp })
        .from(lifeAreas)
        .where(and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false))),
      db
        .select({ current: streaks.currentCount, last: streaks.lastActiveDate })
        .from(streaks)
        .where(and(eq(streaks.userId, userId), isNull(streaks.lifeAreaId)))
        .limit(1),
      db
        .select({ n: dsql<number>`count(*)::int` })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.userId, userId),
            gte(actionLogs.createdAt, meiaNoiteLocal),
          ),
        ),
      db
        .select({ n: dsql<number>`count(*)::int` })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.userId, userId),
            gte(actionLogs.createdAt, dsql`now() - interval '7 days'`),
          ),
        ),
      db
        .select({
          titulo: userMissions.title,
          progress: userMissions.progress,
          target: userMissions.target,
        })
        .from(userMissions)
        .where(
          and(
            eq(userMissions.userId, userId),
            eq(userMissions.assignedDate, hoje),
            eq(userMissions.status, "pending"),
          ),
        ),
      db
        .select({
          title: goals.title,
          currentValue: goals.currentValue,
          targetValue: goals.targetValue,
          unit: goals.unit,
        })
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
        .orderBy(dsql`${goals.dueAt} asc nulls last`)
        .limit(3),
    ]);

  const areas = areasRows.map((a: { nome: string; xp: number }) => ({
    nome: a.nome,
    nivel: nivelDeArea(a.xp),
    xp: a.xp,
  }));
  const ultimoDia = streakRows[0]?.last ?? null;
  const streakGeral =
    ultimoDia === hoje || ultimoDia === ontem ? (streakRows[0]?.current ?? 0) : 0;
  const nivelRise = calcularNivelRise(
    areasRows.map((a: { xp: number }) => ({ xp: a.xp, ativaNoPeriodo: a.xp > 0 })),
  ).nivelRise;

  const metas = metasRows.map(
    (m: {
      title: string;
      currentValue: string;
      targetValue: string;
      unit: string | null;
    }) => ({
      titulo: m.title,
      atual: Number(m.currentValue),
      alvo: Number(m.targetValue),
      unidade: m.unit,
    }),
  );

  const dados: DadosCheckin = {
    displayName: null,
    acoesHoje: hojeCount[0]?.n ?? 0,
    acoes7d: semanaCount[0]?.n ?? 0,
    streakGeral,
    nivelRise,
    areas,
    missoesPendentes: pendentes,
    metas,
  };

  const fatos: BlocoFatos = {
    periodo: "hoje",
    nivelRise,
    acoesTotalSemana: dados.acoes7d,
    areas: areas.map((a: { nome: string; nivel: number }) => ({
      area: a.nome,
      nivel: a.nivel,
    })),
    alertaStreak: [],
  };

  const resumo = [
    `Ações hoje: ${dados.acoesHoje}.`,
    `Sequência geral: ${streakGeral} dias.`,
    `Nível Rise: ${nivelRise}.`,
    `Missões pendentes: ${pendentes.map((p: { titulo: string; progress: number; target: number }) => `${p.titulo} (${p.progress}/${p.target})`).join("; ") || "nenhuma"}.`,
    `Metas ativas: ${metas.map((m: { titulo: string; atual: number; alvo: number; unidade: string | null }) => `${m.titulo} (${m.atual}/${m.alvo}${m.unidade ? ` ${m.unidade}` : ""})`).join("; ") || "nenhuma declarada"}.`,
  ].join(" ");

  return { timezone, hoje, dados, fatos, resumo };
}

/**
 * Check-in L0 — heurística determinística, sem LLM (doc 14 §3.2).
 * Voz do Coach: direta, calorosa, ancorada em dados, nunca culpa.
 */
function checkinHeuristico(d: DadosCheckin): string {
  if (d.acoesHoje === 0) {
    const alvo =
      [...d.areas].sort((a, b) => a.xp - b.xp)[0]?.nome ?? "uma Área da Vida";
    const streakTxt =
      d.streakGeral > 0
        ? ` Sua sequência de ${d.streakGeral} ${d.streakGeral === 1 ? "dia" : "dias"} continua viva com uma ação hoje.`
        : "";
    return `Seu dia ainda não entrou no placar. Uma ação em ${alvo} já muda isso —${streakTxt || " e começa uma nova sequência."}`;
  }

  if (d.missoesPendentes.length > 0) {
    const prox = [...d.missoesPendentes].sort(
      (a, b) => a.target - a.progress - (b.target - b.progress),
    )[0]!;
    return `${d.acoesHoje} ${d.acoesHoje === 1 ? "ação registrada" : "ações registradas"} hoje. Falta pouco: "${prox.titulo}" está em ${prox.progress}/${prox.target}.`;
  }

  return `Dia completo: ${d.acoesHoje} ${d.acoesHoje === 1 ? "ação" : "ações"} e todas as missões feitas. Amanhã sua sequência vira ${d.streakGeral + 1} dias — até lá, descanse bem.`;
}

export const coachRouter = router({
  /**
   * Check-in diário do Coach. Camadas por custo (doc 14): sem ANTHROPIC_API_KEY
   * ou em falha do LLM → heurística L0 (grátis, determinística, ancorada em
   * dados reais). Com chave → Sonnet com bloco FATOS (anti-alucinação).
   */
  checkin: protectedProcedure.query(async ({ ctx }) => {
    const c = await coletarContexto(ctx.db, ctx.userId);
    if (!c) {
      return {
        texto: "Registre sua primeira ação para começarmos.",
        camada: "heuristica" as const,
      };
    }

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const r = await responderCoach({
          client: createCoachClient(),
          req: {
            kind: "dailyCoach",
            texto: `Check-in diário. ${c.resumo} Responda em no máximo 3 frases curtas, PT-BR, tom de mentor; se fizer sentido, conecte a próxima ação a uma meta.`,
          },
          ctx: { isPremium: false, sonnetQuotaExhausted: false },
          fatos: formatarFatos(c.fatos),
        });
        if (r.texto) return { texto: r.texto, camada: r.camada };
      } catch {
        // cai no L0
      }
    }

    return { texto: checkinHeuristico(c.dados), camada: "heuristica" as const };
  }),

  /** Histórico recente da conversa (ordem cronológica). */
  historico: protectedProcedure
    .input(z.object({ limite: z.number().int().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: coachMessages.id,
          role: coachMessages.role,
          content: coachMessages.content,
          createdAt: coachMessages.createdAt,
        })
        .from(coachMessages)
        .where(eq(coachMessages.userId, ctx.userId))
        .orderBy(desc(coachMessages.id))
        .limit(input?.limite ?? 30);
      return rows.reverse();
    }),

  /** Estado da cota diária do Coach conversacional (para a UI). */
  quota: planProcedure.query(async ({ ctx }) => {
    const limite = ctx.entitlements.coachDailyMessages;
    const ilimitado = !Number.isFinite(limite);
    if (ilimitado) return { ilimitado: true as const, usadas: 0, restante: null };

    const u = await ctx.db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);
    const tz = u[0]?.timezone ?? "America/Sao_Paulo";
    const hoje = dataLocalISO(new Date(), tz);
    const usadasRows = await ctx.db
      .select({ n: dsql<number>`count(*)::int` })
      .from(coachMessages)
      .where(
        and(
          eq(coachMessages.userId, ctx.userId),
          eq(coachMessages.role, "user"),
          gte(
            coachMessages.createdAt,
            dsql`(${hoje}::date::timestamp AT TIME ZONE ${tz})`,
          ),
        ),
      );
    const usadas = Number(usadasRows[0]?.n ?? 0);
    return {
      ilimitado: false as const,
      usadas,
      restante: Math.max(0, limite - usadas),
    };
  }),

  /**
   * Conversa com o Coach (Sonnet, cota no Free). Ancorado nos FATOS + estado
   * real; nunca inventa números. Cota Free esgotada → resposta L0 honesta com
   * convite ao Rise+, sem chamar o modelo (protege o CAC).
   */
  conversar: planProcedure
    .input(z.object({ texto: z.string().trim().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const premium = isPremium(ctx.plan);
      const limite = ctx.entitlements.coachDailyMessages;

      const c = await coletarContexto(ctx.db, userId);
      if (!c) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Registre sua primeira ação antes de falar com o Coach.",
        });
      }

      // Cota do dia (só Free).
      let esgotou = false;
      if (!premium && Number.isFinite(limite)) {
        const usadasRows = await ctx.db
          .select({ n: dsql<number>`count(*)::int` })
          .from(coachMessages)
          .where(
            and(
              eq(coachMessages.userId, userId),
              eq(coachMessages.role, "user"),
              gte(
                coachMessages.createdAt,
                dsql`(${c.hoje}::date::timestamp AT TIME ZONE ${c.timezone})`,
              ),
            ),
          );
        esgotou = Number(usadasRows[0]?.n ?? 0) >= limite;
      }

      // Histórico recente para dar continuidade (últimas ~10 falas).
      const histRows = await ctx.db
        .select({ role: coachMessages.role, content: coachMessages.content })
        .from(coachMessages)
        .where(eq(coachMessages.userId, userId))
        .orderBy(desc(coachMessages.id))
        .limit(10);
      const historico: CoachMensagem[] = histRows
        .reverse()
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }));

      const usaLLM = Boolean(process.env.ANTHROPIC_API_KEY) && !(!premium && esgotou);
      let texto: string;
      let camada = "heuristica";
      if (usaLLM) {
        try {
          const r = await responderCoach({
            client: createCoachClient(),
            req: { kind: "chat", texto: input.texto },
            ctx: { isPremium: premium, sonnetQuotaExhausted: esgotou },
            fatos: formatarFatos(c.fatos),
            contexto: c.resumo,
            historico,
          });
          texto = r.texto || respostaHeuristicaChat(esgotou && !premium);
          camada = r.camada;
        } catch {
          texto = respostaHeuristicaChat(false);
        }
      } else {
        texto = respostaHeuristicaChat(esgotou && !premium);
      }

      // Persiste os dois turnos (histórico + fonte da cota).
      await ctx.db.insert(coachMessages).values([
        { userId, role: "user", content: input.texto },
        { userId, role: "assistant", content: texto, camada },
      ]);

      const restante =
        premium || !Number.isFinite(limite)
          ? null
          : Math.max(0, limite - (await contarHoje(ctx.db, userId, c)));

      return { texto, camada, restante };
    }),
});

/** Conta mensagens do usuário hoje (pós-inserção) para o `restante` correto. */
async function contarHoje(
  db: Database,
  userId: string,
  c: ContextoCoach,
): Promise<number> {
  const rows = await db
    .select({ n: dsql<number>`count(*)::int` })
    .from(coachMessages)
    .where(
      and(
        eq(coachMessages.userId, userId),
        eq(coachMessages.role, "user"),
        gte(
          coachMessages.createdAt,
          dsql`(${c.hoje}::date::timestamp AT TIME ZONE ${c.timezone})`,
        ),
      ),
    );
  return Number(rows[0]?.n ?? 0);
}

/** Resposta L0 do chat — sem culpa; convida ao Rise+ quando a cota estourou. */
function respostaHeuristicaChat(cotaEsgotada: boolean): string {
  if (cotaEsgotada) {
    return "Você já aproveitou bastante o Coach hoje — volto amanhã com energia total. O Rise+ libera conversas ilimitadas e a Análise Profunda semanal. Enquanto isso: registre uma ação, cada uma conta.";
  }
  return "Registrei. Continue no seu ritmo — uma ação com prova por vez, e eu leio seus números para orientar o próximo passo.";
}
