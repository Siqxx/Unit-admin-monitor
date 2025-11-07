const CACHE = 'unit-admin-cache-v1';
const ASSETS = [
  '/', '/index.html', '/manifest.json'
  // If you host under a custom path, include that path or add other assets here.
];

// Install: cache core assets
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c=> c.addAll(ASSETS.map(p=> new Request(p, {cache:'reload'}))))
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', e=>{
  e.waitUntil(clients.claim());
});

// Fetch: offline-first for app shell; fallback to network for API calls
self.addEventListener('fetch', e=>{
  const req = e.request;
  const url = new URL(req.url);

  // For navigation requests (SPA), serve index.html if offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(()=> caches.match('/index.html'))
    );
    return;
  }

  // For same-origin assets, try cache first
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(resp => resp || fetch(req).then(r=>{ 
        // cache GET responses
        if(req.method === 'GET') {
          caches.open(CACHE).then(cache=>cache.put(req, r.clone()));
        }
        return r;
      }).catch(()=> caches.match('/index.html')))
    );
    return;
  }

  // Fallback to network for cross-origin
  e.respondWith(fetch(req).catch(()=> new Response(null, {status:503, statusText:'Service Unavailable'})));
});
