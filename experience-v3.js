(function experienceV3(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const lite=Boolean(window.STRYDE_LOW_POWER);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const showroom=$("#showroom-viewport"),fallback=$(".showroom-fallback");
const hues={solar:"#ff6938",ice:"#69caff",volt:"#bfff4a",violet:"#bb79fa"};
const colorFilter={solar:"",ice:"hue-rotate(164deg) saturate(1.12)",volt:"hue-rotate(76deg) saturate(1.45)",violet:"hue-rotate(248deg) saturate(1.2)"};
function setColor(color){
 if(!Object.hasOwn(hues,color))return;
 $$("[data-showroom-color]").forEach(b=>{let active=b.dataset.showroomColor===color;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 showroom?.style.setProperty("--showroom-tint",hues[color]);
 if(fallback)fallback.style.filter=colorFilter[color]+" drop-shadow(0 25px 34px #000)";
 const swatch=$(`#color-swatches button[data-color="${color}"]`);
 if(swatch)swatch.click();else window.StrydeGLB?.setStyle({accent:color});
}
$$("[data-showroom-color]").forEach(b=>b.addEventListener("click",()=>setColor(b.dataset.showroomColor)));
const camNames={hero:"01 — THREE QUARTER",front:"02 — SIDE PROFILE",top:"03 — TOP DOWN",heel:"04 — REAR VIEW"};
$$("[data-camera]").forEach(b=>b.addEventListener("click",()=>{
 const name=b.dataset.camera;
 $$("[data-camera]").forEach(x=>{const active=x===b;x.classList.toggle("active",active);x.setAttribute("aria-pressed",String(active))});
 $("#showroom-camera-label").textContent=camNames[name];
 window.StrydeGLB?.showroomPreset(name);
 if(!showroom?.classList.contains("glb-loaded")&&fallback)fallback.style.transform=`rotate(${name==="top"?0:name==="front"?-5:-10}deg) scale(${name==="heel"?.85:1})`;
}));

// Damped spring particles on the hero canvas with pointer forces and collision response.
const canvas=$("#physics-canvas"),ctx=canvas?.getContext("2d",{alpha:true});
if(ctx){
 let enabled=!reduced&&!lite,visible=true,frameId=0,prev=0,w=0,h=0,dpr=1,particles=[];
 const pointer={x:-9999,y:-9999,active:false};
 function seed(){particles=Array.from({length:innerWidth<700?28:55},(_,i)=>{
  const x=(.17+(i*.61803398%1)*.7)*w,y=(.15+(i*.438579%1)*.68)*h;
  return{x,y,homeX:x,homeY:y,vx:0,vy:0,r:i%7===0?4.5:i%3===0?2.6:1.4,depth:.4+(i%11)/11,phase:i*2.4};
 })}
 function resize(){const b=canvas.getBoundingClientRect();if(!b.width||!b.height)return;w=b.width;h=b.height;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);seed();draw(0)}
 function draw(t){ctx.clearRect(0,0,w,h);for(let i=0;i<particles.length;i++){
  const p=particles[i];
  for(let j=i+1;j<particles.length;j++){const q=particles[j],dx=p.x-q.x,dy=p.y-q.y,d2=dx*dx+dy*dy;if(d2<16900){ctx.strokeStyle=`rgba(255,130,89,${(1-Math.sqrt(d2)/130)*.085})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}
  const pulse=.56+.36*Math.sin(t*.0013+p.phase);
  ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
  ctx.fillStyle=i%5===0?`rgba(255,125,70,${.65*pulse})`:`rgba(207,219,232,${.40*pulse})`;ctx.fill();
  if(p.r>4){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,17);g.addColorStop(0,"rgba(255,105,56,.27)");g.addColorStop(1,"rgba(255,105,56,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,17,0,Math.PI*2);ctx.fill()}
 }}
 function tick(t){frameId=0;if(!enabled||!visible||document.hidden)return;
  const dt=clamp((t-prev||16)/16,.45,2);prev=t;
  for(const p of particles){
   p.vx+=(p.homeX-p.x)*.007*dt;p.vy+=(p.homeY-p.y)*.007*dt+.010*dt;
   if(pointer.active){const dx=p.x-pointer.x,dy=p.y-pointer.y,r=Math.hypot(dx,dy)||1;if(r<210){const f=(1-r/210)*2.65*p.depth*dt;p.vx+=dx/r*f;p.vy+=dy/r*f}}
   p.vx*=Math.pow(.977,dt);p.vy*=Math.pow(.977,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.x<p.r){p.x=p.r;p.vx=Math.abs(p.vx)*.76}if(p.x>w-p.r){p.x=w-p.r;p.vx=-Math.abs(p.vx)*.76}
   if(p.y<p.r){p.y=p.r;p.vy=Math.abs(p.vy)*.76}if(p.y>h-p.r){p.y=h-p.r;p.vy=-Math.abs(p.vy)*.76}
  }draw(t);frameId=requestAnimationFrame(tick);
 }
 const observer=new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible&&enabled&&!frameId){prev=0;frameId=requestAnimationFrame(tick)}},{threshold:0});
 observer.observe(canvas);
 $("#home").addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;pointer.active=true},{passive:true});
 $("#home").addEventListener("pointerleave",()=>pointer.active=false,{passive:true});
 if(lite){const b=$("#physics-toggle");b?.setAttribute("aria-pressed","false");if(b)b.textContent="◎ PHYSICS PAUSED — TAP TO ENABLE"}
 $("#physics-toggle")?.addEventListener("click",()=>{
  enabled=!enabled;const b=$("#physics-toggle");b.setAttribute("aria-pressed",String(enabled));b.textContent=enabled?"◉ LIVE PARTICLE PHYSICS":"◎ PHYSICS PAUSED";
  if(enabled){prev=0;frameId=requestAnimationFrame(tick)}else if(frameId){cancelAnimationFrame(frameId);frameId=0}
 });
 window.addEventListener("resize",resize,{passive:true});resize();if(enabled)frameId=requestAnimationFrame(tick);
}

// Three interactive engineering illustrations. Percentages are simulated, never measured.
const lab=$("#lab-canvas"),g=lab?.getContext("2d");
if(g){
 const panel=$("#lab-panel"),slider=$("#lab-slider"),label=$("#lab-slider-label"),metricLabel=$("#lab-metric-label"),metricValue=$("#lab-metric-value"),modeLabel=$("#lab-mode-label");
 const defs={impact:["01 / IMPACT RESPONSE","LANDING FORCE","IMPACT INPUT"],airflow:["02 / ENGINEERED AIRFLOW","AIRFLOW SPEED","AIR VELOCITY"],grip:["03 / TRACTION FIELD","SURFACE SLIPPERYNESS","GRIP INDEX"]};
 let mode="impact",value=55,clock=0,w=0,h=0,visible=false,raf=0;
 const rand=i=>Math.abs((Math.sin(i*127.18+26.7)*43758.5453)%1);
 const particles=Array.from({length:65},(_,i)=>({a:rand(i),b:rand(i+91)}));
 const line=(x,y,X,Y,color,thick=1)=>{g.strokeStyle=color;g.lineWidth=thick;g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.stroke()};
 const print=(s,x,y,size=10,color="#bfccd3")=>{g.font=`700 ${size}px DM Sans,sans-serif`;g.fillStyle=color;g.fillText(s,x,y)};
 function size(){let r=lab.getBoundingClientRect();w=r.width;h=r.height;let d=Math.min(devicePixelRatio||1,1.5);lab.width=Math.round(w*d);lab.height=Math.round(h*d);g.setTransform(d,0,0,d,0,0);paint()}
 function impact(){
  const x=w*.48,y=h*.49,load=Math.max(0,Math.sin(clock*.003*2.8))*value/100,Y=y+load*33;
  g.fillStyle="#ff69381a";g.beginPath();g.ellipse(x,y+54,160,17,0,0,Math.PI*2);g.fill();
  for(let i=0;i<3;i++){const yy=Y+i*23,gf=g.createLinearGradient(x-160,yy,x+160,yy);gf.addColorStop(0,"#4a555e");gf.addColorStop(.5,i===1?"#ff7047":"#d9e4e6");gf.addColorStop(1,"#46525d");g.strokeStyle=gf;g.lineWidth=i===1?12:8;g.beginPath();g.moveTo(x-137,yy);g.bezierCurveTo(x-72,yy-12+load*4,x+55,yy+9-load*5,x+133,yy);g.stroke()}
  for(let i=0;i<17;i++){let xx=x-117+i*14.6,l=1-load*.42;line(xx,Y+22-8*l,xx+6,Y+22+14*l,"#f6b092b7",1.5)}
  g.fillStyle=`rgba(255,105,56,${.25+value/100*.38})`;g.fillRect(x-140,Y+79,280,3);
  line(x+145,Y-20,x+187,Y-20,"#ff6938");print("UPPER PLATE",x+193,Y-17,9);print("FOAM RESPONSE",x+193,Y+32,9,"#ff956e");print("CONTACT SURFACE",x+193,Y+83,9);
  if(w>550){print("ENERGY RETURN / ILLUSTRATIVE",26,h*.56,10,"#7d8e9b");print("SPRING OSCILLATION "+value+"%",26,h*.61)}
 }
 function airflow(){
  const x=w*.49,y=h*.49,s=.3+value/100*1.7;
  g.strokeStyle="#d8dfe493";g.lineWidth=18;g.beginPath();g.moveTo(x-150,y+42);g.quadraticCurveTo(x,y-28,x+145,y+21);g.stroke();
  g.strokeStyle="#75caff";g.lineWidth=2;
  for(let j=-2;j<=2;j++){g.beginPath();for(let i=0;i<=48;i++){let xx=x-185+i*8,yy=y+j*19+Math.sin(i*.22+j+clock*.002)*14;if(i===0)g.moveTo(xx,yy);else g.lineTo(xx,yy)}g.stroke()}
  for(const p of particles){const xx=x-180+((p.a*360+clock*.065*s*(.5+p.b))%360),yy=y+(p.b-.5)*110+Math.sin(clock*.0016+p.a*10)*10;g.beginPath();g.arc(xx,yy,1.5+p.a*2,0,Math.PI*2);g.fillStyle=p.a>.5?"#69caff":"#c4f0ff";g.fill()}
  print("DIRECTIONAL AIR CHANNELS",x-135,y+116,10,"#8bb9d4")
 }
 function grip(){
  const x=w*.47,y=h*.49,slip=value/100;
  for(let i=-5;i<6;i++)line(x-152,y+i*18,x+155,y+i*18,"#6f7f892a");
  for(let i=0;i<9;i++){let xx=x-130+i*34;g.save();g.translate(xx,y);g.rotate(Math.sin(i*3)*.28);g.fillStyle=i%2===0?"#c5d6dc":"#ff6938";g.fillRect(-13,-24,26,48);g.restore()}
  for(let i=0;i<14;i++){let xx=x-160+((i*28+clock*.042*slip)%330),yy=y-53+Math.sin(i*2.1)*15;line(xx,yy,xx+22*slip,yy,"#ff8755",1.8)}
  print("TRACTION CONTACT GRID",x-130,y+89,10,"#a6bbc6")
 }
 function paint(){if(!w||!h)return;g.clearRect(0,0,w,h);if(mode==="impact")impact();else if(mode==="airflow")airflow();else grip()}
 function tick(t){raf=0;if(!visible||document.hidden)return;clock=t;paint();if(!reduced&&!lite)raf=requestAnimationFrame(tick)}
 const metric=()=>metricValue.textContent=(mode==="grip"?100-value:value)+"%";
 function select(name){
  if(!defs[name])return;mode=name;
  [modeLabel.textContent,label.textContent,metricLabel.textContent]=defs[name];
  panel.setAttribute("aria-labelledby","lab-tab-"+name);
  $$("[data-lab]").forEach(b=>{const on=b.dataset.lab===name;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));b.tabIndex=on?0:-1});
  metric();paint()
 }
 $$("[data-lab]").forEach(b=>b.addEventListener("click",()=>{select(b.dataset.lab);window.StrydeGLB?.setTechFocus(b.dataset.lab==="impact"?"cushion":b.dataset.lab==="airflow"?"upper":"traction");window.StrydeGLB?.setExplode(.65)}));
 $(".lab-menu")?.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();const buttons=$$("[data-lab]");let i=buttons.findIndex(x=>x.dataset.lab===mode);i=(i+(["ArrowRight","ArrowDown"].includes(e.key)?1:-1)+buttons.length)%buttons.length;buttons[i].focus();buttons[i].click()});
 slider.addEventListener("input",()=>{value=Number(slider.value);metric();paint()});
 $("#lab-replay").addEventListener("click",()=>{clock=0;value=55;slider.value="55";metric();paint()});
 new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(tick);else if(!visible&&raf){cancelAnimationFrame(raf);raf=0}},{threshold:0}).observe(lab);
 window.addEventListener("resize",size,{passive:true});size();select("impact");
}

// Cinematic same-page transitions keep native anchors, URL hashes and reduced-motion behavior.
const curtain=$("#scene-transition");let transitioning=false;
const titles={home:"MOVE BEYOND.",collection:"THE DROP.",showroom:"ENTER THE VOID.",technology:"BUILT DIFFERENT.",customize:"YOUR MOVE.",story:"OUR WORLD.","newsletter-form":"THE SIGNAL."};
if(curtain)document.addEventListener("click",e=>{
 const a=e.target.closest("a[href^='#']");
 if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||transitioning)return;
 const hash=a.getAttribute("href");if(!hash||hash==="#")return;
 const node=document.getElementById(hash.slice(1));if(!node)return;
 e.preventDefault();
 if(reduced||lite){node.scrollIntoView({block:"start"});history.replaceState(null,"",hash);return}
 transitioning=true;$("#transition-title").textContent=titles[node.id]||"KEEP MOVING.";curtain.classList.add("is-entering");
 setTimeout(()=>{node.scrollIntoView({block:"start",behavior:"instant"});history.replaceState(null,"",hash);curtain.classList.remove("is-entering");curtain.classList.add("is-leaving")},440);
 setTimeout(()=>{curtain.classList.remove("is-leaving");transitioning=false},910);
},false);

// Cursor lighting, magnetic CTAs and responsive card spotlights.
if(!reduced&&!lite&&matchMedia("(hover:hover) and (pointer:fine)").matches){
 const halo=$("#cursor-halo");let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my;
 function chase(){cx+=(mx-cx)*.11;cy+=(my-cy)*.11;if(halo){halo.style.left=cx+"px";halo.style.top=cy+"px"}requestAnimationFrame(chase)}
 window.addEventListener("pointermove",e=>{mx=e.clientX;my=e.clientY},{passive:true});requestAnimationFrame(chase);
 $$(".magnetic").forEach(el=>{el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect(),dx=(e.clientX-(r.left+r.width/2))*.16,dy=(e.clientY-(r.top+r.height/2))*.16;el.style.transform=`translate3d(${dx}px,${dy}px,0)`});el.addEventListener("pointerleave",()=>el.style.transform="")});
 function spotlights(){$$(".product-card,.editorial-card").forEach(el=>{if(el.dataset.spotlightReady)return;el.dataset.spotlightReady="true";el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect();el.style.setProperty("--mx",`${e.clientX-r.left}px`);el.style.setProperty("--my",`${e.clientY-r.top}px`)})})}
 spotlights();const grid=$("#product-grid");if(grid)new MutationObserver(spotlights).observe(grid,{childList:true});
}
})();