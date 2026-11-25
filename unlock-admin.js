(()=>{
const $=s=>document.querySelector(s),cloud=window.hubCloud||{},uid=window.ADMIN_UID;
const enabled=$("#unlock-enabled"),timer=$("#unlock-timer"),title=$("#unlock-step-title"),url=$("#unlock-step-url"),list=$("#unlock-step-list"),status=$("#unlock-status"),add=$("#unlock-step-add"),save=$("#unlock-save");
if(!enabled||!timer||!title||!url||!list||!status||!add||!save)return;
let tasks=[];
const authorised=()=>!!cloud.auth?.currentUser&&!!uid&&cloud.auth.currentUser.uid===uid;
const say=t=>status.textContent=t;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(){
 list.innerHTML=tasks.map((t,i)=>'<div class="unlock-step-row" data-index="'+i+'"><input data-title value="'+esc(t.title)+'" maxlength="100" aria-label="Step title"><input data-url type="url" value="'+esc(t.url)+'" aria-label="Step URL"><label><input data-enabled type="checkbox" '+(t.enabled===false?'':'checked')+'> Enabled</label><button data-remove type="button">Remove</button></div>').join("")||"<p>No social steps added. Timer ke baad download direct unlock hoga.</p>";
 list.querySelectorAll(".unlock-step-row").forEach(row=>{
  const i=Number(row.dataset.index);
  row.querySelector("[data-title]").oninput=e=>tasks[i].title=e.target.value;
  row.querySelector("[data-url]").oninput=e=>tasks[i].url=e.target.value;
  row.querySelector("[data-enabled]").onchange=e=>tasks[i].enabled=e.target.checked;
  row.querySelector("[data-remove]").onclick=()=>{tasks.splice(i,1);render()};
 });
}
async function load(){
 try{
  const snap=await cloud.db.collection("siteConfig").doc("public").get(),cfg=snap.data()?.viewDetailsGate||{};
  enabled.checked=cfg.enabled!==false;timer.value=Number.isFinite(Number(cfg.timerMinutes))?cfg.timerMinutes:1;
  tasks=Array.isArray(cfg.tasks)?cfg.tasks.map(t=>({title:String(t.title||""),url:String(t.url||""),enabled:t.enabled!==false})):[];render();say("Saved unlock settings load ho gayi.");
 }catch(e){say("Load failed: "+e.message)}
}
add.onclick=()=>{
 const name=title.value.trim(),raw=url.value.trim();
 try{const parsed=new URL(raw);if(!name||parsed.protocol!=="https:")throw Error();tasks.push({title:name,url:parsed.href,enabled:true});title.value="";url.value="";render();say("Step add ho gaya. Save Unlock Settings dabayein.");}
 catch(e){say("Step title aur valid HTTPS URL bharein.")}
};
save.onclick=async()=>{
 if(!authorised())return say("Admin login required.");
 const minutes=Math.max(0,Math.min(10,Math.round(Number(timer.value)||0)));
 const clean=tasks.map(t=>({title:String(t.title||"").trim().slice(0,100),url:String(t.url||"").trim(),enabled:t.enabled!==false}));
 if(clean.some(t=>!t.title||!/^https:\/\//i.test(t.url)))return say("Har enabled step ke liye title aur HTTPS URL zaroori hai.");
 save.disabled=true;say("Unlock settings save ho rahi hain…");
 try{
  const ref=cloud.db.collection("siteConfig").doc("public"),value={enabled:enabled.checked,timerMinutes:minutes,tasks:clean};
  await ref.set({viewDetailsGate:value},{merge:true});
  const check=await ref.get(),saved=check.data()?.viewDetailsGate;
  if(!saved||saved.enabled!==value.enabled||Number(saved.timerMinutes)!==minutes||JSON.stringify(saved.tasks)!==JSON.stringify(clean))throw Error("Save verify nahi hua.");
  say("Unlock settings save aur verify ho gayi. Public Download Details page par apply hongi.");
 }catch(e){say("Save failed: "+e.message)}finally{save.disabled=false}
};
if(cloud.ready&&cloud.auth)cloud.auth.onAuthStateChanged(u=>{if(u&&authorised())load();else say("Admin login required.")});
})();