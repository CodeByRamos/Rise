"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  calcularNivelRise,
  progressoNoNivel,
  nivelDeArea,
  multStreak,
  calcularXpConcedido,
} from "@rise/core";
import {
  AREA_SEEDS,
  STREAK_DIAS,
  NOME_USUARIO,
  temporadaAtual,
} from "@/lib/areas";
import { RiseMark, RiseWordmark } from "./rise-mark";
import { LevelRing } from "./level-ring";
import { AreaCard } from "./area-card";

const nf = new Intl.NumberFormat("pt-BR");
const streakMultTxt = multStreak(STREAK_DIAS).toLocaleString("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface Toast {
  id: number;
  amount: number;
}
interface Celebracao {
  nome: string;
  nivel: number;
  cor: string;
}

function Stat({
  valor,
  rotulo,
  destaque = false,
}: {
  valor: string;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display tnum text-2xl font-semibold leading-none ${
          destaque ? "text-brand" : "text-snow"
        }`}
      >
        {valor}
      </div>
      <div className="mt-1.5 text-xs font-medium text-muted">{rotulo}</div>
    </div>
  );
}

function PlusIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashboardClient() {
  const [xps, setXps] = useState<Record<string, number>>(() =>
    Object.fromEntries(AREA_SEEDS.map((a) => [a.id, a.xpInicial])),
  );
  const xpsRef = useRef(xps);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cel, setCel] = useState<Celebracao | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toastId = useRef(0);
  const mult = multStreak(STREAK_DIAS);

  const registrar = useCallback(
    (areaId: string) => {
      const seed = AREA_SEEDS.find((a) => a.id === areaId);
      if (!seed) return;

      const oldXp = xpsRef.current[areaId] ?? seed.xpInicial;
      const r = calcularXpConcedido({ baseAcao: seed.baseXp, multStreak: mult });
      const newXp = oldXp + r.xpConcedido;
      const leveled = nivelDeArea(newXp) > nivelDeArea(oldXp);

      const next = { ...xpsRef.current, [areaId]: newXp };
      xpsRef.current = next;
      setXps(next);

      const id = ++toastId.current;
      setToasts((t) => [...t, { id, amount: r.xpConcedido }]);
      window.setTimeout(
        () => setToasts((t) => t.filter((x) => x.id !== id)),
        1100,
      );

      if (leveled) {
        setCel({ nome: seed.nome, nivel: nivelDeArea(newXp), cor: seed.cor });
        window.setTimeout(() => setCel(null), 2400);
      }
    },
    [mult],
  );

  // Atalho de teclado "A" para o registro onipresente (doc 09).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.toLowerCase() === "a" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSheetOpen((o) => !o);
      }
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Derivações (via @rise/core) — recomputadas a cada ação.
  const areaViews = AREA_SEEDS.map((seed) => {
    const xp = xps[seed.id] ?? seed.xpInicial;
    const p = progressoNoNivel(xp);
    return {
      ...seed,
      nivel: nivelDeArea(xp),
      fracao: p.fracao,
      xpNoNivel: p.xpNoNivel,
      xpDoNivel: p.xpDoNivel,
    };
  });

  const rise = calcularNivelRise(
    AREA_SEEDS.map((s) => {
      const xp = xps[s.id] ?? s.xpInicial;
      return { xp, ativaNoPeriodo: nivelDeArea(xp) >= 2 };
    }),
  );
  const riseProg = progressoNoNivel(Math.round(rise.xpRise * rise.fatorAmplitude));

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(16,185,129,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-28 pt-6">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <RiseWordmark size={26} />
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
              <span className="size-1.5 rounded-full bg-brand" />
              {temporadaAtual()}
            </span>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-void">
              {NOME_USUARIO.charAt(0)}
            </span>
          </div>
        </header>

        {/* Saudação */}
        <section className="animate-rise-in mt-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-snow sm:text-4xl">
            Olá, {NOME_USUARIO}.
          </h1>
          <p className="mt-2 text-base text-muted">
            Toda ação conta. Toda evolução aparece.
          </p>
        </section>

        {/* Hero */}
        <section
          className="animate-rise-in mt-8 rounded-[28px] border border-line bg-surface-2 p-6 sm:p-8"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
            <LevelRing nivel={rise.nivelRise} fracao={riseProg.fracao} />
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
                  Sua evolução
                </h2>
                <span className="tnum text-xs text-muted">
                  faltam {nf.format(riseProg.xpFaltando)} XP
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <Stat valor={nf.format(rise.xpRise)} rotulo="XP total" />
                <Stat valor={String(rise.areasAtivas)} rotulo="Áreas ativas" />
                <Stat
                  valor={`${STREAK_DIAS} dias`}
                  rotulo="Sequência"
                  destaque
                />
                <Stat valor={`${streakMultTxt}×`} rotulo="Bônus de streak" />
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <RiseMark size={22} />
                <p className="text-sm text-muted">
                  <span className="font-semibold text-snow">
                    Toque numa Área da Vida
                  </span>{" "}
                  para registrar uma ação e ver seu XP subir — ou pressione{" "}
                  <kbd className="rounded border border-line bg-graphite px-1.5 py-0.5 text-[11px] text-snow">
                    A
                  </kbd>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Áreas da Vida */}
        <section
          className="animate-rise-in mt-10"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
              Áreas da Vida
            </h2>
            <span className="text-xs text-muted">
              {areaViews.length} em progresso
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areaViews.map((a) => (
              <AreaCard
                key={a.id}
                nome={a.nome}
                cor={a.cor}
                nivel={a.nivel}
                fracao={a.fracao}
                xpNoNivel={a.xpNoNivel}
                xpDoNivel={a.xpDoNivel}
                onRegister={() => registrar(a.id)}
              />
            ))}
          </div>
        </section>

        <footer className="mt-16 flex items-center justify-center gap-2 text-xs text-faint">
          <RiseMark size={14} variant="mono" className="text-faint" />
          <span>Rise — o videogame da vida real</span>
        </footer>
      </div>

      {/* Toasts de +XP */}
      <div className="pointer-events-none fixed bottom-28 right-8 z-40 flex flex-col-reverse items-end gap-1">
        {toasts.map((t) => (
          <span
            key={t.id}
            className="animate-float-up font-display tnum text-2xl font-semibold text-brand"
            style={{ textShadow: "0 0 12px rgba(16,185,129,0.55)" }}
          >
            +{t.amount} XP
          </span>
        ))}
      </div>

      {/* Sheet de registro (FAB) */}
      {sheetOpen && (
        <div className="animate-pop-in fixed bottom-24 right-6 z-40 w-72 rounded-2xl border border-line bg-surface-2 p-2 shadow-2xl">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Registrar ação
          </p>
          {AREA_SEEDS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => registrar(s.id)}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: s.cor }}
                />
                <span className="text-sm font-medium text-snow">{s.nome}</span>
              </span>
              <span className="tnum text-xs font-semibold text-brand">
                +{calcularXpConcedido({ baseAcao: s.baseXp, multStreak: mult }).xpConcedido}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setSheetOpen((o) => !o)}
        aria-label="Registrar ação"
        className="fixed bottom-6 right-6 z-40 inline-flex size-14 items-center justify-center rounded-full bg-brand text-void shadow-[0_8px_30px_rgba(16,185,129,0.45)] transition-transform hover:scale-105 active:scale-95"
      >
        <PlusIcon />
      </button>

      {/* Celebração de level-up */}
      {cel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-sm"
          onClick={() => setCel(null)}
        >
          <div className="animate-pop-in flex flex-col items-center gap-4 rounded-[28px] border border-line bg-surface-2 px-12 py-10 text-center">
            <RiseMark size={56} />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Subiu de nível
              </p>
              <p className="mt-2 text-lg text-muted">{cel.nome}</p>
              <p className="font-display tnum mt-1 text-6xl font-semibold text-snow">
                Nível {cel.nivel}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
