(()=>{"use strict";
const $=s=>document.querySelector(s),uid=window.ADMIN_UID;
const isAdmin=()=>{const u=window.hubCloud?.auth?.currentUser;return !!u&&!!uid&&u.uid===uid};
function openPanel(){
 if(!isAdmin()){alert("Admin login required.");return}
 const preview=$(".preview-area"),panel=$("#maintenance-admin-panel");
 if(preview)preview.hidden=true;
 ["#flash-editor-panel","#design-studio","#music-admin","#downloads-admin","#analytics-admin","#social-admin"].forEach(s=>{const el=$(s);if(el)el.hidden=true});
 panel.hidden=false;document.body.classList.add("maintenance-workspace");$("#maintenance-admin-tab").setAttribute("aria-pressed","true");load();
}
function closePanel(){
 $("#maintenance-admin-panel").hidden=true;if($(".preview-area"))$(".preview-area").hidden=false;
 document.body.classList.remove("maintenance-workspace");$("#maintenance-admin-tab").setAttribute("aria-pressed","false");
}
function init(){
 const nav=$("#admin-app>.topbar .top-actions");if(!nav||$("#maintenance-admin-tab"))return;
 const tab=document.createElement("button");tab.id="maintenance-admin-tab";tab.type="button";tab.textContent="🔧 Repair / Maintenance";tab.addEventListener("click",openPanel);nav.insertBefore(tab,$("#logout"));
 const panel=document.createElement("section");panel.id="maintenance-admin-panel";panel.hidden=true;
 panel.innerHTML='<header class="maintenance-head"><div><small>MAXTROIT CONTROL CENTER</small><h2>Repair / Maintenance</h2><p>Maintenance ON karne par visitors ko repair screen dikhegi. Admin Panel accessible rahega.</p></div><button id="maintenance-back" type="button">← Back</button></header><div class="maintenance-card"><div class="maintenance-row"><div><b>Maintenance Mode</b><p id="maintenance-status">Loading status…</p></div><label class="maintenance-switch"><input id="maintenance-enabled" type="checkbox"><span></span></label></div><label class="maintenance-estimate">Estimated repair time (minutes)<input id="maintenance-estimate" type="number" min="1" max="1440" value="30"></label><div class="maintenance-preview"><div class="maintenance-mini-scene" aria-label="Animated robot preview"><span class="mini-gear">⚙</span><div class="mini-bot"><i class="mini-helmet">M</i><i class="mini-face">⌒　⌒</i><i class="mini-vest">M</i><i class="mini-arm"></i></div><span class="mini-sign">UNDER<br>MAINTENANCE</span><span class="mini-cone">🚧</span></div><div><b>Animated visitor screen preview</b><p>Robot, moving arms, spinning gears, warning sign and worksite animations.</p></div></div><button id="maintenance-save" type="button">Save Settings</button><p id="maintenance-message" role="status"></p></div>';
 $("#admin-app").append(panel);
 $("#maintenance-back").addEventListener("click",closePanel);$("#maintenance-save").addEventListener("click",save);
}
async function load(){
 const msg=$("#maintenance-message");try{if(!isAdmin())throw Error("Admin login required.");const snap=await hubCloud.db.collection("siteConfig").doc("public").get(),m=snap.data()?.maintenanceMode||{};$("#maintenance-enabled").checked=m.enabled===true;$("#maintenance-estimate").value=Math.max(1,Math.min(1440,Number(m.estimatedMinutes)||30));$("#maintenance-status").textContent=m.enabled===true?"ACTIVE — visitors ko repair screen dikh rahi hai.":"OFF — website normal mode mein hai.";msg.textContent="Settings loaded."}catch(e){msg.textContent="Load failed: "+e.message}
}
async function save(){
 const btn=$("#maintenance-save"),msg=$("#maintenance-message"),enabled=$("#maintenance-enabled").checked,minutes=Math.max(1,Math.min(1440,Math.round(Number($("#maintenance-estimate").value)||30)));
 if(!isAdmin()){msg.textContent="Admin login required.";return}btn.disabled=true;msg.textContent="Saving…";
 try{const ref=hubCloud.db.collection("siteConfig").doc("public"),old=(await ref.get()).data()?.maintenanceMode||{};await ref.set({maintenanceMode:{...old,enabled,estimatedMinutes:minutes,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}},{merge:true});const saved=(await ref.get()).data()?.maintenanceMode||{};if(saved.enabled!==enabled||Number(saved.estimatedMinutes)!==minutes)throw Error("Save verification failed.");$("#maintenance-status").textContent=enabled?"ACTIVE — visitors ko repair screen dikh rahi hai.":"OFF — website normal mode mein hai.";msg.textContent=enabled?"Maintenance ON — public site par apply ho gaya.":"Maintenance OFF — public site normal mode mein hai."}catch(e){msg.textContent="Save failed: "+e.message}finally{btn.disabled=false}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
if(window.hubCloud?.auth)hubCloud.auth.onAuthStateChanged(u=>{if(u&&u.uid===uid)init()});
})();