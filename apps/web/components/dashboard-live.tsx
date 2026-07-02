"use client";

/**
 * Dashboard "Minha Evolução" LIGADO AOS DADOS REAIS (tRPC → Supabase).
 *
 * - `progress.bootstrap` roda no primeiro acesso (idempotente) e cria as Áreas.
 * - `progress.me` alimenta anel/stats/cards; `action.log` registra ação real.
 * - Optimistic UI: a barra sobe na hora com o baseXp (mesma matemática do
 *   servidor via @rise/core); o servidor confirma e reconcilia (invalidate).
 * - Celebração de level-up vem da RESPOSTA do servidor (autoritativa).
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fatorAmplitude, progressoNoNivel, multStreak } from "@rise/core";
import { trpc } from "@/lib/trpc/react";
import { TRPCProvider } from "@/lib/trpc/provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RiseMark, RiseWordmark } from "./rise-mark";
import { LevelRing } from "./level-ring";
import { AreaCard, cssColor } from "./area-card";

const nf = new Intl.NumberFormat("pt-BR");

interface Toast {
  id: number;
  amount: number;
}
interface Celebracao {
  nome: string;
  nivel: number;
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

function Skeleton() {
  return (
    <div className="relative mx-auto w-full max-w-5xl px-5 pt-6">
      <div className="flex items-center justify-between">
        <RiseWordmark size={26} />
        <span className="h-9 w-40 animate-pulse rounded-full bg-surface" />
      </div>
      <div className="mt-12 h-10 w-64 animate-pulse rounded-xl bg-surface" />
      <div className="mt-8 h-72 animate-pulse rounded-[28px] bg-surface-2" />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-[20px] bg-surface" />
        ))}
      </div>
    </div>
  );
}

function DashboardInner({ displayName }: { displayName: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [booted, setBooted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cel, setCel] = useState<Celebracao | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toastId = useRef(0);
  const bootStarted = useRef(false);

  // Bootstrap idempotente no primeiro acesso.
  const boot = trpc.progress.bootstrap.useMutation({
    onSettled: () => {
      setBooted(true);
      void utils.progress.me.invalidate();
    },
  });
  useEffect(() => {
    if (!bootStarted.current) {
      bootStarted.current = true;
      boot.mutate({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = trpc.progress.me.useQuery(undefined, { enabled: booted });

  const logAction = trpc.action.log.useMutation({
    onMutate: async (vars) => {
      // Optimistic: barra sobe na hora com o baseXp da área.
      await utils.progress.me.cancel();
      const prev = utils.progress.me.getData();
      const area = prev?.areas.find((a) => a.id === vars.lifeAreaId);
      if (prev && area) {
        const ganho = area.baseXp;
        utils.progress.me.setData(undefined, {
          ...prev,
          totalXp: prev.totalXp + ganho,
          areas: prev.areas.map((a) => {
            if (a.id !== vars.lifeAreaId) return a;
            const xpNoNivel = a.xpNoNivel + ganho;
            // Na fronteira de nível, deixa o servidor confirmar (level-up é autoritativo).
            return xpNoNivel >= a.xpDoNivel
              ? { ...a }
              : { ...a, xpNoNivel, fracao: xpNoNivel / a.xpDoNivel };
          }),
        });
        const id = ++toastId.current;
        setToasts((t) => [...t, { id, amount: ganho }]);
        window.setTimeout(
          () => setToasts((t) => t.filter((x) => x.id !== id)),
          1100,
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx2) => {
      if (ctx2?.prev) utils.progress.me.setData(undefined, ctx2.prev);
    },
    onSuccess: (res, vars) => {
      if (!res.deduped && res.leveledUp) {
        const area = utils.progress.me
          .getData()
          ?.areas.find((a) => a.id === vars.lifeAreaId);
        setCel({ nome: area?.nome ?? "Área", nivel: res.areaLevel });
        window.setTimeout(() => setCel(null), 2400);
      }
    },
    onSettled: () => void utils.progress.me.invalidate(),
  });

  function registrar(areaId: string) {
    logAction.mutate({
      lifeAreaId: areaId,
      clientActionId: crypto.randomUUID(),
      kind: "quick_log",
    });
  }

  async function sair() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/entrar");
    router.refresh();
  }

  // Atalho "A" abre o sheet de registro (doc 09).
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

  if (!me.data) {
    if (me.isError) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
          <RiseMark size={40} />
          <p className="text-muted">Não consegui carregar sua evolução.</p>
          <button
            type="button"
            onClick={() => void me.refetch()}
            className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-void"
          >
            Tentar de novo
          </button>
        </main>
      );
    }
    return <Skeleton />;
  }

  const d = me.data;
  const mult = multStreak(d.streakDias);
  const multTxt = mult.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const riseProg = progressoNoNivel(
    Math.round(d.totalXp * fatorAmplitude(d.activeAreas)),
  );

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
        <header className="flex items-center justify-between">
          <RiseWordmark size={26} />
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void sair()}
              className="rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-snow"
            >
              Sair
            </button>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold uppercase text-void">
              {displayName.charAt(0)}
            </span>
          </div>
        </header>

        <section className="animate-rise-in mt-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-snow sm:text-4xl">
            Olá, {displayName}.
          </h1>
          <p className="mt-2 text-base text-muted">
            Toda ação conta. Toda evolução aparece — e agora fica salva.
          </p>
        </section>

        <section
          className="animate-rise-in mt-8 rounded-[28px] border border-line bg-surface-2 p-6 sm:p-8"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
            <LevelRing nivel={d.riseLevel} fracao={riseProg.fracao} />
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
                <Stat valor={nf.format(d.totalXp)} rotulo="XP total" />
                <Stat valor={String(d.activeAreas)} rotulo="Áreas ativas" />
                <Stat
                  valor={`${d.streakDias} ${d.streakDias === 1 ? "dia" : "dias"}`}
                  rotulo="Sequência"
                  destaque
                />
                <Stat valor={`${multTxt}×`} rotulo="Bônus de streak" />
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <RiseMark size={22} />
                <p className="text-sm text-muted">
                  <span className="font-semibold text-snow">
                    Toque numa Área da Vida
                  </span>{" "}
                  para registrar uma ação real — seu XP fica salvo na sua conta.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="animate-rise-in mt-10"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
              Áreas da Vida
            </h2>
            <span className="text-xs text-muted">
              {d.areas.length} em progresso
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.areas.map((a) => (
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

      {/* Sheet de registro (FAB / tecla A) */}
      {sheetOpen && (
        <div className="animate-pop-in fixed bottom-24 right-6 z-40 w-72 rounded-2xl border border-line bg-surface-2 p-2 shadow-2xl">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Registrar ação
          </p>
          {d.areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => registrar(a.id)}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: cssColor(a.cor) }}
                />
                <span className="text-sm font-medium text-snow">{a.nome}</span>
              </span>
              <span className="tnum text-xs font-semibold text-brand">
                +{a.baseXp}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setSheetOpen((o) => !o)}
        aria-label="Registrar ação"
        className="fixed bottom-6 right-6 z-40 inline-flex size-14 items-center justify-center rounded-full bg-brand text-void shadow-[0_8px_30px_rgba(16,185,129,0.45)] transition-transform hover:scale-105 active:scale-95"
      >
        <PlusIcon />
      </button>

      {/* Celebração de level-up (autoritativa: vem do servidor) */}
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

/** Entrada pública: monta o provider tRPC e o dashboard vivo. */
export function DashboardLive({ displayName }: { displayName: string }) {
  return (
    <TRPCProvider>
      <DashboardInner displayName={displayName} />
    </TRPCProvider>
  );
}
