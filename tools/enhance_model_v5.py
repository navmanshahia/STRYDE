"""STRYDE V5 original concept sneaker enhancement. Requires trimesh + numpy.
The original art is a single view; geometry on unseen sides is artistic interpretation.
"""
from pathlib import Path
from collections import defaultdict
import numpy as np, trimesh
from trimesh.visual.material import PBRMaterial
ROOT=Path(__file__).resolve().parents[1]
scene=trimesh.load(ROOT/'models/aerodyne-v4.glb',force='scene')
parts=defaultdict(list)
def tube(name,points,r=.012,radial=7):
    P=np.asarray(points,float);samples=[]
    for i in range(len(P)-1):
        for j in range(4):samples.append(P[i]+(P[i+1]-P[i])*(j/4))
    samples.append(P[-1]);verts=[];faces=[]
    for i,p in enumerate(samples):
        a=samples[max(0,i-1)];b=samples[min(i+1,len(samples)-1)];t=b-a;t/=max(np.linalg.norm(t),1e-8);ref=np.array([0,1.,0]) if abs(t[1])<.8 else np.array([0,0,1.]);v=np.cross(t,ref);v/=max(np.linalg.norm(v),1e-7);w=np.cross(t,v)
        for j in range(radial):verts.append(p+r*(np.cos(j*np.pi*2/radial)*v+np.sin(j*np.pi*2/radial)*w))
    for i in range(len(samples)-1):
        for j in range(radial):
            a=i*radial+j;b=i*radial+(j+1)%radial;c=(i+1)*radial+j;d=(i+1)*radial+(j+1)%radial
            faces.extend([(a,c,b),(b,c,d)])
    parts[name].append(trimesh.Trimesh(vertices=verts,faces=faces,process=False))
def pod(name, pos,scale,detail=1):
    g=trimesh.creation.icosphere(subdivisions=detail);g.apply_scale(scale);g.apply_translation(pos);parts[name].append(g)
def arc(name,center,radx,rady,z,start=0,stop=np.pi*2,r=.011):
    A=np.linspace(start,stop,32)
    tube(name,[(center[0]+np.cos(a)*radx,center[1]+np.sin(a)*rady,z) for a in A],r,7)
for s in [-1,1]:
    # Embossed external tensile weave across the quarter panel.
    for row in range(12):
        y=.36+row*.047
        for i in range(14):
            x=-1.22+i*.16;z=s*(.618-abs(x+.3)*.047)
            if abs(x)>1.12:continue
            tube('V5_EngineeredWeave',[(x,y,z),(x+.052,y+.019,z+s*.004)],.0055,5)
    # Overlapping carbon-fiber structural chevrons.
    for i in range(5):
        x=-1.72+i*.34
        tube('V5_CarbonWeft',[(x,.41,s*.69),(x+.14,.54,s*.685),(x+.31,.44,s*.67)],.023,8)
    # Heel exoskeleton cast fins and vent strakes.
    for i in range(5):
        x=-2.03+i*.095
        tube('V5_HeelFins',[(x,.16,s*.53),(x-.035,.37,s*.58),(x+.015,.64,s*.48)],.019,8)
    # Woven toe technical stitches.
    for j in range(24):
        x=.54+j*.056
        z=s*(.49-(x-.54)*.11)
        tube('V5_ToeboxStitch',[(x,.23,z),(x+.027,.26,z+s*.016)],.006,5)
    # Rigid external airpod rings.
    for x in [-1.7,-1.31,-.9,.66]:
        zz=s*(.56 if x<0 else .46)
        arc('V5_AirCellRims',(x,-.31),.118,.088,zz,r=.012)
        pod('V5_AirCellGlass',(x,-.31,zz+s*.012),(.083,.06,.022),2)
    # Luminous seam along heel and toe.
    tube('V5_EmberPiping',[(-2.03,-.33,s*.52),(-1.78,-.42,s*.64),(-1.41,-.4,s*.69),(-1.05,-.34,s*.68),(-.7,-.35,s*.65),(-.26,-.36,s*.67),(.18,-.34,s*.62),(.75,-.34,s*.48),(1.3,-.3,s*.36)],.010,7)
    # Outsole grip island tread pattern.
    for i in range(23):
        x=-1.95+i*.17
        for lane in [-.24,0,.24]:
            pod('V5_TreadIslands',(x,-.516,lane+s*.07),(.047,.011,.075),0)
# Authentic lacing cross pattern and collar braided rim.
for i in range(10):
    x=-.82+i*.175;y=.92-i*.017
    tube('V5_BraidedLaces',[(x-.055,y,-.27),(x,y+.085,0),(x+.055,y,.27)],.016,9)
    tube('V5_BraidedLaces',[(x-.055,y,.27),(x,y+.065,0),(x+.055,y,-.27)],.016,9)
for i in range(18):
    x=-1.89+i*.048
    tube('V5_CollarWelt',[(x,1.01+.22*np.sin(i*np.pi/18),-.37),(x+.025,1.02+.22*np.sin((i+1)*np.pi/18),-.34)],.008,5)
    tube('V5_CollarWelt',[(x,1.01+.22*np.sin(i*np.pi/18),.37),(x+.025,1.02+.22*np.sin((i+1)*np.pi/18),.34)],.008,5)
for x in np.linspace(-1.97,-1.35,9):
    pod('V5_HeelReflectors',(x,.68,.51),(.019,.025,.012),1)
    pod('V5_HeelReflectors',(x,.68,-.51),(.019,.025,.012),1)
materials={
'V5_EngineeredWeave':('#cbd1d4',.05,.9),'V5_CarbonWeft':('#151e27',.55,.29),'V5_HeelFins':('#a9b4b8',.71,.22),
'V5_ToeboxStitch':('#eef1e9',.02,.92),'V5_AirCellRims':('#cbd4da',.80,.20),'V5_AirCellGlass':('#ff9b6c',.20,.18),
'V5_EmberPiping':('#ff6834',.30,.16),'V5_TreadIslands':('#181c26',.06,.9),
'V5_BraidedLaces':('#f4f5f0',.02,.69),'V5_CollarWelt':('#ced2d1',.03,.72),'V5_HeelReflectors':('#f0f4ff',.83,.15)}
for name,group in parts.items():
    merged=trimesh.util.concatenate(group);merged.remove_unreferenced_vertices();merged.fix_normals()
    color,metal,rough=materials[name];rgba=list(bytes.fromhex(color.lstrip('#')))+[255]
    em=(.6,.14,.035) if 'Ember' in name else (0,0,0)
    merged.visual=trimesh.visual.TextureVisuals(material=PBRMaterial(name=name,baseColorFactor=rgba,metallicFactor=metal,roughnessFactor=rough,doubleSided=True,emissiveFactor=em))
    scene.add_geometry(merged,node_name=name,geom_name=name)
out=ROOT/'models/aerodyne-v5.glb';out.write_bytes(scene.export(file_type='glb',include_normals=True))
verify=trimesh.load(out,force='scene')
assert len(verify.geometry)>=35
print('V5 model:',len(verify.geometry),'components,',sum(len(g.faces) for g in verify.geometry.values()),'triangles,',out.stat().st_size,'bytes')
