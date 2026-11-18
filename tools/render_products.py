"""
APEX RIOT · fotos de estudio de los productos con modelo 3D real
================================================================
Abre tools/render.html en Chrome (sin ventana), renderiza cada casco y cada
variante de color con el mismo visor 3D del sitio y guarda dos vistas
(frente 3/4 y lado opuesto) en assets/img/renders/<id>-<variante>-<vista>.webp.
Esas imágenes se usan en tarjetas, carrito y miniaturas, donde no conviene
cargar three.js.

Uso:  python -m http.server 8765   (en la raíz del proyecto, en otra terminal)
      pip install playwright pillow && playwright install chromium
      python tools/render_products.py                       (todos)
      python tools/render_products.py tee-unicornio-riot    (solo esos ids)
"""
import asyncio, io, json, os, sys
from PIL import Image
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.environ.get('APEX_URL', 'http://localhost:8765')
ACCENT = {'MX': '#C6FF00', 'MTB': '#00E5FF', 'BMX': '#FF4D00', 'URBAN': '#F2F2EE'}
VIEWS = {'front': 0, 'back': 3.1416}

async def main():
    want = set(sys.argv[1:])
    prods = [p for p in json.load(open(os.path.join(ROOT, 'data/products.json'), encoding='utf-8')) if p.get('model') and (not want or p['id'] in want)]
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path=os.environ.get('CHROME') or None,
                                     args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 400, 'height': 440}, device_scale_factor=2)
        for p in prods:
            for vi in range(len(p['variants'])):
                for view, rot in VIEWS.items():
                    url = f"{BASE}/tools/render.html?id={p['id']}&v={vi}&rot={rot}&accent={ACCENT[p['category']].replace('#', '%23')}"
                    await pg.goto(url)
                    await pg.wait_for_function('window.ready === true', timeout=60000)
                    png = await pg.locator('#stage').screenshot(omit_background=True)
                    out = os.path.join(ROOT, 'assets/img/renders', f"{p['id']}-{vi}-{view}.webp")
                    Image.open(io.BytesIO(png)).save(out, 'WEBP', quality=84, method=6)
                    print('OK', os.path.relpath(out, ROOT))
        await b.close()

asyncio.run(main())
