'use strict';
// Scope-specific caches avoid touching other apps on the same hosting origin.
const PREFIX='mio-italiano:'+self.registration.scope+':';
const CACHE=PREFIX+'2026-11-19-r2';
const FILES=['./','./index.html','./styles.css','./app.js','./course.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
  // Bypass HTTP caches so the new worker cannot package stale course data.
  await cache.addAll(FILES.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
 }));
 // Wait for the user to accept the update or close all old app windows.
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
 // Keep the old shared v1 cache: another installation may still use it.
 // localStorage and IndexedDB are never cleared.
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
 if(req.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const hit=await cache.match(req);
  if(hit)return hit;
  try{return await fetch(req)}catch(error){
   if(req.mode==='navigate')return (await cache.match(new URL('./index.html',scope)))||Response.error();
   return Response.error();
  }
 })());
});
