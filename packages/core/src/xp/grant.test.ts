import { describe, it, expect } from "vitest";
import { calcularXpConcedido } from "./grant";
import { multStreak } from "../streak/streak";

describe("calcularXpConcedido — exemplo canônico (doc 13 §2.4)", () => {
  it("Bruno: deep work 50min, streak 12d, missão diária", () => {
    // base 25 × dificuldade 1.0 × mult_streak(12)=1.24 ... o spec usa 1.3 como
    // aproximação textual; validamos a fórmula exata do motor de streak.
    const mult = multStreak(12); // 1 + 0.02*12 = 1.24
    const r = calcularXpConcedido({
      baseAcao: 25,
      multDificuldade: 1.0,
      multStreak: mult,
      multMissao: 1.5,
    });
    // round(25 × 1.24 × 1.5) = round(46.5) = 47 (ou 46, dependendo do arredondamento)
    expect(r.xpBruto).toBe(Math.round(25 * mult * 1.5));
    expect(r.xpConcedido).toBe(r.xpBruto);
    expect(r.tetoAplicado).toBe(false);
  });

  it("reproduz o número do spec quando mult_streak = 1.3", () => {
    const r = calcularXpConcedido({
      baseAcao: 25,
      multStreak: 1.3,
      multMissao: 1.5,
    });
    expect(r.xpBruto).toBe(49); // round(25 × 1.3 × 1.5) = round(48.75)
  });
});

describe("teto diário da área (anti-grinding, §10.1)", () => {
  it("corta o excedente quando ultrapassa o teto restante", () => {
    const r = calcularXpConcedido({
      baseAcao: 100,
      tetoDiarioRestante: 30,
    });
    expect(r.xpBruto).toBe(100);
    expect(r.xpConcedido).toBe(30);
    expect(r.tetoAplicado).toBe(true);
  });

  it("não corta quando há folga no teto", () => {
    const r = calcularXpConcedido({ baseAcao: 20, tetoDiarioRestante: 150 });
    expect(r.xpConcedido).toBe(20);
    expect(r.tetoAplicado).toBe(false);
  });

  it("teto esgotado concede 0", () => {
    const r = calcularXpConcedido({ baseAcao: 20, tetoDiarioRestante: 0 });
    expect(r.xpConcedido).toBe(0);
    expect(r.tetoAplicado).toBe(true);
  });
});

describe("faixas dos multiplicadores são capadas (anti-inflação)", () => {
  it("clampa dificuldade acima de 2.0", () => {
    const r = calcularXpConcedido({ baseAcao: 10, multDificuldade: 5 });
    expect(r.xpBruto).toBe(20); // 10 × 2.0
  });

  it("clampa missão acima de 2.0 e ignora dificuldade < 1.0", () => {
    const r = calcularXpConcedido({
      baseAcao: 10,
      multDificuldade: 0.1,
      multMissao: 9,
    });
    expect(r.xpBruto).toBe(20); // 10 × 1.0 × 2.0
  });

  it("rejeita base inválida", () => {
    expect(() => calcularXpConcedido({ baseAcao: -1 })).toThrow(RangeError);
  });
});
