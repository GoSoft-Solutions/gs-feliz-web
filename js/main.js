/* ── Navigation (fixed: renamed from scrollTo to goTo) ── */
function goTo(sel) {
  var el = document.querySelector(sel);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ── Nav scroll state ── */
(function() {
  var nav = document.getElementById('nav');
  var srvEl = document.getElementById('servicios');

  function check() {
    var sy = window.scrollY;
    nav.classList.toggle('scrolled', sy > 50);
    if (srvEl) {
      var r = srvEl.getBoundingClientRect();
      nav.classList.toggle('on-light', r.top < 60 && r.bottom > 60);
    }
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
  var section = document.getElementById('que-es');
  if (!section) return;

  var video = document.getElementById('qeVideo');
  var overlay = document.getElementById('qeOv');
  var content = document.getElementById('qeCt');
  var controls = document.getElementById('qeControls');
  var btnPlay = document.getElementById('qeBtnPlay');
  var btnPause = document.getElementById('qeBtnPause');
  var btnReplay = document.getElementById('qeBtnReplay');
  if (!video) return;

  var textVisible = false;
  var isPlaying = false;
  var userInteracted = false;

  function setPlaying(playing) {
    isPlaying = playing;
    if (controls) controls.classList.toggle('playing', playing);
  }

  function enableAudio() {
    userInteracted = true;
    video.muted = false;
    video.volume = 1;

    if (video.paused) {
      var rect = section.getBoundingClientRect();
      var inView = rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0;
      if (inView) {
        video.play().then(function() {
          setPlaying(true);
        }).catch(function() {
          setPlaying(false);
        });
      }
    }
  }

  function tryPlay() {
    if (!video) return;

    video.play().then(function() {
      setPlaying(true);
      if (userInteracted) {
        video.muted = false;
        video.volume = 1;
      }
    }).catch(function() {
      setPlaying(false);
    });
  }

  function updateVideo() {
    var rect = section.getBoundingClientRect();
    var inView = rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0;

    if (inView && video.paused) {
      video.muted = true;
      tryPlay();
    } else if (!inView && !video.paused) {
      video.pause();
      setPlaying(false);
    }
  }

  video.addEventListener('play', function() {
    setPlaying(true);
  });

  video.addEventListener('pause', function() {
    setPlaying(false);
  });

  video.addEventListener('click', enableAudio);
  section.addEventListener('click', enableAudio);
  document.addEventListener('click', enableAudio, { passive: true });
  document.addEventListener('touchstart', enableAudio, { passive: true });

  if (btnPlay) {
    btnPlay.addEventListener('click', function() {
      userInteracted = true;
      video.muted = false;
      video.volume = 1;
      tryPlay();
    });
  }

  if (btnPause) {
    btnPause.addEventListener('click', function() {
      video.pause();
    });
  }

  if (btnReplay) {
    btnReplay.addEventListener('click', function() {
      video.pause();
      video.currentTime = 0;
      userInteracted = true;
      video.muted = false;
      video.volume = 1;
      tryPlay();
    });
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        updateVideo();
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px'
  });

  observer.observe(section);
  window.addEventListener('scroll', updateVideo, { passive: true });
  window.addEventListener('load', updateVideo);

  function onScrollReveal() {
    var rect = section.getBoundingClientRect();
    var sectionH = section.offsetHeight;
    var viewH = window.innerHeight;
    var scrolled = -rect.top;
    var total = sectionH - viewH;
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

  window.addEventListener('scroll', onScrollReveal, { passive: true });
})();