"use client";

import { useEffect } from "react";

/** Registra o service worker (instalabilidade PWA). No-op sem suporte. */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}
