/// <reference no-default-lib="true"/>
/// <reference lib="es2015" />
/// <reference lib="webworker" />

// Service Worker personnalisé pour l'application Pomodoro
const CACHE_NAME = 'pomodoro-todo-cache-v1';
const urlsToCache = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Typer self comme ServiceWorkerGlobalScope
const swSelf = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

swSelf.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

swSelf.addEventListener('fetch', (event) => {
  if (!(event instanceof FetchEvent)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Cloner la requête car elle ne peut être utilisée qu'une seule fois
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Vérifier que la réponse est valide
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse car elle ne peut être utilisée qu'une seule fois
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

swSelf.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean)
      );
    })
  );
});
