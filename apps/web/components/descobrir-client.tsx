"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { Avatar } from "./avatar";
import { ChevronUpIcon } from "./icons";

export function DescobrirClient() {
  const utils = trpc.useUtils();
  const lista = trpc.social.discover.useQuery();
  const toggle = trpc.social.toggleFollow.useMutation({
    onMutate: async (vars) => {
      await utils.social.discover.cancel();
      const prev = utils.social.discover.getData();
      if (prev) {
        utils.social.discover.setData(
          undefined,
          prev.map((u) =>
            u.userId === vars.targetUserId ? { ...u, seguindo: !u.seguindo } : u,
          ),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx2) => {
      if (ctx2?.prev) utils.social.discover.setData(undefined, ctx2.prev);
    },
    onSettled: () => void utils.social.discover.invalidate(),
  });

  if (!lista.data) {
    return <div className="h-72 animate-pulse rounded-[20px] bg-surface" />;
  }
  if (lista.data.length === 0) {
    return (
      <p className="text-sm text-muted">
        Ninguém por aqui ainda. Conforme a comunidade cresce, as pessoas
        aparecem aqui — ordenadas por Nível Rise.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {lista.data.map((u) => (
        <li
          key={u.userId}
          className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4"
        >
          <Link href={`/u/${u.handle}`} aria-label={`Perfil de ${u.displayName}`}>
            <Avatar
              nome={u.displayName}
              avatarPath={u.avatarUrl}
              frameColors={(u.framePreview as { colors?: string[] } | null)?.colors}
              size={44}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${u.handle}`}
              className="block truncate text-sm font-semibold text-snow hover:underline"
            >
              {u.displayName}
            </Link>
            <p className="tnum truncate text-xs text-muted">
              @{u.handle} · Nível Rise {u.nivelRise}
            </p>
          </div>
          <button
            type="button"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ targetUserId: u.userId })}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
              u.seguindo
                ? "border-line bg-surface text-muted hover:text-snow"
                : "border-transparent bg-brand text-void"
            }`}
          >
            {!u.seguindo && <ChevronUpIcon size={13} />}
            {u.seguindo ? "Seguindo" : "Seguir"}
          </button>
        </li>
      ))}
    </ol>
  );
}
