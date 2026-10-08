"""STRYDE V4 model build: original concept-inspired product geometry.
Uses trimesh, no downloaded/third-party shoe assets. Output is a technically
real GLB with named, editable PBR components; it is not a photo scan.
"""
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from collections import defaultdict

D=Path(__file__).resolve().parents[1]
SOURCE=D/'models/aerodyne-one.glb'
scene=trimesh.load(SOURCE,force='scene')
parts=defaultdict(list)

def tube(name,points,r=.025,radial=8):
    points=np.asarray(points,dtype=float)
    if len(points)<2:return
    # Smoothed three-dimensional tubular sweep, adds lacing, traction edges, seams
    frames=[]
    for i in range(len(points)-1):
        for t in np.linspace(0,1,5,endpoint=False):
            p=points[i]*(1-t)+points[i+1]*t
            frames.append(p)
    frames.append(points[-1]);verts=[];faces=[]
    for i,pos in enumerate(frames):
        tangent=frames[min(i+1,len(frames)-1)]-frames[max(i-1,0)]
        tangent=tangent/max(np.linalg.norm(tangent),1e-5)
        ref=np.array([0,1.,0]) if abs(tangent[1])<.85 else np.array([0,0,1.])
        a=np.cross(tangent,ref);a/=max(np.linalg.norm(a),1e-6);b=np.cross(tangent,a)
        for j in range(radial):
            angle=j*np.pi*2/radial
            verts.append(pos+r*(np.cos(angle)*a+np.sin(angle)*b))
    for i in range(len(frames)-1):
        for j in range(radial):
            p=i*radial+j;q=i*radial+(j+1)%radial;s=(i+1)*radial+j;t=(i+1)*radial+(j+1)%radial
            faces.extend([[p,s,q],[q,s,t]])
    mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False);mesh.fix_normals()
    parts[name].append(mesh)

def shell_ribbon(name,control,width=.12,segments=8):
    """Solid beveled aerodynamic strips following the sidewall (not simple rods)."""
    P=np.asarray(control,dtype=float);centers=[]
    for i in range(len(P)-1):
        for t in np.linspace(0,1,segments,endpoint=False):
            f=t*t*(3-2*t);centers.append(P[i]*(1-f)+P[i+1]*f)
    centers.append(P[-1]);v=[];f=[]
    for j,p in enumerate(centers):
        tangent=centers[min(j+1,len(centers)-1)]-centers[max(j-1,0)]
        tangent/=max(np.linalg.norm(tangent),1e-6)
        sideways=np.cross(tangent,[0,0,1]);sideways/=max(np.linalg.norm(sideways),1e-6)
        breadth=width*(.22+.78*np.sin(np.pi*j/max(len(centers)-1,1))**.35)
        sign=1 if p[2]>0 else -1
        center=np.array(p)
        for x,y,z in [(-1,0,0),(1,0,0),(0,0,1)]:
            v.append(center+sideways*x*breadth+np.array([0,.007,z*sign*.027]))
    for i in range(len(centers)-1):
        x=3*i;y=x+3
        f.extend([[x,y,x+2],[y,y+2,x+2],[x+2,y+2,x+1],[y+2,y+1,x+1],[x,x+1,y],[x+1,y+1,y]])
    mesh=trimesh.Trimesh(vertices=v,faces=f,process=False);mesh.fix_normals();parts[name].append(mesh)

def sphere(name,center,scale,detail=1):
    m=trimesh.creation.icosphere(subdivisions=detail);m.apply_scale(scale);m.apply_translation(center);parts[name].append(m)

# Silhouette-defining components: layered aerodynamic panels and encapsulated heel.
for sign in [-1,1]:
    def side(coords):return [(x,y,sign*z) for x,y,z in coords]
    shell_ribbon('V4_SilverWing',side([(-2.12,.26,.33),(-1.86,.40,.51),(-1.52,.54,.56),(-1.17,.40,.66),(-.78,.48,.69),(-.27,.31,.67),(.30,.28,.60),(1.1,.17,.43),(1.82,.16,.20)]),.125)
    shell_ribbon('V4_CarbonBlade',side([(-1.82,.22,.55),(-1.55,.28,.63),(-1.23,.24,.70),(-.81,.22,.70),(-.30,.23,.67),(.38,.22,.58),(1.08,.16,.45),(1.77,.12,.24)]),.088)
    shell_ribbon('V4_ChassisHighlight',side([(-1.79,.53,.50),(-1.57,.68,.56),(-1.27,.60,.61),(-1.08,.72,.58),(-.78,.55,.65),(-.34,.57,.66),(.19,.42,.62),(.77,.29,.50)]),.039)
    # Heel external molded exoskeleton: multiple distinct curved blades.
    shell_ribbon('V4_SilverWing',side([(-2.1,.3,.34),(-1.99,.55,.43),(-1.75,.76,.49),(-1.53,.83,.52),(-1.40,.69,.54)]),.13)
    shell_ribbon('V4_CarbonBlade',side([(-1.97,.28,.54),(-1.83,.58,.56),(-1.72,.76,.48)]),.09)
    # Reflective edge, a purposeful thin line sitting along the upper's silhouette.
    tube('V4_ChassisHighlight',side([(1.85,.23,.18),(1.47,.35,.30),(.98,.46,.44),(.56,.48,.52),(.11,.54,.58)]),.011,7)
    # Extended glowing micro channels through the sole / heel.
    tube('V4_LightChannel',side([(-1.98,-.30,.52),(-1.70,-.33,.65),(-1.46,-.38,.70),(-1.22,-.31,.73),(-.95,-.30,.69),(-.68,-.36,.67),(-.24,-.34,.69),(.21,-.34,.62),(.73,-.32,.52),(1.15,-.29,.41),(1.57,-.29,.26)]),.026,9)
    for x in [-1.85,-1.56,-1.27,-.95,-.32,.52,1.10]:
        zz=sign*(.48 if x<-.5 else .39)
        sphere('V4_AirWindow',(x,-.30,zz),(.105,.087,.083),1)
    # Detailed perforation field (black pinhole insets). Visible at close range.
    for row in range(6):
        for col in range(14):
            x=.60+col*.097
            z=.44-(x-.60)*.159+(row-2.5)*.008
            y=.22+row*.034-(x-.60)*.04
            if x>1.92:continue
            sphere('V4_KnitVents',(x,y,sign*(z+.014)),(.011,.012,.006),0)
    # Technical ribs on toe guard.
    for row in range(8):
        x=1.13+row*.105
        tube('V4_KnitSeams',side([(x,.29,.38-(x-1.13)*.16),(x+.07,.23,.35-(x-1.13)*.16)]),.008,6)
    # Air pods have cast-metal frames, not only floating spheres.
    for x in [-1.67,-1.26,-.82,.74]:
        z=sign*(.54 if x<0 else .43)
        tube('V4_SilverWing',[(x-.15,-.3,z),(x-.09,-.2,z+sign*.055),(x+.08,-.18,z+sign*.055),(x+.17,-.31,z)],.030,8)
# Functional structural stitch zones and fine crossed lacing over tongue.
for row in range(9):
    x=-.82+row*.19;y=.91-max(0,x)*.24;z=.36-max(0,x)*.12
    side_offset=.055 if row%2 else -.055
    tube('V4_Laces',[(x-.08,y,-z),(x,y+.095,side_offset),(x+.08,y,z)],.019,7)
    tube('V4_Laces',[(x-.08,y,z),(x,y+.06,-side_offset),(x+.08,y,-z)],.018,7)
for row in range(18):
    x=-1.9+row*.20
    side_z=(.47 if x<-.7 else .47-.11*(x+.7))
    for side in [-1,1]:
        tube('V4_GripRidges',[(x,-.46,side*(side_z-.09)),(x+.067,-.50,side*(side_z-.10))],.015,6)

mat={
'V4_SilverWing':('#a8b3ba',.83,.26),
'V4_CarbonBlade':('#151c23',.45,.33),
'V4_ChassisHighlight':('#eef2f1',.77,.20),
'V4_LightChannel':('#ff6b37',.18,.17),
'V4_AirWindow':('#d68552',.13,.16),
'V4_KnitVents':('#53595e',.05,.82),
'V4_KnitSeams':('#b3babf',.08,.75),
'V4_Laces':('#f0f0ec',.01,.75),
'V4_GripRidges':('#262c35',0,.92),
}
for name,meshes in parts.items():
    mesh=trimesh.util.concatenate(meshes);mesh.remove_unreferenced_vertices()
    color,metal,rough=mat[name];rgba=list(bytes.fromhex(color[1:]))+[255]
    emissive=(.64,.16,.038) if name=='V4_LightChannel' else (0,0,0)
    mesh.visual=trimesh.visual.TextureVisuals(material=PBRMaterial(name=name,baseColorFactor=rgba,
        metallicFactor=metal,roughnessFactor=rough,doubleSided=True,emissiveFactor=emissive))
    scene.add_geometry(mesh,node_name=name,geom_name=name)
    print(name, len(mesh.faces))
output=D/'models/aerodyne-v4.glb'
output.write_bytes(scene.export(file_type='glb',include_normals=True))
check=trimesh.load(output,force='scene')
assert len(check.geometry)>=22, len(check.geometry)
assert all(len(g.faces)>0 for g in check.geometry.values())
print('V4 GLB verified:',len(check.geometry),'PBR parts,', output.stat().st_size,'bytes')
