"use client";

/**
 * Dashboard "Minha Evolução" LIGADO AOS DADOS REAIS (tRPC → Supabase).
 *
 * Registro de ação exige PROVA (doc 13 §10.3): uma nota do que foi feito
 * (mín. 3 caracteres) OU uma foto (bucket privado `provas`). A prova vira o
 * conteúdo do feed social na Fase 2. Optimistic UI via @rise/core; level-up e
 * streak são autoritativos do servidor.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fatorAmplitude,
  progressoNoNivel,
  multStreak,
  templatesDaArea,
} from "@rise/core";
import { trpc } from "@/lib/trpc/react";
import { TRPCProvider } from "@/lib/trpc/provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RiseMark, RiseWordmark } from "./rise-mark";
import { LevelRing } from "./level-ring";
import { AreaCard, cssColor } from "./area-card";
import { Temporada } from "./temporada";
import { Diario } from "./diario";
import { Avatar } from "./avatar";
import { AppNav } from "./app-nav";
import { Habitos } from "./habitos";
import { SparkIcon, CheckIcon, XIcon, CameraIcon, PlusIcon } from "./icons";

const nf = new Intl.NumberFormat("pt-BR");

interface Toast {
  id: number;
  amount: number;
  rotulo?: string;
}
interface Celebracao {
  nome: string;
  nivel: number;
}

function Stat({
  valor,
  rotulo,
  sub,
  destaque = false,
}: {
  valor: string;
  rotulo: string;
  sub?: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display tnum tabular-nums text-2xl font-semibold leading-none ${
          destaque ? "text-brand" : "text-snow"
        }`}
      >
        {valor}
      </div>
      <div className="mt-1.5 text-xs font-medium text-muted">{rotulo}</div>
      {sub && <div className="tnum mt-0.5 text-[11px] text-faint">{sub}</div>}
    </div>
  );
}

interface MissaoUI {
  id: string;
  titulo: string;
  scope: "daily" | "weekly";
  progress: number;
  target: number;
  xpReward: number;
  sparksReward: number;
  completa: boolean;
}

function MissaoCard({ m }: { m: MissaoUI }) {
  const pct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0;
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-4 transition-colors ${
        m.completa
          ? "border-[color-mix(in_srgb,var(--color-brand)_45%,transparent)] bg-brand/5"
          : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-snow">{m.titulo}</p>
        {m.completa && <CheckIcon size={16} className="shrink-0 text-brand" />}
      </div>
      <div className="tnum mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          {Math.min(m.progress, m.target)}/{m.target}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand">
          +{m.xpReward} XP · +{m.sparksReward}
          <SparkIcon size={11} />
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-graphite">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function GrupoMissoes({ titulo, itens }: { titulo: string; itens: MissaoUI[] }) {
  if (itens.length === 0) return null;
  const feitas = itens.filter((m) => m.completa).length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          {titulo}
        </h3>
        <span className="tnum text-xs text-muted">
          {feitas}/{itens.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {itens.map((m) => (
          <MissaoCard key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}

function MissoesSecao({ missoes }: { missoes: MissaoUI[] }) {
  if (missoes.length === 0) return null;
  const diarias = missoes.filter((m) => m.scope === "daily");
  const semanais = missoes.filter((m) => m.scope === "weekly");
  return (
    <section className="animate-rise-in mt-10 space-y-6" style={{ animationDelay: "90ms" }}>
      <GrupoMissoes titulo="Missões de hoje" itens={diarias} />
      <GrupoMissoes titulo="Missões da semana" itens={semanais} />
    </section>
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

/** Sobe a foto de prova para provas/<uid>/<uuid>.<ext> (RLS: só a própria pasta). */
async function uploadFotoProva(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Sessão expirada — entre de novo.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("provas")
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Falha no upload da foto: ${error.message}`);
  return path;
}

function DashboardInner({ displayName }: { displayName: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [booted, setBooted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cel, setCel] = useState<Celebracao | null>(null);
  const [mostrarWelcome, setMostrarWelcome] = useState(false);
  const toastId = useRef(0);
  const bootStarted = useRef(false);

  // ----- Modal de registro com prova -----
  const [modalArea, setModalArea] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [nota, setNota] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [intensidade, setIntensidade] = useState<1 | 2 | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  function abrirModal(areaId: string | null) {
    setModalArea(areaId);
    setNota("");
    setFoto(null);
    setIntensidade(undefined);
    setErroModal(null);
    setModalOpen(true);
  }
  function fecharModal() {
    if (!enviando) setModalOpen(false);
  }

  // Bootstrap idempotente no primeiro acesso.
  const boot = trpc.progress.bootstrap.useMutation({
    onSettled: () => {
      try {
        localStorage.setItem("rise_booted", "1");
      } catch {
        // sem localStorage → só não pula o bootstrap nas próximas visitas
      }
      setBooted(true);
      void utils.progress.me.invalidate();
    },
  });
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    // Já provisionado neste dispositivo? Pula a transação de bootstrap (que
    // rodava em TODA carga da Home) e libera as queries direto.
    let jaBootou = false;
    try {
      jaBootou = localStorage.getItem("rise_booted") === "1";
    } catch {
      // sem localStorage → roda o bootstrap (idempotente no servidor)
    }
    if (jaBootou) setBooted(true);
    else boot.mutate({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = trpc.progress.me.useQuery(undefined, { enabled: booted });
  const diario = trpc.progress.diario.useQuery(undefined, { enabled: booted });

  // Onboarding: mostra o boas-vindas 1x para quem ainda não registrou nada.
  useEffect(() => {
    if (
      diario.data &&
      diario.data.length === 0 &&
      typeof window !== "undefined" &&
      !localStorage.getItem("rise_onboarded")
    ) {
      setMostrarWelcome(true);
    }
  }, [diario.data]);

  function encerrarWelcome() {
    setMostrarWelcome(false);
    try {
      localStorage.setItem("rise_onboarded", "1");
    } catch {
      // sem localStorage → apenas fecha
    }
  }
  const missoes = trpc.mission.today.useQuery(undefined, { enabled: booted });
  const coach = trpc.coach.checkin.useQuery(undefined, {
    enabled: booted,
    staleTime: 60_000,
  });

  const logAction = trpc.action.log.useMutation({
    onMutate: async (vars) => {
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
    onError: (e, _v, ctx2) => {
      if (ctx2?.prev) utils.progress.me.setData(undefined, ctx2.prev);
      setErroModal(e.message);
      setModalOpen(true);
    },
    onSuccess: (res, vars) => {
      if (res.deduped) return;
      if (res.leveledUp) {
        const area = utils.progress.me
          .getData()
          ?.areas.find((a) => a.id === vars.lifeAreaId);
        setCel({ nome: area?.nome ?? "Área", nivel: res.areaLevel });
        window.setTimeout(() => setCel(null), 2400);
      }
      if (res.freezeGanho) {
        const id = ++toastId.current;
        setToasts((t) => [
          ...t,
          { id, amount: 0, rotulo: "Streak Freeze ganho — 1 dia protegido" },
        ]);
        window.setTimeout(
          () => setToasts((t) => t.filter((x) => x.id !== id)),
          2200,
        );
      }
      // Conquista desbloqueada → toast dedicado.
      for (const c of res.conquistas ?? []) {
        const id = ++toastId.current;
        setToasts((t) => [
          ...t,
          { id, amount: 0, rotulo: `Conquista desbloqueada: ${c.nome}` },
        ]);
        window.setTimeout(
          () => setToasts((t) => t.filter((x) => x.id !== id)),
          2600,
        );
      }
      // Missão concluída → toast extra com recompensa.
      for (const m of res.missoesCompletadas ?? []) {
        const id = ++toastId.current;
        setToasts((t) => [
          ...t,
          {
            id,
            amount: m.xpReward,
            rotulo: `Missão: ${m.titulo} · +${m.sparksReward} Faíscas`,
          },
        ]);
        window.setTimeout(
          () => setToasts((t) => t.filter((x) => x.id !== id)),
          2200,
        );
      }
    },
    onSettled: () => {
      void utils.progress.me.invalidate();
      void utils.progress.diario.invalidate();
      void utils.mission.today.invalidate();
      void utils.coach.checkin.invalidate();
    },
  });

  async function enviarProva() {
    const areaSel = modalArea;
    if (!areaSel) {
      setErroModal("Escolha a Área da Vida.");
      return;
    }
    const notaLimpa = nota.trim();
    if (notaLimpa.length < 3 && !foto) {
      setErroModal(
        "Conte o que você fez (mínimo 3 caracteres) ou anexe uma foto — a prova é o que faz o progresso valer.",
      );
      return;
    }
    setEnviando(true);
    setErroModal(null);
    try {
      let photoPath: string | undefined;
      if (foto) photoPath = await uploadFotoProva(foto);
      logAction.mutate({
        lifeAreaId: areaSel,
        clientActionId: crypto.randomUUID(),
        kind: "quick_log",
        note: notaLimpa.length >= 3 ? notaLimpa : undefined,
        photoPath,
        intensity: intensidade,
      });
      setModalOpen(false);
    } catch (e) {
      setErroModal(e instanceof Error ? e.message : "Falha ao enviar a prova.");
    } finally {
      setEnviando(false);
    }
  }

  async function sair() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/entrar");
    router.refresh();
  }

  // Atalho "A" abre o registro (doc 09).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.toLowerCase() === "a" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        abrirModal(null);
      }
      if (e.key === "Escape") setModalOpen(false);
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
  const areaDoModal = d.areas.find((a) => a.id === modalArea) ?? null;

  const tema = d.themePreview as { accent?: string; strong?: string } | null;

  return (
    <main
      className="relative min-h-dvh overflow-hidden"
      style={
        tema?.accent
          ? ({
              "--color-brand": tema.accent,
              "--color-brand-strong": tema.strong ?? tema.accent,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(16,185,129,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-28 pt-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <RiseWordmark size={26} />
          <AppNav />
          <div className="flex items-center gap-2.5">
            <span
              className="tnum inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-snow"
              title="Faíscas — moeda cosmética (nunca compra progresso)"
            >
              <SparkIcon size={13} className="text-brand" />
              {nf.format(d.sparks)}
            </span>
            <button
              type="button"
              onClick={() => void sair()}
              className="rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-snow"
            >
              Sair
            </button>
            <Avatar
              nome={displayName}
              avatarPath={d.avatarUrl}
              frameColors={(d.framePreview as { colors?: string[] } | null)?.colors}
              size={36}
            />
          </div>
        </header>

        <section className="animate-rise-in mt-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-snow sm:text-4xl">
            Olá, {displayName}.
          </h1>
          <p className="mt-2 text-base text-muted">
            Toda ação conta. Toda evolução aparece — com prova.
          </p>
          {d.restModeUntil && (
            <p className="mt-3 inline-flex rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
              Modo Descanso até{" "}
              {new Date(d.restModeUntil).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}{" "}
              — sua sequência está protegida.
            </p>
          )}
          {d.streakRepair && (
            <button
              type="button"
              onClick={() => abrirModal(null)}
              className="mt-3 flex w-full max-w-md items-center gap-3 rounded-2xl border border-brand/40 bg-brand/5 px-4 py-3 text-left transition-colors hover:bg-brand/10"
            >
              <RiseMark size={22} className="shrink-0" />
              <span className="text-sm text-muted">
                <span className="font-semibold text-snow">
                  Sua sequência de {d.streakRepair.valor} dias pode voltar.
                </span>{" "}
                Registre uma ação até{" "}
                {new Date(d.streakRepair.prazo).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                para recuperá-la.
              </span>
            </button>
          )}
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
                  sub={`recorde ${d.streakRecorde} · ${d.freezes} ${d.freezes === 1 ? "freeze" : "freezes"}`}
                  destaque
                />
                <Stat valor={`${multTxt}×`} rotulo="Bônus de streak" />
              </div>
              <a
                href="/coach"
                className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-brand/50"
              >
                <RiseMark size={22} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                      Coach
                    </p>
                    <span className="text-[11px] font-medium text-brand">
                      Conversar →
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {coach.data?.texto ??
                      "Registre uma ação com prova — escreva o que fez ou anexe uma foto."}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Missões — diárias + semanais */}
        <MissoesSecao missoes={missoes.data ?? []} />

        {/* Hábitos de hoje — checklist recorrente que vira XP */}
        <Habitos />

        {/* Temporada Solo — trilha mensal de marcos */}
        <Temporada />

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
                onRegister={() => abrirModal(a.id)}
              />
            ))}
          </div>
        </section>

        {/* Diário de Evolução — as provas */}
        <section
          className="animate-rise-in mt-10"
          style={{ animationDelay: "180ms" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
              Diário de Evolução
            </h2>
            <span className="text-xs text-muted">suas provas</span>
          </div>
          <Diario itens={diario.data ?? []} />
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
            className="animate-float-up flex flex-col items-end"
            style={{ textShadow: "0 0 12px rgba(16,185,129,0.55)" }}
          >
            {t.amount > 0 && (
              <span className="font-display tnum text-2xl font-semibold text-brand">
                +{t.amount} XP
              </span>
            )}
            {t.rotulo && (
              <span className="text-xs font-medium text-snow">{t.rotulo}</span>
            )}
          </span>
        ))}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => abrirModal(null)}
        aria-label="Registrar ação"
        className="fixed bottom-6 right-6 z-40 inline-flex size-14 items-center justify-center rounded-full bg-brand text-void shadow-[0_8px_30px_rgba(16,185,129,0.45)] transition-transform hover:scale-105 active:scale-95"
      >
        <PlusIcon />
      </button>

      {/* Modal de registro com PROVA */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-void/70 backdrop-blur-sm sm:items-center"
          onClick={fecharModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="registro-titulo"
            className="animate-pop-in w-full max-w-md rounded-t-[24px] border border-line bg-surface-2 p-6 sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3
                id="registro-titulo"
                className="font-display text-lg font-semibold text-snow"
              >
                Registrar ação
              </h3>
              <button
                type="button"
                onClick={fecharModal}
                aria-label="Fechar"
                className="text-muted transition-colors hover:text-snow"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Escolha da área */}
            <div className="mt-4 flex flex-wrap gap-2">
              {d.areas.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setModalArea(a.id);
                    setIntensidade(undefined);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    modalArea === a.id
                      ? "border-brand bg-brand/10 text-snow"
                      : "border-line bg-surface text-muted hover:text-snow"
                  }`}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: cssColor(a.cor) }}
                  />
                  {a.nome}
                  <span className="tnum text-brand">+{a.baseXp}</span>
                </button>
              ))}
            </div>

            {/* Sugestões da área — mata a "nota em branco", 1 toque preenche */}
            {areaDoModal && templatesDaArea(areaDoModal.catalogId).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {templatesDaArea(areaDoModal.catalogId).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setNota(t.label);
                      setIntensidade(t.intensity);
                    }}
                    className={`rounded-[var(--radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      nota === t.label
                        ? "border-brand bg-brand/10 text-snow"
                        : "border-line bg-surface text-faint hover:text-snow"
                    }`}
                  >
                    {t.label}
                    {t.intensity === 2 && (
                      <span className="ml-1 text-brand">2×</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Prova: nota */}
            <label
              className="mt-5 flex items-baseline justify-between text-xs font-medium text-muted"
              htmlFor="prova-nota"
            >
              <span>
                O que você fez? <span className="text-brand">(sua prova)</span>
              </span>
              {intensidade === 2 && (
                <span className="text-brand">2× XP nesta ação</span>
              )}
            </label>
            <textarea
              id="prova-nota"
              rows={3}
              value={nota}
              onChange={(e) => {
                setNota(e.target.value);
                // Edição manual desarma o 2x sugerido pelo chip — só a
                // intensidade escolhida explicitamente vale (nunca "de graça").
                setIntensidade(undefined);
              }}
              placeholder={
                areaDoModal
                  ? `Ex.: 40min de ${areaDoModal.nome.toLowerCase()} — o que rolou?`
                  : "Ex.: li 20 páginas do livro X, treino de pernas completo…"
              }
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-brand"
            />

            {/* Prova: foto (opcional) */}
            <div className="mt-3 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-muted transition-colors hover:text-snow">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                />
                <CameraIcon size={15} />
                {foto ? "Trocar foto" : "Anexar foto"}
              </label>
              {foto && (
                <span className="max-w-[180px] truncate text-xs text-brand">
                  {foto.name}
                </span>
              )}
            </div>

            {erroModal && (
              <p className="mt-3 text-sm text-red-400">{erroModal}</p>
            )}

            <button
              type="button"
              disabled={enviando || !modalArea}
              onClick={() => void enviarProva()}
              className="mt-5 w-full rounded-xl bg-brand py-3 font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {enviando ? "Enviando prova…" : "Registrar com prova"}
            </button>
            <p className="mt-3 text-center text-[11px] text-faint">
              Sem prova não há progresso — é o que mantém o Rise honesto.
            </p>
          </div>
        </div>
      )}

      {/* Boas-vindas (onboarding leve, 1x) */}
      {mostrarWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 px-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-titulo"
            className="animate-pop-in w-full max-w-md rounded-[28px] border border-line bg-surface-2 p-8"
          >
            <RiseMark size={44} />
            <h2
              id="welcome-titulo"
              className="font-display mt-5 text-2xl font-semibold tracking-tight text-snow"
            >
              Bem-vindo ao Rise, {displayName}.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Aqui toda ação positiva vira progresso real — com uma regra: tem
              que provar.
            </p>
            <ol className="mt-5 space-y-3">
              {[
                "Escolha uma Área da Vida e registre o que você fez hoje.",
                "Prove: escreva uma nota ou anexe uma foto.",
                "Ganhe XP, suba de nível e volte amanhã.",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-display tnum mt-0.5 text-sm font-semibold text-brand">
                    0{i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-snow">{t}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => {
                encerrarWelcome();
                abrirModal(null);
              }}
              className="mt-6 w-full rounded-xl bg-brand py-3 font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Registrar minha primeira ação
            </button>
            <button
              type="button"
              onClick={encerrarWelcome}
              className="mt-2 w-full text-center text-xs text-muted transition-colors hover:text-snow"
            >
              Explorar primeiro
            </button>
          </div>
        </div>
      )}

      {/* Celebração de level-up (autoritativa: vem do servidor) */}
      {cel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-sm"
          onClick={() => setCel(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Subiu de nível em ${cel.nome}: nível ${cel.nivel}`}
            className="animate-pop-in flex flex-col items-center gap-4 rounded-[28px] border border-line bg-surface-2 px-12 py-10 text-center"
          >
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
