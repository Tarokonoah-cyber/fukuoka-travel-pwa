/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  type PrecacheEntry,
  type RuntimeCaching,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const privateRoutes: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && (url.pathname.startsWith("/expenses") || url.pathname.startsWith("/api/")),
    method: "GET",
    handler: new NetworkOnly(),
  },
];

const travelRuntimeCache: RuntimeCaching[] = [
  {
    matcher: ({ url }) => url.hostname.endsWith("tile.openstreetmap.org"),
    handler: new CacheFirst({
      cacheName: "fukuoka-map-tiles",
      plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 14 * 24 * 60 * 60, maxAgeFrom: "last-used" })],
    }),
  },
  {
    matcher: ({ url }) => url.hostname === "api.open-meteo.com" || url.hostname === "api.frankfurter.dev",
    handler: new NetworkFirst({
      cacheName: "fukuoka-public-tools",
      networkTimeoutSeconds: 8,
      plugins: [new ExpirationPlugin({ maxEntries: 12, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" })],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: process.env.NODE_ENV === "production",
  runtimeCaching: [...privateRoutes, ...travelRuntimeCache, ...defaultCache],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

serwist.addEventListeners();
