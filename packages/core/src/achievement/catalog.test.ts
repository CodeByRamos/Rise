import { describe, it, expect } from "vitest";
import {
  avaliarConquistas,
  ACHIEVEMENT_CATALOG,
  type DadosAvaliacao,
} from "./catalog";

const base: DadosAvaliacao = {
  streakAtual: 0,
  niveisAreas: [0, 0, 0],
  totalAcoes: 0,
  xpTotal: 0,
  diaPerfeito: false,
};

describe("avaliarConquistas", () => {
  it("primeira ação desbloqueia só 'primeira-prova'", () => {
    const novas = avaliarConquistas(
      { ...base, totalAcoes: 1 },
      new Set(),
    );
    expect(novas.map((a) => a.id)).toEqual(["primeira-prova"]);
  });

  it("não repete conquista já desbloqueada", () => {
    const novas = avaliarConquistas(
      { ...base, totalAcoes: 5 },
      new Set(["primeira-prova"]),
    );
    expect(novas).toHaveLength(0);
  });

  it("streak 30 desbloqueia sete-dias e constância de uma vez", () => {
    const novas = avaliarConquistas(
      { ...base, totalAcoes: 30, streakAtual: 30 },
      new Set(["primeira-prova"]),
    );
    expect(novas.map((a) => a.id).sort()).toEqual(["constancia", "sete-dias"]);
  });

  it("amplitude: 5 áreas nível 5+ → Renascença (e Equilíbrio junto)", () => {
    const novas = avaliarConquistas(
      { ...base, totalAcoes: 50, niveisAreas: [5, 6, 5, 7, 5, 1] },
      new Set(["primeira-prova"]),
    );
    const ids = novas.map((a) => a.id);
    expect(ids).toContain("renascenca");
    expect(ids).toContain("equilibrio");
  });

  it("profundidade: nível 20 numa área → decada + profundidade", () => {
    const novas = avaliarConquistas(
      { ...base, totalAcoes: 10, niveisAreas: [20, 1] },
      new Set(["primeira-prova"]),
    );
    const ids = novas.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["decada", "profundidade"]));
    expect(ids).not.toContain("maestria");
  });

  it("dia perfeito e 10k XP", () => {
    const novas = avaliarConquistas(
      { ...base, totalAcoes: 40, diaPerfeito: true, xpTotal: 10_000 },
      new Set(["primeira-prova"]),
    );
    const ids = novas.map((a) => a.id);
    expect(ids).toContain("dia-perfeito");
    expect(ids).toContain("dez-mil");
  });

  it("catálogo: ids únicos e todos com critério implementado", () => {
    const ids = ACHIEVEMENT_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    // dados extremos devem conseguir desbloquear TUDO (nenhum critério órfão)
    const tudo = avaliarConquistas(
      {
        streakAtual: 400,
        niveisAreas: [30, 10, 5, 5, 5],
        totalAcoes: 1500,
        xpTotal: 60_000,
        diaPerfeito: true,
      },
      new Set(),
    );
    expect(tudo.length).toBe(ACHIEVEMENT_CATALOG.length);
  });
});
