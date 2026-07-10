"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { BellIcon } from "./icons";

/** Converte a chave pública VAPID (base64url) no formato do PushManager. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Liga/desliga Web Push neste navegador. Aparece só quando o servidor tem
 * VAPID configurado e o navegador suporta push. Opt-in explícito, opt-out em
 * 1 toque — notificação é convite, nunca imposição (canon: sem dark patterns).
 */
export function PushToggle() {
  const chave = trpc.push.publicKey.useQuery();
  const subscribe = trpc.push.subscribe.useMutation();
  const unsubscribe = trpc.push.unsubscribe.useMutation();
  const [suportado, setSuportado] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSuportado(ok);
    if (!ok) return;
    void navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setAtivo(!!sub);
    });
  }, []);

  if (!suportado || !chave.data?.key) return null;

  async function alternar() {
    setOcupado(true);
    setErro(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const atual = await reg.pushManager.getSubscription();

      if (atual) {
        await unsubscribe.mutateAsync({ endpoint: atual.endpoint });
        await atual.unsubscribe();
        setAtivo(false);
        return;
      }

      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setErro("Permissão negada no navegador.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(chave.data!.key!) as BufferSource,
      });
      const json = sub.toJSON();
      await subscribe.mutateAsync({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      setAtivo(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao configurar o push.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-[20px] border border-line bg-surface-2 px-5 py-4">
      <div className="flex items-center gap-3">
        <BellIcon size={18} className="shrink-0 text-muted" />
        <div>
          <p className="text-sm font-semibold text-snow">
            Notificações no navegador
          </p>
          <p className="text-xs text-muted">
            Seguidor novo e Força recebida — mesmo com o Rise fechado.
          </p>
          {erro && <p className="mt-1 text-xs text-red-400">{erro}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void alternar()}
        disabled={ocupado}
        aria-pressed={ativo}
        className={`shrink-0 rounded-[var(--radius-pill)] border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
          ativo
            ? "border-brand bg-brand/10 text-brand"
            : "border-line bg-surface text-muted hover:text-snow"
        }`}
      >
        {ocupado ? "…" : ativo ? "Ativadas" : "Ativar"}
      </button>
    </div>
  );
}
