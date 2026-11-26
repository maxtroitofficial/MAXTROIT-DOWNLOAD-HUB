/* MAXTROIT visitor register and analytics workspace */
(()=>{
 "use strict";
 const tab=document.getElementById("analytics-admin-tab"),panel=document.getElementById("analytics-admin");
 if(!tab||!panel)return;
 const status=document.getElementById("analytics-status"),fmt=n=>Number(n||0).toLocaleString();
 const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const duration=s=>{s=Math.max(0,Math.floor(Number(s)||0));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h? h+"h "+m+"m":m?m+"m "+sec+"s":sec+"s";};
 const ago=t=>{if(!t)return"—";const d=Math.max(0,Date.now()-t);if(d<60000)return"Just now";if(d<3600000)return Math.floor(d/60000)+" min ago";if(d<86400000)return Math.floor(d/3600000)+" hr ago";return new Date(t).toLocaleDateString();};
 const closeOthers=()=>{
  ["music-admin","downloads-admin","social-admin","design-studio","flash-editor-panel"].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true});
  ["music-admin-tab","downloads-admin-tab","social-admin-tab","design-studio-tab","flash-editor-tab"].forEach(id=>{const el=document.getElementById(id);if(el)el.setAttribute("aria-pressed","false")});
  ["music-workspace","downloads-workspace","social-workspace","design-workspace"].forEach(c=>document.body.classList.remove(c));
 };
 function setOpen(open){if(open){closeOthers();document.body.classList.add("analytics-workspace");}else document.body.classList.remove("analytics-workspace");panel.hidden=!open;tab.setAttribute("aria-pressed",String(open));tab.textContent=open?"← Website Editor":"Analytics";if(open)load();}
 tab.addEventListener("click",e=>{e.preventDefault();setOpen(panel.hidden);});
 document.getElementById("admin-back")?.addEventListener("click",()=>{if(!panel.hidden)setOpen(false)},true);
 async function load(){
  if(typeof hubCloud==="undefined"||!hubCloud?.ready||!hubCloud.db){if(status)status.textContent="Firebase connection unavailable. Refresh and try again.";return;}
  if(status)status.textContent="Loading visitor register…";
  try{
   const cutoff=new Date(Date.now()-30*86400000);
   const snap=await hubCloud.db.collection("analyticsEvents").where("createdAt",">=",cutoff).orderBy("createdAt","desc").limit(5000).get();
   const rows=snap.docs.map(d=>d.data()).filter(r=>r.schemaVersion===3),now=Date.now(),today=new Date();today.setHours(0,0,0,0);
   const visitors=new Map(),todayVisitors=new Set(),active=new Set(),pages={},downloads={};let pageViews=0,downloadClicks=0;
   rows.forEach(r=>{
    const t=r.createdAt?.toMillis?r.createdAt.toMillis():0,vid=r.visitorId||"",countable=!!vid&&!vid.startsWith("ephemeral-");
    if(!countable)return;
    let v=visitors.get(vid);if(!v){v={name:r.visitorName||("Visitor-"+vid.slice(-6).toUpperCase()),sessions:new Set(),seconds:0,lastSeen:0,lastPage:"—"};visitors.set(vid,v);}
    if(t>v.lastSeen){v.lastSeen=t;v.lastPage=r.page||"—";}
    if(r.type==="page_view"){pageViews++;v.sessions.add(r.sessionId||"unknown");pages[r.page||"Other"]=(pages[r.page||"Other"]||0)+1;if(t>=today.getTime())todayVisitors.add(vid);}
    if(r.type==="heartbeat"){v.seconds+=Math.max(0,Number(r.activeSeconds)||0);if(t>=now-120000)active.add(vid);}
    if(r.type==="download_click"){downloadClicks++;const k=r.downloadId||"Unknown";downloads[k]=(downloads[k]||0)+1;}
   });
   document.getElementById("analytics-total-visitors").textContent=fmt(visitors.size);
   document.getElementById("analytics-today-visitors").textContent=fmt(todayVisitors.size);
   document.getElementById("analytics-active-users").textContent=fmt(active.size);
   document.getElementById("analytics-page-views").textContent=fmt(pageViews);
   document.getElementById("analytics-download-clicks").textContent=fmt(downloadClicks);
   document.getElementById("analytics-period").textContent="Last 30 days · anonymous saved browser IDs · active time is approximate";
   const render=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>'<li><span>'+escapeHtml(k)+'</span><b>'+fmt(v)+'</b></li>').join("")||"<li>No data recorded yet</li>";
   document.getElementById("analytics-pages-list").innerHTML=render(pages);
   document.getElementById("analytics-downloads-list").innerHTML=render(downloads);
   const list=[...visitors.values()].sort((a,b)=>b.lastSeen-a.lastSeen);
   const body=document.getElementById("analytics-visitors-list");
   body.innerHTML=list.length?list.map(v=>'<tr><td>'+escapeHtml(v.name)+'</td><td>'+fmt(v.sessions.size)+'</td><td>'+duration(v.seconds)+'</td><td>'+escapeHtml(v.lastPage)+'</td><td>'+ago(v.lastSeen)+'</td><td>'+(v.lastSeen>=now-120000?"Active":"Away")+'</td></tr>').join(""):'<tr><td colspan="6">No visitors recorded yet</td></tr>';
   if(status)status.textContent=rows.length?"Visitor register updated. Time counts only while the page is visible and open; browser storage resets may create a new anonymous visitor.":"No v3 visitor events yet. Open the public website and keep it visible for at least 30 seconds.";
  }catch(e){console.error("Analytics load failed:",e);if(status)status.textContent="Could not load analytics. Check Firestore rules/indexes, then refresh. "+(e.message||"");}
 }
 document.getElementById("analytics-refresh")?.addEventListener("click",load);
 setOpen(false);
})();