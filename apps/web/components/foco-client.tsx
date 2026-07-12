"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";
import { RiseMark } from "./rise-mark";
import { CheckIcon, XIcon } from "./icons";

const STORE_KEY = "rise_foco_v1";

interface Preset {
  id: string;
  nome: string;
  work: number; // minutos
  pausa: number;
  desc: string;
}
const PRESETS: Preset[] = [
  { id: "pomodoro", nome: "Pomodoro", work: 25, pausa: 5, desc: "25 foco · 5 pausa" },
  { id: "deep", nome: "Deep Work", work: 50, pausa: 10, desc: "50 foco · 10 pausa" },
  { id: "sprint", nome: "Sprint", work: 90, pausa: 15, desc: "90 foco · 15 pausa" },
];

type Fase = "work" | "break";
interface Sessao {
  areaId: string;
  areaNome: string;
  areaCor: string;
  workMin: number;
  pausaMin: number;
  fase: Fase;
  /** epoch ms do fim da fase atual (quando rodando). */
  endsAt: number | null;
  /** ms restantes quando pausado (null = rodando). */
  pausadoRestante: number | null;
  /** id idempotente da ação desta sessão de trabalho. */
  actionId: string;
}

function carregar(): Sessao | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Sessao) : null;
  } catch {
    return null;
  }
}
function salvar(s: Sessao | null) {
  try {
    if (s) localStorage.setItem(STORE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORE_KEY);
  } catch {
    // sem localStorage → sessão só em memória
  }
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const seg = s % 60;
  return `${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

function notificar(titulo: string, corpo: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(titulo, { body: corpo, icon: "/icon.png" });
    }
  } catch {
    // best-effort
  }
}

export function FocoClient() {
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const resumo = trpc.action.focoResumo.useQuery();
  const log = trpc.action.log.useMutation();

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [now, setNow] = useState(() => 0);
  const [montado, setMontado] = useState(false);
  const [celebra, setCelebra] = useState<{ min: number; xp: number } | null>(null);
  const [presetSel, setPresetSel] = useState<string>("deep");
  const [areaSel, setAreaSel] = useState<string | null>(null);
  const completandoRef = useRef(false);

  // Monta: recupera sessão persistida (drift-free via endsAt).
  useEffect(() => {
    setSessao(carregar());
    setNow(Date.now());
    setMontado(true);
  }, []);

  // Tick global.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const persistir = useCallback((s: Sessao | null) => {
    setSessao(s);
    salvar(s);
  }, []);

  const restanteMs = sessao
    ? sessao.pausadoRestante != null
      ? sessao.pausadoRestante
      : sessao.endsAt != null
        ? sessao.endsAt - now
        : 0
    : 0;

  const completarTrabalho = useCallback(
    async (s: Sessao) => {
      if (completandoRef.current) return;
      completandoRef.current = true;
      const intensidade = s.workMin >= 45 ? 2 : 1;
      try {
        const res = await log.mutateAsync({
          lifeAreaId: s.areaId,
          clientActionId: s.actionId,
          kind: "focus_session",
          intensity: intensidade,
          note: `Sessão de foco: ${s.workMin} min de ${s.areaNome}.`,
          payload: { focusMinutes: s.workMin },
        });
        if (!res.deduped) {
          setCelebra({ min: s.workMin, xp: res.xpGained });
          window.setTimeout(() => setCelebra(null), 3200);
        }
        notificar("Foco concluído", `${s.workMin} min de ${s.areaNome}. +${res.deduped ? 0 : res.xpGained} XP`);
        void utils.progress.me.invalidate();
        void utils.progress.diario.invalidate();
        void utils.action.focoResumo.invalidate();
        void utils.mission.today.invalidate();
      } catch {
        // falha de rede: não perde a intenção — cai na pausa mesmo assim
      } finally {
        // Transiciona para a pausa (ou encerra se sem pausa).
        if (s.pausaMin > 0) {
          persistir({
            ...s,
            fase: "break",
            endsAt: Date.now() + s.pausaMin * 60_000,
            pausadoRestante: null,
          });
        } else {
          persistir(null);
        }
        completandoRef.current = false;
      }
    },
    [log, persistir, utils],
  );

  // Detecta fim de fase.
  useEffect(() => {
    if (!sessao || sessao.pausadoRestante != null || sessao.endsAt == null) return;
    if (restanteMs > 0) return;
    if (sessao.fase === "work") {
      // Sessão muito antiga (aba fechada por muito tempo) → descarta sem logar.
      const atraso = now - sessao.endsAt;
      if (atraso > sessao.workMin * 60_000) {
        persistir(null);
        return;
      }
      void completarTrabalho(sessao);
    } else {
      notificar("Pausa concluída", "Pronto para o próximo bloco de foco.");
      persistir(null);
    }
  }, [restanteMs, sessao, now, completarTrabalho, persistir]);

  const areas = me.data?.areas ?? [];
  const areaAtiva = areaSel ?? areas[0]?.id ?? null;
  const preset = PRESETS.find((p) => p.id === presetSel) ?? PRESETS[1]!;

  function iniciar() {
    const area = areas.find((a) => a.id === areaAtiva);
    if (!area) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    persistir({
      areaId: area.id,
      areaNome: area.nome,
      areaCor: area.cor,
      workMin: preset.work,
      pausaMin: preset.pausa,
      fase: "work",
      endsAt: Date.now() + preset.work * 60_000,
      pausadoRestante: null,
      actionId: crypto.randomUUID(),
    });
    setNow(Date.now());
  }

  function pausar() {
    if (!sessao || sessao.endsAt == null) return;
    persistir({ ...sessao, pausadoRestante: Math.max(0, sessao.endsAt - Date.now()), endsAt: null });
  }
  function retomar() {
    if (!sessao || sessao.pausadoRestante == null) return;
    persistir({ ...sessao, endsAt: Date.now() + sessao.pausadoRestante, pausadoRestante: null });
    setNow(Date.now());
  }
  function cancelar() {
    completandoRef.current = false;
    persistir(null);
  }

  if (!montado || !me.data) {
    return <div className="h-96 animate-pulse rounded-[24px] bg-surface" />;
  }

  const rodando = sessao && sessao.pausadoRestante == null;
  const totalMs = sessao
    ? (sessao.fase === "work" ? sessao.workMin : sessao.pausaMin) * 60_000
    : preset.work * 60_000;
  const fracao = sessao ? 1 - Math.max(0, Math.min(1, restanteMs / totalMs)) : 0;
  const cor = sessao
    ? sessao.fase === "break"
      ? "var(--color-brand)"
      : cssColor(sessao.areaCor)
    : "var(--color-brand)";

  return (
    <div>
      {/* Timer */}
      <div className="flex flex-col items-center rounded-[28px] border border-line bg-surface-2 p-6 sm:p-8">
        <Ring fracao={fracao} cor={cor} rotulo={sessao?.fase === "break" ? "Pausa" : "Foco"}>
          <span className="font-display tnum text-[56px] font-semibold leading-none text-snow">
            {fmt(sessao ? restanteMs : preset.work * 60_000)}
          </span>
          {sessao ? (
            <span className="mt-1 text-sm font-medium text-muted">
              {sessao.fase === "break" ? "Respire" : sessao.areaNome}
            </span>
          ) : (
            <span className="mt-1 text-sm font-medium text-muted">{preset.nome}</span>
          )}
        </Ring>

        {/* Controles */}
        {!sessao ? (
          <div className="mt-8 w-full max-w-md">
            {/* Preset */}
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetSel(p.id)}
                  aria-pressed={p.id === presetSel}
                  className={`rounded-2xl border px-3 py-3 text-center transition-colors ${
                    p.id === presetSel
                      ? "border-brand bg-brand/10 text-snow"
                      : "border-line bg-surface text-muted hover:text-snow"
                  }`}
                >
                  <span className="block text-sm font-semibold">{p.nome}</span>
                  <span className="mt-0.5 block text-[11px] text-faint">{p.desc}</span>
                </button>
              ))}
            </div>
            {/* Área */}
            {areas.length === 0 ? (
              <p className="mt-5 text-center text-sm text-muted">
                Crie uma Área da Vida para focar.
              </p>
            ) : (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {areas.map((a) => {
                  const ativo = a.id === areaAtiva;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAreaSel(a.id)}
                      aria-pressed={ativo}
                      className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                        ativo
                          ? "border-brand bg-brand/10 text-snow"
                          : "border-line bg-surface text-muted hover:text-snow"
                      }`}
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: cssColor(a.cor) }} />
                      {a.nome}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              disabled={areas.length === 0}
              onClick={iniciar}
              className="mt-6 w-full rounded-xl bg-brand py-3.5 font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              Iniciar foco
            </button>
          </div>
        ) : (
          <div className="mt-8 flex items-center gap-3">
            {rodando ? (
              <button
                type="button"
                onClick={pausar}
                className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold text-snow transition-colors hover:border-brand"
              >
                Pausar
              </button>
            ) : (
              <button
                type="button"
                onClick={retomar}
                className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Retomar
              </button>
            )}
            <button
              type="button"
              onClick={cancelar}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-red-400"
            >
              <XIcon size={14} /> Encerrar
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatFoco valor={resumo.data?.sessoesSemana ?? 0} rotulo="Sessões (7d)" />
        <StatFoco valor={horas(resumo.data?.minutosSemana ?? 0)} rotulo="Foco (7d)" destaque />
        <StatFoco valor={resumo.data?.sessoesTotal ?? 0} rotulo="Sessões totais" />
        <StatFoco valor={horas(resumo.data?.minutosTotal ?? 0)} rotulo="Foco total" />
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-faint">
        Cada sessão concluída vira uma Ação com prova — XP na Área, sem digitar nada.
      </p>

      {/* Celebração */}
      {celebra && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-5 backdrop-blur-sm"
          onClick={() => setCelebra(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Foco concluído: ${celebra.min} minutos, +${celebra.xp} XP`}
        >
          <div className="animate-pop-in flex flex-col items-center gap-3 rounded-[28px] border border-line bg-surface-2 px-12 py-10 text-center">
            <RiseMark size={52} />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Foco concluído
            </p>
            <p className="font-display tnum text-5xl font-semibold text-snow">
              {celebra.min} min
            </p>
            <p className="inline-flex items-center gap-1.5 text-sm text-muted">
              <CheckIcon size={15} className="text-brand" /> +{celebra.xp} XP registrado
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function horas(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function StatFoco({
  valor,
  rotulo,
  destaque = false,
}: {
  valor: string | number;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-center">
      <div
        className={`font-display tnum text-2xl font-semibold leading-none ${
          destaque ? "text-brand" : "text-snow"
        }`}
      >
        {valor}
      </div>
      <div className="mt-1.5 text-xs text-muted">{rotulo}</div>
    </div>
  );
}

function Ring({
  fracao,
  cor,
  rotulo,
  children,
}: {
  fracao: number;
  cor: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  const size = 260;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(fracao, 1)) * circ;
  const center = size / 2;
  return (
    <div
      className="relative aspect-square w-full"
      style={{ maxWidth: size }}
      role="img"
      aria-label={`${rotulo}: ${Math.round(fracao * 100)}% concluído`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--color-graphite)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            filter: `drop-shadow(0 0 10px color-mix(in srgb, ${cor} 45%, transparent))`,
            transition: "stroke-dasharray 0.9s linear",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
          {rotulo}
        </span>
        {children}
      </div>
    </div>
  );
}
