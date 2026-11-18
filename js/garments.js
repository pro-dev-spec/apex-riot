/* =========================================================
   APEX RIOT · Ilustraciones de producto (SVG generado)
   Todas las prendas son ilustraciones vectoriales originales
   del equipo, dibujadas con código. No usan fotos externas,
   así que no requieren licencias y pesan casi nada.
   garmentSVG(tipo, variante, vista, uid) -> string <svg>
   ========================================================= */
(function () {
  'use strict';

  var LOGO = 'M0 100 L40 0 L60 0 L100 100 L78 100 L50 28 L22 100 Z';
  var BAR = 'M24 74 L84 56 L80 70 L20 88 Z';

  function mark(x, y, s, fill, bar) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="' + LOGO + '" fill="' + fill + '"/>' +
      '<path d="' + BAR + '" fill="' + (bar || fill) + '"/></g>';
  }

  function shade(uid) {
    return '<linearGradient id="sh' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".14"/>' +
      '<stop offset=".45" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>';
  }

  function wrap(uid, label, defs, body, vb) {
    return '<svg class="garment" viewBox="' + (vb || '0 0 400 440') + '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' + shade(uid) + defs + '</defs>' + body + '</svg>';
  }

  /* En modo "flat" (texturas para el visor 3D) se omiten sombreado y contorno:
     la luz real de la escena 3D se encarga del volumen. */
  var FLAT = false;
  function SHADE(d, uid) { return FLAT ? '' : '<path d="' + d + '" fill="url(#sh' + uid + ')"/>'; }

  function outline(d) {
    if (FLAT) return '';
    return '<path d="' + d + '" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5" stroke-linejoin="round"/>';
  }

  /* ---------- JERSEY ---------- */
  function jersey(v, view, uid, num, ls) {
    var neck = 'M140 40 Q200 ' + (view === 'back' ? 52 : 70) + ' 260 40 ';
    var body = ls
      ? neck + 'L330 60 L372 200 L394 330 L348 340 L328 214 L310 150 L310 400 Q200 420 90 400 L90 150 L72 214 L52 340 L6 330 L28 200 L70 60 Z'
      : neck + 'L330 60 L392 168 L340 196 L310 140 L310 400 Q200 420 90 400 L90 140 L60 196 L8 168 L70 60 Z';
    var c = 'url(#c' + uid + ')';
    var s = '<path d="' + body + '" fill="' + v.base + '"/>' +
      '<g clip-path="' + c + '">';
    if (view === 'back') {
      s += '<polygon points="40,330 360,250 360,300 40,380" fill="' + v.accent + '"/>' +
        '<polygon points="40,392 360,312 360,320 40,400" fill="' + v.detail + '"/>' +
        '<text x="200" y="118" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="30" letter-spacing="6" fill="' + v.detail + '">APEX RIOT</text>' +
        '<text x="200" y="270" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="150" fill="' + v.accent + '" stroke="' + v.detail + '" stroke-width="4" paint-order="stroke">' + (num || '00') + '</text>';
    } else {
      s += '<polygon points="40,270 360,120 360,190 40,340" fill="' + v.accent + '"/>' +
        '<polygon points="40,352 360,202 360,212 40,362" fill="' + v.detail + '"/>' +
        mark(232, 228, 0.42, v.detail, v.accent === v.detail ? v.base : v.detail) +
        '<text x="120" y="388" font-family="Space Mono,monospace" font-size="11" fill="' + v.detail + '" opacity=".75">SKU//APX-' + (num || '00') + '</text>';
    }
    s += (ls
      ? '<line x1="2" y1="322" x2="56" y2="334" stroke="' + v.accent + '" stroke-width="28"/>' +
        '<line x1="398" y1="322" x2="344" y2="334" stroke="' + v.accent + '" stroke-width="28"/>' +
        '<polygon points="20,190 80,170 84,190 24,212" fill="' + v.accent + '"/><polygon points="380,190 320,170 316,190 376,212" fill="' + v.accent + '"/>' +
        '<path d="M90 150 L72 214 M310 150 L328 214" stroke="#000" stroke-opacity=".25" stroke-width="2"/>'
      : '<line x1="14" y1="160" x2="66" y2="188" stroke="' + v.accent + '" stroke-width="26"/>' +
        '<line x1="386" y1="160" x2="334" y2="188" stroke="' + v.accent + '" stroke-width="26"/>' +
        '<path d="M90 140 L60 196 M310 140 L340 196" stroke="#000" stroke-opacity=".25" stroke-width="2"/>') +
      '<path d="M70 60 L90 140 M330 60 L310 140" stroke="' + v.detail + '" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="4 5" fill="none"/>' +
      SHADE(body, uid) + '</g>';
    s += view === 'back'
      ? '<path d="M140 40 Q200 52 260 40" fill="none" stroke="' + v.detail + '" stroke-width="10" stroke-linecap="round"/>'
      : '<path d="M138 42 Q200 118 262 42" fill="none" stroke="' + v.detail + '" stroke-width="12" stroke-linecap="round"/>';
    s += outline(body);
    return { defs: '<clipPath id="c' + uid + '"><path d="' + body + '"/></clipPath>', body: s };
  }

  /* ---------- PANTALÓN ---------- */
  function pants(v, view, uid) {
    var body = 'M108 28 L292 28 L302 74 L326 408 L226 420 L206 158 L194 158 L174 420 L74 408 L98 74 Z';
    var c = 'url(#c' + uid + ')';
    var s = '<path d="' + body + '" fill="' + v.base + '"/><g clip-path="' + c + '">' +
      '<rect x="90" y="28" width="220" height="30" fill="' + v.detail + '" opacity=".9"/>' +
      '<rect x="90" y="40" width="220" height="5" fill="' + v.base + '" opacity=".6"/>';
    if (view === 'back') {
      s += '<path d="M98 74 Q200 120 302 74 L304 96 Q200 140 96 96 Z" fill="' + v.accent + '"/>' +
        '<text x="200" y="196" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="44" letter-spacing="4" fill="' + v.accent + '">APEX</text>' +
        '<rect x="70" y="330" width="260" height="22" fill="' + v.accent + '" opacity=".85"/>';
    } else {
      s += '<polygon points="80,170 196,110 196,140 80,200" fill="' + v.accent + '"/>' +
        '<polygon points="204,110 320,170 320,200 204,140" fill="' + v.accent + '"/>' +
        '<rect x="96" y="240" width="88" height="96" rx="22" fill="' + v.accent + '"/>' +
        '<rect x="216" y="240" width="88" height="96" rx="22" fill="' + v.accent + '"/>' +
        '<path d="M110 262 L170 262 M110 288 L170 288 M110 314 L170 314 M230 262 L290 262 M230 288 L290 288 M230 314 L290 314" stroke="' + v.base + '" stroke-opacity=".5" stroke-width="3"/>' +
        mark(118, 120, 0.3, v.detail);
    }
    s += '<path d="M200 58 L200 158" stroke="#000" stroke-opacity=".35" stroke-width="2"/>' +
      '<path d="M104 80 L84 400 M296 80 L316 400" stroke="' + v.detail + '" stroke-opacity=".3" stroke-width="1.5" stroke-dasharray="4 5"/>' +
      SHADE(body, uid) + '</g>' + outline(body);
    return { defs: '<clipPath id="c' + uid + '"><path d="' + body + '"/></clipPath>', body: s };
  }

  /* ---------- HOODIE ---------- */
  function hoodie(v, view, uid) {
    var body = 'M120 70 Q200 95 280 70 L330 86 L386 332 L344 344 L300 172 L305 410 Q200 426 95 410 L100 172 L56 344 L14 332 L70 86 Z';
    var hood = view === 'back'
      ? 'M118 92 Q108 8 200 6 Q292 8 282 92 Q200 128 118 92 Z'
      : 'M118 78 Q112 8 200 6 Q288 8 282 78 Q200 112 118 78 Z';
    var c = 'url(#c' + uid + ')';
    var s = '<path d="' + hood + '" fill="' + v.base + '"/><path d="' + hood + '" fill="#000" opacity=".22"/>' + outline(hood) +
      '<path d="' + body + '" fill="' + v.base + '"/><g clip-path="' + c + '">' +
      '<rect x="80" y="388" width="240" height="30" fill="' + v.accent + '"/>' +
      '<line x1="30" y1="326" x2="70" y2="338" stroke="' + v.accent + '" stroke-width="30"/>' +
      '<line x1="370" y1="326" x2="330" y2="338" stroke="' + v.accent + '" stroke-width="30"/>';
    if (view === 'back') {
      s += '<text x="200" y="270" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="92" fill="' + v.accent + '">RIOT</text>' +
        '<text x="200" y="298" text-anchor="middle" font-family="Space Mono,monospace" font-size="10" letter-spacing="1" fill="' + v.detail + '">VIVE AL LÍMITE / DOMINA EL CAOS</text>' +
        mark(182, 128, 0.36, v.detail);
    } else {
      s += '<path d="M134 296 L266 296 L288 380 L112 380 Z" fill="#000" opacity=".18"/>' +
        '<path d="M134 296 L266 296 L288 380 L112 380 Z" fill="none" stroke="' + v.detail + '" stroke-opacity=".5" stroke-width="2" stroke-dasharray="5 5"/>' +
        '<text x="200" y="232" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="58" letter-spacing="2" fill="' + v.accent + '">APEX</text>' +
        '<path d="M178 98 L172 190 M222 98 L228 190" stroke="' + v.detail + '" stroke-width="5" stroke-linecap="round"/>';
    }
    s += SHADE(body, uid) + '</g>';
    if (view !== 'back') s += '<path d="M146 74 Q200 118 254 74 Q200 52 146 74 Z" fill="#000" opacity=".7"/>';
    s += outline(body);
    return { defs: '<clipPath id="c' + uid + '"><path d="' + body + '"/></clipPath>', body: s };
  }

  /* ---------- CAMISETA ---------- */
  function tee(v, view, uid) {
    var body = 'M140 50 Q200 ' + (view === 'back' ? 60 : 76) + ' 260 50 L336 76 L382 160 L326 186 L300 146 L302 410 Q200 422 98 410 L100 146 L74 186 L18 160 L64 76 Z';
    var c = 'url(#c' + uid + ')';
    var s = '<path d="' + body + '" fill="' + v.base + '"/><g clip-path="' + c + '">';
    if (view === 'back') {
      s += '<text x="200" y="150" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="40" letter-spacing="3" fill="' + v.accent + '">VIVE AL LÍMITE</text>' +
        '<path d="M120 300 L140 300 L152 250 L168 330 L184 210 L200 290 L216 270 L232 320 L248 230 L264 300 L280 300" fill="none" stroke="' + v.accent + '" stroke-width="5" stroke-linejoin="round"/>' +
        '<path d="M120 340 L280 340 M120 200 L120 340" stroke="' + v.detail + '" stroke-opacity=".6" stroke-width="2"/>' +
        '<text x="124" y="360" font-family="Space Mono,monospace" font-size="11" fill="' + v.detail + '">LAP 01 · 1:42.07 · 88KM/H</text>';
    } else {
      s += mark(150, 150, 1, v.accent, v.detail) +
        '<text x="200" y="300" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="30" letter-spacing="8" fill="' + v.accent + '">APEX RIOT</text>';
    }
    s += '<line x1="22" y1="152" x2="76" y2="178" stroke="' + v.accent + '" stroke-width="10" opacity=".9"/>' +
      '<line x1="378" y1="152" x2="324" y2="178" stroke="' + v.accent + '" stroke-width="10" opacity=".9"/>' +
      SHADE(body, uid) + '</g>' +
      '<path d="M140 50 Q200 ' + (view === 'back' ? 60 : 76) + ' 260 50" fill="none" stroke="' + v.detail + '" stroke-width="9" stroke-linecap="round"/>' +
      outline(body);
    return { defs: '<clipPath id="c' + uid + '"><path d="' + body + '"/></clipPath>', body: s };
  }

  /* ---------- GORRA ---------- */
  function cap(v, view, uid) {
    var crown = 'M78 270 Q74 108 200 96 Q326 108 322 270 Z';
    var s = '<path d="' + crown + '" fill="' + v.base + '"/>' +
      '<path d="M200 96 Q170 180 168 270 M200 96 Q230 180 232 270 M200 96 Q120 160 112 270 M200 96 Q280 160 288 270" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2"/>' +
      '<circle cx="200" cy="98" r="9" fill="' + v.accent + '"/>';
    if (view === 'back') {
      s += '<path d="M150 270 Q150 210 200 206 Q250 210 250 270 Z" fill="#0B0B0D"/>' +
        '<rect x="132" y="252" width="136" height="20" rx="4" fill="' + v.accent + '"/>' +
        '<text x="200" y="190" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="30" letter-spacing="4" fill="' + v.accent + '">RIOT</text>' +
        '<path d="M78 270 L322 270" stroke="' + v.detail + '" stroke-width="6"/>';
    } else {
      s += mark(155, 150, 0.9, v.accent, v.detail) +
        '<path d="M60 262 Q200 236 340 262 Q380 300 340 322 Q200 296 60 322 Q20 300 60 262 Z" fill="' + v.base + '"/>' +
        '<path d="M60 262 Q200 236 340 262 Q380 300 340 322 Q200 296 60 322 Q20 300 60 262 Z" fill="#000" opacity=".25"/>' +
        '<path d="M66 300 Q200 276 334 300" fill="none" stroke="' + v.accent + '" stroke-width="4"/>' +
        outline('M60 262 Q200 236 340 262 Q380 300 340 322 Q200 296 60 322 Q20 300 60 262 Z');
    }
    s += SHADE(crown, uid) + outline(crown);
    return { defs: '', body: '<g transform="translate(0 30)">' + s + '</g>' };
  }

  /* ---------- GUANTES ---------- */
  function gloves(v, view, uid) {
    var fingers = [[138, 70], [174, 48], [210, 56], [246, 88]];
    var s = '<g transform="rotate(-8 200 240)">';
    s += '<rect x="140" y="330" width="138" height="84" rx="16" fill="' + v.detail + '"/>' +
      '<rect x="150" y="352" width="118" height="14" fill="' + v.accent + '"/>';
    s += '<rect x="96" y="196" width="34" height="108" rx="17" transform="rotate(-38 113 250)" fill="' + v.base + '"/>';
    fingers.forEach(function (f) {
      s += '<rect x="' + f[0] + '" y="' + f[1] + '" width="32" height="' + (230 - f[1]) + '" rx="16" fill="' + v.base + '"/>';
      s += '<rect x="' + f[0] + '" y="' + f[1] + '" width="32" height="' + (230 - f[1]) + '" rx="16" fill="url(#sh' + uid + ')"/>';
    });
    s += '<rect x="134" y="176" width="150" height="176" rx="36" fill="' + v.base + '"/>';
    if (view === 'back') {
      for (var y = 200; y < 330; y += 18) {
        for (var x = 156; x < 270; x += 18) s += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + v.detail + '" opacity=".45"/>';
      }
      fingers.forEach(function (f) { s += '<rect x="' + (f[0] + 6) + '" y="' + (f[1] + 8) + '" width="20" height="26" rx="8" fill="' + v.detail + '" opacity=".5"/>'; });
    } else {
      s += '<rect x="132" y="170" width="154" height="42" rx="20" fill="' + v.accent + '"/>' +
        '<path d="M150 191 L270 191" stroke="' + v.base + '" stroke-opacity=".5" stroke-width="4" stroke-dasharray="14 10"/>';
      fingers.forEach(function (f) { s += '<rect x="' + (f[0] + 5) + '" y="' + (f[1] + 40) + '" width="22" height="16" rx="6" fill="' + v.accent + '"/>'; });
      s += mark(186, 250, 0.42, v.accent);
    }
    s += '<rect x="134" y="176" width="150" height="176" rx="36" fill="url(#sh' + uid + ')"/>' +
      '<rect x="134" y="176" width="150" height="176" rx="36" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3"/></g>';
    return { defs: '', body: s };
  }

  /* ---------- CASCO (perfil lateral) ----------
     Coordenadas tomadas del perfil real del modelo 3D (mm del STL). */
  function hp(y, z) { return [40 + (y - 96.6) * 5.1, 352 - z * 5.1]; }
  function hpath(pts) { return 'M' + pts.map(function (q) { var a = hp(q[0], q[1]); return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join(' L') + ' Z'; }
  var H_SHELL = [[97.5, 3], [97, 15], [102, 19], [109, 21], [114, 29], [116, 37], [109, 40.5], [97, 45.5], [98, 47.5], [114, 45.8], [127, 43.5], [136, 47.8], [147, 47], [156, 40], [160, 27], [158.5, 12], [153, 2], [131, 0.5], [112, 1]];
  var H_PEAK = [[97, 45.5], [98, 47.5], [114, 45.8], [127, 43.5], [128, 39], [118, 39.5], [108, 41.5]];
  var H_PORT = [[109, 21], [114, 29], [116, 37], [121, 38], [124, 29], [122, 21.5]];
  function helmet(v, view, uid, num, product, vi) {
    if (view === 'livery') return helmetLivery(v, num);
    if (product && product.renders) {   // foto de estudio renderizada del modelo 3D real (tools/render_products.py)
      return { defs: '', body: '<image href="assets/img/renders/' + product.id + '-' + (vi || 0) + '-' + (view === 'back' ? 'back' : 'front') + '.webp" x="0" y="0" width="400" height="440" preserveAspectRatio="xMidYMid meet"/>' };
    }
    var shell = hpath(H_SHELL), c = 'url(#c' + uid + ')';
    var s = '<g' + (view === 'back' ? ' transform="translate(400 0) scale(-1 1)"' : '') + '>' +
      '<path d="' + shell + '" fill="' + v.base + '"/><g clip-path="' + c + '">' +
      '<path d="' + hpath([[128, 50], [143, 50], [126, -2], [111, -2]]) + '" fill="' + v.accent + '"/>' +
      '<path d="' + hpath([[146, 50], [150, 50], [131, -2], [127, -2]]) + '" fill="' + v.detail + '"/>' +
      '<path d="' + hpath([[96, 1], [160, 1], [160, -3], [96, -3]]) + '" fill="#0B0B0D"/>' +
      '<path d="' + hpath([[96, 3], [112, 3], [112, 9], [96, 9]]) + '" fill="' + v.detail + '" opacity=".85"/>' +
      SHADE(shell, uid) + '</g>' +
      '<path d="' + hpath(H_PEAK) + '" fill="' + v.accent + '"/>' +
      '<path d="' + hpath(H_PORT) + '" fill="#0B0B0D"/>' +
      '<path d="' + hpath([[112, 24], [115, 30], [116.5, 35.5], [120, 36.5], [122, 29], [120.5, 24]]) + '" fill="#00E5FF" opacity=".55"/>' +
      (view === 'back' ? '' :
        '<text transform="translate(' + hp(144, 23).join(' ') + ') rotate(-8)" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="44" letter-spacing="2" fill="' + v.detail + '">APEX</text>' +
        '<text transform="translate(' + hp(151, 36).join(' ') + ')" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="30" fill="' + v.accent + '">' + (num || '07') + '</text>') +
      '<circle cx="' + hp(125, 32)[0] + '" cy="' + hp(125, 32)[1] + '" r="6" fill="#8A8D93"/><circle cx="' + hp(125, 12)[0] + '" cy="' + hp(125, 12)[1] + '" r="5" fill="#8A8D93"/>' +
      outline(shell) + '</g>';
    return { defs: '<clipPath id="c' + uid + '"><path d="' + shell + '"/></clipPath>', body: s };
  }
  /* Decoración plana que el visor 3D proyecta sobre el casco real (628×482 = mm×10) */
  function helmetLivery(v, num) {
    // Atlas de dos mitades: izquierda = lado izquierdo del casco, derecha = lado derecho.
    // Las franjas son iguales; los textos del lado derecho van espejados para leerse bien.
    var P = function (pts) { return pts.map(function (q) { return ((q[0] - 96.6) * 10).toFixed(0) + ',' + ((48.2 - q[1]) * 10).toFixed(0); }).join(' '); };
    function side(m) {
      var f = function (x, y, extra) { return 'translate(' + x + ' ' + y + ')' + (m ? ' scale(-1 1)' : '') + (extra || ''); };
      return '<rect width="628" height="482" fill="' + v.base + '"/>' +
        '<polygon points="' + P([[122, 50], [134, 50], [117, -2], [105, -2]]) + '" fill="' + v.accent + '"/>' +
        '<polygon points="' + P([[136.5, 50], [139.5, 50], [121.5, -2], [118.5, -2]]) + '" fill="' + v.detail + '"/>' +
        '<polygon points="' + P([[95, 50], [131, 50], [129, 38.5], [96, 41]]) + '" fill="' + v.accent + '"/>' +
        '<polygon points="' + P([[95, 3], [113, 3], [113, 9.5], [95, 9.5]]) + '" fill="' + v.detail + '"/>' +
        '<rect y="452" width="628" height="40" fill="#0B0B0D"/>' +
        '<text transform="' + f(522, 262, m ? ' rotate(8)' : ' rotate(-8)') + '" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="84" letter-spacing="3" fill="' + v.detail + '">APEX</text>' +
        '<text transform="' + f(560, 128) + '" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="62" fill="' + v.accent + '">' + (num || '07') + '</text>' +
        '<g transform="' + f(m ? 414 : 372, 352) + ' scale(.42)"><path d="' + LOGO + '" fill="' + v.accent + '"/><path d="' + BAR + '" fill="' + v.detail + '"/></g>';
    }
    return { defs: '', body: side(false) + '<g transform="translate(628 0)">' + side(true) + '</g>', vb: '0 0 1256 482' };
  }

  /* ---------- GAFAS (goggles) ---------- */
  function goggles(v, view, uid) {
    var frame = 'M118 140 H282 Q332 140 332 190 V252 Q332 300 282 300 H232 Q216 270 200 270 Q184 270 168 300 H118 Q68 300 68 252 V190 Q68 140 118 140 Z';
    var lens = 'M120 160 H280 Q312 160 312 192 V248 Q312 280 280 280 H238 Q218 252 200 252 Q182 252 162 280 H120 Q88 280 88 248 V192 Q88 160 120 160 Z';
    var s = '<rect x="6" y="196" width="388" height="52" rx="10" fill="' + v.accent + '"/>';
    if (view === 'back') {
      s += '<path d="M20 214 H380 M20 230 H380" stroke="' + v.base + '" stroke-width="3" stroke-dasharray="10 8" opacity=".6"/>' +
        '<path d="' + frame + '" fill="' + v.base + '"/><path d="' + lens + '" fill="#3A3C42"/>' +
        '<path d="M100 180 H300 M100 200 H300 M100 220 H300 M100 240 H300 M110 260 H290" stroke="#2A2C31" stroke-width="6"/>';
    } else {
      s += '<text x="200" y="231" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="26" letter-spacing="10" fill="' + v.base + '">APEX RIOT · APEX RIOT</text>' +
        '<path d="' + frame + '" fill="' + v.base + '"/>' +
        '<path d="' + lens + '" fill="url(#lz' + uid + ')" opacity=".92"/>' +
        '<path d="M110 186 L170 166 M118 204 L196 176" stroke="#fff" stroke-width="7" opacity=".35" stroke-linecap="round"/>' +
        '<path d="M140 300 H168 M232 300 H260" stroke="' + v.detail + '" stroke-width="5"/>';
    }
    s += SHADE(frame, uid) + outline(frame);
    return { defs: '<linearGradient id="lz' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00E5FF"/><stop offset=".5" stop-color="#7B5CFF"/><stop offset="1" stop-color="' + v.accent + '"/></linearGradient>', body: s };
  }

  /* ---------- PETO (protector de pecho y espalda) ---------- */
  function chest(v, view, uid) {
    var body = 'M70 112 L126 42 Q200 96 274 42 L330 112 L330 252 Q330 378 200 420 Q70 378 70 252 Z';
    var c = 'url(#c' + uid + ')';
    var s = '<path d="' + body + '" fill="' + v.base + '"/><g clip-path="' + c + '">';
    if (view === 'back') {
      for (var i = 0; i < 6; i++) s += '<rect x="166" y="' + (110 + i * 50) + '" width="68" height="40" rx="10" fill="' + v.accent + '"/>';
      s += '<path d="M90 140 H150 M250 140 H310" stroke="' + v.detail + '" stroke-width="6" opacity=".6"/>';
    } else {
      s += '<path d="M90 150 H310 M84 200 H316 M90 250 H310 M110 300 H290" stroke="' + v.accent + '" stroke-width="12"/>' +
        '<path d="M200 96 V410" stroke="#000" stroke-opacity=".35" stroke-width="3"/>' +
        mark(176, 316, 0.48, v.detail, v.accent) +
        '<circle cx="120" cy="120" r="7" fill="' + v.detail + '"/><circle cx="280" cy="120" r="7" fill="' + v.detail + '"/>';
    }
    s += SHADE(body, uid) + '</g>' + outline(body);
    return { defs: '<clipPath id="c' + uid + '"><path d="' + body + '"/></clipPath>', body: s };
  }

  /* ---------- RODILLERA ---------- */
  function knee(v, view, uid) {
    var body = 'M140 40 Q200 18 260 40 L280 200 Q290 300 252 408 Q200 430 148 408 Q110 300 120 200 Z';
    var s = '<rect x="86" y="96" width="228" height="34" rx="8" fill="#26272C"/><rect x="86" y="318" width="228" height="34" rx="8" fill="#26272C"/>' +
      '<path d="' + body + '" fill="' + v.base + '"/>';
    if (view === 'back') {
      s += '<path d="M150 70 Q200 56 250 70 L262 390 Q200 410 138 390 Z" fill="#3A3C42"/>' +
        '<path d="M160 120 H240 M156 170 H244 M154 220 H246 M156 270 H244 M160 320 H240" stroke="#2A2C31" stroke-width="8"/>';
    } else {
      s += '<ellipse cx="200" cy="196" rx="72" ry="86" fill="' + v.accent + '"/>' +
        '<ellipse cx="200" cy="196" rx="50" ry="62" fill="none" stroke="' + v.base + '" stroke-width="5" opacity=".6"/>' +
        mark(180, 176, 0.4, v.base) +
        '<path d="M150 300 Q200 316 250 300 M156 340 Q200 354 244 340" stroke="' + v.detail + '" stroke-width="6" fill="none"/>';
    }
    s += '<rect x="96" y="104" width="30" height="18" rx="4" fill="' + v.accent + '"/><rect x="274" y="326" width="30" height="18" rx="4" fill="' + v.accent + '"/>' +
      SHADE(body, uid) + outline(body);
    return { defs: '', body: s };
  }

  /* ---------- CHAQUETA ---------- */
  function jacket(v, view, uid) {
    var body = 'M120 70 Q200 95 280 70 L330 86 L386 332 L344 344 L300 172 L305 410 Q200 426 95 410 L100 172 L56 344 L14 332 L70 86 Z';
    var collar = 'M146 62 Q200 44 254 62 L262 98 Q200 118 138 98 Z';
    var c = 'url(#c' + uid + ')';
    var s = '<path d="' + body + '" fill="' + v.base + '"/><g clip-path="' + c + '">' +
      '<polygon points="10,250 120,190 120,214 10,276" fill="' + v.accent + '"/><polygon points="390,250 280,190 280,214 390,276" fill="' + v.accent + '"/>' +
      '<rect x="80" y="392" width="240" height="22" fill="' + v.detail + '" opacity=".8"/>';
    if (view === 'back') {
      s += '<path d="M90 150 Q200 190 310 150 L312 172 Q200 214 88 172 Z" fill="' + v.accent + '"/>' +
        '<text x="200" y="290" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="70" fill="' + v.detail + '">RIOT</text>';
    } else {
      s += '<path d="M200 100 V410" stroke="' + v.detail + '" stroke-width="5"/>' +
        '<path d="M132 280 L178 280 M222 280 L268 280" stroke="' + v.detail + '" stroke-width="5" stroke-linecap="round"/>' +
        mark(236, 150, 0.36, v.accent);
    }
    s += SHADE(body, uid) + '</g>' + outline(body) +
      '<path d="' + collar + '" fill="' + v.base + '"/><path d="' + collar + '" fill="#000" opacity=".2"/>' + outline(collar);
    return { defs: '<clipPath id="c' + uid + '"><path d="' + body + '"/></clipPath>', body: s };
  }

  function jerseyLS(v, view, uid, num) { return jersey(v, view, uid, num, true); }
  var MAKERS = { jersey: jersey, jerseyLS: jerseyLS, pants: pants, hoodie: hoodie, tee: tee, cap: cap, gloves: gloves,
    helmet: helmet, goggles: goggles, chest: chest, knee: knee, jacket: jacket };
  var counter = 0;

  window.garmentSVG = function (product, variantIndex, view, flat) {
    FLAT = !!flat;
    try { return render(product, variantIndex, view); } finally { FLAT = false; }
  };
  function render(product, variantIndex, view) {
    var v = product.variants[variantIndex || 0] || product.variants[0];
    var uid = (window.GARMENT_PREFIX || 'g') + (++counter);
    var fn = MAKERS[product.type] || tee;
    // camisetas personalizadas con la calcomanía de marca: foto del modelo 3D real, igual que en el visor
    var out = product.decal && product.renders && view !== 'livery'
      ? { defs: '', body: '<image href="assets/img/renders/' + product.id + '-' + (variantIndex || 0) + '-' + (view === 'back' ? 'back' : 'front') + '.webp" x="0" y="0" width="400" height="440" preserveAspectRatio="xMidYMid meet"/>' }
      : fn(v, view || 'front', uid, product.number, product, variantIndex || 0);
    var label = product.name + ', ' + v.name + (view === 'back' ? ', vista trasera' : ', vista frontal');
    return wrap(uid, label, out.defs, out.body, out.vb);
  }
  window.APEX_LOGO_PATHS = { a: LOGO, bar: BAR };

  /* ---------- Siluetas para el visor 3D ----------
     Contornos (en el mismo espacio 400x440) con los que el visor
     construye el volumen de cada prenda. m = matriz [a b c d e f]. */
  function rr(x, y, w, h, r) {
    return 'M' + (x + r) + ' ' + y + ' H' + (x + w - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) +
      ' V' + (y + h - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + w - r) + ' ' + (y + h) + ' H' + (x + r) +
      ' A' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + (y + h - r) + ' V' + (y + r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y + ' Z';
  }
  function rot(deg, cx, cy) {
    var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
  }
  function mul(m1, m2) { // m1 · m2
    return [m1[0] * m2[0] + m1[2] * m2[1], m1[1] * m2[0] + m1[3] * m2[1], m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3], m1[0] * m2[4] + m1[2] * m2[5] + m1[4], m1[1] * m2[4] + m1[3] * m2[5] + m1[5]];
  }
  var GLOVE = rot(-8, 200, 240);
  var SIL = {
    jersey: [{ d: 'M140 40 Q200 70 260 40 L330 60 L392 168 L340 196 L310 140 L310 400 Q200 420 90 400 L90 140 L60 196 L8 168 L70 60 Z' }],
    jerseyLS: [{ d: 'M140 40 Q200 70 260 40 L330 60 L372 200 L394 330 L348 340 L328 214 L310 150 L310 400 Q200 420 90 400 L90 150 L72 214 L52 340 L6 330 L28 200 L70 60 Z' }],
    pants: [{ d: 'M108 28 L292 28 L302 74 L326 408 L226 420 L206 158 L194 158 L174 420 L74 408 L98 74 Z' }],
    hoodie: [{ d: 'M120 70 Q200 95 280 70 L330 86 L386 332 L344 344 L300 172 L305 410 Q200 426 95 410 L100 172 L56 344 L14 332 L70 86 Z' },
             { d: 'M118 78 Q112 8 200 6 Q288 8 282 78 Q200 112 118 78 Z' }],
    tee: [{ d: 'M140 50 Q200 76 260 50 L336 76 L382 160 L326 186 L300 146 L302 410 Q200 422 98 410 L100 146 L74 186 L18 160 L64 76 Z' }],
    cap: [{ d: 'M78 270 Q74 108 200 96 Q326 108 322 270 Z', m: [1, 0, 0, 1, 0, 30] },
          { d: 'M60 262 Q200 236 340 262 Q380 300 340 322 Q200 296 60 322 Q20 300 60 262 Z', m: [1, 0, 0, 1, 0, 30] }],
    gloves: [{ d: rr(140, 320, 138, 94, 16), m: GLOVE }, { d: rr(134, 176, 150, 176, 36), m: GLOVE },
             { d: rr(138, 70, 32, 160, 16), m: GLOVE }, { d: rr(174, 48, 32, 182, 16), m: GLOVE },
             { d: rr(210, 56, 32, 174, 16), m: GLOVE }, { d: rr(246, 88, 32, 142, 16), m: GLOVE },
             { d: rr(96, 196, 34, 108, 17), m: mul(GLOVE, rot(-38, 113, 250)) }],
    jacket: [{ d: 'M120 70 Q200 95 280 70 L330 86 L386 332 L344 344 L300 172 L305 410 Q200 426 95 410 L100 172 L56 344 L14 332 L70 86 Z' },
             { d: 'M146 62 Q200 44 254 62 L262 98 Q200 118 138 98 Z' }],
    goggles: [{ d: 'M118 140 H282 Q332 140 332 190 V252 Q332 300 282 300 H232 Q216 270 200 270 Q184 270 168 300 H118 Q68 300 68 252 V190 Q68 140 118 140 Z' },
              { d: rr(6, 196, 388, 52, 10) }],
    chest: [{ d: 'M70 112 L126 42 Q200 96 274 42 L330 112 L330 252 Q330 378 200 420 Q70 378 70 252 Z' }],
    knee: [{ d: 'M140 40 Q200 18 260 40 L280 200 Q290 300 252 408 Q200 430 148 408 Q110 300 120 200 Z' },
           { d: rr(86, 96, 228, 34, 8) }, { d: rr(86, 318, 228, 34, 8) }]
  };
  window.garmentSilhouette = function (type) { return SIL[type] || SIL.tee; };
})();
