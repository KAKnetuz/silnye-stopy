// Offline app shell: a new service-worker revision installs into a separate cache.
// Never update individual shell files in the active cache: that can mix JS/CSS/HTML versions.
const CACHE = "silnye-stopy-shell-v1.8";
const SHELL = ["./", "./index.html", "./styles.css", "./js/core.js", "./js/exercises.js", "./js/anim.js", "./js/audio.js", "./js/app.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  "./fonts/GolosText.woff", "./fonts/Unbounded.woff", "./fonts/MartianMono.woff"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
  e.respondWith((async () => {\n    const cache = await caches.open(CACHE);\n    const cached = await cache.match(req, { ignoreSearch: true });\n    if (cached) return cached;\n    try {\n      const response = await fetch(req);\n      // Only cache files outside the pre-cached shell if they are valid same-origin responses.\n      if (response.ok && response.type === "basic") await cache.put(req, response.clone());\n      return response;\n    } catch (error) {\n      if (req.mode === "navigate") {\n        const fallback = await cache.match("./index.html");\n        if (fallback) return fallback;\n      }\n      return Response.error();\n    }\n  })());\n});\n