"""
APEX RIOT · calcomanías de marca para las camisetas 3D (.apxc)
==============================================================
Genera assets/img/decals/<id>-<variante>.png: logo A, "APEX RIOT" y número de la marca,
en los colores de cada variante. La mitad izquierda es el frente y la derecha la espalda.

El visor 3D (js/src/viewer3d.js) y tools/render_apxc.py proyectan la imagen sobre el modelo
en el rectángulo `decal.rect` = [x0, y0, x1, y1] del espacio del objeto (frente: x crece hacia la
derecha; espalda: espejado para que se lea desde atrás). Tapa el diseño original, cuyo relieve se aplana antes con tools/flatten_relief.py.

Uso:  python tools/build_decals.py
Requiere: Pillow, fonttools, brotli (para leer la fuente Anton .woff2).
"""
import os, io, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PX = 200                      # píxeles por unidad del modelo
SS = 2                        # supermuestreo
LOGO = [(0, 100), (40, 0), (60, 0), (100, 100), (78, 100), (50, 28), (22, 100)]
BAR = [(24, 74), (84, 56), (80, 70), (20, 88)]

def anton(size):
    if not hasattr(anton, 'ttf'):
        f = TTFont(os.path.join(ROOT, 'assets/fonts/anton-latin-400-normal.woff2')); f.flavor = None
        b = io.BytesIO(); f.save(b); anton.ttf = b.getvalue()
    return ImageFont.truetype(io.BytesIO(anton.ttf), size)

def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

class Side:
    """Lienzo de un lado (frente o espalda) en coordenadas del modelo."""
    def __init__(self, rect):
        self.x0, self.y0, self.x1, self.y1 = rect
        self.w, self.h = round((self.x1 - self.x0) * PX * SS), round((self.y1 - self.y0) * PX * SS)
        self.img = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0)); self.d = ImageDraw.Draw(self.img)
    def p(self, x, y): return ((x - self.x0) * PX * SS, (self.y1 - y) * PX * SS)
    def logo(self, cx, cy, h, fill, bar):
        s = h / 100
        tr = lambda pts: [self.p(cx + (px - 50) * s, cy - (py - 50) * s) for px, py in pts]
        self.d.polygon(tr(LOGO), fill=fill); self.d.polygon(tr(BAR), fill=bar)
    def plate(self, x0, y0, x1, y1, r, fill):
        a, b = self.p(x0, y1), self.p(x1, y0)
        self.d.rounded_rectangle([a, b], radius=r * PX * SS, fill=fill)
    def text(self, txt, cx, cy, height, fill, spacing=0.0):
        """Texto en Anton centrado en (cx, cy) con alto de mayúscula `height` (unidades del modelo)."""
        f = anton(int(height * PX * SS * 1.36))
        widths = [self.d.textlength(ch, font=f) for ch in txt]
        sp = spacing * PX * SS; total = sum(widths) + sp * (len(txt) - 1)
        x, y = self.p(cx, cy); x -= total / 2
        for ch, wd in zip(txt, widths):
            self.d.text((x, y), ch, font=f, fill=fill, anchor='lm'); x += wd + sp
    def done(self, outline, width):
        """Contorno del color de la prenda para que se lea sobre rayas; luego reduce."""
        a = self.img.getchannel('A')
        k = int(width * PX * SS) | 1
        ring = a.filter(ImageFilter.MaxFilter(k)) if k > 1 else a
        out = Image.new('RGBA', self.img.size, outline + (0,)); out.putalpha(ring)
        out.alpha_composite(self.img)
        return out.resize((self.w // SS, self.h // SS), Image.LANCZOS)

def build(p, vi, v):
    dc = p['decal']; rect = dc['rect']; num = dc['number']
    base, acc, det = hexrgb(v['base']), hexrgb(v.get('accent', v['base'])), hexrgb(v.get('detail', v.get('accent', v['base'])))
    style = dc.get('style', 'tee')
    F, B = Side(rect), Side(rect)
    if style == 'jersey':           # MX: marca grande al pecho, número de carrera atrás y en las mangas del torso
        main, second = det, acc
        F.logo(0, 1.02, .5, main, second)
        F.text('APEX', 0, .4, .4, main, .02)
        F.text('RIOT · ' + num, 0, -.1, .16, main, .05)
        B.plate(-.8, .1, .8, 1.6, .12, base)      # placa del dorsal: tapa el "9" en relieve del modelo original
        B.text(num, 0, .84, 1.2, main, .04)
        B.text('APEX RIOT', 0, -.06, .19, main, .05)
        B.logo(0, -.6, .3, main, second)
        outline = .07
    else:                            # Urban: logo protagonista al frente, número grande atrás
        main, second = acc, det
        F.logo(0, .8, .92, main, second)
        F.text('APEX RIOT', 0, .02, .19, second, .04)
        F.text('DROP ' + num, 0, -.42, .13, main, .06)
        B.text(num, 0, .62, 1.1, main, .04)       # lejos del cuello: por la abertura se ve el interior de la espalda
        B.text('RIOT', 0, -.3, .2, second, .12)
        B.logo(0, -.95, .3, main, second)
        outline = .045
    fr, bk = F.done(base, outline), B.done(base, outline)
    out = Image.new('RGBA', (fr.width * 2, fr.height), (0, 0, 0, 0)); out.paste(fr, (0, 0)); out.paste(bk, (fr.width, 0))
    return out

def main():
    prods = json.load(open(os.path.join(ROOT, 'data/products.json'), encoding='utf8'))
    outd = os.path.join(ROOT, 'assets/img/decals'); os.makedirs(outd, exist_ok=True)
    for p in prods:
        if not p.get('decal'): continue
        for vi, v in enumerate(p['variants']):
            f = os.path.join(outd, f"{p['id']}-{vi}.png")
            build(p, vi, v).save(f, optimize=True)
            print('OK', os.path.basename(f), os.path.getsize(f) // 1024, 'KB', flush=True)

if __name__ == '__main__': main()
