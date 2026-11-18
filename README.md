# APEX RIOT · Vive al límite. Domina el caos.

[![Ver sitio en Vercel](https://img.shields.io/badge/Ver%20sitio-apex--riot.vercel.app-C6FF00?style=for-the-badge&logo=vercel&logoColor=black&labelColor=0B0B0D)](https://apex-riot.vercel.app/)

**🔗 Sitio publicado: [apex-riot.vercel.app](https://apex-riot.vercel.app/)**

Sitio web de una tienda **ficticia** de ropa técnica para motocross, MTB y calle, construido para el proyecto
*"Sitio web con motion design para una tienda de ropa"*. El motion design es el núcleo: cada animación tiene una
intención documentada en la [guía de movimiento](docs/guia-movimiento.md).

> No se vende nada. El carrito y el pago son simulados.

- **Sitio publicado:** <https://apex-riot.vercel.app/> (Vercel, se actualiza con cada `git push` a `main`)
- **Páginas:** [Inicio](https://apex-riot.vercel.app/) · [Catálogo](https://apex-riot.vercel.app/catalogo.html) · [Detalle (casco)](https://apex-riot.vercel.app/producto.html?id=casco-apex-pro) · [Tee APEX RIOT 21](https://apex-riot.vercel.app/producto.html?id=tee-unicornio-riot) · [Carrito](https://apex-riot.vercel.app/carrito.html) · [Nosotros](https://apex-riot.vercel.app/nosotros.html) · [Contacto](https://apex-riot.vercel.app/contacto.html)

---

## Requisitos del proyecto y dónde se cumplen

| Requisito | Dónde está |
|---|---|
| 6 páginas | `index.html`, `catalogo.html`, `producto.html`, `carrito.html`, `nosotros.html`, `contacto.html` |
| Guía de marca (1 página) | [`docs/guia-de-marca.md`](docs/guia-de-marca.md) |
| Hero animado | `index.html` + `js/pages/home.js`: intro "Speed Cut", selector de deporte (MX, MTB, BMX, Urban) y prenda en 3D que se puede girar |
| Modelos interactivos | Visor 3D propio (`js/src/viewer3d.js`, three.js) en el hero y en el detalle: **casco de motocross real** (STL del equipo, 50.000 triángulos, pintura con laca) y prendas modeladas desde su silueta. Arrastrar para girar 360°, frente/espalda, detalle, cambio de color con giro |
| Intro de disciplina | Al tocar un deporte, su panel se expande a pantalla completa (`clip-path`) y entra al catálogo filtrado; admite video propio por deporte (`MEDIA` en `js/pages/home.js`) |
| Transiciones entre páginas | Wipe diagonal en `css/styles.css` §04 + `js/core.js` (`initTransitions`); FLIP de la tarjeta al detalle |
| Transiciones entre secciones | Cortes diagonales (`.slant--top`, `clip-path`) |
| Animaciones al hacer scroll | Reveals, parallax por capas, pin horizontal "Elige tu disciplina", manifiesto, contadores, línea de tiempo |
| Micro-interacciones producto/carrito | Botón "A romperla" con estados, vuelo al carrito, badge, barra de envío "turbo", eliminar ítem, selector de talla, tilt 3D de tarjetas |
| Fluidez | Scroll suave (Lenis) sincronizado con GSAP, precarga de páginas al pasar el puntero, color del deporte interpolado (`@property --mode`) |
| Pieza original | **APEX Ignition** (Lottie): `assets/lottie/apex-ignition.json`, generada con `tools/build_lottie.py`, visible en Nosotros |
| Responsive | Probado a 390 px (móvil), 768 px (tableta) y 1440 px (escritorio) |
| Lighthouse ≥ 80 móvil | Ver [`docs/lighthouse.md`](docs/lighthouse.md) |
| Reducir movimiento + contraste | Clase `.rm` (sistema operativo **o** botón MOTION del header), contraste AA |
| Material libre y citado | Ver [Créditos y licencias](#créditos-y-licencias) |

## Estructura

```
apex-riot/
├── index.html · catalogo.html · producto.html · carrito.html · nosotros.html · contacto.html
├── css/styles.css            # Tokens de marca, componentes y páginas (secciones numeradas)
├── js/
│   ├── core.js               # Movimiento, transiciones, modos de deporte, carrito, tarjetas, reveals, scroll suave
│   ├── garments.js           # Ilustraciones SVG de las prendas + siluetas para el 3D (originales)
│   ├── pages/                # Un archivo por página
│   ├── src/viewer3d.js       # Fuente del visor 3D (se compila con esbuild)
│   ├── 3d/viewer3d.min.js    # Visor 3D compilado (three.js + Delaunator), se carga bajo demanda
│   └── vendor/               # GSAP 3.15 (core, ScrollTrigger, Flip), Lenis 1.3 y lottie-web 5.13 (light)
├── data/products.json        # Catálogo: 26 productos en 4 deportes (cascos, gafas, protecciones, ropa), con variantes y tallas
├── package.json              # Solo para recompilar el visor 3D (npm run build:3d)
├── assets/
│   ├── fonts/                # Anton, Barlow 400/600, Space Mono (woff2 autoalojadas)
│   ├── lottie/apex-ignition.json
│   ├── models/helmet-mx.bin  # Casco 3D optimizado (de 15 MB a 450 KB)
│   ├── models/*.apxc         # Jersey a rayas, camiseta (tee-apex, sin el dibujo original) y gafas 3D. Créditos: docs/creditos-modelos-3d.md
│   ├── img/decals/           # Calcomanías de marca (logo A, APEX RIOT, 07 / 21) que el visor estampa en jersey y camiseta
│   └── img/                  # favicon y renders/ (fotos de estudio del casco generadas con el visor)
├── tools/build_lottie.py     # Genera la pieza original en Lottie
├── tools/build_helmet.py     # Reduce el STL del casco y lo convierte al formato del visor
├── tools/build_models_3mf.py # Convierte modelos .3mf (jersey, camiseta, gafas) al formato .apxc del visor (solo numpy + scipy)
├── tools/render_apxc.py      # Fotos de estudio (webp) de los modelos .apxc para tarjetas y miniaturas (solo numpy + Pillow)
├── tools/render_products.py  # Fotos de estudio con el visor real (casco, jersey y camiseta) vía tools/render.html
├── tools/build_decals.py     # Genera las calcomanías de marca de las camisetas
├── tools/flatten_relief.py   # Quita el dibujo en relieve de la camiseta original (tools/models-src/)
├── vercel.json · .vercelignore  # Publicación en Vercel
└── docs/                     # Guía de marca, guía de movimiento, informe Lighthouse
```

## Cómo correrlo en local

El catálogo se carga con `fetch('data/products.json')`, así que **hay que abrirlo desde un servidor**
(abrir el archivo con doble clic no funciona).

```bash
# Opción 1: extensión "Live Server" de VS Code → clic derecho en index.html → Open with Live Server
# Opción 2: Python
python3 -m http.server 8000      # y abrir http://localhost:8000
# Opción 3: Node
npx serve .
```

El sitio funciona tal cual, sin compilar: es HTML, CSS y JavaScript sin frameworks. Solo si cambian
`js/src/viewer3d.js` hay que recompilar el visor:

```bash
npm install          # instala three, delaunator y esbuild (solo desarrollo)
npm run build:3d     # genera js/3d/viewer3d.min.js
```

## Modos de deporte y visor 3D

- **Modos:** MX (Ácido), MTB (Electro), BMX (Ignición) y Urban (Hueso). El selector del hero cambia el titular,
  los datos de telemetría, el color de acento de toda la interfaz y la prenda 3D. El catálogo y el detalle de
  producto también activan el modo de su deporte. La elección se recuerda en el navegador (`apex-mode`).
- **Cómo se modelan las prendas:** el visor toma la silueta de cada prenda (`garmentSilhouette` en `garments.js`),
  la triangula, la "infla" según la distancia al borde (con curvatura de torso y arrugas suaves) y le pinta el mismo
  diseño SVG del catálogo como textura: frente adelante, espalda atrás. Usa material de tela físico (sheen y mapa de
  normales de tejido: malla, algodón, felpa o lona), luz de estudio y una contraluz del color del deporte.
- **Rendimiento:** three.js (~145 KB comprimido) se descarga **en la primera interacción** (mover el mouse, tocar,
  hacer scroll o usar el teclado). Mientras tanto se ve la ilustración SVG. El render se pausa cuando el visor sale
  de pantalla o la pestaña se oculta. Sin WebGL, se queda la galería 2D.
- **Casco real:** `tools/build_helmet.py` reduce el STL de 300.000 a 50.000 triángulos (trimesh + fast-simplification)
  y lo guarda cuantizado (450 KB). El visor calcula normales con aristas marcadas, oscurece el forro y proyecta la
  decoración de la marca de perfil, con texto legible en ambos lados. `tools/render_products.py` usa ese mismo visor
  para generar las fotos `.webp` de las tarjetas, así no hace falta three.js para mostrar el catálogo.
- **Equipo por deporte:** las prendas BMX siguen las reglas de carrera de USA BMX (manga larga, pantalón largo,
  guantes y casco integral recomendado): ver [USA BMX · Gear](https://www.usabmx.com/about/gear).

## Publicar en Vercel (desde GitHub)

El sitio es estático: Vercel lo sirve tal cual, sin instalar dependencias ni compilar.
La configuración ya está en el repositorio:

- `vercel.json`: sin *framework*, sin instalación (`installCommand: ""`), URLs con `.html`
  (las páginas se enlazan como `producto.html?id=…`) y caché larga para fuentes, imágenes, modelos 3D y librerías.
- `.vercelignore`: no sube `tools/`, `docs/`, `js/src/`, `node_modules/` ni `package.json` (solo sirven para desarrollo).

Pasos:

1. Subir el proyecto a un repositorio de GitHub (`git init -b main`, `git add .`, `git commit`, `git push`).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importar el repositorio.
3. En la configuración del proyecto dejar **Framework Preset: Other**, **Root Directory: `./`**
   y los comandos vacíos (los define `vercel.json`). Clic en **Deploy**.
4. Cada `git push` a `main` publica una nueva versión; cada *pull request* genera una URL de vista previa.
5. Medir Lighthouse sobre <https://apex-riot.vercel.app/> (Chrome → incógnito → DevTools → Lighthouse → *Mobile*).

> Importante: `js/3d/viewer3d.min.js`, `assets/img/renders/*.webp`, `assets/img/decals/*.png` y
> `assets/models/tee-apex.apxc` son archivos generados **que se suben al repositorio**. Vercel no los vuelve a generar.
> Si se cambia el visor, una calcomanía o un modelo, regenerarlos en local (ver abajo) y hacer *commit*.

### Regenerar recursos (solo en local)

```bash
npm install && npm run build:3d                     # visor 3D → js/3d/viewer3d.min.js
pip install pillow fonttools brotli numpy scipy
python tools/flatten_relief.py                      # camiseta sin el dibujo original → assets/models/tee-apex.apxc
python tools/build_decals.py                        # logo y números de la marca → assets/img/decals/
python -m http.server 8765 &                        # en otra terminal
APEX_URL=http://localhost:8765 python tools/render_products.py tee-unicornio-riot jersey-stripes-riot
```

## Trabajo en equipo con Git

La rúbrica revisa el historial: **cada integrante debe hacer commits**. Flujo recomendado:

```bash
git checkout -b feat/nombre-de-la-tarea     # una rama por tarea
git add . && git commit -m "feat(carrito): animación al eliminar ítem"
git push -u origin feat/nombre-de-la-tarea  # y abrir un Pull Request para que otro lo revise
```

Reparto sugerido de archivos por rol:

| Rol | Archivos principales |
|---|---|
| Líder / UX | `docs/`, `README.md`, textos de las páginas, pruebas en móvil |
| Diseñador visual | `css/styles.css` (§01–§13), `js/garments.js`, `assets/img/` |
| Motion designer | `tools/build_lottie.py`, `assets/lottie/`, `js/pages/home.js`, `js/src/viewer3d.js`, `docs/guia-movimiento.md` |
| Desarrollador | `js/core.js`, `js/pages/*.js`, `data/products.json`, publicación |

### Editar contenidos frecuentes

- **Productos:** `data/products.json`. Tipos disponibles en `type` (2D y 3D): `jersey`, `jerseyLS` (manga larga), `pants`, `hoodie`, `tee`, `cap`, `gloves`. Deportes en `category`: `MX`, `MTB`, `BMX`, `URBAN`.
- **Header y footer:** están repetidos en las 6 páginas HTML; si cambian un enlace, cámbienlo en todas.
- **Pieza Lottie:** editar `tools/build_lottie.py` y ejecutar `pip install fonttools brotli && python tools/build_lottie.py`.
  El JSON también se puede abrir en [LottieFiles](https://lottiefiles.com) para revisarlo o ajustarlo.

## Accesibilidad y movimiento

- El script del `<head>` pone la clase `.rm` en `<html>` si el sistema pide **reducir movimiento** o si el usuario
  apaga las animaciones con el botón **MOTION** del header (se guarda en `localStorage`). CSS y JS solo consultan esa clase.
- Con `.rm`: no hay loader, wipe, scroll suave, parallax, pin, marquee, speed lines ni giro automático del 3D (se puede girar a mano); el contenido aparece directamente, la
  pieza Lottie se muestra en su último fotograma y solo se reproduce si el usuario pulsa "Repetir".
- La cinta animada del hero tiene botón de pausa (WCAG 2.2.2) y la pieza Lottie tiene pausa y repetición.
- Se animan solo `transform`, `opacity` y `clip-path`; los wipes son animaciones CSS que terminan solas aunque falle el JS.
- Foco visible en neón, navegación por teclado (selectores de talla y color con flechas), `aria-live` en carrito y formularios.

## Créditos y licencias

| Recurso | Autor / fuente | Licencia |
|---|---|---|
| Anton | Vernon Adams · Google Fonts, vía [Fontsource](https://fontsource.org/fonts/anton) | SIL Open Font License 1.1 |
| Barlow | Jeremy Tribby · Google Fonts, vía [Fontsource](https://fontsource.org/fonts/barlow) | SIL Open Font License 1.1 |
| Space Mono | Colophon Foundry · Google Fonts, vía [Fontsource](https://fontsource.org/fonts/space-mono) | SIL Open Font License 1.1 |
| GSAP 3.15 (core, ScrollTrigger, Flip) | GreenSock / Webflow · [gsap.com](https://gsap.com) | [Standard "no charge" license](https://gsap.com/standard-license) |
| lottie-web 5.13 | Airbnb · [github.com/airbnb/lottie-web](https://github.com/airbnb/lottie-web) | MIT |
| three.js r187 (incluye `RoomEnvironment`) | three.js authors · [threejs.org](https://threejs.org) | MIT |
| Delaunator 5 | Mapbox · [github.com/mapbox/delaunator](https://github.com/mapbox/delaunator) | ISC |
| Lenis 1.3 | darkroom.engineering · [github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | MIT |
| esbuild (solo desarrollo) | Evan Wallace · [esbuild.github.io](https://esbuild.github.io) | MIT |
| trimesh, fast-simplification (solo desarrollo) | [trimesh.org](https://trimesh.org) · [pyvista/fast-simplification](https://github.com/pyvista/fast-simplification) | MIT |
| Playwright (solo desarrollo, renders) | Microsoft · [playwright.dev](https://playwright.dev) | Apache 2.0 |
| Modelo 3D del casco (STL) | Aportado por el equipo (`DirtBikeHelmet_stls.zip`). **Completar autor, enlace y licencia antes de entregar** | _Por confirmar_ |
| Ilustraciones de producto, modelos 3D de prendas, logo, iconos, mapa, cascos de riders | Equipo APEX RIOT (SVG y geometría generados con código) | Propias |
| Animación APEX Ignition | Equipo APEX RIOT (`tools/build_lottie.py`) | Propia |

No se usan fotografías, videos ni sonidos externos. El único recurso 3D externo es el casco: citen su origen en la tabla. Los riders, testimonios, cifras, direcciones y redes sociales son ficticios.
La marca APEX RIOT es inventada para fines académicos; antes de usar el nombre fuera del curso, verificar que no esté registrado.

## Equipo

| Integrante | Rol | Usuario de GitHub |
|---|---|---|
| _Nombre_ | Líder de proyecto y UX | @usuario |
| _Nombre_ | Diseñador visual | @usuario |
| _Nombre_ | Motion designer | @usuario |
| _Nombre_ | Desarrollador | @usuario |
