/* Service worker: เล่นได้แม้ไม่มีเน็ต
   ไฟล์เกม = ดึงจากเน็ตก่อน (ได้เวอร์ชันล่าสุดเสมอ) ถ้าออฟไลน์ใช้ของที่เก็บไว้ */
const CACHE = 'thai-rpg-v21';
const CORE = ['./', 'index.html', 'style.css', 'hero.js', 'monsters.js', 'battle2d.js', 'features.js', 'cosmetics.js', 'tower.js', 'game.js', 'bg/worldmap.webp', 'bg/worldmap2.webp', ...['forest','cave','desert','volcano','swamp','ice','sea','sky','spirit','castle'].map((z) => `bg/${z}.webp`),
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    })));
  }
});
