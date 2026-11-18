/* =========================================================
   APEX RIOT · Inicio
   Hero "Speed Cut" con selector de deporte y prenda en 3D,
   marquee reactivo al scroll, drop de la semana, disciplinas
   con scroll horizontal y newsletter.
   ========================================================= */
(function () {
  'use strict';
  var A = window.APEX, $ = A.$, $$ = A.$$, RM = A.RM;
  var html = document.documentElement;
  var LIST = null;

  /* Contenido del hero por deporte */
  var COPY = {
    MX:    { kicker: 'Motocross · Drop 07', lines: ['Vive al', 'límite.', 'Domina'], copy: 'Casco integral, goggles, peto y jerseys ventilados para saltar más alto y caer mejor.', cta: 'Equipo MX', t1: ['VEL. MÁX', 88, 'KM/H'], t2: ['CASCO', 1350, 'G'] },
    MTB:   { kicker: 'Mountain bike · Trail', lines: ['Sube.', 'Baja.', 'Repite.'], copy: 'Manga 3/4, protección UV 50+ y tejido elástico para la subida eterna y la bajada sin frenos.', cta: 'Equipo MTB', t1: ['DESNIVEL', 1280, 'M'], t2: ['UV', 50, '+'] },
    BMX:   { kicker: 'BMX racing · Gate drop', lines: ['Sal de', 'la gate', 'primero'], copy: 'Manga larga reglamentaria, pantalón con espacio para protecciones y guantes con agarre para la salida.', cta: 'Equipo BMX', t1: ['RAMPA', 8, 'M'], t2: ['REACCIÓN', 320, 'MS'] },
    URBAN: { kicker: 'Urban · Calle', lines: ['La calle', 'también', 'es pista.'], copy: 'Hoodies pesados, camisetas con telemetría y gorras con la A. La actitud de la pista, todos los días.', cta: 'Equipo Urban', t1: ['ALGODÓN', 400, 'G/M²'], t2: ['RITMO', 128, 'BPM'] }
  };

  /* ---------- Drop de la semana ---------- */
  var grid = $('#dropGrid');
  A.products().then(function (list) {
    LIST = list;
    var isNew = function (p) { return /\.apxc$/.test(p.model || '') ? 0 : 1; };   // primero los modelos 3D nuevos
    grid.innerHTML = list.filter(function (p) { return p.drop; }).sort(function (x, y) { return isNew(x) - isNew(y); }).slice(0, 4).map(A.card).join('');
    A.bindQuickAdd(grid, list);
    A.reveal(grid);
    A.refresh();
    applyMode(A.getMode(), false);
    paintTiles();
  }).catch(function () {
    grid.innerHTML = '<p class="muted">No pudimos cargar los productos. Abre el sitio desde un servidor (ver README).</p>';
  });

  /* ---------- Newsletter ---------- */
  var nl = $('#newsletter');
  if (nl) {
    A.liveValidation(nl);
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('.newsletter__msg', nl);
      if (!A.validateForm(nl)) { msg.textContent = ''; return; }
      msg.textContent = '¡Dentro! Bienvenido al pelotón (suscripción simulada).';
      nl.reset();
      $('.field', nl).classList.remove('is-valid');
    });
  }

  /* ---------- Pausa de la cinta, speed lines y giro automático ---------- */
  var marqueeTween = null;
  var pauseBtn = $('.marquee-pause');
  var hero = $('.hero');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      var paused = pauseBtn.getAttribute('aria-pressed') !== 'true';
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.setAttribute('aria-label', paused ? 'Reanudar la cinta animada' : 'Pausar la cinta animada');
      pauseBtn.innerHTML = paused
        ? '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2l9 5-9 5z" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor"/></svg>';
      hero.classList.toggle('is-paused', paused);
      if (marqueeTween) marqueeTween.paused(paused);
    });
    if (RM) pauseBtn.hidden = true;
  }

  /* =========================================================
     SELECTOR DE DEPORTE
     ========================================================= */
  var tabs = $$('.modes__tab'), pill = $('.modes__pill'), modesEl = $('.modes');
  var viewer = null, busy = false, queued = null;

  function placePill() {
    var on = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
    if (!on || !pill) return;
    modesEl.style.setProperty('--x', on.offsetLeft + 'px');
    modesEl.style.setProperty('--w', on.offsetWidth + 'px');
  }
  function heroProduct(mode) { return LIST && A.byId(LIST, A.MODES[mode].hero); }

  function setTexts(mode) {
    var c = COPY[mode];
    $$('[data-mode-text]').forEach(function (el) {
      var k = el.getAttribute('data-mode-text');
      if (k === 't1' || k === 't2') el.textContent = c[k][0];
      else if (k === 't1u' || k === 't2u') el.textContent = c[k.slice(0, 2)][2];
      else el.textContent = c[k];
    });
    var cta = $('[data-mode-cta]'); if (cta) { cta.href = 'catalogo.html?cat=' + mode; cta.setAttribute('data-disc', mode); }
    var p = heroProduct(mode);
    var link = $('.hero__product');
    if (p && link) { link.href = 'producto.html?id=' + p.id; link.setAttribute('aria-label', 'Producto estrella: ' + p.name); }
  }
  function setTitle(mode) {
    var spans = $$('.hero__title .line > span');
    COPY[mode].lines.forEach(function (t, i) { if (spans[i]) spans[i].textContent = t; });
  }
  function countTo(mode, animate) {
    var c = COPY[mode];
    $$('.telemetry [data-count]').forEach(function (el, i) {
      var end = c[i ? 't2' : 't1'][1];
      if (!animate) { el.textContent = end.toLocaleString('es-CO'); return; }
      var o = { v: 0 };
      gsap.to(o, { v: end, duration: 1, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('es-CO'); } });
    });
  }
  function swapSVG(mode) {
    var p = heroProduct(mode), link = $('.hero__product');
    if (p && link && link.getAttribute('data-shown') !== p.id && !(p.id === 'casco-apex-pro' && !link.hasAttribute('data-shown'))) link.innerHTML = garmentSVG(p, 0, 'front');
    if (p && link) link.setAttribute('data-shown', p.id);
  }

  /* Aplica un modo. animate=false para el estado inicial. */
  function applyMode(mode, animate) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-set-mode') === mode;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
    });
    placePill();
    if (!animate || RM || !A.hasGSAP) {
      setTexts(mode); setTitle(mode); countTo(mode, false);
      if (!viewer) swapSVG(mode);
      else { viewer.setAccent(A.MODES[mode].accent); viewer.setProduct(heroProduct(mode), 0, 'none'); }
      return;
    }
    if (busy) { queued = mode; return; }
    busy = true;
    var spans = $$('.hero__title .line > span');
    var texts = $$('[data-mode-text="kicker"], [data-mode-text="copy"], [data-mode-text="cta"]');
    var tl = gsap.timeline({
      onComplete: function () { busy = false; if (queued && queued !== mode) { var q = queued; queued = null; applyMode(q, true); } else queued = null; }
    });
    // salida: el titular "se va" hacia arriba con inclinación, como un corte de cámara
    tl.to(spans, { yPercent: -110, skewY: -6, duration: .38, stagger: .05, ease: 'power3.in' }, 0)
      .to(texts, { opacity: 0, y: -10, duration: .25, ease: 'power2.in' }, 0)
      .add(function () { setTexts(mode); setTitle(mode); countTo(mode, true); })
      .fromTo(spans, { yPercent: 110, skewY: 8 }, { yPercent: 0, skewY: 0, duration: .9, stagger: .08, ease: 'expo.out', immediateRender: false })
      .fromTo(texts, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, stagger: .05, ease: 'expo.out', immediateRender: false }, '<.1');
    if (viewer) {
      viewer.setAccent(A.MODES[mode].accent);
      viewer.setProduct(heroProduct(mode), 0, 'swap');
    } else {
      var link = $('.hero__product');
      gsap.timeline()
        .to(link, { xPercent: -40, opacity: 0, skewX: 10, duration: .35, ease: 'power3.in' })
        .add(function () { swapSVG(mode); })
        .fromTo(link, { xPercent: 50, skewX: -12, opacity: 0 }, { xPercent: 0, skewX: 0, opacity: 1, duration: .8, ease: 'expo.out' });
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var m = t.getAttribute('data-set-mode');
      if (m === A.getMode() && !busy) return;
      A.setMode(m);
      applyMode(m, true);
    });
  });
  if (modesEl) modesEl.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement), n = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !n) return;
    e.preventDefault();
    var next = tabs[(i + n + tabs.length) % tabs.length];
    next.focus(); next.click();
  });
  window.addEventListener('resize', placePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);
  placePill();

  /* ---------- Prenda 3D en el hero (carga diferida) ---------- */
  var stage = $('#heroStage');
  function start3D() {
    if (!stage || viewer) return;
    A.load3D().then(function (mod) {
      return A.products().then(function (list) {
        LIST = list;
        var v = mod.createViewer(stage, {
          reducedMotion: RM, accent: A.MODES[A.getMode()].accent, startRotation: -.45,
          label: 'Prenda del deporte elegido en 3D. Arrastra para girarla.',
          onInteract: function () { var h = $('.drag-hint'); if (h) h.classList.add('is-gone'); }
        });
        return v.setProduct(heroProduct(A.getMode()), 0, 'none').then(function () {
          viewer = v;
          stage.classList.add('is-3d');
          $('.hero__visual').classList.add('has-3d');
          if (!RM && A.hasGSAP) gsap.from(v.canvas, { scale: .9, duration: 1.1, ease: 'expo.out', clearProps: 'transform' });
        });
      });
    }).catch(function () { /* sin WebGL: se queda la ilustración */ });
  }
  A.whenInteracted(start3D);


  /* =========================================================
     INTRO DE DISCIPLINA
     Al tocar un deporte, su panel se expande a pantalla completa
     desde su propio rectángulo (clip-path), presenta el deporte y
     entra al catálogo filtrado cuando la barra de progreso se llena.
     Cada deporte puede tener video propio: MEDIA.MX.video = 'assets/video/mx.mp4'
     ========================================================= */
  /* img  = portada del rectángulo (assets/img/mx.jpg) · video = se reproduce en la intro (assets/video/mx.mp4)
     Mientras estén vacíos, el rectángulo muestra la prenda del deporte y la intro usa la animación tipográfica. */
  var MEDIA = { MX: { img: '', video: '' }, MTB: { img: '', video: '' }, BMX: { img: '', video: '' }, URBAN: { img: '', video: '' } };
  function paintTiles() {
    $$('.dtile').forEach(function (t) {
      var k = t.getAttribute('data-disc'), m = MEDIA[k], art = $('.dtile__art', t), p = heroProduct(k);
      if (m && m.img) t.style.setProperty('--img', 'url("' + m.img + '")');
      else if (art && p) art.innerHTML = garmentSVG(p, 0, 'front');
    });
  }
  var dintro = $('#dintro'), dTimer = null, dFrom = null, DUR = 2800;
  function rectClip(el) {
    var r = el.getBoundingClientRect();
    return 'inset(' + Math.max(0, r.top) + 'px ' + Math.max(0, innerWidth - r.right) + 'px ' + Math.max(0, innerHeight - r.bottom) + 'px ' + Math.max(0, r.left) + 'px)';
  }
  function lockScroll(on) { document.body.style.overflow = on ? 'hidden' : ''; var l = A.lenis(); if (l) { if (on) l.stop(); else l.start(); } }
  function openIntro(mode, from) {
    var url = 'catalogo.html?cat=' + mode;
    if (RM || !A.hasGSAP || !dintro) { A.setMode(mode); location.href = url; return; }
    var m = A.MODES[mode], c = COPY[mode];
    dFrom = from; A.setMode(mode);
    $('#dintroKicker').textContent = c.kicker;
    $('#dintroTitle').textContent = m.name;
    $('#dintroCopy').textContent = c.copy;
    $('#dintroGo').href = url;
    var p = heroProduct(mode);
    $('.dintro__art', dintro).innerHTML = p ? garmentSVG(p, 0, 'front') : '';
    var vid = $('.dintro__video', dintro);
    if (MEDIA[mode].video) { vid.src = MEDIA[mode].video; vid.hidden = false; vid.play().catch(function () {}); } else vid.hidden = true;
    dintro.hidden = false; lockScroll(true);
    gsap.timeline()
      .fromTo(dintro, { clipPath: rectClip(from) }, { clipPath: 'inset(0px 0px 0px 0px)', duration: .75, ease: 'expo.inOut' })
      .from('#dintroTitle', { yPercent: 70, skewY: 8, opacity: 0, duration: .8, ease: 'expo.out' }, .35)
      .from('.dintro__art', { xPercent: 40, skewX: -12, opacity: 0, duration: .9, ease: 'expo.out' }, .3)
      .from(['#dintroKicker', '#dintroCopy', '.dintro__bar'], { y: 24, opacity: 0, stagger: .06, duration: .6, ease: 'power3.out' }, .5)
      .fromTo('.dintro__prog', { scaleX: 0 }, { scaleX: 1, duration: DUR / 1000, ease: 'none' }, .4);
    clearTimeout(dTimer);
    dTimer = setTimeout(function () { location.href = url; }, DUR + 400);
    $('#dintroClose').focus({ preventScroll: true });
  }
  function closeIntro() {
    if (!dintro || dintro.hidden) return;
    clearTimeout(dTimer); gsap.killTweensOf('.dintro__prog');
    var done = function () {
      dintro.hidden = true; dintro.style.clipPath = ''; lockScroll(false);
      $('.dintro__video', dintro).pause();
      if (dFrom) dFrom.focus({ preventScroll: true });
    };
    if (!dFrom || RM || !A.hasGSAP) { done(); return; }
    gsap.to(dintro, { clipPath: rectClip(dFrom), duration: .6, ease: 'expo.inOut', onComplete: done });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-disc]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    openIntro(a.getAttribute('data-disc'), a);
  }, true);
  if (dintro) {
    $('#dintroClose').addEventListener('click', closeIntro);
    $('#dintroGo').addEventListener('click', function () { clearTimeout(dTimer); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeIntro(); });
    window.addEventListener('pageshow', function () { if (!dintro.hidden) { clearTimeout(dTimer); dintro.hidden = true; dintro.style.clipPath = ''; lockScroll(false); } });
  }

  if (RM || !A.hasGSAP) return; // sin movimiento: todo queda visible y estático

  /* ---------- Intro del hero ----------
     Anticipación: el titular "carga" con skew antes de asentarse.
     Jerarquía: titular → producto → texto → CTA → datos. */
  var delay = html.classList.contains('show-loader') ? 1.25 : html.classList.contains('is-entering') ? .35 : .05;
  var tl = gsap.timeline({ delay: delay, defaults: { ease: 'expo.out' } });
  tl.from('.hero__title .line > span', { yPercent: 105, skewY: 8, duration: 1, stagger: .09 })
    .from('.hero__stage', { xPercent: 70, skewX: -14, scaleX: 1.2, duration: 1 }, .1)
    .fromTo('.hero__ghost', { opacity: .55, xPercent: 45 }, { opacity: 0, xPercent: 0, duration: .7, ease: 'power2.out' }, .15)
    .from('[data-hero]', { y: 26, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out' }, .35)
    .from('.telemetry', { opacity: 0, y: 14, duration: .5, stagger: .1 }, .7)
    .from('.hero__ring', { scale: .6, opacity: 0, duration: 1.2 }, .2)
    .add(function () { countTo(A.getMode(), true); }, .7);

  /* ---------- Parallax con el mouse (solo punteros finos) ---------- */
  if (matchMedia('(pointer: fine)').matches) {
    var bx = gsap.quickTo('.hero__bgword', 'x', { duration: 1.2, ease: 'power3.out' });
    var rx = gsap.quickTo('.hero__ring', 'x', { duration: 1, ease: 'power3.out' });
    var ry = gsap.quickTo('.hero__ring', 'y', { duration: 1, ease: 'power3.out' });
    hero.addEventListener('pointermove', function (e) {
      var nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      bx(nx * -50); rx(nx * 24); ry(ny * 18);
    });
  }

  /* ---------- Scroll: capas a distinta velocidad ---------- */
  gsap.to('.hero__bgword', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__visual', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__text', { yPercent: -10, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  /* ---------- Marquee: velocidad base + empuje según la velocidad del scroll ---------- */
  var track = $('.marquee__track');
  if (track) {
    marqueeTween = gsap.to(track, { xPercent: -50, repeat: -1, duration: 22, ease: 'none' });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        if (marqueeTween.paused()) return;
        var boost = Math.min(5, 1 + Math.abs(self.getVelocity()) / 500);
        gsap.to(marqueeTween, { timeScale: boost * self.direction, duration: .15, overwrite: true });
        gsap.to(marqueeTween, { timeScale: self.direction, duration: 1.2, delay: .2, ease: 'power2.out' });
      }
    });
  }

  /* ---------- Elige tu disciplina: pin + scroll horizontal (escritorio) ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    var disc = $('.disc'), tr = $('.disc__track');
    disc.classList.add('is-horizontal');
    var dist = function () { return Math.max(0, tr.scrollWidth - innerWidth); };
    var move = gsap.to(tr, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: disc, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true }
    });
    $$('.disc__art', disc).forEach(function (art) {
      gsap.fromTo(art, { rotate: -10, xPercent: 20 }, { rotate: 6, xPercent: -20, ease: 'none', scrollTrigger: { trigger: art.parentNode, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } });
    });
    return function () { disc.classList.remove('is-horizontal'); };
  });
  mm.add('(max-width: 899px)', function () {
    gsap.utils.toArray('.disc__panel').forEach(function (p) {
      gsap.from(p, { y: 60, opacity: 0, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } });
    });
  });

  window.addEventListener('load', A.refresh);
})();
