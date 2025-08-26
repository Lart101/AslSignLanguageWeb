const CACHE_NAME = 'asl-web-v2';
const urlsToCache = [
  './',
  './index.html',
  './alphabet.html',
  './webcam.html',
  './text_to_sign.html',
  './image_to_sign.html',
  './static/css/index.css',
  './static/css/alphabet.css',
  './static/css/webcam.css',
  './static/css/text_to_sign.css',
  './static/css/image_to_sign.css',
  './static/js/config.js',
  './static/js/alphabet.js',
  './static/js/webcam.js',
  './static/js/text_to_sign.js',
  './static/js/image_to_sign.js',
  './static/js/pwa-install.js',
  './static/image/GestureL-LandingPic.png',
  './static/models/letters.task',
  './static/audio/camera.mp3',
  './static/audio/correct.mp3',
  './static/audio/incorrect.mp3',
  './static/audio/select.mp3'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: Cache failed', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).catch(() => {
          // If both cache and network fail, show offline page
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Add any background sync logic here
  return Promise.resolve();
}
