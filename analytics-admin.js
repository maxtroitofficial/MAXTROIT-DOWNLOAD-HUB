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
   const visitors=new Map(),todayVisitors=new Set(),active=new Set(),pages={},downloads={},uniquePageLoads=new Set();let pageViews=0,downloadClicks=0;
   const daily={},dailyUniquePageLoads=new Set();
   rows.forEach(r=>{
    const t=r.createdAt?.toMillis?r.createdAt.toMillis():0,vid=r.visitorId||"",countable=!!vid&&!vid.startsWith("ephemeral-");
    if(!countable)return;
    let v=visitors.get(vid);if(!v){v={name:r.visitorName||("Visitor-"+vid.slice(-6).toUpperCase()),sessions:new Set(),pageViews:0,seconds:0,firstSeen:t||now,lastSeen:0,lastPage:"—",deviceType:r.deviceType||"Unknown",deviceOS:r.deviceOS||"Unknown",deviceBrowser:r.deviceBrowser||"Unknown"};visitors.set(vid,v);}
    if(t&&t<v.firstSeen)v.firstSeen=t;if(t>v.lastSeen){v.lastSeen=t;v.lastPage=r.page||"—";v.deviceType=r.deviceType||v.deviceType;v.deviceOS=r.deviceOS||v.deviceOS;v.deviceBrowser=r.deviceBrowser||v.deviceBrowser;}
    if(r.type==="page_view"){const sid=r.sessionId||"unknown",pg=r.page||"Other",uniqueKey=vid+"|"+sid+"|"+pg;v.sessions.add(sid);if(!uniquePageLoads.has(uniqueKey)){uniquePageLoads.add(uniqueKey);pageViews++;v.pageViews++;pages[pg]=(pages[pg]||0)+1;}if(t>=today.getTime())todayVisitors.add(vid);}
    if(r.type==="heartbeat"){v.seconds+=Math.max(0,Number(r.activeSeconds)||0);if(t>=now-120000)active.add(vid);}
    if(t){const dayKey=new Date(t).toISOString().slice(0,10);if(!daily[dayKey])daily[dayKey]={views:0,downloads:0};if(r.type==="page_view"){const dailyKey=vid+"|"+(r.sessionId||"unknown")+"|"+(r.page||"Other");if(!dailyUniquePageLoads.has(dailyKey)){dailyUniquePageLoads.add(dailyKey);daily[dayKey].views++;}}if(r.type==="download_click")daily[dayKey].downloads++;}
    if(r.type==="download_click"){downloadClicks++;const k=r.downloadId||"Unknown";downloads[k]=(downloads[k]||0)+1;}
   });
   document.getElementById("analytics-total-visitors").textContent=fmt(visitors.size);
   document.getElementById("analytics-today-visitors").textContent=fmt(todayVisitors.size);
   document.getElementById("analytics-active-users").textContent=fmt(active.size);
   document.getElementById("analytics-page-views").textContent=fmt(pageViews);
   document.getElementById("analytics-download-clicks").textContent=fmt(downloadClicks);
   const returning=[...visitors.values()].filter(v=>v.sessions.size>1).length;
   const newVisitors=visitors.size-returning;
   document.getElementById("analytics-returning-visitors").textContent=fmt(returning);
   document.getElementById("analytics-new-visitors").textContent=fmt(newVisitors);
   document.getElementById("analytics-conversion").textContent=(pageViews?((downloadClicks/pageViews)*100).toFixed(1):"0.0")+"%";
   const chart=document.getElementById("analytics-daily-chart"),days=[];
   for(let n=6;n>=0;n--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);const key=d.toISOString().slice(0,10);days.push({key,label:d.toLocaleDateString([],{weekday:"short"}),...(daily[key]||{views:0,downloads:0})});}
   const maxBar=Math.max(1,...days.flatMap(d=>[d.views,d.downloads]));
   if(chart)chart.innerHTML=days.map(d=>'<div class="analytics-day"><span>'+escapeHtml(d.label)+'</span><div class="analytics-bars"><i title="Page views: '+d.views+'" style="width:'+Math.round(d.views/maxBar*100)+'%"></i><b title="Download clicks: '+d.downloads+'" style="width:'+Math.round(d.downloads/maxBar*100)+'%"></b></div><small>'+fmt(d.views)+' views · '+fmt(d.downloads)+' clicks</small></div>').join("");

   document.getElementById("analytics-period").textContent="Last 30 days · unique visitor + session + page (repeat reloads in same session counted once) · active time is approximate";
   const render=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>'<li><span>'+escapeHtml(k)+'</span><b>'+fmt(v)+'</b></li>').join("")||"<li>No data recorded yet</li>";
   document.getElementById("analytics-pages-list").innerHTML=render(pages);
   document.getElementById("analytics-downloads-list").innerHTML=render(downloads);
   const dateTime=t=>t?new Date(t).toLocaleString([],{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"—";
   const list=[...visitors.values()].sort((a,b)=>b.lastSeen-a.lastSeen);
   const chart=document.getElementById("analytics-daily-chart");if(chart)chart.innerHTML="<p>No data recorded yet</p>";
   const body=document.getElementById("analytics-visitors-list");
   body.innerHTML=list.length?list.map(v=>'<tr><td>'+escapeHtml(v.name)+'</td><td>'+escapeHtml(v.deviceType)+'</td><td>'+escapeHtml(v.deviceOS)+'</td><td>'+escapeHtml(v.deviceBrowser)+'</td><td>'+fmt(v.sessions.size)+'</td><td>'+fmt(v.pageViews)+'</td><td>'+duration(v.seconds)+'</td><td>'+dateTime(v.firstSeen)+'</td><td>'+dateTime(v.lastSeen)+'</td><td>'+escapeHtml(v.lastPage)+'</td><td>'+(v.lastSeen>=now-120000?"Active":"Away")+'</td></tr>').join(""):'<tr><td colspan="11">No visitors recorded yet</td></tr>';
   if(status)status.textContent=rows.length?"Visitor register updated. Time counts only while the page is visible and open; browser storage resets may create a new anonymous visitor.":"No v3 visitor events yet. Open the public website and keep it visible for at least 30 seconds.";
  }catch(e){console.error("Analytics load failed:",e);if(status)status.textContent="Could not load analytics. Check Firestore rules/indexes, then refresh. "+(e.message||"");}
 }

 async function clearAllAnalytics(){
  if(typeof hubCloud==="undefined"||!hubCloud?.ready||!hubCloud.db){if(status)status.textContent="Firebase connection unavailable. Nothing was deleted.";return;}
  const ok=window.confirm("Clear ALL analytics history and visitor list? This permanently deletes analytics events only. Website content, downloads and user data will not be changed.");
  if(!ok)return;
  const btn=document.getElementById("analytics-clear-all");
  if(btn)btn.disabled=true;
  if(status)status.textContent="Clearing analytics history…";
  try{
   let removed=0;
   while(true){
    const snap=await hubCloud.db.collection("analyticsEvents").limit(400).get();
    if(snap.empty)break;
    const batch=hubCloud.db.batch();
    snap.docs.forEach(doc=>batch.delete(doc.ref));
    await batch.commit();
    removed+=snap.size;
   }
   ["analytics-total-visitors","analytics-today-visitors","analytics-active-users","analytics-page-views","analytics-download-clicks","analytics-returning-visitors","analytics-new-visitors","analytics-conversion"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent="0";});
   ["analytics-pages-list","analytics-downloads-list"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML="<li>No data recorded yet</li>";});
   const body=document.getElementById("analytics-visitors-list");
   if(body)body.innerHTML='<tr><td colspan="10">No visitors recorded yet</td></tr>';
   if(status)status.textContent="Analytics reset complete. "+removed+" old event(s) deleted. New visits will appear from now on.";
  }catch(e){
   console.error("Analytics reset failed:",e);
   if(status)status.textContent="Could not clear analytics. Check admin permissions and try again. "+(e.message||"");
  }finally{if(btn)btn.disabled=false;}
 }
 document.getElementById("analytics-refresh")?.addEventListener("click",load);
 document.getElementById("analytics-clear-all")?.addEventListener("click",clearAllAnalytics);
 setOpen(false);
})();