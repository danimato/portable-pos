const CACHE_NAME = `QuickTrack`;
const DEVELOPER_MODE = false;
// Use the install event to pre-cache all initial resources.
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
            await cache.addAll([
                './',
                'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
                'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@100..900&display=swap',
                './scripts/libs/html5-qrcode.min.js',
                './scripts/libs/fuse.min.js',
                './scripts/libs/JsBarcode.all.min.js',
                './scripts/libs/flakeid.min.js',

                './res/beep.wav',

                './scripts/algorithms.js',
                './scripts/formatter.js',
                './scripts/barcodePrinter.js',
                './scripts/cartManager.js',
                './scripts/db.js',
                './scripts/deleter.js',
                './scripts/homePage.js',
                './scripts/inventoryForm.js',
                './scripts/inventoryList.js',
                './scripts/onRun.js',
                './scripts/qrReading.js',
                './scripts/searchProducts.js',
                './scripts/settings.js',
                './scripts/snowflakeGenerator.js',
                './scripts/svgToPng.js',
                './scripts/tab-navigation.js',
                './scripts/tests.js',
                './scripts/toast.js',
                './scripts/transactionList.js',
                './index.html',
                './manifest.json',
                './style.css',
                './todo.md'
            ]);
            console.log("Resources pre-cached successfully.");
        } catch (error) {
            console.error("Failed to pre-cache resources:", error);
        }
    })());
});

self.addEventListener('fetch', event => {
  // let non-GETs pass through (POSTs, PUTs, etc.)
  if (event.request.method !== 'GET') return;

  // ignore analytics / telemetry to avoid intercepting those noisy requests
  const url = new URL(event.request.url);
  if (url.hostname.includes('google-analytics.com') || url.hostname.includes('analytics')) {
    return;
  }

  event.respondWith((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);

      // try cache first
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse && !DEVELOPER_MODE) {
        return cachedResponse;
      }

      // not in cache -> network
      const fetchResponse = await fetch(event.request);

      // only cache GET same-origin or cross-origin opaque responses carefully
      try {
        // only cache successful responses
        if (fetchResponse && fetchResponse.ok) {
          // caching opaque (cross-origin, type === 'opaque') is allowed but may be less useful;
          // you can decide to cache only same-origin if you prefer:
          // if (new URL(event.request.url).origin === self.location.origin) { await cache.put(...) }
          await cache.put(event.request, fetchResponse.clone());
        }
      } catch (putErr) {
        // caching failed (likely because request is not cacheable) — don't let this break the flow
        console.warn('cache.put failed for', event.request.url, putErr);
      }

      return fetchResponse;
    } catch (err) {
      // fallback: always return a Response (never undefined)
      console.warn('fetch handler error for', event.request.url, err);

      // try returning a cached HTML shell first (navigation fallback)
      try {
        const cache = await caches.open(CACHE_NAME);
        const fallback = await cache.match('./index.html') || await cache.match('/');
        if (fallback) return fallback;
      } catch (cacheErr) {
        console.warn('fallback cache lookup failed', cacheErr);
      }

      // ultimate fallback
      return new Response('offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  })());
});
