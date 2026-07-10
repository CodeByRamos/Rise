"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";

const nf = new Intl.NumberFormat("pt-BR");

function medalha(rank: number): string {
  if (rank === 1) return "text-[#fbbf24]"; // ouro
  if (rank === 2) return "text-[#cbd5e1]"; // prata
  if (rank === 3) return "text-[#fb923c]"; // bronze
  return "text-faint";
}

/**
 * Guerras de Classe: XP agregado por Classe principal (surfistas vs.
 * desenvolvedores...). Mesmo espírito da Liga — competição só por esforço
 * real. Quem não declarou Classe no perfil não aparece disputando.
 */
export function GuerraDeClassesClient() {
  const guerra = trpc.classWar.week.useQuery();

  if (!guerra.data) {
    return <div className="h-96 animate-pulse rounded-[20px] bg-surface" />;
  }
  const { ranking, minhaClasseId, minhaPos, souElegivel, inicioSemana } = guerra.data;
  const desde = new Date(inicioSemana).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const emDisputa = ranking.filter((c) => c.membros > 0);

  return (
    <div>
      <div className="flex items-center justify-between rounded-[20px] border border-line bg-surface-2 px-5 py-4">
        <p className="text-sm text-muted">
          XP somado por Classe desde segunda ({desde}). Sua ação soma pela sua
          Classe — <span className="text-snow">nunca por dinheiro</span>.
        </p>
        <div className="shrink-0 text-right">
          <p className="font-display tnum text-xl font-semibold text-brand">
            {minhaPos ? `#${minhaPos}` : "—"}
          </p>
          <p className="text-[11px] text-faint">
            {minhaClasseId ? "sua classe" : "declare a sua"}
          </p>
        </div>
      </div>

      {!minhaClasseId && (
        <p className="mt-4 text-sm text-muted">
          Você ainda não declarou uma Classe.{" "}
          <Link href="/perfil" className="text-brand hover:underline">
            Declare a sua no perfil
          </Link>{" "}
          e comece a somar XP pelo seu lado.
        </p>
      )}

      {minhaClasseId && !souElegivel && (
        <p className="mt-4 text-sm text-muted">
          Classe declarada nesta semana — para evitar troca de última hora,
          seu XP passa a somar para{" "}
          <span className="text-snow">a partir da próxima segunda</span>.
        </p>
      )}

      {emDisputa.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Nenhuma Classe pontuou esta semana ainda. Registre uma ação e abra a
          disputa.
        </p>
      ) : (
        <ol className="mt-6 space-y-2">
          {ranking.map((c) => (
            <li
              key={c.classId}
              className={`flex items-center gap-4 rounded-[var(--radius-card)] border p-3.5 ${
                c.souMinhaClasse
                  ? "border-brand/50 bg-brand/5"
                  : "border-line bg-surface"
              } ${c.membros === 0 ? "opacity-50" : ""}`}
            >
              <span
                className={`font-display tnum w-8 shrink-0 text-center text-lg font-semibold ${medalha(c.rank)}`}
              >
                {c.rank}
              </span>
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cssColor(c.colorToken) }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-snow">
                {c.nome}
                {c.souMinhaClasse && (
                  <span className="ml-1.5 text-xs text-brand">sua classe</span>
                )}
                <span className="ml-2 text-xs font-normal text-faint">
                  {c.membros} {c.membros === 1 ? "guerreiro" : "guerreiros"}
                </span>
              </span>
              <span className="tnum shrink-0 text-sm font-semibold text-snow">
                {nf.format(c.xp)}{" "}
                <span className="text-xs font-normal text-muted">XP</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-6 text-center text-[11px] text-faint">
        Toda ação que você registra soma para a sua Classe.
      </p>
    </div>
  );
}
