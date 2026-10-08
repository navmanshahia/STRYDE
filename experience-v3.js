/* STRYDE / V3. Physics-driven field, showroom navigation, interactive engineering lab and transitions.
 * Runs without dependencies, persists no customer information, honours reduced motion. */
(()=>{'use strict';
const $=(selector,root=document)=>root.querySelector(selector), $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const lite=Boolean(window.STRYDE_LOW_POWER);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));

// SHOWROOM: All four variants share one concept silhouette; each changes real PBR materials in GLB.
const showroom=$('#showroom-viewport'), fallback=$('.showroom-fallback');
const filters={solar:'',ice:'hue-rotate(164deg) saturate(1.12)',volt:'hue-rotate(76deg) saturate(1.45)',violet:'hue-rotate(248deg) saturate(1.2)'};
const hues={solar:'#ff6938',ice:'#69caff',volt:'#bfff4a',violet:'#bb79fa'};
function setShowroomColor(color){
 if(!Object.hasOwn(hues,color))return;
 $$('[data-showroom-color]').forEach(b=>{const active=b.dataset.showroomColor===color;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 showroom?.style.setProperty('--showroom-tint',hues[color]);
 if(fallback)fallback.style.filter=`${filters[color]} drop-shadow(0 25px 34px #000)`;
 const customizer=$(`#color-swatches button[data-color="${color}"]`);
 if(customizer)customizer.click();else window.StrydeGLB?.setStyle({accent:color});
}
$$('[data-showroom-color]').forEach(b=>b.addEventListener('click',()=>setShowroomColor(b.dataset.showroomColor)));
const cameraNames={hero:'01 — THREE QUARTER',front:'02 — SIDE PROFILE',top:'03 — TOP DOWN',heel:'04 — REAR VIEW'};
$$('[data-camera]').forEach(b=>b.addEventListener('click',()=>{
 const name=b.dataset.camera;$$('[data-camera]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});
 $('#showroom-camera-label').textContent=cameraNames[name];window.StrydeGLB?.showroomPreset(name);
 if(!showroom?.classList.contains('glb-loaded'))fallback.style.transform=`rotate(${name==='top'?0:name==='front'?-5:-10}deg) scale(${name==='heel'?.85:1})`;
}));

// HERO KINETICS: Verlet-like damped spring particles plus pointer repulsion, collisions and gravity.
// This is a real-time 2D physical particle field behind an interactive 3D sneaker, not 3D rigid-body simulation.
const physicsCanvas=$('#physics-canvas'),ctx=physicsCanvas?.getContext('2d',{alpha:true});
if(ctx){
 let enabled=!reduced&&!lite,visible=true,raf=0,prev=0,w=0,h=0,dpr=1;
 const pointer={x:-9999,y:-9999,active:false};
 let particles=[];
 function seed(){particles=Array.from({length:innerWidth<700?28:55},(_,i)=>{
  const x=(.17+(i*0.61803398%1)*.7)*w,y=(.15+(i*.438579%1)*.68)*h;
  const size=i%7===0?4.5:i%3===0?2.6:1.4;
  return {x,y,homeX:x,homeY:y,vx:0,vy:0,r:size,depth:.4+(i%11)/11,phase:i*2.4};
 })}
 function resize(){const b=physicsCanvas.getBoundingClientRect();if(!b.width||!b.height)return;w=b.width;h=b.height;dpr=Math.min(devicePixelRatio||1,1.5);physicsCanvas.width=Math.round(w*dpr);physicsCanvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);seed();draw(0)}
 function draw(t){ctx.clearRect(0,0,w,h);const palette=[255,105,56];for(let i=0;i<particles.length;i++){
  const p=particles[i];for(let j=i+1;j<particles.length;j++){
   const q=particles[j],dx=p.x-q.x,dy=p.y-q.y,d2=dx*dx+dy*dy;
   if(d2<130*130){ctx.strokeStyle=`rgba(255,130,89,${(1-Math.sqrt(d2)/130)*.085})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}
  }
  const pulse=.56+.36*Math.sin(t*.0013+p.phase);
  ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=i%5===0?`rgba(255,125,70,${.65*pulse})`:`rgba(207,219,232,${.40*pulse})`;ctx.fill();
  if(p.r>4){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,17);g.addColorStop(0,'rgba(255,105,56,.27)');g.addColorStop(1,'rgba(255,105,56,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,17,0,Math.PI*2);ctx.fill()}
 }}
 function frame(t){raf=0;if(!enabled||!visible||document.hidden)return;
  const dt=clamp((t-prev||16)/16,0.45,2);prev=t;
  particles.forEach((p,i)=>{
   const spring=.006+(i%4)*.0015;
   p.vx+=(p.homeX-p.x)*spring*dt;
   p.vy+=(p.homeY-p.y)*spring*dt+.010*dt;
   if(pointer.active){const dx=p.x-pointer.x,dy=p.y-pointer.y,r=Math.hypot(dx,dy)||1;
    if(r<210){const force=(1-r/210)*2.65*p.depth*dt;p.vx+=dx/r*force;p.vy+=dy/r*force}}
   p.vx*=Math.pow(.977,dt);p.vy*=Math.pow(.977,dt);
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.x<p.r){p.x=p.r;p.vx=Math.abs(p.vx)*.76}if(p.x>w-p.r){p.x=w-p.r;p.vx=-Math.abs(p.vx)*.76}
   if(p.y<p.r){p.y=p.r;p.vy=Math.abs(p.vy)*.76}if(p.y>h-p.r){p.y=h-p.r;p.vy=-Math.abs(p.vy)*.76}
  });draw(t);raf=requestAnimationFrame(frame)
 }
 const observer=new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible&&enabled&&!raf){prev=0;raf=requestAnimationFrame(frame)}},{threshold:0});observer.observe(physicsCanvas);
 $('#home').addEventListener('pointermove',e=>{const rect=physicsCanvas.getBoundingClientRect();pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;pointer.active=true},{passive:true});
 $('#home').addEventListener('pointerleave',()=>{pointer.active=false},{passive:true});
 const button=$('#physics-toggle');if(lite&&button){button.setAttribute('aria-pressed','false');button.textContent='◎ PHYSICS PAUSED — TAP TO ENABLE'}button?.addEventListener('click',()=>{enabled=!enabled;button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'◉ LIVE PARTICLE PHYSICS':'◎ PHYSICS PAUSED';if(enabled){prev=0;raf=requestAnimationFrame(frame)}else if(raf){cancelAnimationFrame(raf);raf=0}});
 window.addEventListener('resize',resize,{passive:true});resize();if(enabled)raf=requestAnimationFrame(frame);
}

// MOTION LAB: illustrative animated designs with user-defined parameters.
const labCanvas=$('#lab-canvas'),labCtx=labCanvas?.getContext('2d');
if(labCtx){
 const panel=$('#lab-panel'),slider=$('#lab-slider'),label=$('#lab-slider-label'),metricLabel=$('#lab-metric-label'),metricValue=$('#lab-metric-value'),modeLabel=$('#lab-mode-label');
 const config={impact:{title:'01 / IMPACT RESPONSE',label:'LANDING FORCE',metric:'IMPACT INPUT',unit:'%'},airflow:{title:'02 / ENGINEERED AIRFLOW',label:'AIRFLOW SPEED',metric:'AIR VELOCITY',unit:'%'},grip:{title:'03 / TRACTION FIELD',label:'SURFACE SLIPPERYNESS',metric:'GRIP INDEX',unit:'%'}};
 let mode='impact',value=55,clock=0,running=false,frameId=0,width=0,height=0,visible=false;
 const rnd=i=>(Math.sin(i*127.18+26.7)*43758.5453)%1;
 const points=Array.from({length:65},(_,i)=>({seed:Math.abs(rnd(i)),seed2:Math.abs(rnd(i+91))}));
 function size(){const box=labCanvas.getBoundingClientRect();width=box.width;height=box.height;const d=Math.min(devicePixelRatio||1,1.5);labCanvas.width=Math.round(width*d);labCanvas.height=Math.round(height*d);labCtx.setTransform(d,0,0,d,0,0);paint()}
 function gridText(s,x,y,size=11,color='#d4e0e6'){labCtx.font=`700 ${size}px 'DM Sans',sans-serif`;labCtx.fillStyle=color;labCtx.fillText(s,x,y)}
 function line(x1,y1,x2,y2,color,weight=1){labCtx.strokeStyle=color;labCtx.lineWidth=weight;labCtx.beginPath();labCtx.moveTo(x1,y1);labCtx.lineTo(x2,y2);labCtx.stroke()}
 function impact(){const cx=width*.49,cy=height*.49,v=value/100;const impulse=Math.sin(clock*.003*2.8);const load=(Math.max(0,impulse)*v);const layerY=cy+load*33;
   labCtx.fillStyle='#ff69381a';labCtx.beginPath();labCtx.ellipse(cx,cy+54,160,17,0,0,Math.PI*2);labCtx.fill();
   for(let i=0;i<3;i++){const y=layerY+i*23;const g=labCtx.createLinearGradient(cx-160,y,cx+160,y);g.addColorStop(0,'#4a555e');g.addColorStop(.5,i===1?'#ff7047':'#d9e4e6');g.addColorStop(1,'#46525d');labCtx.strokeStyle=g;labCtx.lineWidth=i===1?12:8;labCtx.beginPath();labCtx.moveTo(cx-137,y);labCtx.bezierCurveTo(cx-72,y-12+load*4,cx+55,y+9-load*5,cx+133,y);labCtx.stroke()}
   for(let i=0;i<17;i++){const x=cx-117+i*14.6,y=layerY+22;const stretch=(1-load*.42);line(x,y-8*stretch,x+6,y+14*stretch,'#f6b092b7',1.5)}
   const shadowAlpha=.25+v*.38;labCtx.fillStyle=`rgba(255,105,56,${shadowAlpha})`;labCtx.fillRect(cx-140,layerY+79,280,3);
   line(cx+145,layerY-20,cx+187,layerY-20,'#ff6938');gridText('UPPER PLATE',cx+193,layerY-17,9,'#b5c1c9');gridText('FOAM RESPONSE',cx+193,layerY+32,9,'#ff956e');gridText('CONTACT SURFACE',cx+193,layerY+83,9,'#b5c1c9');
   if(width>550){gridText('ENERGY RETURN / ILLUSTRATIVE',26,height*.56,10,'#7d8e9b');gridText('SPRING OSCILLATION '+Math.round(v*100)+'%',26,height*.61,10)}
 }
 function airflow(){const cx=width*.49,cy=height*.49,speed=.3+value/100*1.7;
  labCtx.strokeStyle='#d8dfe493';labCtx.lineWidth=18;labCtx.beginPath();labCtx.moveTo(cx-150,cy+42);labCtx.quadraticCurveTo(cx,cy-28,cx+145,cy+21);labCtx.stroke();
  labCtx.lineWidth=2;labCtx.strokeStyle='#75caff';for(let j=-2;j<=2;j++){labCtx.beginPath();for(let i=0;i<=48;i++){const x=cx-185+i*8,y=cy+j*19+Math.sin(i*.22+j+clock*.002)*14;if(i===0)labCtx.moveTo(x,y);else labCtx.lineTo(x,y)}labCtx.stroke()}
  for(let i=0;i<points.length;i++){const p=points[i];const x=cx-180+((p.seed*360+clock*.065*speed*(.5+p.seed2))%360),y=cy+(p.seed2-.5)*110+Math.sin(clock*.0016+p.seed*10)*10;labCtx.beginPath();labCtx.arc(x,y,1.5+p.seed*2,0,Math.PI*2);labCtx.fillStyle=p.seed>.5?'#69caff':'#c4f0ff';labCtx.fill()}
  gridText('DIRECTIONAL AIR CHANNELS',cx-135,cy+116,10,'#8bb9d4');
 }
 function grip(){const cx=width*.47,cy=height*.49,slip=value/100;
  for(let i=-5;i<6;i++){const y=cy+i*18;line(cx-152,y,cx+155,y,'#6f7f892a')}
  for(let i=0;i<9;i++){const x=cx-130+i*34;labCtx.save();labCtx.translate(x,cy);labCtx.rotate(Math.sin(i*3)*.28);labCtx.fillStyle=i%2===0?'#c5d6dc':'#ff6938';labCtx.fillRect(-13,-24,26,48);labCtx.restore()}
  for(let i=0;i<14;i++){const advance=clock*.042*slip;const x=cx-160+((i*28+advance)%330),y=cy-53+Math.sin(i*2.1)*15;line(x,y,x+22*slip,y,'#ff8755',1.8)}
  gridText('TRACTION CONTACT GRID',cx-130,cy+89,10,'#a6bbc6');
 }
 function paint(){if(!width||!height)return;labCtx.clearRect(0,0,width,height);labCtx.save();if(mode==='impact')impact();else if(mode==='airflow')airflow();else grip();labCtx.restore()}
 function render(t){frameId=0;if(!visible||document.hidden)return;clock=t;paint();if(!reduced&&!lite)frameId=requestAnimationFrame(render)}
 function updateMetric(){metricValue.textContent=mode==='grip'?`${100-value}%`:`${value}%`}
 function select(name){if(!config[name])return;mode=name;const def=config[mode];modeLabel.textContent=def.title;label.textContent=def.label;metricLabel.textContent=def.metric;panel.setAttribute('aria-labelledby','lab-tab-'+name);
  $$('[data-lab]').forEach(b=>{const active=b.dataset.lab===name;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});updateMetric();paint()}
 $$('[data-lab]').forEach(b=>b.addEventListener('click',()=>{select(b.dataset.lab);const part=b.dataset.lab==='impact'?'cushion':b.dataset.lab==='airflow'?'upper':'traction';window.StrydeGLB?.setTechFocus(part);window.StrydeGLB?.setExplode(.65)}));
 $('.lab-menu')?.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const buttons=$$('[data-lab]');let i=buttons.findIndex(x=>x.dataset.lab===mode);i=(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+buttons.length)%buttons.length;buttons[i].focus();buttons[i].click()});
 slider.addEventListener('input',()=>{value=Number(slider.value);updateMetric();paint()});
 $('#lab-replay').addEventListener('click',()=>{clock=0;value=55;slider.value='55';updateMetric();paint()});
 const obs=new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible&&!frameId){frameId=requestAnimationFrame(render)}else if(!visible&&frameId){cancelAnimationFrame(frameId);frameId=0}},{threshold:0});obs.observe(labCanvas);
 window.addEventListener('resize',size,{passive:true});size();select('impact');
}

// CINEMATIC PAGE TRANSITIONS. Hash links remain real links and work without JavaScript.
const curtain=$('#scene-transition');let transitioning=false;
const names={home:'MOVE BEYOND.',collection:'THE DROP.',showroom:'ENTER THE VOID.',technology:'BUILT DIFFERENT.',customize:'YOUR MOVE.',story:'OUR WORLD.',"newsletter-form":'THE SIGNAL.'};
if(curtain){
 document.addEventListener('click',e=>{
  const link=e.target.closest('a[href^="#"]');if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||transitioning)return;
  const hash=link.getAttribute('href');if(!hash||hash==='#')return;const node=document.getElementById(hash.slice(1));if(!node)return;
  if(reduced||lite){e.preventDefault();node.scrollIntoView({block:'start'});history.replaceState(null,'',hash);return}
  e.preventDefault();transitioning=true;$('#transition-title').textContent=names[node.id]||'KEEP MOVING.';
  curtain.classList.add('is-entering');
  setTimeout(()=>{node.scrollIntoView({block:'start',behavior:'instant'});history.replaceState(null,'',hash);curtain.classList.remove('is-entering');curtain.classList.add('is-leaving')},440);
  setTimeout(()=>{curtain.classList.remove('is-leaving');transitioning=false},910);
 },false);
}

// LUXURY MICRO INTERACTIONS: pointer spotlight and magnetic links; disabled for coarse pointers.
if(!reduced&&!lite&&matchMedia('(hover:hover) and (pointer:fine)').matches){
 const halo=$('#cursor-halo');let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my,raf=0;
 function step(){cx+=(mx-cx)*.11;cy+=(my-cy)*.11;if(halo){halo.style.left=cx+'px';halo.style.top=cy+'px'}raf=requestAnimationFrame(step)}
 window.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY},{passive:true});raf=requestAnimationFrame(step);
 $$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),dx=(e.clientX-(r.left+r.width/2))*.16,dy=(e.clientY-(r.top+r.height/2))*.16;el.style.transform=`translate3d(${dx}px,${dy}px,0)`});el.addEventListener('pointerleave',()=>el.style.transform='')});
 function bindSpotlights(){ $$('.product-card,.editorial-card').forEach(el=>{if(el.dataset.spotlightReady)return;el.dataset.spotlightReady='true';el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',`${e.clientX-r.left}px`);el.style.setProperty('--my',`${e.clientY-r.top}px`)})})}
 bindSpotlights();const parent=$('#product-grid');if(parent){new MutationObserver(bindSpotlights).observe(parent,{childList:true})}
}
})();
