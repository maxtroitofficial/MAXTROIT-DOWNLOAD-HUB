(()=>{ 
"use strict";
const player=document.getElementById("mx-music-player");
const audio=document.getElementById("mx-music-audio");
const toggle=document.getElementById("mx-music-toggle");
const label=document.getElementById("mx-music-track");
const artwork=document.getElementById("mx-music-artwork");
if(!player||!audio||!toggle||!label)return;

const DEFAULT_TRACKS=[];
const KEY="maxtroitMusicState";
let cfg={},queue=[],currentIndex=-1,failed=new Set(),globalPause=false,started=false,firestoreBound=false,synthContext=null,synthMaster=null,synthTimer=null,synthStep=0,synthPlaying=false;
const validUrl=v=>{try{const u=new URL(String(v||""));return u.protocol==="https:"?u.href:""}catch(e){return""}};
const volume=()=>Math.max(0,Math.min(1,Number(cfg.musicVolume??35)/100));
function save(){try{localStorage.setItem(KEY,JSON.stringify({id:queue[currentIndex]?.id||"",time:audio.currentTime||0,paused:!(synthPlaying||!audio.paused)}))}catch(e){}}
function paint(){toggle.hidden=false;const playing=synthPlaying||!audio.paused;toggle.disabled=globalPause||cfg.musicEnabled===false||!queue.length;toggle.setAttribute("aria-label",playing?"Pause music":"Play music");toggle.setAttribute("aria-pressed",String(playing));player.classList.toggle("is-playing",playing)}
function show(enabled){player.hidden=!enabled}
function nextIndex(){if(!queue.length)return -1;const usable=queue.map((_,i)=>i).filter(i=>!failed.has(i));if(!usable.length)return -1;if(cfg.musicShuffle===false){for(let step=1;step<=queue.length;step++){const i=(Math.max(-1,currentIndex)+step)%queue.length;if(!failed.has(i))return i}return -1}let candidates=usable.filter(i=>i!==currentIndex);if(!candidates.length)candidates=usable;return candidates.length?candidates[Math.floor(Math.random()*candidates.length)]:-1}
function stopSynth(){if(synthTimer){clearInterval(synthTimer);synthTimer=null}if(synthMaster&&synthContext){try{synthMaster.gain.setTargetAtTime(.0001,synthContext.currentTime,.04)}catch(e){}}synthPlaying=false;paint();save()}
function startSynth(index){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error("Web Audio unavailable");if(!synthContext){synthContext=new AC();synthMaster=synthContext.createGain();synthMaster.gain.value=.0001;synthMaster.connect(synthContext.destination)}currentIndex=index;label.textContent=queue[index]?.title||"MAXTROIT Arcade Synth";const resume=synthContext.state==="suspended"?synthContext.resume():Promise.resolve();Promise.resolve(resume).then(()=>{synthMaster.gain.setTargetAtTime(volume()*.42,synthContext.currentTime,.18);synthPlaying=true;if(!synthTimer){const melody=[523.25,0,659.25,783.99,0,659.25,587.33,0,523.25,0,392,523.25,0,392,349.23,0,440,0,523.25,659.25,0,587.33,523.25,0,392,0,349.23,392,0,440,523.25,0];const bass=[130.81,0,130.81,0,174.61,0,174.61,0,196,0,196,0,174.61,0,174.61,0];let next=synthContext.currentTime+.04;synthStep=0;const schedule=()=>{while(next<synthContext.currentTime+.18){const m=melody[synthStep%melody.length],b=bass[Math.floor(synthStep/2)%bass.length];if(b){const o=synthContext.createOscillator(),g=synthContext.createGain();o.type="triangle";o.frequency.value=b/2;o.connect(g);g.connect(synthMaster);g.gain.setValueAtTime(.0001,next);g.gain.exponentialRampToValueAtTime(.13,next+.025);g.gain.exponentialRampToValueAtTime(.0001,next+.23);o.start(next);o.stop(next+.24)}if(m){const o=synthContext.createOscillator(),g=synthContext.createGain();o.type="square";o.frequency.value=m;o.connect(g);g.connect(synthMaster);g.gain.setValueAtTime(.0001,next);g.gain.exponentialRampToValueAtTime(.045,next+.012);g.gain.exponentialRampToValueAtTime(.0001,next+.19);o.start(next);o.stop(next+.2)}next+=.267;synthStep++}};schedule();synthTimer=setInterval(schedule,70)}paint();save()}).catch(()=>{label.textContent="Tap cassette once to start music";paint()})}catch(e){label.textContent="Audio is not supported in this browser";paint()}}
function playIndex(index,fromUser){if(index<0||index>=queue.length)return;const track=queue[index];if(track.type==="synth"){audio.pause();startSynth(index);return}stopSynth();const url=validUrl(track.url);if(!url){failed.add(index);return playIndex(nextIndex(),fromUser)}currentIndex=index;label.textContent=track.title||"Gaming track";audio.src=url;audio.preload="auto";audio.volume=volume();audio.load();let p;try{p=audio.play()}catch(e){handlePlayError(e,index);return}if(p&&p.catch)p.catch(e=>handlePlayError(e,index));paint();save()}
function handlePlayError(error,index){if(index!==currentIndex||failed.has(index))return;paint();if(error?.name==="NotAllowedError"){label.textContent="Tap cassette once to enable music";return}failed.add(index);label.textContent="Track unavailable · Trying another…";const next=nextIndex();if(next>=0)setTimeout(()=>{if(currentIndex===index&&failed.has(index))playIndex(next,false)},250);else{label.textContent="No playable tracks left · Check direct audio URLs";paint()}}
function playNext(){const next=nextIndex();if(next>=0)playIndex(next,false);else{const fallback=queue.findIndex(t=>t.type==="synth");if(fallback>=0)playIndex(fallback,false)}}
audio.addEventListener("ended",()=>{if(!globalPause&&cfg.musicEnabled!==false)playNext()});
audio.addEventListener("error",()=>{if(!queue.length||globalPause||currentIndex<0)return;handlePlayError(new Error("Audio source failed"),currentIndex)});
audio.addEventListener("play",()=>{paint();save()});
audio.addEventListener("pause",()=>{paint();save()});
audio.addEventListener("timeupdate",()=>{if(Math.floor(audio.currentTime)%5===0)save()});

 // Change track only on a deliberate double-tap/click on the player artwork.
 let lastArtworkTap=0,lastTrackChange=0;
 function artworkDoubleTap(e){
  if(e.target.closest("#mx-music-toggle")||globalPause||cfg.musicEnabled===false||!queue.length)return;
  const now=Date.now();
  if(now-lastArtworkTap<360){
   e.preventDefault();e.stopPropagation();lastArtworkTap=0;
   if(now-lastTrackChange>500){lastTrackChange=now;player.classList.add("mx-user-interacted");failed.delete(currentIndex);playNext();}
  }else lastArtworkTap=now;
 }
 player.addEventListener("dblclick",artworkDoubleTap);
 player.addEventListener("pointerup",e=>{if(e.pointerType==="touch")artworkDoubleTap(e)},{passive:false});

 toggle.addEventListener("click",()=>{player.classList.add("mx-user-interacted");if(globalPause||cfg.musicEnabled===false)return;if(synthContext&&currentIndex>=0&&queue[currentIndex]?.type==="synth"){if(synthPlaying)stopSynth();else startSynth(currentIndex);return}if(audio.paused){if(currentIndex>=0&&!failed.has(currentIndex)){const p=audio.play();if(p&&p.catch)p.catch(e=>handlePlayError(e,currentIndex))}else{failed.clear();playNext()}}else audio.pause()});
function apply(data){cfg=data||{};const rawArt=String(cfg.musicArtworkUrl||""),art=/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(rawArt)?rawArt:validUrl(rawArt),style=["vinyl","neon","chrome","purple","custom"].includes(cfg.musicArtworkStyle)?cfg.musicArtworkStyle:"vinyl";player.dataset.artStyle=style;player.dataset.artShape=["circle","rounded","square","squircle","hexagon","diamond","heart"].includes(cfg.musicArtworkShape)?cfg.musicArtworkShape:"circle";if(artwork){artwork.onload=()=>{player.classList.add("has-art")};artwork.onerror=()=>{player.classList.remove("has-art")};if(art){artwork.src=art;player.classList.add("has-art")}else{artwork.removeAttribute("src");player.classList.remove("has-art")}player.style.setProperty("--mx-art-speed",Math.max(2,Math.min(20,Number(cfg.musicArtworkSpeed)||4))+"s")}const configured=Array.isArray(cfg.musicTracks)?cfg.musicTracks:DEFAULT_TRACKS;
const cleaned=configured.filter(t=>t&&(t.type==="synth"||(validUrl(t.url)&&!String(t.url).includes("raw.githubusercontent.com/jfpx/cc0-media-library/"))));
queue=cleaned.slice();if(synthMaster&&synthContext)synthMaster.gain.setTargetAtTime(volume()*.42,synthContext.currentTime,.12);failed.clear();globalPause=cfg.musicGlobalPause===true;const enabled=cfg.musicEnabled!==false&&queue.length>0;show(enabled);if(!enabled){audio.pause();stopSynth();label.textContent=cfg.musicEnabled===false?"Music is OFF":"No music tracks configured";paint();return}if(globalPause){audio.pause();stopSynth();label.textContent="Music paused by admin";paint();return}paint();if(!started){started=true;let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}const restored=queue.findIndex(t=>t.id===saved.id);if(restored>=0){currentIndex=restored;label.textContent=queue[restored].title||"Gaming track";if(Number(saved.time)>0)audio.addEventListener("loadedmetadata",()=>{try{audio.currentTime=Math.min(Number(saved.time),Math.max(0,audio.duration-1))}catch(e){}},{once:true});if(cfg.musicAutoplay!==false)playIndex(restored,false);else if(queue[restored].type==="synth"){label.textContent="Ready · Tap cassette to enable music";paint()}else{audio.src=validUrl(queue[restored].url);audio.volume=volume();paint()}}else if(cfg.musicAutoplay!==false)playNext();else{label.textContent="Ready · Tap cassette to enable music";paint()}}}
function bindFirestore(){if(firestoreBound)return true;if(!window.hubCloud?.ready||!window.hubCloud.db)return false;firestoreBound=true;try{window.hubCloud.db.collection("siteConfig").doc("public").onSnapshot(s=>apply(s.exists?s.data():{}),e=>{console.warn("Music settings unavailable; using built-in playlist.",e);if(!started)apply({});});return true}catch(e){console.warn("Music setup failed; using built-in playlist.",e);if(!started)apply({});return false}}
// Browsers block audible autoplay until the visitor interacts with the page.
// Keep listening until Firestore settings and the playlist are ready; an early tap must not consume the fallback.
let firstGestureHandled=false;
function startAfterFirstGesture(){if(firstGestureHandled||cfg.musicAutoplay===false||cfg.musicEnabled===false||globalPause||!queue.length)return;if(synthPlaying||!audio.paused)return;firstGestureHandled=true;if(currentIndex>=0&&!failed.has(currentIndex)){playIndex(currentIndex,true)}else playNext()}
document.addEventListener("pointerdown",startAfterFirstGesture,{passive:true});
document.addEventListener("keydown",startAfterFirstGesture);
if(!bindFirestore()){let attempts=0;const wait=setInterval(()=>{attempts++;if(bindFirestore()){clearInterval(wait);return}if(attempts>=30){clearInterval(wait);if(!started)apply({})}},200)}
})();