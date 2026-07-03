import Link from "next/link";
import { RiseMark, RiseWordmark } from "./rise-mark";
import { LevelRing } from "./level-ring";
import { CheckIcon } from "./icons";

/**
 * Landing pública — explica o Rise para quem chega sem conta.
 * Server component estático: zero JS além do essencial, SEO-friendly.
 */

const COMO_FUNCIONA = [
  {
    passo: "01",
    titulo: "Registre com prova",
    texto:
      "Fez um treino, leu 20 páginas, dormiu bem? Registre a ação e prove: escreva o que fez ou anexe uma foto. Sem prova, não conta.",
  },
  {
    passo: "02",
    titulo: "Ganhe XP de verdade",
    texto:
      "Cada ação vira XP na Área da Vida certa. Suba de nível em Academia, Leitura, Sono, Programação — e veja seu Nível Rise crescer.",
  },
  {
    passo: "03",
    titulo: "Volte amanhã",
    texto:
      "Sequências diárias com bônus de XP, missões novas todo dia e um Coach que lê seus dados — não sua imaginação.",
  },
] as const;

const FEATURES = [
  {
    titulo: "Áreas da Vida",
    texto:
      "Cada área é uma classe de RPG com nível e progressão próprios. Você escolhe onde evoluir.",
  },
  {
    titulo: "Provas reais",
    texto:
      "Nota ou foto em toda ação. É o que separa progresso de auto-engano — e vira seu diário de evolução.",
  },
  {
    titulo: "Sequências que perdoam",
    texto:
      "Perdeu um dia? Perdão automático e Streak Freeze protegem sua sequência. A vida real fura a rotina; o Rise sabe disso.",
  },
  {
    titulo: "Missões diárias",
    texto:
      "Três missões por dia, alcançáveis, com XP bônus e Faíscas. Fechar todas rende um Freeze.",
  },
  {
    titulo: "Faíscas",
    texto:
      "Moeda cosmética ganha jogando. Compra aparência — nunca progresso. Aqui ninguém paga para vencer.",
  },
  {
    titulo: "Coach",
    texto:
      "Um mentor que analisa seus números reais e diz o próximo passo. Nunca culpa, nunca inventa.",
  },
] as const;

const PRINCIPIOS = [
  "XP não se compra. Nunca. Progresso nasce de ação real, validada por prova.",
  "Quebrar a sequência não apaga nada. O que você conquistou é seu para sempre.",
  "Sem anúncios, sem loot box, sem culpa. Alto engajamento porque você evolui de verdade.",
] as const;

export function Landing() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(16,185,129,0.12), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-24 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <RiseWordmark size={26} />
          <Link
            href="/entrar"
            className="rounded-[var(--radius-pill)] border border-line bg-surface px-4 py-2 text-sm font-semibold text-snow transition-colors hover:border-[color-mix(in_srgb,var(--color-brand)_45%,transparent)]"
          >
            Entrar
          </Link>
        </header>

        {/* Hero */}
        <section className="animate-rise-in mt-20 flex flex-col items-center gap-12 sm:mt-24 lg:flex-row lg:items-center lg:gap-16">
          <div className="max-w-xl text-center lg:text-left">
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-snow sm:text-6xl">
              O videogame da{" "}
              <span className="text-brand">vida real</span>
              .
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Toda ação positiva vira progresso: XP, níveis, sequências e
              missões — nas áreas da vida que importam para você. Com uma
              regra: tem que provar.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/entrar"
                className="w-full rounded-xl bg-brand px-7 py-3.5 text-center font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
              >
                Começar a subir
              </Link>
              <span className="text-xs text-faint">
                Grátis. Sem cartão. Sem pay-to-win.
              </span>
            </div>
          </div>

          {/* Visual: progresso real, não screenshot */}
          <div className="flex flex-col items-center gap-5">
            <LevelRing nivel={13} fracao={0.72} size={208} />
            <div className="w-64 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-snow">Leitura</span>
                <span className="tnum text-brand">+12 XP</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                “Li 25 páginas de Atomic Habits — capítulo 3.”
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-graphite">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: "64%" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mt-28">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-faint">
            Como funciona
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {COMO_FUNCIONA.map((p) => (
              <div
                key={p.passo}
                className="rounded-[var(--radius-card)] border border-line bg-surface p-6"
              >
                <span className="font-display tnum text-sm font-semibold text-brand">
                  {p.passo}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-snow">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {p.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-24">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-faint">
            Feito para evolução constante
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.titulo}
                className="rounded-[var(--radius-card)] border border-line bg-surface p-5"
              >
                <h3 className="text-sm font-semibold text-snow">{f.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {f.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Princípios */}
        <section className="mt-24 rounded-[28px] border border-line bg-surface-2 p-8 sm:p-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
            Nossos inegociáveis
          </h2>
          <ul className="mt-6 space-y-4">
            {PRINCIPIOS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckIcon size={18} className="mt-0.5 shrink-0 text-brand" />
                <p className="text-base leading-relaxed text-snow">{p}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA final */}
        <section className="mt-24 flex flex-col items-center gap-6 text-center">
          <RiseMark size={44} />
          <h2 className="font-display max-w-lg text-3xl font-semibold tracking-tight text-snow">
            Toda ação conta. Toda evolução aparece.
          </h2>
          <Link
            href="/entrar"
            className="rounded-xl bg-brand px-8 py-3.5 font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            Criar minha conta
          </Link>
        </section>

        <footer className="mt-20 flex items-center justify-center gap-2 text-xs text-faint">
          <RiseMark size={14} variant="mono" className="text-faint" />
          <span>Rise — feito para quem quer subir</span>
        </footer>
      </div>
    </main>
  );
}
