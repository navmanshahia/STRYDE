/* STRYDE FIELD SCAN — genuine procedural sneaker geometry rendered with native WebGL2.
   No external 3D libraries, 3D models, accounts, or CDN dependencies. Concept schematic only. */
(()=>{'use strict';
const PALETTE={solar:[1,.42,.18],ice:[.35,.76,1],volt:[.72,1,.22],violet:[.67,.42,1]};
let scene=null;
const norm=v=>{let l=Math.hypot(...v)||1;return v.map(x=>x/l)}, sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function buildGeometry(){const out=[];let triangles=0;
 const push=(a,nA,b,nB,c,nC,m)=>{for(const [v,n] of [[a,nA],[b,nB],[c,nC]])out.push(...v,...n,m);triangles++};
 function ellipseVolume(profiles,mat,rings=28,steps=7){const points=[];
  for(let k=0;k<profiles.length-1;k++)for(let s=0;s<steps;s++){let u=s/steps, a=profiles[k],b=profiles[k+1],t=u*u*(3-2*u);points.push(a.map((v,j)=>v*(1-t)+b[j]*t))}
  points.push(profiles.at(-1));
  function at(p,a){const [x,cy,w,h]=p;return [x,cy+Math.cos(a)*h,Math.sin(a)*w]}
  function normal(p,a){return norm([0,Math.cos(a)/Math.max(.06,p[3]),Math.sin(a)/Math.max(.06,p[2])])}
  for(let i=0;i<points.length-1;i++)for(let j=0;j<rings;j++){let a=j*2*Math.PI/rings,b=(j+1)*2*Math.PI/rings;let p1=at(points[i],a),p2=at(points[i+1],a),p3=at(points[i+1],b),p4=at(points[i],b),n1=normal(points[i],a),n2=normal(points[i+1],a),n3=normal(points[i+1],b),n4=normal(points[i],b);push(p1,n1,p2,n2,p3,n3,mat);push(p1,n1,p3,n3,p4,n4,mat)}
 }
 function tube(points,r,mat,sides=8){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],d=norm(sub(b,a)),other=Math.abs(d[1])>.85?[0,0,1]:[0,1,0];let u=norm(cross(d,other)),v=norm(cross(d,u));const p=(center,theta)=>center.map((c,k)=>c+r*(Math.cos(theta)*u[k]+Math.sin(theta)*v[k]));const n=t=>u.map((x,k)=>Math.cos(t)*x+Math.sin(t)*v[k]);for(let j=0;j<sides;j++){const aa=2*Math.PI*j/sides,bb=2*Math.PI*(j+1)/sides;push(p(a,aa),n(aa),p(b,aa),n(aa),p(b,bb),n(bb),mat);push(p(a,aa),n(aa),p(b,bb),n(bb),p(a,bb),n(bb),mat)}}}
 function bubble(cx,cy,cz,rx,ry,rz,mat){let profiles=[];for(let i=0;i<=12;i++){let x=-1+2*i/12;let circular=Math.sqrt(Math.max(.004,1-x*x));profiles.push([cx+x*rx,cy,rz*circular,ry*circular])} // centered at z via a separate builder below
  // custom ellipsoid with shifted Z center
  for(let i=0;i<12;i++)for(let j=0;j<16;j++){const pos=(ii,jj)=>{let a=-Math.PI/2+Math.PI*ii/12,b=2*Math.PI*jj/16;return [cx+rx*Math.sin(a),cy+ry*Math.cos(a)*Math.cos(b),cz+rz*Math.cos(a)*Math.sin(b)]};const normal=p=>norm([(p[0]-cx)/rx,(p[1]-cy)/ry,(p[2]-cz)/rz]);let a=pos(i,j),b=pos(i+1,j),c=pos(i+1,j+1),d=pos(i,j+1);push(a,normal(a),b,normal(b),c,normal(c),mat);push(a,normal(a),c,normal(c),d,normal(d),mat)}
 }
 // Midsoles, sculpted runner upper, heel collar and tongue.
 ellipseVolume([[-2.30,-.13,.08,.05],[-2.04,-.13,.48,.14],[-1.68,-.11,.65,.21],[-.96,-.10,.69,.20],[0,-.09,.66,.15],[.90,-.06,.58,.15],[1.64,-.03,.42,.13],[2.07,-.03,.20,.09],[2.29,-.03,.025,.02]],1);
 ellipseVolume([[-2.27,.11,.10,.05],[-1.97,.11,.44,.12],[-1.6,.11,.60,.15],[-.85,.10,.64,.14],[0,.09,.61,.12],[.96,.09,.53,.12],[1.68,.07,.35,.10],[2.2,.06,.025,.01]],5);
 ellipseVolume([[-2.06,.33,.07,.10],[-1.82,.45,.40,.41],[-1.39,.51,.49,.55],[-.92,.53,.54,.52],[-.23,.47,.57,.39],[.40,.36,.55,.30],[1.05,.28,.43,.25],[1.65,.20,.26,.17],[2.04,.16,.035,.025]],0);
 // Dark collar peeks through top of shoe, plus tonal toe bumper.
 bubble(-1.43,.98,0,.47,.19,.36,2);
 bubble(-1.63,.49,0,.28,.35,.45,2);
 bubble(1.53,.20,0,.60,.20,.33,5);
 // Skeletal side cage + contrasting flowing curves on both sides.
 for(const side of [-1,1]){
 tube([[-1.93,.42,side*.39],[-1.6,.53,side*.54],[-1.25,.64,side*.57],[-.62,.63,side*.58],[.13,.44,side*.59],[.83,.31,side*.49],[1.57,.22,side*.29]],.075,2,10);
 tube([[-1.91,.45,side*.40],[-1.44,.59,side*.565],[-.89,.58,side*.60],[-.15,.42,side*.61],[.63,.30,side*.53]],.028,5,7);
 tube([[-1.87,.16,side*.47],[-1.25,.18,side*.65],[-.35,.16,side*.70],[.50,.13,side*.63],[1.28,.09,side*.49],[1.81,.06,side*.30]],.048,3,8);
 for(const x of [-1.75,-.92,.28,1.26])bubble(x,-.025,side*(x>1?.32:.57),.21,.14,.10,3);
 }
 // Five lace bridges, glossy tongue detail and pull loop.
 tube([[-.42,.75,-.20],[-.22,.91,-.11],[.30,.89,0]],.25,2,10);
 for(let k=0;k<6;k++){let x=-.35+k*.30, y=.91-Math.max(0,x)*.28;let z=.29-Math.max(0,x)*.08;tube([[x-.10,y,-z],[x,y+.035,0],[x+.10,y,z]],.029,4,7)}
 tube([[-1.72,1.08,-.12],[-1.79,1.38,0],[-1.53,1.43,.09]],.09,2,9);
 // Orange aerodynamic spine, curved heel details, separate tread blocks.
 tube([[-2.00,.06,0],[-1.80,.15,-.02],[-1.48,.22,-.01]],.08,3);
 for(let x=-1.9;x<1.9;x+=.32){tube([[x,-.22,-.37],[x+.04,-.24,.0],[x,-.22,.37]],.035,2,6)}
 return {vertices:new Float32Array(out),triangles};
}
const VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in float aMaterial;
uniform float uYaw, uPitch, uZoom, uAspect, uTime;
out vec3 vNormal;out vec3 vViewPos;flat out int vMaterial;
vec3 rotY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 rotX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
void main(){vec3 q=rotX(rotY(aPosition-vec3(0.,.27,0.),uYaw),uPitch);q.y+=.05+sin(uTime*.8)*.024;q.z-=6.2+uZoom;vec3 n=rotX(rotY(aNormal,uYaw),uPitch);vNormal=normalize(n);vViewPos=q;vMaterial=int(aMaterial+.5);float f=1.78;gl_Position=vec4(q.x*f/uAspect,q.y*f,-1.002*q.z-.205,-q.z);}`;
const FS=`#version 300 es
precision highp float;in vec3 vNormal;in vec3 vViewPos;flat in int vMaterial;out vec4 fragColor;uniform vec3 uAccent;uniform float uTime;
void main(){vec3 n=normalize(vNormal);vec3 base=vec3(.81,.84,.87);float rough=.45;
 if(vMaterial==1){base=vec3(.11,.16,.20);rough=.75;}
 if(vMaterial==2){base=vec3(.042,.056,.074);rough=.27;}
 if(vMaterial==3){base=uAccent;rough=.2;}
 if(vMaterial==4){base=vec3(.92,.93,.97);rough=.45;}
 if(vMaterial==5){base=vec3(.45,.52,.57);rough=.23;}
 vec3 l=normalize(vec3(.55,.90,1.25));float diff=max(.0,dot(n,l));float bounce=max(.0,dot(n,normalize(vec3(-.8,.15,-1.))));float rim=pow(1.-max(.0,dot(n,normalize(-vViewPos))),2.5);
 vec3 color=base*(.27+diff*.90+bounce*.30)+vec3(.83,.90,1.)*pow(max(.0,dot(reflect(-l,n),normalize(-vViewPos))),22.)*(1.-rough)*.8;
 color+=vec3(.27,.4,.54)*rim*.19;
 if(vMaterial==3){color+=uAccent*(.40+sin(uTime*2.)*.08);}
 float fog=clamp((-vViewPos.z-3.)/8.,0.,.7);color=mix(color,vec3(.05,.07,.09),fog);
 fragColor=vec4(pow(max(vec3(0.),color),vec3(.87)),1.);}`;
function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function setupSoftware(canvas){
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw Error('Canvas unavailable');
 const raw=buildGeometry().vertices;const faceCount=raw.length/21;
 let state={canvas,ctx,yaw:.35,pitch:-.16,zoom:0,targetYaw:.35,targetPitch:-.16,targetZoom:0,color:PALETTE.solar,active:true,raf:0,lastDraw:0};
 const palettes=['#d9dde2','#2b3038','#121923','#ff6938','#e9edf0','#7d858e'];
 function draw(now){state.raf=0;if(!state.active)return;
   state.yaw+=(state.targetYaw-state.yaw)*.2;state.pitch+=(state.targetPitch-state.pitch)*.2;state.zoom+=(state.targetZoom-state.zoom)*.15;
   if(now-state.lastDraw<65){state.raf=requestAnimationFrame(draw);return}state.lastDraw=now;
   let dpr=Math.min(devicePixelRatio||1,1.3),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}ctx.clearRect(0,0,w,h);
   const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cx=Math.cos(state.pitch),sx=Math.sin(state.pitch);
   const scale=Math.min(w*.165,h*.25)/(1+state.zoom*.15);const originX=w*(w<650?.51:.62),originY=h*(w<650?.39:.45);
   function transform(x,y,z){const xr=x*cy+z*sy,zr=-x*sy+z*cy,yy=(y-.27)*cx-zr*sx,zz=(y-.27)*sx+zr*cx;const persp=6.5/(6.5-zz);return [originX+xr*scale*persp,originY-yy*scale*persp,zz]}
   let tris=[];let stride=1;
   for(let i=0;i<faceCount;i+=stride){let offset=i*21, p0=transform(raw[offset],raw[offset+1],raw[offset+2]),p1=transform(raw[offset+7],raw[offset+8],raw[offset+9]),p2=transform(raw[offset+14],raw[offset+15],raw[offset+16]);if(!Number.isFinite(p0[0]+p1[0]+p2[0]))continue;
    const material=Math.round(raw[offset+6]),normalY=raw[offset+4],normalZ=raw[offset+5];let intensity=Math.min(1.45,Math.max(.35,.72+normalY*.32+normalZ*.15));tris.push({p0,p1,p2,depth:(p0[2]+p1[2]+p2[2])/3,material,intensity});
   }tris.sort((a,b)=>a.depth-b.depth);
   const a=state.color;const accent=`rgb(${Math.round(a[0]*255)},${Math.round(a[1]*255)},${Math.round(a[2]*255)})`;
   let last='';for(const t of tris){let color=t.material===3?accent:palettes[t.material];if(last!==color){ctx.fillStyle=color;last=color}ctx.globalAlpha=t.material===3?1:Math.min(1,Math.max(.83,t.intensity));ctx.beginPath();ctx.moveTo(t.p0[0],t.p0[1]);ctx.lineTo(t.p1[0],t.p1[1]);ctx.lineTo(t.p2[0],t.p2[1]);ctx.closePath();ctx.fill()}
   ctx.globalAlpha=1;
   state.raf=requestAnimationFrame(draw);
 }
 state.frame=draw;
 let down=false,lastX=0,lastY=0;
 canvas.addEventListener('pointerdown',e=>{down=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!down)return;state.targetYaw+=(e.clientX-lastX)*.009;state.targetPitch=Math.max(-.85,Math.min(.65,state.targetPitch+(e.clientY-lastY)*.007));lastX=e.clientX;lastY=e.clientY});
 canvas.addEventListener('pointerup',()=>down=false);canvas.addEventListener('pointercancel',()=>down=false);
 canvas.addEventListener('wheel',e=>{e.preventDefault();state.targetZoom=Math.max(-1.7,Math.min(3,state.targetZoom+Math.sign(e.deltaY)*.3))},{passive:false});
 return state;
}
function setup(canvas){const gl=canvas.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'high-performance'});if(!gl)return setupSoftware(canvas);let program=gl.createProgram();gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,VS));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const data=buildGeometry();const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data.vertices,gl.STATIC_DRAW);for(const [i,size,offset] of [[0,3,0],[1,3,12],[2,1,24]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,28,offset)}gl.bindVertexArray(null);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 const uniforms={yaw:gl.getUniformLocation(program,'uYaw'),pitch:gl.getUniformLocation(program,'uPitch'),zoom:gl.getUniformLocation(program,'uZoom'),aspect:gl.getUniformLocation(program,'uAspect'),time:gl.getUniformLocation(program,'uTime'),accent:gl.getUniformLocation(program,'uAccent')};
 let state={gl,canvas,program,vao,count:data.vertices.length/7,yaw:.35,pitch:-.16,zoom:0,targetYaw:.35,targetPitch:-.16,targetZoom:0,color:PALETTE.solar,active:true,raf:0};
 const resize=()=>{let dpr=Math.min(window.devicePixelRatio||1,1.8),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}};
 function frame(now){state.raf=0;if(!state.active)return;resize();state.yaw+=(state.targetYaw-state.yaw)*.08;state.pitch+=(state.targetPitch-state.pitch)*.08;state.zoom+=(state.targetZoom-state.zoom)*.07;
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.bindVertexArray(vao);gl.uniform1f(uniforms.yaw,state.yaw);gl.uniform1f(uniforms.pitch,state.pitch);gl.uniform1f(uniforms.zoom,state.zoom);gl.uniform1f(uniforms.aspect,canvas.width/canvas.height);gl.uniform1f(uniforms.time,now*.001);gl.uniform3fv(uniforms.accent,state.color);gl.drawArrays(gl.TRIANGLES,0,state.count);
  state.raf=requestAnimationFrame(frame);
 }
 state.frame=frame;
 let down=false,lastX=0,lastY=0;
 canvas.addEventListener('pointerdown',e=>{down=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!down)return;state.targetYaw+=(e.clientX-lastX)*.009;state.targetPitch=Math.max(-.85,Math.min(.65,state.targetPitch+(e.clientY-lastY)*.007));lastX=e.clientX;lastY=e.clientY});
 canvas.addEventListener('pointerup',()=>down=false);canvas.addEventListener('pointercancel',()=>down=false);
 canvas.addEventListener('wheel',e=>{e.preventDefault();state.targetZoom=Math.max(-1.7,Math.min(3,state.targetZoom+Math.sign(e.deltaY)*.3))},{passive:false});
 return state;
}
window.Stryde3D={start(canvas,color){if(!scene){try{scene=setup(canvas)}catch(e){console.warn('STRYDE native 3D field scan not supported:',e);canvas.setAttribute('aria-label','3D field scan unavailable on this browser');return}}scene.color=PALETTE[color]||PALETTE.solar;scene.active=true;if(!scene.raf)scene.raf=requestAnimationFrame(scene.frame)},setColor(color){if(scene)scene.color=PALETTE[color]||PALETTE.solar},reset(){if(scene){scene.targetYaw=.35;scene.targetPitch=-.16;scene.targetZoom=0}},stop(){if(scene){scene.active=false;cancelAnimationFrame(scene.raf);scene.raf=0}}};
})();