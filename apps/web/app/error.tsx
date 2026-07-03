"use client";

import { RiseMark } from "@/components/rise-mark";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <RiseMark size={40} />
      <h1 className="font-display text-xl font-semibold text-snow">
        Algo saiu do trilho.
      </h1>
      <p className="max-w-sm text-sm text-muted">
        Seu progresso está salvo — o ledger é imutável. Tente de novo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-xl bg-brand px-6 py-3 font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.99]"
      >
        Tentar de novo
      </button>
    </main>
  );
}
