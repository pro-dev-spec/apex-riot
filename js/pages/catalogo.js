/* =========================================================
   APEX RIOT · Catálogo
   Filtros (disciplina, talla, precio, color) y orden.
   Las tarjetas se reacomodan con GSAP Flip: el usuario ve
   a dónde va cada producto en vez de un salto brusco.
   ========================================================= */
(function () {
  'use strict';
  var A = window.APEX, $ = A.$, $$ = A.$$, RM = A.RM;
  var grid = $('#catGrid'), count = $('#resultsCount'), sortSel = $('#sort');
  var params = new URLSearchParams(location.search);
  var state = { cat: params.get('cat') || 'all', kind: [], size: [], price: null, color: [], sort: 'featured' };
  var LIST = [];
  var canFlip = !RM && A.hasGSAP && window.Flip;
  if (canFlip) gsap.registerPlugin(Flip);

  function match(p) {
    if (state.cat !== 'all' && p.category !== state.cat) return false;
    if (state.kind.length && state.kind.indexOf(A.kind(p)) < 0) return false;
    if (state.size.length && !state.size.some(function (s) { return p.sizes.indexOf(s) > -1; })) return false;
    if (state.price) {
      var r = state.price.split('-').map(Number);
      if (p.price < r[0] || p.price > r[1]) return false;
    }
    if (state.color.length && !p.variants.some(function (v) { return state.color.indexOf(v.family) > -1; })) return false;
    return true;
  }
  function sorter(a, b) {
    switch (state.sort) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name': return a.name.localeCompare(b.name, 'es');
      default: return LIST.indexOf(a) - LIST.indexOf(b);
    }
  }

  function syncChips() {
    $$('[data-filter]').forEach(function (b) {
      var g = b.getAttribute('data-filter'), v = b.getAttribute('data-value'), on;
      if (g === 'cat') on = state.cat === v;
      else if (g === 'price') on = state.price === v;
      else on = state[g].indexOf(v) > -1;
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function apply(animate) {
    var cards = $$('.card', grid);
    var flipState = animate && canFlip ? Flip.getState(cards) : null;
    var visible = LIST.filter(match).sort(sorter);
    cards.forEach(function (c) { c.style.display = 'none'; });
    visible.forEach(function (p) {
      var c = grid.querySelector('[data-id="' + p.id + '"]');
      c.style.display = '';
      grid.appendChild(c); // reordena en el DOM según el orden elegido
    });
    var empty = $('.empty-state', grid);
    empty.style.display = visible.length ? 'none' : '';
    grid.appendChild(empty);
    count.textContent = visible.length + (visible.length === 1 ? ' producto' : ' productos');

    if (flipState) {
      Flip.from(flipState, {
        duration: .6, ease: 'expo.inOut', absolute: true, stagger: .02, nested: true,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out', delay: .15 }); },
        onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .85, duration: .3, ease: 'power2.in' }); },
        onComplete: A.refresh
      });
      if (!visible.length) gsap.from(empty, { y: 20, opacity: 0, duration: .5, ease: 'expo.out' });
    }
    var url = new URL(location.href);
    if (state.cat === 'all') url.searchParams.delete('cat'); else url.searchParams.set('cat', state.cat);
    history.replaceState(null, '', url);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter]');
    if (!b) return;
    var g = b.getAttribute('data-filter'), v = b.getAttribute('data-value');
    if (g === 'cat') { state.cat = v; if (A.MODES[v]) A.setMode(v); }  // el acento de la interfaz sigue al deporte
    else if (g === 'price') state.price = state.price === v ? null : v;
    else {
      var i = state[g].indexOf(v);
      if (i > -1) state[g].splice(i, 1); else state[g].push(v);
    }
    syncChips();
    apply(true);
  });
  $('#resetFilters').addEventListener('click', function () {
    state.cat = 'all'; state.kind = []; state.size = []; state.price = null; state.color = [];
    syncChips(); apply(true);
  });
  sortSel.addEventListener('change', function () { state.sort = sortSel.value; apply(true); });

  var toggle = $('.filters-toggle'), filters = $('#filters');
  toggle.addEventListener('click', function () {
    var open = !filters.classList.contains('is-open');
    filters.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Ocultar filtros' : 'Filtros';
    if (open && !RM && A.hasGSAP) gsap.from(filters, { height: 0, opacity: 0, duration: .45, ease: 'expo.out', clearProps: 'height,opacity' });
    A.refresh();
  });

  if (A.MODES[state.cat]) A.setMode(state.cat);
  A.products().then(function (list) {
    LIST = list;
    // chips de tipo generados a partir de los productos que existen
    var kinds = [];
    list.forEach(function (p) { var k = A.kind(p); if (kinds.indexOf(k) < 0) kinds.push(k); });
    $('#kindChips').insertAdjacentHTML('beforeend', kinds.map(function (k) {
      return '<button class="chip" type="button" data-filter="kind" data-value="' + k + '" aria-pressed="false">' + k + '</button>';
    }).join(''));
    grid.innerHTML = list.map(A.card).join('') +
      '<div class="empty-state"><h3>Nada en esta curva</h3><p class="muted">Ningún producto coincide con esos filtros.</p><button class="btn btn--small" type="button" id="emptyReset">Limpiar filtros</button></div>';
    $('#emptyReset').addEventListener('click', function () { $('#resetFilters').click(); });
    A.bindQuickAdd(grid, list);
    syncChips();
    apply(false);
    A.reveal(grid);
    A.refresh();
  }).catch(function () {
    count.textContent = 'Error al cargar productos';
    grid.innerHTML = '<p class="muted">No pudimos cargar el catálogo. Abre el sitio desde un servidor (ver README).</p>';
  });
})();
