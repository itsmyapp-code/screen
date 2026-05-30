/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'page-cache-v1',
    networkTimeoutSeconds: 4,
  }),
)

registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new NetworkFirst({
    cacheName: 'asset-cache-v2',
    networkTimeoutSeconds: 3,
  }),
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'image-cache-v1' }),
)
