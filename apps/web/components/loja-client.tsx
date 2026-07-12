"use client";

import { useMemo, useState } from "react";
import { RARITY_META, CATEGORY_META, type Rarity } from "@rise/core";
import { trpc } from "@/lib/trpc/react";
import { frameGradient } from "./avatar";
import {
  SparkIcon,
  CheckIcon,
  StarIcon,
  SearchIcon,
  XIcon,
  LockIcon,
} from "./icons";

const nf = new Intl.NumberFormat("pt-BR");
const df = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });

type Categoria = "frame" | "theme" | "profileBg" | "title" | "badge";
interface Item {
  id: string;
  name: string;
  category: Categoria;
  rarity: Rarity;
  preview: Record<string, unknown>;
  desc: string | null;
  precoBase: number;
  preco: number;
  emDestaque: boolean;
  evento: string | null;
  compravel: boolean;
  owned: boolean;
  favorito: boolean;
}

type Ordenar = "relevancia" | "barato" | "caro" | "raridade";
type Filtro = "todos" | "favoritos" | "naoComprados" | "promocao" | "eventos" | "possuidos";

const CATS: { id: Categoria | "todos"; label: string }[] = [
  { id: "todos", label: "Tudo" },
  { id: "frame", label: CATEGORY_META.frame.label },
  { id: "theme", label: CATEGORY_META.theme.label },
  { id: "profileBg", label: CATEGORY_META.profileBg.label },
  { id: "title", label: CATEGORY_META.title.label },
  { id: "badge", label: CATEGORY_META.badge.label },
];

export function LojaClient() {
  const utils = trpc.useUtils();
  const catalog = trpc.shop.catalog.useQuery();
  const perfil = trpc.profile.get.useQuery();
  const [cat, setCat] = useState<Categoria | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [ordenar, setOrdenar] = useState<Ordenar>("relevancia");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [sel, setSel] = useState<Item | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [verHistorico, setVerHistorico] = useState(false);

  const invalidar = () => {
    void utils.shop.catalog.invalidate();
    void utils.profile.get.invalidate();
    void utils.progress.me.invalidate();
  };
  const buy = trpc.shop.buy.useMutation({
    onSuccess: (r) => {
      setErro(null);
      setToast(`Item adquirido — ${r.precoPago} Faíscas.`);
      window.setTimeout(() => setToast(null), 2400);
      setSel(null);
    },
    onError: (e) => setErro(e.message),
    onSettled: invalidar,
  });
  const favoritar = trpc.shop.favoritar.useMutation({
    onSettled: () => void utils.shop.catalog.invalidate(),
  });
  const equip = trpc.profile.equip.useMutation({
    onSettled: () => {
      void utils.profile.get.invalidate();
      void utils.progress.me.invalidate();
    },
  });

  const equipadoDe = useMemo(() => {
    const p = perfil.data;
    return {
      frame: p?.equippedFrameId ?? null,
      theme: p?.equippedThemeId ?? null,
      profileBg: p?.equippedProfileBgId ?? null,
      title: p?.equippedTitleId ?? null,
      badge: p?.equippedBadgeSlug ?? null,
    } as Record<Categoria, string | null>;
  }, [perfil.data]);

  const itens = (catalog.data?.itens ?? []) as Item[];
  const visiveis = useMemo(() => {
    let list = itens;
    if (cat !== "todos") list = list.filter((i) => i.category === cat);
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          RARITY_META[i.rarity].label.toLowerCase().includes(q) ||
          CATEGORY_META[i.category].label.toLowerCase().includes(q),
      );
    }
    if (filtro === "favoritos") list = list.filter((i) => i.favorito);
    else if (filtro === "naoComprados") list = list.filter((i) => !i.owned);
    else if (filtro === "possuidos") list = list.filter((i) => i.owned);
    else if (filtro === "promocao") list = list.filter((i) => i.emDestaque);
    else if (filtro === "eventos") list = list.filter((i) => i.evento);

    const arr = [...list];
    if (ordenar === "barato") arr.sort((a, b) => a.preco - b.preco);
    else if (ordenar === "caro") arr.sort((a, b) => b.preco - a.preco);
    else if (ordenar === "raridade")
      arr.sort((a, b) => RARITY_META[b.rarity].ordem - RARITY_META[a.rarity].ordem);
    return arr;
  }, [itens, cat, busca, filtro, ordenar]);

  if (!catalog.data) {
    return <div className="h-96 animate-pulse rounded-[24px] bg-surface-2" />;
  }
  const { saldo, colecoes, eventoAtivo, descontoDestaque } = catalog.data;

  return (
    <div className="space-y-6">
      {/* Saldo + promessa */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface-2 px-5 py-4">
        <p className="text-sm text-muted">
          Faíscas compram <span className="font-semibold text-snow">aparência</span>,
          nunca progresso. Ganhe nas missões e temporadas.
        </p>
        <span className="tnum inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border border-brand/40 bg-brand/10 px-3.5 py-1.5 text-sm font-semibold text-snow">
          <SparkIcon size={14} className="text-brand" />
          {nf.format(saldo)}
        </span>
      </div>

      {eventoAtivo && (
        <div className="rounded-[16px] border border-brand/40 bg-brand/[0.06] px-4 py-2.5 text-sm text-brand">
          Evento ativo: itens exclusivos disponíveis por tempo limitado.
        </div>
      )}

      {/* Coleções */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Coleções
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {colecoes.map((c) => {
            const pct = c.total > 0 ? Math.round((c.owned / c.total) * 100) : 0;
            return (
              <button
                key={c.category}
                type="button"
                onClick={() => setCat(c.category as Categoria)}
                className="rounded-[var(--radius-card)] border border-line bg-surface p-3 text-left transition-colors hover:border-brand/50"
              >
                <p className="truncate text-xs font-semibold text-snow">
                  {CATEGORY_META[c.category as Categoria].label}
                </p>
                <p className="tnum mt-1 text-[11px] text-faint">
                  {c.owned}/{c.total}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-graphite">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Destaques do dia */}
      <Destaques
        itens={itens.filter((i) => i.emDestaque)}
        desconto={descontoDestaque}
        onAbrir={setSel}
      />

      {/* Controles */}
      <div className="space-y-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={cat === c.id}
              className={`shrink-0 whitespace-nowrap rounded-[var(--radius-pill)] px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                cat === c.id ? "bg-surface text-snow" : "text-muted hover:text-snow"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, categoria, raridade…"
              className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-snow outline-none transition-colors focus:border-brand"
            />
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            aria-label="Filtrar"
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-medium text-muted outline-none focus:border-brand"
          >
            <option value="todos">Todos</option>
            <option value="naoComprados">Não comprados</option>
            <option value="possuidos">Meus itens</option>
            <option value="favoritos">Favoritos</option>
            <option value="promocao">Em promoção</option>
            <option value="eventos">Eventos</option>
          </select>
          <select
            value={ordenar}
            onChange={(e) => setOrdenar(e.target.value as Ordenar)}
            aria-label="Ordenar"
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-medium text-muted outline-none focus:border-brand"
          >
            <option value="relevancia">Relevância</option>
            <option value="barato">Mais baratos</option>
            <option value="caro">Mais caros</option>
            <option value="raridade">Raridade</option>
          </select>
        </div>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {/* Grade */}
      {visiveis.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          Nenhum item com esses filtros.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visiveis.map((i) => (
            <ItemCard
              key={i.id}
              item={i}
              equipado={equipadoDe[i.category] === i.id}
              saldo={saldo}
              onAbrir={() => setSel(i)}
              onFav={() => favoritar.mutate({ itemId: i.id })}
            />
          ))}
        </div>
      )}

      {/* Histórico */}
      <div>
        <button
          type="button"
          onClick={() => setVerHistorico((v) => !v)}
          className="text-sm font-semibold text-muted transition-colors hover:text-snow"
        >
          {verHistorico ? "Ocultar histórico de compras" : "Ver histórico de compras"}
        </button>
        {verHistorico && <Historico />}
      </div>

      <p className="text-center text-[11px] text-faint">
        Preços sempre visíveis. Sem caixas de recompensa, sem odds ocultas, sem
        pay-to-win — regra da casa.
      </p>

      {/* Modal de preview */}
      {sel && (
        <PreviewModal
          item={sel}
          saldo={saldo}
          equipado={equipadoDe[sel.category] === sel.id}
          comprando={buy.isPending}
          equipando={equip.isPending}
          onClose={() => setSel(null)}
          onBuy={() => buy.mutate({ itemId: sel.id })}
          onFav={() => favoritar.mutate({ itemId: sel.id })}
          onEquip={() =>
            equip.mutate({
              kind: sel.category,
              itemId: equipadoDe[sel.category] === sel.id ? null : sel.id,
            })
          }
        />
      )}

      {toast && (
        <div className="animate-rise-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--radius-pill)] border border-brand/40 bg-surface-2 px-4 py-2.5 text-sm font-medium text-brand shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/** Render visual de um cosmético conforme a categoria. */
function Preview({ item, size = 44 }: { item: Item; size?: number }) {
  const p = item.preview as {
    colors?: string[];
    accent?: string;
    strong?: string;
    gradient?: string[];
    text?: string;
    cor?: string;
  };
  if (item.category === "frame") {
    const g = frameGradient(p.colors) ?? "var(--color-brand)";
    return (
      <span style={{ background: g, padding: 3, borderRadius: 9999 }} className="inline-block">
        <span
          style={{ width: size, height: size, borderRadius: 9999, background: "var(--color-void)" }}
          className="block"
        />
      </span>
    );
  }
  if (item.category === "theme") {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${p.accent}, ${p.strong})`,
        }}
        className="inline-block"
      />
    );
  }
  if (item.category === "profileBg") {
    return (
      <span
        style={{
          width: size * 1.6,
          height: size,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${(p.gradient ?? []).join(", ")})`,
        }}
        className="inline-block border border-line"
      />
    );
  }
  if (item.category === "title") {
    return (
      <span className="font-display text-base font-semibold" style={{ color: p.cor ?? "var(--color-snow)" }}>
        {p.text ?? item.name}
      </span>
    );
  }
  // badge
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: frameGradient(p.colors) ?? "var(--color-brand)" }}
    >
      <SparkIcon size={size * 0.4} className="text-void" />
    </span>
  );
}

function RarityChip({ rarity }: { rarity: Rarity }) {
  const m = RARITY_META[rarity];
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ color: m.cor, background: `color-mix(in srgb, ${m.cor} 15%, transparent)` }}
    >
      {m.label}
    </span>
  );
}

function ItemCard({
  item,
  equipado,
  saldo,
  onAbrir,
  onFav,
}: {
  item: Item;
  equipado: boolean;
  saldo: number;
  onAbrir: () => void;
  onFav: () => void;
}) {
  const semSaldo = !item.owned && saldo < item.preco;
  return (
    <div className="group relative flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-3 transition-colors hover:border-brand/40">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFav();
        }}
        aria-label={item.favorito ? "Remover dos favoritos" : "Favoritar"}
        className="absolute right-2 top-2 z-10 text-faint transition-colors hover:text-brand"
      >
        <StarIcon size={15} filled={item.favorito} className={item.favorito ? "text-brand" : ""} />
      </button>

      <button
        type="button"
        onClick={onAbrir}
        className="flex flex-1 flex-col items-center gap-3 pt-2"
        aria-label={`Ver ${item.name}`}
      >
        <div className="flex h-16 items-center justify-center">
          <Preview item={item} />
        </div>
        <div className="w-full text-center">
          <p className="truncate text-sm font-semibold text-snow">{item.name}</p>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <RarityChip rarity={item.rarity} />
          </div>
        </div>
      </button>

      <div className="mt-3">
        {item.owned ? (
          <span className="flex items-center justify-center gap-1.5 rounded-lg bg-brand/10 py-1.5 text-xs font-semibold text-brand">
            {equipado ? <><CheckIcon size={13} /> Equipado</> : "No inventário"}
          </span>
        ) : !item.compravel ? (
          <span className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-xs font-medium text-faint">
            <LockIcon size={12} /> {item.evento ? "Evento" : "Indisponível"}
          </span>
        ) : (
          <button
            type="button"
            onClick={onAbrir}
            disabled={semSaldo}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand py-1.5 text-xs font-semibold text-void transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          >
            {item.emDestaque && (
              <span className="tnum text-void/60 line-through">{item.precoBase}</span>
            )}
            <span className="tnum">{item.preco}</span>
            <SparkIcon size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewModal({
  item,
  saldo,
  equipado,
  comprando,
  equipando,
  onClose,
  onBuy,
  onFav,
  onEquip,
}: {
  item: Item;
  saldo: number;
  equipado: boolean;
  comprando: boolean;
  equipando: boolean;
  onClose: () => void;
  onBuy: () => void;
  onFav: () => void;
  onEquip: () => void;
}) {
  const semSaldo = !item.owned && saldo < item.preco;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-void/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        className="animate-pop-in w-full max-w-md rounded-t-[24px] border border-line bg-surface-2 p-6 sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <RarityChip rarity={item.rarity} />
            <span className="text-xs text-faint">{CATEGORY_META[item.category].label}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted hover:text-snow">
            <XIcon size={16} />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-4">
          <div className="flex h-28 items-center justify-center">
            <Preview item={item} size={88} />
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-snow">{item.name}</p>
            {item.desc && <p className="mt-1 text-sm text-muted">{item.desc}</p>}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {item.owned ? (
            <button
              type="button"
              onClick={onEquip}
              disabled={equipando}
              className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {equipado ? "Desequipar" : "Equipar"}
            </button>
          ) : item.compravel ? (
            <button
              type="button"
              onClick={onBuy}
              disabled={comprando || semSaldo}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-3 text-sm font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
            >
              {comprando ? "Comprando…" : semSaldo ? "Faíscas insuficientes" : (
                <>
                  Comprar por
                  {item.emDestaque && <span className="tnum text-void/60 line-through">{item.precoBase}</span>}
                  <span className="tnum">{item.preco}</span>
                  <SparkIcon size={13} />
                </>
              )}
            </button>
          ) : (
            <span className="flex-1 rounded-xl border border-line py-3 text-center text-sm text-faint">
              {item.evento ? "Volta no próximo evento" : "Indisponível"}
            </span>
          )}
          <button
            type="button"
            onClick={onFav}
            aria-label={item.favorito ? "Remover dos favoritos" : "Favoritar"}
            className="rounded-xl border border-line px-3.5 py-3 text-faint transition-colors hover:text-brand"
          >
            <StarIcon size={18} filled={item.favorito} className={item.favorito ? "text-brand" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Historico() {
  const h = trpc.shop.historico.useQuery();
  if (!h.data) {
    return <div className="mt-4 h-24 animate-pulse rounded-[16px] bg-surface" />;
  }
  if (h.data.length === 0) {
    return <p className="mt-4 text-sm text-muted">Nenhuma compra ainda.</p>;
  }
  return (
    <ul className="mt-4 space-y-2">
      {h.data.map((it) => (
        <li
          key={it.id}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-2.5 text-sm"
        >
          <span className="flex items-center gap-2">
            <RarityChip rarity={it.rarity as Rarity} />
            <span className="font-medium text-snow">{it.name}</span>
            <span className="text-xs text-faint">{CATEGORY_META[it.category as Categoria].label}</span>
          </span>
          <span className="flex items-center gap-3 text-xs text-muted">
            <span className="tnum inline-flex items-center gap-1">
              {it.preco}
              <SparkIcon size={10} className="text-brand" />
            </span>
            <span className="tnum text-faint">{df.format(new Date(it.acquiredAt))}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Destaques({
  itens,
  desconto,
  onAbrir,
}: {
  itens: Item[];
  desconto: number;
  onAbrir: (i: Item) => void;
}) {
  if (itens.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Destaques do dia
        </h2>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
          −{desconto}%
        </span>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {itens.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => onAbrir(i)}
            className="flex w-32 shrink-0 flex-col items-center gap-2.5 rounded-[var(--radius-card)] border border-brand/30 bg-surface p-3 transition-colors hover:border-brand/60"
          >
            <div className="flex h-14 items-center justify-center">
              <Preview item={i} size={40} />
            </div>
            <p className="w-full truncate text-center text-xs font-semibold text-snow">{i.name}</p>
            <span className="tnum inline-flex items-center gap-1 text-xs font-semibold text-brand">
              {i.preco}
              <SparkIcon size={10} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
