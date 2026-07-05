"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc/react";
import { BellIcon } from "./icons";

const LINKS = [
  { href: "/", rotulo: "Início" },
  { href: "/evolucao", rotulo: "Evolução" },
  { href: "/feed", rotulo: "Feed" },
  { href: "/ligas", rotulo: "Ligas" },
  { href: "/descobrir", rotulo: "Descobrir" },
  { href: "/loja", rotulo: "Loja" },
  { href: "/perfil", rotulo: "Perfil" },
] as const;

/** Navegação principal do app (usuário logado). */
export function AppNav() {
  const pathname = usePathname();
  const unread = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const n = unread.data ?? 0;

  return (
    <nav aria-label="Principal" className="flex flex-wrap items-center justify-end gap-1">
      {LINKS.map((l) => {
        const ativo = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-colors ${
              ativo ? "bg-surface text-snow" : "text-muted hover:text-snow"
            }`}
          >
            {l.rotulo}
          </Link>
        );
      })}
      <Link
        href="/notificacoes"
        aria-label={n > 0 ? `Notificações (${n} não lidas)` : "Notificações"}
        aria-current={pathname === "/notificacoes" ? "page" : undefined}
        className={`relative inline-flex size-8 items-center justify-center rounded-full transition-colors ${
          pathname === "/notificacoes"
            ? "bg-surface text-snow"
            : "text-muted hover:text-snow"
        }`}
      >
        <BellIcon size={17} />
        {n > 0 && (
          <span className="tnum absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-void">
            {n > 9 ? "9+" : n}
          </span>
        )}
      </Link>
    </nav>
  );
}
