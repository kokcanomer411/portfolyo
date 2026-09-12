const player=document.querySelector('#intro-audio');
const playButton=document.querySelector('#intro-play');
const label=playButton.querySelector('.voice-label');
const icon=playButton.querySelector('.voice-icon');
const status=document.querySelector('#audio-status');
const rotationButton=document.querySelector('#rotation-toggle');
const view=document.querySelector('#head-view');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let paused=true,speaking=false,level=0,audioContext,analyser,bins;
function setSpeaking(value){speaking=value;playButton.classList.toggle('is-speaking',value);playButton.setAttribute('aria-pressed',String(value));label.textContent=value?'Durdur':'Beni dinle';icon.textContent=value?'Ⅱ':'▶';}
function rotationState(){rotationButton.setAttribute('aria-pressed',String(paused));rotationButton.setAttribute('aria-label',paused?'Otomatik döndür':'Dönüşü durdur');rotationButton.textContent=paused?'▶':'Ⅱ';}
rotationState();rotationButton.addEventListener('click',()=>{paused=!paused;rotationState();});
reduced.addEventListener('change',()=>{paused=reduced.matches;rotationState();});
playButton.addEventListener('click',async()=>{if(!player.paused){player.pause();return;}try{status.textContent='';await window.characterEntrance?.();await player.play();if(!audioContext){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(AudioCtx){audioContext=new AudioCtx();analyser=audioContext.createAnalyser();analyser.fftSize=256;const source=audioContext.createMediaElementSource(player);source.connect(analyser);analyser.connect(audioContext.destination);bins=new Uint8Array(analyser.frequencyBinCount);}}await audioContext?.resume();}catch{status.textContent='Ses açılamadı. Tekrar deneyebilir veya tanıtımı okuyabilirsin.';setSpeaking(false);}});
player.addEventListener('play',()=>setSpeaking(true));player.addEventListener('pause',()=>setSpeaking(false));player.addEventListener('ended',()=>setSpeaking(false));player.addEventListener('error',()=>{setSpeaking(false);status.textContent='Ses yüklenemedi. Tanıtım metnini aşağıdan okuyabilirsin.';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});
(async()=>{try{
const THREE=await import('./assets/vendor/three.module.min.js');
const {GLTFLoader}=await import('./assets/vendor/GLTFLoader.js');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;view.appendChild(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,1.62,8.2);camera.lookAt(0,1.60,0);
const [gltf,words]=await Promise.all([new GLTFLoader().loadAsync('./assets/omer/omer-character.glb'),fetch('./assets/omer/speech-timing.json').then(r=>{if(!r.ok)throw Error('Speech timing unavailable');return r.json();})]);
const model=gltf.scene;const pivot=new THREE.Group();pivot.add(model);scene.add(pivot);
const joints={};['HipL','HipR','KneeL','KneeR','ShoulderL','ShoulderR','ElbowL','ElbowR','Face'].forEach(n=>{const o=model.getObjectByName(n);if(o)joints[n]={o,q:o.quaternion.clone()};});
const faces=[];model.traverse(o=>{if(o.morphTargetDictionary?.Speech!==undefined){faces.push(o);o.material.emissiveMap=o.material.map;o.material.emissive.setHex(0xffffff);o.material.emissiveIntensity=.45;o.material.roughness=.88;}});
function pose(n,x=0,y=0,z=0){const j=joints[n];if(j)j.o.quaternion.copy(j.q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)));}
scene.add(new THREE.HemisphereLight(0xfff4e7,0x303034,2));
for(const [color,intensity,pos] of [[0xffe5bd,2.5,[-3,5,4]],[0xc3dcff,1,[4,2,3]],[0xffc48b,2,[2,4,-3]]]){const l=new THREE.DirectionalLight(color,intensity);l.position.set(...pos);scene.add(l);}
// A contact pool anchors the character without a distracting set.
const ground=new THREE.Mesh(new THREE.CircleGeometry(.72,64),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.23,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.position.y=.055;scene.add(ground);
let entrance=0,elapsed=0,last=0,visible=true,targetY=0,targetX=0,drag=false,lastX=0,lastY=0,manualUntil=0;
let readyResolve;const entranceReady=new Promise(r=>readyResolve=r);window.characterEntrance=()=>entranceReady;
function resize(){const {width,height}=view.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=Math.max(7.5,4.5/camera.aspect);camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(view);resize();
view.classList.add('model-ready');view.tabIndex=0;view.setAttribute('role','group');view.setAttribute('aria-label','Kameralı tam boy Ömer karakteri. Sürükleyerek veya ok tuşlarıyla 360 derece döndür.');
view.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;view.setPointerCapture(e.pointerId);});
view.addEventListener('pointermove',e=>{if(drag){targetY+=(e.clientX-lastX)*.012;targetX=THREE.MathUtils.clamp(targetX+(e.clientY-lastY)*.004,-.15,.15);lastX=e.clientX;lastY=e.clientY;}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])view.addEventListener(event,()=>{drag=false;manualUntil=performance.now()+3000;});
view.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();targetY+=e.key==='ArrowLeft'?-.3:.3;manualUntil=performance.now()+3000;}});
window.addEventListener('pointermove',e=>{if(drag||e.pointerType==='touch'||performance.now()<manualUntil)return;const r=view.getBoundingClientRect();targetY=THREE.MathUtils.clamp((e.clientX-r.left-r.width/2)/r.width,-1,1)*.35;},{passive:true});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.01}).observe(view);
function mouthAt(t){const w=words.find(w=>t>=w.start&&t<w.start+w.duration);if(!w)return 0;const part=(t-w.start)/w.duration;const letters=Array.from(w.text.toLocaleLowerCase('tr'));const f=part*letters.length;const c=letters[Math.min(letters.length-1,Math.floor(f))];const a='aâe'.includes(c)?1:'ıi'.includes(c)?.4:'oöuü'.includes(c)?.7:'bmp'.includes(c)?0:.2;return a*(.45+.55*Math.sin((f%1)*Math.PI));}
let mouth=0;
function frame(now){requestAnimationFrame(frame);const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(document.hidden||!visible)return;elapsed+=dt;entrance=reduced.matches?3.6:Math.min(3.6,entrance+dt);const u=entrance/3.6;const finish=THREE.MathUtils.smoothstep(u,.78,1);const walk=(1-finish)*(u<1?1:0);const stride=Math.sin(entrance*8.5)*.40*walk;
pivot.position.set(-.50*(1-u),Math.abs(Math.sin(entrance*8.5))*.035*walk,-1.6*(1-u));ground.scale.setScalar(.85+.15*u);
pose('HipL',stride);pose('HipR',-stride);pose('KneeL',Math.max(0,-Math.sin(entrance*8.5))*.65*walk);pose('KneeR',Math.max(0,Math.sin(entrance*8.5))*.65*walk);
if(u===1){readyResolve();if(!paused&&!reduced.matches&&!drag)targetY+=dt*.22;}
const ease=1-Math.exp(-dt*6);pivot.rotation.y+=(targetY-pivot.rotation.y)*ease;
const greeting=!reduced.matches?Math.sin(Math.min(1,Math.max(0,(elapsed-3.2)/3))*Math.PI):0;
pose('ShoulderL',-stride*.5,0,-greeting*.85);pose('ElbowL',-.12-greeting*.4,0,-greeting*.9-Math.sin(elapsed*8)*greeting*.12);
pose('ShoulderR',stride*.4,0,.08);pose('ElbowR',-.12);
const t=player.currentTime;const desiredMouth=speaking?mouthAt(t):0;mouth+=(desiredMouth-mouth)*Math.min(1,dt*20);
for(const f of faces)f.morphTargetInfluences[f.morphTargetDictionary.Speech]=mouth;
pose('Face',speaking?Math.sin(t*2.1)*.025:0,Math.sin(elapsed*.65)*.025,0);
renderer.render(scene,camera);
}requestAnimationFrame(frame);
}catch(error){rotationButton.hidden=true;view.querySelector('.avatar-loading').textContent='3D karakter yüklenemedi. Sayfayı yenileyebilirsin.';status.textContent='Sesli tanıtımı yine dinleyebilirsin.';console.warn('Character unavailable',error);}})();
