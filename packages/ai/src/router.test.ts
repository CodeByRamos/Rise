import { describe, it, expect } from "vitest";
import { routeCoachRequest } from "./router";
import { Camada } from "./models";

const free = { isPremium: false, sonnetQuotaExhausted: false };
const freeSemCota = { isPremium: false, sonnetQuotaExhausted: true };
const premium = { isPremium: true, sonnetQuotaExhausted: false };

describe("routeCoachRequest — roteamento de custo (doc 14 §3.3)", () => {
  it("L0 resolve sem LLM quando a heurística dá conta", () => {
    expect(
      routeCoachRequest({ kind: "chat", heuristicaResolve: true }, free),
    ).toBe(Camada.Heuristica);
  });

  it("classificação e rascunho curto vão para Haiku", () => {
    expect(routeCoachRequest({ kind: "classify" }, free)).toBe(Camada.Haiku);
    expect(routeCoachRequest({ kind: "shortDraft" }, free)).toBe(Camada.Haiku);
  });

  it("Análise Profunda semanal: Opus no Premium, Sonnet no Free", () => {
    expect(routeCoachRequest({ kind: "weeklyDeepAnalysis" }, premium)).toBe(
      Camada.Opus,
    );
    expect(routeCoachRequest({ kind: "weeklyDeepAnalysis" }, free)).toBe(
      Camada.Sonnet,
    );
  });

  it("coach diário/conversa usa Sonnet, mas cai para heurística se Free sem cota", () => {
    expect(routeCoachRequest({ kind: "dailyCoach" }, free)).toBe(Camada.Sonnet);
    expect(routeCoachRequest({ kind: "chat" }, premium)).toBe(Camada.Sonnet);
    expect(routeCoachRequest({ kind: "chat" }, freeSemCota)).toBe(
      Camada.Heuristica,
    );
  });

  it("Premium nunca é barrado por cota", () => {
    expect(
      routeCoachRequest(
        { kind: "chat" },
        { isPremium: true, sonnetQuotaExhausted: true },
      ),
    ).toBe(Camada.Sonnet);
  });
});
