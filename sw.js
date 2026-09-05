/* 小手机 service worker：让「添加到主屏幕」之后断网也能打开。
   策略：能联网就永远用网络（保证更新立刻生效），联不上才用上次缓存的那份。 */
const CACHE='xiaoshouji-v1';
self.addEventListener('install',e=>{ self.skipWaiting(); });
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;   // 接口请求一律不碰
  e.respondWith((async()=>{
    try{
      const res=await fetch(req);
      if(res&&res.ok){ const c=await caches.open(CACHE); c.put(req,res.clone()).catch(()=>{}); }
      return res;
    }catch(err){
      const hit=await caches.match(req,{ignoreSearch:true});
      if(hit) return hit;
      if(req.mode==='navigate'){ const idx=await caches.match('./index.html',{ignoreSearch:true})||await caches.match('./',{ignoreSearch:true}); if(idx) return idx; }
      throw err;
    }
  })());
});
