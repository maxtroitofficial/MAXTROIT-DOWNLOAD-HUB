/* MAXTROIT Analytics admin workspace */
(()=> {
 const tab=document.querySelector("#analytics-admin-tab"),panel=document.querySelector("#analytics-admin");
 if(!tab||!panel)return;
 const ids=["music-admin","downloads-admin","social-admin","design-studio","flash-editor-panel"];
 const tabs=["music-admin-tab","downloads-admin-tab","social-admin-tab","design-studio-tab","flash-editor-tab"];
 const setOpen=open=>{
   if(open){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true});tabs.forEach(id=>{const el=document.getElementById(id);if(el)el.setAttribute("aria-pressed","false")});document.body.classList.add("analytics-workspace");}
   else document.body.classList.remove("analytics-workspace");
   panel.hidden=!open;tab.setAttribute("aria-pressed",String(open));tab.textContent=open?"← Website Editor":"Analytics";
   if(open)load();
 };
 tab.addEventListener("click",()=>setOpen(panel.hidden));
 document.querySelector("#admin-back")?.addEventListener("click",()=>{if(!panel.hidden)setOpen(false)},true);
 const fmt=n=>Number(n||0).toLocaleString();
 const status=document.querySelector("#analytics-status");
 async function load(){
   if(!window.hubCloud?.ready){status.textContent="Firebase connection unavailable.";return}
   status.textContent="Loading analytics…";
   try{
     const cutoff=new Date(Date.now()-30*86400000);
     const snap=await hubCloud.db.collection("analyticsEvents").where("createdAt",">=",cutoff).orderBy("createdAt","desc").limit(5000).get();
     const rows=snap.docs.map(d=>d.data()),now=Date.now(),today=new Date();today.setHours(0,0,0,0);
     const visitors=new Set(),todayVisitors=new Set(),active=new Set(),pages={},downloads={};let pageViews=0,downloadClicks=0;
     rows.forEach(r=>{
       const t=r.createdAt?.toMillis?r.createdAt.toMillis():0,vid=r.visitorId||"";
       if(vid)visitors.add(vid);
       if(t>=today.getTime()&&vid)todayVisitors.add(vid);
       if(t>=now-5*60000&&vid)active.add(vid);
       if(r.type==="page_view"){pageViews++;pages[r.page||"Other"]=(pages[r.page||"Other"]||0)+1}
       if(r.type==="download_click"){downloadClicks++;const k=r.downloadId||"Unknown";downloads[k]=(downloads[k]||0)+1}
     });
     document.querySelector("#analytics-total-visitors").textContent=fmt(visitors.size);
     document.querySelector("#analytics-today-visitors").textContent=fmt(todayVisitors.size);
     document.querySelector("#analytics-active-users").textContent=fmt(active.size);
     document.querySelector("#analytics-page-views").textContent=fmt(pageViews);
     document.querySelector("#analytics-download-clicks").textContent=fmt(downloadClicks);
     document.querySelector("#analytics-period").textContent="Last 30 days · up to 5,000 recent events";
     const render=(obj,format)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>'<li><span>'+format(k)+'</span><b>'+fmt(v)+'</b></li>').join("")||"<li>No data recorded yet</li>";
     document.querySelector("#analytics-pages-list").innerHTML=render(pages,escapeHtml);
     document.querySelector("#analytics-downloads-list").innerHTML=render(downloads,escapeHtml);
     status.textContent=rows.length?"Analytics updated. Counts are based on tracking started after deployment.":"No analytics recorded yet. Open the public website to start collecting anonymous usage counts.";
   }catch(e){console.error("Analytics load failed:",e);status.textContent="Could not load analytics. Check Firestore rules and indexes, then refresh. "+(e.message||"")}
 }
 function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
 document.querySelector("#analytics-refresh")?.addEventListener("click",load);
 setOpen(false);
})();