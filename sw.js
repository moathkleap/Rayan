/* Rayan & Naya — Service Worker: تشغيل دون اتصال */
const CACHE = 'rayan-naya-v2';
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
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
