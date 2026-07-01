import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Catálogo de ferramentas do Coach (docs/14 §5). Read-only para ancorar em dados;
 * "proposta" para agir. Guardrail: nenhuma ferramenta define XP — os parâmetros
 * vão para o packages/core, que calcula a recompensa pela curva canônica.
 */

// ---- Read-only (ancoragem / anti-alucinação) ----
export const getStatsResumoSchema = z.object({
  periodo: z
    .enum(["ultimos_7_dias", "ultimos_30_dias", "temporada"])
    .default("ultimos_7_dias")
    .describe("Janela dos fatos exatos a retornar"),
});

export const buscarContextoSemanticoSchema = z.object({
  consulta: z.string().describe("O que buscar nas notas/momentos do usuário"),
  k: z.number().int().min(1).max(10).default(5).describe("Nº de trechos"),
});

// ---- Propostas (IA propõe, core aplica) ----
export const criarMissaoSchema = z.object({
  lifeAreaId: z.string().uuid().describe("Área da Vida alvo da missão"),
  titulo: z.string().max(80).describe("Título curto e acionável, em PT-BR"),
  tipo: z.enum(["diaria", "semanal", "personalizada"]),
  meta: z.object({
    metrica: z.enum(["acoes", "minutos", "dias_consecutivos"]),
    alvo: z.number().int().positive().max(50),
  }),
  prazoDias: z.number().int().min(1).max(30),
  justificativa: z
    .string()
    .describe("Por que esta missão, citando o fato real do usuário"),
});

export const ajustarMetaSchema = z.object({
  goalId: z.string().uuid(),
  direcao: z.enum(["subir", "baixar"]).describe("Aumentar ou reduzir a dificuldade"),
  novoAlvo: z.number().positive(),
  justificativa: z.string(),
});

export const gerarInsightSchema = z.object({
  titulo: z.string().max(80),
  corpo: z.string().max(400),
  fatoAncora: z.string().describe("O número/fato exato que sustenta o insight"),
  lifeAreaId: z.string().uuid().optional(),
});

export const sugerirModoDescansoSchema = z.object({
  ateDias: z.number().int().min(1).max(14).describe("Duração sugerida da pausa"),
  motivo: z.string().describe("Sinal de sobrecarga observado nos dados"),
});

export const recomendarObjetivoSchema = z.object({
  objetivo: z.string().max(120),
  lifeAreaId: z.string().uuid().optional(),
  justificativa: z.string(),
});

export const reorganizarRotinaSchema = z.object({
  mudancas: z
    .array(
      z.object({
        habitId: z.string().uuid(),
        acao: z.enum(["mover", "pausar", "criar"]),
        novoHorario: z.string().optional().describe("HH:mm, se aplicável"),
      }),
    )
    .max(10),
  justificativa: z.string(),
});

type SchemaZod = z.ZodType<unknown>;

function tool(
  name: string,
  description: string,
  schema: SchemaZod,
): Anthropic.Tool {
  return {
    name,
    description,
    input_schema: zodToJsonSchema(schema, {
      $refStrategy: "none",
      target: "jsonSchema7",
    }) as Anthropic.Tool.InputSchema,
  };
}

export const COACH_TOOLS: Anthropic.Tool[] = [
  tool(
    "getStatsResumo",
    "Retorna os FATOS exatos do usuário (XP por área, níveis, streaks, médias, tendências, alertas). Chame ANTES de qualquer proposta para se ancorar.",
    getStatsResumoSchema,
  ),
  tool(
    "buscarContextoSemantico",
    "Busca vetorial (pgvector) por momentos/notas relevantes do usuário. Use para contexto qualitativo, nunca para números.",
    buscarContextoSemanticoSchema,
  ),
  tool(
    "criarMissao",
    "Propõe uma Missão personalizada. NÃO define XP — a recompensa é calculada pelo motor de gamificação. Use quando os dados justificarem.",
    criarMissaoSchema,
  ),
  tool(
    "ajustarMeta",
    "Propõe subir/baixar a dificuldade de uma Meta existente, ancorado no progresso real. O usuário confirma.",
    ajustarMetaSchema,
  ),
  tool(
    "gerarInsight",
    "Cria um Insight ancorado num fato exato para o painel/feed pessoal do usuário.",
    gerarInsightSchema,
  ),
  tool(
    "sugerirModoDescanso",
    "Recomenda ativar o Modo Descanso ao detectar sobrecarga. Guardião do bem-estar — sem culpa.",
    sugerirModoDescansoSchema,
  ),
  tool(
    "recomendarObjetivo",
    "Sugere o próximo objetivo ou Área a focar, a partir de tendências e áreas subdesenvolvidas.",
    recomendarObjetivoSchema,
  ),
  tool(
    "reorganizarRotina",
    "Propõe uma nova distribuição de hábitos/horários. Proposta — o usuário confirma e o core aplica.",
    reorganizarRotinaSchema,
  ),
];
