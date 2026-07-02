/* ── Navigation (fixed: renamed from scrollTo to goTo) ── */
function goTo(sel) {
  var el = document.querySelector(sel);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ── Nav scroll state ── */
(function() {
  var nav = document.getElementById('nav');
  var srvEl = document.getElementById('servicios');
  var pilEl = document.getElementById('pilares');

  function check() {
    var sy = window.scrollY;
    nav.classList.toggle('scrolled', sy > 50);
    var onLight = false;
    if (srvEl) {
      var r = srvEl.getBoundingClientRect();
      if (r.top < 60 && r.bottom > 60) onLight = true;
    }
    if (pilEl) {
      var p = pilEl.getBoundingClientRect();
      if (p.top < 60 && p.bottom > 60) onLight = true;
    }
    nav.classList.toggle('on-light', onLight);
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();

/* ── Mobile menu ── */
function toggleMenu() {
  document.getElementById('mm').classList.toggle('open');
  document.getElementById('hb').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('mm').classList.remove('open');
  document.getElementById('hb').classList.remove('open');
}

/* ── Parallax ── */
(function() {
  var hBg = null;
  var hImg = null;

  var fBg = document.getElementById('finalBg');

  function run() {
    var sy = window.scrollY;
    if (hBg)  hBg.style.transform  = 'translateY(' + sy * 0.18 + 'px)';
    if (hImg) hImg.style.transform = 'translateY(' + sy * 0.06 + 'px)';


    if (fBg) {
      var t = fBg.parentElement.getBoundingClientRect().top;
      var p = (window.innerHeight - t) / window.innerHeight;
      if (p > 0 && p < 2) fBg.style.transform = 'translateY(' + p * -30 + 'px)';
    }
  }
  window.addEventListener('scroll', run, { passive: true });
})();

/* ── Reveal (Intersection Observer) — content visible by default ── */
(function() {
  var els = document.querySelectorAll('.rv, .rv-inner');
  
  // Only hide elements that are below the fold
  els.forEach(function(el) {
    var rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.85) {
      el.classList.add('h');
    }
  });

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.remove('h'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  els.forEach(function(el) { obs.observe(el); });
})();

/* ── Vertical cards parallax stagger (mobile) ── */
(function() {
  var vertObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        vertObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.qs-v-card').forEach(function(el) {
    // Start visible, only animate if below fold
    if (el.getBoundingClientRect().top > window.innerHeight) {
      vertObs.observe(el);
    } else {
      el.classList.add('visible');
    }
  });
})();

/* ── Drag scroll (desktop cards) ── */
(function() {
  var w = document.getElementById('qsTrack');
  if (!w) return;
  var d = false, sx, sl;
  w.addEventListener('mousedown', function(e) { d = true; w.classList.add('grabbing'); sx = e.pageX - w.offsetLeft; sl = w.scrollLeft; });
  w.addEventListener('mouseleave', function() { d = false; w.classList.remove('grabbing'); });
  w.addEventListener('mouseup', function() { d = false; w.classList.remove('grabbing'); });
  w.addEventListener('mousemove', function(e) {
    if (!d) return;
    e.preventDefault();
    w.scrollLeft = sl - (e.pageX - w.offsetLeft - sx) * 1.2;
  });
})();

/* ── Carousel arrows ── */
function scrollCards(dir) {
  var w = document.getElementById('qsTrack');
  if (!w) return;
  var card = w.querySelector('.qs-c');
  var cardW = card ? card.offsetWidth + 16 : 320;
  w.scrollBy({ left: dir * cardW, behavior: 'smooth' });
}

/* ── Progressive Form ── */
var formState = { step: 0, session: '50 min', price: 2500, date: null };

function goStep(n) {
  // Validate current step before advancing
  if (n > formState.step) {
    if (formState.step === 1 && !formState.date) {
      var de = document.getElementById('dateError');
      if (de) de.classList.add('show');
      return;
    }
    if (formState.step === 2) {
      var nombre = document.getElementById('fNombre');
      var email = document.getElementById('fEmail');
      var valid = true;
      if (!nombre.value.trim()) {
        nombre.classList.add('error');
        document.getElementById('nombreError').classList.add('show');
        valid = false;
      } else {
        nombre.classList.remove('error');
        document.getElementById('nombreError').classList.remove('show');
      }
      if (!email.value.trim() || !email.value.includes('@')) {
        email.classList.add('error');
        document.getElementById('emailError').classList.add('show');
        valid = false;
      } else {
        email.classList.remove('error');
        document.getElementById('emailError').classList.remove('show');
      }
      if (!valid) return;
    }
  }
  // Clear date error when going back to calendar
  if (n === 1) { var de = document.getElementById('dateError'); if (de) de.classList.remove('show'); }
  if (n === 3) buildConfirm();
  for (var i = 0; i < 4; i++) {
    var fs = document.getElementById('fs' + i);
    var sd = document.getElementById('sd' + i);
    if (i === n) { fs.classList.add('active'); sd.classList.add('active'); sd.classList.remove('done'); }
    else { fs.classList.remove('active'); sd.classList.remove('active'); if (i < n) sd.classList.add('done'); else sd.classList.remove('done'); }
  }
  formState.step = n;
}

function pickSess(el, price, label) {
  document.querySelectorAll('.ss-pill').forEach(function(e) { e.classList.remove('active'); });
  el.classList.add('active');
  formState.price = price;
  formState.session = label;
  document.getElementById('priceD').textContent = '$' + price.toLocaleString();
}

function buildConfirm() {
  var s = document.getElementById('confirmSummary');
  var name = (document.getElementById('fNombre').value || '—') + ' ' + (document.getElementById('fApellido').value || '');
  var email = document.getElementById('fEmail').value || '—';
  var area = document.getElementById('fArea').value || '—';
  s.innerHTML =
    '<div class="confirm-row"><span class="confirm-key">Sesión</span><span class="confirm-val">' + formState.session + '</span></div>' +
    '<div class="confirm-row"><span class="confirm-key">Fecha</span><span class="confirm-val">' + (formState.date || 'No seleccionada') + '</span></div>' +
    '<div class="confirm-row"><span class="confirm-key">Nombre</span><span class="confirm-val">' + name.trim() + '</span></div>' +
    '<div class="confirm-row"><span class="confirm-key">Correo</span><span class="confirm-val">' + email + '</span></div>' +
    '<div class="confirm-row"><span class="confirm-key">Área</span><span class="confirm-val">' + area + '</span></div>';
}

function handleBook() {
  alert('Redirigiendo al proceso de pago. (Integración con pasarela de pago pendiente)');
}

/* ── S3 QUÉ ES FELIZ: sticky video intro + controles + reveal bidireccional ── */
(function() {
  var section  = document.getElementById('que-es');
  if (!section) return;

  var video    = document.getElementById('qeVideo');
  var overlay  = document.getElementById('qeOv');
  var content  = document.getElementById('qeCt');
  var controls = document.getElementById('qeControls');
  var btnPlay  = document.getElementById('qeBtnPlay');
  var btnPause = document.getElementById('qeBtnPause');
  var btnReplay= document.getElementById('qeBtnReplay');
  var audioPrompt = document.getElementById('qeAudioPrompt');
  var audioBtn    = document.getElementById('qeAudioBtn');
  if (!video) return;

  var textVisible    = false;
  var sectionInView  = false;
  var userPaused     = false;
  var audioActivated = false; /* true una vez que el usuario activa el audio */

  /* ── Estado visual play / pause ── */
  function setPlaying(playing) {
    if (controls) controls.classList.toggle('playing', playing);
  }

  /*
   * doPlay()
   * --------
   * Siempre arranca muted para garantizar autoplay.
   * Si el usuario ya activó el audio, desmutea después del play.
   */
  function doPlay() {
    video.muted = true;
    var p = video.play();
    if (p === undefined) {
      if (audioActivated) video.muted = false;
      setPlaying(true);
      return;
    }
    p.then(function() {
      if (audioActivated) video.muted = false;
      setPlaying(true);
    }).catch(function() {
      setPlaying(false);
    });
  }

  /*
   * Interceptar autoplay del navegador: si la sección no está visible,
   * no permitir que se reproduzca.
   */
  video.addEventListener('play', function() {
    if (!sectionInView) {
      video.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  });
  video.addEventListener('pause', function() { setPlaying(false); });

  /* ── Audio activation overlay ── */
  /*
   * Cuando la sección entra en viewport y el audio no ha sido activado,
   * mostramos el overlay con la animación de "Activar audio".
   * El video ya corre muted debajo.
   * Al hacer click, se desmutea y se oculta el overlay.
   */
  function showAudioPrompt() {
    if (audioPrompt && !audioActivated) {
      audioPrompt.classList.add('show');
      audioPrompt.classList.remove('hide');
    }
  }

  function hideAudioPrompt() {
    if (audioPrompt) {
      audioPrompt.classList.add('hide');
      audioPrompt.classList.remove('show');
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', function() {
      audioActivated = true;
      video.muted = false;
      hideAudioPrompt();
    });
  }

  /* ── Botones de control ── */
  if (btnPlay) btnPlay.addEventListener('click', function() {
    userPaused = false;
    doPlay();
  });

  if (btnPause) btnPause.addEventListener('click', function() {
    userPaused = true;
    video.pause();
  });

  if (btnReplay) {
    btnReplay.addEventListener('click', function() {
      userPaused = false;
      video.pause();
      video.currentTime = 0;
      video.addEventListener('seeked', function onSeeked() {
        video.removeEventListener('seeked', onSeeked);
        doPlay();
      });
    });
  }

  /* ── Visibilidad de la sección: arrancar / pausar con IntersectionObserver ── */
  /*
   * Comportamiento:
   *  - Scroll hacia abajo → entra a la sección → video empieza muted + overlay de audio
   *  - Usuario activa audio → se desmutea, overlay desaparece
   *  - Sigue scroll y sale → video se pausa
   *  - Regresa a la sección → video retoma (con audio si ya fue activado)
   *  - Video tiene loop → nunca se detiene solo, siempre por pausa manual o salir de sección
   */
  var entryObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        sectionInView = true;
        if (!userPaused) {
          doPlay();
          /* Mostrar prompt de audio con un breve delay para la animación */
          if (!audioActivated) {
            setTimeout(showAudioPrompt, 400);
          }
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          if (overlay) overlay.classList.add('show');
          if (content) content.classList.add('show');
        }
      } else {
        sectionInView = false;
        video.pause();
        hideAudioPrompt();
      }
    });
  }, { threshold: 0.3 });

  entryObs.observe(section);

  /* ── Reveal bidireccional (texto aparece al 55%, se oculta al 25%) ── */
  function onScroll() {
    var rect     = section.getBoundingClientRect();
    var sectionH = section.offsetHeight;
    var viewH    = window.innerHeight;
    var scrolled = -rect.top;
    var total    = sectionH - viewH;
    var progress = total > 0 ? scrolled / total : 0;

    if (progress >= 0.55 && !textVisible) {
      textVisible = true;
      if (overlay) overlay.classList.add('show');
      if (content) content.classList.add('show');
    }
    if (progress < 0.25 && textVisible) {
      textVisible = false;
      if (overlay) overlay.classList.remove('show');
      if (content) content.classList.remove('show');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ── S4 SERVICIOS: 3-phase scroll (hero title → layout) ── */
(function() {
  var section   = document.getElementById('servicios');
  if (!section) return;

  var heroEl    = document.getElementById('srvHero');
  var heroT     = document.getElementById('srvHeroT');
  var innerEl   = document.getElementById('srvInner');
  var imgPanel  = section.querySelector('.srv-left');
  var reveals   = section.querySelectorAll('.srv-reveal');

  var phase = 0;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function showLayout() {
    if (heroEl) heroEl.classList.add('hidden');
    if (innerEl) innerEl.classList.add('visible');
    if (imgPanel) imgPanel.classList.add('visible');
    reveals.forEach(function(el, i) {
      setTimeout(function() { el.classList.add('visible'); }, i * 70);
    });
  }

  function resetLayout() {
    if (heroEl) heroEl.classList.remove('hidden');
    if (heroT) { heroT.style.transform = ''; heroT.style.opacity = ''; }
    if (innerEl) innerEl.classList.remove('visible');
    if (imgPanel) imgPanel.classList.remove('visible');
    reveals.forEach(function(el) { el.classList.remove('visible'); });
  }

  function onScroll() {
    var rect     = section.getBoundingClientRect();
    var sectionH = section.offsetHeight;
    var viewH    = window.innerHeight;
    var scrolled = -rect.top;
    var total    = sectionH - viewH;
    var progress = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0;

    /*
     * Fase 0 (0–30%): título hero centrado, con ligero zoom-out al final
     * Fase 1 (30–100%): layout completo, todo visible de golpe
     */
    if (progress < 0.30) {
      if (phase !== 0) { phase = 0; resetLayout(); }
      /* zoom-out suave hacia el final de la fase hero */
      var p = progress / 0.30;
      var scale   = 1 - easeInOut(p) * 0.10;
      var opacity = p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;
      if (heroT) {
        heroT.style.transform = 'scale(' + scale + ')';
        heroT.style.opacity   = opacity;
      }
    } else {
      if (phase !== 1) { phase = 1; showLayout(); }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── S6 PILARES: hero phase + scroll-driven activation + click to seek ── */
(function() {
  var section    = document.getElementById('pilares');
  if (!section) return;

  var heroEl     = document.getElementById('pilHero');
  var heroT      = document.getElementById('pilHeroT');
  var innerEl    = document.getElementById('pilInner');
  var headlines  = section.querySelectorAll('.pil-hl');
  var images     = section.querySelectorAll('.pil-img');
  var imgPanel   = section.querySelector('.pil-right');
  var reveals    = section.querySelectorAll('.pil-reveal');

  var phase = 0;
  var numPilars = headlines.length;
  var heroEnd = 0.15;
  var layoutEnd = 0.95;

  function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  function setActive(idx) {
    headlines.forEach(function(h, i) { h.classList.toggle('active', i === idx); });
    images.forEach(function(img, i) { img.classList.toggle('active', i === idx); });
  }

  function showLayout() {
    if (heroEl) heroEl.classList.add('hidden');
    if (innerEl) innerEl.classList.add('visible');
    if (imgPanel) imgPanel.classList.add('visible');
    reveals.forEach(function(el, i) {
      setTimeout(function() { el.classList.add('visible'); }, i * 70);
    });
  }

  function resetLayout() {
    if (heroEl) heroEl.classList.remove('hidden');
    if (heroT) { heroT.style.transform = ''; heroT.style.opacity = ''; }
    if (innerEl) innerEl.classList.remove('visible');
    if (imgPanel) imgPanel.classList.remove('visible');
    reveals.forEach(function(el) { el.classList.remove('visible'); });
    setActive(0);
  }

  function onScroll() {
    if (isSeeking) return; /* no interrumpir durante scroll programático */

    var rect     = section.getBoundingClientRect();
    var sectionH = section.offsetHeight;
    var viewH    = window.innerHeight;
    var scrolled = -rect.top;
    var total    = sectionH - viewH;
    var progress = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0;

    if (progress < heroEnd) {
      if (phase !== 0) { phase = 0; resetLayout(); }
      var p = progress / heroEnd;
      var scale   = 1 - easeInOut(p) * 0.10;
      var opacity = p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;
      if (heroT) { heroT.style.transform = 'scale(' + scale + ')'; heroT.style.opacity = opacity; }
    } else {
      if (phase !== 1) { phase = 1; showLayout(); }
      var layoutProgress = (progress - heroEnd) / (layoutEnd - heroEnd);
      layoutProgress = Math.max(0, Math.min(1, layoutProgress));
      var activeIdx = Math.min(numPilars - 1, Math.floor(layoutProgress * numPilars));
      setActive(activeIdx);
    }
  }

  /* ── Click to seek: activa el pilar visualmente sin mover el scroll ── */
  var isSeeking = false;
  var seekTargetIdx = 0;

  headlines.forEach(function(hl) {
    hl.addEventListener('click', function() {
      var idx = parseInt(hl.getAttribute('data-pilar'), 10);
      if (isNaN(idx)) return;

      /* Asegurar que el layout esté visible */
      if (phase !== 1) { phase = 1; showLayout(); }

      /* Activar el pilar inmediatamente */
      seekTargetIdx = idx;
      setActive(idx);

      /* Bloquear onScroll brevemente para que no sobreescriba el estado */
      isSeeking = true;
      setTimeout(function() { isSeeking = false; }, 50);
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── START PAGE FLOW ── */
(function() {
  var page = document.querySelector('.start-page');
  if (!page) return;

  var steps = Array.from(page.querySelectorAll('.start-step'));
  var counter = page.querySelector('.start-step-counter');
  var buttons = Array.from(page.querySelectorAll('.start-button-link'));

  var progressFill = page.querySelector('.start-progress-fill');

  function updateStep(index) {
    steps.forEach(function(step, i) {
      step.classList.toggle('active', i === index);
    });
    if (counter) counter.textContent = 'STEP ' + (index + 1) + ' OF ' + steps.length;
    if (progressFill) {
      progressFill.style.width = Math.round(((index + 1) / steps.length) * 100) + '%';
    }
  }

  buttons.forEach(function(button) {
    var target = button.getAttribute('data-target');
    if (!target) return;
    button.addEventListener('click', function() {
      var next = parseInt(target, 10);
      if (!Number.isNaN(next) && next >= 0 && next < steps.length) {
        updateStep(next);
      }
    });
  });

  updateStep(0);
})();