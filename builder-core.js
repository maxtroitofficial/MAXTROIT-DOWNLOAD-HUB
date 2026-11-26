/* MAXTROIT Builder Core: immutable tree helpers, responsive style resolution and history. */
(()=>{"use strict";
const clone=v=>JSON.parse(JSON.stringify(v));
const id=()=> "n"+Math.random().toString(36).slice(2,10);
const makeNode=(type,props={},styles={})=>({id:id(),type,props:{...props},styles:{desktop:{...styles},tablet:{},mobile:{}},children:[]});
function resolveStyles(styles={},device="desktop"){return Object.assign({},styles.desktop||{},device!=="desktop"?(styles.tablet||{}):{},device==="mobile"?(styles.mobile||{}):{});}
function findNode(nodes,nodeId){for(const n of nodes||[]){if(n.id===nodeId)return n;const found=findNode(n.children,nodeId);if(found)return found;}return null;}
function walk(nodes,fn,parent=null){(nodes||[]).forEach((n,i)=>{fn(n,parent,i);walk(n.children,fn,n);});}
function insertNode(tree,node,parentId=null,index){const copy=clone(tree);if(!parentId){const i=index==null?copy.length:Math.max(0,Math.min(index,copy.length));copy.splice(i,0,clone(node));return copy;}const p=findNode(copy,parentId);if(!p)throw Error("Parent node not found");p.children=p.children||[];const i=index==null?p.children.length:Math.max(0,Math.min(index,p.children.length));p.children.splice(i,0,clone(node));return copy;}
function updateNode(tree,nodeId,updater){const copy=clone(tree),n=findNode(copy,nodeId);if(!n)throw Error("Node not found");updater(n);return copy;}
function removeNode(tree,nodeId){const copy=clone(tree);function rec(list){const i=list.findIndex(n=>n.id===nodeId);if(i>=0){list.splice(i,1);return true;}return list.some(n=>rec(n.children||[]));}rec(copy);return copy;}
function moveNode(tree,nodeId,direction){const copy=clone(tree);function rec(list){const i=list.findIndex(n=>n.id===nodeId);if(i>=0){const j=i+direction;if(j<0||j>=list.length)return true;[list[i],list[j]]=[list[j],list[i]];return true;}return list.some(n=>rec(n.children||[]));}rec(copy);return copy;}
class History{constructor(initial,max=100){this.stack=[clone(initial)];this.index=0;this.max=max;}push(value){this.stack=this.stack.slice(0,this.index+1);this.stack.push(clone(value));if(this.stack.length>this.max)this.stack.shift();this.index=this.stack.length-1;}undo(){if(this.index>0)this.index--;return clone(this.stack[this.index]);}redo(){if(this.index<this.stack.length-1)this.index++;return clone(this.stack[this.index]);}get canUndo(){return this.index>0;}get canRedo(){return this.index<this.stack.length-1;}}
window.MAXTROITBuilderCore={clone,id,makeNode,resolveStyles,findNode,walk,insertNode,updateNode,removeNode,moveNode,History};
})();