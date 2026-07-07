/* BC CLUBE Service Worker — production PWA cache */
const VERSION = "bc-clube-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const PRECACHE_URLS = ["/", "/favicon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function shouldBypass(url) {
  // OAuth broker MUST always hit network — never intercept.
  if (url.pathname.startsWith("/~oauth")) return true;
  // API routes, auth callbacks, server functions.
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/_serverFn")) return true;
  // Supabase and third-party origins.
  if (url.origin !== self.location.origin) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (shouldBypass(url)) return;

  // HTML navigations — network-first with offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone()).catch(() => undefined);
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || (await caches.match("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  // Static assets — cache-first, then network.
  if (["style", "script", "image", "font"].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type === "basic") {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(req, res.clone()).catch(() => undefined);
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
  }
});
