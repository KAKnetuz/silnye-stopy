const CACHE="silnye-stopy-v2";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // приложение: сначала сеть (чтобы обновления доходили), без сети — из кэша
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;}).catch(()=>caches.match(req).then(r=>r||caches.match("./index.html"))));
  }else if(url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>{const net=fetch(req).then(res=>{c.put(req,res.clone());return res;}).catch(()=>hit);return hit||net;})));
  }
});
