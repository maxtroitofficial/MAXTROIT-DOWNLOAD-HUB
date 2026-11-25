const id=new URLSearchParams(location.search).get("id");
const title=document.querySelector("#title"),description=document.querySelector("#description"),link=document.querySelector("#download"),error=document.querySelector("#error");

async function applyBrandLogo(){
 const mark=document.querySelector(".brand-mark");
 if(!mark)return;
 const showFallback=()=>{mark.textContent="M";mark.style.visibility="visible";};
 if(!window.hubCloud?.ready){showFallback();return;}
 try{
  const snap=await hubCloud.db.collection("siteConfig").doc("public").get();
  const logo=snap.exists?String(snap.data()?.logo||""):"";
  if(!/^https:\/\/|^data:image\//i.test(logo)){showFallback();return;}
  const img=new Image();
  img.alt="MAXTROIT OFFICIAL";
  img.onload=()=>{mark.replaceChildren(img);mark.style.visibility="visible";};
  img.onerror=showFallback;
  img.src=logo;
 }catch(e){console.warn("MAXTROIT brand logo could not load on download page:",e);showFallback();}
}

async function findItem(){
 if(!id) return null;
 if(!window.hubCloud?.ready) throw new Error("Cloud database is not connected.");
 const d=await hubCloud.db.collection("downloads").doc(id).get();
 return d.exists?{id:d.id,...d.data()}:null;
}
function previewEmbedUrl(raw){try{const u=new URL(raw);if(u.protocol!=="https:")return "";const host=u.hostname.toLowerCase().replace(/^www\./,"");let id=(()=>{if(u.hostname==="youtu.be")return u.pathname.split("/").filter(Boolean)[0]||"";if(["youtube.com","www.youtube.com","m.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(u.hostname)){if(u.pathname==="/watch")return u.searchParams.get("v")||"";const m=u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);return m?m[2]:""}return ""})();if(id)return "https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?controls=1&mute=0&playsinline=1";if(host==="soundcloud.com"||host==="on.soundcloud.com"||host==="m.soundcloud.com"){return "https://w.soundcloud.com/player/?url="+encodeURIComponent(u.href)+"&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true"}if(host==="instagram.com"){const m=u.pathname.match(/^\/(p|reel|tv)\/([^/?#]+)/);if(m)return "https://www.instagram.com/"+m[1]+"/"+encodeURIComponent(m[2])+"/embed/"}if(host==="tiktok.com"||host==="m.tiktok.com"){const m=u.pathname.match(/\/@[^/]+\/(video|photo)\/(\d+)/);if(m&&m[1]==="video")return "https://www.tiktok.com/embed/v2/"+m[2]}if(host==="facebook.com"||host==="m.facebook.com"||host==="fb.watch"){if(/\/(watch|reel|videos)\b/.test(u.pathname)||host==="fb.watch")return "https://www.facebook.com/plugins/video.php?href="+encodeURIComponent(u.href)+"&show_text=false&width=560"}if(host==="vimeo.com"){const m=u.pathname.match(/\/(\d+)/);if(m)return "https://player.vimeo.com/video/"+m[1]}if(host==="dailymotion.com"||host==="dai.ly"){const m=host==="dai.ly"?u.pathname.match(/^\/([^/?]+)/):u.pathname.match(/\/video\/([^_/?]+)/);if(m)return "https://www.dailymotion.com/embed/video/"+m[1]}if(host==="streamable.com"){const m=u.pathname.match(/^\/([a-zA-Z0-9]+)/);if(m)return "https://streamable.com/e/"+m[1]}if(host==="drive.google.com"){const m=u.pathname.match(/\/file\/d\/([^/]+)/);if(m)return "https://drive.google.com/file/d/"+m[1]+"/preview"}if(host==="twitch.tv"){const c=u.pathname.match(/\/clip\/([^/?]+)/);if(c)return "https://clips.twitch.tv/embed?clip="+c[1]+"&parent=d-hub.web.app";const v=u.pathname.match(/^\/videos\/(\d+)/);if(v)return "https://player.twitch.tv/?video="+v[1]+"&parent=d-hub.web.app"}return u.href}catch(e){return ""}}async function showDownloadPreview(item){const host=document.querySelector("#download-preview");if(!host)return;let node=null;const raw=item.previewVideo||item.youtubeUrl||"";if(raw&&/^https:\/\//i.test(raw)){if(item.previewVideo&&/\.(mp4|webm|ogg|m4v)(\?|#|$)/i.test(raw)){node=document.createElement("video");node.src=raw;node.controls=true;node.playsInline=true;node.preload="metadata";if(item.thumbnail)node.poster=item.thumbnail}else{const src=previewEmbedUrl(raw);if(src){node=document.createElement("iframe");node.src=src;node.title="External video preview";node.allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share";node.allowFullscreen=true;node.referrerPolicy="strict-origin-when-cross-origin"}}}if(node){host.replaceChildren(node);host.hidden=false}else host.hidden=true}
(async()=>{
 await applyBrandLogo();
 try{
  const item=await findItem();
  if(!item||!item.url) throw new Error("This download is unavailable.");
  const parsed=new URL(item.url);
  if(!["http:","https:"].includes(parsed.protocol)) throw new Error("Invalid download link.");
  title.textContent=item.title||"Download";
  await showDownloadPreview(item);
  description.textContent=item.description||"";
  link.href=parsed.href;
  link.hidden=true;
  document.title=(item.title||"Download")+" · MAXTROIT OFFICIAL";
  await showViewDetailsGate(parsed.href);
 }catch(e){
  console.error("Download details:",e);
  title.textContent="Download unavailable";
  description.hidden=true;
  error.hidden=false;
 }
})();

async function showViewDetailsGate(finalUrl){
 const host=document.createElement("section");
 host.id="view-details-unlock";
 host.className="view-details-unlock";
 const style=document.createElement("style");
 style.textContent=`
 .view-details-unlock{margin:28px 0 18px;padding:22px;border:1px solid rgba(177,115,255,.32);border-radius:20px;background:linear-gradient(145deg,rgba(40,24,75,.72),rgba(13,18,38,.94));box-shadow:0 16px 45px rgba(0,0,0,.22)}
 .view-details-unlock h2{margin:0 0 8px;font-size:1.2rem}.view-details-unlock p{margin:8px 0;color:var(--muted,#aab2ca);line-height:1.6}
 .vdg-timer{font-size:clamp(2rem,8vw,3rem);font-weight:800;letter-spacing:.04em;margin:16px 0;color:var(--text,#fff)}
 .vdg-main-button{display:block;width:100%;min-height:58px;margin-top:14px;padding:16px 22px;border:0;border-radius:14px;background:linear-gradient(100deg,#a855f7,#ec4899);color:#fff;font-size:1.08rem;font-weight:800;text-align:center;cursor:pointer}
 .vdg-main-button:disabled{opacity:.55;cursor:not-allowed}.vdg-task{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:14px 0;border-top:1px solid rgba(255,255,255,.1)}
 .vdg-task strong{flex:1 1 140px}.vdg-task a{color:#f0abfc;text-decoration:underline}.vdg-task label{display:flex;align-items:center;gap:8px;font-size:.92rem}
 .vdg-task input{width:18px;height:18px;accent-color:#d946ef}.vdg-note{font-size:.82rem!important}
 `;
 document.head.appendChild(style);
 const heading=document.createElement("h2");heading.textContent="Unlock download";
 const intro=document.createElement("p");intro.textContent="Complete the steps below to continue to your download.";
 const timer=document.createElement("div");timer.className="vdg-timer";timer.setAttribute("aria-live","polite");
 const message=document.createElement("p");message.setAttribute("role","status");
 const action=document.createElement("button");action.type="button";action.className="vdg-main-button";action.hidden=true;
 const tasksHost=document.createElement("div");tasksHost.hidden=true;
 const note=document.createElement("p");note.className="vdg-note";note.textContent="Social tasks are confirmed by your own check. Opening a social link does not let this website verify a follow or subscription.";
 host.append(heading,intro,timer,message,action,tasksHost,note);
 link.parentNode.insertBefore(host,link);
 let config={enabled:true,timerMinutes:1,tasks:[]};
 try{
  if(window.hubCloud?.ready){
   const snap=await hubCloud.db.collection("siteConfig").doc("public").get();
   const saved=snap.exists?snap.data()?.viewDetailsGate:null;
   if(saved&&typeof saved==="object")config={...config,...saved};
  }
 }catch(e){console.warn("View Details unlock settings unavailable:",e)}
 const tasks=Array.isArray(config.tasks)?config.tasks.filter(t=>t&&t.enabled!==false&&typeof t.title==="string"&&/^https:\/\//i.test(String(t.url||""))):[];
 const showTasks=()=>{
  timer.hidden=true;message.textContent="Now complete the required social media steps.";
  action.hidden=true;tasksHost.hidden=false;tasksHost.replaceChildren();
  tasks.forEach((task,index)=>{
   const row=document.createElement("div");row.className="vdg-task";
   const name=document.createElement("strong");name.textContent="Step "+(index+1)+": "+task.title;
   const open=document.createElement("a");open.href=task.url;open.target="_blank";open.rel="noopener noreferrer";open.textContent="Open link ↗";
   const label=document.createElement("label"),check=document.createElement("input");check.type="checkbox";check.setAttribute("aria-label","Confirm "+task.title);
   const text=document.createElement("span");text.textContent="I've completed this step";
   label.append(check,text);row.append(name,open,label);tasksHost.append(row);
   check.addEventListener("change",updateCompletion);
  });
  updateCompletion();
 };
 function updateCompletion(){
  const checks=[...tasksHost.querySelectorAll('input[type="checkbox"]')];
  const done=checks.filter(c=>c.checked).length;
  message.textContent=checks.length?done+" of "+checks.length+" tasks completed.": "No social tasks are required.";
  link.hidden=done!==checks.length;
  if(done===checks.length)link.scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 if(config.enabled===false||Number(config.timerMinutes)<=0){
  timer.hidden=true;message.textContent="Ready when you are.";
  action.textContent="View Details";action.hidden=false;
 }else{
  const seconds=Math.min(600,Math.max(1,Math.round(Number(config.timerMinutes)*60)||60));
  const key="maxtroit-view-details-start:"+encodeURIComponent(id||"");
  let started=0;
  try{started=Number(sessionStorage.getItem(key))||0;if(!started||started>Date.now()||Date.now()-started>seconds*1000+3600000){started=Date.now();sessionStorage.setItem(key,String(started))}}catch(e){started=Date.now()}
  action.hidden=true;message.textContent="Please wait for the timer to finish.";
  let interval=null;
  const update=()=>{
   const remaining=Math.max(0,seconds-Math.floor((Date.now()-started)/1000));
   timer.textContent=Math.floor(remaining/60).toString().padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");
   if(remaining<=0){clearInterval(interval);timer.textContent="00:00";message.textContent="Timer complete. Tap below to continue.";action.textContent="View Details";action.hidden=false}
  };
  update();interval=setInterval(update,250);
 }
 action.addEventListener("click",()=>{
  action.hidden=true;
  if(tasks.length)showTasks();
  else{timer.hidden=true;message.textContent="All steps complete.";link.hidden=false}
 });
 if(!tasks.length){note.hidden=true}
}
