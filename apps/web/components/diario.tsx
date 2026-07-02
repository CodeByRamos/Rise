"use client";

/**
 * Diário de Evolução — as provas registradas (nota/foto) com área, XP e quando.
 * Fotos vivem no bucket privado `provas`; exibição via signed URL (RLS garante
 * que só o dono lê). Este diário é o embrião do feed social da Fase 2.
 */
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cssColor } from "./area-card";

interface ItemDiario {
  id: number;
  note: string | null;
  photoPath: string | null;
  createdAt: string | Date;
  areaNome: string;
  areaCor: string;
  xp: number | null;
}

function tempoRelativo(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Foto de prova: resolve signed URL sob demanda (1h de validade). */
function FotoProva({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    createSupabaseBrowserClient()
      .storage.from("provas")
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error || !data) setErro(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      ativo = false;
    };
  }, [path]);

  if (erro) return null;
  if (!url) {
    return (
      <div className="mt-2 h-40 w-full animate-pulse rounded-xl bg-graphite" />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Foto de prova da ação"
      className="mt-2 max-h-64 w-full rounded-xl border border-line object-cover"
      loading="lazy"
    />
  );
}

export function Diario({ itens }: { itens: ItemDiario[] }) {
  if (itens.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-6 py-8 text-center">
        <p className="text-sm text-muted">
          Suas provas aparecem aqui. Registre a primeira ação — escreva o que
          fez ou anexe uma foto.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {itens.map((item) => (
        <li
          key={item.id}
          className="rounded-[var(--radius-card)] border border-line bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: cssColor(item.areaCor) }}
              />
              <span className="truncate text-xs font-semibold uppercase tracking-wider text-faint">
                {item.areaNome}
              </span>
              <span className="shrink-0 text-xs text-faint">
                · {tempoRelativo(item.createdAt)}
              </span>
            </span>
            {item.xp !== null && (
              <span className="tnum shrink-0 text-xs font-bold text-brand">
                +{item.xp} XP
              </span>
            )}
          </div>
          {item.note && (
            <p className="mt-2 text-sm leading-relaxed text-snow">
              {item.note}
            </p>
          )}
          {item.photoPath && <FotoProva path={item.photoPath} />}
        </li>
      ))}
    </ol>
  );
}
