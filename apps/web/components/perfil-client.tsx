"use client";

import { useState, type FormEvent } from "react";
import { CLASS_CATALOG, classePorId, tituloDaClasse, cosmeticoPorId } from "@rise/core";
import { trpc } from "@/lib/trpc/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar } from "./avatar";
import { cssColor } from "./area-card";
import Link from "next/link";
import { CameraIcon, CheckIcon, CrownIcon, LockIcon, XIcon } from "./icons";

const COR_RARIDADE: Record<string, string> = {
  comum: "var(--color-muted)",
  rara: "#60a5fa",
  epica: "#a78bfa",
  lendaria: "#fbbf24",
};

async function uploadAvatar(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Sessão expirada — entre de novo.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${uid}/avatar-${Date.now()}.${ext}`;
  // Sem upsert: o caminho de upsert do Storage falha o RLS (403). Nome é único.
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Falha no upload: ${error.message}`);
  return path;
}

export function PerfilClient() {
  const utils = trpc.useUtils();
  const perfil = trpc.profile.get.useQuery();
  const [nome, setNome] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      setMsg("Perfil salvo.");
      void utils.profile.get.invalidate();
      void utils.progress.me.invalidate();
    },
    onError: (e) => setErro(e.message),
    onSettled: () => setSalvando(false),
  });
  const [editandoHandle, setEditandoHandle] = useState(false);
  const [handleInput, setHandleInput] = useState("");
  const [handleErro, setHandleErro] = useState<string | null>(null);
  const updateHandle = trpc.profile.updateHandle.useMutation({
    onSuccess: () => {
      setEditandoHandle(false);
      setHandleErro(null);
      void utils.profile.get.invalidate();
    },
    onError: (e) => setHandleErro(e.message),
  });
  const equip = trpc.profile.equip.useMutation({
    onSettled: () => {
      void utils.profile.get.invalidate();
      void utils.progress.me.invalidate();
    },
  });

  if (!perfil.data) {
    return <div className="h-72 animate-pulse rounded-[20px] bg-surface" />;
  }
  const p = perfil.data;
  const nomeAtual = nome ?? p.displayName;
  const bioAtual = bio ?? p.bio ?? "";
  const frames = p.owned.filter((o) => o.kind === "frame");
  const temas = p.owned.filter((o) => o.kind === "theme");
  const frameEquipado = p.owned.find((o) => o.id === p.equippedFrameId);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);
    setErro(null);
    update.mutate({ displayName: nomeAtual.trim(), bio: bioAtual.trim() });
  }

  async function onFoto(file: File | null) {
    if (!file) return;
    setSalvando(true);
    setErro(null);
    try {
      const path = await uploadAvatar(file);
      update.mutate({ avatarPath: path });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no upload.");
      setSalvando(false);
    }
  }

  const bgDef = cosmeticoPorId(p.equippedProfileBgId);
  const bgGradient = bgDef
    ? `linear-gradient(135deg, ${((bgDef.preview as { gradient?: string[] }).gradient ?? []).join(", ")})`
    : undefined;
  const titleDef = cosmeticoPorId(p.equippedTitleId);

  return (
    <div className="space-y-8">
      {/* Identidade */}
      <section
        className="relative overflow-hidden rounded-[24px] border border-line bg-surface-2 p-6"
        style={bgGradient ? { background: bgGradient } : undefined}
      >
        <div className="flex items-center gap-5">
          <Avatar
            nome={nomeAtual}
            avatarPath={p.avatarUrl}
            frameColors={(frameEquipado?.preview as { colors?: string[] })?.colors}
            size={72}
          />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-snow">
              {nomeAtual}
            </p>
            {titleDef && (
              <p
                className="font-display text-xs font-semibold"
                style={{ color: (titleDef.preview as { cor?: string }).cor ?? "var(--color-brand)" }}
              >
                {titleDef.name}
              </p>
            )}
            {editandoHandle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateHandle.mutate({ handle: handleInput });
                }}
                className="mt-1 flex items-center gap-1.5"
              >
                <span className="text-sm text-muted">@</span>
                <input
                  autoFocus
                  value={handleInput}
                  maxLength={20}
                  onChange={(e) =>
                    setHandleInput(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                    )
                  }
                  className="tnum w-36 rounded-lg border border-line bg-surface px-2 py-1 text-sm text-snow outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={updateHandle.isPending}
                  className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-void disabled:opacity-50"
                >
                  <CheckIcon size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditandoHandle(false);
                    setHandleErro(null);
                  }}
                  className="rounded-lg border border-line px-2 py-1 text-xs text-muted"
                >
                  <XIcon size={13} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setHandleInput(p.handle);
                  setEditandoHandle(true);
                }}
                className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-snow"
              >
                @{p.handle}
                <span className="text-[11px] text-faint group-hover:text-brand">
                  editar
                </span>
              </button>
            )}
            {handleErro && (
              <p className="mt-1 text-xs text-red-400">{handleErro}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-snow">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void onFoto(e.target.files?.[0] ?? null)}
                />
                <CameraIcon size={14} />
                Trocar foto
              </label>
              <a
                href={`/u/${p.handle}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-snow"
              >
                Ver página pública
              </a>
              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/u/${p.handle}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `${nomeAtual} no Rise`,
                        text: "Meu progresso no Rise:",
                        url,
                      });
                      return;
                    } catch {
                      // cancelado → cai no copiar
                    }
                  }
                  await navigator.clipboard.writeText(url);
                  setMsg("Link copiado.");
                }}
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-snow"
              >
                Compartilhar
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nome" className="text-xs font-medium text-muted">
              Nome de exibição
            </label>
            <input
              id="nome"
              value={nomeAtual}
              minLength={2}
              maxLength={40}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="bio" className="text-xs font-medium text-muted">
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              maxLength={280}
              value={bioAtual}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Quem é você e para onde está subindo?"
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-brand"
            />
            <p className="tnum mt-1 text-right text-[11px] text-faint">
              {bioAtual.length}/280
            </p>
          </div>
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          {msg && <p className="text-sm text-brand">{msg}</p>}
          <button
            type="submit"
            disabled={salvando}
            className="rounded-xl bg-brand px-6 py-3 font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar perfil"}
          </button>
        </form>
      </section>

      {/* Plano Rise+ */}
      <PlanoRise />

      {/* Classe principal */}
      <ClassePrincipal atual={p.mainClassId} />

      {/* Conquistas */}
      <Conquistas />

      {/* Modo Descanso */}
      <ModoDescanso />

      {/* Cosméticos possuídos */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Seus cosméticos
        </h2>
        {p.owned.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Você ainda não tem cosméticos. Ganhe Faíscas nas missões e visite a
            Loja.
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {frames.length > 0 && (
              <GrupoEquip
                titulo="Molduras"
                itens={frames}
                equipado={p.equippedFrameId}
                onEquipar={(id) => equip.mutate({ kind: "frame", itemId: id })}
              />
            )}
            {temas.length > 0 && (
              <GrupoEquip
                titulo="Temas"
                itens={temas}
                equipado={p.equippedThemeId}
                onEquipar={(id) => equip.mutate({ kind: "theme", itemId: id })}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function PlanoRise() {
  const status = trpc.subscription.status.useQuery();
  const premium = status.data?.isPremium ?? false;
  const plano = status.data?.plan;
  const rotulo =
    plano === "founder" ? "Rise Founder" : plano === "team" ? "Rise Teams" : "Rise+";

  return (
    <section
      className={`rounded-[24px] border p-6 ${
        premium
          ? "border-brand/50 bg-brand/[0.06]"
          : "border-line bg-surface-2"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-snow">
            <CrownIcon size={16} className={premium ? "text-brand" : "text-faint"} />
            {premium ? rotulo : "Rise+"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {premium
              ? "Coach ilimitado, Análise Profunda semanal e estatísticas profundas — ativos."
              : "Aprofunde sua evolução: Coach ilimitado, Análise Profunda semanal e estatísticas profundas. Sua progressão continua grátis."}
          </p>
        </div>
      </div>
      <Link
        href="/rise-plus"
        className={`mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] ${
          premium
            ? "border border-line bg-surface text-snow hover:border-brand"
            : "bg-brand text-void"
        }`}
      >
        {premium ? "Gerenciar plano" : "Conhecer o Rise+"}
      </Link>
    </section>
  );
}

function ClassePrincipal({ atual }: { atual: string | null }) {
  const utils = trpc.useUtils();
  const [erro, setErro] = useState<string | null>(null);
  const set = trpc.profile.setMainClass.useMutation({
    onSuccess: () => {
      setErro(null);
      void utils.profile.get.invalidate();
      void utils.progress.me.invalidate();
    },
    onError: (e) => setErro(e.message),
  });
  const me = trpc.progress.me.useQuery();
  const escolhida = classePorId(atual);
  const nivelAfim = escolhida
    ? (me.data?.areas.find((a) => a.catalogId === escolhida.areaAfim)?.nivel ?? 0)
    : 0;
  const titulo = escolhida ? tituloDaClasse(escolhida, nivelAfim) : null;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Classe principal
        </h2>
        {escolhida && (
          <button
            type="button"
            onClick={() => set.mutate({ classId: null })}
            className="text-xs text-muted transition-colors hover:text-snow"
          >
            remover
          </button>
        )}
      </div>

      {escolhida ? (
        <div
          className="mt-3 rounded-[20px] border p-5"
          style={{
            borderColor: `color-mix(in srgb, ${cssColor(escolhida.colorToken)} 35%, transparent)`,
            background: `color-mix(in srgb, ${cssColor(escolhida.colorToken)} 7%, transparent)`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className="font-display text-lg font-semibold"
              style={{ color: cssColor(escolhida.colorToken) }}
            >
              {escolhida.nome}
            </p>
            <span
              className="rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold text-void"
              style={{ background: cssColor(escolhida.colorToken) }}
            >
              {titulo}
            </span>
          </div>
          <p className="mt-1.5 text-sm italic text-muted">“{escolhida.lema}”</p>
          <p className="mt-2 text-xs leading-relaxed text-faint">
            Título evolui com seu progresso na Área afim (nível {nivelAfim}).
            Identidade, não vantagem — a Classe nunca concede XP.
          </p>
        </div>
      ) : (
        <p className="mt-2 max-w-prose text-sm text-muted">
          Declare quem você é. Identidade, não vantagem — a Classe nunca concede XP.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CLASS_CATALOG.map((c) => {
          const ativo = c.id === atual;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => set.mutate({ classId: ativo ? null : c.id })}
              aria-pressed={ativo}
              title={c.descricao}
              className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-2 text-xs font-medium transition-colors ${
                ativo
                  ? "border-brand bg-brand/10 text-snow"
                  : "border-line bg-surface text-muted hover:text-snow"
              }`}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: cssColor(c.colorToken) }}
              />
              <span className="truncate">{c.nome}</span>
            </button>
          );
        })}
      </div>
      {erro && (
        <p className="mt-2 text-xs" style={{ color: "#f87171" }}>
          {erro}
        </p>
      )}
    </section>
  );
}

function Conquistas() {
  const conquistas = trpc.profile.achievements.useQuery();
  if (!conquistas.data) {
    return <div className="h-40 animate-pulse rounded-[20px] bg-surface" />;
  }
  const desbloqueadas = conquistas.data.filter((c) => c.unlockedAt);
  const bloqueadas = conquistas.data.filter((c) => !c.unlockedAt);

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Conquistas
        </h2>
        <span className="tnum text-xs text-muted">
          {desbloqueadas.length}/{conquistas.data.length}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {desbloqueadas.map((c) => {
          const cor = COR_RARIDADE[c.raridade] ?? "var(--color-muted)";
          return (
            <div
              key={c.id}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-4"
              style={{
                boxShadow: `inset 3px 0 0 0 ${cor}`,
              }}
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
              <p className="tnum mt-1.5 text-[11px] text-faint">
                {new Date(c.unlockedAt!).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          );
        })}
        {bloqueadas.map((c) => (
          <div
            key={c.id}
            className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-4 opacity-60"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-muted">{c.nome}</p>
              <LockIcon size={13} className="shrink-0 text-faint" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-faint">
              {c.criterio}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModoDescanso() {
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const toggle = trpc.progress.restMode.useMutation({
    onSettled: () => void utils.progress.me.invalidate(),
  });
  const ativo = me.data?.restModeUntil
    ? new Date(me.data.restModeUntil)
    : null;

  return (
    <section className="rounded-[24px] border border-line bg-surface-2 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
        Modo Descanso
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Viagem, doença, vida acontecendo? Pause de propósito: sua sequência{" "}
        <span className="font-semibold text-snow">congela em vez de quebrar</span>{" "}
        — sem custo, sem culpa. Descanso também é evolução.
      </p>
      {ativo ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-[var(--radius-pill)] border border-brand bg-brand/10 px-3.5 py-2 text-xs font-semibold text-brand">
            Ativo até{" "}
            {ativo.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
          <button
            type="button"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ ateDias: null })}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-snow disabled:opacity-50"
          >
            Voltar da pausa
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {[3, 7, 14].map((d) => (
            <button
              key={d}
              type="button"
              disabled={toggle.isPending}
              onClick={() => toggle.mutate({ ateDias: d })}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-brand hover:text-snow disabled:opacity-50"
            >
              Pausar {d} dias
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function GrupoEquip({
  titulo,
  itens,
  equipado,
  onEquipar,
}: {
  titulo: string;
  itens: { id: string; name: string; preview: unknown }[];
  equipado: string | null;
  onEquipar: (id: string | null) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{titulo}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {itens.map((i) => {
          const ativo = i.id === equipado;
          const prev = i.preview as { colors?: string[]; accent?: string };
          const cor = prev.colors?.[0] ?? prev.accent ?? "var(--color-brand)";
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onEquipar(ativo ? null : i.id)}
              className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3.5 py-2 text-xs font-medium transition-colors ${
                ativo
                  ? "border-brand bg-brand/10 text-snow"
                  : "border-line bg-surface text-muted hover:text-snow"
              }`}
            >
              <span
                className="size-3 rounded-full"
                style={{ background: cor }}
              />
              {i.name}
              {ativo && <CheckIcon size={13} className="text-brand" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
