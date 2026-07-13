import Anthropic from "@anthropic-ai/sdk";
import { Camada, CONFIG_CAMADA } from "./models";
import { routeCoachRequest, type CoachRequest, type UserContext } from "./router";
import { montarSystemPrompt } from "./persona";
import { COACH_TOOLS } from "./tools";

/**
 * Client Claude para o Coach. Lazy: só falha quando usado sem ANTHROPIC_API_KEY —
 * typecheck/build não são afetados.
 */
export function createCoachClient(
  apiKey = process.env.ANTHROPIC_API_KEY,
): Anthropic {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não definido — configure para usar o Coach.",
    );
  }
  return new Anthropic({ apiKey });
}

export interface CoachMensagem {
  role: "user" | "assistant";
  content: string;
}

export interface ResponderCoachParams {
  client: Anthropic;
  req: CoachRequest;
  ctx: UserContext;
  /** Bloco FATOS já formatado (ver facts.formatarFatos). */
  fatos: string;
  /** Trechos semânticos recuperados (opcional). */
  contexto?: string;
  historico?: CoachMensagem[];
}

export interface CoachResposta {
  camada: Camada;
  texto: string;
  ferramentasChamadas: string[];
}

/**
 * Responde uma requisição do Coach: roteia a camada, ancora nos FATOS e chama o
 * modelo (ou responde por heurística, sem LLM). O ciclo de tool use (validar
 * input → chamar packages/core → devolver tool_result) é orquestrado pela camada
 * de API; aqui expomos as ferramentas e retornamos o que o modelo pediu.
 */
export async function responderCoach(
  p: ResponderCoachParams,
): Promise<CoachResposta> {
  const camada = routeCoachRequest(p.req, p.ctx);

  if (camada === Camada.Heuristica) {
    return { camada, texto: respostaHeuristica(p.req), ferramentasChamadas: [] };
  }

  const cfg = CONFIG_CAMADA[camada];
  const conteudoUsuario = [p.fatos, p.contexto, p.req.texto]
    .filter(Boolean)
    .join("\n\n");

  // Sem `temperature`: os modelos atuais (Sonnet 5 / Opus 4.8) rejeitam o
  // parâmetro com 400 — a chamada caía no catch e o Coach respondia sempre a
  // frase pronta. Comportamento é guiado pelo system prompt.
  const msg = await p.client.messages.create({
    model: cfg.model!,
    max_tokens: cfg.maxTokens,
    system: montarSystemPrompt({ premium: p.ctx.isPremium }),
    tools: COACH_TOOLS,
    messages: [
      ...(p.historico ?? []),
      { role: "user", content: conteudoUsuario },
    ],
  });

  const texto = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();

  const ferramentasChamadas = msg.content
    .filter((b) => b.type === "tool_use")
    .map((b) => (b as { name: string }).name);

  return { camada, texto, ferramentasChamadas };
}

/** Resposta L0 (sem LLM) — usada em cota estourada / gatilhos simples. Sem culpa. */
function respostaHeuristica(req: CoachRequest): string {
  switch (req.kind) {
    case "chat":
    case "dailyCoach":
      return "Você já aproveitou bastante o Coach hoje. Amanhã volto com uma leitura nova da sua evolução — e o Rise+ libera conversas ilimitadas e a Análise Profunda semanal.";
    default:
      return "Registrei. Continue: cada ação conta.";
  }
}
