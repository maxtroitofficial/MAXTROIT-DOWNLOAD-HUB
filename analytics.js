/* Privacy-conscious MAXTROIT analytics. Stable anonymous browser ID; no names, emails, IP storage, or fingerprinting. */
(()=>{
  if(!window.hubCloud?.ready || !window.hubCloud.db || !window.firebase?.firestore) return;
  const makeId=()=>window.crypto?.randomUUID?.() || ("mx-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)+"-"+Math.random().toString(36).slice(2));
  const cookieGet=(key)=>{
    const match=document.cookie.match(new RegExp("(?:^|; )"+key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"=([^;]*)"));
    return match?decodeURIComponent(match[1]):"";
  };
  const cookieSet=(key,value)=>{
    try{document.cookie=key+"="+encodeURIComponent(value)+"; Max-Age=31536000; Path=/; SameSite=Lax; Secure";return cookieGet(key)===value;}catch(e){return false;}
  };
  const stableVisitorId=()=>{
    const key="maxtroitAnalyticsVisitor";
    try{let v=window.localStorage.getItem(key);if(v)return v;v=cookieGet(key);if(v){try{window.localStorage.setItem(key,v)}catch(e){}return v;}v=makeId();try{window.localStorage.setItem(key,v);return v;}catch(e){}if(cookieSet(key,v))return v;}catch(e){}
    // Do not count storage-blocked visits as separate unique people on every reload.
    return "ephemeral-"+makeId();
  };
  const stableSessionId=()=>{
    const key="maxtroitAnalyticsSession";
    try{let v=window.sessionStorage.getItem(key);if(!v){v=makeId();window.sessionStorage.setItem(key,v);}return v;}catch(e){return "ephemeral-session";}
  };
  const visitorId=stableVisitorId(),sessionId=stableSessionId();
  const page=(location.pathname.split("/").pop()||"index.html").slice(0,80);
  let lastHeartbeat=0;
  const record=(type,extra={})=>{
    const now=Date.now();if(type==="heartbeat"&&now-lastHeartbeat<55000)return;
    if(type==="heartbeat")lastHeartbeat=now;
    const data={type,visitorId,sessionId,page,createdAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(extra.downloadId)data.downloadId=String(extra.downloadId).slice(0,100);
    hubCloud.db.collection("analyticsEvents").add(data).catch(e=>console.warn("MAXTROIT analytics event was not saved:",e));
  };
  record("page_view");record("heartbeat");
  const timer=setInterval(()=>{if(document.visibilityState==="visible")record("heartbeat")},60000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")record("heartbeat")});
  document.addEventListener("click",e=>{const a=e.target.closest("#download");if(a)record("download_click",{downloadId:new URLSearchParams(location.search).get("id")||""});},true);
  window.addEventListener("pagehide",()=>clearInterval(timer),{once:true});
})();