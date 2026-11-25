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
function socialButtonLabel(task){
 const raw=String(task?.url||"").trim(),given=String(task?.title||"").trim();
 if(given&&!/^https?:\/\//i.test(given))return given;
 try{
  const host=new URL(raw).hostname.toLowerCase().replace(/^www\./,"");
  if(host.includes("youtube")||host==="youtu.be")return "Open YouTube";
  if(host.includes("instagram"))return "Open Instagram";
  if(host.includes("facebook")||host==="fb.watch")return "Open Facebook";
  if(host.includes("t.me")||host.includes("telegram"))return "Join Telegram";
  if(host.includes("whatsapp"))return "Open WhatsApp Channel";
  if(host.includes("tiktok"))return "Open TikTok";
  if(host.includes("discord"))return "Join Discord";
  if(host==="x.com"||host.includes("twitter"))return "Open X / Twitter";
  return "Open Social Link";
 }catch(e){return "Open Social Link"}
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
 const host=document.createElement("section");host.id="view-details-unlock";host.className="view-details-unlock";
 const style=document.createElement("style");
 style.textContent='.view-details-unlock{margin:28px 0 18px;padding:22px;border:1px solid rgba(177,115,255,.32);border-radius:20px;background:linear-gradient(145deg,rgba(40,24,75,.72),rgba(13,18,38,.94));box-shadow:0 16px 45px rgba(0,0,0,.22);text-align:center}.vdu-shield{width:54px;height:54px;margin:0 auto 12px;display:grid;place-items:center;border-radius:18px;background:rgba(34,197,94,.14);color:#4ade80;font-size:28px}.view-details-unlock h2{margin:0 0 8px;font-size:1.35rem}.view-details-unlock p{margin:8px 0;color:var(--muted,#aab2ca);line-height:1.6}.vdg-timer{font-size:clamp(2rem,8vw,3rem);font-weight:800;letter-spacing:.04em;margin:16px 0;color:var(--text,#fff)}.vdu-actions{display:grid;grid-template-columns:1fr;gap:11px;margin:20px 0}.vdu-step{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:58px;padding:12px 15px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(255,255,255,.045);color:#fff;text-decoration:none;text-align:left;font-weight:750}.vdu-step:after{content:"↗";font-size:18px;color:#c4b5fd}.vdu-step.is-done{border-color:rgba(34,197,94,.65);background:rgba(34,197,94,.1)}.vdu-step.is-done:after{content:"✓";color:#4ade80;font-size:21px}.vdu-progress{height:9px;margin:10px 0 6px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}.vdu-progress span{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#22c55e,#86efac);transition:width .2s}.vdu-count{font-size:.9rem;font-weight:750;color:#fff!important}.vdg-main-button{display:block;width:100%;min-height:58px;margin-top:14px;padding:16px 22px;border:0;border-radius:14px;background:linear-gradient(100deg,#16a34a,#22c55e);color:#fff;font-size:1.08rem;font-weight:800;text-align:center;cursor:pointer;text-decoration:none}.vdg-main-button:disabled{opacity:.45;cursor:not-allowed}.vdg-note{font-size:.82rem!important}@media(min-width:560px){.vdu-actions{grid-template-columns:1fr 1fr}.vdu-step{min-height:66px}}';
 document.head.appendChild(style);
 const shield=document.createElement("div");shield.className="vdu-shield";shield.textContent="✓";shield.setAttribute("aria-hidden","true");
 const heading=document.createElement("h2");heading.textContent="Your Link is Ready";
 const intro=document.createElement("p");intro.textContent="Complete the steps below to unlock your download link.";
 const timer=document.createElement("div");timer.className="vdg-timer";timer.setAttribute("aria-live","polite");
 const message=document.createElement("p");message.setAttribute("role","status");
 const action=document.createElement("button");action.type="button";action.className="vdg-main-button";action.hidden=true;
 const tasksHost=document.createElement("div");tasksHost.className="vdu-actions";tasksHost.hidden=true;
 const count=document.createElement("p");count.className="vdu-count";count.textContent="Steps Completed 0/0";count.hidden=true;
 const progress=document.createElement("div");progress.className="vdu-progress";progress.hidden=true;
 const progressFill=document.createElement("span");progress.append(progressFill);
 const note=document.createElement("p");note.className="vdg-note";note.textContent="Social actions are confirmed by your own click. This website cannot automatically verify follows, subscriptions, likes, or comments.";
 host.append(shield,heading,intro,timer,message,action,tasksHost,count,progress,note);link.parentNode.insertBefore(host,link);
 let config={enabled:true,timerMinutes:1,tasks:[]};
 try{if(window.hubCloud?.ready){const snap=await hubCloud.db.collection("siteConfig").doc("public").get();const saved=snap.exists?snap.data()?.viewDetailsGate:null;if(saved&&typeof saved==="object")config={...config,...saved}}}catch(e){console.warn("View Details unlock settings unavailable:",e)}
 const tasks=Array.isArray(config.tasks)?config.tasks.filter(t=>t&&t.enabled!==false&&typeof t.title==="string"&&/^https:\/\//i.test(String(t.url||""))):[];
 let started=0,interval=null;
 const showSteps=()=>{
  timer.hidden=true;action.hidden=true;message.textContent="Tap each social button to complete its step.";tasksHost.hidden=false;tasksHost.replaceChildren();count.hidden=false;progress.hidden=false;
  const completed=new Set();
  tasks.forEach((task,index)=>{
   const button=document.createElement("a");button.className="vdu-step";button.href=task.url;button.target="_blank";button.rel="noopener noreferrer";button.textContent=socialButtonLabel(task);
   button.addEventListener("click",()=>{completed.add(index);button.classList.add("is-done");button.setAttribute("aria-label",task.title+" completed");updateProgress()});tasksHost.append(button);
  });
  function updateProgress(){const done=completed.size,total=tasks.length;count.textContent="Steps Completed "+done+"/"+total;progressFill.style.width=(total?done/total*100:100)+"%";if(done===total){message.textContent="All steps completed. Your download is unlocked.";link.hidden=false;link.href=finalUrl;link.textContent="Get Your Link ↗";link.scrollIntoView({behavior:"smooth",block:"nearest"})}}
  updateProgress();
  if(!tasks.length){message.textContent="No social steps are configured.";link.hidden=false;link.href=finalUrl;link.textContent="Get Your Link ↗"}
 };
 const beginSteps=()=>{if(tasks.length)showSteps();else{message.textContent="Your download is ready.";link.hidden=false;link.href=finalUrl;link.textContent="Get Your Link ↗"}};
 if(config.enabled===false){timer.hidden=true;beginSteps()}
 else{
  const seconds=Math.min(600,Math.max(1,Math.round(Number(config.timerMinutes)*60)||60));const key="maxtroit-view-details-start:"+encodeURIComponent(id||"");
  try{started=Number(sessionStorage.getItem(key))||0;if(!started||started>Date.now()||Date.now()-started>seconds*1000+3600000){started=Date.now();sessionStorage.setItem(key,String(started))}}catch(e){started=Date.now()}
  action.textContent="Continue";action.hidden=true;message.textContent="Please wait for the timer to finish.";
  const update=()=>{const remaining=Math.max(0,seconds-Math.floor((Date.now()-started)/1000));timer.textContent=Math.floor(remaining/60).toString().padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");if(remaining<=0){clearInterval(interval);timer.textContent="00:00";message.textContent="Timer complete. Tap Continue.";action.hidden=false}};
  update();interval=setInterval(update,250);
 }
 action.addEventListener("click",()=>{action.hidden=true;beginSteps()});
}
