// sw.js — caches the app shell so it works fully offline after the first visit.
const CACHE_NAME = 'sisig-bagnet-v1';
const ASSETS_TO_CACHE = [
  './inventory.html',
  './manifest.json'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(function(err){
      console.warn('Cache addAll failed (some assets may be missing):', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;

      return fetch(event.request).then(function(response){
        if(response && response.status === 200 && response.type === 'basic'){
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function(){
        // Offline and not cached — fall back to the main page for navigation requests.
        if(event.request.mode === 'navigate'){
          return caches.match('./inventory.html');
        }
      });
    })
  );
});
