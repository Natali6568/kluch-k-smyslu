const CACHE_NAME='kms-offline-1.2.1';
const SUPABASE_CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/dist/umd/supabase.js';

const LOCAL_ASSETS=[
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css?v=1.2.1',
  '/data/texts.js?v=1.2.1',
  '/data/researcher.js?v=1.2.1',
  '/data/tracker.js?v=1.2.1',
  '/data/master.js?v=1.2.1',
  '/js/app.js?v=1.2.1',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(LOCAL_ASSETS);
    try{
      const response=await fetch(SUPABASE_CDN,{mode:'cors',cache:'reload'});
      if(response.ok)await cache.put(SUPABASE_CDN,response.clone());
    }catch(error){
      // Первый вход всё равно выполняется только при наличии интернета.
      // Локальная часть тренажёра будет установлена независимо от CDN.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('kms-offline-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response&&response.ok){
    const cache=await caches.open(CACHE_NAME);
    await cache.put(request,response.clone());
  }
  return response;
}

async function networkFirst(request,fallback){
  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const cache=await caches.open(CACHE_NAME);
      await cache.put(request,response.clone());
    }
    return response;
  }catch(error){
    return (await caches.match(request))||(fallback?await caches.match(fallback):undefined)||Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);

  if(request.url===SUPABASE_CDN){
    event.respondWith(cacheFirst(request));
    return;
  }

  if(url.origin!==self.location.origin)return;

  if(url.pathname.startsWith('/api/')){
    event.respondWith(fetch(request));
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request,'/index.html'));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});
