import type { Metadata } from "next";
import { RiseWordmark } from "@/components/rise-mark";
import { RedefinirForm } from "@/components/redefinir-form";

export const metadata: Metadata = { title: "Redefinir senha" };
export const dynamic = "force-dynamic";

export default function RedefinirPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(16,185,129,0.12), transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <RiseWordmark size={30} />
          <p className="text-sm text-muted">Defina sua nova senha.</p>
        </div>
        <div className="rounded-[24px] border border-line bg-surface-2 p-6">
          <RedefinirForm />
        </div>
      </div>
    </main>
  );
}
