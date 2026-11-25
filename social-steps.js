(async()=>{
const id=new URLSearchParams(location.search).get("id"),list=document.querySelector("#steps-list"),status=document.querySelector("#steps-status"),unlock=document.querySelector("#steps-unlock");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
try{
 if(!id)throw Error("Download ID missing.");
 const started=Number(sessionStorage.getItem("maxtroit-view-details-ready:"+id)||0);
 if(!started||Date.now()-started>3600000)throw Error("Please return to the Download Details Page and complete its timer first.");
 if(!window.hubCloud?.ready)throw Error("Cloud database is not connected. Refresh and try again.");
 const [downloadSnap,configSnap]=await Promise.all([
  hubCloud.db.collection("downloads").doc(id).get(),
  hubCloud.db.collection("siteConfig").doc("public").get()
 ]);
 if(!downloadSnap.exists||downloadSnap.data()?.isPublished===false)throw Error("This download is unavailable.");
 const item=downloadSnap.data(),parsed=new URL(String(item.url||""));
 if(parsed.protocol!=="https:")throw Error("Download link is invalid.");
 const gate=configSnap.data()?.viewDetailsGate||{};
 const tasks=gate.enabled===false?[]:(Array.isArray(gate.tasks)?gate.tasks.filter(t=>t&&t.enabled!==false&&String(t.title||"").trim()&&/^https:\/\//i.test(String(t.url||""))):[]);
 if(!tasks.length){
  status.textContent="No social steps are required. Your download is ready.";
  unlock.href=parsed.href;unlock.hidden=false;return;
 }
 const checks=[];
 tasks.forEach((task,index)=>{
  const row=document.createElement("div");row.className="step-row";
  const info=document.createElement("div"),name=document.createElement("strong"),open=document.createElement("a");
  name.textContent="Step "+(index+1)+": "+task.title;
  open.href=task.url;open.target="_blank";open.rel="noopener noreferrer";open.textContent="Open social media link ↗";
  info.append(name,open);
  const label=document.createElement("label");label.className="step-confirm";
  const box=document.createElement("input");box.type="checkbox";box.setAttribute("aria-label","Confirm "+task.title);
  const text=document.createElement("span");text.textContent="I've completed this step";
  label.append(box,text);row.append(info,label);list.append(row);checks.push(box);
 });
 function update(){
  const done=checks.filter(x=>x.checked).length;
  status.textContent=done+" of "+checks.length+" steps completed.";
  unlock.hidden=done!==checks.length;
  if(done===checks.length){unlock.href=parsed.href;status.textContent="All steps completed. Your download is unlocked."}
 }
 checks.forEach(box=>box.addEventListener("change",update));update();
}catch(e){status.textContent=e.message;list.replaceChildren();unlock.hidden=true}
})();