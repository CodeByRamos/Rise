import { describe, it, expect } from "vitest";
import {
  multStreak,
  streakSaturado,
  STREAK_MULT_MAX,
  STREAK_DIAS_TETO,
} from "./streak";

describe("multStreak — tabela canônica (doc 13 §5.2)", () => {
  it.each([
    [0, 1.0],
    [1, 1.02],
    [7, 1.14],
    [14, 1.28],
    [25, 1.5],
    [200, 1.5],
  ])("streak de %i dias → multiplicador %f", (dias, esperado) => {
    expect(multStreak(dias)).toBeCloseTo(esperado, 10);
  });

  it("nunca ultrapassa o teto", () => {
    for (let d = 0; d <= 1000; d += 7) {
      expect(multStreak(d)).toBeLessThanOrEqual(STREAK_MULT_MAX);
    }
  });

  it("é monotônico não-decrescente", () => {
    let anterior = 0;
    for (let d = 0; d <= 60; d++) {
      const atual = multStreak(d);
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });

  it("rejeita entrada inválida", () => {
    expect(() => multStreak(-1)).toThrow(RangeError);
  });
});

describe("streakSaturado", () => {
  it("satura exatamente no dia do teto", () => {
    expect(streakSaturado(STREAK_DIAS_TETO - 1)).toBe(false);
    expect(streakSaturado(STREAK_DIAS_TETO)).toBe(true);
    expect(streakSaturado(STREAK_DIAS_TETO + 100)).toBe(true);
  });
});
