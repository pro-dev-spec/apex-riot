/* =========================================================
   APEX RIOT · Detalle de producto
   Galería con zoom, selector de color y talla, botón de
   compra con estados y vuelo al carrito, productos
   relacionados. La imagen llega "volando" desde la tarjeta
   del catálogo (FLIP entre páginas).
   ========================================================= */
(function () {
  'use strict';
  var A = window.APEX, $ = A.$, $$ = A.$$, RM = A.RM, esc = A.esc;
  var root = $('#pdp');
  var id = new URLSearchParams(location.search).get('id');
  var p, variant = 0, view = 'front', size = null, qty = 1;
  var viewer = null;   // visor 3D (se carga después, si hay WebGL)

  var SIZE_TABLE = {
    top: [['S', '88–94', '68'], ['M', '94–100', '70'], ['L', '100–106', '72'], ['XL', '106–112', '74'], ['XXL', '112–118', '76']],
    pants: [['28', '71–74', '81'], ['30', '76–79', '81'], ['32', '81–84', '82'], ['34', '86–89', '82'], ['36', '91–94', '83']]
  };

  function galleryHTML() {
    var badge = p.badge ? '<span class="badge' + (p.oldPrice ? ' badge--sale' : '') + '">' + esc(p.badge) + '</span>' : '';
    var thumbs = [['front', 'Vista frontal'], ['back', 'Vista trasera'], ['detail', 'Detalle']].map(function (t) {
      var inner = t[0] === 'detail'
        ? '<div style="width:100%;height:100%;overflow:hidden"><div style="transform:scale(2.2) translate(8%,4%)">' + garmentSVG(p, variant, 'front') + '</div></div>'
        : garmentSVG(p, variant, t[0]);
      return '<button class="thumb" type="button" data-view="' + t[0] + '" aria-pressed="' + (view === t[0]) + '" aria-label="' + t[1] + '">' + inner + '</button>';
    }).join('');
    var t3d = '<button class="thumb thumb--3d" type="button" data-view="3d" aria-pressed="false" aria-label="360° 3D: vista girando" hidden><span>360°<small>3D</small></span></button>';
    return '<div class="gallery__main viewer3d" tabindex="0" aria-label="Imagen del producto. Pasa el puntero o pulsa Enter para hacer zoom.">' + badge +
      '<div class="gallery__zoom">' + mainSVG() + '</div>' +
      '<p class="drag-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="2"/></svg>Arrastra para girar 360°</p></div>' +
      '<div class="gallery__thumbs">' + t3d + thumbs + '</div>';
  }
  function mainSVG() {
    if (view === 'detail') return '<div style="width:100%;height:100%;transform:scale(2) translate(10%,6%)">' + garmentSVG(p, variant, 'front') + '</div>';
    return garmentSVG(p, variant, view);
  }

  function infoHTML() {
    var sale = !!p.oldPrice;
    var swatches = p.variants.map(function (v, i) {
      return '<button class="swatch" type="button" role="radio" aria-checked="' + (i === variant) + '" aria-label="' + esc(v.name) + '" data-variant="' + i + '"' + (i === variant ? '' : ' tabindex="-1"') + '>' +
        '<span style="background:linear-gradient(135deg,' + v.base + ' 50%,' + v.accent + ' 50%)"></span></button>';
    }).join('');
    var sizes = p.sizes.map(function (s, i) {
      return '<button class="size" type="button" role="radio" aria-checked="false" data-size="' + esc(s) + '"' + (i === 0 ? '' : ' tabindex="-1"') + '>' + esc(s) + '</button>';
    }).join('');
    var isPants = p.type === 'pants';
    var table = p.type === 'cap' || p.type === 'gloves'
      ? '<p>' + (p.type === 'cap' ? 'Talla única con cierre snapback ajustable (54–61 cm).' : 'Mide el contorno de la palma sin el pulgar: S 18–20 cm · M 20–22 cm · L 22–24 cm · XL 24–26 cm.') + '</p>'
      : '<table class="size-table"><thead><tr><th>TALLA</th><th>' + (isPants ? 'CINTURA (CM)' : 'PECHO (CM)') + '</th><th>' + (isPants ? 'ENTREPIERNA' : 'LARGO') + '</th></tr></thead><tbody>' +
        SIZE_TABLE[isPants ? 'pants' : 'top'].map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</tbody></table>';

    return '<div data-in><p class="kicker">' + p.category + ' · ' + p.sku + '</p><h1 class="pdp__title">' + esc(p.name) + '</h1></div>' +
      '<div class="price pdp__price' + (sale ? ' price--sale' : '') + '" data-in><span>' + A.fmt(p.price) + '</span>' + (sale ? '<del>' + A.fmt(p.oldPrice) + '</del>' : '') + '</div>' +
      '<p class="muted" data-in>' + esc(p.description) + '</p>' +
      '<div data-in><div class="opt-label" id="colorLabel">Color <b id="colorName">' + esc(p.variants[variant].name) + '</b></div><div class="swatches" role="radiogroup" aria-labelledby="colorLabel">' + swatches + '</div></div>' +
      '<div data-in><div class="opt-label" id="sizeLabel">Talla <b id="sizeName">Elige una</b></div><div class="sizes" role="radiogroup" aria-labelledby="sizeLabel" aria-describedby="sizeError">' + sizes + '</div><p class="size-error" id="sizeError" aria-live="polite"></p></div>' +
      '<div class="buy-row" data-in>' +
        '<div class="qty" aria-label="Cantidad"><button type="button" data-qty="-1" aria-label="Quitar uno">−</button><output id="qty" aria-live="polite">1</output><button type="button" data-qty="1" aria-label="Añadir uno">+</button></div>' +
        '<button class="btn btn--solid buy-btn" type="button" id="buyBtn" style="flex:1"><span class="buy-btn__label"><span class="txt">A romperla</span>' + A.ICON.arrow + A.ICON.check + '</span></button>' +
      '</div>' +
      '<ul class="features" data-in>' + p.features.map(A.featureIcon).join('') + '</ul>' +
      '<div data-in>' +
        '<details class="acc"><summary>Tabla de tallas<span class="plus" aria-hidden="true"></span></summary><div class="acc__body">' + table + '</div></details>' +
        '<details class="acc"><summary>Envío y cambios<span class="plus" aria-hidden="true"></span></summary><div class="acc__body"><p>Envío gratis desde ' + A.fmt(A.cart.FREE_SHIPPING) + '. Cambios hasta 30 días después de recibir tu pedido. Tienda ficticia: no se envía nada.</p></div></details>' +
      '</div>';
  }

  function swapGallery() {
    var zoom = $('.gallery__zoom');
    var thumbs = $('.gallery__thumbs');
    var render = function () {
      zoom.innerHTML = mainSVG();
      $$('.thumb', thumbs).forEach(function (t) {
        var v = t.getAttribute('data-view');
        t.setAttribute('aria-pressed', String(v === view));
      });
    };
    if (RM || !A.hasGSAP) { render(); return; }
    gsap.to(zoom, { opacity: 0, x: -24, duration: .16, ease: 'power2.in', onComplete: function () {
      render();
      gsap.fromTo(zoom, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: .4, ease: 'expo.out' });
    } });
  }

  function bindGallery() {
    var main = $('.gallery__main'), zoom = $('.gallery__zoom');
    var fine = matchMedia('(pointer: fine)').matches;
    function origin(e) {
      var r = main.getBoundingClientRect();
      zoom.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
    }
    // Zoom 2D (solo mientras no hay visor 3D)
    if (fine) {
      main.addEventListener('pointerenter', function (e) { if (viewer) return; origin(e); main.classList.add('is-zoomed'); });
      main.addEventListener('pointermove', function (e) { if (!viewer) origin(e); });
      main.addEventListener('pointerleave', function () { main.classList.remove('is-zoomed'); });
    } else {
      main.addEventListener('click', function (e) { if (viewer) return; origin(e); main.classList.toggle('is-zoomed'); });
    }
    main.addEventListener('keydown', function (e) {
      if (viewer || e.target !== main) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoom.style.transformOrigin = '50% 40%'; main.classList.toggle('is-zoomed'); }
    });
    $$('.thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        view = t.getAttribute('data-view');
        if (!viewer) { swapGallery(); return; }
        // Con 3D, las miniaturas mueven la cámara en lugar de cambiar la imagen
        $$('.thumb').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
        if (view === 'detail') viewer.zoomTo(true);
        else { viewer.zoomTo(false); if (view !== '3d') viewer.showSide(view); }
      });
    });
  }

  /* Radiogroups accesibles: flechas para moverse, clic/espacio para elegir */
  function radioKeys(group, onPick) {
    group.addEventListener('keydown', function (e) {
      var items = $$('[role="radio"]', group), i = items.indexOf(document.activeElement);
      if (i < 0) return;
      var n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!n) return;
      e.preventDefault();
      var next = items[(i + n + items.length) % items.length];
      items.forEach(function (it) { it.tabIndex = -1; });
      next.tabIndex = 0; next.focus(); onPick(next);
    });
  }

  function pickSize(btn) {
    size = btn.getAttribute('data-size');
    $$('.size').forEach(function (b) { var on = b === btn; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    $('#sizeName').textContent = size;
    $('#sizeError').textContent = '';
    if (!RM) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  }
  function pickVariant(btn) {
    variant = +btn.getAttribute('data-variant');
    $$('.swatch').forEach(function (b) { var on = b === btn; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    $('#colorName').textContent = p.variants[variant].name;
    if (viewer) viewer.setProduct(p, variant, 'spin');   // la prenda gira y cambia de color de perfil
    else swapGallery();
    // regenerar miniaturas con el nuevo color, sin perder el foco
    $$('.thumb:not(.thumb--3d)').forEach(function (t) {
      var v = t.getAttribute('data-view');
      t.innerHTML = v === 'detail'
        ? '<div style="width:100%;height:100%;overflow:hidden"><div style="transform:scale(2.2) translate(8%,4%)">' + garmentSVG(p, variant, 'front') + '</div></div>'
        : garmentSVG(p, variant, v);
    });
  }

  function bindInfo() {
    var sizes = $('.sizes'), sw = $('.swatches');
    sizes.addEventListener('click', function (e) { var b = e.target.closest('.size'); if (b) pickSize(b); });
    sw.addEventListener('click', function (e) { var b = e.target.closest('.swatch'); if (b) pickVariant(b); });
    radioKeys(sizes, pickSize);
    radioKeys(sw, pickVariant);

    $('.qty').addEventListener('click', function (e) {
      var b = e.target.closest('[data-qty]'); if (!b) return;
      qty = Math.max(1, Math.min(9, qty + +b.getAttribute('data-qty')));
      var out = $('#qty'); out.textContent = qty;
      if (!RM && A.hasGSAP) gsap.fromTo(out, { yPercent: +b.getAttribute('data-qty') > 0 ? 60 : -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .3, ease: 'back.out(2)' });
    });

    var buy = $('#buyBtn'), busy = false;
    buy.addEventListener('click', function () {
      if (busy) return;
      if (!size) {
        $('#sizeError').textContent = 'Elige tu talla antes de añadir.';
        if (!RM) { sizes.classList.remove('shake'); void sizes.offsetWidth; sizes.classList.add('shake'); }
        var first = $('.size'); first && first.focus();
        return;
      }
      busy = true;
      A.flyToCart(buy, function () {
        A.cart.add(p.id, size, variant, qty);
        A.updateBadge(true);
        buy.classList.add('is-done');
        $('.txt', buy).textContent = '¡En el garaje!';
        A.toast(qty + ' × ' + p.name + ' (' + size + ') añadido', true);
        setTimeout(function () {
          buy.classList.remove('is-done');
          $('.txt', buy).textContent = 'A romperla';
          busy = false;
        }, 2200);
      });
    });
    A.accordion(root);
  }

  function flipIn() {
    var raw = null;
    try { raw = sessionStorage.getItem('apex-flip'); sessionStorage.removeItem('apex-flip'); } catch (e) { /* */ }
    if (RM || !A.hasGSAP) return;
    var main = $('.gallery__main');
    var tl = gsap.timeline();
    if (raw && main) {
      var from = JSON.parse(raw), to = main.getBoundingClientRect();
      tl.from(main, {
        x: from.x - to.left, y: from.y - to.top, scaleX: from.w / to.width, scaleY: from.h / to.height,
        transformOrigin: '0 0', duration: .75, ease: 'expo.inOut', clearProps: 'transform'
      });
    } else if (main) {
      tl.from(main, { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', duration: .9, ease: 'expo.inOut', clearProps: 'clipPath' });
    }
    tl.from('.gallery__thumbs .thumb', { y: 20, opacity: 0, stagger: .06, duration: .5, ease: 'expo.out' }, '-=.4')
      .from('[data-in]', { x: 40, opacity: 0, stagger: .06, duration: .7, ease: 'expo.out' }, raw ? .25 : .1);
  }

  /* ---------- Visor 3D ----------
     Se carga cuando la página ya está lista; mientras tanto se ve la ilustración. */
  function start3D() {
    var main = $('.gallery__main');
    if (!main || viewer) return;
    A.load3D().then(function (mod) {
      var mode = A.MODES[p.category] || A.MODES.MX;
      var v = mod.createViewer(main, {
        reducedMotion: RM, accent: mode.accent, startRotation: -.3,
        label: p.name + ' en 3D. Arrastra para girarla; usa las flechas del teclado.',
        onInteract: function () { var h = $('.drag-hint', main); if (h) h.classList.add('is-gone'); }
      });
      return v.setProduct(p, variant, 'none').then(function () {
        viewer = v;
        main.classList.remove('is-zoomed');
        main.classList.add('is-3d', 'has-3d');
        main.removeAttribute('tabindex');
        var t3d = $('.thumb--3d');
        if (t3d) { t3d.hidden = false; $$('.thumb').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t3d)); }); }
        if (!RM && A.hasGSAP) gsap.from(t3d, { scale: .6, opacity: 0, duration: .6, ease: 'back.out(2)' });
      });
    }).catch(function () { /* sin WebGL: se queda la galería 2D */ });
  }

  function notFound() {
    root.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>Este producto se salió de la pista</h3><p class="muted">No lo encontramos. Vuelve al catálogo.</p><a class="btn" href="catalogo.html">Ir al catálogo</a></div>';
    $('#crumbName').textContent = 'No encontrado';
  }

  A.products().then(function (list) {
    p = A.byId(list, id);
    if (!p) { notFound(); return; }
    document.title = p.name + ' · APEX RIOT';
    if (A.MODES[p.category]) A.setMode(p.category);
    $('#crumbName').textContent = p.name;
    root.innerHTML = '<div class="gallery">' + galleryHTML() + '</div><div class="pdp__info">' + infoHTML() + '</div>';
    bindGallery();
    bindInfo();
    flipIn();
    A.whenInteracted(start3D);

    var rel = list.filter(function (x) { return x.id !== p.id && x.category === p.category; })
      .concat(list.filter(function (x) { return x.category !== p.category; })).slice(0, 4);
    var relGrid = $('#related');
    relGrid.innerHTML = rel.map(A.card).join('');
    A.bindQuickAdd(relGrid, list);
    A.reveal(relGrid);
    A.refresh();
  }).catch(function () {
    root.innerHTML = '<p class="muted">No pudimos cargar el producto. Abre el sitio desde un servidor (ver README).</p>';
  });
})();
