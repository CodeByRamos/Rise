import { describe, it, expect } from "vitest";
import { computarConcessao } from "./xp-grant";
import { xpTotalParaNivel, multStreak } from "@rise/core";

describe("computarConcessao — registrar ação → XP", () => {
  it("concede XP e detecta subida de nível na fronteira", () => {
    // Área em 299 XP (nível 1); +1 XP cruza para 300 (nível 2).
    const r = computarConcessao({
      baseAcao: 1,
      streakDias: 0,
      totalXpAtual: 299,
    });
    expect(r.amount).toBe(1);
    expect(r.nivelAnterior).toBe(1);
    expect(r.nivelNovo).toBe(2);
    expect(r.subiuNivel).toBe(true);
    expect(r.totalXpNovo).toBe(300);
  });

  it("não sobe de nível quando fica dentro do nível atual", () => {
    const r = computarConcessao({
      baseAcao: 20,
      streakDias: 0,
      totalXpAtual: xpTotalParaNivel(3), // 600, nível 3
    });
    expect(r.subiuNivel).toBe(false);
    expect(r.nivelNovo).toBe(3);
  });

  it("aplica o multiplicador de streak (12 dias = 1,24×)", () => {
    const r = computarConcessao({
      baseAcao: 25,
      streakDias: 12,
      totalXpAtual: 0,
    });
    expect(r.streakMult).toBeCloseTo(multStreak(12), 10);
    expect(r.amount).toBe(Math.round(25 * multStreak(12)));
  });

  it("respeita o teto diário da área (anti-grind)", () => {
    const r = computarConcessao({
      baseAcao: 100,
      streakDias: 0,
      totalXpAtual: 0,
      tetoDiarioRestante: 30,
    });
    expect(r.amount).toBe(30);
    expect(r.tetoAplicado).toBe(true);
    expect(r.totalXpNovo).toBe(30);
  });

  it("combina intensidade + missão + streak", () => {
    // Exemplo do doc 13: base 25 × dif 1.0 × streak(12) × missão 1.5
    const r = computarConcessao({
      baseAcao: 25,
      multDificuldade: 1.0,
      streakDias: 12,
      multMissao: 1.5,
      totalXpAtual: 0,
    });
    expect(r.amount).toBe(Math.round(25 * multStreak(12) * 1.5));
  });
});
