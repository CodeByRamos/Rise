import { describe, it, expect } from "vitest";
import { arvoreDaArea, TRONCO_PADRAO } from "./tree";

describe("arvoreDaArea", () => {
  it("nível 0: nada desbloqueado, próximo é o nó 1", () => {
    const t = arvoreDaArea(0);
    expect(t.every((n) => !n.desbloqueado)).toBe(true);
    expect(t.find((n) => n.proximo)?.nivel).toBe(1);
  });

  it("nível 5: nós até 5 desbloqueados, próximo é o 7", () => {
    const t = arvoreDaArea(5);
    expect(t.filter((n) => n.desbloqueado).map((n) => n.nivel)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(t.find((n) => n.proximo)?.nivel).toBe(7);
  });

  it("nível 50+: tudo desbloqueado, sem próximo", () => {
    const t = arvoreDaArea(60);
    expect(t.every((n) => n.desbloqueado)).toBe(true);
    expect(t.some((n) => n.proximo)).toBe(false);
  });

  it("tronco é crescente e sem duplicatas", () => {
    const niveis = TRONCO_PADRAO.map((n) => n.nivel);
    expect([...niveis].sort((a, b) => a - b)).toEqual(niveis);
    expect(new Set(niveis).size).toBe(niveis.length);
  });
});
