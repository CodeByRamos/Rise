import { describe, it, expect } from "vitest";
import {
  MARCOS_TEMPORADA,
  chaveTemporada,
  nomeTemporada,
  inicioTemporadaUTC,
  fimTemporadaUTC,
  diasRestantesTemporada,
  molduraDaTemporada,
  molduraDaTemporadaId,
  marcosAlcancados,
  proximoMarco,
} from "./season";

describe("chaveTemporada", () => {
  it("mês civil UTC com zero à esquerda", () => {
    expect(chaveTemporada(new Date(Date.UTC(2026, 6, 10)))).toBe("2026-07");
    expect(chaveTemporada(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01");
    expect(chaveTemporada(new Date(Date.UTC(2026, 11, 31, 23, 59)))).toBe("2026-12");
  });

  it("virada de mês é exata (último instante vs. primeiro)", () => {
    expect(chaveTemporada(new Date(Date.UTC(2026, 6, 31, 23, 59, 59)))).toBe("2026-07");
    expect(chaveTemporada(new Date(Date.UTC(2026, 7, 1, 0, 0, 0)))).toBe("2026-08");
  });
});

describe("janela da temporada", () => {
  it("início = dia 1 00:00 UTC; fim = dia 1 do mês seguinte", () => {
    const now = new Date(Date.UTC(2026, 6, 10, 15, 30));
    expect(inicioTemporadaUTC(now).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(fimTemporadaUTC(now).toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("dezembro vira janeiro do ano seguinte", () => {
    const now = new Date(Date.UTC(2026, 11, 15));
    expect(fimTemporadaUTC(now).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("dias restantes nunca negativos e coerentes", () => {
    const now = new Date(Date.UTC(2026, 6, 30, 12));
    expect(diasRestantesTemporada(now)).toBe(1);
    const fimDoMes = new Date(Date.UTC(2026, 6, 31, 23, 59));
    expect(diasRestantesTemporada(fimDoMes)).toBe(0);
  });
});

describe("marcos", () => {
  it("marcos são estritamente crescentes em XP", () => {
    for (let i = 1; i < MARCOS_TEMPORADA.length; i++) {
      expect(MARCOS_TEMPORADA[i]!.xp).toBeGreaterThan(MARCOS_TEMPORADA[i - 1]!.xp);
    }
  });

  it("só o marco final concede a moldura", () => {
    const comMoldura = MARCOS_TEMPORADA.filter((m) => m.moldura);
    expect(comMoldura).toHaveLength(1);
    expect(comMoldura[0]).toBe(MARCOS_TEMPORADA[MARCOS_TEMPORADA.length - 1]);
  });

  it("marcosAlcancados respeita o limiar exato", () => {
    expect(marcosAlcancados(0)).toHaveLength(0);
    expect(marcosAlcancados(500)).toHaveLength(1);
    expect(marcosAlcancados(499)).toHaveLength(0);
    expect(marcosAlcancados(99_999)).toHaveLength(MARCOS_TEMPORADA.length);
  });

  it("proximoMarco avança e esgota", () => {
    expect(proximoMarco(0)?.xp).toBe(500);
    expect(proximoMarco(500)?.xp).toBe(1500);
    expect(proximoMarco(99_999)).toBeNull();
  });
});

describe("moldura da temporada", () => {
  it("id determinístico pela chave", () => {
    expect(molduraDaTemporadaId("2026-07")).toBe("frame-season-2026-07");
  });

  it("nome e gradiente coerentes com o mês", () => {
    const m = molduraDaTemporada("2026-07");
    expect(m.id).toBe("frame-season-2026-07");
    expect(m.name).toContain("Julho");
    expect(m.name).toContain("2026");
    expect(m.colors.length).toBeGreaterThanOrEqual(2);
  });

  it("todos os 12 meses têm gradiente", () => {
    for (let mes = 1; mes <= 12; mes++) {
      const chave = `2026-${String(mes).padStart(2, "0")}`;
      expect(molduraDaTemporada(chave).colors.length).toBeGreaterThanOrEqual(2);
      expect(nomeTemporada(chave)).not.toContain("?");
    }
  });
});
