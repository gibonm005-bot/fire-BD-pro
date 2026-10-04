// FIRE BD service worker v16 (push enabled) - fast open: app shell cache-first, images/CDN persistent cache
const CACHE = 'fire-bd-v45';          // shell (deploy e bump korun)
const IMG = 'fire-img-v1';            // cross-origin images: version bump e MUCHBE NA
const CDN = 'fire-cdn-v1';            // fonts / icons / firebase sdk: version bump e MUCHBE NA
const KEEP = [CACHE, IMG, CDN];
const SHELL = ['./', 'index.html', 'app/index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'assets/logo-fb.png', 'config.js'];
const IMGS = ["app/img/fb-logo-v34.jpg", "app/img/fb-head-v34.jpg", "app/img/5cd33804.jpg", "app/img/a4ee4635.png", "app/img/3e2c1a04.png"];
const CDN_RE = /^(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.concat(IMGS).map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => KEEP.indexOf(x) < 0).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});

function trim(name, max) {
  caches.open(name).then(c => c.keys().then(k => { if (k.length > max) k.slice(0, k.length - max).forEach(r => c.delete(r)); }));
}
// cache-first, network only on miss (no background re-download every open)
function cacheFirst(r, name, max, corsFirst) {
  return caches.open(name).then(c => c.match(r.url).then(hit => {
    if (hit) return hit;
    const net = corsFirst
      ? fetch(r.url, { mode: 'cors', credentials: 'omit' }).catch(() => fetch(r))
      : fetch(r);
    return net.then(res => {
      if (res && (res.ok || res.type === 'opaque')) { c.put(r.url, res.clone()); if (max) trim(name, max); }
      return res;
    });
  }));
}

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin !== location.origin) {
    if (r.destination === 'image') { e.respondWith(cacheFirst(r, IMG, 250, true)); return; }
    if (CDN_RE.test(u.hostname) || (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0)) { e.respondWith(cacheFirst(r, CDN, 120, false)); return; }
    return; // Firebase database / auth -> network
  }
  if (u.pathname.indexOf('/__/') === 0) return;
  if (u.pathname.slice(-10) === '/config.js') {   // config.js sob somoy fresh, offline hole cache
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r)));
    return;
  }
  if (r.mode === 'navigate') {   // NETWORK-FIRST (notun version sathe sathe), net slow/offline hole cache
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fallback = () => caches.match(r, { ignoreSearch: true }).then(hit => hit || caches.match('app/index.html'));
      const t = setTimeout(() => { fallback().then(h => { if (h && !done) { done = true; resolve(h); } }); }, 4000);
      fetch(r).then(res => {
        clearTimeout(t);
        if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
        if (!done) { done = true; resolve(res); }
      }).catch(() => {
        clearTimeout(t);
        fallback().then(h => { if (!done) { done = true; resolve(h || Response.error()); } });
      });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
});

// ===== PUSH NOTIFICATIONS (FCM web push) =====
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (_) { try { p = { notification: { body: e.data.text() } }; } catch (__) { } }
  const n = p.notification || {}, d = p.data || {};
  const title = n.title || d.title || 'FIRE BD';
  const opts = {
    body: n.body || d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: d,
    tag: d.tag || undefined,
    renotify: !!d.tag,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };
  const img = n.image || d.image; if (img) opts.image = img;
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const screen = (e.notification.data && e.notification.data.screen) || '';
  const base = new URL('app/index.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.indexOf('/app/') >= 0 && 'focus' in c) { c.postMessage({ type: 'push-nav', screen }); return c.focus(); }
    }
    return self.clients.openWindow(screen ? base + '?go=' + encodeURIComponent(screen) : base);
  }));
});
