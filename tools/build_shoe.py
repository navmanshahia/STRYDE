"""Build STRYDE AERODYNE ONE original digital concept shoe as segmented PBR GLB.
Artwork-inspired original hard-surface modeling, not a photogrammetry scan or commercial last.
Usage: python tools/build_shoe.py
"""
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from pathlib import Path
from collections import defaultdict

COLORS={
 'Upper_Knit':('#e1e5e5',0,.94), 'Liner':('#111921',0,.98),'Tongue':('#bac0c2',0,.88),
 'Cage_Carbon':('#161a21',.19,.38),'Cage_Metal':('#b9bec3',.78,.22),
 'Laces':('#eef0eb',0,.78),'Outsole_Rubber':('#191d25',0,.91),
 'Midsole_Foam':('#e1e2de',.0,.68),'Midsole_Silver':('#747d86',.72,.26),
 'Accent_Emissive':('#ff652d',.26,.32),'Air_Unit':('#ab6244',.08,.20),
 'Tread':('#34383e',0,.98), 'Stitching':('#7b8287',0,.9),
 'Perforations':('#555c62',0,.94),'Detail_White':('#ecece8',0,.65),
}
bygroup=defaultdict(list)

def mat_for(key):
    h,metal,rough=COLORS[key];rgba=list(bytes.fromhex(h.lstrip('#')))+[255]
    return PBRMaterial(name=key,baseColorFactor=rgba,metallicFactor=metal,roughnessFactor=rough,doubleSided=True,
        emissiveFactor=[0.55,0.16,0.05] if key=='Accent_Emissive' else [0,0,0])

def add(group,mesh):
    if len(mesh.vertices) and len(mesh.faces): bygroup[group].append(mesh)

def loft(group,profiles,steps=40):
    """Profiles are x,heightCenter,halfWidth,halfHeight; longitudinal smooth interpolant."""
    pf=np.asarray(profiles,dtype=float);pp=[]
    for i in range(len(pf)-1):
        for j in range(6):
            t=j/6;t=t*t*(3-2*t);pp.append(pf[i]*(1-t)+pf[i+1]*t)
    pp.append(pf[-1]);pp=np.array(pp)
    verts=[];faces=[]
    for x,y,w,h in pp:
        for k in range(steps):
            a=2*np.pi*k/steps
            # toe slightly flattened top, sole gently squared bottom
            yy=np.cos(a);zz=np.sin(a)
            verts.append([x,y+h*(np.sign(yy)*abs(yy)**.88),w*np.sign(zz)*abs(zz)**.87])
    for i in range(len(pp)-1):
        for k in range(steps):
            a=i*steps+k;b=i*steps+(k+1)%steps;c=(i+1)*steps+k;d=(i+1)*steps+(k+1)%steps
            faces.extend([[a,b,c],[b,d,c]])
    verts.append(pp[0][0:1].tolist()+[pp[0][1],0]);start=len(verts)-1
    verts.append(pp[-1][0:1].tolist()+[pp[-1][1],0]);end=len(verts)-1
    for k in range(steps):
        faces.append([start,k,(k+1)%steps]);i=(len(pp)-1)*steps;faces.append([end,i+(k+1)%steps,i+k])
    m=trimesh.Trimesh(vertices=verts,faces=faces,process=False); m.fix_normals();add(group,m)

def tube(group,points,r=.025,radial=8):
    pts=np.array(points,dtype=float)
    if len(pts)<2:return
    # Catmull interpolation smoothed polyline
    samples=[]
    for k in range(len(pts)-1):
        p0=pts[max(0,k-1)];p1=pts[k];p2=pts[k+1];p3=pts[min(len(pts)-1,k+2)]
        for u in np.linspace(0,1,4,endpoint=False):
            samples.append(.5*(2*p1+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u))
    samples.append(pts[-1]);verts=[];faces=[]
    for i,pos in enumerate(samples):
        tangent=samples[min(i+1,len(samples)-1)]-samples[max(i-1,0)];tangent/=max(np.linalg.norm(tangent),1e-8)
        ref=np.array([0,1,0] if abs(tangent[1])<.83 else [0,0,1]);v=np.cross(tangent,ref);v/=np.linalg.norm(v);w=np.cross(tangent,v)
        for j in range(radial):
            a=2*np.pi*j/radial;verts.append(pos+r*(np.cos(a)*v+np.sin(a)*w))
    for i in range(len(samples)-1):
        for j in range(radial):
            a=i*radial+j;b=i*radial+(j+1)%radial;c=(i+1)*radial+j;d=(i+1)*radial+(j+1)%radial;faces.extend([[a,c,b],[b,c,d]])
    mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False);mesh.fix_normals();add(group,mesh)

def ellipsoid(group,center,scale,detail=1):
    s=trimesh.creation.icosphere(subdivisions=detail,radius=1.0);s.apply_scale(scale);s.apply_translation(center);add(group,s)

def box(group,center,size):
    m=trimesh.creation.box(extents=size);m.apply_translation(center);add(group,m)

# Substrate: contoured performance outsole, foam core and silver wing-wall.
base=[[-2.30,-.32,.08,.04],[-2.13,-.31,.38,.12],[-1.78,-.30,.58,.16],[-1.25,-.29,.69,.18],[-.56,-.28,.66,.18],[.08,-.27,.63,.16],[.78,-.27,.55,.14],[1.32,-.25,.44,.13],[1.88,-.23,.28,.10],[2.30,-.21,.02,.015]]
loft('Outsole_Rubber',base,44)
loft('Midsole_Foam',[[x,cy+.195,w*.965,h*.82] for x,cy,w,h in base],44)
loft('Midsole_Silver',[[x,cy+.335,w*.90,h*.35] for x,cy,w,h in base],40)
# Heel air chamber and clear shock capsules on each side.
for side in [-1,1]:
    for x in [-1.80,-1.36,-.98,.62,1.14]:
        pz=(.43 if x<0 else .34)*side
        ellipsoid('Air_Unit',(x,-.31,pz),(.22,.125,.135),2)
        tube('Cage_Metal',[[x-.21,-.31,pz],[x-.17,-.22,pz+side*.09],[x+.13,-.21,pz+side*.07],[x+.22,-.31,pz]],.036,9)
# Conspicuous orange under-midsole LED-style channel, at lateral/medial ridges.
for side in [-1,1]:
    tube('Accent_Emissive',[[x,y,side*z] for x,y,z in [(-2.08,-.23,.35),(-1.8,-.20,.52),(-1.35,-.21,.68),(-.83,-.24,.64),(-.20,-.26,.64),(.42,-.25,.57),(1.04,-.22,.46),(1.66,-.20,.30),(2.04,-.19,.15)]],.030,11)
    tube('Cage_Metal',[[x,y,side*z] for x,y,z in [(-2.05,-.09,.36),(-1.75,-.02,.55),(-1.33,-.035,.67),(-.72,-.04,.67),(.16,-.04,.64),(.94,-.04,.51),(1.74,-.05,.25)]],.048,10)
# Upper: tall sculptural heel down to tapered toe box.
loft('Upper_Knit',[[-2.20,.30,.045,.02],[-1.98,.40,.38,.27],[-1.75,.47,.47,.45],[-1.44,.53,.52,.56],[-1.10,.55,.55,.59],[-.72,.53,.58,.51],[-.15,.45,.61,.41],[.42,.36,.57,.31],[1.03,.29,.46,.25],[1.59,.22,.32,.18],[2.08,.16,.12,.08],[2.20,.15,.02,.015]],54)
# Heel sock lining and two collar cushions; tongue extending from lacing panel.
ellipsoid('Liner',(-1.63,1.045,0),(.49,.145,.39),2)
ellipsoid('Liner',(-1.82,.61,0),(.25,.37,.38),1)
ellipsoid('Tongue',(-.55,.985,0),(.94,.17,.275),2)
tube('Cage_Metal',[[-1.89,.93,-.26],[-1.90,1.10,-.26],[-1.58,1.16,-.24],[-1.30,1.06,-.20]],.043,10)
tube('Cage_Metal',[[-1.89,.93,.26],[-1.90,1.10,.26],[-1.58,1.16,.24],[-1.30,1.06,.20]],.043,10)
# Pull tabs at heel and tongue.
tube('Liner',[[-1.94,.92,0],[-1.94,1.29,0],[-1.72,1.33,0]],.085,11)
tube('Accent_Emissive',[[-1.96,1.02,.045],[-1.96,1.30,.045]],.021,7)
tube('Cage_Carbon',[[.02,.86,0],[.09,1.11,0],[.37,1.09,0]],.075,9)
# The distinct aerodynamic webbing and protective exoskeleton wraps each side.
for side in [-1,1]:
    def lateral(path):return [[x,y,z*side] for x,y,z in path]
    tube('Cage_Carbon',lateral([(-1.94,.41,.39),(-1.67,.52,.52),(-1.25,.61,.575),(-.66,.67,.61),(-.02,.59,.63),(.60,.43,.56),(1.22,.31,.41),(1.86,.20,.19)]),.084,10)
    tube('Cage_Carbon',lateral([(-1.92,.30,.41),(-1.60,.34,.58),(-.98,.30,.63),(-.33,.28,.67),(.40,.24,.56),(1.05,.21,.42),(1.78,.17,.22)]),.095,10)
    tube('Cage_Metal',lateral([(-1.89,.45,.47),(-1.53,.58,.56),(-.97,.67,.59),(-.38,.61,.65),(.31,.44,.63),(.96,.32,.46),(1.59,.19,.28)]),.033,9)
    tube('Cage_Metal',lateral([(-1.79,.20,.52),(-1.46,.21,.62),(-.81,.19,.68),(.05,.19,.65),(.84,.18,.46),(1.65,.15,.23)]),.025,8)
    # Dynamic carbon X side panel and angular geometry.
    tube('Cage_Carbon',lateral([(-.99,.57,.61),(-.77,.28,.65),(-.48,.53,.64),(-.21,.28,.66),(.08,.44,.63)]),.065,10)
    tube('Accent_Emissive',lateral([(-1.73,.47,.53),(-1.45,.41,.62),(-1.16,.53,.63),(-.91,.43,.655)]),.025,9)
    tube('Stitching',lateral([(.52,.41,.55),(.81,.31,.50),(1.19,.23,.39),(1.63,.18,.25)]),.011,6)
    # Small perforated eyelets arranged in patterned arrays along rear quarter and forefoot.
    for k in range(12):
        x=.60+k*.103;y=.34-(x-.60)*.16;z=.45-(x-.60)*.17
        for j in range(3):
            ellipsoid('Perforations',(x,y+(j-1)*.052,side*(z+.009)),(.018,.012,.006),0)
    # Logo slash and heel brand panel.
    tube('Detail_White',lateral([(-1.68,.74,.48),(-1.50,.84,.52),(-1.36,.72,.55)]),.029,9)
    tube('Cage_Metal',lateral([(-1.96,.28,.43),(-1.75,.76,.49),(-1.47,.88,.46)]),.069,9)
    # Eyelets / reinforced loops beside tongue.
    for j in range(7):
        x=-.68+j*.24; y=.87-max(0,x)*.24
        z=.36-max(0,x)*.11
        ellipsoid('Cage_Carbon',(x,y,side*z),(.063,.027,.039),1)
# Woven crossing laces forming identifiable zigzag.
for j in range(7):
    x=-.66+j*.235;y=.95-max(0,x)*.23;z=.32-max(0,x)*.12
    # crossed left-right with central hump, every successive loop alternates
    tube('Laces',[[x-.08,y,-z],[x,y+.075,0],[x+.09,y,z]],.032,9)
    tube('Laces',[[x-.08,y,z],[x,y+.062,0],[x+.09,y,-z]],.029,9)
# Sculpted toe guard, bumper and knit seam, heel fins.
for side in [-1,1]:
    tube('Cage_Metal',[[x,y,z*side] for x,y,z in [(1.05,.33,.40),(1.45,.27,.32),(1.86,.18,.22),(2.15,.13,.09)]],.038,8)
    tube('Stitching',[[x,y,z*side] for x,y,z in [(1.20,.43,.27),(1.42,.38,.23),(1.62,.29,.20),(1.89,.22,.12)]],.014,7)
# Several independent heel stabilizers / separate tread blocks (show in exploded view).
for i,x in enumerate(np.linspace(-1.98,1.93,21)):
    halfw=.48 if x<-.7 else .49-(x+.7)*.12
    for z in [-halfw*.60,0,halfw*.60]:
        box('Tread',(x,-.468,z),(.14,.075,.17 if abs(z)>0 else .13))

scene=trimesh.Scene()
for name,meshes in bygroup.items():
    mesh=trimesh.util.concatenate(meshes)
    mesh.remove_unreferenced_vertices()
    mesh.visual=trimesh.visual.TextureVisuals(material=mat_for(name))
    scene.add_geometry(mesh,node_name=name,geom_name=name)
    print(f'{name:20} faces={len(mesh.faces):6} vertices={len(mesh.vertices):6}')

output=Path(__file__).resolve().parents[1]/'models'/'aerodyne-one.glb'
output.write_bytes(scene.export(file_type='glb', include_normals=True))
print('GLB',output.stat().st_size,'bytes,',len(scene.geometry),'named PBR parts')
# reopen to verify valid glTF in GLB binary
loaded=trimesh.load(output,force='scene')
assert len(loaded.geometry)>=12
assert all(len(x.faces)>0 for x in loaded.geometry.values())
print('Verified GLB:', len(loaded.geometry),'meshes')