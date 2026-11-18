"""
APEX RIOT · fotos de estudio de los modelos .apxc (jersey, camiseta, gafas)
===========================================================================
Genera assets/img/renders/<id>-<variante>-<front|back>.webp (800x880, fondo transparente)
a partir de los modelos 3D que usa el visor, con la calcomanía de marca si el producto tiene `decal`
(generada antes con tools/build_decals.py). Es lo que se ve en tarjetas y miniaturas.
No necesita navegador: rasteriza con numpy (z-buffer + sombreado Gouraud + 2x2 antialias).

Uso:  python tools/render_apxc.py            (todos los productos con modelo .apxc)
      python tools/render_apxc.py tee-unicornio-riot
Requiere: numpy, Pillow.
"""
import sys, os, json, struct
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, SS = 800, 880, 2

def load_apxc(path):
    b = open(path, 'rb').read(); assert b[:4] == b'APXC'
    nv, nf = struct.unpack('<II', b[4:12]); a = 28
    V = np.frombuffer(b[a:a + nv * 6], np.int16).reshape(-1, 3).astype(np.float64) / 32767 * 2.15; a += nv * 6; a += (-a) % 4
    P = np.frombuffer(b[a:a + nv], np.uint8); a += nv; a += (-a) % 4
    dt, n = (np.uint32, 4) if nv >= 65536 else (np.uint16, 2)
    F = np.frombuffer(b[a:a + nf * 3 * n], dt).reshape(-1, 3).astype(np.int64)
    return V, F, P

def hex2rgb(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float) / 255

def decal_sampler(path, rect):
    """Calcomanía (tools/build_decals.py): mitad izquierda = frente, derecha = espalda (espejada)."""
    if not path or not os.path.exists(path): return None
    D = np.asarray(Image.open(path).convert('RGBA'), np.float32) / 255; h, w2 = D.shape[:2]; w = w2 // 2
    x0, y0, x1, y1 = rect
    def sample(x, y, nz):
        front = nz >= 0
        u = (x - x0) / (x1 - x0); u = np.where(front, u, 1 - u); v = (y1 - y) / (y1 - y0)
        inside = (u >= 0) & (u < 1) & (v >= 0) & (v < 1)
        cx = np.clip((u * w).astype(int), 0, w - 1) + np.where(front, 0, w); cy = np.clip((v * h).astype(int), 0, h - 1)
        px = D[cy, cx]; a = px[..., 3] * inside
        return px[..., :3], a
    return sample

def render(V, F, P, cols, yaw_deg, plastic, decal=None):
    y = np.radians(yaw_deg)
    R = np.array([[np.cos(y), 0, np.sin(y)], [0, 1, 0], [-np.sin(y), 0, np.cos(y)]])
    X = V @ R.T
    tri = X[F]                                           # (nf,3,3)
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); fl = np.linalg.norm(fn, axis=1, keepdims=True)
    fn = fn / np.maximum(fl, 1e-12)
    if plastic: vn = np.repeat(fn[:, None, :], 3, axis=1)                # aristas duras (ladrillo)
    else:                                                                  # suave para tela
        acc = np.zeros_like(X)
        for k in range(3): np.add.at(acc, F[:, k], fn * fl)
        acc /= np.maximum(np.linalg.norm(acc, axis=1, keepdims=True), 1e-12); vn = acc[F]
    vn = vn * np.where(fn[:, 2] < 0, -1.0, 1.0)[:, None, None]            # doble cara: siempre hacia la cámara
    nrm = lambda v: np.array(v) / np.linalg.norm(v)
    key, fill, rim = nrm([-.45, .65, .62]), nrm([.75, .1, .5]), nrm([.1, .55, -.8])
    base = np.stack([cols[p] for p in P[F[:, 0]]])                         # color por triángulo
    n = vn
    amb = .34 + .10 * n[..., 1]
    dk = np.clip(n @ key, 0, 1) * .78; df = np.clip(n @ fill, 0, 1) * .22
    lum = (amb + dk + df)                                                  # luz difusa por vértice
    acc_c = cols[1] * .65 + .35
    add = (np.clip(n @ rim, 0, 1) ** 1.5 * .55)[..., None] * acc_c         # contraluz + brillo por vértice
    if plastic:
        hv = nrm(key + np.array([0, 0, 1])); add = add + (np.clip(n @ hv, 0, 1) ** 34 * .55)[..., None]
    else:
        add = add + ((1 - np.clip(n[..., 2], 0, 1)) ** 3 * .10)[..., None] * (base[:, None, :] * .5 + .5)
    col = np.clip(base[:, None, :] * lum[..., None] + add, 0, 1)
    if decal:                                                              # normales del objeto (sin girar) para elegir frente/espalda
        on = np.zeros_like(V); fo = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
        for k in range(3): np.add.at(on, F[:, k], fo)
        onz = on[:, 2] / np.maximum(np.linalg.norm(on, axis=1), 1e-12)
    w, h = W * SS, H * SS
    lo, hi = X.min(0), X.max(0); sc = min(w * .86 / (hi[0] - lo[0]), h * .84 / (hi[1] - lo[1]))
    px = (X[:, 0] - (lo[0] + hi[0]) / 2) * sc + w / 2; py = h * .47 - (X[:, 1] - (lo[1] + hi[1]) / 2) * sc
    pz = X[:, 2]
    img = np.zeros((h, w, 3), np.float32); zb = np.full((h, w), -1e9, np.float32); al = np.zeros((h, w), np.float32)
    for fi in range(len(F)):
        a, b, c = F[fi]
        xa, xb, xc, ya, yb, yc = px[a], px[b], px[c], py[a], py[b], py[c]
        x0, x1 = int(max(0, np.floor(min(xa, xb, xc)))), int(min(w - 1, np.ceil(max(xa, xb, xc))))
        y0, y1 = int(max(0, np.floor(min(ya, yb, yc)))), int(min(h - 1, np.ceil(max(ya, yb, yc))))
        if x1 < x0 or y1 < y0: continue
        den = (yb - yc) * (xa - xc) + (xc - xb) * (ya - yc)
        if abs(den) < 1e-9: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        w1 = ((yb - yc) * (xs - xc) + (xc - xb) * (ys - yc)) / den; w2 = ((yc - ya) * (xs - xc) + (xa - xc) * (ys - yc)) / den; w3 = 1 - w1 - w2
        m = (w1 >= -1e-3) & (w2 >= -1e-3) & (w3 >= -1e-3)
        if not m.any(): continue
        z = w1 * pz[a] + w2 * pz[b] + w3 * pz[c]
        sub = zb[y0:y1 + 1, x0:x1 + 1]; up = m & (z > sub)
        if not up.any(): continue
        sub[up] = z[up]; al[y0:y1 + 1, x0:x1 + 1][up] = 1
        cc = (w1[..., None] * col[fi, 0] + w2[..., None] * col[fi, 1] + w3[..., None] * col[fi, 2])
        if decal:
            ox = w1 * V[a, 0] + w2 * V[b, 0] + w3 * V[c, 0]; oy = w1 * V[a, 1] + w2 * V[b, 1] + w3 * V[c, 1]
            nz = w1 * onz[a] + w2 * onz[b] + w3 * onz[c]
            drgb, da = decal(ox, oy, nz)
            if da.any():
                L = w1 * lum[fi, 0] + w2 * lum[fi, 1] + w3 * lum[fi, 2]
                AD = w1[..., None] * add[fi, 0] + w2[..., None] * add[fi, 1] + w3[..., None] * add[fi, 2]
                bc = base[fi] * (1 - da[..., None]) + drgb * da[..., None]
                cc = np.clip(bc * L[..., None] + AD, 0, 1)
        img[y0:y1 + 1, x0:x1 + 1][up] = cc[up]
    # reducir 2x2 (antialias) con alfa premultiplicado
    pm = img * al[..., None]
    pm = pm.reshape(H, SS, W, SS, 3).mean((1, 3)); a2 = al.reshape(H, SS, W, SS).mean((1, 3))
    rgb = np.where(a2[..., None] > 1e-4, pm / np.maximum(a2[..., None], 1e-4), 0)
    out = np.dstack([np.clip(rgb * 255, 0, 255), a2 * 255]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    # sombra de contacto suave
    ys_, xs_ = np.where(a2 > .5); bx0, bx1, by1 = xs_.min(), xs_.max(), ys_.max()
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = Image.new('L', (W, H), 0)
    ImageFilter  # noqa
    from PIL import ImageDraw
    ImageDraw.Draw(d).ellipse([bx0 + (bx1 - bx0) * .12, by1 - 16, bx1 - (bx1 - bx0) * .12, by1 + 26], fill=120)
    sh.putalpha(d.filter(ImageFilter.GaussianBlur(16))); sh = Image.alpha_composite(sh, im)
    return sh

def main():
    want = set(sys.argv[1:])
    prods = json.load(open(os.path.join(ROOT, 'data/products.json'), encoding='utf8'))
    outd = os.path.join(ROOT, 'assets/img/renders'); os.makedirs(outd, exist_ok=True)
    for p in prods:
        if not (p.get('model') or '').endswith('.apxc') or (want and p['id'] not in want): continue
        V, F, P = load_apxc(os.path.join(ROOT, p['model']))
        for vi, v in enumerate(p['variants']):
            dc = p.get('decal')
            decal = decal_sampler(os.path.join(ROOT, f"assets/img/decals/{p['id']}-{vi}.png"), dc['rect']) if dc else None
            cols = [hex2rgb(v['base']), hex2rgb(v.get('accent', v['base'])), hex2rgb(v.get('detail', v.get('accent', v['base'])))]
            for view, yaw in (('front', -22), ('back', 158)):
                f = os.path.join(outd, f"{p['id']}-{vi}-{view}.webp")
                render(V, F, P, cols, yaw, p.get('finish') == 'plastic', decal).save(f, 'WEBP', quality=86, method=6)
                print('OK', os.path.basename(f), os.path.getsize(f) // 1024, 'KB', flush=True)

if __name__ == '__main__': main()
