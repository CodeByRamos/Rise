"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";
import { SparkIcon, CheckIcon } from "./icons";

const nf = new Intl.NumberFormat("pt-BR");

function horas(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/**
 * Planejamento da semana — centro de comando que reúne intenção, missões
 * semanais, metas, foco e consistência num só lugar. Integra os sistemas
 * existentes (nada isolado); a intenção é uma nota livre persistida.
 */
export function PlanejarClient() {
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const missoes = trpc.mission.today.useQuery();
  const metas = trpc.goal.list.useQuery();
  const foco = trpc.action.focoResumo.useQuery();
  const habitos = trpc.habit.hoje.useQuery();

  const [intencao, setIntencao] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const setInt = trpc.progress.setIntencao.useMutation({
    onSuccess: () => {
      setSalvo(true);
      window.setTimeout(() => setSalvo(false), 1800);
      void utils.progress.me.invalidate();
    },
  });

  useEffect(() => {
    if (me.data && intencao === null) setIntencao(me.data.intencaoSemana ?? "");
  }, [me.data, intencao]);

  if (!me.data) {
    return <div className="h-96 animate-pulse rounded-[24px] bg-surface-2" />;
  }

  const semanais = (missoes.data ?? []).filter((m) => m.scope === "weekly");
  const metasAtivas = (metas.data ?? []).filter((g) => g.status === "active");
  const habitosHoje = habitos.data?.habitos ?? [];
  const habitosFeitos = habitosHoje.filter((h) => h.feitoHoje).length;
  const focoMin = foco.data?.minutosSemana ?? 0;
  const focoSessoes = foco.data?.sessoesSemana ?? 0;

  return (
    <div className="space-y-6">
      {/* Intenção da semana */}
      <section className="rounded-[24px] border border-line bg-surface-2 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
            Intenção da semana
          </h2>
          {salvo && <span className="text-xs font-medium text-brand">Salvo</span>}
        </div>
        <textarea
          value={intencao ?? ""}
          onChange={(e) => setIntencao(e.target.value)}
          onBlur={() => {
            if ((intencao ?? "") !== (me.data?.intencaoSemana ?? "")) {
              setInt.mutate({ texto: intencao ?? "" });
            }
          }}
          rows={2}
          maxLength={200}
          placeholder="Qual é o foco desta semana? Ex.: terminar o projeto X e treinar 4×."
          className="mt-3 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-brand"
        />
      </section>

      {/* Pulso da semana */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi valor={`${me.data.streakDias}`} rotulo="Sequência (dias)" destaque />
        <Kpi valor={horas(focoMin)} rotulo="Foco (7d)" />
        <Kpi valor={`${focoSessoes}`} rotulo="Sessões (7d)" />
        <Kpi valor={`${habitosFeitos}/${habitosHoje.length}`} rotulo="Hábitos hoje" />
      </div>

      {/* Missões da semana */}
      <Bloco titulo="Missões da semana" vazio={semanais.length === 0 ? "Volte à Home para gerar as missões." : null}>
        <div className="space-y-2.5">
          {semanais.map((m) => {
            const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
            return (
              <div key={m.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-snow">{m.titulo}</p>
                  {m.completa && <CheckIcon size={15} className="shrink-0 text-brand" />}
                </div>
                <div className="tnum mt-1.5 flex items-center justify-between text-xs text-muted">
                  <span>{Math.min(m.progress, m.target)}/{m.target}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand">
                    +{m.xpReward} XP · +{m.sparksReward}
                    <SparkIcon size={10} />
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-graphite">
                  <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Bloco>

      {/* Metas */}
      <Bloco
        titulo="Metas em andamento"
        acao={<Link href="/evolucao" className="text-xs font-medium text-brand hover:underline">gerenciar</Link>}
        vazio={metasAtivas.length === 0 ? "Defina uma meta na Evolução para dar direção à semana." : null}
      >
        <div className="space-y-2.5">
          {metasAtivas.map((g) => {
            const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
            const cor = cssColor(g.areaCor);
            return (
              <div key={g.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-snow">
                    <span className="size-2 rounded-full" style={{ backgroundColor: cor }} />
                    {g.title}
                  </p>
                  <span className="tnum text-xs text-muted">
                    {nf.format(g.currentValue)}/{nf.format(g.targetValue)}
                    {g.unit ? ` ${g.unit}` : ""}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-graphite">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: cor }} />
                </div>
              </div>
            );
          })}
        </div>
      </Bloco>

      {/* Hábitos de hoje */}
      <Bloco
        titulo="Hábitos de hoje"
        acao={<Link href="/" className="text-xs font-medium text-brand hover:underline">marcar na Home</Link>}
        vazio={habitosHoje.length === 0 ? "Crie hábitos na Home para construir consistência." : null}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {habitosHoje.map((h) => (
            <div
              key={h.id}
              className={`flex items-center gap-2.5 rounded-[var(--radius-card)] border p-3 ${
                h.feitoHoje ? "border-brand/40 bg-brand/[0.06]" : "border-line bg-surface"
              }`}
            >
              <span
                className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full ${h.feitoHoje ? "text-void" : "text-transparent"}`}
                style={h.feitoHoje ? { background: cssColor(h.areaCor) } : { border: "1px solid var(--color-line)" }}
              >
                <CheckIcon size={13} />
              </span>
              <span className={`truncate text-sm ${h.feitoHoje ? "text-muted line-through" : "text-snow"}`}>
                {h.title}
              </span>
            </div>
          ))}
        </div>
      </Bloco>
    </div>
  );
}

function Kpi({ valor, rotulo, destaque = false }: { valor: string; rotulo: string; destaque?: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className={`font-display tnum text-2xl font-semibold leading-none ${destaque ? "text-brand" : "text-snow"}`}>
        {valor}
      </div>
      <div className="mt-1.5 text-xs text-muted">{rotulo}</div>
    </div>
  );
}

function Bloco({
  titulo,
  children,
  acao,
  vazio,
}: {
  titulo: string;
  children: React.ReactNode;
  acao?: React.ReactNode;
  vazio?: string | null;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">{titulo}</h2>
        {acao}
      </div>
      {vazio ? (
        <p className="rounded-[20px] border border-dashed border-line bg-surface p-5 text-sm text-muted">
          {vazio}
        </p>
      ) : (
        children
      )}
    </section>
  );
}
