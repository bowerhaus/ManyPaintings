/**
 * ManyPaintings Remote Control Service Worker
 * 
 * Minimal service worker for PWA installability.
 * Uses network-first strategy for all requests to ensure real-time remote control functionality.
 * No offline functionality - designed for same-network usage only.
 */

const CACHE_NAME = 'manypaintings-remote-v1.0.0';
const APP_SHELL = [
  '/remote',
  '/static/css/style.css',
  '/static/js/remote.js',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/icons/apple-touch-icon.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache app shell:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - network first with cache fallback for app shell only
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Always use network-first for API calls to ensure real-time remote control
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch((error) => {
          console.error('[Service Worker] API request failed:', error);
          // Return a basic error response for failed API calls
          return new Response(
            JSON.stringify({ error: 'Network unavailable' }), 
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // Network-first with cache fallback for app shell resources
  if (APP_SHELL.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If successful, update cache and return response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseClone))
              .catch((error) => console.warn('[Service Worker] Cache update failed:', error));
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[Service Worker] Serving from cache:', request.url);
                return cachedResponse;
              }
              // No cache available either
              throw new Error('Resource not available offline');
            });
        })
    );
    return;
  }
  
  // For all other requests, just use network
  event.respondWith(fetch(request));
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received skip waiting message');
    self.skipWaiting();
  }
});

console.log('[Service Worker] Service worker loaded successfully');