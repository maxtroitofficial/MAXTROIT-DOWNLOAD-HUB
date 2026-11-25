(()=>{
const $=s=>document.querySelector(s),cloud=window.hubCloud||{},uid=window.ADMIN_UID;
const grid=$("#ulg-action-grid"),fields=$("#ulg-url-fields"),custom=$("#ulg-custom-rows"),dest=$("#ulg-destination"),generate=$("#ulg-generate"),status=$("#ulg-status"),result=$("#ulg-result"),preview=$("#unlock-live-preview");
if(!grid||!fields||!custom||!dest||!generate||!status||!result||!preview)return;
const names=["Subscribe & Turn on Bell","Add Youtube Channel","Youtube Like","Instagram Followers","Instagram Follow","Facebook Follow","Telegram Join","YouTube Video Like & Comment","WhatsApp Channel Join","TikTok Follow","TikTok Like Video","Join Discord","Like Facebook Post","Follow on Twitter"];
const defaults=["https://www.youtube.com/","https://www.youtube.com/","https://www.youtube.com/","https://www.instagram.com/","https://www.instagram.com/","https://www.facebook.com/","https://t.me/","https://www.youtube.com/","https://whatsapp.com/channel/","https://www.tiktok.com/","https://www.tiktok.com/","https://discord.com/","https://www.facebook.com/","https://x.com/"];
const selected=new Map();let customRows=[];
const authorised=()=>!!cloud.auth?.currentUser&&!!uid&&cloud.auth.currentUser.uid===uid;
const say=t=>status.textContent=t;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function actionIcon(title){const s=String(title).toLowerCase();const brand=s.includes("youtube")||s.includes("subscribe")?"youtube":s.includes("instagram")?"instagram":s.includes("facebook")?"facebook":s.includes("telegram")?"telegram":s.includes("whatsapp")?"whatsapp":s.includes("tiktok")?"tiktok":s.includes("discord")?"discord":"x-twitter";return '<i class="fa-brands fa-'+brand+'" aria-hidden="true"></i>'}

function tasks(){return [...selected.entries()].map(([i,url])=>({title:names[i],url})).concat(customRows.map(x=>({title:x.title,url:x.url})).filter(x=>x.title&&x.url))}
function drawFields(){
 fields.innerHTML=[...selected.entries()].map(([i,url])=>'<div class="ulg-url-row"><b>'+esc(names[i])+'</b><label><input type="url" data-url="'+i+'" value="'+esc(url)+'" placeholder="Paste HTTPS URL"></label><button type="button" class="ulg-remove" data-remove="'+i+'">−</button></div>').join("")||"<p>Select actions above to add their URL fields.</p>";
 fields.querySelectorAll("[data-url]").forEach(el=>el.oninput=()=>{selected.set(Number(el.dataset.url),el.value);drawPreview()});
 fields.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{selected.delete(Number(el.dataset.remove));const b=grid.querySelector('[data-action="'+el.dataset.remove+'"]');b?.setAttribute("aria-pressed","false");drawFields();drawPreview()});
}
function drawCustom(){
 custom.innerHTML=customRows.map((x,i)=>'<div class="ulg-custom-row"><label>Link Name<input data-name="'+i+'" value="'+esc(x.title)+'" placeholder="Link Name"></label><label>Link URL<input data-custom-url="'+i+'" type="url" value="'+esc(x.url)+'" placeholder="Link URL"></label><button class="ulg-remove" type="button" data-custom-remove="'+i+'">✕</button></div>').join("");
 custom.querySelectorAll("[data-name]").forEach(e=>e.oninput=()=>{customRows[Number(e.dataset.name)].title=e.value;drawPreview()});
 custom.querySelectorAll("[data-custom-url]").forEach(e=>e.oninput=()=>{customRows[Number(e.dataset.customUrl)].url=e.value;drawPreview()});
 custom.querySelectorAll("[data-custom-remove]").forEach(e=>e.onclick=()=>{customRows.splice(Number(e.dataset.customRemove),1);drawCustom();drawPreview()});
}
let previewCompleted=new Set();
function drawPreview(){
 const list=tasks(),box=preview.querySelector(".ulp-buttons"),get=preview.querySelector(".ulp-get");
 previewCompleted=new Set();
 box.innerHTML=list.map((t,i)=>'<button class="ulp-social other" type="button" data-preview-step="'+i+'"><span class="ulp-icon">'+actionIcon(t.title)+'</span><span>'+esc(t.title)+'</span><span class="ulp-arrow">›</span></button>').join("");
 const update=()=>{
  const done=previewCompleted.size,total=list.length;
  preview.querySelector(".ulp-count").textContent="Steps Completed "+done+"/"+total;
  preview.querySelector(".ulp-track span").style.width=(total?done/total*100:0)+"%";
  let validDestination=false;
  try{const u=new URL(dest.value.trim());validDestination=u.protocol==="https:"}catch(e){}
  get.disabled=!total||done!==total||!validDestination;
 };
 box.querySelectorAll("[data-preview-step]").forEach(button=>button.addEventListener("click",()=>{
  const i=Number(button.dataset.previewStep);
  previewCompleted.add(i);button.classList.add("is-done");button.disabled=true;
  update();
 }));
 get.disabled=true;
 get.onclick=()=>{
  if(get.disabled)return;
  try{const u=new URL(dest.value.trim());if(u.protocol!=="https:")throw Error();window.open(u.href,"_blank","noopener,noreferrer")}catch(e){say("Valid HTTPS Destination URL enter karein.")}
 };
 update();
}
dest.addEventListener("input",drawPreview);
grid.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{
 const key=b.dataset.action;
 if(key==="custom"){customRows.push({title:"",url:""});drawCustom();return}
 const i=Number(key);
 if(selected.has(i))selected.delete(i);else selected.set(i,defaults[i]);
 b.setAttribute("aria-pressed",String(selected.has(i)));drawFields();drawPreview();
});
generate.textContent="Save Settings";
generate.onclick=async()=>{
 if(!authorised())return say("Admin login required.");
 const destination=dest.value.trim();let parsed;
 try{parsed=new URL(destination);if(parsed.protocol!=="https:")throw Error()}catch(e){return say("Valid HTTPS Destination URL enter karein.")}
 const list=tasks();
 if(list.some(t=>!t.title.trim()||!/^https:\/\//i.test(t.url)))return say("Har selected action ke liye valid HTTPS URL bharein.");
 if(!list.length)return say("Kam se kam ek social action select karein.");
 generate.disabled=true;result.hidden=true;say("Settings Firebase mein save ho rahi hain…");
 try{
  const settings={enabled:true,tasks:list.map(t=>({title:t.title.trim(),url:new URL(t.url).href,enabled:true})),destinationUrl:parsed.href,updated:Date.now()};
  await cloud.db.collection("siteConfig").doc("unlockLinkSettings").set(settings);
  const check=await cloud.db.collection("siteConfig").doc("unlockLinkSettings").get();
  if(!check.exists||check.data()?.destinationUrl!==parsed.href||check.data()?.tasks?.length!==list.length)throw Error("Settings verification failed.");
  say("Settings Firebase mein save aur verify ho gayi. Koi naya download record ya ID create nahi hui.");
 }catch(e){say("Save failed: "+e.message)}finally{generate.disabled=false}
};
drawFields();drawCustom();drawPreview();
if(cloud.auth)cloud.auth.onAuthStateChanged(u=>say(u&&authorised()?"Ready — settings configure karke save karein.":"Admin login required."));
})();