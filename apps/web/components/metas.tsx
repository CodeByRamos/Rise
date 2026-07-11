"use client";

import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";
import { CheckIcon, PlusIcon, XIcon } from "./icons";

const nf = new Intl.NumberFormat("pt-BR");
const df = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/**
 * Metas — alvos declarados por Área da Vida (doc 10). Camada de intenção: dá
 * direção ("para onde subir") sem conceder XP/Faíscas. Progresso é acompanhado
 * à mão; XP de verdade vem só de Ações com prova.
 */
export function Metas() {
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const metas = trpc.goal.list.useQuery();
  const [criando, setCriando] = useState(false);

  const invalidar = () => void utils.goal.list.invalidate();
  const ajustar = trpc.goal.ajustar.useMutation({ onSettled: invalidar });
  const remover = trpc.goal.remover.useMutation({ onSettled: invalidar });

  if (!metas.data) {
    return <div className="mt-8 h-32 animate-pulse rounded-[20px] bg-surface" />;
  }
  const areas = me.data?.areas ?? [];
  const lista = metas.data;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-snow">Metas</h2>
        {areas.length > 0 && (
          <button
            type="button"
            onClick={() => setCriando((v) => !v)}
            aria-expanded={criando}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand hover:text-snow"
          >
            {criando ? <XIcon size={13} /> : <PlusIcon size={14} />}
            {criando ? "Fechar" : "Nova meta"}
          </button>
        )}
      </div>

      {criando && (
        <NovaMetaForm
          areas={areas}
          onDone={() => {
            setCriando(false);
            invalidar();
          }}
        />
      )}

      {lista.length === 0 && !criando ? (
        <p className="rounded-[20px] border border-dashed border-line bg-surface p-6 text-sm leading-relaxed text-muted">
          Declare para onde você quer subir. Uma meta dá direção — “ler 12 livros”,
          “correr 100 km” — e o Rise acompanha o progresso. Sem XP fácil: o
          progresso real continua vindo das suas ações com prova.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((g) => {
            const cor = cssColor(g.areaCor);
            const pct =
              g.targetValue > 0
                ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                : 0;
            const concluida = g.status === "completed";
            const ocupado = ajustar.isPending || remover.isPending;
            return (
              <li
                key={g.id}
                className={`rounded-[var(--radius-card)] border p-4 ${
                  concluida
                    ? "border-brand/40 bg-brand/[0.06]"
                    : "border-line bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-snow">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: cor }}
                      />
                      <span className="truncate">{g.title}</span>
                      {concluida && (
                        <CheckIcon size={15} className="shrink-0 text-brand" />
                      )}
                    </p>
                    <p className="mt-1 text-xs text-faint">
                      {g.areaNome}
                      {g.dueAt && !concluida && (
                        <> · até {df.format(new Date(g.dueAt))}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remover meta"
                    disabled={ocupado}
                    onClick={() => remover.mutate({ goalId: g.id })}
                    className="shrink-0 text-faint transition-colors hover:text-red-400 disabled:opacity-50"
                  >
                    <XIcon size={15} />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-graphite">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: cor }}
                    />
                  </div>
                  <span className="tnum shrink-0 text-xs font-medium text-muted">
                    {nf.format(g.currentValue)}/{nf.format(g.targetValue)}
                    {g.unit ? ` ${g.unit}` : ""}
                  </span>
                </div>

                {!concluida && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={ocupado || g.currentValue <= 0}
                      onClick={() => ajustar.mutate({ goalId: g.id, delta: -1 })}
                      aria-label="Diminuir progresso"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-snow disabled:opacity-40"
                    >
                      <span aria-hidden className="text-base leading-none">−</span>
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => ajustar.mutate({ goalId: g.id, delta: 1 })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-snow transition-colors hover:border-brand disabled:opacity-50"
                    >
                      <PlusIcon size={13} /> Registrar avanço
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NovaMetaForm({
  areas,
  onDone,
}: {
  areas: { id: string; nome: string; cor: string }[];
  onDone: () => void;
}) {
  const [areaId, setAreaId] = useState<string>(areas[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [prazo, setPrazo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const criar = trpc.goal.criar.useMutation({
    onSuccess: () => onDone(),
    onError: (e) => setErro(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    const alvo = Number(target.replace(",", "."));
    if (!areaId) return setErro("Escolha a Área da Vida.");
    if (title.trim().length < 3) return setErro("Dê um nome claro à meta.");
    if (!Number.isFinite(alvo) || alvo <= 0)
      return setErro("O alvo precisa ser um número maior que zero.");
    criar.mutate({
      lifeAreaId: areaId,
      title: title.trim(),
      targetValue: alvo,
      unit: unit.trim() || undefined,
      dueAt: prazo ? new Date(prazo + "T12:00:00") : undefined,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mb-4 rounded-[20px] border border-line bg-surface-2 p-5"
    >
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => {
          const ativo = a.id === areaId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAreaId(a.id)}
              aria-pressed={ativo}
              className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                ativo
                  ? "border-brand bg-brand/10 text-snow"
                  : "border-line bg-surface text-muted hover:text-snow"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: cssColor(a.cor) }}
              />
              {a.nome}
            </button>
          );
        })}
      </div>

      <input
        value={title}
        maxLength={80}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="O que você quer alcançar? Ex.: Ler 12 livros"
        className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-brand"
      />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-[11px] font-medium text-faint" htmlFor="meta-alvo">
            Alvo
          </label>
          <input
            id="meta-alvo"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="12"
            className="tnum mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-snow outline-none transition-colors focus:border-brand"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-faint" htmlFor="meta-unidade">
            Unidade
          </label>
          <input
            id="meta-unidade"
            value={unit}
            maxLength={20}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="livros"
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-snow outline-none transition-colors focus:border-brand"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[11px] font-medium text-faint" htmlFor="meta-prazo">
            Prazo (opcional)
          </label>
          <input
            id="meta-prazo"
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="tnum mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-snow outline-none transition-colors focus:border-brand"
          />
        </div>
      </div>

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

      <button
        type="submit"
        disabled={criar.isPending}
        className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {criar.isPending ? "Criando…" : "Criar meta"}
      </button>
    </form>
  );
}
