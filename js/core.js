/* =========================================================
   APEX RIOT · Núcleo compartido por las 6 páginas
   - Preferencia de movimiento (.rm)
   - Transición entre páginas (wipe diagonal)
   - Header: menú móvil, progreso de scroll, ocultar al bajar
   - Carrito simulado (localStorage) + vuelo al carrito + toast
   - Tarjeta de producto reutilizable
   - Revelado de elementos al hacer scroll (GSAP ScrollTrigger)
   - Modos de deporte (MX, MTB, BMX, URBAN) y visor 3D diferido
   - Fluidez: scroll suave (Lenis), precarga de páginas, tilt 3D
   ========================================================= */
window.APEX = (function () {
  'use strict';

  var html = document.documentElement;
  var RM = html.classList.contains('rm');
  var hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Utilidades ---------- */
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('es-CO'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } }
  };

  var ICON = {
    arrow: '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    check: '<svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg>'
  };
  var FEATURE = {
    ventilacion: ['Ventilación', '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>'],
    secado: ['Secado rápido', '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/><path d="M9 15l2 2 4-4"/>'],
    elastico: ['Elástico 4D', '<path d="M4 12h16M7 8l-3 4 3 4M17 8l3 4-3 4"/>'],
    proteccion: ['Protección', '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>'],
    resistente: ['Ultrarresistente', '<path d="M4 20L20 4M8 4h12v12"/>'],
    agarre: ['Agarre', '<circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/>'],
    impermeable: ['Repele el agua', '<path d="M4 13a8 8 0 0 1 16 0zM12 13v6a2 2 0 0 1-4 0"/>'],
    uv: ['Protección UV 50+', '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'],
    abrigo: ['Abrigo', '<path d="M12 3v18M5 7l14 10M5 17L19 7"/>'],
    reflectivo: ['Reflectivo', '<path d="M3 12l9-9 9 9-9 9z"/><path d="M12 7v10"/>']
  };
  function featureIcon(key) {
    var f = FEATURE[key]; if (!f) return '';
    return '<li><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + f[1] + '</svg>' + f[0] + '</li>';
  }

  /* ---------- Modos de deporte ----------
     Cada modo tiñe la interfaz con su acento (variable --mode),
     cambia el producto héroe 3D y filtra el catálogo. */
  var MODES = {
    MX:    { name: 'Motocross', short: 'MX',    accent: '#C6FF00', hero: 'casco-apex-pro' },
    MTB:   { name: 'Mountain bike', short: 'MTB', accent: '#00E5FF', hero: 'googles-brick-mtb' },
    BMX:   { name: 'BMX', short: 'BMX',         accent: '#FF4D00', hero: 'jersey-gatedrop-bmx' },
    URBAN: { name: 'Urban', short: 'URBAN',     accent: '#F2F2EE', hero: 'tee-unicornio-riot' }
  };
  function getMode() { var m = html.getAttribute('data-mode'); return MODES[m] ? m : 'MX'; }
  function setMode(m) {
    if (!MODES[m]) return;
    html.setAttribute('data-mode', m);
    try { localStorage.setItem('apex-mode', m); } catch (e) { /* */ }
    document.dispatchEvent(new CustomEvent('apex:mode', { detail: m }));
  }

  /* ---------- Visor 3D (three.js) bajo demanda ----------
     El módulo pesa ~145 KB comprimido, así que se descarga solo
     cuando la página ya cargó y el navegador está libre. */
  var _viewer;
  function supportsWebGL() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function load3D() {
    if (!supportsWebGL()) return Promise.reject(new Error('Sin WebGL'));
    if (!_viewer) _viewer = import('./3d/viewer3d.min.js');
    return _viewer;
  }
  /* Carga en la primera interacción (mover el mouse, tocar, hacer scroll o
     usar el teclado): el 3D no compite con la carga inicial de la página,
     pero aparece en cuanto la persona empieza a usarla. */
  function whenInteracted(fn) {
    var evs = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'scroll'], done = false;
    var go = function () {
      if (done) return; done = true;
      evs.forEach(function (ev) { window.removeEventListener(ev, go, true); });
      whenIdle(fn, 0);
    };
    evs.forEach(function (ev) { window.addEventListener(ev, go, { capture: true, passive: true }); });
  }
  function whenIdle(fn, delay) {
    var go = function () { setTimeout(function () { (window.requestIdleCallback || function (f) { setTimeout(f, 1); })(fn, { timeout: 2500 }); }, delay || 0); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }

  /* ---------- Datos de productos ---------- */
  var _products;
  function products() {
    if (!_products) {
      _products = fetch('data/products.json').then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar products.json');
        return r.json();
      });
    }
    return _products;
  }
  /* Tipo de producto (para filtros y etiquetas) */
  var KIND = { jersey: 'Jerseys', jerseyLS: 'Jerseys', pants: 'Pantalones', gloves: 'Guantes', helmet: 'Cascos', goggles: 'Gafas',
    chest: 'Protecciones', knee: 'Protecciones', hoodie: 'Hoodies', tee: 'Camisetas', cap: 'Gorras', jacket: 'Chaquetas' };
  function kind(p) { return KIND[p.type] || 'Otros'; }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  /* ---------- Carrito simulado ---------- */
  var CART_KEY = 'apex-cart';
  var FREE_SHIPPING = 300000;
  var SHIPPING = 15000;
  var cart = {
    items: function () { return store.get(CART_KEY, []); },
    save: function (items) { store.set(CART_KEY, items); updateBadge(); },
    add: function (id, size, variant, qty) {
      var items = cart.items(), key = id + '|' + size + '|' + variant, found = null;
      items.forEach(function (it) { if (it.key === key) found = it; });
      if (found) found.qty = Math.min(9, found.qty + qty);
      else items.push({ key: key, id: id, size: size, variant: variant, qty: qty });
      cart.save(items);
    },
    setQty: function (key, qty) {
      var items = cart.items().map(function (it) { if (it.key === key) it.qty = Math.max(1, Math.min(9, qty)); return it; });
      cart.save(items);
    },
    remove: function (key) { cart.save(cart.items().filter(function (it) { return it.key !== key; })); },
    clear: function () { cart.save([]); },
    count: function () { return cart.items().reduce(function (a, it) { return a + it.qty; }, 0); },
    totals: function (list) {
      var sub = cart.items().reduce(function (a, it) { var p = byId(list, it.id); return a + (p ? p.price * it.qty : 0); }, 0);
      var ship = sub === 0 || sub >= FREE_SHIPPING ? 0 : SHIPPING;
      return { sub: sub, ship: ship, total: sub + ship, missing: Math.max(0, FREE_SHIPPING - sub), progress: Math.min(1, sub / FREE_SHIPPING) };
    },
    FREE_SHIPPING: FREE_SHIPPING
  };

  function updateBadge(animate) {
    var n = cart.count();
    $$('.cart-badge').forEach(function (b) {
      b.textContent = n;
      b.classList.toggle('has-items', n > 0);
    });
    $$('[data-cart-link]').forEach(function (a) { a.setAttribute('aria-label', 'Carrito, ' + n + (n === 1 ? ' producto' : ' productos')); });
    if (animate && !RM) {
      $$('[data-cart-link]').forEach(function (a) { a.classList.remove('bump'); void a.offsetWidth; a.classList.add('bump'); });
      if (hasGSAP) gsap.fromTo('.cart-badge', { yPercent: -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .35, ease: 'back.out(3)' });
    }
  }

  /* Vuelo al carrito: una chispa ácida viaja en arco desde el botón hasta el icono */
  function flyToCart(fromEl, done) {
    var target = $('.header [data-cart-link]');
    var header = $('.header');
    if (header) header.classList.remove('is-hidden');
    if (RM || !hasGSAP || !fromEl || !target) { done && done(); return; }
    var a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    var dot = document.createElement('div');
    dot.className = 'fly-dot';
    document.body.appendChild(dot);
    var sx = a.left + a.width / 2, sy = a.top + a.height / 2, ex = b.left + b.width / 2, ey = b.top + b.height / 2;
    var p = { t: 0 };
    var cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 160; // punto de control: el arco sube antes de caer
    gsap.to(p, {
      t: 1, duration: .75, ease: 'power2.in',
      onUpdate: function () {
        var t = p.t, x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex, y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey;
        gsap.set(dot, { x: x, y: y, scale: 1 - t * .5 });
      },
      onComplete: function () { dot.remove(); done && done(); }
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg, withLink) {
    var t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (withLink ? '<a href="carrito.html">Ver garaje</a>' : '');
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3200);
  }

  /* ---------- Tarjeta de producto ---------- */
  function card(p, i) {
    var sale = !!p.oldPrice;
    var badge = p.badge ? '<span class="badge' + (sale ? ' badge--sale' : '') + '">' + esc(p.badge) + '</span>' : '';
    return '<article class="card" data-id="' + p.id + '" data-reveal>' +
      badge +
      '<div class="card__media">' +
        '<div class="view view--front">' + garmentSVG(p, 0, 'front') + '</div>' +
        '<div class="view view--back" aria-hidden="true">' + garmentSVG(p, 0, 'back') + '</div>' +
      '</div>' +
      '<div class="card__body">' +
        '<div class="card__meta"><span>' + p.category + ' · ' + kind(p) + '</span><span>' + p.sku + '</span></div>' +
        '<h3 class="card__name">' + esc(p.name) + '</h3>' +
        '<div class="price' + (sale ? ' price--sale' : '') + '"><span>' + fmt(p.price) + '</span>' + (sale ? '<del>' + fmt(p.oldPrice) + '</del>' : '') + '</div>' +
      '</div>' +
      '<a class="card__link" href="producto.html?id=' + p.id + '" data-flip aria-label="Ver ' + esc(p.name) + '"></a>' +
      '<button class="card__quick" type="button" data-quick="' + p.id + '" aria-label="Añadir ' + esc(p.name) + ' al garaje">' + ICON.plus + '</button>' +
    '</article>';
  }

  function defaultSize(p) {
    return p.sizes.indexOf('M') > -1 ? 'M' : p.sizes.indexOf('32') > -1 ? '32' : p.sizes[0];
  }

  /* Añadido rápido desde cualquier grilla de tarjetas */
  function bindQuickAdd(root, list) {
    tilt(root);
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-quick]');
      if (!btn) return;
      var p = byId(list, btn.getAttribute('data-quick'));
      if (!p) return;
      var size = defaultSize(p);
      flyToCart(btn, function () {
        cart.add(p.id, size, 0, 1);
        updateBadge(true);
        toast(p.name + ' · talla ' + size + ' en tu garaje', true);
      });
    });
  }

  /* ---------- Header ---------- */
  function initHeader() {
    var header = $('.header');
    var bar = $('.scroll-progress');
    var menuBtn = $('.menu-btn');
    var mnav = $('.mobile-nav');
    var lastY = window.scrollY, ticking = false;

    function onScroll() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (header) {
        header.classList.toggle('is-scrolled', y > 20);
        var menuOpen = mnav && mnav.classList.contains('is-open');
        if (!menuOpen) header.classList.toggle('is-hidden', y > 300 && y > lastY + 4);
        if (y < lastY - 4) header.classList.remove('is-hidden');
      }
      lastY = y; ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    if (menuBtn && mnav) {
      var setMenu = function (open) {
        mnav.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        header.classList.toggle('is-solid', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (lenis) { if (open) lenis.stop(); else lenis.start(); }
        if (open && hasGSAP && !RM) gsap.from($$('a', mnav), { yPercent: 100, opacity: 0, duration: .5, stagger: .05, delay: .15, ease: 'power4.out' });
        if (open) { var first = $('a', mnav); first && first.focus({ preventScroll: true }); }
      };
      menuBtn.addEventListener('click', function () { setMenu(!mnav.classList.contains('is-open')); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
    }

    /* Botón de movimiento: permite apagar las animaciones (WCAG 2.2.2) */
    $$('.motion-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(!RM));
      btn.addEventListener('click', function () {
        try { localStorage.setItem('apex-motion', RM ? 'on' : 'off'); } catch (e) { /* */ }
        location.reload();
      });
    });

    updateBadge(false);
  }

  /* ---------- Transición entre páginas ----------
     Salida: se añade .is-leaving (CSS anima la cortina) y luego se navega.
     Entrada: el script del <head> pone .is-entering y la cortina sale sola.
     Si algo falla, la navegación ocurre igual por el setTimeout. */
  function initTransitions() {
    window.addEventListener('pageshow', function () { html.classList.remove('is-leaving', 'is-fading'); });
    var wipe = $('.wipe');
    if (wipe) wipe.addEventListener('animationend', function (e) {
      if (e.animationName === 'hideWipe') html.classList.remove('is-entering');
    });
    if (RM) return;

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-wipe')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // anclas internas
      if (!/(\.html|\/)$/.test(url.pathname)) return;
      e.preventDefault();

      if (a.hasAttribute('data-flip')) {
        /* Producto: guardamos la posición de la imagen para que vuele a la galería (FLIP entre páginas) */
        var media = a.parentNode.querySelector('.card__media');
        if (media) {
          var r = media.getBoundingClientRect();
          try { sessionStorage.setItem('apex-flip', JSON.stringify({ x: r.left, y: r.top, w: r.width, h: r.height })); } catch (err) { /* */ }
        }
        html.classList.add('is-fading');
        setTimeout(function () { location.href = url.href; }, 220);
        return;
      }
      try { sessionStorage.setItem('apex-wipe', '1'); } catch (err) { /* */ }
      html.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 470);
    });
  }

  /* ---------- Revelado al hacer scroll ----------
     data-reveal       → sube y aparece
     data-reveal="clip" → máscara diagonal que se abre
     data-reveal="lines" en un título con .line > span → líneas escalonadas */
  function reveal(scope) {
    if (RM || !hasGSAP || !window.ScrollTrigger) return;
    var els = $$('[data-reveal]:not(.is-revealed)', scope);
    if (!els.length) return;
    els.forEach(function (el) { el.classList.add('is-revealed'); });

    var basic = els.filter(function (el) { return !el.getAttribute('data-reveal'); });
    var clips = els.filter(function (el) { return el.getAttribute('data-reveal') === 'clip'; });
    var lines = els.filter(function (el) { return el.getAttribute('data-reveal') === 'lines'; });

    if (basic.length) {
      gsap.set(basic, { y: 48, opacity: 0, rotate: 1.5 });
      ScrollTrigger.batch(basic, {
        start: 'top 92%', once: true,
        onEnter: function (batch) { gsap.to(batch, { y: 0, opacity: 1, rotate: 0, duration: .8, stagger: .08, ease: 'expo.out', overwrite: true }); }
      });
    }
    clips.forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }, {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 1, ease: 'expo.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onComplete: function () { el.style.clipPath = ''; }
      });
    });
    lines.forEach(function (el) {
      gsap.from($$('.line > span', el), {
        yPercent: 110, skewY: 6, duration: .9, stagger: .09, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  function refresh() { if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh(); }

  /* ---------- Tilt 3D de tarjetas ----------
     La tarjeta se inclina siguiendo el puntero y un brillo recorre
     su superficie. quickTo interpola cada valor: movimiento continuo. */
  function tilt(scope) {
    if (RM || !hasGSAP || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.card:not([data-tilt])', scope).forEach(function (card) {
      card.setAttribute('data-tilt', '');
      var rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3.out' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3.out' });
      var media = $('.card__media .view--front', card);
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        rx((.5 - y) * 10); ry((x - .5) * 12);
        card.style.setProperty('--gx', (x * 100) + '%'); card.style.setProperty('--gy', (y * 100) + '%');
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* ---------- Scroll suave (Lenis) sincronizado con GSAP ----------
     Solo con mouse/trackpad; en táctil se respeta el scroll nativo. */
  var lenis = null;
  function initSmoothScroll() {
    if (RM || !window.Lenis || !hasGSAP || !window.ScrollTrigger || !matchMedia('(pointer: fine)').matches) return;
    lenis = new Lenis({ lerp: .11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Precarga de páginas al pasar el puntero ----------
     La siguiente página ya está en caché cuando termina el wipe. */
  function initPrefetch() {
    var done = {};
    var pre = function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$/.test(url.pathname) || done[url.pathname]) return;
      done[url.pathname] = 1;
      var l = document.createElement('link'); l.rel = 'prefetch'; l.href = url.pathname; document.head.appendChild(l);
    };
    document.addEventListener('pointerover', pre, { passive: true });
    document.addEventListener('touchstart', pre, { passive: true });
    document.addEventListener('focusin', pre);
  }

  /* ---------- Acordeón (<details>) con apertura animada ---------- */
  function accordion(scope) {
    $$('details.acc', scope).forEach(function (d) {
      var sum = $('summary', d), body = $('.acc__body', d);
      if (!sum || !body || d.dataset.acc) return;
      d.dataset.acc = '1';
      sum.addEventListener('click', function (e) {
        if (RM || !hasGSAP) return; // comportamiento nativo
        e.preventDefault();
        if (d.open) {
          gsap.to(body, { height: 0, opacity: 0, duration: .3, ease: 'power3.in', onComplete: function () { d.open = false; gsap.set(body, { clearProps: 'all' }); refresh(); } });
        } else {
          d.open = true;
          gsap.from(body, { height: 0, opacity: 0, duration: .45, ease: 'expo.out', onComplete: function () { gsap.set(body, { clearProps: 'all' }); refresh(); } });
        }
      });
    });
  }

  /* ---------- Validación de formularios con micro-feedback ---------- */
  function validateField(input) {
    var field = input.closest('.field'), err = field && $('.error', field), msg = '';
    var v = input.value.trim();
    if (input.required && !v) msg = 'Este campo es obligatorio.';
    else if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Revisa el correo: falta algo.';
    else if (input.minLength > 0 && v.length < input.minLength) msg = 'Escribe al menos ' + input.minLength + ' caracteres.';
    if (field) {
      field.classList.toggle('is-invalid', !!msg);
      field.classList.toggle('is-valid', !msg && !!v);
    }
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg; if (err.id) input.setAttribute('aria-describedby', err.id); }
    return !msg;
  }
  function validateForm(form) {
    var inputs = $$('.input[required]', form), firstBad = null;
    inputs.forEach(function (i) { if (!validateField(i) && !firstBad) firstBad = i; });
    if (firstBad) {
      var f = firstBad.closest('.field');
      if (f && !RM) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
      firstBad.focus();
    }
    return !firstBad;
  }
  function liveValidation(form) {
    $$('.input', form).forEach(function (i, n) {
      var err = i.closest('.field') && $('.error', i.closest('.field'));
      if (err && !err.id) err.id = (form.id || 'f') + '-err-' + n;
      i.addEventListener('blur', function () { if (i.value) validateField(i); });
      i.addEventListener('input', function () { if (i.closest('.field').classList.contains('is-invalid')) validateField(i); });
    });
  }

  /* ---------- Arranque común ---------- */
  function boot() {
    initHeader();
    initTransitions();
    reveal(document);
    accordion(document);
    initSmoothScroll();
    initPrefetch();
    window.addEventListener('storage', function (e) { if (e.key === CART_KEY) updateBadge(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  return {
    RM: RM, hasGSAP: hasGSAP, $: $, $$: $$, fmt: fmt, esc: esc, store: store, ICON: ICON, featureIcon: featureIcon,
    products: products, byId: byId, cart: cart, updateBadge: updateBadge, flyToCart: flyToCart, toast: toast,
    card: card, bindQuickAdd: bindQuickAdd, defaultSize: defaultSize, reveal: reveal, refresh: refresh,
    accordion: accordion, validateForm: validateForm, liveValidation: liveValidation,
    MODES: MODES, kind: kind, getMode: getMode, setMode: setMode, load3D: load3D, whenIdle: whenIdle, whenInteracted: whenInteracted, tilt: tilt,
    lenis: function () { return lenis; }
  };
})();
