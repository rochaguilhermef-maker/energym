// ENERGYM | Service worker: guarda os arquivos para o app abrir sem internet.
// Parte: Marcos (servidor e publicação)
const CACHE = 'energym-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './css/estilo.css',
  './js/vendor/qrcode.min.js', './js/util.js', './js/dados.js', './js/regras.js', './js/sessao.js',
  './js/icones.js', './js/telas.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './fonts/oswald-500.woff2', './fonts/oswald-600.woff2', './fonts/manrope-400.woff2',
  './fonts/manrope-600.woff2', './fonts/manrope-700.woff2', './fonts/manrope-800.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
// Rede primeiro; se estiver sem internet, usa a cópia guardada.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
