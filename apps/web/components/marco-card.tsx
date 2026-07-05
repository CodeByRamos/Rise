"use client";

import Link from "next/link";
import { Avatar } from "./avatar";
import { RiseMark } from "./rise-mark";
import { ChevronUpIcon } from "./icons";

export interface MarcoItem {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string | Date;
  displayName: string;
  avatarUrl: string | null;
  framePreview: unknown;
  forcas: number;
  deiForca: boolean;
}

const RARIDADE_COR: Record<string, string> = {
  comum: "#8b929c",
  rara: "#60a5fa",
  epica: "#a78bfa",
  lendaria: "#fbbf24",
};

interface Visual {
  accent: string;
  kicker: string;
  titulo: string;
  sub: string;
}

function visualDoMarco(type: string, p: Record<string, unknown>): Visual {
  switch (type) {
    case "level.up":
      return {
        accent: "#10b981",
        kicker: "Subiu de nível",
        titulo: `Nível ${p.toLevel}`,
        sub: String(p.area ?? ""),
      };
    case "achievement":
      return {
        accent: RARIDADE_COR[String(p.raridade)] ?? "#10b981",
        kicker: "Conquista",
        titulo: String(p.nome ?? ""),
        sub: String(p.raridade ?? "").toUpperCase(),
      };
    case "streak.milestone":
      return {
        accent: "#fbbf24",
        kicker: "Sequência",
        titulo: `${p.days} dias`,
        sub: "de constância",
      };
    case "missions.day":
      return {
        accent: "#10b981",
        kicker: "Dia completo",
        titulo: "Todas as missões",
        sub: "feitas hoje",
      };
    default:
      return { accent: "#10b981", kicker: "Marco", titulo: "Evolução", sub: "" };
  }
}

function tempoRelativo(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const min = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fraseDoMarco(type: string, p: Record<string, unknown>): string {
  if (type === "level.up") return `subiu para o nível ${p.toLevel} em ${p.area}`;
  if (type === "streak.milestone") return `alcançou ${p.days} dias de sequência`;
  if (type === "missions.day") return "completou todas as missões do dia";
  if (type === "achievement") return `desbloqueou "${p.nome}"`;
  return "registrou um marco de evolução";
}

export function MarcoCard({
  item,
  onForca,
}: {
  item: MarcoItem;
  onForca: () => void;
}) {
  const v = visualDoMarco(item.type, item.payload);
  const isTituloLongo = v.titulo.length > 14;

  return (
    <article className="overflow-hidden rounded-[24px] border border-line bg-surface">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar
          nome={item.displayName}
          avatarPath={item.avatarUrl}
          frameColors={(item.framePreview as { colors?: string[] } | null)?.colors}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-snow">
            {item.displayName}
          </p>
          <p className="text-xs text-faint">{tempoRelativo(item.createdAt)}</p>
        </div>
        <RiseMark size={18} variant="mono" className="text-faint" />
      </header>

      {/* Hero visual (identidade Rise) */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{
          background: `radial-gradient(130% 120% at 50% 0%, color-mix(in srgb, ${v.accent} 26%, transparent), var(--color-void) 72%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            opacity: 0.5,
            maskImage:
              "radial-gradient(120% 100% at 50% 40%, black, transparent 75%)",
          }}
        />
        <RiseMark
          size={260}
          className="pointer-events-none absolute -bottom-16 -right-14 opacity-[0.07]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: v.accent }}
          >
            {v.kicker}
          </span>
          <span
            className={`font-display mt-2 font-semibold leading-[0.95] text-snow ${
              isTituloLongo ? "text-4xl" : "text-6xl"
            }`}
            style={{
              textShadow: `0 0 40px color-mix(in srgb, ${v.accent} 40%, transparent)`,
            }}
          >
            {v.titulo}
          </span>
          {v.sub && (
            <span className="mt-3 text-sm font-medium text-muted">{v.sub}</span>
          )}
        </div>
      </div>

      {/* Ações + legenda */}
      <div className="px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={onForca}
          aria-pressed={item.deiForca}
          aria-label={item.deiForca ? "Retirar força" : "Dar força"}
          className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3.5 py-2 text-sm font-semibold transition-colors ${
            item.deiForca
              ? "border-brand bg-brand/10 text-brand"
              : "border-line bg-surface text-muted hover:text-snow"
          }`}
        >
          <ChevronUpIcon size={16} />
          {item.forcas > 0 ? `${item.forcas} Força` : "Força"}
        </button>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-snow">{item.displayName}</span>{" "}
          {fraseDoMarco(item.type, item.payload)}
        </p>
      </div>
    </article>
  );
}
