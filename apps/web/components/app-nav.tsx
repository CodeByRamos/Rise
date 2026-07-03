"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", rotulo: "Início" },
  { href: "/feed", rotulo: "Feed" },
  { href: "/loja", rotulo: "Loja" },
  { href: "/perfil", rotulo: "Perfil" },
] as const;

/** Navegação principal do app (usuário logado). */
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex items-center gap-1">
      {LINKS.map((l) => {
        const ativo = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-colors ${
              ativo
                ? "bg-surface text-snow"
                : "text-muted hover:text-snow"
            }`}
          >
            {l.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
