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

// Passthrough: garante fetch handler (instalabilidade) sem interferir no app.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
