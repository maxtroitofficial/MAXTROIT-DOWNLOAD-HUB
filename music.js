(()=>{ 
"use strict";
const player=document.getElementById("mx-music-player");
const audio=document.getElementById("mx-music-audio");
const toggle=document.getElementById("mx-music-toggle");
const label=document.getElementById("mx-music-track");
if(!player||!audio||!toggle||!label)return;

const DEFAULT_TRACKS=[
{id:"happy-end-music",title:"Happy End Music",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/upbeat/synth/happy-end-music.ogg"},
{id:"the-journey-begins",title:"The Journey Begins",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/cinematic/rpg/the-journey-begins.ogg"},
{id:"electronic-loop-01",title:"Electronic Game Loop 01",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/electronic/abstraction-01bff13f05e762766741d30c.ogg"},
{id:"electronic-loop-08",title:"Ludum Dare Electronic 08",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/electronic/abstraction-076c1debeae5f7ec29f66acb.ogg"},
{id:"electronic-loop-02",title:"Ludum Dare Electronic 02",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/electronic/abstraction-30db5715f7b08ce3924416f6.ogg"},
{id:"electronic-loop-10",title:"Electronic Game Loop 10",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/electronic/abstraction-3dfe3354a4cce53ab5ddcb82.ogg"},
{id:"electronic-loop-11",title:"Electronic Game Loop 11",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/electronic/abstraction-417fa91b83fab8b8be52a4e5.ogg"},
{id:"electronic-loop-12",title:"Electronic Game Loop 12",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/electronic/abstraction-42d521c3eff005c80eb52792.ogg"},
{id:"electronic-loop-38",title:"Ludum Dare Electronic 38",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/electronic/abstraction-485c2342c9a329e48dfcce91.ogg"},
{id:"retro-chiptune-12",title:"Retro Chiptune 12",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/chiptune/abstraction-660328d005f5c812d0f52f63.ogg"},
{id:"retro-chiptune-01",title:"Retro Chiptune 01",url:"https://raw.githubusercontent.com/jfpx/cc0-media-library/music-v1/music/unspecified/chiptune/abstraction-6f85ef477e9372f5cb5b348c.ogg"}
];
const KEY="maxtroitMusicState";
let cfg={},queue=[],currentIndex=-1,failed=new Set(),globalPause=false,started=false,firestoreBound=false;
const validUrl=v=>{try{const u=new URL(String(v||""));return u.protocol==="https:"?u.href:""}catch(e){return""}};
const volume=()=>Math.max(0,Math.min(1,Number(cfg.musicVolume??35)/100));
function save(){try{localStorage.setItem(KEY,JSON.stringify({id:queue[currentIndex]?.id||"",time:audio.currentTime||0,paused:audio.paused}))}catch(e){}}
function paint(){const playing=!audio.paused;toggle.disabled=globalPause||cfg.musicEnabled===false||!queue.length;toggle.setAttribute("aria-label",playing?"Pause music":"Play music");toggle.setAttribute("aria-pressed",String(playing));player.classList.toggle("is-playing",playing)}
function show(enabled){player.hidden=!enabled}
function nextIndex(){if(!queue.length)return -1;let candidates=queue.map((_,i)=>i).filter(i=>!failed.has(i)&&i!==currentIndex);if(!candidates.length&&currentIndex>=0&&!failed.has(currentIndex))candidates=[currentIndex];if(!candidates.length){label.textContent="Music tracks unavailable · Check connection";paint();return -1}if(cfg.musicShuffle===false)return candidates[0];return candidates[Math.floor(Math.random()*candidates.length)]}
function playIndex(index,fromUser){if(index<0||index>=queue.length)return;const track=queue[index],url=validUrl(track.url);if(!url){failed.add(index);return playIndex(nextIndex(),fromUser)}currentIndex=index;label.textContent=track.title||"Gaming track";audio.pause();audio.src=url;audio.preload="auto";audio.volume=volume();audio.load();let p;try{p=audio.play()}catch(e){handlePlayError(e,index);return}if(p&&p.catch)p.catch(e=>handlePlayError(e,index));paint();save()}
function handlePlayError(error,index){paint();if(error?.name==="NotAllowedError"){label.textContent="Tap cassette once to start music";return}failed.add(index);label.textContent="Track unavailable · Trying another…";const next=nextIndex();if(next>=0)setTimeout(()=>playIndex(next,false),250)}
function playNext(){const next=nextIndex();if(next>=0)playIndex(next,false)}
audio.addEventListener("ended",()=>{if(!globalPause&&cfg.musicEnabled!==false)playNext()});
audio.addEventListener("error",()=>{if(!queue.length||globalPause)return;const bad=currentIndex;if(bad>=0)failed.add(bad);label.textContent="Track unavailable · Trying another…";const next=nextIndex();if(next>=0)setTimeout(()=>playIndex(next,false),250);else{label.textContent="Music unavailable · Check track links";paint()}});
audio.addEventListener("play",()=>{paint();save()});
audio.addEventListener("pause",()=>{paint();save()});
audio.addEventListener("timeupdate",()=>{if(Math.floor(audio.currentTime)%5===0)save()});
toggle.addEventListener("click",()=>{if(globalPause||cfg.musicEnabled===false)return;if(audio.paused){if(currentIndex>=0&&!failed.has(currentIndex)){const p=audio.play();if(p&&p.catch)p.catch(e=>handlePlayError(e,currentIndex))}else{failed.clear();playNext()}}else audio.pause()});
function apply(data){cfg=data||{};const configured=Array.isArray(cfg.musicTracks)&&cfg.musicTracks.length?cfg.musicTracks:DEFAULT_TRACKS;queue=configured.filter(t=>t&&validUrl(t.url));failed.clear();globalPause=cfg.musicGlobalPause===true;const enabled=cfg.musicEnabled!==false&&queue.length>0;show(enabled);if(!enabled){audio.pause();label.textContent=cfg.musicEnabled===false?"Music is OFF":"No music tracks configured";paint();return}if(globalPause){audio.pause();label.textContent="Music paused by admin";paint();return}paint();if(!started){started=true;let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}const restored=queue.findIndex(t=>t.id===saved.id);if(restored>=0){currentIndex=restored;label.textContent=queue[restored].title||"Gaming track";if(Number(saved.time)>0)audio.addEventListener("loadedmetadata",()=>{try{audio.currentTime=Math.min(Number(saved.time),Math.max(0,audio.duration-1))}catch(e){}},{once:true});if(saved.paused===false)playIndex(restored,false);else{audio.src=validUrl(queue[restored].url);audio.volume=volume();paint()}}else playNext()}}
function bindFirestore(){if(firestoreBound)return true;if(!window.hubCloud?.ready||!window.hubCloud.db)return false;firestoreBound=true;try{window.hubCloud.db.collection("siteConfig").doc("public").onSnapshot(s=>apply(s.exists?s.data():{}),e=>{console.warn("Music settings unavailable; using built-in playlist.",e);if(!started)apply({});});return true}catch(e){console.warn("Music setup failed; using built-in playlist.",e);if(!started)apply({});return false}}
if(!bindFirestore()){let attempts=0;const wait=setInterval(()=>{attempts++;if(bindFirestore()){clearInterval(wait);return}if(attempts>=30){clearInterval(wait);if(!started)apply({})}},200)}
})();