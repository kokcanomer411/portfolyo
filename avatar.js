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
const response=await fetch('./assets/omer/head-model.json');if(!response.ok)throw new Error('Model unavailable');const data=await response.json();
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;view.appendChild(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,0,8.3);camera.lookAt(0,0,0);
const head=new THREE.Group();scene.add(head);
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));geometry.setIndex(data.indices);geometry.computeVertexNormals();
const texture=await new THREE.TextureLoader().loadAsync('./assets/omer/head-stylized.png');texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
const face=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,roughness:.93,metalness:0,side:THREE.DoubleSide}));head.add(face);
const backGeo=new THREE.BufferGeometry();backGeo.setAttribute('position',new THREE.Float32BufferAttribute(data.backPositions,3));backGeo.setAttribute('color',new THREE.Float32BufferAttribute(data.backColors,3));backGeo.setIndex(data.backIndices);backGeo.computeVertexNormals();head.add(new THREE.Mesh(backGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide})));
scene.add(new THREE.AmbientLight(0xffffff,1.75));const key=new THREE.DirectionalLight(0xfff3df,.9);key.position.set(-3,4,6);scene.add(key);const fill=new THREE.DirectionalLight(0xc8d7ff,.45);fill.position.set(4,0,3);scene.add(fill);
const base=Float32Array.from(data.positions),position=geometry.attributes.position;
let targetY=0,targetX=0,drag=false,lastX=0,lastY=0,manualUntil=0,time=0,last=0,visible=true;
function resize(){const {width,height}=view.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(view);resize();
view.classList.add('model-ready');
view.tabIndex=0;view.setAttribute('role','group');view.setAttribute('aria-label','Ömer’in üç boyutlu portresi. Sürükleyerek veya ok tuşlarıyla döndür.');
view.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;view.setPointerCapture(e.pointerId);manualUntil=Infinity;});
view.addEventListener('pointermove',e=>{if(!drag)return;targetY=THREE.MathUtils.clamp(targetY+(e.clientX-lastX)*.007,-1.1,1.1);targetX=THREE.MathUtils.clamp(targetX+(e.clientY-lastY)*.004,-.25,.25);lastX=e.clientX;lastY=e.clientY;});
function endDrag(){drag=false;manualUntil=performance.now()+3500;}view.addEventListener('pointerup',endDrag);view.addEventListener('pointercancel',endDrag);view.addEventListener('lostpointercapture',endDrag);
view.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();targetY=THREE.MathUtils.clamp(targetY+(e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0),-1.1,1.1);targetX=THREE.MathUtils.clamp(targetX+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0),-.25,.25);manualUntil=performance.now()+5000;}});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.01}).observe(view);
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden||!visible)return;if(!paused&&!reduced.matches){time+=dt;if(now>manualUntil){targetY=Math.sin(time*.52)*.25;targetX=Math.sin(time*.37)*.04;}}
head.rotation.y+=(targetY-head.rotation.y)*.09;head.rotation.x+=(targetX-head.rotation.x)*.09;head.position.y=!paused&&!reduced.matches?Math.sin(time*.9)*.025:0;
let energy=0;if(speaking&&analyser){analyser.getByteFrequencyData(bins);for(let i=2;i<45;i++)energy+=bins[i];energy=Math.min(1,energy/(43*95));}level+=(energy-level)*.3;
if(!reduced.matches){for(let i=0;i<data.jawWeights.length;i++){position.array[i*3+1]=base[i*3+1]-data.jawWeights[i]*level*.045;position.array[i*3+2]=base[i*3+2]+data.jawWeights[i]*level*.009;}position.needsUpdate=true;}
renderer.render(scene,camera);}
requestAnimationFrame(frame);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();view.classList.remove('model-ready');document.querySelector('#avatar-hint').textContent='Ömer · Görsel hikâyeler';});
}catch(error){rotationButton.hidden=true;document.querySelector('#avatar-hint').textContent='Ömer · Görsel hikâyeler';console.warn('3D portrait unavailable:',error);}})();
