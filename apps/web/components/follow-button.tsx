"use client";

import Link from "next/link";
import { TRPCProvider } from "@/lib/trpc/provider";
import { trpc } from "@/lib/trpc/react";
import { ChevronUpIcon } from "./icons";

function Inner({ targetUserId }: { targetUserId: string }) {
  const utils = trpc.useUtils();
  const status = trpc.social.amFollowing.useQuery(
    { targetUserId },
    { retry: false },
  );
  const toggle = trpc.social.toggleFollow.useMutation({
    onSettled: () => void utils.social.amFollowing.invalidate({ targetUserId }),
  });

  // Não logado (query 401) → CTA de login.
  if (status.isError) {
    return (
      <Link
        href="/entrar"
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-brand px-4 py-2 text-xs font-semibold text-void"
      >
        <ChevronUpIcon size={13} />
        Seguir
      </Link>
    );
  }

  const seguindo = status.data?.seguindo ?? false;
  return (
    <button
      type="button"
      disabled={toggle.isPending || status.isLoading}
      onClick={() => toggle.mutate({ targetUserId })}
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        seguindo
          ? "border-line bg-surface text-muted hover:text-snow"
          : "border-transparent bg-brand text-void"
      }`}
    >
      {!seguindo && <ChevronUpIcon size={13} />}
      {seguindo ? "Seguindo" : "Seguir"}
    </button>
  );
}

export function FollowButton({ targetUserId }: { targetUserId: string }) {
  return (
    <TRPCProvider>
      <Inner targetUserId={targetUserId} />
    </TRPCProvider>
  );
}
