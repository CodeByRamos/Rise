/**
 * Motor de Sequência (Streak) — decide extensão/quebra a partir de datas locais.
 *
 * Spec: docs/13-gamificacao.md §5. Timezone do usuário é crítico: o "dia" é o
 * dia civil LOCAL (users.timezone), não UTC. Este módulo é puro: recebe datas
 * como strings YYYY-MM-DD e não conhece banco nem relógio.
 *
 * Amortecedores (Freeze/perdão/repair/Modo Descanso) entram por cima desta
 * decisão básica em iteração futura — a quebra NUNCA remove XP (invariante §5.4).
 */

/** Data civil local (YYYY-MM-DD) de um instante, num timezone IANA. */
export function dataLocalISO(agora: Date, timezone: string): string {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** Diferença em dias civis entre duas datas YYYY-MM-DD (b - a). */
export function diffDias(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const utcA = Date.UTC(ay!, am! - 1, ad!);
  const utcB = Date.UTC(by!, bm! - 1, bd!);
  return Math.round((utcB - utcA) / 86_400_000);
}

export interface StreakEstado {
  currentCount: number;
  longestCount: number;
  /** YYYY-MM-DD local, ou null se nunca houve ação. */
  lastActiveDate: string | null;
}

export interface StreakResultado {
  currentCount: number;
  longestCount: number;
  lastActiveDate: string;
  /** A sequência avançou hoje (1º registro do dia)? Emite `streak.extended`. */
  extended: boolean;
  /** Uma sequência anterior foi zerada (gap > 1 dia)? Emite `streak.broken`. */
  broke: boolean;
  /** Dias da sequência anterior, quando quebrou (para o recorde/telemetria). */
  previousDays: number;
}

/**
 * Aplica uma ação (feita hoje, no fuso do usuário) ao estado da sequência.
 * - 1ª ação de sempre → streak 1 (extended)
 * - mesma data → sem mudança (idempotente por dia)
 * - ontem → +1 (extended)
 * - gap > 1 dia → quebra e recomeça em 1 (broke + extended)
 */
export function aplicarAcaoNoStreak(
  prev: StreakEstado | null,
  hojeLocal: string,
): StreakResultado {
  if (!prev || prev.lastActiveDate === null || prev.currentCount === 0) {
    return {
      currentCount: 1,
      longestCount: Math.max(prev?.longestCount ?? 0, 1),
      lastActiveDate: hojeLocal,
      extended: true,
      broke: false,
      previousDays: 0,
    };
  }

  const gap = diffDias(prev.lastActiveDate, hojeLocal);

  if (gap <= 0) {
    // Mesma data (ou relógio andou para trás — trata como mesmo dia).
    return {
      currentCount: prev.currentCount,
      longestCount: prev.longestCount,
      lastActiveDate: prev.lastActiveDate,
      extended: false,
      broke: false,
      previousDays: 0,
    };
  }

  if (gap === 1) {
    const novo = prev.currentCount + 1;
    return {
      currentCount: novo,
      longestCount: Math.max(prev.longestCount, novo),
      lastActiveDate: hojeLocal,
      extended: true,
      broke: false,
      previousDays: 0,
    };
  }

  // Gap > 1: quebrou. O recorde (longest) fica preservado — perdão > punição.
  return {
    currentCount: 1,
    longestCount: Math.max(prev.longestCount, prev.currentCount, 1),
    lastActiveDate: hojeLocal,
    extended: true,
    broke: true,
    previousDays: prev.currentCount,
  };
}

/** Dias de sequência a partir dos quais o perdão automático fica disponível (§5.3). */
export const PERDAO_STREAK_MINIMO = 14;
/** Máximo de Streak Freezes acumuláveis. */
export const FREEZES_MAX = 2;

export interface AmortecedorOpcoes {
  /** Freezes disponíveis na conta (0–2). */
  freezesAvailable: number;
  /** Perdão automático disponível? (1 a cada 14 dias — controlado pelo chamador via grace_until). */
  perdaoDisponivel: boolean;
}

export interface StreakResultadoAmortecido extends StreakResultado {
  /** Consumiu um Streak Freeze para cobrir o dia perdido. */
  freezeUsado: boolean;
  /** Usou o perdão automático (grátis, streak ≥ 14 dias). */
  perdaoUsado: boolean;
}

/**
 * Versão com amortecedores (doc 13 §5.3): um ÚNICO dia perdido (gap = 2) pode
 * ser absorvido — primeiro pelo perdão automático (grátis, exige sequência
 * ≥ 14 dias), depois por um Streak Freeze. Gap maior que um dia quebra
 * normalmente (freeze protege 1 dia, não férias — Modo Descanso cobre isso).
 */
export function aplicarAcaoComAmortecedores(
  prev: StreakEstado | null,
  hojeLocal: string,
  op: AmortecedorOpcoes,
): StreakResultadoAmortecido {
  const semAmortecedor = { freezeUsado: false, perdaoUsado: false };

  if (!prev || prev.lastActiveDate === null || prev.currentCount === 0) {
    return { ...aplicarAcaoNoStreak(prev, hojeLocal), ...semAmortecedor };
  }

  const gap = diffDias(prev.lastActiveDate, hojeLocal);

  // Exatamente 1 dia perdido → tenta absorver.
  if (gap === 2) {
    const perdoa = op.perdaoDisponivel && prev.currentCount >= PERDAO_STREAK_MINIMO;
    const congela = !perdoa && op.freezesAvailable > 0;
    if (perdoa || congela) {
      const novo = prev.currentCount + 1;
      return {
        currentCount: novo,
        longestCount: Math.max(prev.longestCount, novo),
        lastActiveDate: hojeLocal,
        extended: true,
        broke: false,
        previousDays: 0,
        freezeUsado: congela,
        perdaoUsado: perdoa,
      };
    }
  }

  return { ...aplicarAcaoNoStreak(prev, hojeLocal), ...semAmortecedor };
}
