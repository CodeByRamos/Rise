"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc/react";
import { BellIcon, ChevronDownIcon, CrownIcon } from "./icons";

// Destinos primários (sempre visíveis) e o resto no menu "Mais" — mantém a
// navegação enxuta e premium mesmo com o produto crescendo.
const PRIMARIOS = [
  { href: "/", rotulo: "Início" },
  { href: "/evolucao", rotulo: "Evolução" },
  { href: "/foco", rotulo: "Foco" },
  { href: "/coach", rotulo: "Coach" },
  { href: "/feed", rotulo: "Feed" },
] as const;

const SECUNDARIOS: { href: string; rotulo: string; destaque?: boolean }[] = [
  { href: "/ligas", rotulo: "Ligas" },
  { href: "/guerra-de-classes", rotulo: "Classes" },
  { href: "/estatisticas", rotulo: "Estatísticas" },
  { href: "/historico", rotulo: "Histórico" },
  { href: "/descobrir", rotulo: "Descobrir" },
  { href: "/loja", rotulo: "Loja" },
  { href: "/rise-plus", rotulo: "Rise+", destaque: true },
  { href: "/perfil", rotulo: "Perfil" },
];

/** Navegação principal do app (usuário logado). */
export function AppNav() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const n = unread.data ?? 0;

  // Fecha ao navegar ou clicar fora / Esc.
  useEffect(() => setAberto(false), [pathname]);
  useEffect(() => {
    if (!aberto) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  const secundarioAtivo = SECUNDARIOS.some((l) => l.href === pathname);

  return (
    <nav
      aria-label="Principal"
      className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pl-2 sm:flex-none sm:justify-end sm:overflow-visible sm:pl-0"
    >
      {PRIMARIOS.map((l) => {
        const ativo = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={ativo ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-colors ${
              ativo ? "bg-surface text-snow" : "text-muted hover:text-snow"
            }`}
          >
            {l.rotulo}
          </Link>
        );
      })}

      {/* Menu "Mais" */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={aberto}
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-colors ${
            secundarioAtivo || aberto ? "bg-surface text-snow" : "text-muted hover:text-snow"
          }`}
        >
          Mais
          <ChevronDownIcon
            size={13}
            className={`transition-transform ${aberto ? "rotate-180" : ""}`}
          />
        </button>
        {aberto && (
          <div
            role="menu"
            className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-line bg-surface-2 p-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]"
          >
            {SECUNDARIOS.map((l) => {
              const ativo = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  role="menuitem"
                  aria-current={ativo ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    ativo
                      ? "bg-surface text-snow"
                      : l.destaque
                        ? "text-brand hover:bg-surface"
                        : "text-muted hover:bg-surface hover:text-snow"
                  }`}
                >
                  {l.destaque && <CrownIcon size={14} />}
                  {l.rotulo}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/notificacoes"
        aria-label={n > 0 ? `Notificações (${n} não lidas)` : "Notificações"}
        aria-current={pathname === "/notificacoes" ? "page" : undefined}
        className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
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
