"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { SparkIcon, CheckIcon } from "./icons";
import { frameGradient } from "./avatar";

const nf = new Intl.NumberFormat("pt-BR");

export function LojaClient() {
  const utils = trpc.useUtils();
  const catalog = trpc.shop.catalog.useQuery();
  const [erro, setErro] = useState<string | null>(null);

  const buy = trpc.shop.buy.useMutation({
    onError: (e) => setErro(e.message),
    onSuccess: () => setErro(null),
    onSettled: () => {
      void utils.shop.catalog.invalidate();
      void utils.profile.get.invalidate();
      void utils.progress.me.invalidate();
    },
  });

  if (!catalog.data) {
    return <div className="h-72 animate-pulse rounded-[20px] bg-surface" />;
  }
  const { saldo, itens } = catalog.data;
  const frames = itens.filter((i) => i.kind === "frame");
  const temas = itens.filter((i) => i.kind === "theme");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-[20px] border border-line bg-surface-2 px-5 py-4">
        <p className="text-sm text-muted">
          Faíscas compram <span className="font-semibold text-snow">aparência</span>,
          nunca progresso. Ganhe completando missões.
        </p>
        <span className="tnum inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-snow">
          <SparkIcon size={14} className="text-brand" />
          {nf.format(saldo)}
        </span>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <Grupo titulo="Molduras de avatar" itens={frames} saldo={saldo} onBuy={(id) => buy.mutate({ itemId: id })} comprando={buy.isPending} />
      <Grupo titulo="Temas da interface" itens={temas} saldo={saldo} onBuy={(id) => buy.mutate({ itemId: id })} comprando={buy.isPending} />

      <p className="text-center text-[11px] text-faint">
        Preços fixos e visíveis. Sem caixas de recompensa, sem surpresas — é regra
        da casa.
      </p>
    </div>
  );
}

function Grupo({
  titulo,
  itens,
  saldo,
  onBuy,
  comprando,
}: {
  titulo: string;
  itens: {
    id: string;
    name: string;
    kind: string;
    priceSparks: number;
    preview: unknown;
    owned: boolean;
  }[];
  saldo: number;
  onBuy: (id: string) => void;
  comprando: boolean;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
        {titulo}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {itens.map((i) => {
          const prev = i.preview as { colors?: string[]; accent?: string };
          const visual =
            i.kind === "frame"
              ? frameGradient(prev.colors) ?? "var(--color-brand)"
              : (prev.accent ?? "var(--color-brand)");
          const semSaldo = !i.owned && saldo < i.priceSparks;
          return (
            <div
              key={i.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="size-9 shrink-0 rounded-full"
                  style={{ background: visual }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-snow">
                    {i.name}
                  </p>
                  <p className="tnum inline-flex items-center gap-1 text-xs text-muted">
                    {i.priceSparks}
                    <SparkIcon size={11} className="text-brand" />
                  </p>
                </div>
              </div>
              {i.owned ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                  <CheckIcon size={14} /> Seu
                </span>
              ) : (
                <button
                  type="button"
                  disabled={comprando || semSaldo}
                  onClick={() => onBuy(i.id)}
                  title={semSaldo ? "Faíscas insuficientes" : undefined}
                  className="shrink-0 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-40"
                >
                  Comprar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
