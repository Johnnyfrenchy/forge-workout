/* FORGE Service Worker — SELF-DESTRUCTING VERSION
 * This SW's only job is to unregister itself and clear all caches.
 * If an old SW is still running in a browser, this replaces it and suicides.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});

// Pass-through fetches so nothing breaks during the suicide window
self.addEventListener('fetch', (event) => {
  // Let the browser handle all requests normally
});
