// Service worker for skieta.
//
// It exists for two reasons, and deliberately not for a third:
//
// 1. Installability. A browser only offers "add to home screen" for a page
//    that has a manifest AND a service worker with a fetch handler. The
//    manifest has been there all along; this is the missing half. It matters
//    because the app's most-used feature is photographing a receipt in a
//    shop, and asking someone to open a browser and type an address at the
//    till is how that feature goes unused.
// 2. Repeat loads. The build's JS/CSS live under /assets/ with content
//    hashes in their filenames, so a given URL can never mean two different
//    things - which is exactly the condition that makes cache-first correct
//    rather than merely fast.
//
// Not for offline use. Every screen in this app is a number fetched from the
// server; there is no honest offline mode to build, only a shell that would
// render empty boxes and error toasts. Navigations made without a connection
// get a page that says so instead of a broken-looking app.

const VERSION = 'v1';
const ASSET_CACHE = `skieta-assets-${VERSION}`;
const SHELL_CACHE = `skieta-shell-${VERSION}`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add(OFFLINE_URL)));
  // No skipWaiting() on purpose. Taking over mid-session would swap the
  // service worker under a page whose lazily-loaded chunks belong to the
  // previous deploy, and the activate handler below would have just deleted
  // the cache holding them. Waiting until every tab from the old version is
  // closed makes that impossible, at the cost of updates landing one visit
  // later - a trade worth making for a page nobody wants to see break
  // halfway through entering a transaction.
});

self.addEventListener('activate', (event) => {
  // Safe precisely because we did not skipWaiting: by the time this runs, no
  // client from the previous version is still open to want the old chunks.
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => !name.endsWith(VERSION)).map((name) => caches.delete(name))),
      ),
  );
});

/** Requests this worker must never touch, let alone store.
 *
 * /api/* is the whole of the user's financial life. Caching it would be
 * wrong twice over: a balance served from cache is a wrong balance, and a
 * copy of somebody's transactions sitting in Cache Storage is private data
 * left on disk, readable by anyone who later picks up the device. The scan
 * endpoint carries a photo of a receipt, which is the same problem.
 * /sitemap.xml is proxied to the backend and is nobody's business here. */
function isNeverCached(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/receipt-scan' ||
    url.pathname === '/sitemap.xml'
  );
}

/** Vite writes every JS/CSS bundle to /assets/ with a content hash in the
 * filename. A hashed URL never changes meaning, so serving it from cache
 * without revalidating cannot go stale - it can only be absent. */
function isImmutableAsset(url) {
  return url.pathname.startsWith('/assets/');
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // Only success responses. A 404 for a chunk removed by a later deploy must
  // not be remembered as that chunk's permanent answer.
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    // If even the fallback is missing, let the browser show its own error
    // rather than resolving with something confusing.
    return offline ?? Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Reads only. A POST that went through a cache layer is a bug waiting to
  // happen, and there is nothing to gain from intercepting one.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Analytics and error reporting are someone else's origin and none of this
  // worker's business.
  if (url.origin !== self.location.origin) return;
  if (isNeverCached(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkWithOfflineFallback(request));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
  // Everything else falls through to the network untouched.
});
