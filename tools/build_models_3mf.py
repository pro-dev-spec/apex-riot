"""
APEX RIOT · convierte modelos 3MF (BambuStudio / MakerWorld) al formato web APXC
===============================================================================
Lee un .3mf, escoge las piezas que se usan, las orienta (Y arriba, frente a +Z),
las reduce con agrupación de vértices por error cuádrico y guarda un binario
compacto que lee el visor 3D (js/3d/viewer3d.min.js).

Formato APXC:
  cabecera : 'APXC' + uint32 nVért + uint32 nTriáng + 3×float32 centro + float32 escala
  vértices : int16 x,y,z cuantizados            (nVért × 6 bytes)
  piezas   : uint8 por vértice (0 base · 1 acento · 2 detalle), alineado a 4 bytes
  triáng.  : uint16 (o uint32 si hay ≥ 65.536 vértices)

El color de cada pieza lo pone el visor según la variante del producto
(base / accent / detail de products.json), así que un solo modelo sirve para
todos los colores.

Uso:  python tools/build_models_3mf.py carpeta/con/3mf assets/models
Requiere: numpy y scipy (no necesita trimesh).
"""
import sys, os, struct, zipfile
import numpy as np
import xml.etree.ElementTree as ET
NS = "{http://schemas.microsoft.com/3dmanufacturing/core/2015/02}"
def parse_objects(xml_bytes):
    """-> dict id -> (V (n,3) float, F (m,3) int) para cada <object> con <mesh>"""
    out={}
    root=ET.fromstring(xml_bytes)
    for ob in root.iter(NS+'object'):
        mesh=ob.find(NS+'mesh')
        if mesh is None: continue
        vs=mesh.find(NS+'vertices'); ts=mesh.find(NS+'triangles')
        V=np.array([[float(v.get('x')),float(v.get('y')),float(v.get('z'))] for v in vs],dtype=np.float64)
        F=np.array([[int(t.get('v1')),int(t.get('v2')),int(t.get('v3'))] for t in ts],dtype=np.int64)
        out[ob.get('id')]=(V,F)
    return out
def components(xml_bytes):
    root=ET.fromstring(xml_bytes); res=[]
    for ob in root.iter(NS+'object'):
        c=ob.find(NS+'components')
        if c is None: continue
        for k in c:
            t=[float(x) for x in k.get('transform','1 0 0 0 1 0 0 0 1 0 0 0').split()]
            res.append((k.get('objectid'),t,k.get('{http://schemas.microsoft.com/3dmanufacturing/production/2015/06}path')))
    return res
def apply(V,t):
    M=np.array(t[:9]).reshape(3,3)  # filas = columnas 3MF: v' = v*M + T
    return V@M+np.array(t[9:12])

from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

def weld(V,F,tol=1e-4):
    k=np.round(V/tol).astype(np.int64)
    _,idx,inv=np.unique(k,axis=0,return_index=True,return_inverse=True)
    inv=inv.reshape(-1)
    F2=inv[F]; ok=(F2[:,0]!=F2[:,1])&(F2[:,1]!=F2[:,2])&(F2[:,0]!=F2[:,2])
    return V[idx],F2[ok]

def face_normals(V,F):
    n=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); return n

def simplify_qem(V,F,target):
    """Agrupación de vértices con error cuádrico: elige la rejilla que da ~target triángulos."""
    V=np.asarray(V,float); F=np.asarray(F)
    if len(F)<=target: return V.copy(),F.copy()
    lo,hi=V.min(0),V.max(0); diag=np.linalg.norm(hi-lo)
    n=face_normals(V,F); area=np.linalg.norm(n,axis=1)/2; nn=n/np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
    d=-(nn*V[F[:,0]]).sum(1)
    P=np.concatenate([nn,d[:,None]],1)                       # plano (a,b,c,d)
    Qf=(P[:,:,None]*P[:,None,:])*area[:,None,None]            # (m,4,4)
    Qv=np.zeros((len(V),4,4))
    for k in range(3): np.add.at(Qv,F[:,k],Qf)
    def run(cell):
        c=np.floor((V-lo)/cell).astype(np.int64)
        key=c[:,0]*1000003+c[:,1]*1009+c[:,2]
        uk,inv=np.unique(key,return_inverse=True); inv=inv.reshape(-1)
        nc=len(uk); cnt=np.bincount(inv,minlength=nc).astype(float)
        mean=np.zeros((nc,3)); 
        for k in range(3): mean[:,k]=np.bincount(inv,V[:,k],minlength=nc)/cnt
        Qc=np.zeros((nc,4,4)); np.add.at(Qc,inv,Qv)
        A=Qc[:,:3,:3]; b=-Qc[:,:3,3]
        reg=1e-3*np.trace(A,axis1=1,axis2=2)[:,None,None]+1e-12
        A=A+reg*np.eye(3)[None]; b=b+(reg[:,0,:]*mean)
        try: x=np.linalg.solve(A,b[:,:,None])[:,:,0]
        except np.linalg.LinAlgError: x=mean
        far=np.linalg.norm(x-mean,axis=1)>cell*1.2     # la solución se fue lejos: usa el promedio
        x[far]=mean[far]
        F2=inv[F]; ok=(F2[:,0]!=F2[:,1])&(F2[:,1]!=F2[:,2])&(F2[:,0]!=F2[:,2])
        F2=F2[ok]
        # quitar duplicados de caras
        s=np.sort(F2,axis=1); _,u=np.unique(s,axis=0,return_index=True)
        return x,F2[np.sort(u)]
    a,b_=diag/2000,diag/6
    best=None
    for _ in range(18):
        mid=(a*b_)**.5; x,F2=run(mid)
        if len(F2)>target: a=mid
        else: b_=mid; best=(x,F2)
        if best and abs(len(F2)-target)/target<.04: break
    if best is None: best=run(b_)
    x,F2=best
    used=np.unique(F2); remap=-np.ones(len(x),int); remap[used]=np.arange(len(used))
    return x[used],remap[F2]

def components_of(V,F):
    n=len(V); r=np.concatenate([F[:,0],F[:,1]]); c=np.concatenate([F[:,1],F[:,2]])
    g=coo_matrix((np.ones(len(r)),(r,c)),shape=(n,n))
    k,lab=connected_components(g,directed=False); return k,lab


# --- Qué se usa de cada archivo ------------------------------------------------
# archivo.3mf : (archivo de salida, eje arriba, [(id de pieza, id de parte, triángulos objetivo)], archivo con mallas)
# parte: 0 = color base · 1 = acento · 2 = detalle
JOBS = {
  # Jersey a rayas: cuerpo(1) + rayas(2) + puños(3) + cuello(4). Se omite el resto del STL original.
  'Vicenza_Paolo_Rossi.3mf': dict(out='jersey-stripes.apxc', up='z', obj='3D/Objects/object_105.model',
        parts=[('1', 0, 16000), ('2', 1, 12000), ('3', 2, 3000), ('4', 2, 3000)]),
  # Camiseta: cuerpo(4) + dibujo(1) + cuello(2) + puños(3)
  'Maglietta_Unicorno.3mf': dict(out='tee-unicorn.apxc', up='z', obj='3D/Objects/object_88.model',
        parts=[('4', 0, 14000), ('1', 1, 9000), ('2', 2, 3000), ('3', 2, 3000)]),
  # Gafas (solo marco): un solo objeto, sin transformaciones por componente
  'Lego_MTB_Goggles.3mf': dict(out='goggles-brick.apxc', up='z', obj=None,
        parts=[('1', 1, 36000)]),
}

def orient(V, up):
    # los 3MF de impresión vienen con Z arriba y el frente hacia -Y; el visor usa Y arriba y frente a +Z
    return np.stack([V[:, 0], V[:, 2], -V[:, 1]], 1)

def build(src, job, dst):
    z = zipfile.ZipFile(src)
    if job['obj']:
        objs = parse_objects(z.read(job['obj'])); comps = {c[0]: c for c in components(z.read('3D/3dmodel.model'))}
    else:
        objs = parse_objects(z.read('3D/3dmodel.model')); comps = {}
    Vs, Fs, Ps, off = [], [], [], 0
    for oid, part, target in job['parts']:
        V, F = objs[oid]
        if oid in comps: V = apply(V, comps[oid][1])
        V, F = weld(V, F)
        V, F = simplify_qem(orient(V, job['up']), F, target)
        Vs.append(V); Fs.append(F + off); Ps.append(np.full(len(V), part, np.uint8)); off += len(V)
        print(f'   pieza {oid}: {len(F):6d} triángulos')
    V = np.concatenate(Vs); F = np.concatenate(Fs); P = np.concatenate(Ps)
    center = (V.min(0) + V.max(0)) / 2; V = V - center; scale = float(np.abs(V).max())
    q = np.round(V / scale * 32767).astype(np.int16)
    idx = F.astype(np.uint16 if len(V) < 65536 else np.uint32)
    pad = lambda b: b + b'\0' * ((4 - len(b) % 4) % 4)
    with open(dst, 'wb') as fh:
        fh.write(b'APXC'); fh.write(struct.pack('<II4f', len(V), len(F), *center.tolist(), scale))
        fh.write(pad(q.tobytes())); fh.write(pad(P.tobytes())); fh.write(idx.tobytes())
    print(f'OK {dst}: {len(V)} vértices, {len(F)} triángulos, {os.path.getsize(dst)//1024} KB')

if __name__ == '__main__':
    srcdir = sys.argv[1] if len(sys.argv) > 1 else '.'
    outdir = sys.argv[2] if len(sys.argv) > 2 else 'assets/models'
    os.makedirs(outdir, exist_ok=True)
    for fn, job in JOBS.items():
        p = os.path.join(srcdir, fn)
        if os.path.exists(p):
            print(fn); build(p, job, os.path.join(outdir, job['out']))
        else:
            print('(no encontrado)', p)
