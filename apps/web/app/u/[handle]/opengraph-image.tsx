import { ImageResponse } from "next/og";
import {
  getDb,
  and,
  eq,
  isNull,
  users,
  profiles,
  userStats,
  streaks,
} from "@rise/db";

// Precisa do runtime Node (getDb usa postgres).
export const runtime = "nodejs";
export const alt = "Perfil no Rise";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VOID = "#0a0b0d";
const EMERALD = "#10b981";
const ASH = "#3a3f47";
const SNOW = "#f4f5f7";
const MUTED = "#8b929c";

// Chevron da marca como SVG data-URL (satori renderiza via <img>).
const chevron = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M28 88 L60 60 L92 88" stroke="${ASH}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 62 L60 34 L92 62" stroke="${EMERALD}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
)}`;

async function carregar(handle: string) {
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      handle: users.handle,
      displayName: profiles.displayName,
      isSearchable: profiles.isSearchable,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.handle, handle))
    .limit(1);
  const p = rows[0];
  if (!p || !p.isSearchable) return null;
  const [areas, st] = await Promise.all([
    db
      .select({ totalXp: userStats.totalXpAll, rise: userStats.riseLevel })
      .from(userStats)
      .where(eq(userStats.userId, p.userId))
      .limit(1),
    db
      .select({ longest: streaks.longestCount })
      .from(streaks)
      .where(and(eq(streaks.userId, p.userId), isNull(streaks.lifeAreaId)))
      .limit(1),
  ]);
  return {
    displayName: p.displayName,
    handle: p.handle,
    nivelRise: areas[0]?.rise ?? 0,
    xpTotal: areas[0]?.totalXp ?? 0,
    recorde: st[0]?.longest ?? 0,
  };
}

function Stat({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 64, fontWeight: 700, color: SNOW }}>{valor}</span>
      <span style={{ fontSize: 24, color: MUTED, marginTop: 4 }}>{rotulo}</span>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const p = await carregar(decodeURIComponent(handle));
  const nf = new Intl.NumberFormat("pt-BR");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: VOID,
          backgroundImage: `radial-gradient(1000px 600px at 50% -10%, rgba(16,185,129,0.22), transparent 70%)`,
        }}
      >
        {/* topo: marca */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={chevron} width={64} height={64} alt="" />
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: SNOW,
              marginLeft: 16,
              letterSpacing: -1,
            }}
          >
            Rise
          </span>
        </div>

        {/* meio: identidade */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 84, fontWeight: 700, color: SNOW, letterSpacing: -2 }}>
            {p ? p.displayName : "Rise"}
          </span>
          <span style={{ fontSize: 34, color: EMERALD, marginTop: 8 }}>
            {p ? `@${p.handle}` : "o videogame da vida real"}
          </span>
        </div>

        {/* base: stats ou tagline */}
        {p ? (
          <div style={{ display: "flex", gap: 96 }}>
            <Stat valor={String(p.nivelRise)} rotulo="Nível Rise" />
            <Stat valor={nf.format(p.xpTotal)} rotulo="XP total" />
            <Stat valor={`${p.recorde} dias`} rotulo="Recorde" />
          </div>
        ) : (
          <span style={{ fontSize: 30, color: MUTED }}>
            Toda ação positiva gera progresso. Com prova.
          </span>
        )}
      </div>
    ),
    { ...size },
  );
}
