/* =========================================================
   APEX RIOT · Visor 3D de productos (three.js)
   ---------------------------------------------------------
   Cada prenda se modela a partir de su silueta vectorial:
   1. Se muestrea el contorno (SVG) y se rellena el interior con
      una malla de puntos triangulada (Delaunay).
   2. Cada vértice se "infla" según su distancia al borde, con
      perfil redondeado, curvatura de torso y arrugas suaves.
   3. El diseño de la marca (el mismo SVG del catálogo) se pinta
      como textura: frente en la cara delantera, espalda atrás.
   4. Material físico de tela (sheen + mapa de normales de tejido)
      con luz de estudio, contraluz del color del deporte y sombra
      de contacto.
   Se compila con `npm run build:3d` → js/3d/viewer3d.min.js
   ========================================================= */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BufferGeometry, BufferAttribute,
  MeshPhysicalMaterial, MeshBasicMaterial, PlaneGeometry, CanvasTexture, DirectionalLight,
  HemisphereLight, PMREMGenerator, SRGBColorSpace, NeutralToneMapping, RepeatWrapping,
  Color, MathUtils, Vector2, Vector4, DoubleSide
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Delaunator from 'delaunator';

const W = 400, H = 440, SCALE = 0.01;

/* Volumen por tipo de prenda: grosor máximo, radio del borde redondeado,
   curvatura de "torso" y material */
const PROFILE = {
  jersey:   { t: 26, r: 46, bend: 20, wr: 2.6, fabric: 'mesh',   rough: .58, sheen: .5 },
  jerseyLS: { t: 26, r: 46, bend: 20, wr: 2.6, fabric: 'mesh',   rough: .58, sheen: .5 },
  tee:      { t: 24, r: 44, bend: 18, wr: 2.2, fabric: 'cotton', rough: .86, sheen: .9 },
  hoodie:   { t: 40, r: 60, bend: 22, wr: 3.2, fabric: 'fleece', rough: .92, sheen: 1 },
  pants:    { t: 30, r: 40, bend: 12, wr: 3.0, fabric: 'canvas', rough: .66, sheen: .35 },
  cap:      { t: 70, r: 130, bend: 6, wr: .6,  fabric: 'canvas', rough: .7,  sheen: .4 },
  gloves:   { t: 22, r: 22, bend: 6, wr: .8,  fabric: 'canvas', rough: .55, sheen: .3 },
  jacket:   { t: 36, r: 56, bend: 22, wr: 3,  fabric: 'canvas', rough: .62, sheen: .4 },
  goggles:  { t: 24, r: 34, bend: 34, wr: 0,  fabric: 'canvas', rough: .4,  sheen: .1, coat: .8 },
  chest:    { t: 30, r: 44, bend: 46, wr: 0,  fabric: 'mesh',   rough: .42, sheen: .1, coat: .7 },
  knee:     { t: 34, r: 56, bend: 30, wr: 0,  fabric: 'canvas', rough: .45, sheen: .1, coat: .6 }
};

/* ---------- Modelos reales (casco) ----------
   Binario 'APXM' generado por tools/build_helmet.py desde el STL del equipo. */
const modelCache = new Map();
function loadModel(url) {
  if (modelCache.has(url)) return modelCache.get(url);
  const pr = fetch(url).then((r) => { if (!r.ok) throw new Error('Modelo no encontrado'); return r.arrayBuffer(); }).then((buf) => {
    const dv = new DataView(buf);
    if (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) !== 'APXM') throw new Error('Formato inválido');
    const nv = dv.getUint32(4, true), nf = dv.getUint32(8, true);
    let off = 28;
    const q = new Int16Array(buf.slice(off, off + nv * 6)); off += nv * 6;
    if (off % 4) off += 4 - (off % 4);
    const big = nv >= 65536;
    const idx = big ? new Uint32Array(buf.slice(off, off + nf * 12)) : new Uint16Array(buf.slice(off, off + nf * 6));
    const S = 2.15, pos = new Float32Array(nv * 3);
    for (let i = 0; i < q.length; i++) pos[i] = q[i] / 32767 * S;
    let g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setIndex(new BufferAttribute(idx, 1));
    g = toCreasedNormals(g, MathUtils.degToRad(34));   // aristas marcadas, superficies suaves
    g.computeBoundingBox();
    const bb = g.boundingBox, P = g.attributes.position, N = g.attributes.normal, n = P.count;
    const uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
    const cy = bb.min.y + (bb.max.y - bb.min.y) * .45, cz = (bb.min.z + bb.max.z) / 2 - .1;
    for (let i = 0; i < n; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      // proyección lateral: la decoración se "pinta" de perfil sobre ambos lados
      uv[i * 2] = (bb.max.z - z) / (bb.max.z - bb.min.z);
      uv[i * 2 + 1] = (y - bb.min.y) / (bb.max.y - bb.min.y);
      // las caras que miran hacia adentro (forro) se oscurecen
      const dx = x, dy = y - cy, dz = z - cz, l = Math.hypot(dx, dy, dz) || 1;
      const d = (N.getX(i) * dx + N.getY(i) * dy + N.getZ(i) * dz) / l;
      const k = MathUtils.smoothstep(d, -.3, .12) * .9 + .1;
      col.set([k, k, k], i * 3);
    }
    // cada triángulo usa la mitad del atlas de su lado (decide el centro del triángulo)
    for (let i = 0; i < n; i += 3) {
      const right = P.getX(i) + P.getX(i + 1) + P.getX(i + 2) > 0;
      for (let j = i; j < i + 3; j++) uv[j * 2] = uv[j * 2] * .5 + (right ? 0 : .5);
    }
    g.setAttribute('uv', new BufferAttribute(uv, 2));
    g.setAttribute('color', new BufferAttribute(col, 3));
    return g;
  });
  modelCache.set(url, pr);
  return pr;
}

/* ---------- Modelos 3MF por piezas (jersey, camiseta, gafas) ----------
   Binario 'APXC' generado por tools/build_models_3mf.py. Cada vértice trae su pieza
   (0 base · 1 acento · 2 detalle) y el color se pinta según la variante del producto. */
const apxcCache = new Map();
function loadApxc(url) {
  if (apxcCache.has(url)) return apxcCache.get(url);
  const pr = fetch(url).then((r) => { if (!r.ok) throw new Error('Modelo no encontrado'); return r.arrayBuffer(); }).then((buf) => {
    const dv = new DataView(buf);
    if (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) !== 'APXC') throw new Error('Formato inválido');
    const nv = dv.getUint32(4, true), nf = dv.getUint32(8, true);
    let off = 28;
    const q = new Int16Array(buf.slice(off, off + nv * 6)); off += nv * 6;
    if (off % 4) off += 4 - (off % 4);
    const pid = new Uint8Array(buf.slice(off, off + nv)); off += nv;
    if (off % 4) off += 4 - (off % 4);
    const idx = nv >= 65536 ? new Uint32Array(buf.slice(off, off + nf * 12)) : new Uint16Array(buf.slice(off, off + nf * 6));
    const pos = new Float32Array(nv * 3);
    for (let k = 0; k < q.length; k++) pos[k] = q[k] / 32767 * 2.15;
    let g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setIndex(new BufferAttribute(idx, 1));
    const fp = new Uint8Array(nf);                          // pieza de cada triángulo
    for (let k = 0; k < nf; k++) fp[k] = pid[idx[k * 3]];
    g = toCreasedNormals(g, MathUtils.degToRad(40));        // queda sin índice y en el mismo orden
    g.computeBoundingBox();
    g.userData.fp = fp;
    g.setAttribute('color', new BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
    return g;
  });
  apxcCache.set(url, pr);
  return pr;
}
/* ---------- Calcomanía de marca (logo, "APEX RIOT" y número) ----------
   PNG de tools/build_decals.py: mitad izquierda = frente, derecha = espalda. Se proyecta de frente
   sobre el rectángulo `decal.rect` del espacio del objeto y tapa el diseño original del modelo. */
const decalCache = new Map();
function loadDecal(url) {
  if (decalCache.has(url)) return decalCache.get(url);
  const pr = new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { const t = new CanvasTexture(img); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; res(t); };
    img.onerror = () => rej(new Error('Calcomanía no encontrada'));
    img.src = url;
  });
  decalCache.set(url, pr);
  return pr;
}
function withDecal(mat) {
  if (mat.userData.decal) return mat.userData.decal;
  const u = { decalMap: { value: null }, decalOn: { value: 0 }, decalRect: { value: new Vector4(-1, -1, 1, 1) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vObjP;\nvarying vec3 vObjN;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  vObjN = objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vObjP = position;');
    sh.fragmentShader = 'uniform sampler2D decalMap;\nuniform float decalOn;\nuniform vec4 decalRect;\nvarying vec3 vObjP;\nvarying vec3 vObjN;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  if (decalOn > .5) {
    vec3 on = normalize(vObjN);
    bool front = vObjP.z >= 0.;                         // prenda delgada: frente en z+, espalda en z−
    vec2 uv = (vObjP.xy - decalRect.xy) / (decalRect.zw - decalRect.xy);
    if (!front) uv.x = 1. - uv.x;                       // la espalda se lee desde atrás
    if (uv.x >= 0. && uv.x <= 1. && uv.y >= 0. && uv.y <= 1.) {
      vec4 d = texture2D(decalMap, vec2(uv.x * .5 + (front ? 0. : .5), uv.y));
      float k = d.a;                                     // también cubre las paredes del relieve original
      diffuseColor.rgb = mix(diffuseColor.rgb, d.rgb, k);
    }
  }`);
  };
  mat.customProgramCacheKey = () => 'apex-decal';
  mat.userData.decal = u;
  return u;
}
function paintApxc(g, cols) {
  const c = g.attributes.color, fp = g.userData.fp, A = cols.map((h) => new Color(h));
  for (let k = 0; k < fp.length; k++) {
    const o = A[fp[k]] || A[0];
    for (let j = 0; j < 3; j++) { const i = (k * 3 + j) * 3; c.array[i] = o.r; c.array[i + 1] = o.g; c.array[i + 2] = o.b; }
  }
  c.needsUpdate = true;
}

/* ---------- Ruido suave para arrugas ---------- */
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

/* ---------- Geometría inflada a partir de la silueta ---------- */
const geoCache = new Map();
function buildGeometry(type) {
  if (geoCache.has(type)) return geoCache.get(type);
  const shapes = (window.garmentSilhouette && window.garmentSilhouette(type)) || [];
  const prof = PROFILE[type] || PROFILE.tee;
  const ctx = document.createElement('canvas').getContext('2d');
  const paths = shapes.map((s) => {
    const p = new Path2D();
    p.addPath(new Path2D(s.d), s.m ? new DOMMatrix(s.m) : undefined);
    return p;
  });
  const union = new Path2D();
  paths.forEach((p) => union.addPath(p));
  const inside = (x, y) => paths.some((p) => ctx.isPointInPath(p, x, y));

  // 1. Contorno: puntos sobre el borde de la unión de formas
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  document.body.appendChild(svg);
  const pts = [], segs = [];
  shapes.forEach((s, si) => {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('d', s.d); svg.appendChild(el);
    const m = s.m || [1, 0, 0, 1, 0, 0];
    const len = el.getTotalLength(), n = Math.max(24, Math.ceil(len / 3.2));
    let prev = -1, first = -1;
    for (let i = 0; i < n; i++) {
      const q = el.getPointAtLength((i / n) * len);
      const x = m[0] * q.x + m[2] * q.y + m[4], y = m[1] * q.x + m[3] * q.y + m[5];
      const covered = paths.some((p, pi) => pi !== si && ctx.isPointInPath(p, x, y));
      if (covered) { prev = -1; continue; }
      const idx = pts.length; pts.push([x, y]);
      if (prev >= 0) segs.push([prev, idx]); else if (first < 0) first = idx;
      prev = idx;
    }
    if (prev >= 0 && first >= 0 && prev !== first) segs.push([prev, first]);
  });
  svg.remove();
  const nBoundary = pts.length;

  // 2. Interior: rejilla escalonada (más densa = más suave)
  const step = 6.5;
  for (let y = 0, row = 0; y <= H + 40; y += step * .866, row++) {
    for (let x = (row % 2) * step / 2; x <= W; x += step) {
      if (!ctx.isPointInPath(union, x, y)) continue;
      let near = false;
      for (let i = 0; i < nBoundary; i++) { const dx = pts[i][0] - x, dy = pts[i][1] - y; if (dx * dx + dy * dy < step * step * .3) { near = true; break; } }
      if (!near) pts.push([x, y]);
    }
  }

  // 3. Triangulación y filtrado de triángulos fuera de la silueta
  const dl = Delaunator.from(pts);
  const tris = [];
  for (let i = 0; i < dl.triangles.length; i += 3) {
    const a = dl.triangles[i], b = dl.triangles[i + 1], c = dl.triangles[i + 2];
    const cx = (pts[a][0] + pts[b][0] + pts[c][0]) / 3, cy = (pts[a][1] + pts[b][1] + pts[c][1]) / 3;
    if (inside(cx, cy)) tris.push(a, b, c);
  }

  // 4. Altura de cada punto: distancia al borde → perfil de almohada
  const dist = pts.map(([x, y], i) => {
    if (i < nBoundary) return 0;
    let best = Infinity;
    for (const [s0, s1] of segs) {
      const ax = pts[s0][0], ay = pts[s0][1], bx = pts[s1][0], by = pts[s1][1];
      const vx = bx - ax, vy = by - ay, wx = x - ax, wy = y - ay;
      const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy || 1)));
      const dx = wx - vx * t, dy = wy - vy * t, d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  });

  const nv = pts.length;
  const pos = new Float32Array(nv * 2 * 3), uv = new Float32Array(nv * 2 * 2);
  for (let i = 0; i < nv; i++) {
    const [x, y] = pts[i];
    const k = Math.min(1, dist[i] / prof.r);
    const pillow = Math.sqrt(1 - (1 - k) * (1 - k));           // borde redondeado, centro plano
    const wrinkle = prof.wr * k * (noise(x / 38, y / 30) + .5 * noise(x / 14 + 9, y / 60));
    const h = prof.t * pillow + wrinkle;
    const bend = -prof.bend * Math.pow((x - W / 2) / (W / 2), 2); // curvatura de torso
    const X = (x - W / 2) * SCALE, Y = (H / 2 - y) * SCALE;
    pos.set([X, Y, (bend + h) * SCALE], i * 3);
    pos.set([X, Y, (bend - h * .92) * SCALE], (nv + i) * 3);
    uv.set([x / W, 1 - y / H], i * 2);
    uv.set([1 - x / W, 1 - y / H], (nv + i) * 2);                // espalda vista desde atrás
  }
  const index = new Uint32Array(tris.length * 2);
  for (let i = 0; i < tris.length; i += 3) {
    // orientar cada triángulo en sentido antihorario visto desde +Z (Y de pantalla invertida)
    const [a, b, c] = [tris[i], tris[i + 1], tris[i + 2]];
    const cross = (pts[b][0] - pts[a][0]) * (pts[a][1] - pts[c][1]) - (pts[a][1] - pts[b][1]) * (pts[c][0] - pts[a][0]);
    if (cross < 0) { tris[i + 1] = c; tris[i + 2] = b; }
    index[i] = tris[i]; index[i + 1] = tris[i + 1]; index[i + 2] = tris[i + 2];
    const j = tris.length + i;
    index[j] = nv + tris[i]; index[j + 1] = nv + tris[i + 2]; index[j + 2] = nv + tris[i + 1];
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  g.setIndex(new BufferAttribute(index, 1));
  g.addGroup(0, tris.length, 0);
  g.addGroup(tris.length, tris.length, 1);
  g.computeVertexNormals();
  g.computeBoundingBox();
  geoCache.set(type, g);
  return g;
}

/* ---------- Mapas de tejido (normales procedurales) ---------- */
const fabricCache = new Map();
function fabricNormal(kind) {
  if (fabricCache.has(kind)) return fabricCache.get(kind);
  const N = 128, hgt = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v;
    if (kind === 'mesh') {        // malla perforada de jersey técnico
      const cx = (x % 8) - 4, cy = (y % 8) - 4;
      v = Math.min(1, Math.sqrt(cx * cx + cy * cy) / 3);
    } else if (kind === 'fleece') { // felpa: grano irregular
      v = .5 + .5 * noise(x / 3, y / 3) * .8 + .2 * hash(x, y);
    } else if (kind === 'canvas') { // tejido plano: trama y urdimbre
      v = .5 + .25 * Math.sin(x * Math.PI / 2) * Math.sign(Math.sin(y * Math.PI / 8)) + .25 * Math.sin(y * Math.PI / 2);
    } else {                        // punto de algodón: pequeñas "V"
      const yy = (y % 6) - 3;
      v = .5 + .5 * Math.sin((x + Math.abs(yy) * 1.5) * Math.PI / 3);
    }
    hgt[y * N + x] = v;
  }
  const c = document.createElement('canvas'); c.width = c.height = N;
  const cx = c.getContext('2d'), img = cx.createImageData(N, N);
  const at = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * 1.6, dy = (at(x, y + 1) - at(x, y - 1)) * 1.6;
    const l = Math.hypot(dx, dy, 1), o = (y * N + x) * 4;
    img.data[o] = (-dx / l * .5 + .5) * 255; img.data[o + 1] = (dy / l * .5 + .5) * 255;
    img.data[o + 2] = (1 / l * .5 + .5) * 255; img.data[o + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(kind === 'mesh' ? 34 : 46, kind === 'mesh' ? 37 : 50);
  fabricCache.set(kind, t);
  return t;
}

/* ---------- Texturas del diseño (SVG de la marca → canvas) ---------- */
let fontCSS = null;
async function fontsCSS() {
  if (fontCSS !== null) return fontCSS;
  const list = [['Anton', 'anton-latin-400-normal'], ['Space Mono', 'space-mono-latin-400-normal'], ['Barlow', 'barlow-latin-600-normal']];
  try {
    const parts = await Promise.all(list.map(async ([fam, file]) => {
      const buf = await (await fetch('assets/fonts/' + file + '.woff2')).arrayBuffer();
      let bin = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return '@font-face{font-family:"' + fam + '";src:url(data:font/woff2;base64,' + btoa(bin) + ') format("woff2")}';
    }));
    fontCSS = parts.join('');
  } catch (e) { fontCSS = ''; }
  return fontCSS;
}
const texCache = new Map();
async function designTexture(product, variant, view, renderer) {
  const key = product.id + '|' + variant + '|' + view;
  if (texCache.has(key)) return texCache.get(key);
  const css = await fontsCSS();
  let svg = window.garmentSVG(product, variant, view, true);
  const vb = (svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) || [0, 400, 440]).slice(1).map(Number);
  const TW = 1024, TH = Math.round(TW * vb[1] / vb[0]);
  svg = svg.replace('<defs>', '<defs><style>' + css + '</style>').replace('<svg ', '<svg width="' + TW + '" height="' + TH + '" ');
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const g = c.getContext('2d');
  g.fillStyle = product.variants[variant].base;     // evita bordes oscuros en la costura
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texCache.set(key, t);
  return t;
}

/* ---------- Sombra de contacto ---------- */
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(.5, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

/* =========================================================
   createViewer(container, options) → API del visor
   ========================================================= */
export function createViewer(container, opts = {}) {
  const rm = !!opts.reducedMotion;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;   // conserva el color real de la marca
  renderer.toneMappingExposure = .92;
  const canvas = renderer.domElement;
  canvas.className = 'viewer3d__canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', opts.label || 'Modelo 3D del producto. Arrastra para girarlo.');
  canvas.style.touchAction = 'pan-y';   // el gesto vertical sigue haciendo scroll en móvil
  container.appendChild(canvas);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  const camera = new PerspectiveCamera(26, 1, .1, 60);
  const baseZ = opts.distance || 11;
  camera.position.set(0, .15, baseZ);

  const key = new DirectionalLight(0xffffff, 2.6); key.position.set(3, 5, 6);
  const fill = new HemisphereLight(0xf2f2ee, 0x0b0b0d, .35);
  const rim = new DirectionalLight(new Color(opts.accent || '#C6FF00'), 3.2); rim.position.set(-5, 2.5, -4);
  const rim2 = new DirectionalLight(new Color(opts.accent || '#C6FF00'), 1.6); rim2.position.set(5, -1, -3);
  scene.add(key, fill, rim, rim2);

  const stage = new Group();       // giro del usuario
  const model = new Group();       // animaciones de entrada / cambio
  stage.add(model); scene.add(stage);
  const shadow = new Mesh(new PlaneGeometry(4.6, 1.4), new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: .8 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.55;
  scene.add(shadow);

  const matFront = new MeshPhysicalMaterial({ roughness: .7, sheen: .6, sheenRoughness: .5, sheenColor: new Color('#ffffff'), envMapIntensity: .42 });
  const matBack = matFront.clone();
  // pintura de casco: base mate-satinada con laca transparente encima (clearcoat)
  const matShell = new MeshPhysicalMaterial({ vertexColors: true, roughness: .4, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: .7 });
  let mesh = null, current = null, restY = 0;

  /* ---------- Interacción: arrastrar para girar con inercia ---------- */
  let rotY = opts.startRotation || -.35, rotX = .06, velY = 0, dragging = false, lastX = 0, lastY = 0, idleAt = 0;
  const AUTO = rm || opts.autoRotate === false ? 0 : .0045;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; velY = 0;
    canvas.setPointerCapture(e.pointerId); container.classList.add('is-dragging');
    opts.onInteract && opts.onInteract();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    velY = dx * .0085; rotY += velY; rotX = MathUtils.clamp(rotX + dy * .004, -.35, .45);
  });
  const end = () => { dragging = false; idleAt = performance.now(); container.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { velY = -.06; e.preventDefault(); }
    if (e.key === 'ArrowRight') { velY = .06; e.preventDefault(); }
  });
  canvas.tabIndex = 0;

  /* ---------- Bucle de render (solo si se ve en pantalla) ---------- */
  let visible = true, running = false, t0 = performance.now(), zoom = 0, zoomTarget = 0;
  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // encuadre: la prenda (4.4 x 4.0 u) cabe completa en ambos ejes
    const fitH = 5.4 / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)));
    const fitW = fitH * Math.max(1, .95 / camera.aspect);
    camera.position.z = (opts.distance || Math.max(fitH, fitW)) * (1 - zoom * .34);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);
  function frame(now) {
    const dt = Math.min(50, now - t0) / 16.67; t0 = now;
    if (!dragging) {
      velY *= Math.pow(.94, dt);
      const auto = now - idleAt > 2600 ? AUTO : 0;
      rotY += (velY + auto) * dt;
      if (!rm) rotX += (.06 - rotX) * .04 * dt;
    }
    zoom += (zoomTarget - zoom) * .12 * dt;
    if (Math.abs(zoomTarget - zoom) > .001) resize();
    stage.rotation.set(rotX, rotY, 0);
    if (!rm) model.position.y = Math.sin(now / 900) * .05;
    shadow.material.opacity = .8 - model.position.y * 2;
    camera.position.y = .15 + zoom * .9;
    camera.lookAt(0, zoom * .9, 0);
    renderer.render(scene, camera);
  }
  function setRunning(on) {
    if (on === running) return; running = on;
    renderer.setAnimationLoop(on ? frame : null);
  }
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; setRunning(visible && !document.hidden); });
  io.observe(container);
  document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden));

  /* ---------- Cargar prenda ---------- */
  async function apply(product, variant) {
    if (product.model && /\.apxc$/.test(product.model)) {
      const dc = product.decal;
      const [geo, decal] = await Promise.all([
        loadApxc(product.model),
        dc ? loadDecal('assets/img/decals/' + product.id + '-' + variant + '.png').catch(() => null) : null
      ]);
      const v = product.variants[variant];
      const base = v.base, accent = v.accent || base, detail = v.detail || accent;
      paintApxc(geo, [base, accent, detail]);
      const mm = matShell.userData.cl || (matShell.userData.cl = matShell.clone());
      const plastic = product.finish === 'plastic';
      Object.assign(mm, { map: null, side: DoubleSide, roughness: plastic ? .38 : .78, metalness: 0, clearcoat: plastic ? .7 : 0,
        clearcoatRoughness: .12, sheen: plastic ? 0 : .7, sheenRoughness: .5, envMapIntensity: plastic ? .7 : .5 });
      mm.sheenColor = new Color(base).lerp(new Color('#ffffff'), .1); mm.needsUpdate = true;
      const du = withDecal(mm);
      du.decalOn.value = decal ? 1 : 0; du.decalMap.value = decal;
      if (decal) du.decalRect.value.set(dc.rect[0], dc.rect[1], dc.rect[2], dc.rect[3]);
      if (!mesh) { mesh = new Mesh(geo, mm); model.add(mesh); } else { mesh.geometry = geo; mesh.material = mm; }
      const rw = product.restY != null ? product.restY : -.4;   // tres cuartos de frente
      if (!current || current.product.model !== product.model) model.rotation.y = rw;
      restY = rw;
      const bb = geo.boundingBox;
      mesh.position.y = -(bb.max.y + bb.min.y) / 2;
      shadow.position.y = bb.min.y + mesh.position.y - .3;
      current = { product, variant };
      return;
    }
    if (product.model) {
      const [geo, livery] = await Promise.all([loadModel(product.model), designTexture(product, variant, 'livery', renderer)]);
      matShell.map = livery; matShell.needsUpdate = true;
      if (!mesh) { mesh = new Mesh(geo, matShell); model.add(mesh); }
      else { mesh.geometry = geo; mesh.material = matShell; }
      restY = Math.PI - .85;                            // tres cuartos de frente: se lee la forma del casco
      if (!current || current.product.model !== product.model) model.rotation.y = restY;
      const bb = geo.boundingBox;
      mesh.position.y = -(bb.max.y + bb.min.y) / 2;
      shadow.position.y = bb.min.y + mesh.position.y - .3;
      current = { product, variant };
      return;
    }
    const [front, back] = await Promise.all([
      designTexture(product, variant, 'front', renderer),
      designTexture(product, variant, 'back', renderer)
    ]);
    const prof = PROFILE[product.type] || PROFILE.tee;
    const geo = buildGeometry(product.type);
    const nmap = fabricNormal(prof.fabric);
    [matFront, matBack].forEach((m, i) => {
      m.map = i ? back : front; m.normalMap = nmap; m.normalScale = new Vector2(.35, .35);
      m.roughness = prof.rough; m.sheen = prof.sheen; m.needsUpdate = true;
      // el brillo de la tela toma el color de la prenda (si fuera blanco, el negro se vería gris)
      m.sheenColor = new Color(product.variants[variant].base).lerp(new Color('#ffffff'), .08);
    });
    [matFront, matBack].forEach((m) => { m.clearcoat = prof.coat || 0; m.clearcoatRoughness = .2; });
    if (!mesh) { mesh = new Mesh(geo, [matFront, matBack]); model.add(mesh); }
    else { mesh.geometry = geo; mesh.material = [matFront, matBack]; }
    if (current && current.product.model) model.rotation.y = 0;
    restY = 0;
    const bb = geo.boundingBox;
    mesh.position.y = -(bb.max.y + bb.min.y) / 2;
    shadow.position.y = bb.min.y + mesh.position.y - .35;
    current = { product, variant };
  }

  const gsap = window.gsap;
  const api = {
    canvas,
    /** Muestra un producto. mode: 'enter' | 'spin' | 'swap' */
    async setProduct(product, variant = 0, mode = 'enter') {
      if (!current || rm || !gsap || mode === 'none') { await apply(product, variant); resize(); setRunning(visible); return; }
      const same = current.product.id === product.id;
      if (mode === 'spin' || same) {
        // giro completo: la textura cambia justo cuando la prenda está de perfil
        await new Promise((res) => {
          gsap.timeline()
            .to(model.rotation, { y: '+=' + Math.PI, duration: .42, ease: 'power3.in' })
            .add(() => { apply(product, variant).then(res); })
            .to(model.rotation, { y: '+=' + Math.PI, duration: .75, ease: 'expo.out' });
        });
        return;
      }
      // cambio de prenda: sale disparada hacia un lado y entra la nueva con "smear"
      await new Promise((res) => {
        gsap.timeline()
          .to(model.position, { x: -3.2, duration: .38, ease: 'power3.in' }, 0)
          .to(model.scale, { x: 1.25, y: .85, duration: .38, ease: 'power3.in' }, 0)
          .add(() => apply(product, variant).then(() => {
            gsap.timeline({ onComplete: res })
              .fromTo(model.position, { x: 3.2 }, { x: 0, duration: .8, ease: 'expo.out' }, 0)
              .fromTo(model.scale, { x: 1.25, y: .85 }, { x: 1, y: 1, duration: .9, ease: 'elastic.out(1, .6)' }, 0)
              .fromTo(model.rotation, { y: restY - .9 }, { y: restY, duration: 1, ease: 'expo.out' }, 0);
          }));
      });
    },
    /** Gira la prenda para mostrar el frente o la espalda */
    showSide(side) {
      const target = side === 'back' ? Math.PI : 0;
      const turns = Math.round((rotY - target) / (Math.PI * 2));
      const to = target + turns * Math.PI * 2;
      velY = 0; idleAt = performance.now() + 4000;
      if (rm || !gsap) { rotY = to; return; }
      const o = { v: rotY };
      gsap.to(o, { v: to, duration: .9, ease: 'expo.inOut', onUpdate: () => { rotY = o.v; } });
    },
    zoomTo(on) { zoomTarget = on ? 1 : 0; idleAt = performance.now() + (on ? 1e9 : 0); if (on) api.showSide('front'); },
    setAccent(hex) {
      const c = new Color(hex);
      if (rm || !gsap) { rim.color.copy(c); rim2.color.copy(c); return; }
      [rim, rim2].forEach((l) => gsap.to(l.color, { r: c.r, g: c.g, b: c.b, duration: .8, ease: 'power2.out' }));
    },
    resize,
    dispose() { setRunning(false); ro.disconnect(); io.disconnect(); renderer.dispose(); canvas.remove(); }
  };
  resize();
  return api;
}

export function supportsWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
