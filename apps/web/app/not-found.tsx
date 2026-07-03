import Link from "next/link";
import { RiseMark } from "@/components/rise-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <RiseMark size={40} variant="mono" className="text-faint" />
      <h1 className="font-display text-xl font-semibold text-snow">
        Essa página não existe.
      </h1>
      <p className="text-sm text-muted">
        Mas o seu progresso continua no lugar certo.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-brand px-6 py-3 font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.99]"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
