"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { Avatar } from "./avatar";
import { BellIcon } from "./icons";

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

function frase(type: string, marcoType: string | null, payload: unknown): string {
  if (type === "follow") return "começou a seguir você";
  if (type === "reaction") {
    const p = (payload ?? {}) as Record<string, unknown>;
    if (marcoType === "level.up") return `deu Força ao seu nível ${p.toLevel} em ${p.area}`;
    if (marcoType === "achievement") return `deu Força à sua conquista "${p.nome}"`;
    if (marcoType === "streak.milestone") return `deu Força à sua sequência de ${p.days} dias`;
    return "deu Força a um marco seu";
  }
  return "interagiu com você";
}

export function NotificacoesClient() {
  const utils = trpc.useUtils();
  const lista = trpc.notification.list.useQuery();
  const markStarted = useRef(false);
  const markAll = trpc.notification.markAllRead.useMutation({
    onSettled: () => void utils.notification.unreadCount.invalidate(),
  });

  // Ao abrir a página, marca tudo como lido.
  useEffect(() => {
    if (lista.data && !markStarted.current) {
      markStarted.current = true;
      markAll.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista.data]);

  if (!lista.data) {
    return <div className="h-72 animate-pulse rounded-[20px] bg-surface" />;
  }
  if (lista.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-line bg-surface px-6 py-12 text-center">
        <BellIcon size={32} className="text-faint" />
        <p className="max-w-sm text-sm text-muted">
          Nada por aqui ainda. Quando alguém te seguir ou der Força a um marco
          seu, aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {lista.data.map((n) => (
        <li
          key={n.id}
          className={`flex items-center gap-4 rounded-[var(--radius-card)] border p-4 ${
            n.readAt ? "border-line bg-surface" : "border-brand/40 bg-brand/5"
          }`}
        >
          <Avatar
            nome={n.actorName}
            avatarPath={n.actorAvatar}
            frameColors={(n.actorFrame as { colors?: string[] } | null)?.colors}
            size={40}
          />
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-snow">
            <span className="font-semibold">{n.actorName}</span>{" "}
            <span className="text-muted">
              {frase(n.type, n.marcoType, n.marcoPayload)}
            </span>
            <span className="ml-1.5 text-xs text-faint">
              · {tempoRelativo(n.createdAt)}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}
