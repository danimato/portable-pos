// QuickTrack PWA Service Worker - Offline-First Strategy
const VERSION = '1.0.0';
const CACHE_NAME = `QuickTrack-v${VERSION}`;
const RUNTIME_CACHE = `QuickTrack-runtime-v${VERSION}`;
const DEVELOPER_MODE = false; // Set to true during development

// Core app files - MUST be available offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css'
];

// Application scripts - critical for functionality
const SCRIPTS = [
  './scripts/algorithms.js',
  './scripts/barcodePrinter.js',
  './scripts/cartManager.js',
  './scripts/db.js',
  './scripts/deleter.js',
  './scripts/formatters.js',
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
  './scripts/transactionList.js'
];

// Third-party libraries
const LIBRARIES = [
  './scripts/libs/html5-qrcode.min.js',
  './scripts/libs/fuse.min.js',
  './scripts/libs/JsBarcode.all.min.js',
  './scripts/libs/flakeid.min.js'
];

// Media and resources
const RESOURCES = [
  './res/beep.wav'
];

// Combine all critical assets (fonts handled separately)
const PRECACHE_ASSETS = [
  ...CORE_ASSETS,
  ...SCRIPTS,
  ...LIBRARIES,
  ...RESOURCES
];

// =============================================================================
// INSTALL EVENT - Cache all critical resources
// =============================================================================
self.addEventListener('install', event => {
  console.log(`[QuickTrack SW v${VERSION}] Installing...`);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Pre-cache all critical assets
        console.log(`[QuickTrack SW] Caching ${PRECACHE_ASSETS.length} critical assets...`);
        
        // Cache in smaller batches to handle potential failures gracefully
        const batchSize = 5;
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < PRECACHE_ASSETS.length; i += batchSize) {
          const batch = PRECACHE_ASSETS.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map(url => cache.add(url))
          );
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              successCount++;
              console.log(`[QuickTrack SW] ✓ Cached: ${batch[index]}`);
            } else {
              failCount++;
              console.warn(`[QuickTrack SW] ✗ Failed to cache: ${batch[index]}`, result.reason);
            }
          });
        }
        
        // Cache Google Fonts CSS and font files
        console.log(`[QuickTrack SW] Caching Google Fonts...`);
        await cacheGoogleFonts(cache);
        
        console.log(`[QuickTrack SW v${VERSION}] Installation complete: ${successCount} cached, ${failCount} failed`);
        
        // Activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error(`[QuickTrack SW v${VERSION}] Installation error:`, error);
        throw error;
      }
    })()
  );
});

// =============================================================================
// ACTIVATE EVENT - Clean up old caches
// =============================================================================
self.addEventListener('activate', event => {
  console.log(`[QuickTrack SW v${VERSION}] Activating...`);
  
  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();
        
        // Delete old caches
        const cachesToDelete = cacheNames.filter(name => 
          name.startsWith('QuickTrack-') && 
          name !== CACHE_NAME && 
          name !== RUNTIME_CACHE
        );
        
        if (cachesToDelete.length > 0) {
          console.log(`[QuickTrack SW] Deleting ${cachesToDelete.length} old cache(s)...`);
          await Promise.all(cachesToDelete.map(name => {
            console.log(`[QuickTrack SW] Deleted: ${name}`);
            return caches.delete(name);
          }));
        }
        
        // Take control of all clients immediately
        await self.clients.claim();
        
        console.log(`[QuickTrack SW v${VERSION}] Activated and ready for offline use!`);
        
        // Notify all clients that SW is ready
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: VERSION,
            offlineReady: true
          });
        });
      } catch (error) {
        console.error(`[QuickTrack SW v${VERSION}] Activation error:`, error);
      }
    })()
  );
});

// =============================================================================
// FETCH EVENT - Offline-First Strategy
// =============================================================================
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions and analytics
  const url = new URL(request.url);
  if (
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('analytics') ||
    url.hostname.includes('googletagmanager')
  ) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

// Main fetch handler - Cache-First for offline PWA
async function handleFetch(request) {
  const url = new URL(request.url);
  
  // STRATEGY 1: Cache-First for all app assets (OFFLINE-FIRST)
  if (isAppAsset(url)) {
    return cacheFirst(request, CACHE_NAME);
  }
  
  // STRATEGY 2: Stale-While-Revalidate for external resources
  if (isExternalResource(url)) {
    // Special handling for Google Fonts
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
      return cacheFirst(request, RUNTIME_CACHE);
    }
    return staleWhileRevalidate(request, RUNTIME_CACHE);
  }
  
  // STRATEGY 3: Network-First with cache fallback for everything else
  return networkFirst(request, RUNTIME_CACHE);
}

// Cache-First Strategy - Best for PWA offline support
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // If cached and not in developer mode, return immediately
  if (cached && !DEVELOPER_MODE) {
    console.log(`[QuickTrack SW] 📦 Cache hit: ${new URL(request.url).pathname}`);
    
    // Update cache in background for next time (stale-while-revalidate)
    fetch(request).then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {/* ignore network errors */});
    
    return cached;
  }
  
  // Not cached or in dev mode - try to fetch from network
  try {
    console.log(`[QuickTrack SW] 🌐 Fetching: ${new URL(request.url).pathname}`);
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed - fallback to cache if available
    if (cached) {
      console.log(`[QuickTrack SW] 📦 Offline fallback: ${new URL(request.url).pathname}`);
      return cached;
    }
    
    // No cache available - return offline page for navigations
    if (request.mode === 'navigate') {
      const appShell = await cache.match('./index.html');
      if (appShell) {
        return appShell;
      }
    }
    
    // For fonts and other resources, return a minimal valid response
    const url = new URL(request.url);
    if (url.pathname.includes('css') || url.pathname.includes('font')) {
      console.log(`[QuickTrack SW] ⚠ Font unavailable offline: ${url.pathname}`);
      return new Response('', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    // For other resources, return 503
    console.warn(`[QuickTrack SW] ✗ Resource unavailable: ${url.pathname}`);
    return new Response('', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stale-While-Revalidate - Good for fonts and external resources
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch in background and update cache
  const fetchPromise = fetch(request).then(response => {
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached); // Fallback to cached on error
  
  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// Network-First - Try network, fallback to cache
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // Cache successful same-origin responses
    if (response && response.ok && new URL(request.url).origin === self.location.origin) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed - try cache
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log(`[QuickTrack SW] 📦 Network failed - serving from cache`);
      return cached;
    }
    
    throw error;
  }
}

// Helper: Check if URL is an app asset (should work offline)
function isAppAsset(url) {
  return (
    url.origin === self.location.origin &&
    (
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.wav') ||
      url.pathname.endsWith('.json') ||
      url.pathname === '/' ||
      url.pathname === './'
    )
  );
}

// Helper: Check if URL is an external resource
function isExternalResource(url) {
  return url.origin !== self.location.origin;
}

// =============================================================================
// GOOGLE FONTS CACHING
// =============================================================================
async function cacheGoogleFonts(cache) {
  const fontUrls = [
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
    'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@100..900&display=swap'
  ];
  
  try {
    for (const cssUrl of fontUrls) {
      // Fetch the CSS file
      const cssResponse = await fetch(cssUrl);
      const cssText = await cssResponse.text();
      
      // Cache the CSS
      await cache.put(cssUrl, new Response(cssText, {
        headers: { 'Content-Type': 'text/css' }
      }));
      console.log(`[QuickTrack SW] ✓ Cached font CSS: ${cssUrl}`);
      
      // Extract and cache font file URLs from CSS
      const fontFileUrls = extractFontUrls(cssText);
      
      for (const fontUrl of fontFileUrls) {
        try {
          const fontResponse = await fetch(fontUrl);
          const fontBlob = await fontResponse.blob();
          
          await cache.put(fontUrl, new Response(fontBlob, {
            headers: {
              'Content-Type': fontResponse.headers.get('Content-Type') || 'font/woff2',
              'Cache-Control': 'public, max-age=31536000'
            }
          }));
          console.log(`[QuickTrack SW] ✓ Cached font file: ${fontUrl.split('/').pop()}`);
        } catch (err) {
          console.warn(`[QuickTrack SW] Failed to cache font file: ${fontUrl}`, err);
        }
      }
    }
    
    console.log(`[QuickTrack SW] ✓ Google Fonts cached successfully`);
  } catch (error) {
    console.warn(`[QuickTrack SW] Failed to cache Google Fonts (app will work with system fonts):`, error);
  }
}

// Extract font URLs from Google Fonts CSS
function extractFontUrls(cssText) {
  const urls = [];
  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
  let match;
  
  while ((match = urlRegex.exec(cssText)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

// =============================================================================
// MESSAGE HANDLING
// =============================================================================
self.addEventListener('message', event => {
  console.log('[QuickTrack SW] Message received:', event.data);
  
  // Force skip waiting
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Return current version
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ 
      version: VERSION,
      offlineReady: true
    });
  }
  
  // Clear all caches (useful for debugging)
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      return Promise.all(names.map(name => caches.delete(name)));
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// =============================================================================
// BACKGROUND SYNC (for future enhancements)
// =============================================================================
self.addEventListener('sync', event => {
  console.log('[QuickTrack SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  // Placeholder for syncing offline transactions when back online
  console.log('[QuickTrack SW] Syncing offline transactions...');
  // Implementation depends on your backend API
}

console.log(`[QuickTrack SW v${VERSION}] Script loaded`);