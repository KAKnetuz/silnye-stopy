// Offline app shell: a new service-worker revision installs into a separate cache.
// Never update individual shell files in the active cache: that can mix JS/CSS/HTML versions.
const CACHE = "silnye-stopy-shell-v2.8";   // = APP_VERSION в js/app.js; меняется с каждым выпуском (проверяет автотест)
const SHELL = ["./", "./index.html", "./styles.css", "./js/core.js", "./js/exercises.js", "./js/anim.js", "./js/audio.js", "./js/app.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  "./fonts/GolosText.woff", "./fonts/Unbounded.woff", "./fonts/MartianMono.woff"];

self.addEventListener("install", e => {
  // cache: "reload" — берём файлы с сервера, а не из HTTP-кэша браузера (GitHub Pages кэширует их на 10 минут)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // Delete only previous caches owned by this application.
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("silnye-stopy") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(req);
      // Only cache files outside the pre-cached shell if they are valid same-origin responses.
      if (response.ok && response.type === "basic") await cache.put(req, response.clone());
      return response;
    } catch (error) {
      if (req.mode === "navigate") {
        const fallback = await cache.match("./index.html");
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
