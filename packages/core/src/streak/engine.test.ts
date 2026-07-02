import { describe, it, expect } from "vitest";
import {
  dataLocalISO,
  diffDias,
  aplicarAcaoNoStreak,
  aplicarAcaoComAmortecedores,
} from "./engine";

describe("dataLocalISO — dia civil no fuso do usuário", () => {
  it("converte para o fuso de São Paulo (UTC-3)", () => {
    // 01:30 UTC de 2026-07-03 ainda é 22:30 de 2026-07-02 em SP.
    const instante = new Date(Date.UTC(2026, 6, 3, 1, 30));
    expect(dataLocalISO(instante, "America/Sao_Paulo")).toBe("2026-07-02");
    expect(dataLocalISO(instante, "UTC")).toBe("2026-07-03");
  });
});

describe("diffDias", () => {
  it.each([
    ["2026-07-01", "2026-07-02", 1],
    ["2026-07-01", "2026-07-01", 0],
    ["2026-06-30", "2026-07-02", 2],
    ["2026-12-31", "2027-01-01", 1], // vira o ano
    ["2026-07-02", "2026-07-01", -1],
  ])("%s → %s = %i dias", (a, b, esperado) => {
    expect(diffDias(a, b)).toBe(esperado);
  });
});

describe("aplicarAcaoNoStreak", () => {
  it("primeira ação de sempre inicia streak 1", () => {
    const r = aplicarAcaoNoStreak(null, "2026-07-02");
    expect(r.currentCount).toBe(1);
    expect(r.extended).toBe(true);
    expect(r.broke).toBe(false);
    expect(r.lastActiveDate).toBe("2026-07-02");
  });

  it("segunda ação no MESMO dia não muda nada (idempotente por dia)", () => {
    const r = aplicarAcaoNoStreak(
      { currentCount: 5, longestCount: 9, lastActiveDate: "2026-07-02" },
      "2026-07-02",
    );
    expect(r.currentCount).toBe(5);
    expect(r.extended).toBe(false);
    expect(r.broke).toBe(false);
  });

  it("ação no dia seguinte estende (+1) e atualiza recorde", () => {
    const r = aplicarAcaoNoStreak(
      { currentCount: 9, longestCount: 9, lastActiveDate: "2026-07-01" },
      "2026-07-02",
    );
    expect(r.currentCount).toBe(10);
    expect(r.longestCount).toBe(10);
    expect(r.extended).toBe(true);
    expect(r.broke).toBe(false);
  });

  it("gap > 1 dia quebra, preserva o recorde e recomeça em 1", () => {
    const r = aplicarAcaoNoStreak(
      { currentCount: 30, longestCount: 30, lastActiveDate: "2026-06-25" },
      "2026-07-02",
    );
    expect(r.currentCount).toBe(1);
    expect(r.longestCount).toBe(30); // recorde nunca some (§5.4)
    expect(r.broke).toBe(true);
    expect(r.previousDays).toBe(30);
    expect(r.extended).toBe(true);
  });

  it("streak zerado (count 0) volta a 1 mesmo com lastActiveDate antiga", () => {
    const r = aplicarAcaoNoStreak(
      { currentCount: 0, longestCount: 12, lastActiveDate: "2026-06-01" },
      "2026-07-02",
    );
    expect(r.currentCount).toBe(1);
    expect(r.longestCount).toBe(12);
  });
});

describe("aplicarAcaoComAmortecedores (doc 13 §5.3)", () => {
  const base = { currentCount: 20, longestCount: 20, lastActiveDate: "2026-06-30" }; // gap 2 p/ 07-02

  it("perdão automático absorve 1 dia perdido quando streak ≥ 14", () => {
    const r = aplicarAcaoComAmortecedores(base, "2026-07-02", {
      freezesAvailable: 0,
      perdaoDisponivel: true,
    });
    expect(r.currentCount).toBe(21);
    expect(r.perdaoUsado).toBe(true);
    expect(r.freezeUsado).toBe(false);
    expect(r.broke).toBe(false);
  });

  it("freeze cobre quando perdão indisponível", () => {
    const r = aplicarAcaoComAmortecedores(base, "2026-07-02", {
      freezesAvailable: 1,
      perdaoDisponivel: false,
    });
    expect(r.currentCount).toBe(21);
    expect(r.freezeUsado).toBe(true);
    expect(r.perdaoUsado).toBe(false);
  });

  it("perdão tem prioridade sobre freeze (grátis primeiro)", () => {
    const r = aplicarAcaoComAmortecedores(base, "2026-07-02", {
      freezesAvailable: 2,
      perdaoDisponivel: true,
    });
    expect(r.perdaoUsado).toBe(true);
    expect(r.freezeUsado).toBe(false);
  });

  it("streak < 14 não ganha perdão; sem freeze → quebra", () => {
    const curto = { currentCount: 5, longestCount: 9, lastActiveDate: "2026-06-30" };
    const r = aplicarAcaoComAmortecedores(curto, "2026-07-02", {
      freezesAvailable: 0,
      perdaoDisponivel: true,
    });
    expect(r.broke).toBe(true);
    expect(r.currentCount).toBe(1);
    expect(r.longestCount).toBe(9);
  });

  it("gap > 2 quebra mesmo com freeze e perdão (freeze protege 1 dia)", () => {
    const r = aplicarAcaoComAmortecedores(
      { currentCount: 30, longestCount: 30, lastActiveDate: "2026-06-25" },
      "2026-07-02",
      { freezesAvailable: 2, perdaoDisponivel: true },
    );
    expect(r.broke).toBe(true);
    expect(r.currentCount).toBe(1);
    expect(r.longestCount).toBe(30);
  });

  it("gap 1 (dia seguinte) segue normal, sem consumir nada", () => {
    const ontem = { currentCount: 20, longestCount: 20, lastActiveDate: "2026-07-01" };
    const r = aplicarAcaoComAmortecedores(ontem, "2026-07-02", {
      freezesAvailable: 2,
      perdaoDisponivel: true,
    });
    expect(r.currentCount).toBe(21);
    expect(r.freezeUsado).toBe(false);
    expect(r.perdaoUsado).toBe(false);
  });
});
