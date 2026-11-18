# APEX RIOT · Guía de movimiento

## Principio rector
**La velocidad se siente en la entrada y se frena al leer.** Las animaciones de entrada son rápidas y secas, con
aceleración agresiva; cuando el usuario tiene que decidir (precio, talla, pago) la interfaz se queda quieta.
Ninguna animación bloquea una acción: todo se puede usar mientras se mueve, y todo se puede apagar.

## Tokens de movimiento

| Token | Valor | Uso |
|---|---|---|
| `--t-micro` | 160 ms | Hover, foco, presionar |
| `--t-fast` | 300 ms | Cambios de estado (badge, header, menú) |
| `--t-base` | 500 ms | Rellenos de botón, tarjetas, toast |
| Entradas largas | 700–1000 ms | Titulares, revelados, transiciones |
| `--ease-out` / `expo.out` | `cubic-bezier(.16,1,.3,1)` | **Entradas**: arranca a toda velocidad y frena en seco |
| `--ease-in` / `expo.in` | `cubic-bezier(.7,0,.84,0)` | **Salidas**: acelera al irse |
| `--ease-io` / `expo.inOut` | `cubic-bezier(.76,0,.24,1)` | **Cortes**: wipes, FLIP, máscaras |
| `back.out` | sobrepaso leve | Elementos "mecánicos": badge, barra de envío, cantidades |
| Escalonado (stagger) | 0.05–0.09 s | Listas y tarjetas: se lee como una ráfaga, no como una fila |

Reglas: solo se animan `transform`, `opacity` y `clip-path`. Máximo una animación en bucle visible a la vez en cada zona.
Nada parpadea más de 3 veces por segundo.

## Inventario de animaciones

| # | Animación | Dónde / disparador | Tiempo y curva | Principio | Intención | Con movimiento reducido |
|---|---|---|---|---|---|---|
| 1 | **Loader** (A que se dibuja + corte) | Inicio, 1.ª visita de la sesión | 900 ms trazo + 520 ms corte `ease-io` | Puesta en escena | Presentar la marca una sola vez, mientras cargan fuentes | No aparece |
| 2 | **Wipe diagonal** entre páginas | Clic en un enlace interno | 420 ms entrada + 560 ms salida `ease-io`, 2 paneles desfasados 70 ms | Timing, superposición | Continuidad entre páginas y ADN diagonal; el desfase da sensación de velocidad | Navegación directa |
| 3 | **FLIP tarjeta → detalle** | Clic en una tarjeta de producto | 750 ms `expo.inOut` | Arcos, continuidad | El producto elegido "viaja" a la galería: el usuario no pierde el foco | Sin vuelo |
| 4 | **Titular del hero por líneas** | Carga de Inicio | 1 s `expo.out`, skew 8°→0, stagger 0.09 s | Anticipación y asentamiento | El skew simula inercia: la palabra frena como una moto en la curva | Texto estático |
| 5 | **Producto estrella "smear"** | Carga de Inicio | 1 s `expo.out`: desplazamiento + skew −14° + estiramiento 1.2 → 1, con copia fantasma | Estirar y encoger (smear frame) | Motion blur simulado sin filtros costosos | Estático |
| 6 | **Speed lines** | Hero, en bucle | 0.9–2.4 s lineales, opacidades distintas | Movimiento secundario | Velocidad ambiental, nunca protagonista | Ocultas; botón de pausa |
| 7 | **Parallax por capas** | Mouse (punteros finos) y scroll | `quickTo` 0.8–1.2 s / scrub | Profundidad, acción secundaria | Texto gigante, producto y titular a velocidades distintas dan volumen | Desactivado |
| 8 | **Marquee reactivo** | Hero, bucle de 22 s | Acelera hasta ×5 con la velocidad del scroll y vuelve en 1.2 s | Acción y reacción | La cinta responde al gesto del usuario: más scroll, más velocidad | Estática; botón de pausa |
| 9 | **Cortes diagonales** | Entre secciones | Estático (`clip-path`) | Staging | Cada sección "corta" a la anterior como una curva | Igual |
| 10 | **Reveal de tarjetas y bloques** | Al entrar en pantalla | 800 ms `expo.out`, y +48 px, giro 1.5°, stagger 0.08 s | Jerarquía, follow-through | Los productos llegan en ráfaga, la leve rotación da actitud | Visibles desde el inicio |
| 11 | **Títulos de sección por líneas** | Al entrar en pantalla | 900 ms `expo.out`, stagger 0.09 s | Jerarquía | El título se lee antes que el contenido | Estáticos |
| 12 | **Revelado con máscara diagonal** | Comunidad, mapa | 1 s `expo.inOut` (`clip-path`) | Puesta en escena | Las imágenes "se abren" como un wipe | Visibles |
| 13 | **Disciplinas: pin + scroll horizontal** | Inicio, escritorio ≥ 900 px | Scrub 0.6; el arte gira en sentido contrario | Arcos, acción secundaria | Tres terrenos como tres curvas de una pista; el usuario controla el ritmo | Paneles apilados en vertical |
| 14 | **Botón: relleno diagonal + presión** | Hover / clic en cualquier botón | Relleno 500 ms `expo.out`; presión scale 0.96 en 160 ms | Estirar y encoger | Feedback inmediato; el relleno en diagonal repite el ADN | Cambio de color instantáneo |
| 15 | **Pulso del CTA principal** | Hero, cada 2.8 s | Halo 0 → 14 px | Atracción | Señala la acción principal sin moverla de sitio | Sin pulso |
| 16 | **Tarjeta: frente → espalda** | Hover sobre tarjeta | 500 ms `expo.out`, cruce con giro ±4° | Acción secundaria | Muestra la espalda (número, gráfico) sin abrir el producto | Sin transición |
| 17 | **Talla obligatoria (shake)** | "A romperla" sin talla | 380 ms, 4 rebotes decrecientes | Exageración | Error claro sin modal ni texto rojo gritón | Solo mensaje |
| 18 | **Selector de talla "pop"** | Elegir talla | 360 ms, escala 1 → 1.14 → 1 | Squash & stretch | Confirma la elección | Solo color |
| 19 | **Cambio de color de la prenda** | Elegir variante | Salida 160 ms `power2.in` + entrada 400 ms `expo.out` | Timing | La prenda "sale" y "entra" repintada | Cambio directo |
| 20 | **Vuelo al carrito** | Añadir al garaje | 750 ms en arco (Bézier) `power2.in`, la chispa se encoge | Arcos, gravedad | Muestra a dónde fue el producto | Se añade sin vuelo |
| 21 | **Badge del carrito** | Al aterrizar el vuelo | Ícono bump 500 ms + número cae con `back.out` | Follow-through | El carrito "recibe el golpe" | Número actualizado |
| 22 | **Botón → "¡En el garaje!"** | Tras añadir | Check que se dibuja 380 ms, vuelve a los 2.2 s | Estado | Confirmación en el mismo punto donde se hizo clic | Texto sin animación |
| 23 | **Contador de cantidad** | +/− en detalle y carrito | 300 ms `back.out`, el número entra desde arriba o abajo | Dirección | La dirección dice si sumó o restó | Cambio directo |
| 24 | **Filtros con Flip** | Catálogo, al filtrar u ordenar | 600 ms `expo.inOut`, entradas/salidas con escala | Continuidad | El usuario ve a dónde va cada producto en vez de un salto | Reacomodo instantáneo |
| 25 | **Barra de envío gratis "turbo"** | Carrito, al cambiar el total | 900 ms `back.out` (se pasa y se asienta) + destello al completar | Exageración | Recompensa visual al alcanzar el envío gratis | Ancho fijo |
| 26 | **Eliminar ítem** | Carrito → "Quitar" | Sale a la derecha con skew en 280 ms `power3.in` + colapso de altura 300 ms | Anticipación, acción-reacción | Se "rompe" y la lista se cierra sin saltos | Se elimina al instante |
| 27 | **Checkout y éxito** | Confirmar pedido | Spinner + círculo 700 ms y check 420 ms dibujados | Puesta en escena | Cierre emocional de la compra simulada | Ícono estático |
| 28 | **Manifiesto palabra a palabra** | Nosotros, scroll | Scrub con el scroll | Ritmo | El usuario "lee al ritmo" de la marca | Texto completo visible |
| 29 | **Contadores** | Nosotros, al entrar | 1.8 s `power3.out` | Timing | Las cifras se sienten conseguidas | Cifra final |
| 30 | **Línea de tiempo** | Nosotros, scroll | Scrub; cada hito se enciende | Continuidad | La línea avanza como una vuelta a la pista | Línea completa |
| 31 | **Campos de formulario** | Foco / error | Brillo neón 160 ms; shake 380 ms en el primer error | Feedback | Estado claro sin recargar | Solo borde |
| 32 | **Acordeones** | FAQ, tabla de tallas | Abrir 450 ms `expo.out` / cerrar 300 ms `power3.in` | Timing asimétrico | Abrir es lento y legible; cerrar, rápido | Nativo |
| 33 | **Menú móvil** | Botón de menú | `clip-path` 520 ms `ease-io` + enlaces con stagger | Puesta en escena | Cortina diagonal coherente con el wipe | Instantáneo |
| 34 | **Header y progreso** | Scroll | Se oculta al bajar y vuelve al subir (300 ms); barra de progreso Ácido | Economía | Más pantalla para el contenido, orientación constante | Igual, sin transición |
| 35 | **APEX Ignition** (pieza original) | Nosotros, al verla al 45 % | 6 s, ver guion abajo | Todos | Firma de marca | Último fotograma; "Repetir" la reproduce a petición |
| 36 | **Selector de deporte** | Hero, clic o flechas | Píldora que se desliza 520 ms `expo.out`; titular sale 380 ms `power3.in` y entra 900 ms `expo.out`; color `--mode` interpolado 900 ms | Continuidad, timing | Cambiar de deporte se siente como un corte de cámara, no como otra página | Cambio directo |
| 37 | **Prenda 3D: arrastrar con inercia** | Hero y detalle | Velocidad del gesto + frenado exponencial (0.94 por cuadro) | Física, follow-through | La prenda se comporta como un objeto real que sigue girando y se detiene | Sin inercia ni giro automático |
| 38 | **Prenda 3D: giro automático y flotación** | Sin interacción 2.6 s | 0.26°/cuadro; vaivén de ±0.05 u cada 5.6 s | Movimiento secundario | Invita a girarla y deja ver el volumen | Desactivado |
| 39 | **Cambio de prenda (smear 3D)** | Cambio de deporte | Sale 380 ms `power3.in` estirada; entra 800 ms `expo.out` + escala `elastic.out` | Estirar y encoger | La prenda nueva "llega derrapando" | Cambio directo |
| 40 | **Cambio de color con giro** | Elegir variante | Media vuelta 420 ms `power3.in`, se cambia la textura de perfil, media vuelta 750 ms `expo.out` | Puesta en escena | El color cambia sin que el usuario vea el salto | Cambio directo |
| 41 | **Frente / espalda / detalle** | Miniaturas del detalle | Giro 900 ms `expo.inOut`; acercamiento de cámara interpolado | Puesta en escena | Las miniaturas mueven la cámara, no cambian de foto | Instantáneo |
| 42 | **Contraluz del deporte** | Cambio de modo | Color de las luces traseras 800 ms | Atmósfera | El modelo se ilumina con el color del deporte | Cambio directo |
| 43 | **Tilt de tarjetas** | Puntero sobre una tarjeta | `quickTo` 600 ms: ±5° X, ±6° Y + brillo que sigue al puntero | Profundidad | Las tarjetas se sienten físicas antes de abrirlas | Sin tilt |
| 44 | **Scroll suave (Lenis)** | Rueda del mouse / trackpad | Interpolación 0.11 por cuadro, sincronizada con ScrollTrigger | Fluidez | Todo el scroll (pin, parallax, reveals) avanza sin saltos | Scroll nativo |
| 45 | **Precarga de páginas** | Puntero o dedo sobre un enlace | `link rel=prefetch` | Rendimiento percibido | La página siguiente ya está lista cuando termina el wipe | Igual |
| 46 | **Intro de disciplina** | Clic en un panel de deporte o en "Equipo X" | `clip-path` del rectángulo del panel a pantalla completa 750 ms `expo.inOut`; título 800 ms; barra de progreso 2.8 s lineal; cierre inverso 600 ms | Continuidad, anticipación | El deporte "se abre" desde donde se tocó y lleva al catálogo; la barra avisa cuánto falta | Navegación directa |
| 47 | **Casco 3D real** | Hero MX y detalle del casco | Igual que las prendas (inercia, giro, cambio de color con media vuelta) | Física | El producto estrella se ve como objeto real: laca, reflejos, forro oscuro | Sin giro automático |

## Visor 3D de productos

Las prendas se modelan con código a partir de su silueta: se triangula el contorno, se "infla" cada punto según su
distancia al borde (perfil redondeado, curvatura de torso, arrugas suaves) y se pinta el diseño del catálogo como
textura. Material físico de tela con brillo (sheen) y mapa de normales de tejido según la prenda (malla de jersey,
algodón, felpa, lona). Luz de estudio, contraluz del color del deporte y sombra de contacto.

Interacción: arrastrar para girar 360° (inercia), flechas del teclado, miniaturas que giran o acercan la cámara.
En móvil, el gesto vertical sigue haciendo scroll (`touch-action: pan-y`) y el horizontal gira la prenda.

## Pieza original: APEX Ignition (Lottie)

`assets/lottie/apex-ignition.json` · 1280 × 720 · 30 fps · 180 frames · ~78 KB · 47 capas vectoriales.
Generada por el equipo con `tools/build_lottie.py` a partir del logo y las fuentes de la marca.

| Frames | Segundos | Acción | Curva |
|---|---|---|---|
| 0–30 | 0–1 | Un trazo de neón Ácido dibuja el contorno de la A (trim path) | `expo.inOut` |
| 30–44 | 1–1.5 | Ignición: la A se rellena con sobrepaso, destello blanco, la barra entra estirándose, el trazo se apaga | `back.out` |
| 30–70 | 1–2.3 | 10 speed lines cruzan en diagonal a −14° | `expo.in` |
| 60–100 | 2–3.3 | "APEX RIOT" entra letra por letra desde abajo, con glitch cian/naranja intermitente | `expo.out` + hold |
| 104–150 | 3.5–5 | Eslogan, línea que se estira desde el centro y 18 chispas que salen de la A | `expo.out` / `expo.in` |
| 150–180 | 5–6 | Estado final estático (sello) | — |

Carga diferida: `lottie_light.min.js` y el JSON solo se descargan cuando la sección está a 300 px del viewport.
Mientras tanto se ve el logo estático en SVG, que también es el respaldo si el Lottie falla.

## Cómo apagar el movimiento

1. **Sistema operativo:** *Reducir movimiento* (macOS/iOS), *Efectos de animación* (Windows), *Quitar animaciones* (Android).
2. **En el sitio:** botón **MOTION** del header (en móvil, dentro del menú). La preferencia se guarda en el navegador.

Ambas activan la clase `.rm` en `<html>`; CSS (`css/styles.css` §03) y JS (`APEX.RM`) leen solo esa clase.
