/* FORGE Service Worker v2
 * - index.html + sw.js + manifest.json → NETWORK ONLY (always fresh)
 * - CDN assets → cache-first
 * - Firebase → network-only
 * v2 change: index.html is NEVER cached, fixes stuck-cache after redeploy.
 */

const CACHE = 'forge-v2-cdn-only';
const CDN_HOSTS = ['cdn.jsdelivr.net', 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com')) {
    return;
  }

  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      caches.match(req).then(hit => {
        if (hit) return hit;
        return fetch(req).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return resp;
        }).catch(() => hit);
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => {
        return caches.match(req) || new Response('Offline', { status: 503 });
      })
    );
    return;
  }
});
