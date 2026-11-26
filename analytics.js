/* Privacy-conscious MAXTROIT usage analytics: random browser ID only; no names, emails, IP collection, or fingerprinting. */
(()=> {
  if(!window.hubCloud?.ready || !hubCloud.db) return;
  const safeId=(key,store)=>{
    try { let v=store.getItem(key); if(!v){v=(crypto.randomUUID?crypto.randomUUID():("mx"+Date.now().toString(36)+Math.random().toString(36).slice(2)));store.setItem(key,v)} return v; }
    catch(e){return "ephemeral-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)}
  };
  const visitorId=safeId("maxtroitAnalyticsVisitor",localStorage);
  const sessionId=safeId("maxtroitAnalyticsSession",sessionStorage);
  const page=(location.pathname.split("/").pop()||"index.html").slice(0,80);
  let lastHeartbeat=0;
  const record=(type,extra={})=>{
    const now=Date.now(); if(type==="heartbeat"&&now-lastHeartbeat<55000)return;
    if(type==="heartbeat")lastHeartbeat=now;
    const data={type,visitorId,sessionId,page,createdAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(extra.downloadId)data.downloadId=String(extra.downloadId).slice(0,100);
    hubCloud.db.collection("analyticsEvents").add(data).catch(e=>console.warn("MAXTROIT analytics event was not saved:",e));
  };
  record("page_view"); record("heartbeat");
  const timer=setInterval(()=>{if(document.visibilityState==="visible")record("heartbeat")},60000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")record("heartbeat")});
  document.addEventListener("click",e=>{
    const a=e.target.closest("#download");
    if(a)record("download_click",{downloadId:new URLSearchParams(location.search).get("id")||""});
  },true);
  window.addEventListener("pagehide",()=>clearInterval(timer),{once:true});
})();