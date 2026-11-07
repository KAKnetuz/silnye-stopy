const CACHE="silnye-stopy-v7";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Быстрый запуск: сразу отдаём сохранённую копию, а свежую версию скачиваем в фоне (появится при следующем запуске)
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);
  const own=url.origin===location.origin, font=url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com";
  if(!own&&!font)return;
  e.respondWith(caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:own}).then(hit=>{
    const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(req,res.clone());return res;}).catch(()=>hit||(req.mode==="navigate"?c.match("./index.html"):undefined));
    if(hit){e.waitUntil(net.catch(()=>{}));return hit;}
    return net;
  })));
});
