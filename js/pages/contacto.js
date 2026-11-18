/* =========================================================
   APEX RIOT · Contacto
   Validación en vivo con micro-feedback (borde neón al
   enfocar, shake ante error) y envío simulado.
   ========================================================= */
(function () {
  'use strict';
  var A = window.APEX, $ = A.$, RM = A.RM;
  var form = $('#contactForm');
  if (!form) return;
  var btn = $('button[type="submit"]', form), status = $('.form-status', form);
  var label = $('.buy-btn__label', btn), original = label.innerHTML;
  A.liveValidation(form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    if (!A.validateForm(form)) { status.textContent = 'Revisa los campos marcados.'; return; }
    btn.disabled = true;
    label.innerHTML = '<span class="spinner" aria-hidden="true"></span> Enviando…';
    setTimeout(function () {
      btn.disabled = false;
      btn.classList.add('is-done');
      label.innerHTML = '¡Mensaje enviado!' + A.ICON.check;
      status.textContent = 'Gracias. Te respondemos en menos de 24 horas (envío simulado).';
      form.reset();
      A.$$('.field', form).forEach(function (f) { f.classList.remove('is-valid', 'is-invalid'); });
      setTimeout(function () { btn.classList.remove('is-done'); label.innerHTML = original; }, 3000);
    }, RM ? 200 : 1100);
  });
})();
