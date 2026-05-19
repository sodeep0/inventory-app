const CACHE_NAME = 'stock-keeper-v2';
const APP_SHELL = [
  '/',
  '/inventory',
  '/movements',
];

function isHttpRequest(request) {
  try {
    const { protocol } = new URL(request.url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function cacheResponse(request, response) {
  if (!isHttpRequest(request)) return;
  if (!response || response.status !== 200 || response.type !== 'basic') return;

  const responseToCache = response.clone();
  caches.open(CACHE_NAME).then((cache) => {
    return cache.put(request, responseToCache);
  }).catch(() => {
    // Ignore cache failures (e.g. opaque or unsupported requests)
  });
}

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).catch(() => {
      // Pre-caching is optional, don't fail the install
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first for static assets, network for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin http(s) — skip chrome-extension, etc.
  if (!isHttpRequest(request)) {
    return;
  }

  const url = new URL(request.url);

  // Skip API calls - always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => {
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }));
    return;
  }

  // Cache-first for static assets and navigation
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    request.mode === 'navigate'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          cacheResponse(request, response);
          return response;
        });
      }).catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
