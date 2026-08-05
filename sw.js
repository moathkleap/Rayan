/* Rayan & Naya — Service Worker: تشغيل دون اتصال مع تحديث تلقائي */
const CACHE = 'rayan-naya-v4';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './icon.svg',
  './js/main.js',
  './js/core/utils.js',
  './js/core/i18n.js',
  './js/core/input.js',
  './js/core/audio.js',
  './js/core/save.js',
  './js/core/engine.js',
  './js/game/config.js',
  './js/game/physics.js',
  './js/game/textures.js',
  './js/game/characters.js',
  './js/game/particles.js',
  './js/game/background.js',
  './js/game/levelgen.js',
  './js/game/entities.js',
  './js/game/enemies.js',
  './js/game/bosses.js',
  './js/game/player.js',
  './js/game/achievements.js',
  './js/game/hud.js',
  './js/game/cinematics.js',
  './js/game/levelscene.js',
  './js/game/scenes.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// شبكة أولاً: عند الاتصال يجلب أحدث نسخة دائمًا (فتظهر التحديثات فورًا)،
// ويحدّث الكاش في الخلفية، وعند انقطاع الشبكة يعود للنسخة المخزّنة.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
