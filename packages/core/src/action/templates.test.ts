import { describe, it, expect } from "vitest";
import { ACTION_TEMPLATES, templatesDaArea } from "./templates";

describe("ACTION_TEMPLATES", () => {
  it("toda área tem entre 3 e 6 sugestões", () => {
    for (const [areaId, templates] of Object.entries(ACTION_TEMPLATES)) {
      expect(templates.length, `área ${areaId}`).toBeGreaterThanOrEqual(3);
      expect(templates.length, `área ${areaId}`).toBeLessThanOrEqual(6);
    }
  });

  it("ids únicos dentro de cada área", () => {
    for (const [areaId, templates] of Object.entries(ACTION_TEMPLATES)) {
      const ids = templates.map((t) => t.id);
      expect(new Set(ids).size, `área ${areaId}`).toBe(ids.length);
    }
  });

  it("todo label é uma frase não vazia", () => {
    for (const templates of Object.values(ACTION_TEMPLATES)) {
      for (const t of templates) {
        expect(t.label.trim().length).toBeGreaterThan(3);
      }
    }
  });

  it("intensity, quando presente, é 1 ou 2", () => {
    for (const templates of Object.values(ACTION_TEMPLATES)) {
      for (const t of templates) {
        if (t.intensity !== undefined) {
          expect([1, 2]).toContain(t.intensity);
        }
      }
    }
  });
});

describe("templatesDaArea", () => {
  it("retorna as sugestões da área conhecida", () => {
    expect(templatesDaArea("academia").length).toBeGreaterThan(0);
  });

  it("retorna vazio para área custom (id fora do catálogo)", () => {
    expect(templatesDaArea("minha-area-custom-xyz")).toEqual([]);
  });

  it("retorna vazio para null/undefined (área sem catalogId)", () => {
    expect(templatesDaArea(null)).toEqual([]);
    expect(templatesDaArea(undefined)).toEqual([]);
  });
});
