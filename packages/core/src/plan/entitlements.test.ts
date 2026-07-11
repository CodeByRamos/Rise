import { describe, it, expect } from "vitest";
import {
  ENTITLEMENTS,
  entitlementsDe,
  isPremium,
  COACH_FREE_DAILY,
} from "./entitlements";

describe("entitlements", () => {
  it("Free é o único tier não-premium", () => {
    expect(isPremium("free")).toBe(false);
    expect(isPremium("plus")).toBe(true);
    expect(isPremium("founder")).toBe(true);
    expect(isPremium("team")).toBe(true);
  });

  it("Free tem cota de Coach e stats de 7 dias, sem profundidade", () => {
    const f = ENTITLEMENTS.free;
    expect(f.coachDailyMessages).toBe(COACH_FREE_DAILY);
    expect(f.statsHistoryDays).toBe(7);
    expect(f.deepAnalysis).toBe(false);
    expect(f.premiumCosmetics).toBe(false);
    expect(f.monthlySparksStipend).toBe(0);
  });

  it("todo tier pago destrava Coach ilimitado, Análise Profunda e histórico total", () => {
    for (const tier of ["plus", "founder", "team"] as const) {
      const e = ENTITLEMENTS[tier];
      expect(e.coachDailyMessages).toBe(Infinity);
      expect(e.deepAnalysis).toBe(true);
      expect(e.statsHistoryDays).toBe(Infinity);
      expect(e.premiumCosmetics).toBe(true);
      expect(e.monthlySparksStipend).toBeGreaterThan(0);
    }
  });

  it("Founder tem estipêndio de Faíscas maior que o Plus", () => {
    expect(ENTITLEMENTS.founder.monthlySparksStipend).toBeGreaterThan(
      ENTITLEMENTS.plus.monthlySparksStipend,
    );
  });

  it("plano desconhecido/nulo cai em Free (conservador)", () => {
    expect(entitlementsDe(null)).toEqual(ENTITLEMENTS.free);
    expect(entitlementsDe("bogus")).toEqual(ENTITLEMENTS.free);
    expect(entitlementsDe("plus")).toEqual(ENTITLEMENTS.plus);
  });
});
