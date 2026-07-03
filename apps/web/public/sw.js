/**
 * Service worker do Rise — mínimo para instalabilidade PWA.
 * App é dado-vivo (progresso real): rede primeiro, sem cache agressivo.
 * Push nativo entra aqui numa iteração futura.
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
