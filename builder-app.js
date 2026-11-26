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
function render(){const canvas=$("#mb-canvas"),node=C().findNode(current().tree,selected);R().renderTree(current().tree,canvas,device,selected);canvas.querySelectorAll("[data-node-id]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();selected=el.dataset.nodeId;render();inspector();}));$("#mb-layers").innerHTML="";C().walk(current().tree,(n,parent)=>{const row=document.createElement("div");row.className="mb-layer-row";const b=document.createElement("button");b.type="button";b.className="mb-layer"+(n.id===selected?" active":"");b.style.paddingLeft=(12+(parent?14:0))+"px";b.textContent=(n.props.title||n.props.text||n.type).slice(0,32);b.onclick=()=>{selected=n.id;render();};row.append(b);$("#mb-layers").append(row);});let pageSelect=$("#mb-page-select");if(pageSelect){pageSelect.innerHTML="";pages.forEach((p,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=p.name;pageSelect.append(o);});pageSelect.value=String(pageIndex);}$("#mb-page-name").textContent=current().name;$("#mb-status").textContent=dirty?"Unsaved changes":"Saved";$("#mb-undo").disabled=!history.canUndo;$("#mb-redo").disabled=!history.canRedo;inspector();}
function inspector(){const n=C().findNode(current().tree,selected),panel=$("#mb-inspector");panel.innerHTML="";if(!n){panel.textContent="Select an element on the canvas or in Layers.";return;}
const title=document.createElement("h3");title.textContent=n.type+" settings";panel.append(title);
function field(label,key,value,type="text"){const wrap=document.createElement("label");wrap.textContent=label;const input=document.createElement(type==="textarea"?"textarea":"input");if(type!=="textarea")input.type=type;input.value=value??"";input.addEventListener("input",()=>{n.props[key]=input.value;dirty=true;renderCanvasOnly();scheduleSave();});input.addEventListener("change",()=>{history.push(current().tree);render();});wrap.append(input);panel.append(wrap);}
field("Text / title","text",n.props.text??n.props.title??"","textarea");if("title" in n.props)field("Heading","title",n.props.title);if(n.type==="image"){field("Image URL","src",n.props.src);field("Alt text","alt",n.props.alt);}if(n.type==="button"){field("Link URL","href",n.props.href);}
const color=field;const styles=C().resolveStyles(n.styles,device);["color","background","padding","margin","fontSize","borderRadius","textAlign","width"].forEach(k=>{const w=document.createElement("label");w.textContent=k;const inp=document.createElement("input");inp.value=styles[k]||"";inp.placeholder="Default";inp.addEventListener("change",()=>{n.styles[device][k]=inp.value;history.push(current().tree);dirty=true;render();scheduleSave();});w.append(inp);panel.append(w);});
const controls=document.createElement("div");controls.className="mb-node-actions";[["↑ Move up",-1],["↓ Move down",1]].forEach(([label,dir])=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=()=>{current().tree=C().moveNode(current().tree,n.id,dir);saveHistory();};controls.append(b);});const dup=document.createElement("button");dup.type="button";dup.textContent="Duplicate";dup.onclick=()=>{const copy=C().clone(n);const renew=x=>{x.id=C().id();(x.children||[]).forEach(renew);};renew(copy);current().tree=C().insertNode(current().tree,copy);selected=copy.id;saveHistory();};controls.append(dup);panel.append(controls);const del=document.createElement("button");del.textContent="Delete element";del.className="mb-danger";del.onclick=()=>{current().tree=C().removeNode(current().tree,n.id);selected=null;saveHistory();};panel.append(del);}
function renderCanvasOnly(){R().renderTree(current().tree,$("#mb-canvas"),device,selected);}
function add(type){const preset=presets.find(x=>x[0]===type);if(!preset)return;const n=C().makeNode(type,preset[2],type==="hero"?{padding:"48px 20px",background:"#17152d",color:"#fff"}:{padding:"24px",background:"#121d33",color:"#f5f7ff"});current().tree=C().insertNode(current().tree,n);selected=n.id;saveHistory();}
let timer;function scheduleSave(){clearTimeout(timer);timer=setTimeout(saveDraft,1500);}
async function saveDraft(){const payload=JSON.stringify(current().tree);if(new Blob([payload]).size>850000){$("#mb-status").textContent="Page too large. Split this page into smaller sections.";return false;}if(!window.hubCloud?.ready||!hubCloud.auth?.currentUser){$("#mb-status").textContent="Offline — changes remain in this editor";return false;}try{$("#mb-status").textContent="Saving…";const ref=hubCloud.db.collection("sites").doc("maxtroit").collection("pages").doc(current().id);await ref.set({name:current().name,draftTree:current().tree,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:hubCloud.auth.currentUser.uid},{merge:true});dirty=false;$("#mb-status").textContent="Saved";return true;}catch(e){$("#mb-status").textContent="Save error: "+e.message;return false;}}
async function publish(){if(!await saveDraft()){$("#mb-status").textContent="Publish cancelled: draft could not be saved.";return;}if(!window.hubCloud?.ready)return;try{const db=hubCloud.db,ref=db.collection("sites").doc("maxtroit").collection("pages").doc(current().id),snap=await ref.get(),data=snap.data()||{},batch=db.batch(),version=db.collection("sites").doc("maxtroit").collection("versions").doc();batch.set(ref,{publishedTree:current().tree,publishedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});batch.set(version,{pageId:current().id,snapshot:current().tree,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:hubCloud.auth.currentUser.uid});await batch.commit();$("#mb-status").textContent="Published · version saved";}catch(e){$("#mb-status").textContent="Publish failed: "+e.message;}}
root.addEventListener("click",e=>{const b=e.target.closest("[data-mb-add]");if(b)add(b.dataset.mbAdd);});
$("#mb-undo").onclick=()=>{if(history.canUndo){current().tree=history.undo();tree=current().tree;dirty=true;render();scheduleSave();}};
$("#mb-redo").onclick=()=>{if(history.canRedo){current().tree=history.redo();tree=current().tree;dirty=true;render();scheduleSave();}};
$("#mb-save").onclick=saveDraft;$("#mb-publish").onclick=publish;$("#mb-import-site")?.addEventListener("click",importExistingSite);
$("#mb-device").onchange=e=>{device=e.target.value;render();};
$("#mb-add-page").onclick=()=>{const name=prompt("Page name");if(!name)return;pages.push({id:"page-"+Date.now(),name,tree:[]});pageIndex=pages.length-1;selected=null;history=new C().History(current().tree);render();};$("#mb-page-select")?.addEventListener("change",e=>{pageIndex=Number(e.target.value)||0;selected=null;tree=current().tree;history=new C().History(tree);loadPage();render();});
$("#mb-delete").onclick=()=>{if(pages.length<2)return;pages.splice(pageIndex,1);pageIndex=0;selected=null;history=new C().History(current().tree);render();};
$("#mb-back").onclick=()=>{root.hidden=true;$(".preview-area").hidden=false;$(".we-legacy-dock").hidden=false;};
$("#open-advanced-builder").onclick=()=>{$(".preview-area").hidden=true;$(".we-legacy-dock").hidden=true;$("#design-studio").hidden=true;root.hidden=false;render();};
$("#mb-upload").onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024||!/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.type)){alert("Choose JPG, PNG, WEBP, GIF or SVG up to 5 MB.");return;}try{const ref=firebase.storage().ref("builder-media/"+hubCloud.auth.currentUser.uid+"/"+Date.now()+"-"+file.name),snap=await ref.put(file,{contentType:file.type}),url=await snap.ref.getDownloadURL();if(selected){const n=C().findNode(current().tree,selected);n.props.src=url;n.props.alt=n.props.alt||file.name;dirty=true;render();scheduleSave();}}catch(err){$("#mb-status").textContent="Upload failed: "+err.message;}};
$("#mb-device").value=device;render();if(window.hubCloud?.auth){hubCloud.auth.onAuthStateChanged(user=>{if(user)loadPage();});}else{loadPage();}window.addEventListener("online",()=>{if(dirty)saveDraft();});
})();