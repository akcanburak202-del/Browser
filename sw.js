/* StudyOS — çevrimdışı önbellek + paylaşım hedefi */
const C="studyos-v25", SHARE="studyos-share";
const FILES=["./","./index.html","./manifest.json","./icon.svg","./icon-192.png","./icon-512.png","./icon-maskable.png"];

self.addEventListener("install",e=>{ e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==SHARE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });

/* Paylaş menüsünden gelen dosyaları önbelleğe koy, sayfaya yönlendir.
   Statik sunucuda POST alınamaz; bu yüzden isteği burada karşılıyoruz. */
async function handleShare(req){
  try{
    const fd=await req.formData();
    const files=fd.getAll("file").filter(f=>f&&f.name!==undefined);
    const cache=await caches.open(SHARE);
    const names=[];
    for(let i=0;i<files.length;i++){
      names.push(files[i].name||("dosya-"+i));
      await cache.put("./__shared/"+i, new Response(files[i],{headers:{"content-type":files[i].type||"application/octet-stream"}}));
    }
    await cache.put("./__shared/index", new Response(JSON.stringify({
      count:files.length, names, text:fd.get("text")||"", title:fd.get("title")||"", url:fd.get("url")||""
    }),{headers:{"content-type":"application/json"}}));
  }catch(e){}
  return Response.redirect("./index.html?shared=1",303);
}

self.addEventListener("fetch",e=>{
  const url=new URL(e.request.url);
  if(e.request.method==="POST" && url.pathname.endsWith("/share-target")){ e.respondWith(handleShare(e.request)); return; }
  if(e.request.method!=="GET") return;
  if(url.pathname.includes("/__shared/")) return;   /* paylaşılan dosyalar doğrudan cache'ten okunur */
  e.respondWith(
    fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); return r; })
      .catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html")))
  );
});
