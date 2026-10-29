/* Tulip bouquet: lightweight 2D version.
   Every tulip is one small inline SVG built once at load. Motion is a single
   CSS sway on the whole bouquet, so there is no per-frame JavaScript. */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && matchMedia('(hover: hover)').matches;
  var introScreen = document.getElementById('introScreen');
  var openEnvelope = document.getElementById('openEnvelope');
  var pageContent = document.getElementById('pageContent');

  openEnvelope.addEventListener('click', function () {
    if (introScreen.classList.contains('opening')) return;
    introScreen.classList.add('opening');
    document.body.classList.remove('intro-active');
    pageContent.inert = false;
    window.setTimeout(function () {
      introScreen.hidden = true;
    }, reduce ? 0 : 780);
  });

  /* ---------- soft pinks for the tulip buds ---------- */
  var PALETTES = {
    rose:  { dark: '#b83a6c', base: '#e0638f', light: '#f6a1bf' },
    pink:  { dark: '#c9507f', base: '#ec86a9', light: '#f9b4cb' },
    blush: { dark: '#e48aac', base: '#f5aac4', light: '#fdd6e3' },
    deep:  { dark: '#a82f5f', base: '#d4557f', light: '#ee8fb0' }
  };

  function ns(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* One hidden <svg> holds every gradient, shared by all tulips. */
  function buildDefs() {
    var svg = ns('svg', { width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false' });
    svg.style.position = 'absolute';
    var defs = ns('defs', {});

    function grad(id, x1, y1, x2, y2, stops) {
      var g = ns('linearGradient', { id: id, x1: x1, y1: y1, x2: x2, y2: y2 });
      stops.forEach(function (s) { g.appendChild(ns('stop', { offset: s[0], 'stop-color': s[1] })); });
      defs.appendChild(g);
    }

    Object.keys(PALETTES).forEach(function (name) {
      var c = PALETTES[name];
      grad('tg-l-' + name, '0', '0', '1', '1', [['0', c.light], ['0.5', c.base], ['1', c.dark]]);
      grad('tg-r-' + name, '1', '0', '0', '1', [['0', c.light], ['0.5', c.base], ['1', c.dark]]);
      grad('tg-c-' + name, '0', '0', '0', '1', [['0', c.light], ['0.5', c.base], ['1', c.dark]]);
      grad('tg-f-' + name, '0', '0', '1', '1', [['0', c.light], ['0.55', c.base], ['1', c.base]]);
    });
    grad('leafGrad', '0', '0', '1', '0', [['0', '#4a8541'], ['0.5', '#86bb68'], ['1', '#4a8541']]);

    svg.appendChild(defs);
    return svg;
  }

  /* ---------- one tulip: closed egg-shaped bud on a curved stem with broad leaves ---------- */
  function tulipMarkup(p, tilt, bend) {
    var b = bend;
    return '' +
      '<svg viewBox="0 0 100 300" aria-hidden="true" focusable="false">' +
        '<path class="stem" d="M50 98 C' + (50 + b) + ' 160 ' + (50 - b) + ' 230 50 300"/>' +
        /* broad leaves hugging the stem */
        '<path d="M50 200 C22 182 6 128 14 74 C36 100 48 148 50 200Z" fill="url(#leafGrad)"/>' +
        '<path class="vein" d="M49 192 C38 150 26 112 16 82"/>' +
        '<path d="M50 176 C76 160 92 114 86 68 C66 94 52 132 50 176Z" fill="url(#leafGrad)"/>' +
        '<path class="vein" d="M51 170 C62 136 76 104 84 76"/>' +
        /* bud, tilted a little around its base */
        '<g transform="rotate(' + tilt + ' 50 100)">' +
          '<path d="M50 99 C21 97 12 62 21 33 C27 16 41 7 50 5 C59 7 73 16 79 33 C88 62 79 97 50 99Z" fill="url(#tg-c-' + p + ')"/>' +
          '<path d="M50 99 C25 95 16 66 22 38 C26 22 38 12 50 6 C43 34 42 70 50 99Z" fill="url(#tg-l-' + p + ')" opacity="0.85"/>' +
          '<path d="M50 99 C75 95 84 66 78 38 C74 22 62 12 50 6 C57 34 58 70 50 99Z" fill="url(#tg-r-' + p + ')" opacity="0.85"/>' +
          '<path d="M47 99 C27 93 27 52 38 28 C42 18 48 11 54 7 C68 24 73 58 66 82 C62 94 55 99 47 99Z" fill="url(#tg-f-' + p + ')" stroke="#8c1f52" stroke-opacity="0.22" stroke-width="1"/>' +
          '<path class="shine" d="M36 44 C36 32 41 23 46 17"/>' +
        '</g>' +
      '</svg>';
  }

  function bladeMarkup() {
    return '' +
      '<svg viewBox="0 0 40 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
        '<path d="M20 120 C-2 92 0 40 20 0 C40 40 42 92 20 120Z" fill="url(#leafGrad)"/>' +
        '<path class="vein" d="M20 112 L20 14"/>' +
      '</svg>';
  }

  function place(cls, markup, w, h, angle) {
    var d = document.createElement('div');
    d.className = cls;
    d.style.width = w + 'em';
    d.style.height = h + 'em';
    d.style.left = 'calc(50% - ' + (w / 2) + 'em)';
    d.style.transform = 'rotate(' + angle + 'deg)';
    d.innerHTML = markup;
    return d;
  }

  var bouquet = document.getElementById('bouquet');
  var front = bouquet.querySelector('.paper.front');
  bouquet.appendChild(buildDefs());

  /* broad leaves sit behind the flowers: [angle, height] */
  [[-30, 19], [-20, 23], [-10, 26], [10, 26], [20, 23], [30, 19]].forEach(function (b) {
    bouquet.insertBefore(place('blade', bladeMarkup(), b[1] / 3.6, b[1], b[0]), front);
  });

  /* eight tulips in a tight fan: [angle, height in em, palette, head tilt, stem bend] */
  var TULIPS = [
    [-34, 22,   'blush', -6,  4],
    [-24, 25,   'rose',   5, -4],
    [-14, 21,   'pink',  -4,  3],
    [-6,  29,   'blush',  4, -3],
    [3,   24,   'rose',  -5,  4],
    [11,  30,   'pink',   6, -4],
    [21,  22.5, 'blush', -3,  3],
    [30,  26.5, 'rose',   5, -3]
  ];
  /* taller tulips are drawn first, so the shorter ones sit in front */
  TULIPS.slice().sort(function (a, b) { return b[1] - a[1]; }).forEach(function (t) {
    bouquet.insertBefore(place('tulip', tulipMarkup(t[2], t[3], t[4]), t[1] / 3, t[1], t[0]), front);
  });

  /* ---------- gentle pointer lean (one update per frame, mouse only) ---------- */
  var tilt = document.getElementById('tilt');
  if (!reduce && canHover) {
    var pending = false, px = 0;
    window.addEventListener('pointermove', function (e) {
      px = (e.clientX / window.innerWidth - 0.5) * 2;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        tilt.style.transform = 'rotate(' + (px * 2.5).toFixed(2) + 'deg)';
        pending = false;
      });
    }, { passive: true });
  }

  /* ---------- drifting petals: a few, animated with CSS only ---------- */
  var drift = document.getElementById('drift');
  if (!reduce) {
    var count = window.innerWidth < 600 ? 5 : 8;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      p.style.left = (6 + (i * 88) / count + Math.random() * 6).toFixed(1) + '%';
      p.style.setProperty('--dur', (14 + Math.random() * 8).toFixed(1) + 's');
      p.style.setProperty('--delay', (-Math.random() * 20).toFixed(1) + 's');
      p.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
      drift.appendChild(p);
    }
  }

  /* ---------- photo frame: click or tap to toggle ---------- */
  var frame = document.getElementById('frame');
  var photoPopup = document.getElementById('photoPopup');
  var closePhotoPopup = document.getElementById('closePhotoPopup');
  var music = document.getElementById('bgMusic');
  var musicFade = 0;
  var musicVolume = 0.35;

  function fadeMusic(target, pauseAtEnd) {
    if (musicFade) cancelAnimationFrame(musicFade);
    var startVolume = music.volume;
    var startTime = performance.now();
    function updateVolume(now) {
      var progress = Math.min((now - startTime) / 450, 1);
      var eased = progress * progress * (3 - 2 * progress);
      music.volume = startVolume + (target - startVolume) * eased;
      if (progress < 1) {
        musicFade = requestAnimationFrame(updateVolume);
      } else {
        musicFade = 0;
        if (pauseAtEnd) music.pause();
      }
    }
    musicFade = requestAnimationFrame(updateVolume);
  }

  function setOpen(v) {
    frame.classList.toggle('open', v);
    frame.setAttribute('aria-expanded', String(v));
    if (v) {
      if (!photoPopup.open) photoPopup.showModal();
      if (musicFade) cancelAnimationFrame(musicFade);
      musicFade = 0;
      music.pause();
      music.currentTime = 0;
      music.volume = 0;
      var playing = music.play();
      if (playing && playing.catch) playing.catch(function () {
        if (frame.classList.contains('open')) {
          if (musicFade) cancelAnimationFrame(musicFade);
          musicFade = 0;
          music.volume = 0;
        }
      });
      fadeMusic(musicVolume, false);
    } else {
      if (photoPopup.open) photoPopup.close();
      fadeMusic(0, true);
    }
  }
  music.volume = 0;
  frame.addEventListener('click', function () {
    setOpen(!frame.classList.contains('open'));
  });
  closePhotoPopup.addEventListener('click', function () { setOpen(false); });
  photoPopup.addEventListener('click', function (e) {
    if (e.target === photoPopup) setOpen(false);
  });
  photoPopup.addEventListener('cancel', function () { setOpen(false); });

  /* Set to an image path such as "images/us.jpg" to show your photo. */
  var photoPath = 'chi.png';
  var img = document.getElementById('userPhoto');
  var holder = document.getElementById('holder');
  var popupImg = document.getElementById('popupPhoto');
  var popupHolder = document.getElementById('popupHolder');
  if (photoPath) {
    img.src = photoPath;
    img.hidden = false;
    holder.hidden = true;
    popupImg.src = photoPath;
    popupImg.hidden = false;
    popupHolder.hidden = true;
  }
})();