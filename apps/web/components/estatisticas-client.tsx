"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";
import { SparklesIcon, LockIcon } from "./icons";

const nf = new Intl.NumberFormat("pt-BR");
const DOW_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];
const DOW_LONGO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function horas(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function EstatisticasClient() {
  const acesso = trpc.stats.acesso.useQuery();
  const dados = trpc.stats.avancado.useQuery(undefined, {
    enabled: acesso.data?.isPremium === true,
  });

  if (!acesso.data) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-surface-2" />;
  }

  if (!acesso.data.isPremium) {
    return (
      <div className="rounded-[24px] border border-line bg-surface-2 p-8 text-center">
        <SparklesIcon size={22} className="mx-auto text-brand" />
        <h2 className="font-display mt-3 text-xl font-semibold text-snow">
          Estatísticas profundas
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Tendência de 30 dias, melhor dia da semana, sua janela de foco ideal,
          consistência e distribuição por Área. Clareza para decidir onde investir
          sua energia — sem trocar nada da progressão gratuita.
        </p>
        <Link
          href="/rise-plus"
          className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-brand px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <LockIcon size={14} /> Desbloquear com o Rise+
        </Link>
      </div>
    );
  }

  if (!dados.data) {
    return <div className="h-96 animate-pulse rounded-[24px] bg-surface-2" />;
  }
  const d = dados.data;
  const maxXp = Math.max(1, ...d.serieXp30d.map((x) => x.xp));
  const maxDow = Math.max(1, ...d.distribuicaoDiaSemana);
  const maxHora = Math.max(1, ...d.focoPorHora);
  const maxArea = Math.max(1, ...d.xpPorArea.map((a) => a.xp));

  return (
    <div className="space-y-6">
      {/* Números-chave */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi valor={`${d.consistenciaPct}%`} rotulo="Consistência (30d)" destaque />
        <Kpi valor={String(d.diasAtivos30d)} rotulo="Dias ativos (30d)" />
        <Kpi valor={nf.format(d.xpTotal30d)} rotulo="XP (30d)" />
        <Kpi valor={horas(d.focoTotalMin)} rotulo="Foco (90d)" />
      </div>

      {/* Tendência XP 30 dias */}
      <Card titulo="Tendência de XP — 30 dias">
        <div className="flex h-28 items-end gap-[3px]">
          {d.serieXp30d.map((x) => (
            <div
              key={x.dia}
              className="flex-1 rounded-t bg-brand/70 transition-all"
              style={{ height: `${Math.max(2, (x.xp / maxXp) * 100)}%` }}
              title={`${x.dia}: ${x.xp} XP`}
            />
          ))}
        </div>
      </Card>

      {/* Melhor dia da semana */}
      <Card
        titulo="Melhor dia da semana"
        legenda={d.melhorDia !== null ? DOW_LONGO[d.melhorDia] : "—"}
      >
        <div className="flex items-end gap-2">
          {d.distribuicaoDiaSemana.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t transition-all ${
                    i === d.melhorDia ? "bg-brand" : "bg-surface"
                  }`}
                  style={{ height: `${Math.max(3, (n / maxDow) * 100)}%` }}
                />
              </div>
              <span className={`text-[11px] font-medium ${i === d.melhorDia ? "text-brand" : "text-faint"}`}>
                {DOW_CURTO[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Janela de foco */}
      <Card
        titulo="Sua janela de foco"
        legenda={d.melhorHora !== null ? `Pico às ${d.melhorHora}h` : "sem sessões ainda"}
      >
        <div className="flex h-24 items-end gap-[2px]">
          {d.focoPorHora.map((m, h) => (
            <div
              key={h}
              className={`flex-1 rounded-t transition-all ${h === d.melhorHora ? "bg-brand" : "bg-surface"}`}
              style={{ height: `${Math.max(2, (m / maxHora) * 100)}%` }}
              title={`${h}h: ${m} min`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-faint">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>23h</span>
        </div>
      </Card>

      {/* Distribuição por Área */}
      <Card titulo="XP por Área — 30 dias">
        {d.xpPorArea.length === 0 ? (
          <p className="text-sm text-muted">Sem XP nos últimos 30 dias.</p>
        ) : (
          <div className="space-y-2.5">
            {d.xpPorArea.map((a) => {
              const cor = cssColor(a.cor);
              return (
                <div key={a.nome} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs text-muted">{a.nome}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-graphite">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(a.xp / maxArea) * 100}%`, background: cor }}
                    />
                  </div>
                  <span className="tnum w-12 shrink-0 text-right text-xs font-medium text-snow">
                    {nf.format(a.xp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
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

function Card({
  titulo,
  legenda,
  children,
}: {
  titulo: string;
  legenda?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-line bg-surface-2 p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          {titulo}
        </h2>
        {legenda && <span className="text-xs font-medium text-brand">{legenda}</span>}
      </div>
      {children}
    </section>
  );
}
