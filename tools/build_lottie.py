"""
APEX Ignition · generador de la animación Lottie del equipo
===========================================================
Construye assets/lottie/apex-ignition.json (1280x720, 30 fps, 6 s)
a partir de la geometría del logo y de las tipografías de la marca
(Anton y Barlow, licencia OFL). Las letras se convierten a trazos
vectoriales, así el Lottie no depende de fuentes instaladas.

Guion (frames a 30 fps):
  0–30    Un trazo de neón Ácido dibuja el contorno de la "A".
  30–40   Ignición: la A se rellena de golpe, destello y barra.
  30–70   Speed lines salen disparadas en diagonal.
  60–100  "APEX RIOT" entra letra por letra con glitch cian/naranja.
  105–150 Eslogan + chispas que salen de la A.
  150–180 Estado final estático (sello / loop).

Uso:  pip install fonttools brotli
      python tools/build_lottie.py
El JSON resultante se puede abrir y editar en LottieFiles o After Effects
(con el plugin Bodymovin importando el JSON).
"""
import json, math, os, random
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(ROOT, 'assets', 'fonts')
OUT = os.path.join(ROOT, 'assets', 'lottie', 'apex-ignition.json')

W, H, FR, OP = 1280, 720, 30, 180
ACIDO, IGN, ELECTRO, HUESO, ASFALTO, HUMO = '#C6FF00', '#FF4D00', '#00E5FF', '#F2F2EE', '#0B0B0D', '#A3A6AD'
random.seed(7)

# ---------- utilidades Lottie ----------
def rgb(h):
    h = h.lstrip('#'); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1]

EASE = {
    'out':    ({'x': [.16], 'y': [1]},   {'x': [.3], 'y': [1]}),     # expo.out
    'in':     ({'x': [.7], 'y': [0]},    {'x': [.84], 'y': [0]}),    # expo.in
    'inout':  ({'x': [.76], 'y': [0]},   {'x': [.24], 'y': [1]}),
    'back':   ({'x': [.34], 'y': [1.56]},{'x': [.64], 'y': [1]}),    # sobrepaso (anticipación inversa)
    'linear': ({'x': [0], 'y': [0]},     {'x': [1], 'y': [1]}),
}

def static(v): return {'a': 0, 'k': v}

def anim(keys, ease='out'):
    """keys: lista de (frame, valor) o (frame, valor, ease|'hold')."""
    out = []
    for n, k in enumerate(keys):
        t, v = k[0], k[1]
        e = k[2] if len(k) > 2 else ease
        val = v if isinstance(v, list) else [v]
        kf = {'t': t, 's': val}
        if n < len(keys) - 1:
            if e == 'hold':
                kf['h'] = 1
            else:
                o, i = EASE[e]
                dims = len(val)
                kf['o'] = {'x': o['x'] * dims, 'y': o['y'] * dims}
                kf['i'] = {'x': i['x'] * dims, 'y': i['y'] * dims}
        out.append(kf)
    return {'a': 1, 'k': out}

def tr(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    return {'ty': 'tr', 'p': static(list(p)), 'a': static(list(a)), 's': static(list(s)),
            'r': static(r), 'o': static(o), 'sk': static(0), 'sa': static(0)}

def ks(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    def f(v, n):
        if isinstance(v, dict): return v
        if isinstance(v, (list, tuple)): return static(list(v) + [0] * (n - len(v)))
        return static(v)
    return {'o': f(o, 0), 'r': f(r, 0), 'p': f(p, 3), 'a': f(a, 3), 's': f(s, 3)}

def fill(c, o=100): return {'ty': 'fl', 'c': static(rgb(c)), 'o': static(o) if not isinstance(o, dict) else o, 'r': 2, 'bm': 0}
def stroke(c, w, o=100): return {'ty': 'st', 'c': static(rgb(c)), 'o': static(o) if not isinstance(o, dict) else o, 'w': static(w), 'lc': 2, 'lj': 2, 'ml': 4, 'bm': 0}
def group(items, name='g', transform=None): return {'ty': 'gr', 'nm': name, 'it': items + [transform or tr()]}

def path(points, closed=True):
    """points: lista de vértices (x, y) con tangentes nulas (líneas rectas)."""
    return {'ty': 'sh', 'ks': static({'v': [list(p) for p in points], 'i': [[0, 0]] * len(points), 'o': [[0, 0]] * len(points), 'c': closed})}

LAYERS = []
def layer(name, shapes, k=None, ip=0, op=OP):
    LAYERS.append({'ddd': 0, 'ind': len(LAYERS) + 1, 'ty': 4, 'nm': name, 'sr': 1, 'ks': k or ks(),
                   'ao': 0, 'shapes': shapes, 'ip': ip, 'op': op, 'st': 0, 'bm': 0})

# ---------- tipografía -> trazos ----------
class LottiePen(BasePen):
    def __init__(self, gs, scale, dx, dy):
        super().__init__(gs); self.k, self.dx, self.dy = scale, dx, dy; self.contours = []; self.cur = None
    def P(self, p): return [round(self.dx + p[0] * self.k, 2), round(self.dy - p[1] * self.k, 2)]
    def _moveTo(self, p): self.cur = {'v': [self.P(p)], 'i': [[0, 0]], 'o': [[0, 0]]}
    def _lineTo(self, p): self.cur['v'].append(self.P(p)); self.cur['i'].append([0, 0]); self.cur['o'].append([0, 0])
    def _curveToOne(self, c1, c2, p):
        v0 = self.cur['v'][-1]; c1, c2, p = self.P(c1), self.P(c2), self.P(p)
        self.cur['o'][-1] = [round(c1[0] - v0[0], 2), round(c1[1] - v0[1], 2)]
        self.cur['v'].append(p); self.cur['i'].append([round(c2[0] - p[0], 2), round(c2[1] - p[1], 2)]); self.cur['o'].append([0, 0])
    def _closePath(self):
        c = self.cur
        if len(c['v']) > 1 and abs(c['v'][0][0] - c['v'][-1][0]) < .01 and abs(c['v'][0][1] - c['v'][-1][1]) < .01:
            c['i'][0] = c['i'][-1]; c['v'].pop(); c['i'].pop(); c['o'].pop()
        c['c'] = True; self.contours.append(c); self.cur = None
    _endPath = _closePath

def text_glyphs(text, fontfile, size, cx, baseline, tracking=0):
    """Devuelve [(char, [contornos], x_inicio, ancho)] centrado en cx."""
    f = TTFont(os.path.join(FONTS, fontfile)); gs = f.getGlyphSet(); cmap = f.getBestCmap()
    upm = f['head'].unitsPerEm; k = size / upm; hmtx = f['hmtx']
    names = [cmap[ord(ch)] for ch in text]
    widths = [hmtx[n][0] * k + tracking for n in names]
    x = cx - (sum(widths) - tracking) / 2; out = []
    for ch, n, w in zip(text, names, widths):
        pen = LottiePen(gs, k, x, baseline); gs[n].draw(pen)
        out.append((ch, pen.contours, x, w)); x += w
    return out

def contours_shapes(contours): return [{'ty': 'sh', 'ks': static(c)} for c in contours]

# ---------- geometría del logo ----------
LOGO_A = [(0, 100), (40, 0), (60, 0), (100, 100), (78, 100), (50, 28), (22, 100)]
LOGO_BAR = [(24, 74), (84, 56), (80, 70), (20, 88)]
LS = 1.9                          # escala del logo
LX, LY = W / 2 - 50 * LS, 150     # esquina superior izquierda del logo
def L(pts): return [(LX + x * LS, LY + y * LS) for x, y in pts]
CENTER = (W / 2, LY + 50 * LS)

# ---------- capas (la primera queda arriba) ----------
# 1. Destello de ignición
layer('destello', [group([{'ty': 'rc', 'p': static([W / 2, H / 2]), 's': static([W, H]), 'r': static(0)}, fill(HUESO)])],
      ks(o=anim([(30, 0, 'linear'), (32, 55, 'out'), (42, 0)])))

# 2. Eslogan
slogan = text_glyphs('VIVE AL LÍMITE. DOMINA EL CAOS.', 'barlow-latin-600-normal.woff2', 26, W / 2, 592, tracking=5)
layer('eslogan', [group(sum((contours_shapes(c) for _, c, _, _ in slogan), []) + [fill(HUMO)])],
      ks(p=anim([(108, [0, 24]), (128, [0, 0])]), o=anim([(108, 0), (124, 100)])))
# línea bajo el eslogan que se estira desde el centro
layer('linea eslogan', [group([path([(W / 2 - 160, 622), (W / 2 + 160, 622)], False), stroke(ACIDO, 3)])],
      ks(p=[W / 2, 622], a=[W / 2, 622], s=anim([(112, [0, 100]), (134, [100, 100])], 'inout')))

# 3. Nombre: capas de glitch (cian y naranja) + letras
name = text_glyphs('APEX RIOT', 'anton-latin-400-normal.woff2', 104, W / 2, 530, tracking=10)
all_name = sum((contours_shapes(c) for _, c, _, _ in name), [])
glitch_frames = [(60, 0, 'hold'), (62, 85, 'hold'), (64, 0, 'hold'), (71, 70, 'hold'), (73, 0, 'hold'), (80, 90, 'hold'), (82, 0, 'hold'), (93, 60, 'hold'), (95, 0)]
for nm_, col, off in (('glitch cian', ELECTRO, -9), ('glitch naranja', IGN, 9)):
    layer(nm_, [group(all_name + [fill(col)])],
          ks(p=anim([(60, [off, 0], 'hold'), (71, [off * 1.6, -3], 'hold'), (80, [off * .6, 2], 'hold'), (93, [off, 0])]), o=anim(glitch_frames)))
for idx, (ch, cont, x, w) in enumerate(name):
    if not cont: continue
    t0 = 60 + idx * 4
    layer('letra ' + ch, [group(contours_shapes(cont) + [fill(HUESO)])],
          ks(p=anim([(t0, [0, 46]), (t0 + 14, [0, 0])]), o=anim([(t0, 0, 'hold'), (t0 + 1, 100)])))

# 4. Chispas que salen de la A
for n in range(18):
    ang = random.uniform(0, math.tau); dist = random.uniform(140, 330); t0 = 104 + random.randint(0, 10)
    ex, ey = CENTER[0] + math.cos(ang) * dist, CENTER[1] + math.sin(ang) * dist * .7
    r = random.uniform(3, 7); col = random.choice([ACIDO, ACIDO, ELECTRO, HUESO])
    layer(f'chispa {n}', [group([{'ty': 'el', 'p': static([0, 0]), 's': static([r * 2, r * 2])}, fill(col)])],
          ks(p=anim([(t0, list(CENTER)), (t0 + 36, [ex, ey])]), s=anim([(t0, [100, 100]), (t0 + 36, [10, 10])], 'in'),
             o=anim([(t0, 0, 'hold'), (t0 + 1, 100, 'linear'), (t0 + 24, 100, 'linear'), (t0 + 36, 0)])), ip=t0, op=t0 + 37)

# 5. Speed lines en diagonal
for n in range(10):
    t0 = 30 + n * 3 + random.randint(0, 3); y = random.uniform(80, 660); lw = random.uniform(140, 420); th = random.choice([2, 3, 4, 6])
    col = ACIDO if n % 3 else ELECTRO
    layer(f'speed line {n}', [group([{'ty': 'rc', 'p': static([0, 0]), 's': static([lw, th]), 'r': static(th / 2)}, fill(col)])],
          ks(p=anim([(t0, [-300, y + 120]), (t0 + 22, [W + 300, y - 200])], 'in'), r=-14,
             o=anim([(t0, 0, 'linear'), (t0 + 3, random.choice([60, 80, 100]), 'linear'), (t0 + 18, 80, 'linear'), (t0 + 22, 0)])), ip=t0, op=t0 + 23)

# 6. Barra cruzada (acento ácido) — entra con sobrepaso
bar = L(LOGO_BAR)
layer('barra', [group([path(bar), fill(ACIDO)])],
      ks(p=list(bar[3]), a=list(bar[3]), s=anim([(32, [0, 100]), (44, [100, 100])], 'back'), o=anim([(31, 0, 'hold'), (32, 100)])))

# 7. Relleno de la A (golpe seco al encenderse)
layer('A relleno', [group([path(L(LOGO_A)), fill(HUESO)])],
      ks(p=list(CENTER), a=list(CENTER), s=anim([(30, [86, 86]), (40, [100, 100])], 'back'), o=anim([(29, 0, 'hold'), (30, 100)])))

# 8. Trazo de neón que dibuja la A
layer('A trazo', [group([path(L(LOGO_A)), path(bar),
                         {'ty': 'tm', 's': static(0), 'e': anim([(2, 0), (30, 100)], 'inout'), 'o': static(0), 'm': 1},
                         stroke(ACIDO, 4)])],
      ks(o=anim([(30, 100), (44, 0)])))

# 9. Halo detrás de la A
def radial(c, cx, cy, r):
    k = rgb(c)[:3]
    return {'ty': 'gf', 'o': static(100), 'r': 1, 't': 2, 's': static([cx, cy]), 'e': static([cx + r, cy]),
            'h': static(0), 'a': static(0), 'g': {'p': 2, 'k': static([0] + k + [1] + k + [0, 1, 1, 0])}, 'bm': 0}
layer('halo', [group([{'ty': 'el', 'p': static(list(CENTER)), 's': static([520, 520])}, radial(ACIDO, CENTER[0], CENTER[1], 260)])],
      ks(p=list(CENTER), a=list(CENTER), s=anim([(28, [40, 40]), (60, [120, 120])]), o=anim([(28, 0, 'linear'), (32, 45), (90, 18)])))

# 10. Retícula técnica de fondo
grid = []
for gx in range(0, W + 1, 80): grid.append(path([(gx, 0), (gx, H)], False))
for gy in range(0, H + 1, 80): grid.append(path([(0, gy), (W, gy)], False))
layer('reticula', [group(grid + [stroke(HUESO, 1)])], ks(o=anim([(0, 0), (40, 5)])))

# 11. Fondo
LAYERS.append({'ddd': 0, 'ind': len(LAYERS) + 1, 'ty': 1, 'nm': 'fondo', 'sr': 1, 'ks': ks(), 'ao': 0,
               'sw': W, 'sh': H, 'sc': ASFALTO, 'ip': 0, 'op': OP, 'st': 0, 'bm': 0})

doc = {'v': '5.7.4', 'fr': FR, 'ip': 0, 'op': OP, 'w': W, 'h': H, 'nm': 'APEX Ignition', 'ddd': 0, 'assets': [], 'layers': LAYERS,
       'meta': {'g': 'APEX RIOT · tools/build_lottie.py', 'a': 'Equipo APEX RIOT', 'd': 'Pieza original: logo animado de 6 s'}}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w') as fh: json.dump(doc, fh, separators=(',', ':'))
print(f'OK {OUT} · {len(LAYERS)} capas · {os.path.getsize(OUT) / 1024:.1f} KB')
