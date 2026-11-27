(()=>{"use strict";
const $=s=>document.querySelector(s),frame=$("#site-preview");
function inlineAction(action){const b=frame?.contentDocument?.querySelector('.mx-editor-ui [data-act="'+action+'"]');if(b)b.click();else $("#editor-status").textContent="Pehle Select website element dabakar canvas par element tap karein."}
const actions={
 undo:()=>$("#undo")?.click(),redo:()=>$("#redo")?.click(),text:()=>inlineAction("text"),
 image:()=>inlineAction("image"),delete:()=>inlineAction("delete"),
 reset:()=>inlineAction("reset"),refresh:()=>$("#reload")?.click(),
 move:()=>inlineAction("move")
};
document.addEventListener("click",e=>{const b=e.target.closest("[data-we-action]");if(!b)return;const fn=actions[b.dataset.weAction];if(fn){e.preventDefault();fn()}});
const label=$("#selected-label"),name=$("#we-selected-name"),note=$("#we-selection-note");
if(label&&name){const sync=()=>{const t=label.textContent.trim();name.textContent=t.includes("kisi element")?"No element selected":t;if(note)note.textContent=t.includes("kisi element")?"Canvas mein element select karein. Uske baad edit, move, reset aur hide controls use karein.":"Selection active hai. Preview mein changes check karke Save Changes ya Publish Website use karein.";};new MutationObserver(sync).observe(label,{childList:true,subtree:true,characterData:true});sync();}
document.querySelectorAll(".we-nav[data-we-mode]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".we-nav").forEach(x=>x.classList.remove("active"));b.classList.add("active")}));
})();