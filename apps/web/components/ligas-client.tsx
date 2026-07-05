"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { Avatar } from "./avatar";

const nf = new Intl.NumberFormat("pt-BR");

function medalha(rank: number): string {
  if (rank === 1) return "text-[#fbbf24]"; // ouro
  if (rank === 2) return "text-[#cbd5e1]"; // prata
  if (rank === 3) return "text-[#fb923c]"; // bronze
  return "text-faint";
}

export function LigasClient() {
  const liga = trpc.league.week.useQuery();

  if (!liga.data) {
    return <div className="h-96 animate-pulse rounded-[20px] bg-surface" />;
  }
  const { ranking, eu, totalParticipantes, inicioSemana } = liga.data;
  const desde = new Date(inicioSemana).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div>
      <div className="flex items-center justify-between rounded-[20px] border border-line bg-surface-2 px-5 py-4">
        <p className="text-sm text-muted">
          XP ganho desde segunda ({desde}). Competição por esforço real —{" "}
          <span className="text-snow">nunca por dinheiro</span>.
        </p>
        <div className="shrink-0 text-right">
          <p className="font-display tnum text-xl font-semibold text-brand">
            {eu.rank ? `#${eu.rank}` : "—"}
          </p>
          <p className="text-[11px] text-faint">sua posição</p>
        </div>
      </div>

      {ranking.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Ninguém pontuou esta semana ainda. Registre uma ação e assuma o topo.
        </p>
      ) : (
        <ol className="mt-6 space-y-2">
          {ranking.map((r) => (
            <li
              key={r.userId}
              className={`flex items-center gap-4 rounded-[var(--radius-card)] border p-3.5 ${
                r.souEu
                  ? "border-brand/50 bg-brand/5"
                  : "border-line bg-surface"
              }`}
            >
              <span
                className={`font-display tnum w-8 shrink-0 text-center text-lg font-semibold ${medalha(r.rank)}`}
              >
                {r.rank}
              </span>
              <Avatar
                nome={r.displayName}
                avatarPath={r.avatarUrl}
                frameColors={(r.framePreview as { colors?: string[] } | null)?.colors}
                size={40}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-snow">
                {r.displayName}
                {r.souEu && <span className="ml-1.5 text-xs text-brand">você</span>}
              </span>
              <span className="tnum shrink-0 text-sm font-semibold text-snow">
                {nf.format(r.xp)}{" "}
                <span className="text-xs font-normal text-muted">XP</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-6 text-center text-[11px] text-faint">
        {totalParticipantes} em disputa esta semana ·{" "}
        <Link href="/descobrir" className="text-brand hover:underline">
          siga quem está subindo
        </Link>
      </p>
    </div>
  );
}
