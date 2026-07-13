import type Anthropic from "@anthropic-ai/sdk";
import { Camada, CONFIG_CAMADA, MODELOS } from "./models";
import { montarSystemPrompt } from "./persona";

/**
 * Análise Profunda semanal — a camada Opus do Coach (docs/14 §3, docs/12 §3),
 * gated no Premium. Recebe o bloco FATOS já formatado (números exatos, SQL
 * determinístico) e devolve um texto em Markdown com 1–3 alavancas acionáveis,
 * NUNCA um relatório genérico. Sem tool use aqui: é geração única, batch-friendly.
 */
export interface AnaliseProfundaParams {
  client: Anthropic;
  /** Bloco FATOS formatado (facts.formatarFatos). */
  fatos: string;
  /** Trechos semânticos recuperados via RAG (opcional). */
  contexto?: string;
  /** Nome de exibição p/ personalizar o tratamento (opcional). */
  displayName?: string | null;
}

export interface AnaliseProfundaResultado {
  model: string;
  camada: Camada;
  /** Markdown pronto para render. */
  content: string;
}

const INSTRUCAO = `Gere a ANÁLISE PROFUNDA SEMANAL desta pessoa. Estruture em Markdown, PT-BR, tom de mentor (nunca relatório frio):

## Panorama da semana
2–3 frases ancoradas em FATOS (nível Rise, ações, streaks). Reconheça o esforço real.

## O que os dados mostram
1–2 correlações ou padrões CONCRETOS entre Áreas (ex.: consistência em uma área × queda em outra). Só o que os FATOS sustentam — se não houver dado, diga isso, não invente.

## 3 alavancas para a próxima semana
Exatamente até 3 itens acionáveis e específicos, cada um ancorado num fato. Verbos de ação. Sem motivacional-barato.

Regras: use SOMENTE números do bloco FATOS. Não calcule XP/nível. Máximo ~350 palavras. Sem preâmbulo ("aqui está...").`;

export async function analisarProfundo(
  p: AnaliseProfundaParams,
): Promise<AnaliseProfundaResultado> {
  const cfg = CONFIG_CAMADA[Camada.Opus];
  const conteudoUsuario = [
    p.displayName ? `Pessoa: ${p.displayName}.` : null,
    p.fatos,
    p.contexto,
    INSTRUCAO,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Sem `temperature` (Opus 4.8 rejeita com 400 — era o motivo de a Análise
  // Profunda falhar sempre e cair no erro genérico).
  const msg = await p.client.messages.create({
    model: cfg.model ?? MODELOS.opus,
    max_tokens: cfg.maxTokens,
    system: montarSystemPrompt({ premium: true }),
    messages: [{ role: "user", content: conteudoUsuario }],
  });

  const content = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();

  return { model: cfg.model ?? MODELOS.opus, camada: Camada.Opus, content };
}
