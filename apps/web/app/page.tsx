import { RiseWordmark, RiseMark } from "@/components/rise-mark";
import { LevelRing } from "@/components/level-ring";
import { AreaCard } from "@/components/area-card";
import { areas, perfil, temporadaAtual } from "@/lib/demo";

const nf = new Intl.NumberFormat("pt-BR");
const mult = perfil.streakMult.toLocaleString("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Stat({
  valor,
  rotulo,
  destaque = false,
}: {
  valor: string;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display tnum text-2xl font-semibold leading-none ${
          destaque ? "text-brand" : "text-snow"
        }`}
      >
        {valor}
      </div>
      <div className="mt-1.5 text-xs font-medium text-muted">{rotulo}</div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Glow esmeralda de fundo — contido, premium. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(16,185,129,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-20 pt-6">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <RiseWordmark size={26} />
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
              <span className="size-1.5 rounded-full bg-brand" />
              {temporadaAtual()}
            </span>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-void">
              {perfil.nome.charAt(0)}
            </span>
          </div>
        </header>

        {/* Saudação */}
        <section className="animate-rise-in mt-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-snow sm:text-4xl">
            Olá, {perfil.nome}.
          </h1>
          <p className="mt-2 text-base text-muted">
            Toda ação conta. Toda evolução aparece.
          </p>
        </section>

        {/* Hero: Nível Rise + stats */}
        <section
          className="animate-rise-in mt-8 rounded-[28px] border border-line bg-surface-2 p-6 sm:p-8"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
            <LevelRing nivel={perfil.nivelRise} fracao={perfil.fracaoRise} />

            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
                  Sua evolução
                </h2>
                <span className="tnum text-xs text-muted">
                  faltam {nf.format(perfil.xpDoNivel - perfil.xpNoNivel)} XP
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <Stat valor={nf.format(perfil.xpTotal)} rotulo="XP total" />
                <Stat
                  valor={String(perfil.areasAtivas)}
                  rotulo="Áreas ativas"
                />
                <Stat
                  valor={`${perfil.streakDias} dias`}
                  rotulo="Sequência"
                  destaque
                />
                <Stat valor={`${mult}×`} rotulo="Bônus de streak" />
              </div>

              {/* Faixa de streak */}
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <RiseMark size={22} />
                <p className="text-sm text-muted">
                  <span className="font-semibold text-snow">
                    Sequência de {perfil.streakDias} dias.
                  </span>{" "}
                  Você está subindo — mantenha o ritmo hoje para seguir em frente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Áreas da Vida */}
        <section
          className="animate-rise-in mt-10"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
              Áreas da Vida
            </h2>
            <span className="text-xs text-muted">
              {areas.length} em progresso
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <AreaCard key={area.nome} area={area} />
            ))}
          </div>
        </section>

        <footer className="mt-16 flex items-center justify-center gap-2 text-xs text-faint">
          <RiseMark size={14} variant="mono" className="text-faint" />
          <span>Rise — o videogame da vida real</span>
        </footer>
      </div>
    </main>
  );
}
