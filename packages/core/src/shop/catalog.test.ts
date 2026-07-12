import { describe, it, expect } from "vitest";
import {
  COSMETIC_CATALOG,
  cosmeticoPorId,
  precoEfetivo,
  idsEmDestaque,
  itemCompravel,
  eventoAtivoEm,
  progressoColecoes,
  DESCONTO_DESTAQUE,
} from "./catalog";

describe("shop catalog", () => {
  it("ids únicos e preços não-negativos", () => {
    const ids = new Set(COSMETIC_CATALOG.map((c) => c.id));
    expect(ids.size).toBe(COSMETIC_CATALOG.length);
    expect(COSMETIC_CATALOG.every((c) => c.price >= 0)).toBe(true);
  });

  it("desconto de destaque aplica só a itens em destaque", () => {
    const item = cosmeticoPorId("frame-aurora")!;
    expect(precoEfetivo(item, false)).toBe(item.price);
    expect(precoEfetivo(item, true)).toBe(
      Math.max(1, Math.round(item.price * (1 - DESCONTO_DESTAQUE))),
    );
    expect(precoEfetivo(item, true)).toBeLessThan(item.price);
  });

  it("destaques são determinísticos por seed e excluem sazonais", () => {
    const a = idsEmDestaque("2026-07-12");
    const b = idsEmDestaque("2026-07-12");
    expect([...a]).toEqual([...b]);
    expect(a.size).toBe(6);
    for (const id of a) {
      expect(cosmeticoPorId(id)!.evento).toBeUndefined();
    }
  });

  it("item sazonal só é comprável durante o evento", () => {
    const natal = COSMETIC_CATALOG.find((c) => c.evento === "natal")!;
    expect(itemCompravel(natal, "natal")).toBe(true);
    expect(itemCompravel(natal, null)).toBe(false);
    expect(itemCompravel(natal, "halloween")).toBe(false);
  });

  it("eventoAtivoEm mapeia datas conhecidas", () => {
    expect(eventoAtivoEm({ mes: 12, dia: 25 })).toBe("natal");
    expect(eventoAtivoEm({ mes: 10, dia: 31 })).toBe("halloween");
    expect(eventoAtivoEm({ mes: 1, dia: 1 })).toBe("ano-novo");
    expect(eventoAtivoEm({ mes: 7, dia: 15 })).toBeNull();
  });

  it("progresso de coleção conta possuídos por categoria", () => {
    const donos = new Set(["frame-emerald", "frame-azure", "theme-azure"]);
    const cols = progressoColecoes(donos);
    const frames = cols.find((c) => c.category === "frame")!;
    expect(frames.owned).toBe(2);
    expect(frames.total).toBeGreaterThan(2);
  });
});
