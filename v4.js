/* STRYDE V4 — motion direction, opt-in sound, showroom lighting, sizing aid,
   four-chapter cinematic journey, minimal memory/performance footprint. */
(()=>{'use strict';
const $=(q,host=document)=>host.querySelector(q), $$=(q,host=document)=>[...host.querySelectorAll(q)];
const lite=Boolean(window.STRYDE_LOW_POWER),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

// One optional sound engine, silent until explicitly enabled, suspended on page hide.
const soundToggle=$('#sound-toggle');let soundOn=false,audio=null;
function tick(freq=460,duration=.067){if(!soundOn)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.65,audio.currentTime+duration);gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.018,audio.currentTime+.007);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration+.006)}catch{soundOn=false;}}
soundToggle?.addEventListener('click',()=>{soundOn=!soundOn;soundToggle.setAttribute('aria-pressed',String(soundOn));soundToggle.innerHTML=soundOn?'SOUND ON <span>◉</span>':'SOUND OFF <span>◌</span>';if(soundOn)tick(680,.11);else audio?.suspend?.();});
window.addEventListener('pagehide',()=>audio?.suspend?.());
document.addEventListener('click',e=>{if(e.target.closest('button,[role=button],.btn')&&!e.target.closest('#sound-toggle'))tick(380,.045)},{passive:true});

// Four cinematic chapters. Scrolling changes a single DOM scene rather than creating GPU contexts.
const scene=$('#journey'),stage=$('#v4-journey-stage'),image=$('#v4-journey-image'),title=$('#v4-journey-title'),desc=$('#v4-journey-description'),index=$('#v4-chapter-index'),count=$('#v4-journey-counter');
const chapters=[
 {t:'FORM<br/><i>MEETS FUTURE.</i>',d:'Sculpted to move. Every curve begins with a purpose.',transform:'translate(-50%,-50%) rotate(-4deg) scale(1.02)'},
 {t:'A NEW<br/><i>KIND OF ENERGY.</i>',d:'Light travels through the translucent cushioning architecture.',transform:'translate(-50%,-50%) rotate(5deg) scale(1.11)'},
 {t:'BUILT<br/><i>FROM THE INSIDE.</i>',d:'An exploded-view concept reveals the knit, chassis and layered sole.',transform:'translate(-50%,-50%) rotate(-8deg) scale(1.23)'},
 {t:'YOUR NEXT<br/><i>MOVE BEGINS.</i>',d:'Make the original yours. Experiment with colors, finishes and materials.',transform:'translate(-50%,-50%) rotate(0deg) scale(1.00)'}
];
let phase=-1,animFrame=0;
function updateJourney(){animFrame=0;if(!scene||!stage)return;const r=scene.getBoundingClientRect(),distance=Math.max(scene.offsetHeight-innerHeight,1),p=clamp(-r.top/distance,0,1);const next=Math.min(3,Math.floor(p*4));stage.style.setProperty('--progress',p.toFixed(3));scene.dataset.phase=String(next);if(next!==phase){phase=next;const c=chapters[next];title.innerHTML=c.t;desc.textContent=c.d;index.textContent='CHAPTER / 0'+(next+1);count.textContent='0'+(next+1)+' / 04';$$('.v4-journey-progress i').forEach((el,i)=>el.classList.toggle('active',i===next));tick(540+next*80,.04)}
 if(!reduced){const swing=Math.sin(p*Math.PI*4)*4,scale=1+.11*Math.sin(p*Math.PI);image.style.transform=`translate(-50%,-50%) rotate(${swing}deg) scale(${scale})`;image.style.opacity=String(.9+.1*Math.cos(p*8));}}
if(scene){window.addEventListener('scroll',()=>{if(!animFrame)animFrame=requestAnimationFrame(updateJourney)},{passive:true});window.addEventListener('resize',()=>{if(!animFrame)animFrame=requestAnimationFrame(updateJourney)},{passive:true});updateJourney();}

// Lightweight physically-inspired meteor field; spring-damped and cursor-reactive,
// intentionally DOM/CSS based to avoid an extra WebGL renderer on iPhone.
const hero=$('#home');if(hero){const field=document.createElement('div');field.className='v4-hero-boulders';field.setAttribute('aria-hidden','true');for(let i=0;i<4;i++){const b=document.createElement('i');b.className='v4-rock';field.appendChild(b)}hero.prepend(field);
 if(!lite&&!reduced&&matchMedia('(pointer:fine)').matches){const rocks=$$('.v4-rock',field).map((el,i)=>({el,x:0,y:0,vx:0,vy:0,seed:i}));let px=0,py=0,visible=true,raf=0;
 const observer=new IntersectionObserver(entries=>visible=entries[0]?.isIntersecting,{threshold:0});observer.observe(hero);
 hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();px=(e.clientX-r.left-r.width/2)/r.width;py=(e.clientY-r.top-r.height/2)/r.height},{passive:true});
 function step(){raf=0;if(document.hidden)return;if(visible){rocks.forEach((r,i)=>{const drift=Math.sin(performance.now()*.0008+i*2.2)*13,targetX=-px*(19+i*17)+drift,targetY=-py*(10+i*9)+Math.cos(performance.now()*.0007+i)*11;r.vx+=(targetX-r.x)*.045;r.vy+=(targetY-r.y)*.045;r.vx*=.83;r.vy*=.83;r.x+=r.vx;r.y+=r.vy;r.el.style.setProperty('--shift-x',r.x.toFixed(2)+'px');r.el.style.setProperty('--shift-y',r.y.toFixed(2)+'px')})}raf=requestAnimationFrame(step)}raf=requestAnimationFrame(step);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!raf)raf=requestAnimationFrame(step)});
 }}

// Showroom lighting presets persist across visits; no new graphics contexts.
const showroom=$('#showroom-viewport');let light='ember';try{light=localStorage.getItem('stryde-v4-light')||'ember'}catch{}
function changeLight(next){if(!['ember','arctic','gallery'].includes(next))return;light=next;showroom?.setAttribute('data-v4-light',next);$$('[data-v4-light]').forEach(b=>{const active=b.dataset.v4Light===next;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});try{localStorage.setItem('stryde-v4-light',light)}catch{}}
$$('[data-v4-light]').forEach(b=>b.addEventListener('click',()=>changeLight(b.dataset.v4Light)));changeLight(light);

// Size estimate; explicitly not a certified footwear chart.
const modal=$('#v4-size-modal'),input=$('#v4-foot-length'),output=$('#v4-fit-output'),use=$('#v4-fit-use');let recommendation=null,focusBefore=null;
function closeFit(){modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('v4-fit-open');focusBefore?.focus?.({preventScroll:true})}
function openFit(){focusBefore=document.activeElement;modal?.classList.add('open');modal?.setAttribute('aria-hidden','false');document.body.classList.add('v4-fit-open');input?.focus()}
$('#v4-fit-guide')?.addEventListener('click',openFit);$('#v4-size-close')?.addEventListener('click',closeFit);
modal?.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeFit()}if(e.key==='Tab'){const b=[...modal.querySelectorAll('button:not([disabled]),input')];if(b.length){const idx=b.indexOf(document.activeElement);if(e.shiftKey&&idx===0){e.preventDefault();b.at(-1).focus()}else if(!e.shiftKey&&idx===b.length-1){e.preventDefault();b[0].focus()}}}});
input?.addEventListener('input',()=>{const cm=Number(input.value);recommendation=null;if(!Number.isFinite(cm)||cm<22||cm>33){output.textContent='ENTER A VALID LENGTH BETWEEN 22.0 AND 33.0 CM';use.disabled=true;return}
 // Approximate adult unisex shoe length reference; estimate only, conservative rounding.
 const size=clamp(Math.round((cm-22.8)/.84+6),7,12);recommendation=String(size);use.disabled=false;output.innerHTML=`ESTIMATED US SIZE <strong style="font-size:30px;color:#ff6938;margin-left:12px">${size}</strong> <small style="display:block">Estimated from foot length; verify actual sizing before buying.</small>`;
});
use?.addEventListener('click',()=>{if(!recommendation)return;const b=$(`#size-grid [data-size="${recommendation}"]`);if(b){b.click();closeFit();document.querySelector('#customize')?.scrollIntoView({block:'center',behavior:reduced?'instant':'smooth'})}});

// Film sequence: fully keyboard accessible; autoplay animation, no external video.
const film=$('#film-overlay'),filmScene=$('#v4-film-scene'),pause=$('#v4-film-pause');let filmTimer=null,filmIndex=0,paused=false;
const frames=['01 / ORIGIN','02 / THE ELEMENTS','03 / ENGINEERED TO MOVE','04 / THE FUTURE IS YOURS'];
function filmStop(){clearInterval(filmTimer);filmTimer=null;film?.classList.remove('v4-film-active','v4-film-paused');paused=false;filmIndex=0}
function filmStart(){filmStop();film?.classList.add('v4-film-active');if(filmScene)filmScene.textContent=frames[0];filmTimer=setInterval(()=>{if(film?.getAttribute('aria-hidden')==='false'&&!paused){filmIndex=(filmIndex+1)%frames.length;filmScene.textContent=frames[filmIndex];}},3600)}
$('#open-film')?.addEventListener('click',()=>setTimeout(filmStart,100));
$$('#film-overlay [data-close]').forEach(b=>b.addEventListener('click',filmStop));
$('#scrim')?.addEventListener('click',filmStop);document.addEventListener('keydown',e=>{if(e.key==='Escape')filmStop()});
pause?.addEventListener('click',()=>{paused=!paused;film?.classList.toggle('v4-film-paused',paused);pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'▶ RESUME':'Ⅱ PAUSE'});
const filmObs=new MutationObserver(()=>{if(film?.getAttribute('aria-hidden')==='true'&&filmTimer)filmStop()});if(film)filmObs.observe(film,{attributes:true,attributeFilter:['aria-hidden']});

// Keep legacy navigation and product actions discoverable using progressive enhancement.
if(!reduced){$$('.v4-journey-cta,.v4-fit-line button').forEach(e=>e.classList.add('magnetic'))}
})();
