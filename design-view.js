/* STRYDE 3.2 — design-faithful image interaction; separately label experimental 3D. */
(()=>{'use strict';
const root=document.querySelector('#model-overlay'),stage=document.querySelector('#design-shoe-stage'),shoe=document.querySelector('#design-shoe-art');
if(!root||!stage||!shoe)return;
const COLORS={solar:'#ff6938',ice:'#69caff',volt:'#bfff4a',violet:'#bb79fa'};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let color='solar',mode='design',dx=0,dy=0,scale=1,dragging=false,point=null,baseX=0,baseY=0,pointers=new Map(),pinchDistance=0,pinchStart=1;
function paint(){shoe.style.setProperty('--shoe-tilt-x',dx+'deg');shoe.style.setProperty('--shoe-tilt-y',dy+'deg');shoe.style.setProperty('--shoe-scale',scale)}
function setColor(next){if(!(next in COLORS))next='solar';color=next;const url='images/design-'+color+'.webp';const preload=new Image();preload.onload=()=>{if(color===next)shoe.src=url};preload.src=url;
 root.style.setProperty('--design-glow',COLORS[next]);document.querySelectorAll('[data-model-color]').forEach(b=>{const on=b.dataset.modelColor===next;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});window.Stryde3D?.setColor(next)}
function setMode(next){mode=next==='prototype'?'prototype':'design';const isDesign=mode==='design';root.classList.toggle('design-active',isDesign);
 document.querySelector('#view-design-mode').classList.toggle('active',isDesign);document.querySelector('#view-prototype-mode').classList.toggle('active',!isDesign);
 document.querySelector('#view-design-mode').setAttribute('aria-pressed',String(isDesign));document.querySelector('#view-prototype-mode').setAttribute('aria-pressed',String(!isDesign));
 root.querySelector('.model-top span:last-child').innerHTML=isDesign?'<i class="orange-dot"></i> ORIGINAL DESIGN':'<i class="orange-dot"></i> TECHNICAL PROTOTYPE';
 const headline=root.querySelector('.model-guide h2'), description=document.querySelector('#model-view-description'),disclosure=document.querySelector('#design-preview-disclosure'), hint=document.querySelector('#model-interaction-hint');
 if(isDesign){window.Stryde3D?.stop();headline.innerHTML='SEE THE<br/><em>REAL DESIGN.</em>';description.textContent='This interactive preview uses our original sneaker artwork, matching the design you saw on the homepage. For an accurate 360° model, the shoe needs a dedicated 3D reconstruction.';hint.textContent='DRAG TO TILT / PINCH OR SCROLL TO ZOOM';disclosure.textContent='ORIGINAL CONCEPT ART / INTERACTIVE PREVIEW — NOT A 360° 3D SCAN'}
 else{headline.innerHTML='INSIDE<br/><em>THE BUILD.</em>';description.textContent='Inspect the newly sculpted, material-separated sneaker in true 3D. This original concept reconstruction has 24 editable mesh materials; its unseen angles are interpretations rather than exact copies of the artwork.';hint.textContent='DRAG TO ORBIT / PINCH OR SCROLL TO ZOOM';disclosure.textContent='ORIGINAL 3D CONCEPT RECONSTRUCTION / NOT A PHOTOGRAMMETRIC SCAN';window.Stryde3D?.start(document.querySelector('#model-canvas'),color)}
}
function reset(){if(mode==='prototype'){window.Stryde3D?.reset();return}dx=dy=0;scale=1;paint()}
function open(next){resetOnClose();setColor(next);setMode(window.STRYDE_LOW_POWER?'design':'prototype')}
function resetOnClose(){pointers.clear();dragging=false;window.Stryde3D?.stop()}
function pointerDown(e){if(mode!=='design')return;stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){dragging=true;point={x:e.clientX,y:e.clientY};baseX=dx;baseY=dy}if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);pinchStart=scale}}
function pointerMove(e){if(!pointers.has(e.pointerId)||mode!=='design')return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const p=[...pointers.values()];const dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinchDistance)scale=clamp(pinchStart*dist/pinchDistance,0.85,1.65)}else if(dragging&&point){dy=clamp(baseY+(e.clientX-point.x)*.07,-12,12);dx=clamp(baseX-(e.clientY-point.y)*.045,-8,8)}paint()}
function pointerUp(e){pointers.delete(e.pointerId);if(pointers.size===0){dragging=false;point=null}else if(pointers.size===1){point=[...pointers.values()][0];baseX=dx;baseY=dy}}
stage.addEventListener('pointerdown',pointerDown);stage.addEventListener('pointermove',pointerMove);stage.addEventListener('pointerup',pointerUp);stage.addEventListener('pointercancel',pointerUp);stage.addEventListener('lostpointercapture',pointerUp);
stage.addEventListener('wheel',e=>{if(mode!=='design')return;e.preventDefault();scale=clamp(scale+(e.deltaY<0?.08:-.08),.85,1.65);paint()},{passive:false});
document.querySelector('#view-design-mode').addEventListener('click',()=>setMode('design'));document.querySelector('#view-prototype-mode').addEventListener('click',()=>setMode('prototype'));
window.StrydeDesignView={open,setColor,setMode,reset,resetOnClose};paint();
})();