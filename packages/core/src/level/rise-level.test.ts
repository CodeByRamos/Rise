import { describe, it, expect } from "vitest";
import {
  fatorAmplitude,
  contarAreasAtivas,
  calcularNivelRise,
  AMPLITUDE_AREAS_CAP,
} from "./rise-level";
import { xpTotalParaNivel, nivelPorXp, NIVEL_TETO } from "../xp/curve";

describe("fatorAmplitude — recompensa amplitude, satura em 8 áreas (§3.2)", () => {
  it.each([
    [1, 1.0],
    [2, 1.04],
    [4, 1.12],
    [8, 1.28],
    [9, 1.28], // capado
    [50, 1.28], // capado
  ])("%i áreas ativas → fator %f", (ativas, esperado) => {
    expect(fatorAmplitude(ativas)).toBeCloseTo(esperado, 10);
  });

  it("nunca abaixo de 1.0 mesmo com 0 áreas", () => {
    expect(fatorAmplitude(0)).toBe(1.0);
    expect(fatorAmplitude(-5)).toBe(1.0);
  });
});

describe("contarAreasAtivas — nível ≥ 2 E ação nos últimos 30 dias", () => {
  it("conta só áreas ativas e com nível suficiente", () => {
    const areas = [
      { xp: xpTotalParaNivel(5), ativaNoPeriodo: true }, // nível 5, ativa → conta
      { xp: xpTotalParaNivel(2), ativaNoPeriodo: true }, // nível 2, ativa → conta
      { xp: xpTotalParaNivel(10), ativaNoPeriodo: false }, // inativa → não conta
      { xp: 50, ativaNoPeriodo: true }, // nível 0, ativa → não conta
      { xp: xpTotalParaNivel(3) }, // sem flag (default false) → não conta
    ];
    expect(contarAreasAtivas(areas)).toBe(2);
  });
});

describe("calcularNivelRise", () => {
  it("especialista: XP concentrado em 1 área, fator 1.0", () => {
    const areas = [{ xp: 21_000, ativaNoPeriodo: true }]; // nível 20 sozinho
    const r = calcularNivelRise(areas);
    expect(r.xpRise).toBe(21_000);
    expect(r.areasAtivas).toBe(1);
    expect(r.fatorAmplitude).toBe(1.0);
    expect(r.nivelRise).toBe(nivelPorXp(21_000)); // 20
  });

  it("generalista: amplitude amplifica o XP agregado (persona Diego)", () => {
    // 5 áreas ativas de nível 3 cada (600 XP): soma 3.000, fator 1.16
    const areas = Array.from({ length: 5 }, () => ({
      xp: xpTotalParaNivel(3),
      ativaNoPeriodo: true,
    }));
    const r = calcularNivelRise(areas);
    expect(r.areasAtivas).toBe(5);
    expect(r.fatorAmplitude).toBeCloseTo(1.16, 10);
    expect(r.xpRise).toBe(3_000);
    expect(r.nivelRise).toBe(nivelPorXp(3_000 * 1.16));
    // amplitude dá um nível a mais que o XP bruto neste caso
    expect(r.nivelRise).toBeGreaterThanOrEqual(nivelPorXp(3_000));
  });

  it("respeita o teto de Nível Rise 100 (elegível a Prestígio)", () => {
    const areas = [{ xp: xpTotalParaNivel(100) * 2, ativaNoPeriodo: true }];
    const r = calcularNivelRise(areas);
    expect(r.nivelRise).toBe(NIVEL_TETO);
    expect(r.noTeto).toBe(true);
  });

  it("lista vazia → nível 0", () => {
    const r = calcularNivelRise([]);
    expect(r.nivelRise).toBe(0);
    expect(r.areasAtivas).toBe(0);
  });
});
