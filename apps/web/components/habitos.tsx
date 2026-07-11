"use client";

import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc/react";
import { uuidDeterministico, dataLocalHoje } from "@/lib/uuid";
import { cssColor } from "./area-card";
import { CheckIcon, PlusIcon, XIcon } from "./icons";

const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

/**
 * Hábitos — checklist diário que alimenta o MESMO loop de Ação/XP. Marcar um
 * hábito registra uma Ação (kind habit_check) com clientActionId determinístico
 * por (hábito, dia): clicar duas vezes não duplica XP. Sem desmarcar (o ledger
 * é imutável — marcar é uma ação real).
 */
export function Habitos() {
  const utils = trpc.useUtils();
  const hoje = trpc.habit.hoje.useQuery();
  const [criando, setCriando] = useState(false);
  const [marcando, setMarcando] = useState<string | null>(null);

  const log = trpc.action.log.useMutation({
    onSettled: () => {
      setMarcando(null);
      void utils.habit.hoje.invalidate();
      void utils.progress.me.invalidate();
      void utils.progress.diario.invalidate();
      void utils.mission.today.invalidate();
      void utils.coach.checkin.invalidate();
    },
  });

  async function marcar(h: {
    id: string;
    title: string;
    lifeAreaId: string;
  }) {
    if (marcando) return;
    setMarcando(h.id);
    const actionId = await uuidDeterministico(`habit:${h.id}:${dataLocalHoje()}`);
    log.mutate({
      lifeAreaId: h.lifeAreaId,
      clientActionId: actionId,
      kind: "habit_check",
      note: `Hábito: ${h.title}.`,
      payload: { habitId: h.id },
    });
  }

  if (!hoje.data) {
    return <div className="mt-10 h-32 animate-pulse rounded-[20px] bg-surface" />;
  }
  const lista = hoje.data.habitos;
  const feitos = lista.filter((h) => h.feitoHoje).length;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
            Hábitos de hoje
          </h2>
          {lista.length > 0 && (
            <span className="tnum text-xs text-muted">
              {feitos}/{lista.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCriando((v) => !v)}
          aria-expanded={criando}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand hover:text-snow"
        >
          {criando ? <XIcon size={13} /> : <PlusIcon size={14} />}
          {criando ? "Fechar" : "Gerenciar"}
        </button>
      </div>

      {criando && <GerenciarHabitos onChange={() => void utils.habit.hoje.invalidate()} />}

      {lista.length === 0 && !criando ? (
        <p className="rounded-[20px] border border-dashed border-line bg-surface p-6 text-sm leading-relaxed text-muted">
          Crie rotinas que se repetem — “beber água”, “ler 10 min”, “alongar”. Cada
          check vira XP na Área, e a repetição constrói suas sequências.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {lista.map((h) => {
            const cor = cssColor(h.areaCor);
            const ocupado = marcando === h.id;
            return (
              <button
                key={h.id}
                type="button"
                disabled={h.feitoHoje || ocupado}
                onClick={() => void marcar(h)}
                className={`flex items-center gap-3 rounded-[var(--radius-card)] border p-4 text-left transition-colors disabled:cursor-default ${
                  h.feitoHoje
                    ? "border-brand/40 bg-brand/[0.06]"
                    : "border-line bg-surface hover:border-brand/50"
                }`}
              >
                <span
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    h.feitoHoje ? "border-transparent text-void" : "border-line text-transparent"
                  }`}
                  style={h.feitoHoje ? { background: cor } : undefined}
                >
                  <CheckIcon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      h.feitoHoje ? "text-muted line-through" : "text-snow"
                    }`}
                  >
                    {h.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-faint">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: cor }} />
                    {h.areaNome}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function GerenciarHabitos({ onChange }: { onChange: () => void }) {
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const list = trpc.habit.list.useQuery();
  const areas = me.data?.areas ?? [];

  const [areaId, setAreaId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [dias, setDias] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const invalidar = () => {
    void utils.habit.list.invalidate();
    onChange();
  };
  const criar = trpc.habit.criar.useMutation({
    onSuccess: () => {
      setTitle("");
      setDias([]);
      setErro(null);
      invalidar();
    },
    onError: (e) => setErro(e.message),
  });
  const remover = trpc.habit.remover.useMutation({ onSettled: invalidar });

  const areaEfetiva = areaId || areas[0]?.id || "";

  function submit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!areaEfetiva) return setErro("Escolha a Área da Vida.");
    if (title.trim().length < 2) return setErro("Dê um nome ao hábito.");
    criar.mutate({
      lifeAreaId: areaEfetiva,
      title: title.trim(),
      dias: dias.length === 7 ? [] : dias,
    });
  }

  return (
    <div className="mb-4 rounded-[20px] border border-line bg-surface-2 p-5">
      <form onSubmit={submit}>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => {
            const ativo = a.id === areaEfetiva;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAreaId(a.id)}
                aria-pressed={ativo}
                className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                  ativo ? "border-brand bg-brand/10 text-snow" : "border-line bg-surface text-muted hover:text-snow"
                }`}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: cssColor(a.cor) }} />
                {a.nome}
              </button>
            );
          })}
        </div>
        <input
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Novo hábito. Ex.: Beber 2L de água"
          className="mt-3 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-brand"
        />
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] font-medium text-faint">Dias:</span>
          {DIAS.map((d, i) => {
            const ativo = dias.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={ativo}
                aria-label={`Dia ${d}`}
                onClick={() =>
                  setDias((prev) =>
                    prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                  )
                }
                className={`inline-flex size-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                  ativo ? "border-brand bg-brand/10 text-snow" : "border-line bg-surface text-muted"
                }`}
              >
                {d}
              </button>
            );
          })}
          <span className="text-[11px] text-faint">
            {dias.length === 0 ? "todo dia" : ""}
          </span>
        </div>
        {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
        <button
          type="submit"
          disabled={criar.isPending}
          className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {criar.isPending ? "Criando…" : "Adicionar hábito"}
        </button>
      </form>

      {(list.data?.length ?? 0) > 0 && (
        <ul className="mt-5 space-y-2 border-t border-line pt-4">
          {list.data!.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-snow">
                <span className="size-2 rounded-full" style={{ backgroundColor: cssColor(h.areaCor) }} />
                {h.title}
                <span className="text-xs text-faint">
                  {h.dias.length === 0 || h.dias.length === 7
                    ? "todo dia"
                    : h.dias.map((d) => DIAS[d]).join(" ")}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Remover ${h.title}`}
                onClick={() => remover.mutate({ habitId: h.id })}
                className="text-faint transition-colors hover:text-red-400"
              >
                <XIcon size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
