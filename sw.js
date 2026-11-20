/* Shred & Recomp Pro service worker: offline support for GitHub Pages.
   Bump VERSION when you deploy a new index.html so phones pick it up. */
const VERSION='v1';
const CACHE='shred-pro-'+VERSION;
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('shred-pro-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  // Page loads: network first (new deploys show up), cached copy when offline
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return r})
      .catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    return;
  }
  // Everything else (icons, Google Fonts): cached copy first, refresh in background
  if(url.origin===location.origin||url.hostname.endsWith('gstatic.com')||url.hostname.endsWith('googleapis.com')){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return r}).catch(()=>hit);
      return hit||net;
    }));
  }
});
