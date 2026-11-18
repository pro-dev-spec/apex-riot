"""
APEX RIOT · quita el dibujo en relieve de la camiseta 3D para estampar la marca
==============================================================================
El modelo original (tools/models-src/tee-unicorn.apxc, no se publica) trae un unicornio incrustado en el pecho: una pieza sólida
(pieza 1) que rellena un hueco del cuerpo. Para estampar la calcomanía de marca encima
(tools/build_decals.py) la cara superior de esa pieza se proyecta sobre la superficie del pecho
(interpolada desde el cuerpo), su fondo queda justo debajo para tapar rendijas, sus paredes se
eliminan, las paredes del hueco del cuerpo se bajan bajo la superficie y toda la pieza se pinta del
color base.

El jersey no se modifica: sus rayas son capas superpuestas y la calcomanía tapa su "9".

Uso:  python tools/flatten_relief.py      → assets/models/tee-apex.apxc
Requiere: numpy, scipy.
"""
import os, struct
import numpy as np
from scipy.interpolate import griddata
from scipy.spatial import cKDTree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, DST, PART = 'tee-unicorn.apxc', 'tee-apex.apxc', 1
PANEL_X, PANEL_Y = (-1.25, 1.25), (-2.2, 1.75)  # todo el frente del torso (se recorta a la silueta)
EDGE, LIFT, ENV_R, SMOOTH = .1, .004, .09, 3.5                         # ancho del borde que se hunde y altura sobre la tela
S = 32767 / 2.15

def main():
    d = os.path.join(ROOT, 'assets/models')
    b = open(os.path.join(ROOT, 'tools/models-src', SRC), 'rb').read(); assert b[:4] == b'APXC'
    nv, nf = struct.unpack('<II', b[4:12]); extra = b[12:28]; a = 28
    Q = np.frombuffer(b[a:a + nv * 6], np.int16).reshape(-1, 3).copy(); a += nv * 6; a += (-a) % 4
    P = np.frombuffer(b[a:a + nv], np.uint8).copy(); a += nv; a += (-a) % 4
    dt, n = (np.uint32, 4) if nv >= 65536 else (np.uint16, 2)
    F = np.frombuffer(b[a:a + nf * 3 * n], dt).reshape(-1, 3).astype(np.int64)
    V = Q / S

    # superficie del pecho: vértices del cuerpo en el frente
    body = (P != PART) & (V[:, 2] > .3)
    ins = P == PART
    zf = griddata(V[body, :2], V[body, 2], V[ins, :2], method='linear')
    zn = griddata(V[body, :2], V[body, 2], V[ins, :2], method='nearest')
    zf = np.where(np.isnan(zf), zn, zf)

    # caras de la incrustación: solo las que miran al frente
    fpart = P[F[:, 0]] == PART
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
    keep = ~fpart | (np.abs(fn[:, 2]) > .5)   # fuera las paredes de la incrustación
    F2 = F[keep]

    top = V[ins, 2] > .3                      # cara superior → apenas sobre la superficie del pecho
    V[ins, 2] = np.where(top, zf + .004, zf - .01)  # fondo → justo debajo: tapa las rendijas del borde

    # paredes del hueco del cuerpo: se bajan bajo la superficie para que no asomen como líneas
    dist, _ = cKDTree(V[ins, :2]).query(V[:, :2])
    wall = (P != PART) & (dist < .03) & (V[:, 2] > .05)
    zw = griddata(V[body, :2], V[body, 2], V[wall, :2], method='nearest')
    low = V[wall, 2] < zw - .015
    idx = np.where(wall)[0][low]; V[idx, 2] = zw[low] - .01
    P[ins] = 0                                # mismo color que la prenda
    # panel liso de tela sobre el pecho: sigue la envolvente superior de la superficie y tapa las
    # costuras que deja la incrustación; en el borde se hunde bajo la tela para no dejar escalón
    from scipy.ndimage import gaussian_filter
    xs = np.linspace(*PANEL_X, 86); ys = np.linspace(*PANEL_Y, 136); X, Y = np.meshgrid(xs, ys)
    src = (P == 0) & (V[:, 2] > .02)                                  # frente del cuerpo hasta el contorno (sin cuello ni puños)
    # envolvente real: el punto más alto de la tela en un radio, para que nada la atraviese
    tree = cKDTree(V[src, :2]); zs = V[src, 2]
    nb = tree.query_ball_point(np.c_[X.ravel(), Y.ravel()], ENV_R)
    Z = np.array([zs[n].max() if n else np.nan for n in nb]).reshape(X.shape)
    Z = np.where(np.isnan(Z), griddata(V[src, :2], zs, (X, Y), method='nearest'), Z)
    Zs = gaussian_filter(Z, SMOOTH)                                    # superficie lisa (sin facetas)
    Z = np.maximum(Zs, gaussian_filter(Z, 1.0)) + LIFT                 # nunca por debajo de un pliegue
    from scipy.ndimage import distance_transform_edt
    from scipy.ndimage import binary_fill_holes, binary_opening
    dsil, _ = cKDTree(V[src, :2]).query(np.c_[X.ravel(), Y.ravel()]); inside = (dsil < .07).reshape(X.shape)
    inside &= (np.abs(X) < 1.12) | (Y > .45)                          # bajo las mangas no hay frente
    inside = binary_opening(binary_fill_holes(inside), iterations=2)  # silueta sin huecos internos
    e = np.clip(distance_transform_edt(inside) * (xs[1] - xs[0]) / EDGE, 0, 1); e = e * e * (3 - 2 * e)
    Z = Z - .08 * (1 - e)
    base = len(V)
    V = np.vstack([V, np.c_[X.ravel(), Y.ravel(), Z.ravel()]])
    P = np.concatenate([P, np.zeros(X.size, np.uint8)])
    nx = len(xs); r, c = np.mgrid[0:len(ys) - 1, 0:nx - 1]; i0 = (base + r * nx + c).ravel()
    ok = (inside[:-1, :-1] & inside[:-1, 1:] & inside[1:, :-1] & inside[1:, 1:]).ravel()
    i0 = i0[ok]
    quads = np.r_[np.c_[i0, i0 + 1, i0 + nx + 1], np.c_[i0, i0 + nx + 1, i0 + nx]]
    F2 = np.vstack([F2, quads]); nv = len(V)
    dt = np.uint32 if nv >= 65536 else np.uint16

    Qn = np.round(V * S).clip(-32767, 32767).astype(np.int16)

    out = bytearray(b'APXC' + struct.pack('<II', nv, len(F2)) + extra)
    out += Qn.tobytes(); out += b'\0' * ((-len(out)) % 4)
    out += P.tobytes(); out += b'\0' * ((-len(out)) % 4)
    out += F2.astype(dt).tobytes()
    open(os.path.join(d, DST), 'wb').write(bytes(out))
    print('OK', DST, int(top.sum()), 'vértices proyectados,', len(out) // 1024, 'KB')

if __name__ == '__main__': main()
