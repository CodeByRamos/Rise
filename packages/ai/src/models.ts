/**
 * Modelos Claude e as quatro camadas de custo do Coach (docs/14 §3).
 *
 * Regra: a camada mais barata que resolve. Heurística (L0, sem LLM) absorve o
 * volume; Haiku classifica/redige curto; Sonnet é o coach do dia a dia; Opus é a
 * Análise Profunda semanal, gated no Premium.
 */
export const MODELOS = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
} as const;

export enum Camada {
  Heuristica = "heuristica",
  Haiku = "haiku",
  Sonnet = "sonnet",
  Opus = "opus",
}

export interface ConfigCamada {
  /** null = sem LLM (heurística). */
  model: string | null;
  maxTokens: number;
  temperature: number;
}

export const CONFIG_CAMADA: Record<Camada, ConfigCamada> = {
  [Camada.Heuristica]: { model: null, maxTokens: 0, temperature: 0 },
  [Camada.Haiku]: { model: MODELOS.haiku, maxTokens: 256, temperature: 0.3 },
  [Camada.Sonnet]: { model: MODELOS.sonnet, maxTokens: 1024, temperature: 0.5 },
  [Camada.Opus]: { model: MODELOS.opus, maxTokens: 4096, temperature: 0.4 },
};
