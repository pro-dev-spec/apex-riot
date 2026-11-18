/* =========================================================
   APEX RIOT · Carrito simulado ("Tu garaje")
   Lista editable, barra de envío gratis "turbo", checkout
   simulado con validación y pantalla de éxito.
   Los datos viven en localStorage (clave "apex-cart").
   ========================================================= */
(function () {
  'use strict';
  var A = window.APEX, $ = A.$, $$ = A.$$, RM = A.RM, esc = A.esc, fmt = A.fmt;
  var root = $('#cartRoot');
  var LIST = [];
  var lastProgress = 0;

  var HELMET = '<svg viewBox="0 0 200 160" aria-hidden="true"><ellipse cx="100" cy="148" rx="60" ry="6" fill="#1A1B1F"/>' +
    '<g class="helmet"><path d="M30 120 C18 50 70 14 120 22 C160 30 172 66 168 100 L138 112 L86 112 L74 132 L34 132Z" fill="#F2F2EE"/>' +
    '<path d="M86 64 L164 58 L168 96 L130 108 L82 102Z" fill="#0B0B0D"/><path d="M86 64 L164 58 L166 70 L86 76Z" fill="#C6FF00"/>' +
    '<path d="M26 96 L68 88 L72 100 L30 110Z" fill="#C6FF00"/><path d="M52 40 L104 26 L108 34 L56 50Z" fill="#FF4D00"/></g></svg>';

  function itemHTML(it) {
    var p = A.byId(LIST, it.id);
    if (!p) return '';
    var v = p.variants[it.variant] || p.variants[0];
    return '<li class="cart-item" data-key="' + esc(it.key) + '">' +
      '<a class="cart-item__img" href="producto.html?id=' + p.id + '" tabindex="-1" aria-hidden="true">' + garmentSVG(p, it.variant, 'front') + '</a>' +
      '<div><a class="cart-item__name" href="producto.html?id=' + p.id + '">' + esc(p.name) + '</a>' +
        '<p class="cart-item__meta">TALLA ' + esc(it.size) + ' · ' + esc(v.name.toUpperCase()) + '</p>' +
        '<div class="qty qty--small" role="group" aria-label="Cantidad de ' + esc(p.name) + '"><button type="button" data-step="-1" aria-label="Quitar uno">−</button><span aria-live="polite">' + it.qty + '</span><button type="button" data-step="1" aria-label="Añadir uno">+</button></div>' +
      '</div>' +
      '<div class="cart-item__side"><span class="price">' + fmt(p.price * it.qty) + '</span>' +
        '<button class="remove" type="button" data-remove aria-label="Eliminar ' + esc(p.name) + ' del garaje">' + A.ICON.trash + 'Quitar</button></div>' +
    '</li>';
  }

  function summaryHTML() {
    return '<aside class="summary" aria-labelledby="sum-title">' +
      '<h2 id="sum-title">Resumen</h2>' +
      '<div class="shipbar"><p class="shipbar__text" id="shipText"></p><div class="shipbar__track" role="progressbar" aria-label="Progreso hacia el envío gratis" aria-valuemin="0" aria-valuemax="100"><div class="shipbar__fill"></div></div></div>' +
      '<div class="summary__row"><span>Subtotal</span><span id="sumSub"></span></div>' +
      '<div class="summary__row"><span>Envío</span><span id="sumShip"></span></div>' +
      '<div class="summary__row summary__row--total"><span>Total</span><span id="sumTotal"></span></div>' +
      '<button class="btn btn--solid btn--block" type="button" id="toCheckout">Finalizar ' + A.ICON.arrow + '</button>' +
      '<form class="checkout" id="checkout" novalidate aria-label="Datos de envío (simulado)">' +
        '<p class="mono muted">CHECKOUT SIMULADO · SIN DATOS DE PAGO</p>' +
        '<div class="field"><label for="co-name">Nombre</label><input class="input" id="co-name" autocomplete="name" required minlength="2"><span class="error"></span></div>' +
        '<div class="field"><label for="co-email">Correo</label><input class="input" id="co-email" type="email" autocomplete="email" required><span class="error"></span></div>' +
        '<div class="field"><label for="co-city">Ciudad</label><input class="input" id="co-city" autocomplete="address-level2" required minlength="3"><span class="error"></span></div>' +
        '<button class="btn btn--solid btn--block" type="submit" id="payBtn"><span class="buy-btn__label">Confirmar pedido</span></button>' +
      '</form>' +
      '<a href="catalogo.html" class="muted" style="text-align:center">Seguir comprando</a>' +
    '</aside>';
  }

  function updateSummary() {
    var t = A.cart.totals(LIST);
    $('#sumSub').textContent = fmt(t.sub);
    $('#sumShip').textContent = t.ship ? fmt(t.ship) : 'GRATIS';
    $('#sumTotal').textContent = fmt(t.total);
    var text = $('#shipText');
    text.innerHTML = t.missing > 0 ? 'Te faltan <b>' + fmt(t.missing) + '</b> para el envío gratis' : '<b>¡Envío gratis desbloqueado!</b>';
    var bar = $('.shipbar'), fill = $('.shipbar__fill');
    $('.shipbar__track').setAttribute('aria-valuenow', Math.round(t.progress * 100));
    // Efecto "turbo": la barra acelera y se pasa un poco antes de asentarse
    if (!RM && A.hasGSAP) gsap.fromTo(fill, { scaleX: lastProgress }, { scaleX: t.progress, duration: .9, ease: 'back.out(1.4)' });
    else fill.style.transform = 'scaleX(' + t.progress + ')';
    if (t.progress >= 1 && lastProgress < 1) { bar.classList.remove('is-full'); void bar.offsetWidth; bar.classList.add('is-full'); }
    lastProgress = t.progress;
  }

  function render(first) {
    var items = A.cart.items().filter(function (it) { return A.byId(LIST, it.id); });
    if (!items.length) {
      root.innerHTML = '<div class="cart-empty">' + HELMET + '<h2 class="h-md">Tu garaje está vacío</h2><p class="muted">Equípate. El barro no espera.</p><a class="btn btn--solid" href="catalogo.html">Ir al catálogo ' + A.ICON.arrow + '</a></div>';
      if (!RM && A.hasGSAP) gsap.from('.cart-empty > *', { y: 30, opacity: 0, stagger: .08, duration: .7, ease: 'expo.out' });
      lastProgress = 0;
      return;
    }
    root.innerHTML = '<div class="cart"><div><h2 class="sr-only">Productos</h2><ul class="cart__list">' + items.map(itemHTML).join('') + '</ul></div>' + summaryHTML() + '</div>';
    if (first && !RM && A.hasGSAP) {
      gsap.from('.cart-item', { x: -40, opacity: 0, stagger: .07, duration: .7, ease: 'expo.out' });
      gsap.from('.summary', { y: 30, opacity: 0, duration: .7, ease: 'expo.out', delay: .15 });
    }
    updateSummary();
    bindCheckout();
  }

  function removeItem(li) {
    var key = li.getAttribute('data-key');
    var done = function () { A.cart.remove(key); A.updateBadge(false); render(false); };
    if (RM || !A.hasGSAP) { done(); return; }
    // Se "rompe": sale disparado a un lado y luego colapsa la altura
    gsap.timeline({ onComplete: done })
      .to(li, { x: 90, skewX: -12, opacity: 0, duration: .28, ease: 'power3.in' })
      .to(li, { height: 0, paddingTop: 0, paddingBottom: 0, marginTop: -12, borderWidth: 0, duration: .3, ease: 'power2.inOut' });
  }

  root.addEventListener('click', function (e) {
    var li = e.target.closest('.cart-item');
    var step = e.target.closest('[data-step]');
    if (li && step) {
      var key = li.getAttribute('data-key');
      var it = A.cart.items().filter(function (x) { return x.key === key; })[0];
      if (!it) return;
      var next = Math.max(1, Math.min(9, it.qty + +step.getAttribute('data-step')));
      if (next === it.qty) return;
      A.cart.setQty(key, next);
      A.updateBadge(false);
      var p = A.byId(LIST, it.id), span = $('.qty span', li);
      span.textContent = next;
      $('.cart-item__side .price', li).textContent = fmt(p.price * next);
      if (!RM && A.hasGSAP) gsap.fromTo(span, { yPercent: next > it.qty ? 70 : -70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .3, ease: 'back.out(2)' });
      updateSummary();
      return;
    }
    if (li && e.target.closest('[data-remove]')) removeItem(li);
  });

  function bindCheckout() {
    var open = $('#toCheckout'), form = $('#checkout');
    A.liveValidation(form);
    open.addEventListener('click', function () {
      open.hidden = true;
      form.classList.add('is-open');
      if (!RM && A.hasGSAP) gsap.from(form.children, { y: 16, opacity: 0, stagger: .05, duration: .5, ease: 'expo.out' });
      $('#co-name').focus();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!A.validateForm(form)) return;
      var pay = $('#payBtn');
      pay.disabled = true;
      $('.buy-btn__label', pay).innerHTML = '<span class="spinner" aria-hidden="true"></span> Procesando…';
      setTimeout(function () { success($('#co-name').value.trim().split(' ')[0]); }, RM ? 300 : 1200);
    });
  }

  function success(name) {
    var order = 'APX-' + Math.floor(1000 + Math.random() * 9000);
    A.cart.clear();
    A.updateBadge(false);
    root.innerHTML = '<div class="success is-open" role="status"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><path d="M36 62 L54 80 L86 44"/></svg>' +
      '<p class="kicker">Pedido ' + order + ' · simulado</p><h2 class="h-lg">¡A rodar, ' + esc(name || 'rider') + '!</h2>' +
      '<p class="muted" style="max-width:44ch">Tu equipo está "en camino". Recuerda: es una tienda ficticia, así que no se cobró ni se enviará nada.</p>' +
      '<a class="btn" href="index.html">Volver al inicio</a></div>';
    window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
    if (!RM && A.hasGSAP) gsap.from('.success > :not(svg)', { y: 24, opacity: 0, stagger: .08, duration: .7, ease: 'expo.out', delay: .5 });
  }

  A.products().then(function (list) { LIST = list; render(true); })
    .catch(function () { root.innerHTML = '<p class="muted">No pudimos cargar el garaje. Abre el sitio desde un servidor (ver README).</p>'; });
})();
