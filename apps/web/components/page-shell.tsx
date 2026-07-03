"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { TRPCProvider } from "@/lib/trpc/provider";
import { RiseWordmark } from "./rise-mark";
import { AppNav } from "./app-nav";

/** Casca das páginas internas (Feed/Loja/Perfil): header + nav + provider. */
export function PageShell({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <TRPCProvider>
      <main className="relative min-h-dvh overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[360px]"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(16,185,129,0.08), transparent 70%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-3xl px-5 pb-24 pt-6">
          <header className="flex items-center justify-between">
            <Link href="/" aria-label="Início">
              <RiseWordmark size={24} />
            </Link>
            <AppNav />
          </header>
          <h1 className="animate-rise-in font-display mt-10 text-2xl font-semibold tracking-tight text-snow">
            {titulo}
          </h1>
          <div className="animate-rise-in mt-6" style={{ animationDelay: "60ms" }}>
            {children}
          </div>
        </div>
      </main>
    </TRPCProvider>
  );
}
