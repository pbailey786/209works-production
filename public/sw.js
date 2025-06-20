// Service Worker for 209 Works PWA
// Provides offline functionality, caching, and background sync

const CACHE_NAME = '209works-v1.0.0';
const STATIC_CACHE = '209works-static-v1.0.0';
const DYNAMIC_CACHE = '209works-dynamic-v1.0.0';
const API_CACHE = '209works-api-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/jobs',
  '/search',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  // Add critical CSS and JS files
  '/_next/static/css/app.css',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/webpack.js',
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/jobs',
  '/api/search',
  '/api/user/profile',
  '/api/notifications',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request));
  } else if (url.pathname.startsWith('/_next/image')) {
    // Images - Cache First with network fallback
    event.respondWith(handleImageRequest(request));
  } else {
    // Pages - Network First with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      // Only cache GET requests for specific endpoints
      if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Try cache fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical APIs
    if (url.pathname.startsWith('/api/jobs')) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'You are currently offline. Please check your connection.',
          cached: true,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    throw error;
  }
}

// Handle static assets with Cache First strategy
async function handleStaticAssets(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle image requests with Cache First strategy
async function handleImageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch image:', request.url);
    // Return placeholder image for offline
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Image unavailable offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Handle page requests with Network First strategy
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for page request, trying cache:', request.url);
    
    // Try cache fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await cache.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline HTML
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>209 Works - Offline</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
            .offline-container { max-width: 400px; margin: 0 auto; }
            .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
            .offline-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
            .offline-message { color: #666; margin-bottom: 2rem; }
            .retry-button { 
              background: #2563eb; color: white; border: none; 
              padding: 0.75rem 1.5rem; border-radius: 0.5rem; 
              cursor: pointer; font-size: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">You're Offline</h1>
            <p class="offline-message">
              Please check your internet connection and try again.
            </p>
            <button class="retry-button" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
      `,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'job-application') {
    event.waitUntil(syncJobApplications());
  } else if (event.tag === 'job-search') {
    event.waitUntil(syncJobSearches());
  }
});

// Sync job applications when back online
async function syncJobApplications() {
  try {
    // Get pending applications from IndexedDB
    const pendingApplications = await getPendingApplications();
    
    for (const application of pendingApplications) {
      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(application.data),
        });
        
        if (response.ok) {
          await removePendingApplication(application.id);
          console.log('[SW] Synced job application:', application.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync application:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync job searches when back online
async function syncJobSearches() {
  try {
    // Get pending searches from IndexedDB
    const pendingSearches = await getPendingSearches();
    
    for (const search of pendingSearches) {
      try {
        const response = await fetch('/api/search/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(search.data),
        });
        
        if (response.ok) {
          await removePendingSearch(search.id);
          console.log('[SW] Synced job search:', search.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync search:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers (simplified - would need full implementation)
async function getPendingApplications() {
  // Implementation would use IndexedDB to get pending applications
  return [];
}

async function removePendingApplication(id) {
  // Implementation would remove from IndexedDB
}

async function getPendingSearches() {
  // Implementation would use IndexedDB to get pending searches
  return [];
}

async function removePendingSearch(id) {
  // Implementation would remove from IndexedDB
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have new job matches!',
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View Jobs',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('209 Works', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/jobs')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker loaded successfully');
