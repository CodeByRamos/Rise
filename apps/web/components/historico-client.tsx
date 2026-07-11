"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { dataLocalHoje } from "@/lib/uuid";
import { cssColor } from "./area-card";
import { ChevronUpIcon, CameraIcon } from "./icons";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];

function intensidade(n: number): { bg: string; texto: string } {
  if (n === 0) return { bg: "var(--color-surface)", texto: "text-faint" };
  if (n <= 2) return { bg: "color-mix(in srgb, var(--color-brand) 22%, transparent)", texto: "text-snow" };
  if (n <= 4) return { bg: "color-mix(in srgb, var(--color-brand) 45%, transparent)", texto: "text-snow" };
  return { bg: "color-mix(in srgb, var(--color-brand) 78%, transparent)", texto: "text-void" };
}

const hf = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Histórico: calendário mensal de atividade + provas do dia selecionado. */
export function HistoricoClient() {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth() + 1); // 1-12
  const [diaSel, setDiaSel] = useState<string | null>(dataLocalHoje());

  const cal = trpc.progress.calendario.useQuery({ ano, mes });
  const detalhe = trpc.progress.diaDetalhe.useQuery(
    { data: diaSel ?? "" },
    { enabled: !!diaSel },
  );

  const porDia = new Map((cal.data?.dias ?? []).map((d) => [d.dia, d.n]));
  const hoje = dataLocalHoje();
  const noFuturo =
    ano > agora.getFullYear() ||
    (ano === agora.getFullYear() && mes >= agora.getMonth() + 1);

  const diasNoMes = new Date(ano, mes, 0).getDate();
  const primeiroDow = new Date(ano, mes - 1, 1).getDay();
  const celulas: (number | null)[] = [
    ...Array.from({ length: primeiroDow }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  function navegar(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m < 1) { m = 12; a -= 1; }
    if (m > 12) { m = 1; a += 1; }
    setMes(m);
    setAno(a);
  }

  const totalMes = (cal.data?.dias ?? []).reduce((s, d) => s + d.n, 0);
  const diasAtivos = (cal.data?.dias ?? []).filter((d) => d.n > 0).length;

  return (
    <div className="space-y-6">
      {/* Calendário */}
      <div className="rounded-[24px] border border-line bg-surface-2 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => navegar(-1)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-snow"
          >
            <ChevronUpIcon size={16} className="-rotate-90" />
          </button>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-snow">
              {MESES[mes - 1]} {ano}
            </p>
            <p className="tnum text-xs text-faint">
              {diasAtivos} dias ativos · {totalMes} ações
            </p>
          </div>
          <button
            type="button"
            aria-label="Próximo mês"
            disabled={noFuturo}
            onClick={() => navegar(1)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-snow disabled:opacity-30"
          >
            <ChevronUpIcon size={16} className="rotate-90" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5 text-center">
          {DOW.map((d, i) => (
            <span key={i} className="text-[11px] font-semibold text-faint">
              {d}
            </span>
          ))}
          {celulas.map((dia, i) => {
            if (dia === null) return <span key={`b${i}`} />;
            const iso = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const n = porDia.get(iso) ?? 0;
            const cor = intensidade(n);
            const ehHoje = iso === hoje;
            const sel = iso === diaSel;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDiaSel(iso)}
                aria-label={`${dia} — ${n} ${n === 1 ? "ação" : "ações"}`}
                aria-pressed={sel}
                className={`tnum relative aspect-square rounded-xl text-xs font-medium transition-transform hover:scale-[1.06] ${cor.texto} ${
                  sel ? "ring-2 ring-brand" : ehHoje ? "ring-1 ring-line" : ""
                }`}
                style={{ background: cor.bg }}
              >
                {dia}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provas do dia */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          {diaSel
            ? new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })
            : "Selecione um dia"}
        </h2>
        <div className="mt-4">
          {!diaSel ? null : detalhe.isLoading ? (
            <div className="h-24 animate-pulse rounded-[20px] bg-surface" />
          ) : (detalhe.data?.length ?? 0) === 0 ? (
            <p className="rounded-[20px] border border-dashed border-line bg-surface p-6 text-sm text-muted">
              Nenhuma ação registrada neste dia.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {detalhe.data!.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
                >
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cssColor(a.areaCor) }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-snow">
                        {a.areaNome}
                      </span>
                      <span className="tnum shrink-0 text-[11px] text-faint">
                        {hf.format(new Date(a.createdAt))}
                        {a.xp ? ` · +${a.xp} XP` : ""}
                      </span>
                    </div>
                    {a.note && (
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {a.note}
                      </p>
                    )}
                    {a.photoPath && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-faint">
                        <CameraIcon size={12} /> foto anexada
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
