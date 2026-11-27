(()=>{"use strict";
if(location.pathname.endsWith("/admin.html"))return;
const css=`
#mx-maintenance-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:auto;padding:22px;background:radial-gradient(ellipse at 50% 0%,#172b62,#090d25 55%,#050817);color:#f7f8ff;font-family:Inter,system-ui,Arial,sans-serif;text-align:center}
#mx-maintenance-overlay[hidden]{display:none}
.mx-m-card{width:min(720px,100%);padding:clamp(22px,5vw,48px);border:1px solid #294d9d;border-radius:26px;background:linear-gradient(145deg,#0f1e46f2,#080c23f5);box-shadow:0 0 70px #1255a955;animation:mx-min .6s ease both}
.mx-m-brand{font-size:25px;font-weight:900;letter-spacing:2px}.mx-m-brand span{color:#a54cff}
.mx-m-art{display:block;width:min(100%,575px);height:auto;max-height:62vh;object-fit:contain;margin:0 auto 18px;border-radius:16px;filter:drop-shadow(0 12px 28px #02061788)}
.mx-m-card h1{font-size:clamp(27px,5vw,42px);line-height:1.15}.mx-m-card h1 em{display:block;color:#ffca45;font-style:normal}.mx-m-card p{color:#d2ddf7;line-height:1.6}
.mx-m-time{padding:14px;border:1px solid #1879d9;border-radius:14px;background:#0a1b43}.mx-m-track{height:10px;margin-top:12px;border-radius:99px;background:#111d40;overflow:hidden}.mx-m-track i{display:block;width:42%;height:100%;background:linear-gradient(90deg,#13bfff,#765aff);animation:mx-mprog 2.4s ease-in-out infinite alternate}
#mx-maintenance-welcome{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;padding:24px;background:#09132f;color:white;text-align:center;font:700 30px Inter,system-ui,sans-serif}
@keyframes mx-min{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes mx-mprog{to{transform:translateX(140%)}}
@media(prefers-reduced-motion:reduce){#mx-maintenance-overlay *{animation:none!important}}
`;
const style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
const overlay=document.createElement("div");overlay.id="mx-maintenance-overlay";overlay.hidden=true;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.innerHTML='<div class="mx-m-card"><div class="mx-m-brand">MAXTROIT <span>DOWNLOAD HUB</span></div><img class="mx-m-art" src="maintenance-assets/maintenance-robot.jpg" alt="MAXTROIT maintenance robot wearing a yellow helmet and holding an Under Maintenance sign"><h1>Website is Currently <em>Under Maintenance</em></h1><p>We are working hard to bring you a better experience. Please check back later!</p><div class="mx-m-time">Estimated time: <b id="mx-m-estimate">About 30 minutes</b><div class="mx-m-track"><i></i></div></div><p><b>Thank you for your patience! — Team MAXTROIT</b></p></div>';document.body.appendChild(overlay);
function apply(m){const active=m?.enabled===true;if(active){try{sessionStorage.setItem("mxMaintenanceWasActive","1")}catch(e){}$("#mx-m-estimate").textContent="About "+Math.max(1,Math.min(1440,Number(m.estimatedMinutes)||30))+" minutes";overlay.hidden=false;document.documentElement.style.overflow="hidden"}else{overlay.hidden=true;document.documentElement.style.overflow="";let was=false;try{was=sessionStorage.getItem("mxMaintenanceWasActive")==="1";sessionStorage.removeItem("mxMaintenanceWasActive")}catch(e){}if(was){const welcome=document.createElement("div");welcome.id="mx-maintenance-welcome";welcome.textContent="❤️ Thank You for Your Patience! — Team MAXTROIT";document.body.appendChild(welcome);setTimeout(()=>welcome.remove(),4000)}}}
function $(s){return document.querySelector(s)}
function connect(){if(!window.hubCloud?.db)return;hubCloud.db.collection("siteConfig").doc("public").onSnapshot(s=>apply(s.exists?s.data()?.maintenanceMode:null),e=>console.error("Maintenance status unavailable",e))}
if(window.hubCloud?.ready)connect();else window.addEventListener("hubCloudReady",connect,{once:true});
})();