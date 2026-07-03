"use client";

import { trpc } from "@/lib/trpc/react";
import { Avatar } from "./avatar";
import { RiseMark } from "./rise-mark";

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
  if (type === "level.up") {
    return `subiu para o nível ${payload.toLevel} em ${payload.area}`;
  }
  if (type === "streak.milestone") {
    return `alcançou ${payload.days} dias de sequência`;
  }
  if (type === "missions.day") {
    return `completou todas as missões do dia`;
  }
  return "registrou um marco de evolução";
}

export function FeedClient() {
  const feed = trpc.feed.list.useQuery();

  if (!feed.data) {
    return <div className="h-72 animate-pulse rounded-[20px] bg-surface" />;
  }

  if (feed.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-line bg-surface px-6 py-12 text-center">
        <RiseMark size={36} variant="mono" className="text-faint" />
        <p className="max-w-sm text-sm text-muted">
          O feed mostra marcos de progresso da comunidade: níveis alcançados,
          sequências e dias completos. Suba de nível para inaugurar o seu.
        </p>
      </div>
    );
  }

  return (
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
        </li>
      ))}
    </ol>
  );
}
