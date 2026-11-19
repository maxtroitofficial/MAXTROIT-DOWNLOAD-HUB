const $=s=>document.querySelector(s),loginScreen=$("#login-screen"),adminApp=$("#admin-app"),login=$("#login-form"),status=$("#admin-status"),loginStatus=$("#login-status"),itemForm=$("#item-form"),adminList=$("#admin-list");
const ready=!!window.hubCloud?.ready,adminUid=window.ADMIN_UID;
let items=[],thumbData="",thumbRemoved=false,logoData="",bannerData="",siteSettings={},customSections=[],sectionOrder=["hero","collection"];
function safe(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function imageSrc(s=""){const v=String(s||"");return /^(https?:\/\/|data:image\/[a-z0-9.+-]+;base64,)/i.test(v)?v:""}
function isAdmin(u){return !!u&&!!adminUid&&u.uid===adminUid}
function say(t){status.textContent=t}
function loginSay(t){loginStatus.textContent=t}
function errorText(e){if(!navigator.onLine)return "You appear to be offline. Reconnect and try again.";if(e?.code==="app/timeout")return "The request timed out. Its final status may be uncertain; check the list before retrying.";return e?.message||"Check your connection and Firebase permissions."}
function withTimeout(p,label,ms=15000){let timer;return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>{const e=new Error(label+" timed out.");e.code="app/timeout";reject(e)},ms)})]).finally(()=>clearTimeout(timer))}
function setBusy(form,busy,label){const b=form.querySelector('button[type="submit"]');if(!b)return;b.disabled=busy;if(!busy){b.textContent=label;return}b.dataset.original=b.textContent;b.textContent="Saving…"}
function endBusy(form,label){const b=form.querySelector('button[type="submit"]');if(b){b.disabled=false;b.textContent=label}}
function showView(name){document.querySelectorAll(".admin-view").forEach(v=>v.hidden=v.id!=="view-"+name);document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));$("#view-title").textContent=({overview:"Overview",uploads:"Downloads",website:"Website editor",templates:"Templates"})[name]||"Overview"}
document.querySelectorAll("[data-view],[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view||b.dataset.goto)));
const templateNames={midnight:"Midnight",clean:"Clean Light",neon:"Neon Grid",editorial:"Editorial",ocean:"Ocean Glass",sunset:"Sunset Studio",minimal:"Minimal Mono"};
let activeTemplate="midnight",previewedTemplateId=null;
function renderTemplateStates(){Object.keys(templateNames).forEach(id=>{const state=document.querySelector('[data-template-state="'+id+'"]'),card=document.querySelector('[data-template-card="'+id+'"]');if(state)state.textContent=activeTemplate===id?"ACTIVE":"";if(card)card.classList.toggle("is-active",activeTemplate===id)});$("#active-template-label").textContent="Current: "+(templateNames[activeTemplate]||"Midnight")}
function openTemplatePreview(id){if(!templateNames[id])return;previewedTemplateId="builtin:"+id;const panel=$("#template-preview-panel"),frame=$("#template-preview-frame");$("#template-preview-title").textContent=templateNames[id]+" — full website preview";panel.hidden=false;frame.src=new URL("index.html?templatePreview="+encodeURIComponent(id)+"&previewReload="+Date.now(),location.href).href;frame.onload=()=>{try{frame.contentWindow.focus()}catch(e){}};panel.scrollIntoView({behavior:"smooth",block:"start"})}
document.querySelectorAll("[data-template-tab]").forEach(b=>b.addEventListener("click",()=>{const mine=b.dataset.templateTab==="mine";document.querySelectorAll("[data-template-tab]").forEach(x=>{const on=x===b;x.classList.toggle("is-active",on);x.setAttribute("aria-selected",String(on))});$("#template-ready-panel").hidden=mine;$("#template-mine-panel").hidden=!mine;if(mine)renderCustomTemplateLibrary()}));
document.querySelectorAll("[data-template-preview]").forEach(b=>b.addEventListener("click",()=>openTemplatePreview(b.dataset.templatePreview)));
document.querySelectorAll("[data-template-apply]").forEach(b=>b.addEventListener("click",async()=>{const id=b.dataset.templateApply;if(!templateNames[id]||!requireAdmin())return;if(!confirm("Apply "+templateNames[id]+" to your public website? Your downloads, links and website text will stay unchanged."))return;b.disabled=true;try{const ref=hubCloud.db.collection("siteConfig").doc("public");await withTimeout(ref.set({templateId:id,activeUploadedTemplateId:null,activeCustomTemplateId:null,customTemplate:null,templateUpdated:Date.now()},{merge:true}),"Applying template");const verify=await withTimeout(ref.get(),"Verifying template");if(!verify.exists||verify.data().templateId!==id)throw Error("Template save could not be verified. Refresh the admin panel and check the current template.");activeTemplate=id;renderTemplateStates();say(templateNames[id]+" template applied. Refresh the public website to see it.")}catch(err){say("Template could not be applied: "+errorText(err))}finally{b.disabled=false}}));
function closeTemplatePreview(){$("#template-preview-panel").hidden=true;$("#template-preview-frame").src="about:blank";if($("#template-preview-frame")._maxTemplateCleanup)$("#template-preview-frame")._maxTemplateCleanup();previewedTemplateId=null}
$("#close-template-preview").addEventListener("click",closeTemplatePreview);$("#preview-uploaded-template").disabled=true;$("#apply-uploaded-template").disabled=true;

let pendingUploadedTemplate=null,uploadedTemplateLibrary=[];
function templateStatus(t){$("#template-import-status").textContent=t}
function templateBridge(){return String.raw`<script>
/* MAXTROIT_BRIDGE_V2 */
(function(){
  function send(type,extra){try{parent.postMessage(Object.assign({type:type},extra||{}),"*")}catch(e){}}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  var current=[],query="",category="";
  function filtered(){return current.filter(function(x){return (!query||(String(x.title||"")+" "+String(x.description||"")+" "+String(x.category||"")).toLowerCase().indexOf(query)>=0)&&(!category||String(x.category||"")===category)})}
  function render(){
    var host=document.querySelector("[data-maxtroit-downloads]")||document.querySelector("#downloads")||document.querySelector("#grid")||document.querySelector(".downloads-grid")||document.querySelector(".grid");
    if(!host){host=document.createElement("section");host.setAttribute("data-maxtroit-downloads","");(document.querySelector("main")||document.body).appendChild(host)}
    var list=filtered();
    host.innerHTML=list.map(function(x){var img=/^(https?:\/\/|data:image\/)/i.test(String(x.thumbnail||""))?'<img loading="lazy" src="'+esc(x.thumbnail)+'" alt="">':"";return '<article class="maxtroit-download-card">'+img+'<small>'+esc(x.category||"Download")+'</small><h3>'+esc(x.title||"Download")+'</h3><p>'+esc(x.description||"")+'</p><button type="button" data-maxtroit-download-id="'+esc(x.id)+'">View details / Download</button></article>'}).join("")||"<p>No downloads match this search.</p>";
    host.querySelectorAll("[data-maxtroit-download-id]").forEach(function(b){b.addEventListener("click",function(){send("MAXTROIT_NAVIGATE_DOWNLOAD",{id:b.getAttribute("data-maxtroit-download-id")})})});
  }
  function init(d){current=Array.isArray(d.items)?d.items:[];var brand=document.querySelectorAll("[data-maxtroit-brand]");brand.forEach(function(el){el.textContent=d.brandName||"MAXTROIT OFFICIAL"});var social=document.querySelector("[data-maxtroit-social]");if(social){social.innerHTML="";(d.socialLinks||[]).forEach(function(x){var a=document.createElement("a");a.href=x.url;a.textContent=x.label;a.target="_blank";a.rel="noopener noreferrer";social.appendChild(a)})}render()}
  document.addEventListener("input",function(e){if(e.target.matches("[data-maxtroit-search]")){query=e.target.value.trim().toLowerCase();render()}});
  document.addEventListener("change",function(e){if(e.target.matches("[data-maxtroit-category]")){category=e.target.value;render()}});
  document.addEventListener("submit",function(e){if(e.target.matches("[data-maxtroit-search-form]")){e.preventDefault();var q=e.target.querySelector("[data-maxtroit-search]");query=(q?q.value:"").trim().toLowerCase();render()}});
  document.addEventListener("click",function(e){var dl=e.target.closest("[data-maxtroit-download-id]");if(dl){e.preventDefault();send("MAXTROIT_NAVIGATE_DOWNLOAD",{id:dl.getAttribute("data-maxtroit-download-id")});return}var el=e.target.closest("[data-maxtroit-action]");if(!el)return;var action=el.getAttribute("data-maxtroit-action");if(action==="downloads"||action==="search"||action==="download"){var host=document.querySelector("[data-maxtroit-downloads]")||document.querySelector("#downloads")||document.querySelector("#grid");if(host)host.scrollIntoView({behavior:"smooth"});else send("MAXTROIT_NAVIGATE",{path:"index.html#downloads"})}else if(action==="home"){window.scrollTo({top:0,behavior:"smooth"})}else if(action==="open-url"){var url=el.getAttribute("data-url")||el.getAttribute("href")||"";if(/^https:\/\//i.test(url)){e.preventDefault();send("MAXTROIT_OPEN_URL",{url:url})}}});
  window.addEventListener("message",function(e){if(e.data&&e.data.type==="MAXTROIT_INIT")init(e.data)});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){send("MAXTROIT_TEMPLATE_READY")});else send("MAXTROIT_TEMPLATE_READY");
})();
</script>`}
function prepareTemplateHtml(html){const source=String(html||"");if(source.includes("MAXTROIT_BRIDGE_V2"))return source;const bridge=templateBridge();return /<\/body\s*>/i.test(source)?source.replace(/<\/body\s*>/i,bridge+"</body>"):source+bridge}
async function buildUploadedTemplate(file,name){
 const ext=file.name.split(".").pop().toLowerCase();let html="";
 if(file.size>8*1024*1024)throw Error("Choose a file smaller than 8 MB.");
 if(ext==="zip"){
  if(!window.JSZip)throw Error("ZIP support did not load. Refresh and try again.");
  const zip=await JSZip.loadAsync(file),entries=Object.values(zip.files).filter(x=>!x.dir&&!x.name.startsWith("__MACOSX/"));
  if(entries.length>80)throw Error("ZIP contains more than 80 files.");
  const main=entries.find(x=>/^(?:\.\/)?index\.html?$/i.test(x.name))||entries.find(x=>/\.html?$/i.test(x.name));
  if(!main)throw Error("ZIP must contain index.html or another HTML file.");
  html=await main.async("string");
  for(const entry of entries){if(entry===main)continue;const path=entry.name,base=path.split("/").pop(),e=base.split(".").pop().toLowerCase();
   if(e==="css"){let css=await entry.async("string");for(const asset of entries){const n=asset.name.split("/").pop(),ae=n.split(".").pop().toLowerCase();if(["png","jpg","jpeg","webp","gif","svg","woff","woff2"].includes(ae)){const mime=({png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",svg:"image/svg+xml",woff:"font/woff",woff2:"font/woff2"})[ae],uri="data:"+mime+";base64,"+await asset.async("base64");css=css.split(asset.name).join(uri).split(n).join(uri)}}html=html.replace(/<link\b[^>]*>/gi,tag=>{const m=tag.match(/href=["']([^"']+)["']/i);return m&&(m[1]===path||m[1]===base||m[1].endsWith("/"+base))?"<style>"+css.replace(/<\/style/gi,"<\\/style")+"</style>":tag})}
   else if(["png","jpg","jpeg","webp","gif","svg"].includes(e)){const mime=({png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",svg:"image/svg+xml"})[e],uri="data:"+mime+";base64,"+await entry.async("base64");html=html.split(path).join(uri).split(base).join(uri)}
   else if(e==="js"){const source=await entry.async("string");html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,tag=>{const m=tag.match(/src=["']([^"']+)["']/i);return m&&(m[1]===path||m[1]===base||m[1].endsWith("/"+base))?"<script>"+source.replace(/<\/script/gi,"<\\/script")+"</script>":tag})}
  }
 }else if(ext==="html"||ext==="htm")html=await file.text();
 else if(ext==="css"){const css=await file.text();html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css.replace(/<\/style/gi,"<\\/style")+'</style></head><body><header style="padding:28px"><h1>MAXTROIT DOWNLOADS</h1></header><main style="padding:24px"><div data-maxtroit-downloads></div></main></body></html>'}
 else if(ext==="json"){const raw=JSON.parse(await file.text());if(!raw||raw.schemaVersion!==1)throw Error("Unsupported JSON theme package.");return {id:String(Date.now()),name:name||raw.name||"Imported theme",kind:"theme",theme:raw,updatedAt:Date.now()}}
 else throw Error("Supported files: HTML, HTM, CSS, ZIP and JSON.");
 if(!/<html[\s>]/i.test(html))html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>';
 if(html.length>250000)throw Error("Prepared template exceeds 250 KB. Compress images or remove unused files.");
 html=html.replace(/<\/body\s*>/i,templateBridge()+"</body>");
 return {id:String(Date.now()),name:(name||file.name.replace(/\.[^.]+$/,"")).slice(0,50),kind:"html",html:html,updatedAt:Date.now()};
}
function renderCustomTemplateLibrary(){const box=$("#custom-template-library");if(!box)return;box.innerHTML=uploadedTemplateLibrary.map((p,i)=>'<div class="custom-template-row'+(pendingUploadedTemplate?.id===p.id?' is-selected':'')+'"><span><strong>'+safe(p.name)+'</strong><small>'+safe(p.kind==="html"?"Full website · "+Math.round((p.html||"").length/1024)+" KB":"Theme package")+(pendingUploadedTemplate?.id===p.id?' · SELECTED':'')+'</small></span><div><button class="secondary-button'+(pendingUploadedTemplate?.id===p.id?' is-selected':'')+'" data-use-template="'+i+'" type="button">Select</button><button class="delete-button" data-delete-template="'+i+'" type="button">Delete</button></div></div>').join("")||'<p class="muted">No imported templates yet.</p>';box.querySelectorAll("[data-use-template]").forEach(b=>b.addEventListener("click",()=>{pendingUploadedTemplate=uploadedTemplateLibrary[Number(b.dataset.useTemplate)];$("#preview-uploaded-template").disabled=false;$("#apply-uploaded-template").disabled=false;box.querySelectorAll("[data-use-template]").forEach(x=>x.classList.toggle("is-selected",x===b));renderCustomTemplateLibrary();templateStatus(pendingUploadedTemplate.name+" selected. Preview or apply it.")}));box.querySelectorAll("[data-delete-template]").forEach(b=>b.addEventListener("click",async()=>{if(!requireAdmin())return;const target=uploadedTemplateLibrary[Number(b.dataset.deleteTemplate)];if(!target||!confirm("Delete "+target.name+"? If it is currently applied, the website will return to the default Midnight design. Its preview will also be closed."))return;b.disabled=true;try{const ref=hubCloud.db.collection("siteConfig").doc("public");const result=await withTimeout(hubCloud.db.runTransaction(async tx=>{const snap=await tx.get(ref),data=snap.exists?snap.data():{},latest=Array.isArray(data.uploadedTemplates)?data.uploadedTemplates:[],next=latest.filter(x=>x.id!==target.id);const activeHtml=data.templateId==="uploaded"&&data.activeUploadedTemplateId===target.id;const activeTheme=data.templateId==="custom"&&(data.activeCustomTemplateId===target.id||(!data.activeCustomTemplateId&&data.customTemplate&&target.theme&&JSON.stringify(data.customTemplate)===JSON.stringify(target.theme)));const wasActive=activeHtml||activeTheme;const patch={uploadedTemplates:next};if(wasActive)Object.assign(patch,{templateId:"midnight",activeUploadedTemplateId:null,activeCustomTemplateId:null,customTemplate:null,templateUpdated:Date.now()});tx.set(ref,patch,{merge:true});return {next,wasActive}}),"Deleting template");uploadedTemplateLibrary=result.next;if(pendingUploadedTemplate?.id===target.id)pendingUploadedTemplate=null;if(previewedTemplateId==="uploaded:"+target.id){closeTemplatePreview()}if(!pendingUploadedTemplate){$("#preview-uploaded-template").disabled=true;$("#apply-uploaded-template").disabled=true}if(result.wasActive){activeTemplate="midnight";renderTemplateStates();templateStatus("Template deleted. Its applied design and preview were removed; Midnight is now active.")}else templateStatus("Template deleted. The currently applied website design was kept.");renderCustomTemplateLibrary()}catch(e){templateStatus("Delete failed: "+errorText(e));b.disabled=false}}))}
$("#import-template-file").addEventListener("click",async()=>{if(!requireAdmin())return;const file=$("#template-upload-file").files?.[0];if(!file){templateStatus("Choose a file first.");return}const b=$("#import-template-file");b.disabled=true;try{const item=await buildUploadedTemplate(file,$("#template-upload-name").value.trim()),ref=hubCloud.db.collection("siteConfig").doc("public"),snap=await withTimeout(ref.get(),"Loading template library");uploadedTemplateLibrary=snap.exists&&Array.isArray(snap.data().uploadedTemplates)?snap.data().uploadedTemplates:[];const next=uploadedTemplateLibrary.filter(x=>x.name!==item.name);next.push(item);if(next.reduce((n,x)=>n+(x.html||"").length,0)>300000)throw Error("Template library limit reached (300 KB total). Delete unused templates first.");await withTimeout(ref.set({uploadedTemplates:next},{merge:true}),"Saving template library");uploadedTemplateLibrary=next;pendingUploadedTemplate=item;$("#preview-uploaded-template").disabled=false;$("#apply-uploaded-template").disabled=false;renderCustomTemplateLibrary();templateStatus(item.name+" added to My Templates and selected. Preview it, then apply it.")}catch(e){templateStatus("Import failed: "+errorText(e))}finally{b.disabled=false}});
function wireTemplateFrame(frame,html,previewMode){frame.setAttribute("sandbox","allow-scripts allow-forms allow-popups allow-downloads");frame.srcdoc=prepareTemplateHtml(html);const sendData=()=>{try{frame.contentWindow.postMessage({type:"MAXTROIT_INIT",items:items.map(x=>({id:x.id,title:x.title||"Download",description:x.description||"",category:x.category||"Other",thumbnail:imageSrc(x.thumbnail),url:x.url||""})),brandName:siteSettings.brandName||"MAXTROIT OFFICIAL",socialLinks:[["YouTube","socialYoutube"],["Instagram","socialInstagram"],["Facebook","socialFacebook"],["Telegram","socialTelegram"],["WhatsApp","socialWhatsapp"],["Discord","socialDiscord"]].filter(x=>/^https:\/\//i.test(String(siteSettings[x[1]]||""))).map(x=>({label:x[0],url:siteSettings[x[1]]}))},"*")}catch(e){}};const onMessage=e=>{if(e.source!==frame.contentWindow||!e.data)return;if(e.data.type==="MAXTROIT_TEMPLATE_READY")sendData();if(e.data.type==="MAXTROIT_NAVIGATE_DOWNLOAD"&&e.data.id)window.open("download.html?id="+encodeURIComponent(e.data.id),"_blank","noopener");if(e.data.type==="MAXTROIT_OPEN_URL"&&/^https:\/\//i.test(String(e.data.url||"")))window.open(e.data.url,"_blank","noopener");};window.addEventListener("message",onMessage);frame.addEventListener("load",sendData);frame._maxTemplateCleanup=()=>window.removeEventListener("message",onMessage)}
$("#preview-uploaded-template").addEventListener("click",()=>{if(!pendingUploadedTemplate){templateStatus("Select a template from My Templates first.");return}$("#template-preview-title").textContent=pendingUploadedTemplate.name+" — working preview";const frame=$("#template-preview-frame");previewedTemplateId="uploaded:"+pendingUploadedTemplate.id;if(pendingUploadedTemplate.kind==="html")wireTemplateFrame(frame,pendingUploadedTemplate.html,true);else frame.src="index.html?templatePreview=custom&templateData="+encodeURIComponent(JSON.stringify(pendingUploadedTemplate.theme));$("#template-preview-panel").hidden=false;$("#template-preview-panel").scrollIntoView({behavior:"smooth",block:"start"})});
$("#remove-active-template").addEventListener("click",async()=>{if(!requireAdmin()||!confirm("Remove the currently applied template and restore the default Midnight design?"))return;const b=$("#remove-active-template");b.disabled=true;try{const ref=hubCloud.db.collection("siteConfig").doc("public");await withTimeout(ref.set({templateId:"midnight",activeUploadedTemplateId:null,activeCustomTemplateId:null,customTemplate:null,templateUpdated:Date.now()},{merge:true}),"Removing applied template");const verify=await withTimeout(ref.get(),"Verifying default design");if(!verify.exists||verify.data().templateId!=="midnight")throw Error("The default design could not be verified.");activeTemplate="midnight";renderTemplateStates();closeTemplatePreview();templateStatus("Applied template removed. Default Midnight design is active.");say("Applied template removed. Public website now uses Midnight.")}catch(e){templateStatus("Could not remove applied template: "+errorText(e))}finally{b.disabled=false}});
$("#apply-uploaded-template").addEventListener("click",async()=>{if(!requireAdmin()||!pendingUploadedTemplate)return;if(!confirm("Apply "+pendingUploadedTemplate.name+" to the public website?"))return;const b=$("#apply-uploaded-template");b.disabled=true;try{const data=pendingUploadedTemplate.kind==="html"?{templateId:"uploaded",activeUploadedTemplateId:pendingUploadedTemplate.id,activeCustomTemplateId:null,customTemplate:null}:{templateId:"custom",activeUploadedTemplateId:null,activeCustomTemplateId:pendingUploadedTemplate.id,customTemplate:pendingUploadedTemplate.theme};const ref=hubCloud.db.collection("siteConfig").doc("public");await withTimeout(ref.set({...data,templateUpdated:Date.now()},{merge:true}),"Applying template");const verify=await withTimeout(ref.get(),"Verifying template");const saved=verify.exists?verify.data():{};if(pendingUploadedTemplate.kind==="html"?(saved.templateId!=="uploaded"||saved.activeUploadedTemplateId!==pendingUploadedTemplate.id):(saved.templateId!=="custom"||!saved.customTemplate))throw Error("The template was not confirmed in the website settings. Refresh and try again.");$("#active-template-label").textContent="Current: "+pendingUploadedTemplate.name;templateStatus(pendingUploadedTemplate.name+" applied to the public website.")}catch(e){templateStatus("Apply failed: "+errorText(e))}finally{b.disabled=false}});
$("#admin-search").addEventListener("input",renderAdminList);$("#admin-category-filter").addEventListener("change",renderAdminList);$("#admin-sort").addEventListener("change",renderAdminList);$("#refresh-admin").addEventListener("click",()=>loadAll().catch(e=>say("Could not refresh downloads: "+errorText(e))));
function setPreview(sel,data,removeSel){const img=$(sel),remove=$(removeSel);img.hidden=!data;if(data)img.src=data;if(remove)remove.hidden=sel==="#logo-preview"?false:!data}
function timeValue(v){if(v&&typeof v.toMillis==="function")return v.toMillis();if(v instanceof Date)return v.getTime();return Number(v)||0}
function refreshCategoryFilter(){const select=$("#admin-category-filter");if(!select)return;const current=select.value,cats=[...new Set(items.map(x=>String(x.category||"General").trim()||"General"))].sort((a,b)=>a.localeCompare(b));select.innerHTML='<option value="">All categories</option>'+cats.map(c=>'<option value="'+safe(c)+'">'+safe(c)+'</option>').join("");if(cats.includes(current))select.value=current}
function renderOverviewRecent(){const box=$("#overview-recent-list");if(!box)return;const recent=items.slice(0,5);box.innerHTML=recent.map(x=>'<article class="overview-recent-item"><span class="overview-recent-icon">'+(imageSrc(x.thumbnail)?'<img src="'+safe(imageSrc(x.thumbnail))+'" alt="">':'M')+'</span><span class="overview-recent-info"><strong>'+safe(x.title||"Untitled")+'</strong><small>'+safe(x.category||"General")+'</small></span><button class="secondary-button" type="button" data-recent-edit="'+safe(x.id)+'">Edit</button></article>').join("")||'<p class="muted">No downloads published yet. Add your first item from Downloads.</p>'}
function renderAdminList(){const q=($("#admin-search")?.value||"").trim().toLowerCase(),cat=$("#admin-category-filter")?.value||"",sort=$("#admin-sort")?.value||"newest";let shown=items.filter(x=>(!cat||(String(x.category||"General").trim()||"General")===cat)&&(!q||(String(x.title||"")+" "+String(x.category||"")+" "+String(x.description||"")).toLowerCase().includes(q)));shown.sort((a,b)=>sort==="az"?String(a.title||"").localeCompare(String(b.title||"")):sort==="za"?String(b.title||"").localeCompare(String(a.title||"")):sort==="oldest"?timeValue(a.created)-timeValue(b.created):timeValue(b.created)-timeValue(a.created));adminList.innerHTML=shown.map(x=>{const src=imageSrc(x.thumbnail);return '<article class="admin-item"><div class="admin-item-thumb">'+(src?'<img loading="lazy" src="'+safe(src)+'" alt="">':'M')+'</div><div class="admin-item-info"><strong>'+safe(x.title||"Untitled")+'</strong><small>'+safe(x.category||"General")+' · '+(x.created?"Published":"Legacy item")+'</small></div><div class="item-actions"><button class="secondary-button" data-edit="'+safe(x.id)+'" type="button">Edit</button><button class="delete-button" data-delete="'+safe(x.id)+'" type="button">Delete</button></div></article>'}).join("")||'<p class="muted">'+(items.length?"No downloads match these filters.":"No downloads published yet.")+'</p>';$("#admin-count").textContent=shown.length+" of "+items.length+" items"}
async function loadAll(){say("Loading…");const downloads=await withTimeout(hubCloud.db.collection("downloads").get(),"Loading downloads");items=downloads.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>timeValue(b.created)-timeValue(a.created));refreshCategoryFilter();renderAdminList();$("#stat-total").textContent=items.length;$("#stat-categories").textContent=new Set(items.map(x=>x.category).filter(Boolean)).size;$("#admin-count").textContent=items.length+" items";$("#stat-connection").textContent="Connected";renderOverviewRecent();try{const site=await withTimeout(hubCloud.db.collection("siteConfig").doc("public").get(),"Loading website settings");siteSettings=site.exists?site.data():{};uploadedTemplateLibrary=Array.isArray(siteSettings.uploadedTemplates)?siteSettings.uploadedTemplates:[];renderCustomTemplateLibrary();activeTemplate=siteSettings.templateId==="uploaded"?"uploaded":(siteSettings.templateId==="custom"&&siteSettings.customTemplate?"custom":(templateNames[siteSettings.templateId]?siteSettings.templateId:"midnight"));renderTemplateStates();if(activeTemplate==="custom")$("#active-template-label").textContent="Current: "+siteSettings.customTemplate.name;if(activeTemplate==="uploaded"){const live=uploadedTemplateLibrary.find(t=>t.id===siteSettings.activeUploadedTemplateId);$("#active-template-label").textContent="Current: "+(live?.name||"Uploaded template")}const f=$("#site-form");for(const k of ["brandName","kicker","heroTitle","heroDescription","navLabel","navUrl","youtubeUrl","heroButton","heroButtonUrl","heroSecondaryButton","heroSecondaryButtonUrl","seoTitle","seoDescription","collectionEyebrow","collectionTitle","collectionSubtitle","footerDescription","footerCopyright","socialYoutube","socialInstagram","socialFacebook","socialTelegram","socialWhatsapp","socialDiscord","colorBackground","colorPanel","colorText","colorAccent","colorSecondary"])if(siteSettings[k]!==undefined&&f.elements[k])f.elements[k].value=siteSettings[k];for(const k of ["showHero","showCollection","showFooter"])if(siteSettings[k]!==undefined&&f.elements[k])f.elements[k].checked=siteSettings[k];for(const key of ["socialYoutube","socialInstagram","socialFacebook","socialTelegram","socialWhatsapp","socialDiscord"])if(f.elements[key+"Enabled"])f.elements[key+"Enabled"].checked=siteSettings.socialEnabled?siteSettings.socialEnabled[key]!==false:true;customSections=Array.isArray(siteSettings.customSections)?siteSettings.customSections:[];sectionOrder=Array.isArray(siteSettings.sectionOrder)?siteSettings.sectionOrder:["hero","collection"];renderVisualBuilder();organizeWebsiteEditor();logoData=siteSettings.logo||"";bannerData=siteSettings.banner||"";setPreview("#logo-preview",logoData,"#remove-logo");setPreview("#banner-preview",bannerData,"#remove-banner")}catch(e){say("Downloads loaded, but website settings could not be loaded: "+errorText(e));$("#stat-connection").textContent="Partially connected";return}loadAnimationControls();say("Loaded.")}
function readImage(file,max=600,preserveAlpha=false){return new Promise((resolve,reject)=>{if(!file||!file.type.startsWith("image/"))return reject(Error("Choose a valid image file."));if(file.size>12*1024*1024)return reject(Error("Image must be smaller than 12 MB."));const r=new FileReader();r.onerror=()=>reject(Error("Could not read image."));r.onload=()=>{const im=new Image();im.onerror=()=>reject(Error("Invalid image."));im.onload=()=>{const scale=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));const ctx=c.getContext("2d");if(!preserveAlpha){ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height)}ctx.drawImage(im,0,0,c.width,c.height);let out=c.toDataURL("image/webp",.78);if(!out.startsWith("data:image/webp"))out=c.toDataURL(preserveAlpha?"image/png":"image/jpeg",.78);if(out.length>220000&&!preserveAlpha)out=c.toDataURL("image/webp",.55);if(out.length>280000)return reject(Error("Compressed image is still too large. Choose a smaller image."));resolve(out)};im.src=r.result};r.readAsDataURL(file)})}
async function chooseImage(e,max,state,preview,remove){try{const data=await readImage(e.target.files[0],max,state==="logo");if(state==="thumb"){thumbData=data;thumbRemoved=false}else if(state==="logo")logoData=data;else bannerData=data;setPreview(preview,data,remove);say("Image ready. Save to apply it.")}catch(err){e.target.value="";say(err.message)}}
$("#thumb-file").addEventListener("change",e=>chooseImage(e,600,"thumb","#thumb-preview","#remove-thumb"));
$("#logo-file").addEventListener("change",e=>chooseImage(e,500,"logo","#logo-preview","#remove-logo"));
$("#banner-file").addEventListener("change",e=>chooseImage(e,1200,"banner","#banner-preview","#remove-banner"));
function removeImage(which){if(which==="thumb"){thumbData="";thumbRemoved=true;$("#thumb-file").value="";setPreview("#thumb-preview","","#remove-thumb")}if(which==="logo"){logoData="";$("#logo-file").value="";setPreview("#logo-preview","","#remove-logo")}if(which==="banner"){bannerData="";$("#banner-file").value="";setPreview("#banner-preview","","#remove-banner")}say("Image removed. Save changes to confirm.")}
$("#remove-thumb").addEventListener("click",()=>removeImage("thumb"));$("#remove-logo").addEventListener("click",()=>removeImage("logo"));$("#remove-banner").addEventListener("click",()=>removeImage("banner"));
function requireAdmin(){if(!isAdmin(hubCloud?.auth?.currentUser)){say("Not authorised. Sign in again.");return false}return true}
function clearItem(){itemForm.reset();itemForm.elements.id.value="";thumbData="";thumbRemoved=false;$("#thumb-file").value="";setPreview("#thumb-preview","","#remove-thumb");$("#form-heading").textContent="Publish a download"}
$("#clear-item").addEventListener("click",clearItem);
itemForm.addEventListener("submit",async e=>{e.preventDefault();if(!requireAdmin())return;const d=new FormData(itemForm),id=d.get("id")||crypto.randomUUID(),old=items.find(x=>x.id===id)||{},url=String(d.get("url")||"").trim(),title=String(d.get("title")||"").trim();if(!title){say("Enter a title.");itemForm.elements.title.focus();return}if(!/^https?:\/\//i.test(url)){say("Enter a valid http:// or https:// download link.");itemForm.elements.url.focus();return}const item={title,category:String(d.get("category")||"Other").trim()||"Other",description:String(d.get("description")||"").trim(),url,thumbnail:thumbRemoved?"":(thumbData||old.thumbnail||"")};if(old.created!==undefined&&old.created!==null)item.created=old.created;else if(!items.some(x=>x.id===id))item.created=Date.now();setBusy(itemForm,true);try{await withTimeout(hubCloud.db.collection("downloads").doc(id).set(item,{merge:true}),"Saving download");clearItem();say("Download saved successfully.");try{await loadAll()}catch(refreshError){say("Download was saved, but the list could not refresh. "+errorText(refreshError))}}catch(err){say(err.code==="app/timeout"?"Save status uncertain. Check the downloads list before retrying.": "Save failed: "+errorText(err))}finally{endBusy(itemForm,"Save download")}});
$("#overview-recent-list").addEventListener("click",e=>{const b=e.target.closest("[data-recent-edit]");if(!b)return;showView("uploads");const target=items.find(x=>x.id===b.dataset.recentEdit);if(target){$("#admin-search").value=target.title||"";renderAdminList();const edit=adminList.querySelector('[data-edit="'+CSS.escape(target.id)+'"]');if(edit)edit.click()}});
adminList.addEventListener("click",async e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){const x=items.find(v=>v.id===edit.dataset.edit);if(!x)return;for(const k of ["title","category","description","url"])itemForm.elements[k].value=x[k]||"";itemForm.elements.id.value=x.id;thumbData=x.thumbnail||"";thumbRemoved=false;$("#thumb-file").value="";setPreview("#thumb-preview",thumbData,"#remove-thumb");$("#form-heading").textContent="Edit download";showView("uploads");itemForm.scrollIntoView({behavior:"smooth",block:"start"})}if(del){if(!requireAdmin())return;const target=items.find(x=>x.id===del.dataset.delete);if(!confirm('Permanently delete "'+(target?.title||"this download")+'"?'))return;del.disabled=true;try{await withTimeout(hubCloud.db.collection("downloads").doc(del.dataset.delete).delete(),"Deleting download");if(itemForm.elements.id.value===del.dataset.delete)clearItem();say("Download deleted successfully.");try{await loadAll()}catch(refreshError){say("Download was deleted, but the list could not refresh. "+errorText(refreshError))}}catch(err){say(err.code==="app/timeout"?"Delete status uncertain. Refresh the list before retrying.":"Delete failed: "+errorText(err));del.disabled=false}}});


function readAnimationControls(){
  const animations={preset:$("#animation-preset").value};
  for(const key of ["enabled","background","logo","cards","buttons","transitions","loader"])animations[key]=$("#anim-"+key).checked;
  return animations;
}
function applyAnimationPreview(){
  const animations=readAnimationControls();
  const applyToFrame=frame=>{
    try{
      const root=frame?.contentDocument?.documentElement;
      if(!root)return;
      const enabled=animations.enabled;
      root.dataset.hubAnimations=enabled?"on":"off";
      root.dataset.hubPreset=animations.preset;
      for(const key of ["background","logo","cards","buttons","transitions","loader"]){
        const attr="anim"+key.charAt(0).toUpperCase()+key.slice(1);
        root.dataset[attr]=enabled&&animations[key]?"on":"off";
      }
      if(frame.contentWindow?.matchMedia?.("(prefers-reduced-motion: reduce)").matches)root.dataset.hubReducedMotion="on";
      else delete root.dataset.hubReducedMotion;
    }catch(error){/* Sandboxed custom template previews may not expose their document. */}
  };
  applyToFrame($("#vb-frame"));
  const templateFrame=$("#template-preview-frame");
  if(templateFrame&&templateFrame.contentDocument?.documentElement)applyToFrame(templateFrame);
  const message=$("#animation-status");
  if(message)message.textContent="Live preview updated instantly. Press Save animation settings to publish this choice.";
}
function loadAnimationControls(){
  const cfg=siteSettings.animations&&typeof siteSettings.animations==="object"?siteSettings.animations:{};
  const defaults={enabled:true,preset:"cyber",background:false,logo:true,cards:false,buttons:false,transitions:false,loader:false};
  const value={...defaults,...cfg};
  $("#animation-preset").value=["cyber","energy","dimension"].includes(value.preset)?value.preset:"cyber";
  for(const key of ["enabled","background","logo","cards","buttons","transitions","loader"])$("#anim-"+key).checked=value[key]!==false;
  applyAnimationPreview();
}
["animation-preset","anim-enabled","anim-background","anim-logo","anim-cards","anim-buttons","anim-transitions","anim-loader"].forEach(id=>{
  const control=$("#"+id);
  control.addEventListener("input",applyAnimationPreview);
  control.addEventListener("change",applyAnimationPreview);
});
$("#vb-frame").addEventListener("load",()=>setTimeout(applyAnimationPreview,0));
$("#template-preview-frame").addEventListener("load",()=>setTimeout(applyAnimationPreview,0));
$("#save-animation-settings").addEventListener("click",async()=>{
  if(!requireAdmin())return;
  const button=$("#save-animation-settings"),message=$("#animation-status");
  const animations=readAnimationControls();
  button.disabled=true;message.textContent="Saving animation settings…";
  try{
    const ref=hubCloud.db.collection("siteConfig").doc("public");
    await withTimeout(ref.set({animations,animationSettingsUpdated:Date.now()},{merge:true}),"Saving animation settings");
    const verify=await withTimeout(ref.get(),"Verifying animation settings");
    if(!verify.exists||JSON.stringify(verify.data().animations)!==JSON.stringify(animations))throw Error("Saved settings could not be verified.");
    siteSettings={...siteSettings,animations};
    message.textContent="Saved and verified. The live preview already reflects these settings.";
  }catch(err){message.textContent="Could not save: "+errorText(err)}
  finally{button.disabled=false}
});
function organizeWebsiteEditor(){const form=$("#site-form");if(!form||form.dataset.organized)return;const groups=[{id:"identity",title:"Brand & navigation",hint:"Website name, navigation and channel link.",keys:["brandName","navLabel","navUrl","youtubeUrl"]},{id:"hero",title:"Homepage introduction",hint:"The main heading, description, buttons and images.",keys:["kicker","heroTitle","heroDescription","heroButton","heroButtonUrl","heroSecondaryButton","heroSecondaryButtonUrl","logo-file","banner-file"]},{id:"library",title:"Downloads section",hint:"The heading and description above your download cards.",keys:["collectionEyebrow","collectionTitle","collectionSubtitle","showCollection"]},{id:"footer",title:"Footer",hint:"Text shown at the bottom of your website.",keys:["footerDescription","footerCopyright","showFooter"]},{id:"social",title:"Social media links",hint:"Control which social profiles appear on the public website.",keys:["social-links-editor"]},{id:"seo",title:"Browser & search preview",hint:"Set the browser tab title and search result description.",keys:["seoTitle","seoDescription"]},{id:"appearance",title:"Colors & visibility",hint:"Choose your site colors and show or hide the homepage introduction.",keys:["colorBackground","colorPanel","colorText","colorAccent","colorSecondary","showHero"]},{id:"layout",title:"Page layout & custom sections",hint:"Reorder sections and add your own content.",keys:["visual-builder"]}];const wrappers=groups.map(g=>{const d=document.createElement("details");d.className="site-editor-group";d.open=true;const summary=document.createElement("summary");summary.innerHTML="<span>"+safe(g.title)+"</span><small>"+safe(g.hint)+"</small>";d.appendChild(summary);const body=document.createElement("div");body.className="site-editor-group-body";d.appendChild(body);g.body=body;form.appendChild(d);return d});for(const node of [...form.children]){if(node.classList.contains("site-editor-group")||node.classList.contains("form-actions"))continue;let key="";if(node.id==="visual-builder")key="visual-builder";else if(node.id==="social-links-editor")key="social-links-editor";else if(node.tagName==="LABEL"){const control=node.querySelector("[name],input[type=file]");key=control?.name||control?.id||""}const group=groups.find(g=>g.keys.includes(key));(group||groups[4]).body.appendChild(node)}form.dataset.organized="1";const defaults={navLabel:"Explore downloads",youtubeUrl:"https://www.youtube.com/@maxtroit_official",heroButton:"Explore library",heroSecondaryButton:"YouTube channel ↗",collectionEyebrow:"THE LIBRARY",collectionTitle:"Explore downloads",collectionSubtitle:"Find what you need, without the clutter.",footerDescription:"Official downloads from MAXTROIT.",footerCopyright:"MAXTROIT OFFICIAL"};for(const [key,value] of Object.entries(defaults)){const field=form.elements[key];if(field&&!field.value)field.value=value}for(const [key,value] of Object.entries({showHero:true,showCollection:true,showFooter:true})){const field=form.elements[key];if(field&&siteSettings[key]===undefined)field.checked=value}}
function renderVisualBuilder(){const box=$("#section-order-list");if(!box)return;const order=sectionOrder.filter(x=>x==="hero"||x==="collection"||customSections.some(v=>v.id===x));for(const id of ["hero","collection"])if(!order.includes(id))order.push(id);sectionOrder=order;const label=id=>id==="hero"?"Hero section":id==="collection"?"Downloads section":(customSections.find(v=>v.id===id)?.title||"Custom section");box.innerHTML=order.map((id,i)=>{const item=customSections.find(v=>v.id===id);return '<div class="section-order-item" draggable="true" data-section-id="'+safe(id)+'"><div class="section-order-fields"><b>'+safe(label(id))+'</b>'+(item?'<label>Title<input data-edit-section="'+safe(id)+'" data-field="title" maxlength="80" value="'+safe(item.title||"")+'"></label><label>Text<textarea data-edit-section="'+safe(id)+'" data-field="body" rows="2" maxlength="500">'+safe(item.body||"")+'</textarea></label><label>Button text<input data-edit-section="'+safe(id)+'" data-field="button" maxlength="35" value="'+safe(item.button||"")+'"></label><label>Button link<input data-edit-section="'+safe(id)+'" data-field="link" type="url" value="'+safe(item.link||"")+'"></label>':'<small>'+safe(id==="hero"?"Main introduction":"Download library")+'</small>')+'</div><div class="section-order-actions"><button type="button" class="secondary-button" data-section-up="'+i+'" '+(i===0?"disabled":"")+'>↑</button><button type="button" class="secondary-button" data-section-down="'+i+'" '+(i===order.length-1?"disabled":"")+'>↓</button>'+(item?'<button type="button" class="delete-button" data-section-remove="'+safe(id)+'">Remove</button>':'')+'</div></div>'}).join("");box.querySelectorAll("[data-edit-section]").forEach(el=>el.addEventListener("input",()=>{const item=customSections.find(v=>v.id===el.dataset.editSection);if(item)item[el.dataset.field]=el.value}));box.querySelectorAll("[data-section-up]").forEach(b=>b.onclick=()=>moveSection(Number(b.dataset.sectionUp),-1));box.querySelectorAll("[data-section-down]").forEach(b=>b.onclick=()=>moveSection(Number(b.dataset.sectionDown),1));box.querySelectorAll("[data-section-remove]").forEach(b=>b.onclick=()=>{const id=b.dataset.sectionRemove;customSections=customSections.filter(v=>v.id!==id);sectionOrder=sectionOrder.filter(v=>v!==id);renderVisualBuilder()});let drag=null;box.querySelectorAll("[data-section-id]").forEach(el=>{el.addEventListener("dragstart",()=>drag=el.dataset.sectionId);el.addEventListener("dragover",e=>e.preventDefault());el.addEventListener("drop",e=>{e.preventDefault();const target=el.dataset.sectionId;if(!drag||drag===target)return;const from=sectionOrder.indexOf(drag),to=sectionOrder.indexOf(target);sectionOrder.splice(from,1);sectionOrder.splice(to,0,drag);drag=null;renderVisualBuilder()})})}
function moveSection(i,delta){const j=i+delta;if(j<0||j>=sectionOrder.length)return;[sectionOrder[i],sectionOrder[j]]=[sectionOrder[j],sectionOrder[i]];renderVisualBuilder()}
$("#add-custom-section").addEventListener("click",()=>{if(customSections.length>=12){say("You can add up to 12 custom sections.");return}const title=$("#new-section-title").value.trim(),body=$("#new-section-body").value.trim(),type=$("#new-section-type").value,button=$("#new-section-button").value.trim(),link=$("#new-section-link").value.trim();if(!title){say("Enter a title for the new section.");return}if(link&&!/^https:\/\//i.test(link)){say("Use a full HTTPS link.");return}if(button&&!link){say("Add an HTTPS link for the button, or leave button text empty.");return}const id="section_"+Date.now();customSections.push({id,type,title,body,button,link});sectionOrder.push(id);renderVisualBuilder();$("#new-section-title").value="";$("#new-section-body").value="";$("#new-section-button").value="";$("#new-section-link").value="";say("Section added to the editor. Press Save website changes to publish it.")});
$("#site-form").addEventListener("submit",async e=>{e.preventDefault();if(!requireAdmin())return;const d=new FormData(e.currentTarget),payload={brandName:String(d.get("brandName")||"").trim(),kicker:String(d.get("kicker")||"").trim(),heroTitle:String(d.get("heroTitle")||"").trim(),heroDescription:String(d.get("heroDescription")||"").trim(),navLabel:String(d.get("navLabel")||"").trim(),navUrl:String(d.get("navUrl")||"").trim(),youtubeUrl:String(d.get("youtubeUrl")||"").trim(),heroButton:String(d.get("heroButton")||"").trim(),heroButtonUrl:String(d.get("heroButtonUrl")||"").trim(),heroSecondaryButton:String(d.get("heroSecondaryButton")||"").trim(),heroSecondaryButtonUrl:String(d.get("heroSecondaryButtonUrl")||"").trim(),seoTitle:String(d.get("seoTitle")||"").trim(),seoDescription:String(d.get("seoDescription")||"").trim(),collectionEyebrow:String(d.get("collectionEyebrow")||"").trim(),collectionTitle:String(d.get("collectionTitle")||"").trim(),collectionSubtitle:String(d.get("collectionSubtitle")||"").trim(),footerDescription:String(d.get("footerDescription")||"").trim(),footerCopyright:String(d.get("footerCopyright")||"").trim(),socialYoutube:String(d.get("socialYoutube")||"").trim(),socialInstagram:String(d.get("socialInstagram")||"").trim(),socialFacebook:String(d.get("socialFacebook")||"").trim(),socialTelegram:String(d.get("socialTelegram")||"").trim(),socialWhatsapp:String(d.get("socialWhatsapp")||"").trim(),socialDiscord:String(d.get("socialDiscord")||"").trim(),socialEnabled:{socialYoutube:d.get("socialYoutubeEnabled")==="on",socialInstagram:d.get("socialInstagramEnabled")==="on",socialFacebook:d.get("socialFacebookEnabled")==="on",socialTelegram:d.get("socialTelegramEnabled")==="on",socialWhatsapp:d.get("socialWhatsappEnabled")==="on",socialDiscord:d.get("socialDiscordEnabled")==="on"},showHero:d.get("showHero")==="on",showCollection:d.get("showCollection")==="on",showFooter:d.get("showFooter")==="on",colorBackground:String(d.get("colorBackground")||"#070b16"),colorPanel:String(d.get("colorPanel")||"#10182a"),colorText:String(d.get("colorText")||"#f5f7ff"),colorAccent:String(d.get("colorAccent")||"#37c8f5"),colorSecondary:String(d.get("colorSecondary")||"#8c65f5"),sectionOrder,customSections,logo:logoData,banner:bannerData,updated:Date.now()};for(const key of ["navUrl","heroButtonUrl","heroSecondaryButtonUrl","youtubeUrl","socialYoutube","socialInstagram","socialFacebook","socialTelegram","socialWhatsapp","socialDiscord"]){const value=String(payload[key]||"").trim();if(value&&!value.startsWith("#")&&!/^https:\/\//i.test(value)){say("Use an HTTPS URL for "+key+".");return}}setBusy(e.currentTarget,true);try{const siteRef=hubCloud.db.collection("siteConfig").doc("public");await withTimeout(siteRef.set(payload,{merge:true}),"Saving website settings");const check=await withTimeout(siteRef.get(),"Verifying website settings");if(!check.exists||check.data().brandName!==payload.brandName||check.data().updated!==payload.updated)throw Error("Save could not be verified. Reload the editor and check the website settings.");siteSettings={...siteSettings,...payload};try{localStorage.setItem("maxTroitStartupTheme",JSON.stringify({brandName:payload.brandName||"MAXTROIT OFFICIAL",logo:imageSrc(payload.logo)||"",templateId:siteSettings.templateId||"midnight",customTemplate:siteSettings.customTemplate||null}))}catch(cacheError){}setPreview("#logo-preview",logoData,"#remove-logo");setPreview("#banner-preview",bannerData,"#remove-banner");say("Website changes saved and verified. Logo cache updated for the loading screen.")}catch(err){say(err.code==="app/timeout"?"Website save status uncertain. Reload the editor before retrying.":"Website save failed: "+errorText(err))}finally{endBusy(e.currentTarget,"Save website changes")}});
$("#reset-site").addEventListener("click",()=>{const f=$("#site-form");f.elements.brandName.value="MAXTROIT OFFICIAL";f.elements.kicker.value="MAXTROIT OFFICIAL PRESENTS";f.elements.heroTitle.value="Your digital world. One download hub.";f.elements.heroDescription.value="Discover useful apps, games, tools and creator resources — all in one place.";say("Default text filled in. Save website changes to apply.")});
$("#logout").addEventListener("click",()=>hubCloud.auth.signOut().catch(e=>say("Sign out failed: "+errorText(e))));
function showUser(user){if(!user){loginScreen.hidden=false;adminApp.hidden=true;return}if(!isAdmin(user)){loginScreen.hidden=false;adminApp.hidden=true;loginSay("This account is not authorised as administrator.");hubCloud.auth.signOut().catch(()=>{});return}loginScreen.hidden=true;adminApp.hidden=false;loginSay("");$("#admin-account").textContent=user.email||"Administrator";showView("overview");loadAll().catch(e=>{say("Could not load admin data: "+errorText(e));$("#stat-connection").textContent="Unavailable"})}
if(ready){hubCloud.auth.onAuthStateChanged(showUser);loginSay("Sign in with the authorised administrator email.")}else{login.querySelector("button").disabled=true;loginSay("Firebase did not initialise. Check configuration and network.")}
login.addEventListener("submit",async e=>{e.preventDefault();if(!ready){loginSay("Firebase is not ready. Refresh and try again.");return}const d=new FormData(login);setBusy(login,true);loginSay("Checking sign-in…");try{const credential=await hubCloud.auth.signInWithEmailAndPassword(String(d.get("email")).trim(),String(d.get("password")));if(!isAdmin(credential.user)){loginSay("This account is not the authorised administrator.");await hubCloud.auth.signOut()}}catch(err){const messages={"auth/invalid-credential":"Email or password is incorrect.","auth/user-not-found":"No account exists for this email.","auth/wrong-password":"Password is incorrect.","auth/too-many-requests":"Too many attempts. Wait and try again.","auth/network-request-failed":"Network error. Check your connection."};loginSay(messages[err.code]||errorText(err))}finally{endBusy(login,"Sign in to dashboard")}});


/* Admin Studio usability: plain-language navigation and collapsible settings */
(function(){
 const navLabels={overview:"Dashboard",uploads:"Manage downloads",website:"Website settings",templates:"Design templates"};
 document.querySelectorAll(".nav-item[data-view]").forEach(b=>{
  const key=b.dataset.view,span=b.querySelector("span");
  if(span&&navLabels[key])span.textContent=navLabels[key];
  b.title=({overview:"Website summary and shortcuts",uploads:"Add, edit and remove downloadable items",website:"Change logo, text, colors and social links",templates:"Change or import website designs"})[key]||"";
 });
 const descriptions={
  "social-links-editor":["Social links","Add your social profile URLs and choose which links visitors can see."],
  "section-visibility":["Homepage sections","Turn the main homepage areas on or off."],
  "Website colors":["Website colors","Change the public website background, panels, text and accent colors."],
  "Page layout builder":["Homepage layout","Reorder sections or add a custom text, feature or call-to-action section."]
 };
 document.querySelectorAll("#site-form .editor-subpanel").forEach((panel,index)=>{
  const h=panel.querySelector("h3"),key=panel.id||h?.textContent.trim(),meta=descriptions[key]||descriptions[h?.textContent.trim()];
  if(!h||panel.parentElement.tagName==="DETAILS")return;
  const details=document.createElement("details");details.className="admin-accordion";
  details.open=index===0;
  const summary=document.createElement("summary");
  const title=document.createElement("span");title.textContent=meta?.[0]||h.textContent;
  const hint=document.createElement("small");hint.textContent=meta?.[1]||"Open this group to edit these settings.";
  const arrow=document.createElement("b");arrow.textContent="＋";
  summary.append(title,hint,arrow);details.append(summary);
  panel.parentNode.insertBefore(details,panel);details.append(panel);
  panel.classList.add("accordion-content");
 });
 const form=$("#site-form");
 if(form&&!$("#site-form-intro")){
  const intro=document.createElement("div");intro.id="site-form-intro";intro.className="admin-help";
  intro.innerHTML="<strong>Website settings</strong><span>Upar basic details aur images edit karein. Neeche ke groups kholkar colors, social links aur homepage layout badlein. Sab changes ek hi button se save honge.</span>";
  form.prepend(intro);
 }
 const anim=document.querySelector(".animation-control-card");
 if(anim&&!anim.querySelector(".admin-section-note")){
  const note=document.createElement("p");note.className="admin-section-note";note.textContent="Optional: loading screen aur website motion effects. Agar animations nahi badalni, is section ko chhod dein.";
  anim.querySelector(".panel-heading")?.after(note);
 }
 const vb=document.querySelector("#visual-builder-studio");
 if(vb&&!vb.parentElement.matches("details")){
  const details=document.createElement("details");details.className="admin-advanced";
  const summary=document.createElement("summary");summary.innerHTML="<span>Advanced visual editor</span><small>For detailed element-by-element editing. Most users can ignore this.</small><b>＋</b>";
  vb.parentNode.insertBefore(details,vb);details.append(summary,vb);
 }
 const uploadForm=$("#item-form");
 if(uploadForm&&!$("#download-form-help")){
  const help=document.createElement("p");help.id="download-form-help";help.className="admin-help";
  help.innerHTML="<strong>Publish a download</strong><span>Fill in the name, category, short description, image and direct download URL. Then tap Save download.</span>";
  uploadForm.prepend(help);
 }
 const templateHelp=document.querySelector("#view-templates .panel-heading");
 if(templateHelp&&!$("#template-help-note")){
  const note=document.createElement("p");note.id="template-help-note";note.className="admin-help";
  note.innerHTML="<strong>Change your website design</strong><span>Preview a design first. Apply only when you want visitors to see it. Your downloads and text are kept.</span>";
  templateHelp.after(note);
 }
})();

/* Admin Studio information architecture v2 — groups core controls without changing form names or save handlers. */
(function(){
 const form=document.querySelector("#site-form");
 if(!form||form.dataset.adminGrouped==="yes")return;
 form.dataset.adminGrouped="yes";
 const groups=[
  {title:"Brand, logo & homepage",hint:"Website ka naam, logo aur homepage par dikhne wali main heading.",open:true,selectors:['[name="brandName"]','#logo-file','[name="kicker"]','[name="heroTitle"]','[name="heroDescription"]','#banner-file']},
  {title:"Buttons & navigation",hint:"Menu links aur homepage buttons ke labels aur destinations.",selectors:['[name="navLabel"]','[name="navUrl"]','[name="youtubeUrl"]','[name="heroButton"]','[name="heroButtonUrl"]','[name="heroSecondaryButton"]','[name="heroSecondaryButtonUrl"]']},
  {title:"Downloads page text",hint:"Downloads library ke heading aur description ko badlein.",selectors:['[name="collectionEyebrow"]','[name="collectionTitle"]','[name="collectionSubtitle"]']},
  {title:"Footer & Google search",hint:"Website ke footer aur browser/search result details.",selectors:['[name="footerDescription"]','[name="footerCopyright"]','[name="seoTitle"]','[name="seoDescription"]']}
 ];
 const firstPanel=form.querySelector(".editor-subpanel");
 groups.forEach(group=>{
  const details=document.createElement("details");
  details.className="admin-accordion admin-core-group";
  details.open=!!group.open;
  const summary=document.createElement("summary");
  const title=document.createElement("span");title.textContent=group.title;
  const hint=document.createElement("small");hint.textContent=group.hint;
  const mark=document.createElement("b");mark.textContent="＋";
  summary.append(title,hint,mark);
  const grid=document.createElement("div");grid.className="admin-field-grid";
  details.append(summary,grid);
  group.selectors.forEach(selector=>{
   const control=form.querySelector(selector);
   const label=control?.closest("label");
   if(label&&!grid.contains(label)){label.classList.remove("wide");grid.append(label)}
  });
  if(grid.children.length){form.insertBefore(details,firstPanel||form.querySelector(".form-actions"))}
 });
 const intro=form.querySelector("#site-form-intro");
 if(intro){intro.querySelector("strong").textContent="Website control room";intro.querySelector("span").textContent="Basic settings upar groups mein hain. Social links, homepage visibility, colors aur layout neeche alag sections mein milenge. Save website changes dabakar updates publish karein."}
 const visibility=form.querySelector(".editor-subpanel h3");
 if(visibility&&visibility.textContent.trim()==="Section visibility"){
  const p=document.createElement("p");p.className="admin-inline-help";p.textContent="In switches se homepage ke bade sections visitors ke liye show ya hide honge.";visibility.after(p);
 }
 document.querySelectorAll(".admin-accordion>summary,.admin-advanced>summary").forEach(summary=>{
  const detail=summary.parentElement;
  const mark=summary.querySelector("b");
  const sync=()=>{if(mark)mark.textContent=detail.open?"−":"＋"};
  sync();detail.addEventListener("toggle",sync);
 });
 const titles={overview:"Dashboard",uploads:"Manage downloads",website:"Website settings",templates:"Design templates"};
 document.querySelectorAll(".nav-item[data-view]").forEach(button=>{
  const span=button.querySelector("span");if(span&&titles[button.dataset.view])span.textContent=titles[button.dataset.view];
 });
})();

/* Admin Studio v3: dedicated workspaces for animation and visual editing. */
(function(){
 const app=document.querySelector("#admin-app"),sidebar=document.querySelector(".sidebar"),main=document.querySelector(".admin-main");
 if(!app||!sidebar||!main||document.querySelector("#view-animations"))return;
 const nav=[
  ["animations","✦","Animations"],
  ["visual","▤","Visual editor"]
 ];
 nav.forEach(([id,icon,label])=>{
  const b=document.createElement("button");b.type="button";b.className="nav-item";b.dataset.view=id;b.innerHTML=icon+" <span>"+label+"</span>";
  const templates=sidebar.querySelector('[data-view="templates"]');sidebar.insertBefore(b,templates);
  b.addEventListener("click",()=>window.showView(id));
 });
 const makeView=(id,title,desc)=>{
  const s=document.createElement("section");s.id="view-"+id;s.className="admin-view";s.hidden=true;
  const head=document.createElement("div");head.className="panel-card panel-heading";
  const copy=document.createElement("div");copy.innerHTML="<h2>"+title+"</h2><p>"+desc+"</p>";head.append(copy);s.append(head);main.insertBefore(s,document.querySelector("#view-templates"));return s;
 };
 const anim=makeView("animations","Animation settings","Website ke motion effects ko control karo. Har option ka preview dekhkar save karo.");
 const visual=makeView("visual","Visual website editor","Live preview mein element select karke text aur appearance edit karo. Publish se pehle changes check karo.");
 const animCard=document.querySelector(".animation-control-card"),visualCard=document.querySelector(".visual-builder-card");
 if(animCard)anim.append(animCard);
 if(visualCard)visual.append(visualCard);
 const oldShow=window.showView;
 window.showView=function(name){
  document.querySelectorAll(".admin-view").forEach(v=>v.hidden=v.id!=="view-"+name);
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  const titles={overview:"Dashboard",uploads:"Manage downloads",website:"Website settings",templates:"Design templates",animations:"Animation settings",visual:"Visual editor"};
  const target=document.querySelector("#view-title");if(target)target.textContent=titles[name]||"Dashboard";
  if(name==="visual")document.querySelector("#vb-frame")?.contentWindow?.postMessage({type:"MAXTROIT_BUILDER_REFRESH"},"*");
 };
 const form=document.querySelector("#item-form"),list=document.querySelector("#admin-list");
 if(form&&list&&!document.querySelector("#download-work-tabs")){
  const tabs=document.createElement("div");tabs.id="download-work-tabs";tabs.className="template-tabs";
  tabs.innerHTML='<button type="button" class="template-tab is-active" data-download-tab="add">＋ Add / edit</button><button type="button" class="template-tab" data-download-tab="manage">▤ Published downloads</button>';
  const formCard=form.closest(".panel-card"),listCard=list.closest(".panel-card");
  formCard?.parentElement?.insertBefore(tabs,formCard);
  const setTab=which=>{
   if(formCard)formCard.hidden=which!=="add";
   if(listCard)listCard.hidden=which!=="manage";
   tabs.querySelectorAll("button").forEach(b=>b.classList.toggle("is-active",b.dataset.downloadTab===which));
   if(which==="manage")document.querySelector("#admin-search")?.focus({preventScroll:true});
  };
  tabs.addEventListener("click",e=>{const b=e.target.closest("[data-download-tab]");if(b)setTab(b.dataset.downloadTab)});
  document.querySelectorAll("[data-goto='uploads']").forEach(b=>b.addEventListener("click",()=>setTab("add")));
  document.querySelector("#admin-list")?.addEventListener("click",e=>{if(e.target.closest("[data-edit]"))setTab("add")});
  setTab("add");
 }
 // Clear, contextual helper text for the settings people most often misunderstand.
 const help={
  colorBackground:"Poore page ka base background.",
  colorPanel:"Cards aur content panels ka background.",
  colorText:"Website ka main readable text colour.",
  colorAccent:"Primary buttons aur highlights.",
  colorSecondary:"Secondary highlight colour.",
  showHero:"Homepage ka top introduction section show/hide.",
  showCollection:"Downloads ki listing show/hide.",
  showFooter:"Website ka footer show/hide."
 };
 Object.entries(help).forEach(([name,message])=>{
  const field=document.querySelector('#site-form [name="'+name+'"]'),label=field?.closest("label");
  if(label&&!label.querySelector(".admin-field-hint")){const p=document.createElement("small");p.className="admin-field-hint";p.textContent=message;label.append(p)}
 });
 document.querySelectorAll(".site-editor-group").forEach((d,i)=>{d.open=i===0;d.classList.add("admin-accordion")});
 const title=document.querySelector("#view-website .panel-heading h2");if(title)title.textContent="Website settings";
 const description=document.querySelector("#view-website .panel-heading p");if(description)description.textContent="Har group mein related settings hain. Sirf jis cheez ko badalna ho wahi kholo.";
})();

/* MAXTROIT Admin Studio v4 — restore a prominent, unmistakable logo manager. */
(function(){
 const form=document.querySelector("#site-form"),view=document.querySelector("#view-website");
 const logoInput=document.querySelector("#logo-file"),logoLabel=logoInput?.closest("label");
 if(!form||!view||!logoLabel||document.querySelector("#brand-logo-panel"))return;
 const panel=document.createElement("section");panel.id="brand-logo-panel";panel.className="panel-card brand-logo-panel";
 panel.innerHTML='<div class="panel-heading"><div><h2>Website logo</h2><p>Yahin se apna logo upload, preview ya remove karo. Yehi saved logo website aur supported loading screen areas ke liye use hota hai.</p></div><span class="logo-status-pill">BRAND</span></div>';
 const inner=document.createElement("div");inner.className="brand-logo-content";
 const title=document.createElement("strong");title.textContent="Upload your logo";
 const note=document.createElement("p");note.textContent="PNG ya WebP transparent logo recommended. Image choose karte hi preview dikhega; Save logo dabakar changes save karo.";
 inner.append(title,note,logoLabel);
 panel.append(inner);
 const save=document.createElement("button");save.type="button";save.className="button";save.id="save-brand-logo";save.textContent="Save logo";
 save.addEventListener("click",()=>form.requestSubmit());
 panel.append(save);
 const intro=form.querySelector("#site-form-intro");
 form.insertBefore(panel,intro?intro.nextSibling:form.firstChild);
 // Remove the logo field from any collapsed group; there must be one obvious, visible place to find it.
 form.querySelectorAll(".admin-core-group").forEach(group=>{if(group.contains(panel))return;group.querySelectorAll("label").forEach(label=>{if(label.querySelector("#logo-file"))panel.querySelector(".brand-logo-content").append(label)})});
 const logoGroup=logoLabel.closest("details");if(logoGroup&&logoGroup.querySelector(".admin-field-grid")?.children.length===0)logoGroup.remove();
})();

/* Final integration correction: keep the dedicated logo manager outside collapsed editor groups. */
(function(){
 const original=window.organizeWebsiteEditor||organizeWebsiteEditor;
 if(typeof original==="function"&&!window.__maxTroitLogoGroupFix){
  window.__maxTroitLogoGroupFix=true;
  window.organizeWebsiteEditor=function(){
   original();
   const form=document.querySelector("#site-form"),panel=document.querySelector("#brand-logo-panel");
   if(form&&panel){const first=form.querySelector(".site-editor-group");if(first&&panel.parentElement!==form)form.insertBefore(panel,first);else if(first&&panel.nextElementSibling!==first)form.insertBefore(panel,first)}
  };
  organizeWebsiteEditor=window.organizeWebsiteEditor;
 }
 const panel=document.querySelector("#brand-logo-panel"),form=document.querySelector("#site-form");
 if(panel&&form){const first=form.querySelector(".site-editor-group");if(first&&panel.parentElement!==form)form.insertBefore(panel,first)}
 const save=document.querySelector("#save-brand-logo");
 if(save&&!save.dataset.bound){save.dataset.bound="1";save.addEventListener("click",()=>{const status=document.querySelector("#admin-status");if(status)status.textContent="Logo is ready to save. Website changes will be verified after saving."})}
})();
