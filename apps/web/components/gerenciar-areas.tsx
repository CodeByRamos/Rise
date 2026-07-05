"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { cssColor } from "./area-card";
import { PlusIcon, XIcon } from "./icons";

/** Adicionar Áreas do catálogo, criar personalizadas e arquivar. */
export function GerenciarAreas() {
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const available = trpc.area.available.useQuery();
  const cores = trpc.area.cores.useQuery();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function invalidar() {
    void utils.progress.me.invalidate();
    void utils.area.available.invalidate();
  }
  const add = trpc.area.add.useMutation({ onSettled: invalidar });
  const archive = trpc.area.archive.useMutation({ onSettled: invalidar });
  const create = trpc.area.create.useMutation({
    onSuccess: () => {
      setNome("");
      setCor(null);
      setErro(null);
      invalidar();
    },
    onError: (e) => setErro(e.message),
  });

  if (!aberto) {
    return (
      <div className="mt-10">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-snow"
        >
          <PlusIcon size={14} />
          Gerenciar Áreas da Vida
        </button>
      </div>
    );
  }

  const corSel = cor ?? cores.data?.[0] ?? "#5eead4";

  return (
    <section className="mt-10 rounded-[24px] border border-line bg-surface-2 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Gerenciar Áreas
        </h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-xs text-muted hover:text-snow"
        >
          Fechar
        </button>
      </div>

      {/* Adicionar do catálogo */}
      {(available.data?.length ?? 0) > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium text-muted">Adicionar do catálogo</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {available.data!.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={add.isPending}
                onClick={() => add.mutate({ catalogId: c.id })}
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-snow disabled:opacity-50"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: cssColor(c.cor) }}
                />
                {c.nome}
                <PlusIcon size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Criar personalizada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ nome: nome.trim(), cor: corSel as never });
        }}
        className="mt-6"
      >
        <p className="text-xs font-medium text-muted">Criar Área personalizada</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={nome}
            maxLength={24}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Música, Surf, Meditação…"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-snow outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={create.isPending || nome.trim().length < 2}
            className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-void disabled:opacity-50"
          >
            Criar
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cores.data?.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => setCor(c)}
              className={`size-6 rounded-full transition-transform ${
                corSel === c ? "ring-2 ring-snow ring-offset-2 ring-offset-surface-2" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {erro && <p className="mt-2 text-xs text-red-400">{erro}</p>}
      </form>

      {/* Arquivar existentes */}
      {(me.data?.areas.length ?? 0) > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted">
            Suas Áreas ativas (arquivar preserva o XP)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {me.data!.areas.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface px-3 py-1.5 text-xs text-snow"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: cssColor(a.cor) }}
                />
                {a.nome}
                <button
                  type="button"
                  disabled={archive.isPending}
                  onClick={() => archive.mutate({ id: a.id, arquivar: true })}
                  className="text-faint transition-colors hover:text-red-400"
                  aria-label={`Arquivar ${a.nome}`}
                  title="Arquivar"
                >
                  <XIcon size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
