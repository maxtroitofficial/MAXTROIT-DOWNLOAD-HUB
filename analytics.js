/* MAXTROIT anonymous visitor register and active-time tracking. No names, email, IP storage, or fingerprinting. */
(()=>{
  if(!window.hubCloud?.ready || !window.hubCloud.db || !window.firebase?.firestore) return;
  const makeId=()=>window.crypto?.randomUUID?.() || ("mx-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)+"-"+Math.random().toString(36).slice(2));
  const cookieGet=key=>{const part=document.cookie.split("; ").find(x=>x.startsWith(key+"="));return part?decodeURIComponent(part.slice(key.length+1)):"";};
  const cookieSet=(key,value)=>{try{document.cookie=key+"="+encodeURIComponent(value)+"; Max-Age=31536000; Path=/; SameSite=Lax; Secure";return cookieGet(key)===value;}catch(e){return false;}};
  const stableVisitorId=()=>{
    const key="maxtroitAnalyticsVisitor";
    try{let v=localStorage.getItem(key);if(v)return v;v=cookieGet(key);if(v){try{localStorage.setItem(key,v)}catch(e){}return v;}v=makeId();try{localStorage.setItem(key,v);return v;}catch(e){}if(cookieSet(key,v))return v;}catch(e){}
    return "ephemeral-"+makeId();
  };
  const stableSessionId=()=>{
    const key="maxtroitAnalyticsSession";
    try{let v=sessionStorage.getItem(key);if(!v){v=makeId();sessionStorage.setItem(key,v);}return v;}catch(e){return "ephemeral-session";}
  };
  const visitorId=stableVisitorId(),sessionId=stableSessionId();
  const visitorName="Visitor-"+visitorId.replace(/[^a-z0-9]/gi,"").slice(-6).toUpperCase();

  const ua=navigator.userAgent||"";
  const deviceType=/(smart-tv|smarttv|hbbtv|tizen|web0s|webos|appletv|googletv|android tv|roku|aftb|aftt|fire tv)/i.test(ua)?"TV":(/ipad|tablet|playbook|silk/i.test(ua)||(/android/i.test(ua)&&!/mobile/i.test(ua)))?"Tablet":(/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua))?"Mobile":"Desktop";
  const deviceOS=/windows nt/i.test(ua)?"Windows":/android/i.test(ua)?"Android":/(iphone|ipad|ipod)/i.test(ua)?"iOS":/mac os x/i.test(ua)?"macOS":/cros/i.test(ua)?"ChromeOS":/linux/i.test(ua)?"Linux":/(tizen|webos|appletv|roku)/i.test(ua)?"Smart TV OS":"Unknown";
  const deviceBrowser=/edg\//i.test(ua)?"Edge":/opr\//i.test(ua)?"Opera":/samsungbrowser/i.test(ua)?"Samsung Internet":/firefox\//i.test(ua)?"Firefox":/crios\//i.test(ua)?"Chrome (iOS)":/chrome\//i.test(ua)?"Chrome":/safari\//i.test(ua)?"Safari":/android/i.test(ua)?"Android Browser":"Other";
  const page=(location.pathname.split("/").pop()||"index.html").slice(0,80);
  let lastTick=document.visibilityState==="visible"?Date.now():0,lastWrite=0;
  const record=(type,activeSeconds=0,extra={})=>{
    const data={schemaVersion:3,type,visitorId,visitorName,sessionId,page,deviceType,deviceOS,deviceBrowser,activeSeconds:Math.max(0,Math.min(90,Math.round(activeSeconds))),createdAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(extra.downloadId)data.downloadId=String(extra.downloadId).slice(0,100);
    hubCloud.db.collection("analyticsEvents").add(data).catch(e=>console.warn("MAXTROIT analytics event was not saved:",e));
  };
  record("page_view");
  record("heartbeat");
  const heartbeat=(force=false)=>{
    if(document.visibilityState!=="visible"&&!force)return;
    const now=Date.now(),elapsed=lastTick?Math.min(45,Math.max(0,(now-lastTick)/1000)):0;
    lastTick=document.visibilityState==="visible"?now:0;
    if(now-lastWrite<25000&&!force)return;
    lastWrite=now;
    record("heartbeat",elapsed);
  };
  const timer=setInterval(heartbeat,30000);
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible"){lastTick=Date.now();record("heartbeat");}
    else{heartbeat(true);lastTick=0;}
  });
  document.addEventListener("click",e=>{
    const a=e.target.closest("#download");
    if(a)record("download_click",0,{downloadId:new URLSearchParams(location.search).get("id")||""});
  },true);
  window.addEventListener("pagehide",()=>{heartbeat(true);clearInterval(timer);},{once:true});
})();