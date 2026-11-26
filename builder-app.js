/* MAXTROIT Website Builder workspace - milestone A/B foundation. */
(()=>{"use strict";
const $=s=>document.querySelector(s),root=$("#advanced-builder");if(!root)return;
const C=()=>window.MAXTROITBuilderCore,R=()=>window.MAXTROITBuilderRenderer;
const presets=[
 ["hero","Hero section",{title:"Build something unforgettable",text:"Introduce your website with a clear message."}],
 ["heading","Heading",{text:"Section heading"}],["text","Text",{text:"Add your content here. Edit this paragraph in the inspector."}],
 ["image","Image",{src:"",alt:"Describe this image"}],["button","Button",{text:"Learn more",href:"#"}],
 ["features","Features",{title:"What we offer",text:"Describe your key features."}],["pricing","Pricing",{title:"Simple pricing",text:"Explain your plans and value."}],
 ["faq","FAQ",{title:"Frequently asked questions",text:"Add an answer to a common question."}],["gallery","Gallery",{title:"Image gallery"}],
 ["download","Download card",{title:"Download",text:"Add details about your download."}],["video","Video",{src:""}],
 ["section","Section",{title:"New section"}],["container","Container",{}],["spacer","Spacer",{}],["divider","Divider",{}],["footer","Footer",{text:"© MAXTROIT OFFICIAL"}]
];
let tree=[],pages=[{id:"home",name:"Home",tree}],pageIndex=0,selected=null,device="desktop",dirty=false,history=new C().History(tree);
function current(){return pages[pageIndex];}
function moveBefore(treeValue,fromId,targetId){
 const copy=C().clone(treeValue);let moving=null;
 function extract(list){const i=list.findIndex(n=>n.id===fromId);if(i>=0){moving=list.splice(i,1)[0];return true;}return list.some(n=>extract(n.children||[]));}
 function insert(list){const i=list.findIndex(n=>n.id===targetId);if(i>=0){list.splice(i,0,moving);return true;}return list.some(n=>insert(n.children||[]));}
 if(!extract(copy)||!moving)return treeValue;if(!insert(copy))return treeValue;return copy;
}
function importExistingSite(){
 const frame=$("#site-preview"),doc=frame?.contentDocument;if(!doc?.body){$("#mb-status").textContent="Website preview is not ready yet. Reload it and try again.";return;}
 let count=0;const skip=new Set(["SCRIPT","STYLE","META","LINK","NOSCRIPT","IFRAME","SVG","PATH"]);
 const styleKeys=["color","backgroundColor","padding","margin","fontSize","fontWeight","textAlign","borderRadius","width","maxWidth","minHeight","display","gap","alignItems","justifyContent","boxShadow"];
 function convert(el,depth=0){
  if(!el||el.nodeType!==1||skip.has(el.tagName)||el.closest(".mx-editor-ui,.site-startup")||depth>12||count>=600)return null;
  count++;const tag=el.tagName.toLowerCase(),children=[...el.children].map(ch=>convert(ch,depth+1)).filter(Boolean);
  const directText=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean).join(" ");
  const textValue=directText.slice(0,2500);let type="container",props={};
  if(/^h[1-6]$/.test(tag)){type="heading";props.text=(el.textContent||"").trim().slice(0,2500);}
  else if(tag==="img"){type="image";props={src:el.currentSrc||el.src||"",alt:el.alt||""};}
  else if(tag==="a"||tag==="button"){type="button";props={text:(el.textContent||"").trim().slice(0,500)||"Button",href:tag==="a"?el.getAttribute("href")||"#":"#"};}
  else if(tag==="video"){type="video";props={src:el.currentSrc||el.src||""};}
  else if(tag==="hr"){type="divider";}
  else if(tag==="footer"){type="footer";props.text=textValue;}
  else if(tag==="section"||tag==="article"||tag==="header"){type="section";if(textValue)props.text=textValue;}
  else if(!children.length){type="text";props.text=(el.textContent||"").trim().slice(0,2500);}
  else if(textValue)props.text=textValue;
  const styles={};try{const cs=doc.defaultView.getComputedStyle(el);for(const key of styleKeys){const val=cs[key];if(val&&val!=="none"&&val!=="normal"&&val!=="rgba(0, 0, 0, 0)")styles[key]=val;}}catch(_){}
  const node=C().makeNode(type,props,styles);node.children=children;return node;
 }
 const source=doc.querySelector("main")||doc.body;const roots=[...source.children].filter(el=>el.id!=="collection").map(el=>convert(el)).filter(Boolean);
 if(!roots.length){$("#mb-status").textContent="No importable website elements were found.";return;}
 current().tree=roots;tree=roots;selected=null;history=new C().History(roots);dirty=true;render();scheduleSave();$("#mb-status").textContent="Existing website imported. Review the layout before publishing.";
}
async function loadPage(){if(!window.hubCloud?.ready||!hubCloud.auth?.currentUser)return;try{const snap=await hubCloud.db.collection("sites").doc("maxtroit").collection("pages").get();if(!snap.empty){const prior=current().id;pages=snap.docs.map(doc=>{const data=doc.data()||{};return{id:doc.id,name:data.name||"Untitled page",tree:Array.isArray(data.draftTree)?data.draftTree:[]};});const found=pages.findIndex(p=>p.id===prior);pageIndex=found>=0?found:Math.max(0,pages.findIndex(p=>p.id==="home"));}tree=current().tree;history=new C().History(tree);dirty=false;render();if(!snap.size)$("#mb-status").textContent="No saved draft. Use Import current website to start from your existing site.";}catch(e){$("#mb-status").textContent="Could not load drafts: "+e.message;}}
function saveHistory(){history.push(current().tree);tree=current().tree;dirty=true;render();scheduleSave();}
function update(fn){current().tree=fn(current().tree);tree=current().tree;saveHistory();}
function bindCanvasSelection(){const canvas=$("#mb-canvas");canvas.querySelectorAll("[data-node-id]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();selected=el.dataset.nodeId;render();}));}
function render(){const canvas=$("#mb-canvas"),node=C().findNode(current().tree,selected);R().renderTree(current().tree,canvas,device,selected);bindCanvasSelection();$("#mb-layers").innerHTML="";C().walk(current().tree,(n,parent)=>{const row=document.createElement("div");row.className="mb-layer-row";const b=document.createElement("button");b.type="button";b.draggable=true;b.className="mb-layer"+(n.id===selected?" active":"");b.style.paddingLeft=(12+(parent?14:0))+"px";b.textContent=(n.props.title||n.props.text||n.type).slice(0,32);b.onclick=()=>{selected=n.id;render();};b.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",n.id);e.dataTransfer.effectAllowed="move";});row.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="move";});row.addEventListener("drop",e=>{e.preventDefault();const from=e.dataTransfer.getData("text/plain");if(from&&from!==n.id){current().tree=moveBefore(current().tree,from,n.id);selected=from;saveHistory();}});row.append(b);$("#mb-layers").append(row);});let pageSelect=$("#mb-page-select");if(pageSelect){pageSelect.innerHTML="";pages.forEach((p,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=p.name;pageSelect.append(o);});pageSelect.value=String(pageIndex);}$("#mb-page-name").textContent=current().name;$("#mb-status").textContent=dirty?"Unsaved changes":"Saved";$("#mb-undo").disabled=!history.canUndo;$("#mb-redo").disabled=!history.canRedo;inspector();}
function inspector(){
 const n=C().findNode(current().tree,selected),panel=$("#mb-inspector");panel.innerHTML="";
 if(!n){panel.textContent="Select an element on the canvas or in Layers.";return;}
 const heading=document.createElement("h3");heading.textContent=(n.type||"Element")+" · Design Studio";panel.append(heading);
 const tabs=document.createElement("div");tabs.className="mb-inspector-tabs";
 const body=document.createElement("div");body.className="mb-inspector-body";panel.append(tabs,body);
 const groups=["Content","Layout","Style","Effects"];let active="Content";
 function control(host,label,key,value,type="text",placeholder=""){
  const wrap=document.createElement("label");wrap.className="mb-control";wrap.textContent=label;
  const input=document.createElement("input");input.type=type;input.value=value??"";input.placeholder=placeholder;
  input.addEventListener("input",()=>{if(type==="color"&&input.value==="")return;
   if(["text","url","textarea"].includes(type)){n.props[key]=input.value;}
   else{n.styles[device][key]=input.value;}
   dirty=true;renderCanvasOnly();scheduleSave();
  });
  input.addEventListener("change",()=>{history.push(current().tree);render();});wrap.append(input);host.append(wrap);return input;
 }
 function selectControl(host,label,key,value,choices){
  const wrap=document.createElement("label");wrap.className="mb-control";wrap.textContent=label;
  const sel=document.createElement("select");choices.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;sel.append(o);});sel.value=value||"";
  sel.addEventListener("change",()=>{n.styles[device][key]=sel.value;history.push(current().tree);dirty=true;render();scheduleSave();});wrap.append(sel);host.append(wrap);
 }
 function area(host,label,key,value){const wrap=document.createElement("label");wrap.className="mb-control";wrap.textContent=label;const el=document.createElement("textarea");el.value=value||"";el.addEventListener("input",()=>{n.props[key]=el.value;dirty=true;renderCanvasOnly();scheduleSave();});el.addEventListener("change",()=>{history.push(current().tree);render();});wrap.append(el);host.append(wrap);}
 function renderTab(){
  body.replaceChildren();const styles=C().resolveStyles(n.styles,device);
  if(active==="Content"){
   if(n.type==="image"){control(body,"Image URL","src",n.props.src||"","url");control(body,"Alt text","alt",n.props.alt||"");}
   else if(n.type==="button"){control(body,"Button label","text",n.props.text||"");control(body,"Destination URL","href",n.props.href||"","#");}
   else{area(body,"Text content","text",n.props.text||"");if("title" in n.props)control(body,"Section title","title",n.props.title||"");}
   const note=document.createElement("p");note.className="mb-tool-note";note.textContent="Changes are applied to the selected element. Preview interactions remain disabled.";body.append(note);
  }
  if(active==="Layout"){
   [["Padding","padding"],["Margin","margin"],["Width","width"],["Maximum width","maxWidth"],["Minimum height","minHeight"],["Gap","gap"]].forEach(([l,k])=>control(body,l,k,styles[k]||""));
   selectControl(body,"Display","display",styles.display,[["","Theme default"],["block","Block"],["flex","Flex"],["grid","Grid"],["inline-flex","Inline flex"]]);
   selectControl(body,"Flex direction","flexDirection",styles.flexDirection,[["","Default"],["row","Row"],["column","Column"],["row-reverse","Row reverse"],["column-reverse","Column reverse"]]);
   selectControl(body,"Align items","alignItems",styles.alignItems,[["","Default"],["start","Start"],["center","Center"],["end","End"],["stretch","Stretch"]]);
   selectControl(body,"Justify content","justifyContent",styles.justifyContent,[["","Default"],["start","Start"],["center","Center"],["end","End"],["space-between","Space between"],["space-around","Space around"]]);
  }
  if(active==="Style"){
   control(body,"Text color","color",styles.color||"","#");
   control(body,"Background","background",styles.background||"","#");
   control(body,"Font size","fontSize",styles.fontSize||"");
   control(body,"Font weight","fontWeight",styles.fontWeight||"");
   control(body,"Line height","lineHeight",styles.lineHeight||"");
   control(body,"Letter spacing","letterSpacing",styles.letterSpacing||"");
   control(body,"Border radius","borderRadius",styles.borderRadius||"");
   control(body,"Border","border",styles.border||"");
   selectControl(body,"Text alignment","textAlign",styles.textAlign,[["","Theme default"],["left","Left"],["center","Center"],["right","Right"],["justify","Justify"]]);
   selectControl(body,"Font family","fontFamily",styles.fontFamily,[["","Theme default"],["system-ui,sans-serif","System"],["Arial,sans-serif","Arial"],["Georgia,serif","Georgia"],["'Trebuchet MS',sans-serif","Trebuchet"]]);
  }
  if(active==="Effects"){
   control(body,"Shadow","boxShadow",styles.boxShadow||"");
   control(body,"Opacity (0–1)","opacity",styles.opacity||"");
   control(body,"Transform","transform",styles.transform||"");
   control(body,"Filter","filter",styles.filter||"");
   control(body,"Overflow","overflow",styles.overflow||"");
   const presets=document.createElement("div");presets.className="mb-style-presets";
   [["Soft card","0 8px 28px rgba(0,0,0,.14)","18px"],["Floating","0 18px 45px rgba(0,0,0,.22)","24px"],["Sharp","none","0px"]].forEach(([label,shadow,radius])=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=()=>{n.styles[device].boxShadow=shadow;n.styles[device].borderRadius=radius;history.push(current().tree);dirty=true;render();scheduleSave();};presets.append(b);});body.append(presets);
  }
 }
 groups.forEach(g=>{const b=document.createElement("button");b.type="button";b.textContent=g;b.className="mb-tab"+(g===active?" active":"");b.onclick=()=>{active=g;tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x.textContent===g));renderTab();};tabs.append(b);});
 renderTab();
 const actions=document.createElement("div");actions.className="mb-node-actions";
 [["↑ Move up",()=>{current().tree=C().moveNode(current().tree,n.id,-1);saveHistory();}],["↓ Move down",()=>{current().tree=C().moveNode(current().tree,n.id,1);saveHistory();}],["Duplicate",()=>{const cp=C().clone(n);const renew=x=>{x.id=C().id();(x.children||[]).forEach(renew);};renew(cp);current().tree=C().insertNode(current().tree,cp);selected=cp.id;saveHistory();}]].forEach(([label,fn])=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=fn;actions.append(b);});panel.append(actions);
 const del=document.createElement("button");del.type="button";del.textContent="Delete element";del.className="mb-danger";del.onclick=()=>{current().tree=C().removeNode(current().tree,n.id);selected=null;saveHistory();};panel.append(del);
}
function renderCanvasOnly(){R().renderTree(current().tree,$("#mb-canvas"),device,selected);bindCanvasSelection();}
function add(type){const preset=presets.find(x=>x[0]===type);if(!preset)return;const n=C().makeNode(type,preset[2],type==="hero"?{padding:"48px 20px",background:"#17152d",color:"#fff"}:{padding:"24px",background:"#121d33",color:"#f5f7ff"});current().tree=C().insertNode(current().tree,n);selected=n.id;saveHistory();}
let timer;function scheduleSave(){clearTimeout(timer);timer=setTimeout(saveDraft,1500);}
async function saveDraft(){const payload=JSON.stringify(current().tree);if(new Blob([payload]).size>850000){$("#mb-status").textContent="Page too large. Split this page into smaller sections.";return false;}if(!window.hubCloud?.ready||!hubCloud.auth?.currentUser){$("#mb-status").textContent="Offline — changes remain in this editor";return false;}try{$("#mb-status").textContent="Saving…";const ref=hubCloud.db.collection("sites").doc("maxtroit").collection("pages").doc(current().id);await ref.set({name:current().name,draftTree:current().tree,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:hubCloud.auth.currentUser.uid},{merge:true});dirty=false;$("#mb-status").textContent="Saved";return true;}catch(e){$("#mb-status").textContent="Save error: "+e.message;return false;}}
async function publish(){if(!await saveDraft()){$("#mb-status").textContent="Publish cancelled: draft could not be saved.";return;}if(!window.hubCloud?.ready)return;try{const db=hubCloud.db,ref=db.collection("sites").doc("maxtroit").collection("pages").doc(current().id),snap=await ref.get(),data=snap.data()||{},batch=db.batch(),version=db.collection("sites").doc("maxtroit").collection("versions").doc();const publicRef=db.collection("sites").doc("maxtroit").collection("publicPages").doc(current().id);batch.set(publicRef,{name:current().name,publishedTree:current().tree,publishedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});batch.set(version,{pageId:current().id,snapshot:current().tree,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:hubCloud.auth.currentUser.uid});await batch.commit();$("#mb-status").textContent="Published · version saved";}catch(e){$("#mb-status").textContent="Publish failed: "+e.message;}}
async function loadVersions(){
 const host=$("#mb-versions");if(!host)return;host.textContent="Loading versions…";
 if(!window.hubCloud?.ready||!hubCloud.auth?.currentUser){host.textContent="Sign in to view saved versions.";return;}
 try{const snap=await hubCloud.db.collection("sites").doc("maxtroit").collection("versions").get();const rows=snap.docs.map(d=>({id:d.id,...(d.data()||{})})).filter(v=>v.pageId===current().id&&Array.isArray(v.snapshot)).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)).slice(0,20);host.replaceChildren();if(!rows.length){host.textContent="No saved versions for this page yet.";return;}rows.forEach(v=>{const b=document.createElement("button");b.type="button";b.className="mb-layer";const stamp=v.createdAt?.toDate?.();b.textContent=stamp?stamp.toLocaleString():"Saved version";b.addEventListener("click",()=>{current().tree=C().clone(v.snapshot);tree=current().tree;history=new C().History(tree);selected=null;dirty=true;render();scheduleSave();$("#mb-status").textContent="Version restored as a draft. Save or publish to apply it.";});host.append(b);});}catch(e){host.textContent="Could not load versions: "+e.message;}
}
$("#mb-load-versions")?.addEventListener("click",loadVersions);
root.addEventListener("click",e=>{const b=e.target.closest("[data-mb-add]");if(b)add(b.dataset.mbAdd);});
$("#mb-undo").onclick=()=>{if(history.canUndo){current().tree=history.undo();tree=current().tree;dirty=true;render();scheduleSave();}};
$("#mb-redo").onclick=()=>{if(history.canRedo){current().tree=history.redo();tree=current().tree;dirty=true;render();scheduleSave();}};
$("#mb-save").onclick=saveDraft;$("#mb-publish").onclick=publish;$("#mb-import-site")?.addEventListener("click",importExistingSite);
$("#mb-device").onchange=e=>{device=e.target.value;render();};
$("#mb-add-page").onclick=()=>{const name=prompt("Page name");if(!name)return;pages.push({id:"page-"+Date.now(),name,tree:[]});pageIndex=pages.length-1;selected=null;history=new C().History(current().tree);render();};$("#mb-page-select")?.addEventListener("change",e=>{pageIndex=Number(e.target.value)||0;selected=null;tree=current().tree;history=new C().History(tree);loadPage();render();});
$("#mb-delete").onclick=()=>{if(pages.length<2)return;pages.splice(pageIndex,1);pageIndex=0;selected=null;history=new C().History(current().tree);render();};
$("#mb-back").onclick=()=>{root.hidden=true;$(".preview-area").hidden=false;$(".we-legacy-dock").hidden=false;};
$("#open-advanced-builder").onclick=()=>{$(".preview-area").hidden=true;$(".we-legacy-dock").hidden=true;$("#design-studio").hidden=true;root.hidden=false;render();};
$("#mb-upload").onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024||!/^image\/(jpeg|png|webp|gif)$/.test(file.type)){alert("Choose JPG, PNG, WEBP or GIF up to 5 MB.");return;}try{const ref=firebase.storage().ref("builder-media/"+hubCloud.auth.currentUser.uid+"/"+Date.now()+"-"+file.name),snap=await ref.put(file,{contentType:file.type}),url=await snap.ref.getDownloadURL();if(selected){const n=C().findNode(current().tree,selected);n.props.src=url;n.props.alt=n.props.alt||file.name;dirty=true;render();scheduleSave();}}catch(err){$("#mb-status").textContent="Upload failed: "+err.message;}};
window.addEventListener("keydown",e=>{const tag=e.target?.tagName;if(["INPUT","TEXTAREA","SELECT"].includes(tag)||e.target?.isContentEditable)return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==="z"){e.preventDefault();$("#mb-undo").click();}else if(mod&&(e.key.toLowerCase()==="y"||e.shiftKey&&e.key.toLowerCase()==="z")){e.preventDefault();$("#mb-redo").click();}else if(e.key==="Escape"){selected=null;render();}});$("#mb-device").value=device;render();if(window.hubCloud?.auth){hubCloud.auth.onAuthStateChanged(user=>{if(user)loadPage();});}else{loadPage();}window.addEventListener("online",()=>{if(dirty)saveDraft();});
})();