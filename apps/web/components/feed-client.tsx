"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { RiseMark } from "./rise-mark";
import { MarcoCard, type MarcoItem } from "./marco-card";

type Escopo = "global" | "seguindo";

export function FeedClient() {
  const utils = trpc.useUtils();
  const [escopo, setEscopo] = useState<Escopo>("global");
  const input = { escopo };
  const feed = trpc.feed.list.useQuery(input);

  const react = trpc.feed.react.useMutation({
    onMutate: async (vars) => {
      await utils.feed.list.cancel(input);
      const prev = utils.feed.list.getData(input);
      if (prev) {
        utils.feed.list.setData(
          input,
          prev.map((i) =>
            i.id === vars.feedItemId
              ? { ...i, deiForca: !i.deiForca, forcas: i.forcas + (i.deiForca ? -1 : 1) }
              : i,
          ),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx2) => {
      if (ctx2?.prev) utils.feed.list.setData(input, ctx2.prev);
    },
    onSettled: () => void utils.feed.list.invalidate(),
  });

  return (
    <div>
      {/* Toggle de escopo */}
      <div className="mx-auto mb-5 flex max-w-md rounded-[var(--radius-pill)] border border-line bg-surface p-1">
        {(["global", "seguindo"] as const).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEscopo(e)}
            className={`flex-1 rounded-[var(--radius-pill)] px-4 py-1.5 text-xs font-semibold transition-colors ${
              escopo === e ? "bg-surface-2 text-snow" : "text-muted hover:text-snow"
            }`}
          >
            {e === "global" ? "Comunidade" : "Seguindo"}
          </button>
        ))}
      </div>

      {!feed.data ? (
        <div className="mx-auto h-[420px] max-w-md animate-pulse rounded-[24px] bg-surface" />
      ) : feed.data.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[24px] border border-dashed border-line bg-surface px-6 py-12 text-center">
          <RiseMark size={36} variant="mono" className="text-faint" />
          <p className="max-w-sm text-sm text-muted">
            {escopo === "seguindo"
              ? "Você ainda não segue ninguém. Visite o perfil de alguém e siga para ver os marcos aqui."
              : "O feed mostra marcos de progresso da comunidade: níveis, sequências e conquistas. Suba de nível para inaugurar o seu."}
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-md space-y-5">
          {feed.data.map((item) => (
            <MarcoCard
              key={item.id}
              item={
                {
                  ...item,
                  payload: item.payload as Record<string, unknown>,
                } as MarcoItem
              }
              onForca={() => react.mutate({ feedItemId: item.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
