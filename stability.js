/* STRYDE 3.2.1 - critical-content and 360 prototype controls */
(()=>{'use strict';
const $=s=>document.querySelector(s);
document.querySelectorAll('[data-counter]').forEach(el=>{el.textContent=el.dataset.counter||el.textContent});
for(const sel of ['.shoe-scene','.custom-preview','#showroom-viewport','#tech-visual']){const el=$(sel);if(el&&!el.querySelector('canvas[data-model-ready]'))el.classList.remove('glb-loaded')}
for(const el of document.querySelectorAll('.reveal'))el.classList.add('is-visible');
const reset=$('#reset-view');if(reset)reset.title='Reset concept artwork tilt';
const modal=$('#model-overlay'),switcher=$('.model-view-switch');
if(modal&&switcher){
 const controls=document.createElement('div');controls.className='model-orbit-tools';controls.setAttribute('role','group');controls.setAttribute('aria-label','3D prototype rotation controls');
 controls.innerHTML='<button type="button" data-orbit="-45" aria-label="Rotate shoe 45 degrees left">↶ 45°</button><button type="button" data-orbit="45" aria-label="Rotate shoe 45 degrees right">45° ↷</button><button type="button" data-orbit="360" aria-pressed="false" id="orbit-360">⟳ FULL 360°</button><span class="model-angle">3D PROTOTYPE ONLY</span>';
 switcher.insertAdjacentElement('afterend',controls);
 let frame=0,start=0,last=0,spinning=false;
 function stop(){spinning=false;cancelAnimationFrame(frame);frame=0;const b=$('#orbit-360');if(b){b.textContent='⟳ FULL 360°';b.setAttribute('aria-pressed','false')}}
 controls.querySelectorAll('[data-orbit]').forEach(b=>b.addEventListener('click',()=>{
  if(modal.classList.contains('design-active'))return;
  if(b.dataset.orbit!=='360'){stop();window.StrydeGLB?.orbitOverlay(Number(b.dataset.orbit));return}
  if(spinning){stop();return}
  spinning=true;start=0;last=0;b.textContent='Ⅱ STOP SPIN';b.setAttribute('aria-pressed','true');
  function spin(t){if(!spinning)return;if(!start)start=t;if(!last)last=t;const dt=Math.min(50,t-last);last=t;
   if(t-start>6200||modal.getAttribute('aria-hidden')==='true'||modal.classList.contains('design-active')){stop();return}
   window.StrydeGLB?.orbitOverlay(360*dt/5600);frame=requestAnimationFrame(spin)}
  frame=requestAnimationFrame(spin);
 }));
 $('#view-design-mode')?.addEventListener('click',stop);modal.querySelector('[data-close]')?.addEventListener('click',stop);
}
for(const [key,title] of [['showroom','Load 3D concept model for genuine 360 degree rotation; differs from product artwork'],['studio','Activate 3D concept model to rotate 360 degrees. Product art remains default']]){
 const el=$('[data-activate-3d="'+key+'"]');if(el)el.title=title
}
const version=document.createElement('span');version.className='build-version';version.textContent='STRYDE 3.2.1';document.body.appendChild(version);
})();