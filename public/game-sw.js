// Game Service Worker for caching game assets
const CACHE_NAME = 'heroes-game-cache-v2';
const STATIC_CACHE_NAME = 'heroes-static-cache-v2';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Game assets patterns to cache - includes all static assets
const GAME_ASSET_PATTERNS = [
  /\/images\/cards\//,
  /\/images\/heroes\//,
  /\/images\/dragons\//,
  /\/images\/monsters\//,
  /\.webp$/,
  /\.jpg$/,
  /\.png$/,
  /\/api\/cards/,
  /\/api\/game-data/,
  /\/assets\/.*\.js$/,   // Cache all JS bundles
  /\/assets\/.*\.css$/   // Cache all CSS bundles
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Game SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('🔧 Game SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('🔧 Game SW: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 Game SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('🔧 Game SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('🔧 Game SW: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isGameAsset(request.url)) {
    event.respondWith(handleGameAsset(request));
  } else if (isStaticAsset(request.url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request.url)) {
    event.respondWith(handleAPIRequest(request));
  }
});

// Check if request is for game assets
function isGameAsset(url) {
  return GAME_ASSET_PATTERNS.some(pattern => pattern.test(url));
}

// Check if request is for static assets
function isStaticAsset(url) {
  return url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.woff') || 
         url.includes('.woff2') ||
         url.endsWith('/');
}

// Check if request is for API
function isAPIRequest(url) {
  return url.includes('/api/') || url.includes('/rest/v1/');
}

// Handle game assets with cache-first strategy
async function handleGameAsset(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🎮 Game SW: Cache hit for', request.url);
      
      // Background update for expired cache
      if (shouldUpdateCache(cachedResponse)) {
        updateCacheInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    console.log('🎮 Game SW: Cache miss for', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      console.log('🎮 Game SW: Cached', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🎮 Game SW: Error handling game asset:', error);
    
    // Return fallback for images
    if (request.url.match(/\.(jpg|jpeg|png|webp)$/)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999">No Image</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🔧 Game SW: Error handling static asset:', error);
    
    // Return cached index.html for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return cache.match('/index.html');
    }
    
    throw error;
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses for offline fallback
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('🌐 Game SW: Network failed, trying cache for', request.url);
    
    // Fallback to cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🌐 Game SW: Serving stale data for', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Check if cache should be updated (older than 24 hours for static assets, 1 hour for others)
function shouldUpdateCache(response) {
  const cacheDate = response.headers.get('date');
  if (!cacheDate) return true;
  
  const cacheTime = new Date(cacheDate).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  // Cache static assets longer (24 hours)
  return (now - cacheTime) > twentyFourHours;
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🔄 Game SW: Background updated cache for', request.url);
    }
  } catch (error) {
    console.warn('🔄 Game SW: Background update failed for', request.url);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    cacheUrls(urls);
  }
});

// Cache specific URLs on demand
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachePromises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('🎯 Game SW: Preloaded', url);
        }
      } catch (error) {
        console.warn('🎯 Game SW: Failed to preload', url);
      }
    });
    
    await Promise.allSettled(cachePromises);
    console.log('🎯 Game SW: Preloading complete');
  } catch (error) {
    console.error('🎯 Game SW: Preloading failed:', error);
  }
}