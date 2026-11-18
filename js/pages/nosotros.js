/* =========================================================
   APEX RIOT · Nosotros
   Manifiesto que se enciende palabra por palabra al hacer
   scroll, contadores, línea de tiempo y la pieza original
   "APEX Ignition" en Lottie (carga diferida).
   ========================================================= */
(function () {
  'use strict';
  var A = window.APEX, $ = A.$, $$ = A.$$, RM = A.RM;

  /* ---------- APEX Ignition (Lottie) ----------
     lottie-web solo se descarga cuando la sección está cerca
     del viewport, para no penalizar la carga inicial. */
  var stage = $('#ignitionStage'), holder = $('#ignitionLottie'), fallback = $('#ignitionFallback');
  var replay = $('#ignReplay'), pauseBtn = $('#ignPause');
  var anim = null, loading = false, visible = false;

  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }
  function setPaused(paused) {
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Reproducir' : 'Pausar';
  }
  function initLottie() {
    if (loading) return; loading = true;
    loadScript('js/vendor/lottie_light.min.js').then(function () {
      anim = lottie.loadAnimation({
        container: holder, renderer: 'svg', loop: false, autoplay: false,
        path: 'assets/lottie/apex-ignition.json',
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true }
      });
      anim.addEventListener('DOMLoaded', function () {
        fallback.style.display = 'none';
        if (RM) { anim.goToAndStop(anim.totalFrames - 1, true); setPaused(true); }
        else if (visible) { anim.play(); setPaused(false); }
      });
      anim.addEventListener('complete', function () { setPaused(true); });
    }).catch(function () { loading = false; /* queda el logo estático de respaldo */ });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible = en.isIntersecting && en.intersectionRatio > .45;
        if (en.isIntersecting) initLottie();
        if (anim && visible && !RM && anim.isPaused && anim.currentFrame < 2) { anim.play(); setPaused(false); }
      });
    }, { rootMargin: '300px 0px', threshold: [0, .45, .7] }).observe(stage);
  } else initLottie();

  replay.addEventListener('click', function () {
    if (!anim) { initLottie(); return; }
    anim.goToAndPlay(0, true); setPaused(false);
  });
  pauseBtn.addEventListener('click', function () {
    if (!anim) return;
    if (anim.isPaused) {
      if (anim.currentFrame >= anim.totalFrames - 1) anim.goToAndPlay(0, true); else anim.play();
      setPaused(false);
    } else { anim.pause(); setPaused(true); }
  });

  if (RM || !A.hasGSAP) return;

  /* ---------- Manifiesto: cada palabra se enciende con el scroll ---------- */
  var words = $$('#manifesto .word');
  ScrollTrigger.create({
    trigger: '#manifesto', start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: function (self) {
      var n = Math.round(self.progress * words.length);
      words.forEach(function (w, i) { w.classList.toggle('is-on', i < n); });
    }
  });

  /* ---------- Contadores ---------- */
  $$('[data-counter]').forEach(function (el) {
    var end = +el.getAttribute('data-counter'), o = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: function () {
        gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('es-CO'); } });
      }
    });
  });

  /* ---------- Línea de tiempo: la línea se "llena" al avanzar ---------- */
  gsap.to('.timeline__fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  $$('.milestone').forEach(function (m) {
    ScrollTrigger.create({ trigger: m, start: 'top 70%', onEnter: function () { m.classList.add('is-on'); } });
  });
})();
