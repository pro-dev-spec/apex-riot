"""
APEX RIOT · prepara el casco 3D para la web
===========================================
Toma el STL del casco de motocross (≈300.000 triángulos, 15 MB), lo reduce
a ~50.000 triángulos y lo guarda en un binario compacto que lee el visor 3D:

  cabecera  : 'APXM' + uint32 nVertices + uint32 nTriángulos + 3×float32 centro + float32 escala
  vértices  : int16 x,y,z cuantizados (Y arriba, el frente mira a +Z)
  triángulos: uint16 (o uint32 si hay más de 65.535 vértices)

Uso:  pip install trimesh fast-simplification
      python tools/build_helmet.py ruta/al/casco.stl assets/models/helmet-mx.bin
"""
import struct, sys
import numpy as np
import trimesh
import fast_simplification as fs

src = sys.argv[1] if len(sys.argv) > 1 else 'casco.stl'
out = sys.argv[2] if len(sys.argv) > 2 else 'assets/models/helmet-mx.bin'
TARGET = 50000

m = trimesh.load(src, force='mesh')
red = max(0.0, 1 - TARGET / len(m.faces))
v, f = fs.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32), target_reduction=red)
m = trimesh.Trimesh(v, f, process=True)
m.remove_unreferenced_vertices()

# El STL viene con Z arriba y la mentonera hacia -Y. El visor usa Y arriba y frente hacia +Z:
V = m.vertices.copy()
V = np.stack([V[:, 0], V[:, 2], -V[:, 1]], axis=1)
center = (V.min(0) + V.max(0)) / 2
V -= center
scale = np.abs(V).max()
q = np.round(V / scale * 32767).astype(np.int16)
F = m.faces.astype(np.uint16 if len(V) < 65536 else np.uint32)

with open(out, 'wb') as fh:
    fh.write(b'APXM')
    fh.write(struct.pack('<II4f', len(V), len(F), *center.tolist(), float(scale)))
    fh.write(q.tobytes())
    if len(q.tobytes()) % 4: fh.write(b'\0' * (4 - len(q.tobytes()) % 4))
    fh.write(F.tobytes())
print(f'OK {out}: {len(V)} vértices, {len(F)} triángulos')
