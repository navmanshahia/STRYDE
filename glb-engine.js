/* STRYDE DIGITAL ATELIER v2. A true glTF 2.0 / GLB mesh renderer.
   15 independently authored PBR model parts, WebGL2 shading, real material controls,
   orbit, pinch/scroll zoom and scroll-synchronised product choreography. No build/CDN required. */
(()=>{'use strict';
const asset='models/aerodyne-one.glb',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const H={solar:'#ff6938',ice:'#69caff',volt:'#bfff4a',violet:'#bb79fa'};
const style={accent:'solar',upper:'ivory',laces:'frost',sole:'carbon',finish:'reflective'};
const upperColors={ivory:'#e1e5e5',slate:'#888f9a',obsidian:'#272e39',lunar:'#c7cccf'};
const laceColors={frost:'#eef0eb',ink:'#171f29',flare:'#ff6938'};
const soleColors={carbon:'#1a202b',graphite:'#575d68',ice:'#c9d9df'};
const hueToRGB=hex=>{const n=parseInt(hex.replace('#',''),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
const programVS=`#version 300 es
precision highp float;
layout(location=0)in vec3 aPosition;
layout(location=1)in vec3 aNormal;
uniform float uYaw,uPitch,uZoom,uAspect,uScale,uHover,uExplode;
uniform vec3 uPartOffset;
out vec3 vN,vPos;
void main(){
vec3 p=aPosition+uPartOffset*uExplode;
p.y-=.25;p.y+=uHover;
float cy=cos(uYaw),sy=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);
p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
p=vec3(p.x,cp*p.y-sp*p.z,sp*p.y+cp*p.z);
vec3 n=vec3(cy*aNormal.x+sy*aNormal.z,aNormal.y,-sy*aNormal.x+cy*aNormal.z);
n=vec3(n.x,cp*n.y-sp*n.z,sp*n.y+cp*n.z);
float depth=7.6+uZoom;p.z-=depth;
vN=normalize(n);vPos=p;
float focal=(uAspect<1.0?1.62:2.35)*uScale;
gl_Position=vec4(p.x*focal/uAspect,p.y*focal,-1.002*p.z-.2,-p.z);
}`;
const programFS=`#version 300 es
precision highp float;
in vec3 vN,vPos;out vec4 outColor;
uniform vec3 uBase,uEmissive;uniform float uMetal,uRough,uTime,uKnit;
const float PI=3.14159265;
void main(){
vec3 N=normalize(vN),V=normalize(-vPos),L=normalize(vec3(.35,.75,1.5)),H=normalize(L+V);
float ndv=max(dot(N,V),.001),ndl=max(dot(N,L),.001),ndh=max(dot(N,H),.001),vdh=max(dot(V,H),.001);
float r=max(.055,uRough*uRough),a2=r*r;
float den=max(.0002,(ndh*ndh*(a2-1.)+1.));float D=a2/(PI*den*den);
float k=pow(uRough+1.,2.)/8.;float G=(ndv/(ndv*(1.-k)+k))*(ndl/(ndl*(1.-k)+k));
vec3 F0=mix(vec3(.042),uBase,uMetal),F=F0+(1.-F0)*pow(1.-vdh,5.);
vec3 spec=(D*G*F)/max(4.*ndv*ndl,.0001);
vec3 diffuse=(1.-F)*(1.-uMetal)*uBase/PI;
vec3 color=(diffuse+spec)*ndl*vec3(2.2,2.0,1.85);
vec3 secondary=normalize(vec3(-1.2,.35,-.45));color+=uBase*(.11+.24*max(0.,dot(N,secondary)))*(1.-uMetal*.55);
float rim=pow(1.-ndv,3.);color+=rim*vec3(.12,.17,.20);
float micro=uKnit>0.5?(.98+.025*sin(vPos.x*225.)*sin(vPos.z*230.)):1.;
color=color*micro+uEmissive*(.67+.08*sin(uTime*2.4));
color=mix(color,vec3(.026,.032,.043),clamp((-vPos.z-6.)/28.,0.,.16));
color=color/(color+vec3(.87));color=pow(max(color,vec3(0.)),vec3(1./2.2));
outColor=vec4(color,1.);
}`;
const vertexGetter=(gl,data,index)=>{let a=data.accessors[index],v=data.bufferViews[a.bufferView];const size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes={5126:4,5125:4,5123:2,5121:1}[a.componentType];if(!size||!bytes)throw Error('Unsupported glTF accessor');const len=a.count*size,base=v.byteOffset||0,off=base+(a.byteOffset||0);const type=a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:a.componentType===5123?Uint16Array:Uint8Array;let raw;if(v.byteStride&&v.byteStride!==size*bytes){raw=new type(len);const dv=new DataView(data.binary);for(let i=0;i<a.count;i++)for(let j=0;j<size;j++){const at=off+i*v.byteStride+j*bytes;raw[i*size+j]=a.componentType===5126?dv.getFloat32(at,true):a.componentType===5125?dv.getUint32(at,true):a.componentType===5123?dv.getUint16(at,true):dv.getUint8(at)}}else raw=new type(data.binary.slice(off,off+len*bytes));return {values:raw,component:a.componentType,count:a.count}};
let glbPromise;
async function loadGLB(){if(glbPromise)return glbPromise;glbPromise=(async()=>{
 const response=await fetch(asset,{cache:'force-cache'});if(!response.ok)throw Error('GLB HTTP '+response.status);
 const bin=await response.arrayBuffer(),view=new DataView(bin);if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2)throw Error('Invalid GLB header');
 let offset=12,json,binary;while(offset<bin.byteLength){const len=view.getUint32(offset,true),kind=view.getUint32(offset+4,true);offset+=8;const chunk=bin.slice(offset,offset+len);offset+=len;if(kind===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(chunk));if(kind===0x004e4942)binary=chunk}
 if(!json||!binary)throw Error('Missing GLB mesh buffers');return {json,binary};
})().catch(e=>{glbPromise=null;throw e});return glbPromise}
const all=new Map();let spin=0,scrollListening=false,manualTech=false,focusGroup='all';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lite=true; // webGL technical prototypes activate only when requested, preserving the faithful art as defaultlet liteActiveMode=null;
function compile(gl,t,code){const s=gl.createShader(t);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function makeProgram(gl){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,programVS));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,programFS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
function partOffset(name){if(/outsole|tread/i.test(name))return [0,-.78,0];if(/midsole|air_unit/i.test(name))return [0,-.32,0];if(/lace|tongue/i.test(name))return [0,.54,.0];if(/liner/i.test(name))return [0,.45,0];if(/cage|stitch|detail|perf|accent/i.test(name))return [0,.25,0];return [0,.18,0]}
function activeMaterial(name,original){let base=original.pbrMetallicRoughness?.baseColorFactor?.slice(0,3)||[.7,.7,.7];let emissive=original.emissiveFactor||[0,0,0];let metallic=original.pbrMetallicRoughness?.metallicFactor||0,rough=original.pbrMetallicRoughness?.roughnessFactor||.65;
 if(name==='Upper_Knit'){base=hueToRGB(upperColors[style.upper]);rough=style.upper==='obsidian'?.86:.92}
 if(name==='Tongue'&&style.upper==='obsidian')base=hueToRGB('#48515c');
 if(name==='Laces')base=hueToRGB(laceColors[style.laces]);
 if(name==='Outsole_Rubber'||name==='Tread')base=hueToRGB(soleColors[style.sole]);
 if(name==='Midsole_Foam'&&style.sole==='ice')base=hueToRGB('#ebf4fa');
 if(name==='Midsole_Silver'&&style.sole==='graphite')base=hueToRGB('#555c67');
 if(name==='Accent_Emissive'){base=hueToRGB(H[style.accent]);emissive=base.map(v=>v*.65)}
 if(name==='Air_Unit'){base=hueToRGB(H[style.accent]).map(v=>v*.40+.11)}
 if(style.finish==='matte'&&(/metal|carbon|accent|silver/i.test(name)))rough=Math.max(rough,.82),metallic*=.25;
 return {base,emissive,metallic,rough}
}
class Viewer{
 constructor(canvas,mode){this.canvas=canvas;this.mode=mode;this.ready=false;this.dead=false;this.active=true;this.yaw=mode==='hero'?.48:mode==='tech'?.22:mode==='showroom'?.65:.36;this.pitch=mode==='hero'?-.16:-.15;this.zoom=0;this.ty=this.yaw;this.tp=this.pitch;this.tz=0;this.explode=0;this.explodeTarget=0;this.scroll=0;this.lastPointer={x:0,y:0};this.pointerDown=false;this.raf=0;this.drawn=0;this.gpuBuffers=[];this.gpuArrays=[];
   this.onDown=e=>{this.pointerDown=true;this.startX=e.clientX;this.startY=e.clientY;canvas.setPointerCapture(e.pointerId)};
   this.onMove=e=>{if(!this.pointerDown)return;this.ty+=(e.clientX-this.startX)*.008;this.tp=clamp(this.tp+(e.clientY-this.startY)*.006,-.9,.65);this.startX=e.clientX;this.startY=e.clientY;this.schedule()};
   this.onUp=()=>{this.pointerDown=false};this.onWheel=e=>{e.preventDefault();this.tz=clamp(this.tz+Math.sign(e.deltaY)*.45,-2.7,5);this.schedule()};
   canvas.addEventListener('pointerdown',this.onDown);canvas.addEventListener('pointermove',this.onMove);canvas.addEventListener('pointerup',this.onUp);canvas.addEventListener('pointercancel',this.onUp);
   canvas.addEventListener('wheel',this.onWheel,{passive:false});canvas.tabIndex=0;
   canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')this.reset();else if(e.key==='ArrowLeft')this.ty-=.2;else if(e.key==='ArrowRight')this.ty+=.2;else if(e.key==='ArrowUp')this.tp=clamp(this.tp-.15,-.8,.6);else if(e.key==='ArrowDown')this.tp=clamp(this.tp+.15,-.8,.6);else if(e.key==='+')this.tz=clamp(this.tz-.5,-2.7,5);else if(e.key==='-')this.tz=clamp(this.tz+.5,-2.7,5);this.schedule()}});
   this.io=new IntersectionObserver(e=>{this.visible=e[0].isIntersecting;if(this.visible)this.schedule()},{threshold:0});this.io.observe(canvas);
 }
 async init(){let gl=this.canvas.getContext('webgl2',{alpha:true,antialias:!lite,powerPreference:lite?'low-power':'high-performance',preserveDrawingBuffer:false});if(!gl)throw Error('WebGL2 unavailable');this.gl=gl;
   const data=await loadGLB();if(this.dead)return;this.data=data;this.program=makeProgram(gl);this.uniform={};['uYaw','uPitch','uZoom','uAspect','uScale','uHover','uExplode','uPartOffset','uBase','uEmissive','uMetal','uRough','uTime','uKnit'].forEach(k=>this.uniform[k]=gl.getUniformLocation(this.program,k));
   this.drawables=[];for(const mesh of data.json.meshes){for(const primitive of mesh.primitives){const name=mesh.name;const p=vertexGetter(gl,data,primitive.attributes.POSITION),n=vertexGetter(gl,data,primitive.attributes.NORMAL),ind=vertexGetter(gl,data,primitive.indices);
     const vao=gl.createVertexArray();this.gpuArrays.push(vao);gl.bindVertexArray(vao);for(const [i,array] of [[0,p],[1,n]]){const vbo=gl.createBuffer();this.gpuBuffers.push(vbo);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,array.values,gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,0,0)}
     const ebo=gl.createBuffer();this.gpuBuffers.push(ebo);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ebo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ind.values,gl.STATIC_DRAW);gl.bindVertexArray(null);
     this.drawables.push({vao,indexCount:ind.count,indexType:ind.component===5125?gl.UNSIGNED_INT:ind.component===5123?gl.UNSIGNED_SHORT:gl.UNSIGNED_BYTE,name,offset:partOffset(name),material:data.json.materials[primitive.material]})}}
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);this.ready=true;
   const host=this.canvas.parentElement;host?.classList.add('glb-loaded');this.canvas.setAttribute('data-model-ready','true');this.schedule();
 }
 schedule(){if(this.dead||!this.ready||!this.active||!this.visible||document.hidden||this.raf)return;this.raf=requestAnimationFrame(t=>this.draw(t))}
 draw(t){this.raf=0;if(this.dead||!this.active||!this.visible||document.hidden)return;const gl=this.gl,w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;
   const dpr=lite?Math.min(devicePixelRatio||1,.85):Math.min(devicePixelRatio||1,innerWidth<750?1.2:1.6);const cw=Math.round(w*dpr),ch=Math.round(h*dpr);if(cw!==this.canvas.width||ch!==this.canvas.height){this.canvas.width=cw;this.canvas.height=ch;gl.viewport(0,0,cw,ch)}
   const smooth=reduced?1:.095;this.yaw+=(this.ty-this.yaw)*smooth;this.pitch+=(this.tp-this.pitch)*smooth;this.zoom+=(this.tz-this.zoom)*smooth;this.explode+=(this.explodeTarget-this.explode)*(reduced?1:.09);
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
   const U=this.uniform,un1=(k,v)=>gl.uniform1f(U[k],v);un1('uYaw',this.yaw);un1('uPitch',this.pitch);un1('uZoom',this.zoom);un1('uAspect',w/h);
   un1('uScale',this.mode==='hero'?1.15:this.mode==='tech'?1.10:this.mode==='overlay'?1.22:this.mode==='showroom'?1.35:1.02);
   un1('uHover',reduced||lite?0:Math.sin(t*.0011)*.045);un1('uExplode',this.explode);un1('uTime',t*.001);
   for(const part of this.drawables){const m=activeMaterial(part.name,part.material);if(this.mode==='tech'&&focusGroup!=='all'){let match=focusGroup==='upper'?/upper|knit|lace|tongue|liner|stitch|perf/i.test(part.name):focusGroup==='cushion'?/midsole|air_unit|foam|silver/i.test(part.name):/outsole|tread/i.test(part.name);if(!match){m.base=m.base.map(x=>x*.17);m.emissive=[0,0,0]}else{m.emissive=m.emissive.map(x=>x*2.0)}}gl.uniform3fv(U.uBase,m.base);gl.uniform3fv(U.uEmissive,m.emissive);un1('uMetal',m.metallic);un1('uRough',m.rough);un1('uKnit',part.name==='Upper_Knit'?1:0);gl.uniform3fv(U.uPartOffset,part.offset);gl.bindVertexArray(part.vao);gl.drawElements(gl.TRIANGLES,part.indexCount,part.indexType,0)}gl.bindVertexArray(null);
   if((!reduced&&!lite)||Math.abs(this.ty-this.yaw)+Math.abs(this.tp-this.pitch)+Math.abs(this.tz-this.zoom)+Math.abs(this.explodeTarget-this.explode)>.006)this.schedule();
 }
 reset(){this.ty=this.mode==='tech'?.22:.48;this.tp=-.15;this.tz=0;this.explodeTarget=0;this.schedule()}
 deactivate(){this.active=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0}
 activate(){this.active=true;this.visible=true;this.schedule()}
 dispose(){if(this.dead)return;this.deactivate();this.dead=true;this.io?.disconnect();this.canvas.parentElement?.classList.remove('glb-loaded');this.canvas.removeAttribute('data-model-ready');
   this.canvas.removeEventListener('pointerdown',this.onDown);this.canvas.removeEventListener('pointermove',this.onMove);this.canvas.removeEventListener('pointerup',this.onUp);this.canvas.removeEventListener('pointercancel',this.onUp);this.canvas.removeEventListener('wheel',this.onWheel);
   if(this.gl){for(const b of this.gpuBuffers)this.gl.deleteBuffer(b);for(const v of this.gpuArrays)this.gl.deleteVertexArray(v);if(this.program)this.gl.deleteProgram(this.program);this.gl.getExtension('WEBGL_lose_context')?.loseContext()}
 }
}
async function create(canvas,mode){if(!canvas)return;
 if(lite){for(const [key,old] of all){if(key!==mode){old.dispose();all.delete(key)}}liteActiveMode=mode}
 const existing=all.get(mode);if(existing&&!existing.dead){existing.activate();return existing}
 let view=new Viewer(canvas,mode);all.set(mode,view);
 try{await view.init();if(view.dead)return view;
   view.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();view.deactivate();view.dead=true;view.canvas.parentElement?.classList.remove('glb-loaded');all.delete(mode);if(lite)updateButtons()}, {once:true});
 }catch(err){console.warn('STRYDE high-detail GLB unavailable; keeping image fallback:',err.message);view.dispose();all.delete(mode);if(mode==='overlay'&&!lite)window.Stryde3DFallback?.start(canvas,style.accent)}
 if(lite)updateButtons();return view}
function updateButtons(){document.querySelectorAll('[data-activate-3d]').forEach(button=>{
 const active=button.dataset.activate3d===liteActiveMode&&Boolean(all.get(liteActiveMode)?.ready);
 button.innerHTML=active?'◉ 3D ACTIVE <span>↗</span>':'◈ VIEW 3D PROTOTYPE <span>↗</span>';
 button.setAttribute('aria-pressed',String(active));});}
function releaseMode(mode){const view=all.get(mode);if(view){view.dispose();all.delete(mode)}if(lite&&liteActiveMode===mode)liteActiveMode=null;if(lite)updateButtons()}
function setStyle(options){Object.keys(style).forEach(k=>{if(options[k]!==undefined)style[k]=options[k]});for(const view of all.values())view.schedule()}
function reset(mode){all.get(mode)?.reset()}
function setExplode(value){manualTech=true;let v=all.get('tech');if(v){v.explodeTarget=typeof value==='number'?clamp(value,0,1):(value?1:0);v.schedule()}}
function setTechFocus(part){focusGroup=['all','upper','cushion','traction'].includes(part)?part:'all';all.get('tech')?.schedule()}
function resetTechScroll(){manualTech=false;all.get('tech')?.schedule()}
function showroomPreset(which){const v=all.get('showroom');if(!v)return;const preset={hero:[.65,-.19,0],front:[1.62,-.13,.35],top:[.4,-1.0,1.05],heel:[3.25,-.13,.5]}[which]||[.65,-.19,0];v.ty=preset[0];v.tp=preset[1];v.tz=preset[2];v.schedule()}
function applyScroll(){if(reduced)return;const hero=all.get('hero');if(hero){const p=clamp(scrollY/Math.max(innerHeight*.95,1),0,1);if(!hero.pointerDown){hero.ty=.48-p*.67;hero.tp=-.16+p*.13;hero.tz=p*.95;hero.schedule()}}
 const tech=all.get('tech'),node=document.querySelector('#technology');if(tech&&node){const rect=node.getBoundingClientRect(),p=clamp((innerHeight-rect.top)/(innerHeight+rect.height*.6),0,1);if(!tech.pointerDown){tech.ty=.20+p*.34;tech.tp=-.15+p*.16}if(!manualTech&&!document.querySelector('#tech-visual')?.classList.contains('exploded'))tech.explodeTarget=Math.sin(Math.PI*p)*.82;tech.schedule()}}
let frame=0;function onScroll(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;applyScroll()})}
function scrollSetup(){if(scrollListening)return;scrollListening=true;window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll,{passive:true});if(window.ScrollTrigger&&window.gsap){try{ScrollTrigger.create({trigger:'#technology',start:'top bottom',end:'bottom top',scrub:true,onUpdate:onScroll})}catch{}}setTimeout(applyScroll,180)}
function init(){
 if(lite){
   document.querySelectorAll('[data-activate-3d]').forEach(button=>button.addEventListener('click',()=>{
     const mode=button.dataset.activate3d,canvas=document.querySelector(mode==='showroom'?'#showroom-model':'#custom-model');
     if(liteActiveMode===mode&&all.get(mode)?.ready){releaseMode(mode);return}
     button.disabled=true;button.textContent='LOADING 3D…';
     create(canvas,mode).finally(()=>{button.disabled=false;updateButtons()});
   }));
   document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const name of [...all.keys()])releaseMode(name)}});
   window.addEventListener('pagehide',()=>{for(const name of [...all.keys()])releaseMode(name)});
   scrollSetup();return;
 }
 document.querySelectorAll('[data-activate-3d]').forEach(b=>b.hidden=true);
 create(document.querySelector('#hero-model'), 'hero');create(document.querySelector('#custom-model'),'studio');create(document.querySelector('#tech-model'),'tech');const shoe=document.querySelector('#showroom-model');if(shoe){const io=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){io.disconnect();create(shoe,'showroom')}},{rootMargin:'400px'});io.observe(shoe)}scrollSetup()}
window.Stryde3DFallback=window.Stryde3D;
window.StrydeGLB={style,setStyle,reset,setExplode,setTechFocus,resetTechScroll,showroomPreset,loaded:()=>!!all.get('studio')?.ready,showroomLoaded:()=>!!all.get('showroom')?.ready};
window.Stryde3D={
 start(canvas,color){style.accent=color||style.accent;const old=all.get('overlay');if(old){old.activate();old.schedule();return}create(canvas,'overlay')},
 stop(){if(lite)releaseMode('overlay');else all.get('overlay')?.deactivate();window.Stryde3DFallback?.stop()},
 setColor(color){setStyle({accent:color})},reset(){reset('overlay');},
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();