/* TWC MedCRM — GitHub Pages Service Worker
   Caches the lightweight PWA shell. The app itself is served live from GAS. */
const CACHE = 'twc-medcrm-v1';
const SHELL = [
  './',
  './Index.html',
  './manifest.json',
  'https://z-cdn-media.chatglm.cn/files/b294a7ca-ad32-4be0-a147-19aa28af5078.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache the GAS backend — always go to network for the live app.
  if (url.hostname.indexOf('script.google') > -1 || url.hostname.indexOf('googleusercontent') > -1) {
    return; // let the browser handle (navigation redirect)
  }

  // Shell: cache-first
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetcher = fetch(req).then((res) => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetcher;
    })
  );
});
