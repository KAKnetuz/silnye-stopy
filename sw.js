// Сервис-воркер «Сильных стоп»: офлайн-режим и быстрый запуск.
// Стратегия «сначала из памяти, обновление в фоне»: каждый запуск открывается сразу из кэша,
// а свежая версия файлов скачивается в фоне и появляется со следующего запуска.
// Поэтому номер версии здесь менять не нужно — обновления приходят сами.
const CACHE = "silnye-stopy";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  "./fonts/GolosText.woff", "./fonts/Unbounded.woff", "./fonts/MartianMono.woff"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // удаляем кэши прошлых версий (silnye-stopy-v2 … v15)
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(res => {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }).catch(() => hit || (req.mode === "navigate" ? c.match("./index.html") : undefined));
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  })));
});
