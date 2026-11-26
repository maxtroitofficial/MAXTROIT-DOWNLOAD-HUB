/* MAXTROIT Analytics admin workspace — resilient tab switching */
(()=> {
 "use strict";
 const tab=document.getElementById("analytics-admin-tab"),panel=document.getElementById("analytics-admin");
 if(!tab||!panel)return;
 const status=document.getElementById("analytics-status");
 const fmt=n=>Number(n||0).toLocaleString();
 const closeOthers=()=>{
  ["music-admin","downloads-admin","social-admin","design-studio","flash-editor-panel"].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true});
  ["music-admin-tab","downloads-admin-tab","social-admin-tab","design-studio-tab","flash-editor-tab"].forEach(id=>{const el=document.getElementById(id);if(el)el.setAttribute("aria-pressed","false")});
  ["music-workspace","downloads-workspace","social-workspace","design-workspace"].forEach(c=>document.body.classList.remove(c));
 };
 function setOpen(open){
  if(open){closeOthers();document.body.classList.add("analytics-workspace");}
  else document.body.classList.remove("analytics-workspace");
  panel.hidden=!open;tab.setAttribute("aria-pressed",String(open));tab.textContent=open?"← Website Editor":"Analytics";
  if(open)load();
 }
 tab.addEventListener("click",e=>{e.preventDefault();setOpen(panel.hidden);});
 document.getElementById("admin-back")?.addEventListener("click",()=>{if(!panel.hidden)setOpen(false)},true);
 const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function load(){
  if(typeof hubCloud==="undefined"||!hubCloud?.ready||!hubCloud.db){if(status)status.textContent="Firebase connection unavailable. Refresh and try again.";return;}
  if(status)status.textContent="Loading analytics…";
  try{
   const cutoff=new Date(Date.now()-30*86400000);
   const snap=await hubCloud.db.collection("analyticsEvents").where("createdAt",">=",cutoff).orderBy("createdAt","desc").limit(5000).get();
   const rows=snap.docs.map(d=>d.data()).filter(r=>r.schemaVersion===2),now=Date.now(),today=new Date();today.setHours(0,0,0,0);
   const visitors=new Set(),todayVisitors=new Set(),active=new Set(),pages={},downloads={};let pageViews=0,downloadClicks=0;
   rows.forEach(r=>{const t=r.createdAt?.toMillis?r.createdAt.toMillis():0,vid=r.visitorId||"",countable=!!vid&&!vid.startsWith("ephemeral-");if(r.type==="page_view"){pageViews++;pages[r.page||"Other"]=(pages[r.page||"Other"]||0)+1;if(countable){visitors.add(vid);if(t>=today.getTime())todayVisitors.add(vid);}}if(r.type==="heartbeat"&&countable&&t>=now-300000)active.add(vid);if(r.type==="download_click"){downloadClicks++;const k=r.downloadId||"Unknown";downloads[k]=(downloads[k]||0)+1;}});
   document.getElementById("analytics-total-visitors").textContent=fmt(visitors.size);
   document.getElementById("analytics-today-visitors").textContent=fmt(todayVisitors.size);
   document.getElementById("analytics-active-users").textContent=fmt(active.size);
   document.getElementById("analytics-page-views").textContent=fmt(pageViews);
   document.getElementById("analytics-download-clicks").textContent=fmt(downloadClicks);
   document.getElementById("analytics-period").textContent="Since analytics v2 deployment · unique saved browser IDs";
   const render=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>'<li><span>'+escapeHtml(k)+'</span><b>'+fmt(v)+'</b></li>').join("")||"<li>No data recorded yet</li>";
   document.getElementById("analytics-pages-list").innerHTML=render(pages);
   document.getElementById("analytics-downloads-list").innerHTML=render(downloads);
   if(status)status.textContent=rows.length?"Analytics updated. Fresh analytics baseline: distinct saved browser IDs only; repeat opens on the same browser count once. Legacy events are excluded so old duplicate IDs do not inflate the new baseline.":"No analytics recorded yet. Open the public website to start collecting anonymous usage counts.";
  }catch(e){console.error("Analytics load failed:",e);if(status)status.textContent="Could not load analytics. Check Firestore rules and indexes, then refresh. "+(e.message||"");}
 }
 document.getElementById("analytics-refresh")?.addEventListener("click",load);
 setOpen(false);
})();