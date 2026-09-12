const player=document.querySelector('#intro-audio');
const playButton=document.querySelector('#intro-play');
const label=playButton.querySelector('.voice-label');
const icon=playButton.querySelector('.voice-icon');
const status=document.querySelector('#audio-status');
const rotationButton=document.querySelector('#rotation-toggle');
const view=document.querySelector('#head-view');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,speaking=false,level=0,audioContext,analyser,bins;
function setSpeaking(value){speaking=value;playButton.classList.toggle('is-speaking',value);playButton.setAttribute('aria-pressed',String(value));label.textContent=value?'Durdur':'Beni dinle';icon.textContent=value?'Ⅱ':'▶';}
function rotationState(){rotationButton.setAttribute('aria-pressed',String(paused));rotationButton.setAttribute('aria-label',paused?'Dönüşü başlat':'Dönüşü durdur');rotationButton.textContent=paused?'▶':'Ⅱ';}
rotationState();rotationButton.addEventListener('click',()=>{paused=!paused;rotationState();});
reduced.addEventListener('change',()=>{paused=reduced.matches;rotationState();});
playButton.addEventListener('click',async()=>{if(!player.paused){player.pause();return;}try{status.textContent='';await player.play();if(!audioContext){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(AudioCtx){audioContext=new AudioCtx();analyser=audioContext.createAnalyser();analyser.fftSize=256;const source=audioContext.createMediaElementSource(player);source.connect(analyser);analyser.connect(audioContext.destination);bins=new Uint8Array(analyser.frequencyBinCount);}}await audioContext?.resume();}catch{status.textContent='Ses açılamadı. Tekrar deneyebilir veya tanıtımı okuyabilirsin.';setSpeaking(false);}});
player.addEventListener('play',()=>setSpeaking(true));player.addEventListener('pause',()=>setSpeaking(false));player.addEventListener('ended',()=>setSpeaking(false));player.addEventListener('error',()=>{setSpeaking(false);status.textContent='Ses yüklenemedi. Tanıtım metnini aşağıdan okuyabilirsin.';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});
(async()=>{try{
const THREE=await import('./assets/vendor/three.module.min.js');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;view.appendChild(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,.1,7.5);camera.lookAt(0,0,0);
const {createAvatar}=await import('./avatar-model.js?v=sculpt1');const pivot=createAvatar(THREE);scene.add(pivot);
scene.add(new THREE.AmbientLight(0xffffff,1.75));const key=new THREE.DirectionalLight(0xfff3df,.9);key.position.set(-3,4,6);scene.add(key);const fill=new THREE.DirectionalLight(0xc8d7ff,.45);fill.position.set(4,0,3);scene.add(fill);const rim=new THREE.DirectionalLight(0xffd1a4,2.4);rim.position.set(2,3,-5);scene.add(rim);

let targetY=0,targetX=0,drag=false,lastX=0,lastY=0,manualUntil=0,time=0,last=0,visible=true;
function resize(){const {width,height}=view.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(view);resize();
view.classList.add('model-ready');
view.tabIndex=0;view.setAttribute('role','group');view.setAttribute('aria-label','Ömer’in üç boyutlu portresi. Sürükleyerek veya ok tuşlarıyla döndür.');
view.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;view.setPointerCapture(e.pointerId);manualUntil=Infinity;});
view.addEventListener('pointermove',e=>{if(!drag)return;targetY+=(e.clientX-lastX)*.012;targetX=THREE.MathUtils.clamp(targetX+(e.clientY-lastY)*.006,-.65,.65);lastX=e.clientX;lastY=e.clientY;});
// Absolute pointer position spans a complete revolution, with the nearest turn
// chosen so crossing an edge never makes the head snap backwards.
window.addEventListener('pointermove',e=>{if(drag||e.pointerType==='touch')return;const angle=(e.clientX/window.innerWidth-.5)*Math.PI*2;targetY+=Math.atan2(Math.sin(angle-targetY),Math.cos(angle-targetY));targetX=THREE.MathUtils.clamp((e.clientY/window.innerHeight-.5)*.65,-.4,.4);manualUntil=performance.now()+2200;},{passive:true});
function endDrag(){drag=false;manualUntil=performance.now()+3500;}view.addEventListener('pointerup',endDrag);view.addEventListener('pointercancel',endDrag);view.addEventListener('lostpointercapture',endDrag);
view.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();targetY+=(e.key==='ArrowLeft'?-.25:e.key==='ArrowRight'?.25:0);targetX=THREE.MathUtils.clamp(targetX+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0),-.25,.25);manualUntil=performance.now()+5000;}});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.01}).observe(view);
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden||!visible)return;if(!paused&&!reduced.matches){time+=dt;if(now>manualUntil){targetY+=dt*.24;targetX*=Math.exp(-dt*2);}}
const ease=1-Math.exp(-dt*9);pivot.rotation.y+=(targetY-pivot.rotation.y)*ease;pivot.rotation.x+=(targetX-pivot.rotation.x)*ease;pivot.position.y=!paused&&!reduced.matches?Math.sin(time*.9)*.025:0;
let energy=0;if(speaking&&analyser){analyser.getByteFrequencyData(bins);for(let i=2;i<45;i++)energy+=bins[i];energy=Math.min(1,energy/(43*95));}level+=(energy-level)*.3;
if(!reduced.matches)pivot.userData.mouth.position.y=-level*.028;
renderer.render(scene,camera);}
requestAnimationFrame(frame);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();view.classList.remove('model-ready');document.querySelector('#avatar-hint').textContent='Ömer · Görsel hikâyeler';});
}catch(error){rotationButton.hidden=true;document.querySelector('#avatar-hint').textContent='Ömer · Görsel hikâyeler';view.querySelector('.avatar-loading').textContent='3D karakter yüklenemedi. Sayfayı yenileyebilirsin.';console.warn('3D portrait unavailable:',error);}})();
