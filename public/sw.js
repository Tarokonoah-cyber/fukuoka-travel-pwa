const VERSION = "fukuoka-pwa-2c-20260713";
const PAGE_CACHE = `${VERSION}-pages`;
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const TILE_CACHE = `${VERSION}-tiles`;
const API_CACHE = `${VERSION}-api`;

const OFFLINE_PAGES = [
  "/",
  "/today",
  "/itinerary",
  "/map",
  "/weather",
  "/currency",
  "/packing",
  "/shopping",
  "/wishlist",
  "/transport",
  "/documents",
  "/emergency",
  "/settings",
];

const CACHE_PREFIXES = ["fukuoka-pwa-"];
const MAX_TILE_ENTRIES = 80;
const MAX_API_ENTRIES = 12;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) =>
      Promise.allSettled(
        OFFLINE_PAGES.map((url) =>
          cache.add(new Request(url, { cache: "reload" }))
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)) && !key.startsWith(VERSION))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (request.mode === "navigate" || (OFFLINE_PAGES.includes(url.pathname) && acceptsHtml)) {
    event.respondWith(networkFirst(request, PAGE_CACHE, "/"));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (url.origin === self.location.origin && isImageRequest(request, url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(cacheFirst(request, TILE_CACHE, MAX_TILE_ENTRIES));
    return;
  }

  if (url.hostname === "api.open-meteo.com" || url.hostname === "api.frankfurter.dev") {
    event.respondWith(networkFirst(request, API_CACHE, undefined, MAX_API_ENTRIES));
  }
});

async function networkFirst(request, cacheName, fallbackUrl, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      await cache.put(request, response.clone());
      if (maxEntries) await trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
      if (isCacheable(response)) cache.put(request, response.clone());
      return response;
    });
  if (cached) {
    network.catch(() => undefined);
    return cached;
  }
  try {
    return await network;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      await cache.put(request, response.clone());
      if (maxEntries) await trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

function isCacheable(response) {
  return response && (response.ok || response.type === "opaque");
}

function isImageRequest(request, url) {
  return request.destination === "image" || /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
}
