import { describe, it, expect } from "vitest";
import { formatarFatos, type BlocoFatos } from "./facts";

const bloco: BlocoFatos = {
  periodo: "ultimos_7_dias",
  nivelRise: 23,
  acoesTotalSemana: 19,
  areas: [
    { area: "academia", nivel: 7, xpSemana: 320, streak: 12 },
    { area: "sono", nivel: 4, mediaHoras: 6.1, tendencia: "queda" },
  ],
  alertaStreak: [{ area: "idiomas", horasParaQuebrar: 4 }],
};

describe("formatarFatos — âncora anti-alucinação", () => {
  it("marca o bloco como autoritativo e proíbe estimar", () => {
    const s = formatarFatos(bloco);
    expect(s).toContain("FATOS");
    expect(s).toContain("NUNCA estime");
  });

  it("inclui os números exatos e usa snake_case no payload", () => {
    const s = formatarFatos(bloco);
    expect(s).toContain('"nivel_rise": 23');
    expect(s).toContain('"acoes_total_semana": 19');
    expect(s).toContain('"xp_semana": 320');
    expect(s).toContain('"horas_para_quebrar": 4');
    expect(s).toContain('"media_horas": 6.1');
  });

  it("omite campos ausentes (não inventa zeros)", () => {
    const s = formatarFatos(bloco);
    const json = JSON.parse(s.slice(s.indexOf("{"))) as {
      areas: { area: string; streak?: number; media_horas?: number }[];
    };
    const sono = json.areas.find((a) => a.area === "sono");
    // 'sono' não tem streak → a chave não deve existir (nada de zero forçado)
    expect(sono?.streak).toBeUndefined();
    expect(sono?.media_horas).toBe(6.1);
  });

  it("é determinístico (mesma entrada → mesma saída, p/ prompt caching)", () => {
    expect(formatarFatos(bloco)).toBe(formatarFatos(bloco));
  });
});
