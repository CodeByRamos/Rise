import { describe, it, expect } from "vitest";
import {
  xpTotalParaNivel,
  custoProximoNivel,
  nivelPorXp,
  nivelDeArea,
  progressoNoNivel,
  NIVEL_TETO,
} from "./curve";

describe("xpTotalParaNivel — tabela canônica (doc 13 §3.1)", () => {
  // [nivel, XP acumulado esperado] — valores extraídos direto da tabela do spec.
  it.each([
    [0, 0],
    [1, 100],
    [2, 300],
    [3, 600],
    [5, 1_500],
    [10, 5_500],
    [20, 21_000],
    [50, 127_500],
    [100, 505_000],
  ])("nível %i acumula %i XP", (nivel, esperado) => {
    expect(xpTotalParaNivel(nivel)).toBe(esperado);
  });

  it("rejeita nível inválido", () => {
    expect(() => xpTotalParaNivel(-1)).toThrow(RangeError);
    expect(() => xpTotalParaNivel(1.5)).toThrow(RangeError);
  });
});

describe("custoProximoNivel — custo do próximo nível = 100·(n+1)", () => {
  it.each([
    [0, 100],
    [1, 200],
    [2, 300],
    [4, 500],
    [9, 1_000],
    [49, 5_000],
    [99, 10_000],
  ])("de %i para o próximo custa %i XP", (nivel, esperado) => {
    expect(custoProximoNivel(nivel)).toBe(esperado);
  });

  it("é consistente com a diferença da curva acumulada", () => {
    for (let n = 0; n < 200; n++) {
      expect(custoProximoNivel(n)).toBe(
        xpTotalParaNivel(n + 1) - xpTotalParaNivel(n),
      );
    }
  });
});

describe("nivelPorXp — inverso da curva", () => {
  it.each([
    [0, 0],
    [99, 0],
    [100, 1],
    [299, 1],
    [300, 2],
    [5_499, 9],
    [5_500, 10],
    [505_000, 100],
  ])("xp %i → nível %i", (xp, esperado) => {
    expect(nivelPorXp(xp)).toBe(esperado);
  });

  it("invariante de ida-e-volta: nivelPorXp(xpTotalParaNivel(n)) === n", () => {
    for (let n = 0; n <= 500; n++) {
      const xp = xpTotalParaNivel(n);
      expect(nivelPorXp(xp)).toBe(n);
      // Um XP abaixo da fronteira deve ficar no nível anterior.
      if (n > 0) expect(nivelPorXp(xp - 1)).toBe(n - 1);
    }
  });

  it("rejeita xp inválido", () => {
    expect(() => nivelPorXp(-5)).toThrow(RangeError);
    expect(() => nivelPorXp(Number.NaN)).toThrow(RangeError);
  });
});

describe("nivelDeArea — aplica o teto de produto", () => {
  it("respeita o teto de 100", () => {
    expect(nivelDeArea(xpTotalParaNivel(100))).toBe(NIVEL_TETO);
    expect(nivelDeArea(xpTotalParaNivel(150))).toBe(NIVEL_TETO);
  });
  it("abaixo do teto é igual ao nível puro", () => {
    expect(nivelDeArea(5_500)).toBe(10);
  });
});

describe("progressoNoNivel — decomposição para a UI", () => {
  it("no início de um nível", () => {
    const p = progressoNoNivel(100); // exatamente nível 1
    expect(p.nivel).toBe(1);
    expect(p.xpNoNivel).toBe(0);
    expect(p.xpDoNivel).toBe(200); // custo de 1→2
    expect(p.xpFaltando).toBe(200);
    expect(p.fracao).toBe(0);
  });

  it("no meio de um nível", () => {
    const p = progressoNoNivel(200); // nível 1, 100/200 do caminho
    expect(p.nivel).toBe(1);
    expect(p.xpNoNivel).toBe(100);
    expect(p.xpFaltando).toBe(100);
    expect(p.fracao).toBeCloseTo(0.5, 10);
  });
});
