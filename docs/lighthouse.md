# Informe de Lighthouse (móvil)

**Fecha:** 17 de noviembre de 2026 · **Herramienta:** Lighthouse 13.6 (CLI) con Chrome 153 headless · **Perfil:** móvil
por defecto (móvil de gama media simulado, 4G lenta, CPU ×4) · **Servidor:** local con compresión (`npx serve`), con
exactamente los archivos que publica Vercel (`.vercelignore`). Versión con las camisetas personalizadas.

> Repetir sobre la URL de Vercel y actualizar esta tabla:
> Chrome → incógnito → DevTools → Lighthouse → *Mobile* → *Analyze page load*. En Vercel, `vercel.json` añade caché
> de 7 días a imágenes, modelos y librerías, así que el aviso «Usar tiempos de vida de caché eficientes» debería desaparecer.

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|---|---|
| Inicio | **97** | 100 | 100 | 100 | 0,9 s | 2,4 s | 70 ms | 0,002 | 351 KiB |
| Catálogo | **100** | 100 | 100 | 100 | 0,9 s | 0,9 s | 20 ms | 0 | 424 KiB |
| Detalle de producto (casco) | **98** | 100 | 100 | 100 | 0,9 s | 2,4 s | 20 ms | 0 | 245 KiB |
| Carrito | **100** | 100 | 100 | 100 | 0,9 s | 0,9 s | 10 ms | 0 | 175 KiB |
| Nosotros* | **100** | 100 | 100 | 100 | 0,9 s | 0,9 s | 10 ms | 0 | 227 KiB |
| Contacto | **100** | 100 | 100 | 100 | 0,9 s | 0,9 s | 0 ms | 0 | 161 KiB |

\* Nosotros incluye la descarga diferida de lottie-web y del JSON de APEX Ignition.
Meta del proyecto: ≥ 80 en rendimiento móvil → **cumplida en las 6 páginas** (escritorio: 100 en todo).
Reportes completos (móvil y escritorio) en `docs/lighthouse/*.html`.

Medición anterior (3 de noviembre): Inicio 96, Catálogo 100, Detalle 97, Carrito 100, Nosotros 97, Contacto 100.

## Correcciones aplicadas durante la medición

| Problema detectado | Antes | Corrección | Después |
|---|---|---|---|
| CLS en Catálogo y Carrito: el footer saltaba cuando el JS insertaba los productos | Rendimiento 84 / 85, CLS 0.32 / 0.30 | Espacio reservado (`min-height`) para `#catGrid`, `#cartRoot` y `#pdp` | 100 / 100, CLS 0 |
| Contraste del manifiesto (palabras "apagadas" con opacidad 18 %) | Accesibilidad 96 | Gris sólido `#6F706D` (3.9:1, AA para texto grande) en vez de opacidad | 100 |
| Orden de encabezados en Catálogo (h1 → h3) | Accesibilidad 98 | `h2` oculto visualmente "Productos" antes de la grilla | 100 |
| Tildes recortadas en titulares animados (máscara `.line` con `overflow: hidden`) | "LIMITE" sin tilde | Relleno superior compensado en la máscara | Correcto |
| Visor 3D cargado al terminar la carga: el render WebGL bloqueaba el hilo principal en la medición | Rendimiento 60–61, TBT > 100 s (GPU por software) | three.js se descarga en la primera interacción; render pausado fuera de pantalla | 99–100 |
| Botón «360° 3D» del detalle con nombre accesible distinto del texto visible (WCAG 2.5.3) | Aviso *label-content-name-mismatch* | `aria-label="360° 3D: vista girando"` | Sin aviso |

## Decisiones de rendimiento

- **Sin frameworks:** HTML, CSS y JS planos; cada página carga solo su script.
- **3D bajo demanda:** el visor (three.js + Delaunator, 145 KB comprimido) se descarga en la primera interacción y
  dibuja solo mientras está en pantalla. Las texturas se generan del mismo SVG del catálogo: no hay modelos ni fotos que descargar.
- **Lenis** (scroll suave, 19 KB) solo se activa con mouse o trackpad; en táctil se usa el scroll nativo.
- **GSAP autoalojado** (core 73 KB + ScrollTrigger 45 KB sin comprimir; Flip solo en Catálogo). Todo con `defer`.
- **Lottie diferido:** lottie-web *light* (168 KB) y el JSON (78 KB) solo se piden cuando la sección está cerca.
- **Casco y camisetas personalizadas:** los modelos 3D (casco 450 KB, tee 435 KB, jersey 300 KB) y las calcomanías de marca (60–85 KB) solo se descargan con el visor; tarjetas y miniaturas muestran renders `.webp` de 15–30 KB, y el del hero se precarga.
- **Prendas en SVG generado** en lugar de fotos: cada ilustración pesa ~3 KB y es nítida en cualquier pantalla.
  El producto del hero va escrito en el HTML para que pinte el LCP sin esperar al JS.
- **Fuentes:** 4 archivos `.woff2` subconjunto latino, `font-display: swap`, precarga de Anton y Barlow 400.
- **Animaciones** solo con `transform`, `opacity` y `clip-path`; los bucles (speed lines, marquee) se pueden pausar.
- **Loader** solo en la primera visita de la sesión y nunca con movimiento reducido.
