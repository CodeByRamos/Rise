import { and, eq, gte, isNull, sql as dsql } from "drizzle-orm";
import {
  users,
  lifeAreas,
  actionLogs,
  streaks,
  userMissions,
} from "@rise/db";
import { dataLocalISO, nivelDeArea } from "@rise/core";
import {
  createCoachClient,
  responderCoach,
  formatarFatos,
  type BlocoFatos,
} from "@rise/ai";
import { router, protectedProcedure } from "../trpc";

interface DadosCheckin {
  displayName: string | null;
  acoesHoje: number;
  acoes7d: number;
  streakGeral: number;
  nivelRise: number;
  areas: { nome: string; nivel: number; xp: number }[];
  missoesPendentes: { titulo: string; progress: number; target: number }[];
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
    const userId = ctx.userId;

    const u = await ctx.db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!u[0]) return { texto: "Registre sua primeira ação para começarmos.", camada: "heuristica" as const };
    const timezone = u[0].timezone;
    const hoje = dataLocalISO(new Date(), timezone);

    const areasRows = await ctx.db
      .select({ nome: lifeAreas.name, xp: lifeAreas.totalXp })
      .from(lifeAreas)
      .where(and(eq(lifeAreas.userId, userId), eq(lifeAreas.isArchived, false)));

    const streakRows = await ctx.db
      .select({ current: streaks.currentCount, last: streaks.lastActiveDate })
      .from(streaks)
      .where(and(eq(streaks.userId, userId), isNull(streaks.lifeAreaId)))
      .limit(1);

    // Contagens no fuso do usuário (meia-noite local → timestamptz).
    const meiaNoiteLocal = dsql`(${hoje}::date::timestamp AT TIME ZONE ${timezone})`;
    const hojeCount = await ctx.db
      .select({ n: dsql<number>`count(*)::int` })
      .from(actionLogs)
      .where(
        and(eq(actionLogs.userId, userId), gte(actionLogs.createdAt, meiaNoiteLocal)),
      );
    const seteDias = dsql`now() - interval '7 days'`;
    const semanaCount = await ctx.db
      .select({ n: dsql<number>`count(*)::int` })
      .from(actionLogs)
      .where(and(eq(actionLogs.userId, userId), gte(actionLogs.createdAt, seteDias)));

    const pendentes = await ctx.db
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
      );

    const areas = areasRows.map((a) => ({
      nome: a.nome,
      nivel: nivelDeArea(a.xp),
      xp: a.xp,
    }));
    // Streak só está VIVA se a última ação foi hoje ou ontem (fuso do
    // usuário); mais antiga já quebrou — reportar 0 ao Coach, não o valor velho.
    const ontem = dataLocalISO(new Date(Date.now() - 86_400_000), timezone);
    const ultimoDia = streakRows[0]?.last ?? null;
    const streakGeral =
      ultimoDia === hoje || ultimoDia === ontem
        ? (streakRows[0]?.current ?? 0)
        : 0;
    const dados: DadosCheckin = {
      displayName: null,
      acoesHoje: hojeCount[0]?.n ?? 0,
      acoes7d: semanaCount[0]?.n ?? 0,
      streakGeral,
      nivelRise: 0,
      areas,
      missoesPendentes: pendentes,
    };

    // Camada Sonnet — só se a chave existir; qualquer falha cai no L0.
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const fatos: BlocoFatos = {
          periodo: "hoje",
          nivelRise: dados.nivelRise,
          acoesTotalSemana: dados.acoes7d,
          areas: areas.map((a) => ({ area: a.nome, nivel: a.nivel })),
          alertaStreak: [],
        };
        const r = await responderCoach({
          client: createCoachClient(),
          req: {
            kind: "dailyCoach",
            texto: `Check-in diário. Ações hoje: ${dados.acoesHoje}. Sequência: ${dados.streakGeral} dias. Missões pendentes: ${pendentes.map((p) => `${p.titulo} (${p.progress}/${p.target})`).join("; ") || "nenhuma"}. Responda em no máximo 3 frases curtas, PT-BR, tom de mentor.`,
          },
          ctx: { isPremium: false, sonnetQuotaExhausted: false },
          fatos: formatarFatos(fatos),
        });
        if (r.texto) return { texto: r.texto, camada: r.camada };
      } catch {
        // cai no L0
      }
    }

    return { texto: checkinHeuristico(dados), camada: "heuristica" as const };
  }),
});
