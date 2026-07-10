/**
 * Service worker do Rise — instalabilidade PWA + Web Push.
 * App é dado-vivo (progresso real): rede primeiro, sem cache agressivo.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler presente (instalabilidade) mas SEM respondWith: o browser segue a
// rede normalmente. respondWith(fetch(...)) quebrava streaming de RSC.
self.addEventListener("fetch", () => {});

// Web Push: payload JSON { title, body, url } enviado pelo servidor.
self.addEventListener("push", (event) => {
  let dados = { title: "Rise", body: "Novidade na sua evolução.", url: "/notificacoes" };
  try {
    if (event.data) dados = { ...dados, ...event.data.json() };
  } catch {
    /* payload não-JSON: usa o padrão */
  }
  event.waitUntil(
    self.registration.showNotification(dados.title, {
      body: dados.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: dados.url },
    }),
  );
});

// Toque na notificação: foca aba existente ou abre uma nova na rota.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((abas) => {
      for (const aba of abas) {
        if ("focus" in aba) {
          aba.navigate(url);
          return aba.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
