import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDb,
  and,
  eq,
  isNull,
  sql,
  users,
  profiles,
  lifeAreas,
  streaks,
  userAchievements,
  cosmeticItems,
  follows,
} from "@rise/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FollowButton } from "@/components/follow-button";
import {
  calcularNivelRise,
  nivelDeArea,
  ACHIEVEMENT_CATALOG,
  classePorId,
} from "@rise/core";
import { Avatar } from "@/components/avatar";
import { RiseWordmark, RiseMark } from "@/components/rise-mark";

export const dynamic = "force-dynamic";

const COR_RARIDADE: Record<string, string> = {
  comum: "#8b929c",
  rara: "#60a5fa",
  epica: "#a78bfa",
  lendaria: "#fbbf24",
};

function corDaArea(token: string): string {
  return token.startsWith("--") ? `var(${token})` : token;
}

async function carregarPerfilPublico(handle: string) {
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      handle: users.handle,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      equippedFrameId: profiles.equippedFrameId,
      mainClassId: profiles.mainClassId,
      isSearchable: profiles.isSearchable,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.handle, handle))
    .limit(1);
  const p = rows[0];
  // Perfil oculto = inexistente para o público.
  if (!p || !p.isSearchable) return null;

  const [areas, streakRows, conquistasRows, frameRows, seguidores, seguindo] = await Promise.all([
    db
      .select({ name: lifeAreas.name, colorToken: lifeAreas.colorToken, totalXp: lifeAreas.totalXp })
      .from(lifeAreas)
      .where(and(eq(lifeAreas.userId, p.userId), eq(lifeAreas.isArchived, false))),
    db
      .select({ longest: streaks.longestCount, current: streaks.currentCount })
      .from(streaks)
      .where(and(eq(streaks.userId, p.userId), isNull(streaks.lifeAreaId)))
      .limit(1),
    db
      .select({ id: userAchievements.achievementId, unlockedAt: userAchievements.unlockedAt })
      .from(userAchievements)
      .where(eq(userAchievements.userId, p.userId)),
    p.equippedFrameId
      ? db
          .select({ preview: cosmeticItems.preview })
          .from(cosmeticItems)
          .where(eq(cosmeticItems.id, p.equippedFrameId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, p.userId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followerId, p.userId)),
  ]);

  const rise = calcularNivelRise(
    areas.map((a) => ({ xp: a.totalXp, ativaNoPeriodo: nivelDeArea(a.totalXp) >= 2 })),
  );
  const desbloqueadas = new Map(conquistasRows.map((c) => [c.id, c.unlockedAt]));
  const conquistas = ACHIEVEMENT_CATALOG.filter((a) => desbloqueadas.has(a.id)).map(
    (a) => ({ ...a, unlockedAt: desbloqueadas.get(a.id)! }),
  );

  const classe = classePorId(p.mainClassId);

  return {
    ...p,
    classe: classe ? { nome: classe.nome, cor: classe.colorToken } : null,
    framePreview: (frameRows[0]?.preview ?? null) as { colors?: string[] } | null,
    areas: areas
      .map((a) => ({ nome: a.name, cor: a.colorToken, nivel: nivelDeArea(a.totalXp), xp: a.totalXp }))
      .sort((a, b) => b.xp - a.xp),
    nivelRise: rise.nivelRise,
    xpTotal: rise.xpRise,
    streakRecorde: streakRows[0]?.longest ?? 0,
    conquistas,
    seguidores: seguidores[0]?.n ?? 0,
    seguindo: seguindo[0]?.n ?? 0,
  };
}

async function viewerId(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await carregarPerfilPublico(decodeURIComponent(handle));
  if (!p) return { title: "Perfil não encontrado" };
  return {
    title: `${p.displayName} (@${p.handle})`,
    description:
      p.bio ??
      `Nível Rise ${p.nivelRise} — evoluindo em ${p.areas.length} Áreas da Vida.`,
  };
}

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const p = await carregarPerfilPublico(decodeURIComponent(handle));
  if (!p) notFound();

  const viewer = await viewerId();
  const podeSeguir = viewer !== null && viewer !== p.userId;
  const nf = new Intl.NumberFormat("pt-BR");

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(16,185,129,0.10), transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-3xl px-5 pb-24 pt-6">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Início">
            <RiseWordmark size={24} />
          </Link>
          <Link
            href="/entrar"
            className="rounded-[var(--radius-pill)] border border-line bg-surface px-4 py-2 text-xs font-semibold text-snow transition-colors hover:border-[color-mix(in_srgb,var(--color-brand)_45%,transparent)]"
          >
            Criar meu perfil
          </Link>
        </header>

        {/* Identidade */}
        <section className="animate-rise-in mt-12 flex items-start gap-5">
          <Avatar
            nome={p.displayName}
            avatarPath={p.avatarUrl}
            frameColors={p.framePreview?.colors}
            size={84}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display truncate text-2xl font-semibold tracking-tight text-snow">
                  {p.displayName}
                </h1>
                <p className="truncate text-sm text-muted">@{p.handle}</p>
                {p.classe && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-line bg-surface px-2.5 py-1 text-xs font-medium text-snow">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: corDaArea(p.classe.cor) }}
                    />
                    {p.classe.nome}
                  </span>
                )}
              </div>
              {podeSeguir && <FollowButton targetUserId={p.userId} />}
            </div>
            <div className="tnum mt-2 flex gap-4 text-xs text-muted">
              <span>
                <span className="font-semibold text-snow">
                  {nf.format(p.seguidores)}
                </span>{" "}
                seguidores
              </span>
              <span>
                <span className="font-semibold text-snow">
                  {nf.format(p.seguindo)}
                </span>{" "}
                seguindo
              </span>
            </div>
            {p.bio && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                {p.bio}
              </p>
            )}
          </div>
        </section>

        {/* Stats */}
        <section
          className="animate-rise-in mt-8 grid grid-cols-3 gap-4 rounded-[24px] border border-line bg-surface-2 p-6"
          style={{ animationDelay: "60ms" }}
        >
          {[
            { valor: String(p.nivelRise), rotulo: "Nível Rise" },
            { valor: nf.format(p.xpTotal), rotulo: "XP total" },
            {
              valor: `${p.streakRecorde} ${p.streakRecorde === 1 ? "dia" : "dias"}`,
              rotulo: "Recorde de sequência",
            },
          ].map((s) => (
            <div key={s.rotulo} className="text-center">
              <p className="font-display tnum text-2xl font-semibold text-snow">
                {s.valor}
              </p>
              <p className="mt-1 text-xs font-medium text-muted">{s.rotulo}</p>
            </div>
          ))}
        </section>

        {/* Áreas */}
        {p.areas.length > 0 && (
          <section className="animate-rise-in mt-10" style={{ animationDelay: "90ms" }}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
              Áreas da Vida
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.areas.map((a) => (
                <span
                  key={a.nome}
                  className="tnum inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3.5 py-2 text-xs font-medium text-snow"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: corDaArea(a.cor) }}
                  />
                  {a.nome}
                  <span className="text-faint">nv {a.nivel}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Conquistas */}
        {p.conquistas.length > 0 && (
          <section className="animate-rise-in mt-10" style={{ animationDelay: "120ms" }}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
              Conquistas
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.conquistas.map((c) => {
                const cor = COR_RARIDADE[c.raridade] ?? "#8b929c";
                return (
                  <div
                    key={c.id}
                    className="rounded-[var(--radius-card)] border border-line bg-surface p-4"
                    style={{ boxShadow: `inset 3px 0 0 0 ${cor}` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-snow">{c.nome}</p>
                      <span
                        className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: cor }}
                      >
                        {c.raridade}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {c.criterio}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-16 flex flex-col items-center gap-3 text-center">
          <RiseMark size={20} variant="mono" className="text-faint" />
          <p className="text-xs text-faint">
            Progresso real, com prova.{" "}
            <Link href="/" className="text-brand hover:underline">
              Comece a subir no Rise
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
