/* STRYDE V3.2 — design-accurate image viewer; technical 3D prototype explicitly separate. */
(()=>{'use strict';
const root=document.querySelector('#model-overlay'),stage=document.querySelector('#design-shoe-stage'),shoe=document.querySelector('#design-shoe-art');
if(!root||!stage||!shoe)return;
const colors={solar:['#ff6938','none'],ice:['#69caff','hue-rotate(160deg)'],volt:['#bfff4a','hue-rotate(66deg)'],violet:['#bb79fa','hue-rotate(242deg)']};
let color='solar',mode='design',x=0,y=0,zoom=1,origin=null,startX=0,startY=0,pointers=new Map(),pinch=0,pinchZoom=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function paint(){shoe.style.setProperty('--shoe-tilt-x',x+'deg');shoe.style.setProperty('--shoe-tilt-y',y+'deg');shoe.style.setProperty('--shoe-scale',zoom)}
function setColor(c){if(!colors[c])c='solar';color=c;root.style.setProperty('--design-glow',colors[c][0]);shoe.style.setProperty('--design-filter',colors[c][1]);document.querySelectorAll('[data-model-color]').forEach(b=>{const on=b.dataset.modelColor===c;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});window.Stryde3D?.setColor(c)}
function setMode(next){mode=next==='prototype'?'prototype':'design';const d=mode==='design';root.classList.toggle('design-active',d);for(const [id,on] of [['#view-design-mode',d],['#view-prototype-mode',!d]]){const b=document.querySelector(id);b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))}
const h=root.querySelector('.model-guide h2'),p=document.querySelector('#model-view-description'),hint=document.querySelector('#model-interaction-hint'),truth=document.querySelector('#design-preview-disclosure');
root.querySelector('.model-top span:last-child').innerHTML=d?'<i class="orange-dot"></i> ORIGINAL DESIGN':'<i class="orange-dot"></i> TECHNICAL PROTOTYPE';
if(d){window.Stryde3D?.stop();h.innerHTML='SEE THE<br/><em>REAL DESIGN.</em>';p.textContent='Explore the original STRYDE concept artwork. The technical 3D study differs from the final design.';hint.textContent='DRAG TO TILT / PINCH OR SCROLL TO ZOOM';truth.textContent='ORIGINAL CONCEPT ART / TILT PREVIEW — NOT A 360° 3D SCAN'}
else{h.innerHTML='INSIDE<br/><em>THE BUILD.</em>';p.textContent='Early technical 3D prototype. This mesh is not an exact replica of the detailed sneaker artwork.';hint.textContent='DRAG TO ORBIT / SCROLL TO ZOOM';truth.textContent='SIMPLIFIED ENGINEERING MODEL — NOT THE FINAL STRYDE SHOE';window.Stryde3D?.start(document.querySelector('#model-canvas'),color)}
}
function reset(){if(mode==='prototype'){window.Stryde3D?.reset();return}x=0;y=0;zoom=1;paint()}
function open(c){resetOnClose();setColor(c);reset();setMode('design')}
function resetOnClose(){pointers.clear();origin=null;window.Stryde3D?.stop()}
stage.addEventListener('pointerdown',e=>{if(mode!=='design')return;stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){origin={x:e.clientX,y:e.clientY};startX=x;startY=y}if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);pinchZoom=zoom}});
stage.addEventListener('pointermove',e=>{if(mode!=='design'||!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const p=[...pointers.values()];const dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch)zoom=clamp(pinchZoom*dist/pinch,.85,1.65)}else if(origin){y=clamp(startY+(e.clientX-origin.x)*.07,-12,12);x=clamp(startX-(e.clientY-origin.y)*.05,-8,8)}paint()});
for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,e=>{pointers.delete(e.pointerId);if(pointers.size===1){origin=[...pointers.values()][0];startX=x;startY=y}else if(!pointers.size){origin=null}});
stage.addEventListener('wheel',e=>{if(mode!=='design')return;e.preventDefault();zoom=clamp(zoom+(e.deltaY<0?.08:-.08),.85,1.65);paint()},{passive:false});
document.querySelector('#view-design-mode').addEventListener('click',()=>setMode('design'));
document.querySelector('#view-prototype-mode').addEventListener('click',()=>setMode('prototype'));
window.StrydeDesignView={open,setColor,setMode,reset,resetOnClose};paint();
})();