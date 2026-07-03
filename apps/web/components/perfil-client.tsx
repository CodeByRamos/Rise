"use client";

import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar } from "./avatar";
import { CameraIcon, CheckIcon } from "./icons";

async function uploadAvatar(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Sessão expirada — entre de novo.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${uid}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });
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

  return (
    <div className="space-y-8">
      {/* Identidade */}
      <section className="rounded-[24px] border border-line bg-surface-2 p-6">
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
            <p className="truncate text-sm text-muted">@{p.handle}</p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-snow">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onFoto(e.target.files?.[0] ?? null)}
              />
              <CameraIcon size={14} />
              Trocar foto
            </label>
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
