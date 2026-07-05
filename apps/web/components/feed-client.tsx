"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Avatar } from "./avatar";
import { RiseMark } from "./rise-mark";
import { ChevronUpIcon } from "./icons";

type Escopo = "global" | "seguindo";

function tempoRelativo(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const min = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fraseDoMarco(type: string, payload: Record<string, unknown>): string {
  if (type === "level.up") return `subiu para o nível ${payload.toLevel} em ${payload.area}`;
  if (type === "streak.milestone") return `alcançou ${payload.days} dias de sequência`;
  if (type === "missions.day") return `completou todas as missões do dia`;
  if (type === "achievement") return `desbloqueou a conquista "${payload.nome}"`;
  return "registrou um marco de evolução";
}

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
      <div className="mb-5 inline-flex rounded-[var(--radius-pill)] border border-line bg-surface p-1">
        {(["global", "seguindo"] as const).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEscopo(e)}
            className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-xs font-semibold transition-colors ${
              escopo === e ? "bg-surface-2 text-snow" : "text-muted hover:text-snow"
            }`}
          >
            {e === "global" ? "Comunidade" : "Seguindo"}
          </button>
        ))}
      </div>

      {!feed.data ? (
        <div className="h-72 animate-pulse rounded-[20px] bg-surface" />
      ) : feed.data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-line bg-surface px-6 py-12 text-center">
          <RiseMark size={36} variant="mono" className="text-faint" />
          <p className="max-w-sm text-sm text-muted">
            {escopo === "seguindo"
              ? "Você ainda não segue ninguém. Visite o perfil público de alguém e siga para ver os marcos aqui."
              : "O feed mostra marcos de progresso da comunidade: níveis, sequências e conquistas. Suba de nível para inaugurar o seu."}
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {feed.data.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4"
            >
              <Avatar
                nome={item.displayName}
                avatarPath={item.avatarUrl}
                frameColors={(item.framePreview as { colors?: string[] } | null)?.colors}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-snow">
                  <span className="font-semibold">{item.displayName}</span>{" "}
                  <span className="text-muted">
                    {fraseDoMarco(item.type, item.payload as Record<string, unknown>)}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-faint">
                  {tempoRelativo(item.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => react.mutate({ feedItemId: item.id })}
                aria-pressed={item.deiForca}
                aria-label={item.deiForca ? "Retirar força" : "Dar força"}
                className={`tnum inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  item.deiForca
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-surface text-muted hover:text-snow"
                }`}
              >
                <ChevronUpIcon size={13} />
                {item.forcas > 0 ? item.forcas : "Força"}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
