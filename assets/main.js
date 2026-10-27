(function () {
  'use strict';

  /* Jahr im Footer */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Header-Schatten beim Scrollen */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobiles Menü */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('hauptnavigation');
  function closeMenu() {
    if (!toggle || !nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menü öffnen');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });
  }

  /* Dropdown "Leistungen" */
  var dd = document.querySelector('.nav-dd');
  var ddToggle = dd ? dd.querySelector('.nav-dd-toggle') : null;
  function setDd(open) {
    if (!dd) return;
    dd.classList.toggle('open', open);
    ddToggle.setAttribute('aria-expanded', String(open));
  }
  if (dd && ddToggle) {
    ddToggle.addEventListener('click', function (e) { e.stopPropagation(); setDd(!dd.classList.contains('open')); });
    dd.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setDd(false); dd.classList.add('hover-off'); }); });
    dd.addEventListener('mouseleave', function () { dd.classList.remove('hover-off'); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setDd(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDd(false); });
  }

  /* Aktiver Menüpunkt */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav > a[href^="#"]'));
  var serviceIds = ['leistungen'];
  if (dd) dd.querySelectorAll('a[href^="#"]').forEach(function (a) { serviceIds.push(a.getAttribute('href').slice(1)); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + id); });
        if (ddToggle) ddToggle.classList.toggle('active', serviceIds.indexOf(id) !== -1);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* Leistungs-Buttons füllen das Formular vor */
  var select = document.getElementById('f-leistung');
  document.querySelectorAll('[data-leistung]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!select) return;
      var want = btn.getAttribute('data-leistung');
      Array.prototype.forEach.call(select.options, function (o) { if (o.text === want) select.value = o.value; });
    });
  });

  /* Referenzen: Filter + "mehr anzeigen" */
  var gallery = document.getElementById('galerie');
  var items = gallery ? Array.prototype.slice.call(gallery.querySelectorAll('button')) : [];
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var moreBtn = document.getElementById('mehr');
  var filter = 'alle';
  var expanded = false;

  function applyGallery() {
    items.forEach(function (item) {
      var cats = (item.getAttribute('data-cat') || '').split(' ');
      var match = filter === 'alle' || cats.indexOf(filter) !== -1;
      var extra = item.hasAttribute('data-more');
      item.hidden = !match || (filter === 'alle' && extra && !expanded);
      /* Breite Kacheln nur in der Gesamtansicht, damit gefilterte Raster sauber schließen */
      item.classList.toggle('wide-off', filter !== 'alle');
    });
    if (moreBtn) moreBtn.parentElement.hidden = filter !== 'alle' || expanded;
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      filter = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      applyGallery();
    });
  });
  if (moreBtn) moreBtn.addEventListener('click', function () { expanded = true; applyGallery(); });
  applyGallery();

  /* Lightbox */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var lbCount = document.getElementById('lb-count');
  var visible = [];
  var index = 0;
  var lastFocus = null;

  function show(i) {
    if (!visible.length) return;
    index = (i + visible.length) % visible.length;
    var item = visible[index];
    var img = item.querySelector('img');
    lbImg.src = item.getAttribute('data-full');
    lbImg.alt = img ? img.alt : '';
    lbCap.textContent = img ? img.alt : '';
    lbCount.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0');
  }
  function openLb(item) {
    visible = items.filter(function (it) { return !it.hidden; });
    lastFocus = item;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(visible.indexOf(item));
    document.getElementById('lb-close').focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
    if (lastFocus) lastFocus.focus();
  }
  if (lb) {
    items.forEach(function (item) { item.addEventListener('click', function () { openLb(item); }); });
    document.getElementById('lb-close').addEventListener('click', closeLb);
    document.getElementById('lb-prev').addEventListener('click', function () { show(index - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'Tab') {
        var f = Array.prototype.slice.call(lb.querySelectorAll('button'));
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var startX = null;
    lb.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* Anfrageformular: sendet die Anfrage an /api/contact (Versand per Resend) */
  var form = document.getElementById('anfrage');
  var status = document.getElementById('form-status');
  var startedAt = Date.now();
  function setStatus(text, type) {
    status.hidden = false;
    status.className = 'form-status ' + type;
    status.textContent = text;
  }
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.innerHTML : '';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, mail = form.elements.email, msg = form.elements.nachricht, consent = form.elements.consent;
      var errors = [];
      [name, mail, msg].forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if (!name.value.trim()) { errors.push('Name'); name.setAttribute('aria-invalid', 'true'); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) { errors.push('gültige E-Mail-Adresse'); mail.setAttribute('aria-invalid', 'true'); }
      if (!msg.value.trim()) { errors.push('Nachricht'); msg.setAttribute('aria-invalid', 'true'); }
      if (!consent.checked) errors.push('Zustimmung zur Datenschutzerklärung');
      if (errors.length) {
        setStatus('Bitte ergänzen Sie: ' + errors.join(', ') + '.', 'error');
        var bad = form.querySelector('[aria-invalid="true"]') || consent;
        bad.focus();
        return;
      }
      var payload = {
        name: name.value.trim(),
        telefon: form.elements.telefon.value.trim(),
        email: mail.value.trim(),
        ort: form.elements.ort.value.trim(),
        leistung: form.elements.leistung.value,
        flaeche: form.elements.flaeche.value.trim(),
        nachricht: msg.value.trim(),
        consent: consent.checked,
        website: form.elements.website ? form.elements.website.value : '',
        t: startedAt
      };
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet …'; }
      setStatus('Ihre Anfrage wird gesendet …', 'ok');
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (d) { return { ok: r.ok && d.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            startedAt = Date.now();
            setStatus('Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich bei Ihnen.', 'ok');
          } else {
            setStatus((res.d && res.d.error ? res.d.error + ' ' : 'Die Anfrage konnte nicht gesendet werden. ') + 'Bitte versuchen Sie es erneut oder erreichen Sie uns direkt: 0172 2446372 oder info@eno-fussbodenbau.de.', 'error');
          }
        })
        .catch(function () {
          setStatus('Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder erreichen Sie uns direkt: 0172 2446372 oder info@eno-fussbodenbau.de.', 'error');
        })
        .then(function () { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitLabel; } });
    });
  }
})();

/* Ablauf: Schritte beim Scrollen durchlaufen */
(function () {
  'use strict';
  var section = document.getElementById('ablauf');
  var tl = document.getElementById('timeline');
  if (!section || !tl) return;
  var steps = Array.prototype.slice.call(tl.children);
  var n = steps.length;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(min-width: 861px)');
  var track = section.querySelector('.ablauf-track');
  var pin = section.querySelector('.ablauf-pin');
  var detail = section.querySelector('.ablauf-detail');
  var adNum = document.getElementById('ad-num');
  var adTitle = document.getElementById('ad-title');
  var adText = document.getElementById('ad-text');
  var current = -1;
  var ticking = false;

  function headerH() {
    var h = document.querySelector('.site-header');
    return h ? h.getBoundingClientRect().height : 72;
  }
  function setCurrent(idx) {
    steps.forEach(function (li, i) {
      li.classList.toggle('is-active', i <= idx);
      li.classList.toggle('is-current', i === idx);
    });
    if (idx === current) return;
    current = idx;
    var li = steps[idx];
    adNum.textContent = String(idx + 1).padStart(2, '0');
    adTitle.textContent = li.querySelector('h3').textContent;
    adText.textContent = li.getAttribute('data-long');
    detail.classList.remove('swap'); void detail.offsetWidth; detail.classList.add('swap');
  }
  function update() {
    ticking = false;
    if (reduce.matches) {
      tl.classList.remove('js-steps'); section.classList.remove('pinned');
      tl.style.setProperty('--p', 1); setCurrent(n - 1); return;
    }
    tl.classList.add('js-steps');
    section.classList.toggle('pinned', desktop.matches);
    var p;
    if (desktop.matches) {
      var r = track.getBoundingClientRect();
      var total = r.height - pin.offsetHeight;
      p = total > 0 ? (headerH() - r.top) / total : 1;
    } else {
      var t = tl.getBoundingClientRect();
      p = (window.innerHeight * 0.6 - t.top) / t.height;
    }
    p = Math.max(0, Math.min(1, p));
    tl.style.setProperty('--p', p.toFixed(4));
    var idx = Math.min(n - 1, Math.floor(p * (n - 1) + 0.15));
    setCurrent(idx);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* Cookie-Hinweis (nur technisch notwendiges Cookie) */
(function () {
  'use strict';
  var NAME = 'eno_cookie_consent';
  function read() {
    try { if (document.cookie.split('; ').some(function (c) { return c.indexOf(NAME + '=') === 0; })) return true; } catch (e) {}
    try { return localStorage.getItem(NAME) === '1'; } catch (e) { return false; }
  }
  function save() {
    var ok = false;
    try { document.cookie = NAME + '=notwendig; max-age=31536000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); ok = document.cookie.indexOf(NAME + '=') !== -1; } catch (e) {}
    if (!ok) { try { localStorage.setItem(NAME, '1'); } catch (e) {} }
  }
  var banner = null;
  function build() {
    banner = document.createElement('section');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cb-title');
    banner.setAttribute('aria-describedby', 'cb-text');
    banner.innerHTML =
      '<h2 id="cb-title"><svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3 3 0 0 0 4 3.5 3 3 0 0 0 5 5.5z"/><circle cx="8.5" cy="10" r=".8" fill="currentColor"/><circle cx="12" cy="15" r=".8" fill="currentColor"/><circle cx="15.5" cy="12" r=".8" fill="currentColor"/></g></svg>Cookies auf dieser Website</h2>' +
      '<p id="cb-text">Wir verwenden nur ein technisch notwendiges Cookie, das Ihre Auswahl zu diesem Hinweis speichert. Es gibt keine Analyse-, Marketing- oder Drittanbieter-Cookies. Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
      '<div class="cb-details" id="cb-details" hidden>' +
        '<div class="cb-cat"><div class="cb-cat-head"><span>Notwendige Cookies</span><span class="cb-badge">Immer aktiv</span></div>' +
          '<dl class="cb-cookie"><dt>Name</dt><dd>eno_cookie_consent</dd><dt>Zweck</dt><dd>Speichert Ihre Auswahl zum Cookie-Hinweis</dd><dt>Dauer</dt><dd>12 Monate</dd><dt>Anbieter</dt><dd>ENO Fußbodenbau (Erstanbieter)</dd></dl></div>' +
        '<p class="cb-note">Statistik- und Marketing-Cookies: werden auf dieser Website nicht eingesetzt.</p>' +
      '</div>' +
      '<div class="cb-actions">' +
        '<button type="button" class="btn btn-line" id="cb-more" aria-expanded="false" aria-controls="cb-details">Details anzeigen</button>' +
        '<button type="button" class="btn btn-solid" id="cb-ok">Verstanden</button>' +
      '</div>';
    document.body.appendChild(banner);
    var more = banner.querySelector('#cb-more');
    var details = banner.querySelector('#cb-details');
    more.addEventListener('click', function () {
      details.hidden = !details.hidden;
      more.setAttribute('aria-expanded', String(!details.hidden));
      more.textContent = details.hidden ? 'Details anzeigen' : 'Details ausblenden';
    });
    banner.querySelector('#cb-ok').addEventListener('click', function () { save(); banner.hidden = true; });
  }
  function open(withDetails) {
    if (!banner) build();
    banner.hidden = false;
    if (withDetails) {
      var details = banner.querySelector('#cb-details'), more = banner.querySelector('#cb-more');
      details.hidden = false; more.setAttribute('aria-expanded', 'true'); more.textContent = 'Details ausblenden';
    }
    banner.querySelector('#cb-ok').focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-cookie-settings]').forEach(function (b) { b.addEventListener('click', function () { open(true); }); });
  if (!read()) { if (!banner) build(); }
})();
