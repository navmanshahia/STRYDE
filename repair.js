/* STRYDE V3.2.3 interactive reliability repair */
(()=>{'use strict';
const art=document.querySelector('#design-shoe-art');
if(art){const fallback='images/aerodyne-one.png';let tried=false;
 const fail=()=>{if(tried)return;tried=true;art.src=fallback;const msg=document.querySelector('#design-preview-disclosure');if(msg)msg.textContent='ORIGINAL STRYDE ARTWORK / TILT PREVIEW — 360° ROTATION REQUIRES THE SEPARATE PROTOTYPE';};
 art.addEventListener('error',fail);
 if(art.complete&&!art.naturalWidth)fail();
}
const source=document.querySelector('#view-3d');if(source){source.textContent='◈ OPEN THE SNEAKER DESIGN ↗';source.title='Open design-matched image preview (not a 360-degree 3D scan)';}
const explode=document.querySelector('#explode-button');const detail=document.querySelector('#engineering-details');
if(explode&&detail){explode.setAttribute('aria-controls','engineering-details');explode.setAttribute('aria-expanded','false');explode.addEventListener('click',()=>{
 const opening=detail.hidden;detail.hidden=!opening;explode.setAttribute('aria-expanded',String(opening));
 explode.innerHTML=opening?'REASSEMBLE / CLOSE THE DETAILS <span>↗</span>':'EXPLORE THE ENGINEERING <span>↗</span>';
 if(opening)requestAnimationFrame(()=>detail.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'nearest'}));
 });}
const links=[...document.querySelectorAll('a[href^="#"]')];for(const a of links){const id=a.getAttribute('href')?.slice(1);if(!id||!document.getElementById(id))continue;a.addEventListener('click',()=>{setTimeout(()=>{const target=document.getElementById(id);if(target&&getComputedStyle(target).display!=='none')target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});},25)},false)}
})();
