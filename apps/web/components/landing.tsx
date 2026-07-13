"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { RiseMark, RiseWordmark } from "./rise-mark";
import { LevelRing } from "./level-ring";
import { cssColor } from "./area-card";
import { CheckIcon, ChevronUpIcon, SparkIcon, CameraIcon } from "./icons";

/**
 * Landing pública — o primeiro contato com o Rise. Kinético, dark, esmeralda.
 * Movimento nativo (CSS + IntersectionObserver + ponteiro), zero dependência
 * nova, tudo com fallback de prefers-reduced-motion.
 */

const AREAS = [
  { nome: "Programação", cor: "--area-programacao" },
  { nome: "Academia", cor: "--area-academia" },
  { nome: "Leitura", cor: "--area-leitura" },
  { nome: "Sono", cor: "--area-sono" },
  { nome: "Estudos", cor: "--area-estudos" },
  { nome: "Finanças", cor: "--area-financas" },
  { nome: "Corrida", cor: "--area-corrida" },
  { nome: "Música", cor: "--area-musica" },
  { nome: "Idiomas", cor: "--area-idiomas" },
  { nome: "Meditação", cor: "--area-meditacao" },
  { nome: "Disciplina", cor: "--area-disciplina" },
  { nome: "Escrita", cor: "--area-escrita" },
  { nome: "Natureza", cor: "--area-natureza" },
  { nome: "Foco", cor: "--area-carreira" },
] as const;

const LOOP = [
  { n: "01", titulo: "Viva", texto: "Treine, leia, durma bem, programe. A vida acontece fora da tela." },
  { n: "02", titulo: "Registre com prova", texto: "Escreva o que fez ou anexe uma foto. Sem prova, não conta." },
  { n: "03", titulo: "Ganhe XP real", texto: "Cada ação vira XP na Área da Vida certa. Suba de nível." },
  { n: "04", titulo: "Veja evoluir", texto: "Sequências, missões e sua Árvore de Habilidade crescendo." },
  { n: "05", titulo: "O Coach orienta", texto: "Um mentor que lê seus números e aponta o próximo passo." },
  { n: "06", titulo: "Volte amanhã", texto: "Bônus de sequência, missões novas, temporada rodando." },
] as const;

const PRINCIPIOS = [
  "XP não se compra. Nunca. Progresso nasce de ação real, validada por prova.",
  "Quebrar a sequência não apaga nada. O que você conquistou é seu para sempre.",
  "Sem anúncios, sem loot box, sem culpa. Você evolui de verdade, não por FOMO.",
] as const;

export function Landing() {
  const rootRef = useReveal();

  return (
    <main ref={rootRef} className="relative min-h-dvh overflow-x-hidden bg-void">
      {/* progresso de scroll */}
      <div
        aria-hidden
        className="scroll-progress fixed left-0 top-0 z-[70] h-0.5 w-full bg-brand"
      />

      <Nav />

      <Hero />

      {/* Faixa de honestidade */}
      <div className="relative border-y border-line bg-surface/40 py-4">
        <p className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-faint">
          <span>Grátis para sempre</span>
          <span className="text-brand">Sem anúncios</span>
          <span>Sem pay-to-win</span>
          <span className="text-brand">Sem cartão</span>
        </p>
      </div>

      <Loop />

      <AreasMarquee />

      <Bento />

      <Principios />

      <FinalCta />

      <footer className="relative flex items-center justify-center gap-2 py-12 text-xs text-faint">
        <RiseMark size={14} variant="mono" className="text-faint" />
        <span>Rise. O videogame da vida real.</span>
      </footer>
    </main>
  );
}

/* ───────────────────────────── NAV ───────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-[60] border-b border-line bg-void/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Início">
          <RiseWordmark size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/entrar"
            className="rounded-[var(--radius-pill)] px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-snow"
          >
            Entrar
          </Link>
          <Link
            href="/entrar"
            className="rounded-[var(--radius-pill)] bg-brand px-4 py-2 text-sm font-semibold text-void transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Criar conta
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ───────────────────────────── HERO ───────────────────────────── */

function Hero() {
  const palavras = ["O", "videogame", "da"];
  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden px-5 pb-16 pt-10 sm:pt-16">
      <Aurora />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-snow sm:text-6xl lg:text-[5.2rem]">
            <span className="block">
              {palavras.map((p, i) => (
                <span key={p} className="word-rise mr-[0.28em]">
                  <span style={{ animationDelay: `${0.05 + i * 0.09}s` }}>{p}</span>
                </span>
              ))}
            </span>
            <span className="word-rise">
              <span
                className="bg-gradient-to-r from-brand to-[#34d399] bg-clip-text text-transparent"
                style={{ animationDelay: "0.34s" }}
              >
                vida real
              </span>
            </span>
            <span className="text-brand">.</span>
          </h1>

          <p className="animate-rise-in mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted lg:mx-0" style={{ animationDelay: "0.5s" }}>
            Toda ação positiva vira progresso: XP, níveis, sequências e missões.
            Com uma regra que muda tudo: tem que provar.
          </p>

          <div className="animate-rise-in mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start" style={{ animationDelay: "0.62s" }}>
            <MagneticCTA
              href="/entrar"
              className="group relative w-full overflow-hidden rounded-[var(--radius-pill)] bg-brand px-8 py-4 text-center font-semibold text-void sm:w-auto"
            >
              <span className="relative z-10">Começar a subir</span>
              <span
                aria-hidden
                className="animate-sweep absolute inset-y-0 -left-1/2 z-0 w-1/3 bg-white/25 blur-md"
              />
            </MagneticCTA>
            <Link
              href="/entrar"
              className="rounded-[var(--radius-pill)] border border-line px-8 py-4 text-center font-semibold text-snow transition-colors hover:border-brand/60"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Demo vivo */}
        <div className="animate-rise-in" style={{ animationDelay: "0.4s" }}>
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}

function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="aurora-a absolute -left-24 -top-24 size-[42rem] rounded-full opacity-40 blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.5), transparent 62%)" }}
      />
      <div
        className="aurora-b absolute -right-32 top-20 size-[40rem] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(96,165,250,0.4), transparent 62%)" }}
      />
      <div
        className="aurora-a absolute bottom-[-14rem] left-1/3 size-[38rem] rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.35), transparent 62%)" }}
      />
    </div>
  );
}

const DEMO = [
  { area: "Leitura", cor: "--area-leitura", xp: 12, nota: "Li 25 páginas de Atomic Habits." },
  { area: "Academia", cor: "--area-academia", xp: 30, nota: "Treino de pernas completo." },
  { area: "Programação", cor: "--area-programacao", xp: 20, nota: "2h no projeto Rise." },
  { area: "Sono", cor: "--area-sono", xp: 20, nota: "Dormi 8h, acordei às 6h." },
] as const;

function HeroDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % DEMO.length), 2400);
    return () => window.clearInterval(id);
  }, []);
  const d = DEMO[i]!;
  const cor = cssColor(d.cor);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* halo */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[32px] opacity-60 blur-2xl"
        style={{ background: `radial-gradient(60% 60% at 50% 20%, ${cor}22, transparent 70%)` }}
      />
      <div className="rounded-[28px] border border-line bg-surface-2/80 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
            Sua evolução
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            <SparkIcon size={12} /> ao vivo
          </span>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="relative">
            <LevelRing nivel={13} fracao={0.72} size={168} />
            <span
              aria-hidden
              className="animate-ping-soft absolute inset-0 rounded-full border"
              style={{ borderColor: `${cssColor("--color-brand")}55` }}
            />
          </div>
        </div>

        {/* ação registrada (troca sozinha) */}
        <div key={i} className="animate-pop-in relative mt-5 rounded-2xl border border-line bg-surface p-4">
          <span
            aria-hidden
            className="animate-float-up absolute -top-1 right-4 font-display tnum text-xl font-semibold"
            style={{ color: cor, textShadow: `0 0 12px ${cor}88` }}
          >
            +{d.xp} XP
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} />
            <span className="font-semibold text-snow">{d.area}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-faint">
              <CameraIcon size={12} /> prova
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">“{d.nota}”</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-graphite">
            <div className="animate-xp h-full rounded-full" style={{ background: cor }} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <MiniStat valor="Nível 13" rotulo="Rise" />
          <MiniStat valor="27 dias" rotulo="sequência" destaque />
          <MiniStat valor="1.48×" rotulo="bônus" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ valor, rotulo, destaque = false }: { valor: string; rotulo: string; destaque?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-2 py-2.5">
      <div className={`font-display tnum text-sm font-semibold leading-none ${destaque ? "text-brand" : "text-snow"}`}>
        {valor}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-faint">{rotulo}</div>
    </div>
  );
}

/* ───────────────────────────── O LOOP ───────────────────────────── */

function Loop() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-28">
      <div className="reveal">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">O loop</p>
        <h2 className="font-display mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-snow sm:text-5xl">
          Um ciclo viciante. Do jeito saudável.
        </h2>
      </div>

      <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LOOP.map((s, i) => (
          <li
            key={s.n}
            className="reveal group relative overflow-hidden rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-brand/40"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display tnum text-2xl font-semibold text-brand/80">{s.n}</span>
              <ChevronUpIcon size={18} className="text-line transition-colors group-hover:text-brand" />
            </div>
            <h3 className="font-display mt-4 text-lg font-semibold text-snow">{s.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.texto}</p>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100"
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────────────────────── ÁREAS MARQUEE ───────────────────────── */

function AreasMarquee() {
  const fila = [...AREAS, ...AREAS];
  return (
    <section className="reveal relative border-y border-line py-16">
      <p className="mb-8 text-center text-sm text-muted">
        Escolha onde evoluir. <span className="font-semibold text-snow">Cada área é uma classe de RPG</span> com nível próprio.
      </p>
      <div className="group/mq marquee-mask relative overflow-hidden">
        <div className="animate-marquee flex w-max gap-3 pr-3">
          {fila.map((a, i) => {
            const cor = cssColor(a.cor);
            return (
              <span
                key={`${a.nome}-${i}`}
                className="inline-flex shrink-0 items-center gap-2.5 rounded-[var(--radius-pill)] border px-5 py-3 text-sm font-medium text-snow"
                style={{ borderColor: `${cor}44`, background: `${cor}12` }}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} />
                {a.nome}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── BENTO ───────────────────────────── */

function Bento() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-28">
      <div className="reveal max-w-2xl">
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-snow sm:text-5xl">
          Feito para quem leva a evolução a sério.
        </h2>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-2">
        {/* Prova (grande) */}
        <article className="reveal group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-line bg-surface-2 p-7 md:col-span-2 md:row-span-2">
          <div
            aria-hidden
            className="absolute -right-16 -top-16 size-72 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-70"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.4), transparent 65%)" }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <CameraIcon size={13} /> Prova em toda ação
            </span>
            <h3 className="font-display mt-5 max-w-md text-2xl font-semibold text-snow sm:text-3xl">
              Nota ou foto. É o que separa progresso de auto-engano.
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Sem prova, não conta. Cada registro vira seu diário de evolução, e
              o combustível do Coach para te orientar de verdade.
            </p>
          </div>
          <div className="relative mt-8 flex items-end gap-3">
            {[0.4, 0.62, 0.5, 0.85, 0.7, 1].map((h, i) => (
              <span
                key={i}
                className="w-full rounded-t bg-brand/70"
                style={{ height: `${h * 88}px`, opacity: 0.35 + h * 0.65 }}
              />
            ))}
          </div>
        </article>

        {/* Sequências */}
        <article className="reveal group relative overflow-hidden rounded-[24px] border border-line bg-surface-2 p-7">
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{ background: "linear-gradient(160deg, rgba(251,146,60,0.14), transparent 60%)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <SparkIcon size={20} className="text-[#fb923c]" />
              <span className="font-display tnum text-4xl font-semibold text-snow">27</span>
              <span className="text-sm text-muted">dias</span>
            </div>
            <h3 className="font-display mt-4 text-lg font-semibold text-snow">Sequências que perdoam</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Perdeu um dia? Perdão automático e Streak Freeze protegem sua
              sequência. A vida fura a rotina. O Rise sabe.
            </p>
          </div>
        </article>

        {/* Coach */}
        <article className="reveal group relative overflow-hidden rounded-[24px] border border-line bg-surface-2 p-7">
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{ background: "linear-gradient(160deg, rgba(96,165,250,0.14), transparent 60%)" }}
          />
          <div className="relative">
            <RiseMark size={26} />
            <h3 className="font-display mt-4 text-lg font-semibold text-snow">Um Coach, não um chatbot</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Analisa seus números reais e diz o próximo passo. Nunca culpa,
              nunca inventa.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ─────────────────────────── PRINCÍPIOS ─────────────────────────── */

function Principios() {
  return (
    <section className="relative overflow-hidden px-5 py-28">
      <div
        aria-hidden
        className="aurora-b pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(16,185,129,0.16), transparent 70%)" }}
      />
      <div className="mx-auto max-w-3xl">
        <p className="reveal text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          Nossos inegociáveis
        </p>
        <div className="mt-10 space-y-5">
          {PRINCIPIOS.map((p, i) => (
            <div
              key={p}
              className="reveal flex items-start gap-4 rounded-2xl border border-line bg-surface-2/60 p-5"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                <CheckIcon size={16} />
              </span>
              <p className="text-lg leading-relaxed text-snow">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FINAL CTA ─────────────────────────── */

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-5 py-32 text-center">
      <Aurora />
      <div className="reveal relative mx-auto flex max-w-2xl flex-col items-center gap-7">
        <RiseMark size={52} />
        <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-snow sm:text-6xl">
          Toda ação conta.
          <br />
          <span className="bg-gradient-to-r from-brand to-[#34d399] bg-clip-text text-transparent">
            Toda evolução aparece.
          </span>
        </h2>
        <MagneticCTA
          href="/entrar"
          className="group relative mt-2 overflow-hidden rounded-[var(--radius-pill)] bg-brand px-10 py-4 text-lg font-semibold text-void"
        >
          <span className="relative z-10">Criar minha conta grátis</span>
          <span aria-hidden className="animate-sweep absolute inset-y-0 -left-1/2 z-0 w-1/3 bg-white/25 blur-md" />
        </MagneticCTA>
        <p className="text-xs text-faint">Leva 30 segundos. Sem cartão. Sem pay-to-win.</p>
      </div>
    </section>
  );
}

/* ───────────────────────── HELPERS (motion) ───────────────────────── */

/** Revela elementos .reveal quando entram na viewport (IntersectionObserver). */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return ref;
}

/** CTA magnético — segue o cursor via ref (sem re-render), respeita reduce. */
function MagneticCTA({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useRef(false);
  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={(e) => {
        if (reduce.current || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        ref.current.style.transform = `translate(${x * 0.22}px, ${y * 0.42}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
      className={className}
      style={{ transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)" }}
    >
      {children}
    </Link>
  );
}
