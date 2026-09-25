/* Mapa del Morfi: guarda la app y los datos para usarla sin internet. Versión dde3fb2 */
const V='morfi-dde3fb2', EXT='morfi-ext-1', CORE=["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon.png", "geo.js?v=dde3fb2", "calles.js?v=dde3fb2", "landmarks.js?v=dde3fb2", "places.js?v=dde3fb2"],
  EXTU=['https://cdn.jsdelivr.net/npm/deck.gl@9.1.14/dist.min.js'],   // el motor 3D: sin él no hay mapa
  EXTH=/(^|\.)(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
const sirve=res=>res&&(res.ok||res.type==='opaque');   // nunca guardar un 404 o un 503
self.addEventListener('install',e=>{e.waitUntil(Promise.all([
  // lo propio, salteando la caché HTTP (GitHub Pages manda max-age=600)
  caches.open(V).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))),
  // lo externo va a una caché estable que sobrevive a las versiones; si falla, la instalación sigue
  caches.open(EXT).then(c=>Promise.all(EXTU.map(u=>c.match(u).then(m=>m||fetch(u,{mode:'cors'}).then(res=>{if(res.ok)return c.put(u,res)})).catch(()=>{}))))
]).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('morfi-')&&k!==V&&k!==EXT).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const guardar=(r,res)=>{ if(sirve(res)){ const cp=res.clone(); caches.open(V).then(c=>c.put(r,cp)).catch(()=>{}) } return res };
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    if(r.mode==='navigate'){
      // la página: red revalidando (ETag) en carrera con 3,5 s; si pierde, la guardada. La versión nueva
      // entra igual: la página registra sw.js?v= y el SW nuevo precachea todo junto (página y datos de la misma versión)
      const net=fetch(r.url,{cache:'no-cache',credentials:'same-origin'});
      e.waitUntil(net.then(()=>{},()=>{}));
      e.respondWith(Promise.race([net.catch(()=>null),new Promise(ok=>setTimeout(ok,3500))])
        .then(res=>res||caches.match('index.html').then(m=>m||net)));
    } else if(/\.js$/.test(u.pathname)&&u.searchParams.has('v')){
      // datos con ?v=: inmutables, primero la caché
      e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>guardar(r,res))));
    } else {
      e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>guardar(r,res)).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||Response.error())));
    }
  } else if(EXTH.test(u.hostname)){
    // librerías y tipografías: primero la caché estable
    e.respondWith(caches.open(EXT).then(c=>c.match(r,{ignoreVary:true}).then(m=>m||fetch(r).then(res=>{if(sirve(res))c.put(r,res.clone()).catch(()=>{});return res}))));
  }
});
