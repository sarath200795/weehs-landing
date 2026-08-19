/* WE EHS landing page — interactions.
   ---------------------------------------------------------------------------
   Sections: 1) config  2) storage/lead capture  3) helpers  4) carousel +
   rolling strip  5) product cards  6) modal engine  7) trial flow (existing vs
   new user)  8) trial session bar  9) logout feedback  10) enquiry form.

   No backend is wired up. Every submission is stored in this browser's
   localStorage and, if CONFIG.endpoint is set, POSTed as JSON to that URL.
   Point CONFIG.endpoint at your API (or a form service) to go live.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  /* ── 1. Config ─────────────────────────────────────────────────────────── */
  var CONFIG = {
    site: 'https://weehs.org',
    endpoint: null,               // e.g. 'https://api.weehs.org/v1/leads'
    trialDays: 14,                // length quoted in the copy — confirm commercially
    salesEmail: 'sales@weehs.org',
    salesPhone: '+91 00000 00000',
    carouselMs: 5000,
    // Flip to true once the weehs.org subdomains resolve and serve HTTPS.
    // false  -> links use each product's current platform URL (hosting)
    // true   -> links use its weehs.org subdomain (domain)
    domainsLive: false,
    // routes every WE EHS app shares, appended to the product's base URL
    routes: { login: '/login', register: '/register-org', join: '/signup' }
  };

  // Base URL for a product, honouring the domainsLive switch.
  function appBase(p) {
    if (!p) return '';
    return (CONFIG.domainsLive ? p.domain : p.hosting) || p.domain || p.hosting || '';
  }

  // Full URL: appLink(product, 'register') -> https://…/register-org
  function appLink(p, route) {
    return appBase(p) + (CONFIG.routes[route] || CONFIG.routes.login);
  }

  function appHost(p) {
    return appBase(p).replace(/^https?:\/\//, '');
  }

  var PRODUCTS = window.WEEHS_PRODUCTS || [];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var INDUSTRIES = ['Manufacturing', 'Construction', 'Oil & gas / energy', 'Chemicals & pharma',
    'Power & utilities', 'Mining & metals', 'Logistics & warehousing', 'Healthcare',
    'Facilities & real estate', 'Government / public sector', 'Other'];
  var SIZES = ['1 – 50', '51 – 250', '251 – 1,000', '1,001 – 5,000', 'More than 5,000'];

  /* ── 2. Storage / lead capture ─────────────────────────────────────────── */
  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase().slice(-6) +
      Math.floor(Math.random() * 900 + 100);
  }

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }

  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  // Reference prefixes shown to the user, one per submission type.
  var REF = { signup: 'TRL', signin: 'SGN', enquiry: 'ENQ', feedback: 'FRQ' };

  // Records a submission locally, then mirrors it to CONFIG.endpoint when set.
  function record(type, data) {
    var entry = { id: uid(REF[type] || 'WEE'), type: type, at: new Date().toISOString(), data: data };
    var key = 'weehs_' + type;
    var list = readStore(key);
    list.push(entry);
    writeStore(key, list);

    if (CONFIG.endpoint) {
      try {
        fetch(CONFIG.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })['catch'](function () { /* kept locally; retry handled by your backend sync */ });
      } catch (e) { /* ignore */ }
    }
    return entry;
  }

  /* ── 3. Helpers ────────────────────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); }

  function fmtDate(d) {
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Validates a form's [required] fields, paints errors, returns data or null.
  function collect(form) {
    var data = {}, firstBad = null;
    $$('.field-error', form).forEach(function (n) { n.remove(); });
    $$('.is-invalid', form).forEach(function (n) { n.classList.remove('is-invalid'); });

    $$('input, select, textarea', form).forEach(function (input) {
      if (!input.name) return;

      // radio groups: only the checked member contributes a value
      if (input.type === 'radio') {
        if (input.checked) data[input.name] = input.value;
        else if (!(input.name in data)) data[input.name] = '';
        return;
      }

      var value = input.type === 'checkbox' ? (input.checked ? (input.value || 'yes') : '') : input.value.trim();
      var problem = '';

      if (input.hasAttribute('required') && !value) {
        problem = input.type === 'checkbox' ? 'Please tick this to continue.' : 'This field is required.';
      } else if (value && input.type === 'email' && !isEmail(value)) {
        problem = 'Enter a valid email address.';
      }

      if (problem) {
        var holder = input.closest('.field') || input.closest('.check') || input;
        holder.classList.add('is-invalid');
        var msg = document.createElement('p');
        msg.className = 'field-error';
        msg.textContent = problem;
        holder.appendChild(msg);
        if (!firstBad) firstBad = input;
      }
      data[input.name] = value;
    });

    if (firstBad) { firstBad.focus(); return null; }
    return data;
  }

  function productOptionsHtml(selectedId) {
    return PRODUCTS.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === selectedId ? ' selected' : '') + '>' +
        esc(p.name) + ' — ' + esc(p.tagline) + '</option>';
    }).join('');
  }

  /* ── 4. Hero carousel + rolling strip ──────────────────────────────────── */
  var allShots = [];
  PRODUCTS.forEach(function (p) {
    p.screens.forEach(function (s) {
      allShots.push({ src: s.src, caption: s.caption, product: p });
    });
  });

  function initCarousel() {
    var stage = $('[data-shot-stage]');
    if (!stage || !allShots.length) return;
    var dotsBox = $('[data-shot-dots]');
    var captionEl = $('[data-shot-caption]');
    var urlEl = $('[data-shot-url]');
    var index = 0, timer = null, paused = false;

    stage.innerHTML = allShots.map(function (s, i) {
      return '<img class="shot' + (i === 0 ? ' is-active' : '') + '" src="' + esc(s.src) +
        '" alt="' + esc(s.caption) + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '" decoding="async">';
    }).join('');

    dotsBox.innerHTML = allShots.map(function (s, i) {
      return '<button type="button" role="tab" class="shot-dot' + (i === 0 ? ' is-active' : '') +
        '" data-i="' + i + '" aria-selected="' + (i === 0) + '" aria-label="' + esc(s.caption) + '"></button>';
    }).join('');

    var imgs = $$('.shot', stage);
    var dots = $$('.shot-dot', dotsBox);

    function show(i) {
      index = (i + allShots.length) % allShots.length;
      imgs.forEach(function (img, n) { img.classList.toggle('is-active', n === index); });
      dots.forEach(function (d, n) {
        d.classList.toggle('is-active', n === index);
        d.setAttribute('aria-selected', String(n === index));
      });
      var shot = allShots[index];
      captionEl.textContent = shot.caption;
      urlEl.textContent = appHost(shot.product);
      $('.shots-frame').style.setProperty('--shot-accent', shot.product.color);
    }

    function tick() { if (!paused) show(index + 1); }
    function restart() {
      clearInterval(timer);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = setInterval(tick, CONFIG.carouselMs);
      }
    }

    $('[data-shot-next]').addEventListener('click', function () { show(index + 1); restart(); });
    $('[data-shot-prev]').addEventListener('click', function () { show(index - 1); restart(); });
    dotsBox.addEventListener('click', function (e) {
      var b = e.target.closest('.shot-dot');
      if (b) { show(+b.dataset.i); restart(); }
    });

    var frame = $('.shots');
    frame.addEventListener('mouseenter', function () { paused = true; });
    frame.addEventListener('mouseleave', function () { paused = false; });
    frame.addEventListener('focusin', function () { paused = true; });
    frame.addEventListener('focusout', function () { paused = false; });
    document.addEventListener('visibilitychange', function () { paused = document.hidden; });

    show(0);
    restart();
  }

  function initStrip() {
    var track = $('[data-strip]');
    if (!track || !allShots.length) return;
    // Duplicated once so the CSS marquee can loop seamlessly.
    var html = allShots.concat(allShots).map(function (s, i) {
      return '<button class="thumb" type="button" data-thumb-product="' + esc(s.product.id) + '"' +
        (i >= allShots.length ? ' aria-hidden="true" tabindex="-1"' : '') +
        ' title="' + esc(s.caption) + '">' +
        '<img src="' + esc(s.src) + '" alt="' + (i >= allShots.length ? '' : esc(s.caption)) + '" loading="lazy" decoding="async">' +
        '<span style="--accent:' + esc(s.product.color) + '">' + esc(s.caption) + '</span></button>';
    }).join('');
    track.innerHTML = html;

    track.addEventListener('click', function (e) {
      var b = e.target.closest('[data-thumb-product]');
      if (b) openTrial(b.dataset.thumbProduct);
    });
  }

  /* ── 5. Product cards ──────────────────────────────────────────────────── */
  function initProducts() {
    var grid = $('[data-product-grid]');
    if (!grid) return;

    grid.insertAdjacentHTML('beforeend', PRODUCTS.map(function (p) {
      return '' +
        '<article class="product-card' + (p.featured ? ' is-featured' : '') + '" style="--accent:' + esc(p.color) + '">' +
          (p.featured ? '<span class="ribbon">All modules</span>' : '') +
          '<div class="product-head">' +
            '<span class="product-mark" aria-hidden="true">' + esc(p.mark) + '</span>' +
            '<div><h3>' + esc(p.name) + '</h3><p class="product-tagline">' + esc(p.tagline) + '</p></div>' +
          '</div>' +
          '<p class="product-summary">' + esc(p.summary) + '</p>' +
          '<ul class="product-features">' +
            p.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') +
          '</ul>' +
          '<p class="product-ideal"><span>Built for</span> ' + esc(p.idealFor) + '</p>' +
          '<div class="product-actions">' +
            '<button class="btn btn-primary" type="button" data-open-trial="' + esc(p.id) + '">Start free trial</button>' +
            '<button class="btn btn-outline" type="button" data-open-enquiry="' + esc(p.id) + '">Enquire</button>' +
          '</div>' +
          '<a class="product-peek" href="' + esc(appLink(p, 'login')) + '" target="_blank" rel="noopener">' +
            'Open the live app &#8599; <span class="product-host">' + esc(appHost(p)) + '</span>' +
          '</a>' +
        '</article>';
    }).join(''));

    var footer = $('[data-footer-products]');
    if (footer) {
      footer.innerHTML = PRODUCTS.map(function (p) {
        return '<li><button type="button" class="linkish" data-open-trial="' + esc(p.id) + '">' + esc(p.name) + '</button></li>';
      }).join('');
    }

    $$('[data-product-options]').forEach(function (sel) {
      sel.innerHTML = '<option value="">Select a product…</option>' + productOptionsHtml(null);
    });
  }

  /* ── 6. Modal engine ───────────────────────────────────────────────────── */
  var modal = $('[data-modal]');
  var modalBody = $('[data-modal-body]');
  var lastFocus = null;

  function openModal(html, onMount) {
    if (modal.hidden) lastFocus = document.activeElement;
    // lets a step tear down its own timers before its markup is replaced
    modal.dispatchEvent(new CustomEvent('modal:closed'));
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    if (onMount) onMount(modalBody);
    var focusTarget = $('[data-autofocus]', modalBody) || $('input, select, textarea, button', modalBody);
    if (focusTarget) focusTarget.focus();
    modalBody.parentNode.scrollTop = 0;
  }

  function closeModal() {
    modal.dispatchEvent(new CustomEvent('modal:closed'));
    modal.hidden = true;
    modalBody.innerHTML = '';
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
    if (e.key === 'Tab' && !modal.hidden) {
      var focusables = $$('a[href], button:not([disabled]), input, select, textarea', modal)
        .filter(function (n) { return n.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function modalHead(p, title, sub) {
    return '' +
      '<div class="modal-head"' + (p ? ' style="--accent:' + esc(p.color) + '"' : '') + '>' +
        (p ? '<span class="product-mark" aria-hidden="true">' + esc(p.mark) + '</span>' : '') +
        '<div>' +
          (p ? '<p class="modal-kicker">' + esc(p.name) + ' · ' + esc(p.tagline) + '</p>' : '') +
          '<h2 id="modal-title" class="modal-title">' + esc(title) + '</h2>' +
          (sub ? '<p class="modal-sub">' + sub + '</p>' : '') +
        '</div>' +
      '</div>';
  }

  /* ── 7. Trial flow ─────────────────────────────────────────────────────── */

  // Step 1 — existing user or new user?
  function openTrial(productId) {
    var p = byId[productId] || PRODUCTS[0];
    var shots = p.screens.map(function (s, i) {
      return '<img class="mini' + (i === 0 ? ' is-active' : '') + '" src="' + esc(s.src) + '" alt="' + esc(s.caption) + '" loading="lazy">';
    }).join('');

    openModal(
      modalHead(p, 'Start your free trial', 'Full access for <strong>' + CONFIG.trialDays + ' days</strong>. No card required.') +
      '<div class="modal-shots" style="--accent:' + esc(p.color) + '">' + shots +
        '<div class="mini-dots">' + p.screens.map(function (s, i) {
          return '<button type="button" class="mini-dot' + (i === 0 ? ' is-active' : '') + '" data-mini="' + i +
            '" aria-label="' + esc(s.caption) + '"></button>';
        }).join('') + '</div>' +
      '</div>' +
      '<p class="choice-q">First, tell us where you stand:</p>' +
      '<div class="choice-grid">' +
        '<button class="choice" type="button" data-choice="existing" data-autofocus>' +
          '<span class="choice-icon" aria-hidden="true">↩</span>' +
          '<strong>I already use WE EHS</strong>' +
          '<span>Go to the ' + esc(p.name) + ' sign-in, or ask to join your organisation.</span>' +
        '</button>' +
        '<button class="choice choice-primary" type="button" data-choice="new">' +
          '<span class="choice-icon" aria-hidden="true">＋</span>' +
          '<strong>I am new to WE EHS</strong>' +
          '<span>Share your organisation details — then register your workspace in ' + esc(p.name) + '.</span>' +
        '</button>' +
      '</div>' +
      '<p class="modal-foot">Prefer to talk first? <button type="button" class="linkish" data-goto-enquiry="' + esc(p.id) + '">Send an enquiry instead</button></p>',
      function (root) {
        // small screenshot rotator inside the modal
        var minis = $$('.mini', root), dots = $$('.mini-dot', root), i = 0, t = null;
        function show(n) {
          i = (n + minis.length) % minis.length;
          minis.forEach(function (m, k) { m.classList.toggle('is-active', k === i); });
          dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
        }
        if (minis.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          t = setInterval(function () { show(i + 1); }, 3200);
          modal.addEventListener('modal:closed', function () { clearInterval(t); }, { once: true });
        }
        root.addEventListener('click', function (e) {
          var d = e.target.closest('.mini-dot');
          if (d) { clearInterval(t); show(+d.dataset.mini); }
        });

        $('[data-choice="existing"]', root).addEventListener('click', function () { stepSignIn(p); });
        $('[data-choice="new"]', root).addEventListener('click', function () { stepSignUp(p); });
        var enq = $('[data-goto-enquiry]', root);
        if (enq) enq.addEventListener('click', function () { openEnquiry(p.id); });
      }
    );
  }

  // Step 2a — existing user: straight to the app's own sign-in
  function stepSignIn(p) {
    openModal(
      modalHead(p, 'Sign in to your workspace', p
        ? 'Pick up where you left off in <strong>' + esc(p.name) + '</strong>.'
        : 'Choose the module you want to open.') +
      '<form class="form" data-signin-form novalidate>' +
        '<div class="grid-2">' +
          '<div class="field">' +
            '<label for="si-email">Work email *</label>' +
            '<input id="si-email" name="email" type="email" autocomplete="email" required data-autofocus placeholder="you@company.com">' +
          '</div>' +
          '<div class="field">' +
            '<label for="si-product">Module to open *</label>' +
            '<select id="si-product" name="product" required>' + productOptionsHtml(p ? p.id : null) + '</select>' +
          '</div>' +
        '</div>' +
        '<p class="hint">You enter your password on the application itself — never on this page.</p>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">Continue to sign in</button>' +
        '<p class="modal-foot">Not registered yet? <button type="button" class="linkish" data-to-signup>Create an organisation account</button></p>' +
      '</form>',
      function (root) {
        $('[data-to-signup]', root).addEventListener('click', function () { stepSignUp(p); });
        $('[data-signin-form]', root).addEventListener('submit', function (e) {
          e.preventDefault();
          var data = collect(this);
          if (!data) return;
          var product = byId[data.product];
          record('signin', { email: data.email, product: product.id });
          startSession({
            product: product,
            org: data.email.split('@')[1] || 'Your organisation',
            email: data.email,
            isNew: false
          });
          stepSignedIn(product, data);
        });
      }
    );
  }

  function stepSignedIn(p, data) {
    openModal(
      modalHead(p, 'Opening ' + esc(p.name), 'Sign in with your work email on the ' + esc(p.name) + ' portal.') +
      '<div class="success-box">' +
        '<p class="success-line"><span>Application</span><code>' + esc(appLink(p, 'login')) + '</code></p>' +
        '<p class="success-line"><span>Signing in as</span>' + esc(data.email) + '</p>' +
      '</div>' +
      '<p class="hint">New to your company workspace but your colleagues already use it? Use <strong>Join your organisation</strong> — an admin approves your request.</p>' +
      '<div class="modal-actions">' +
        '<a class="btn btn-primary btn-lg" href="' + esc(appLink(p, 'login')) + '" target="_blank" rel="noopener" data-autofocus>Sign in to ' + esc(p.name) + ' &#8599;</a>' +
        '<a class="btn btn-outline btn-lg" href="' + esc(appLink(p, 'join')) + '" target="_blank" rel="noopener">Join your organisation</a>' +
      '</div>'
    );
  }

  // Step 2b — new user: organisation details
  function stepSignUp(p) {
    openModal(
      modalHead(p, 'Create your organisation account',
        'Takes about a minute. We record your details, then hand you to <strong>' + esc(p.name) + '</strong> to finish registering.') +
      '<form class="form" data-signup-form novalidate>' +
        '<fieldset class="fieldset"><legend>Organisation</legend>' +
          '<div class="grid-2">' +
            '<div class="field"><label for="su-org">Organisation name *</label>' +
              '<input id="su-org" name="organisation" type="text" autocomplete="organization" required data-autofocus></div>' +
            '<div class="field"><label for="su-industry">Industry *</label>' +
              '<select id="su-industry" name="industry" required><option value="">Select…</option>' +
              INDUSTRIES.map(function (i) { return '<option>' + esc(i) + '</option>'; }).join('') + '</select></div>' +
          '</div>' +
          '<div class="grid-3">' +
            '<div class="field"><label for="su-size">Employees *</label>' +
              '<select id="su-size" name="employees" required><option value="">Select…</option>' +
              SIZES.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label for="su-sites">Number of sites *</label>' +
              '<input id="su-sites" name="sites" type="number" min="1" step="1" value="1" required></div>' +
            '<div class="field"><label for="su-country">Country *</label>' +
              '<input id="su-country" name="country" type="text" autocomplete="country-name" required></div>' +
          '</div>' +
        '</fieldset>' +

        '<fieldset class="fieldset"><legend>Primary contact — this becomes the admin login</legend>' +
          '<div class="grid-2">' +
            '<div class="field"><label for="su-name">Full name *</label>' +
              '<input id="su-name" name="contactName" type="text" autocomplete="name" required></div>' +
            '<div class="field"><label for="su-role">Job title *</label>' +
              '<input id="su-role" name="role" type="text" placeholder="e.g. EHS Manager" required></div>' +
          '</div>' +
          '<div class="grid-2">' +
            '<div class="field"><label for="su-email">Work email *</label>' +
              '<input id="su-email" name="email" type="email" autocomplete="email" required placeholder="you@company.com"></div>' +
            '<div class="field"><label for="su-phone">Phone *</label>' +
              '<input id="su-phone" name="phone" type="tel" autocomplete="tel" required></div>' +
          '</div>' +
          '<p class="hint">You will set your own password from the activation email — never on this page.</p>' +
        '</fieldset>' +

        '<fieldset class="fieldset"><legend>Trial setup</legend>' +
          '<div class="grid-2">' +
            '<div class="field"><label for="su-product">Product to trial *</label>' +
              '<select id="su-product" name="product" required>' + productOptionsHtml(p ? p.id : null) + '</select></div>' +
            '<div class="field"><label for="su-data">Start with</label>' +
              '<select id="su-data" name="startingData">' +
                '<option>Sample data I can explore right away</option>' +
                '<option>Empty workspace — I will import my own</option>' +
                '<option>Help me import my existing register</option>' +
              '</select></div>' +
          '</div>' +
          '<div class="field"><label for="su-needs">Anything specific you need? (optional)</label>' +
            '<textarea id="su-needs" name="requirements" rows="3" placeholder="e.g. Form B statutory report, SAP asset sync, Tamil language on the mobile app"></textarea></div>' +
        '</fieldset>' +

        '<label class="check"><input type="checkbox" name="consent" value="yes" required> I agree to WE EHS creating a trial account and contacting me about it.</label>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">Create account &amp; start trial</button>' +
        '<p class="modal-foot">Already have an account? <button type="button" class="linkish" data-to-signin>Sign in instead</button></p>' +
      '</form>',
      function (root) {
        $('[data-to-signin]', root).addEventListener('click', function () { stepSignIn(p); });
        $('[data-signup-form]', root).addEventListener('submit', function (e) {
          e.preventDefault();
          var data = collect(this);
          if (!data) return;
          var product = byId[data.product];
          var entry = record('signup', data);
          startSession({ product: product, org: data.organisation, email: data.email, isNew: true });
          stepAccountCreated(product, data, entry.id);
        });
      }
    );
  }

  function stepAccountCreated(p, data, ref) {
    var ends = new Date(Date.now() + CONFIG.trialDays * 864e5);
    openModal(
      modalHead(p, 'Last step — create your workspace',
        'We have your details for <strong>' + esc(data.organisation) + '</strong>. Finish in ' + esc(p.name) +
        ': the first account you create there becomes the organisation admin.') +
      '<div class="success-box">' +
        '<p class="success-line"><span>Register at</span><code>' + esc(appLink(p, 'register')) + '</code></p>' +
        '<p class="success-line"><span>Admin</span>' + esc(data.contactName) + ' · ' + esc(data.email) + '</p>' +
        '<p class="success-line"><span>Trial ends</span>' + esc(fmtDate(ends)) + '</p>' +
        '<p class="success-line"><span>Reference</span><code>' + esc(ref) + '</code></p>' +
      '</div>' +
      (data.requirements
        ? '<p class="hint hint-ok">Noted your requirement: “' + esc(data.requirements) + '”. Our product team will come back to you on it.</p>'
        : '') +
      '<p class="hint">You will set your own password on the ' + esc(p.name) + ' registration page. Colleagues join later with <strong>Join your organisation</strong> and you approve them.</p>' +
      '<div class="modal-actions">' +
        '<a class="btn btn-primary btn-lg" href="' + esc(appLink(p, 'register')) + '" target="_blank" rel="noopener" data-autofocus>Register organisation in ' + esc(p.name) + ' &#8599;</a>' +
        '<button class="btn btn-outline btn-lg" type="button" data-modal-close>Explore other products</button>' +
      '</div>'
    );
  }

  /* ── 8. Trial session bar ──────────────────────────────────────────────── */
  var SESSION_KEY = 'weehs_session';
  var session = null;

  function startSession(s) {
    session = {
      productId: s.product.id,
      productName: s.product.name,
      color: s.product.color,
      app: appBase(s.product),
      org: s.org,
      email: s.email,
      isNew: !!s.isNew,
      startedAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + CONFIG.trialDays * 864e5).toISOString()
    };
    writeStore(SESSION_KEY, session);
    renderSession();
  }

  function endSession() {
    session = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    renderSession();
  }

  function renderSession() {
    var bar = $('[data-session-bar]');
    if (!bar) return;
    if (!session) { bar.hidden = true; document.body.classList.remove('has-session'); return; }
    var left = Math.max(0, Math.ceil((new Date(session.endsAt) - Date.now()) / 864e5));
    $('[data-session-product]').textContent = session.productName;
    $('[data-session-org]').textContent = session.org;
    $('[data-session-days]').textContent = left;
    bar.style.setProperty('--accent', session.color);
    bar.hidden = false;
    document.body.classList.add('has-session');
  }

  function loadSession() {
    try {
      var raw = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (raw && raw.productId) { session = raw; renderSession(); }
    } catch (e) { /* ignore */ }
  }

  /* ── 9. Log-out feedback ───────────────────────────────────────────────── */
  function openFeedback() {
    var p = session ? byId[session.productId] : null;
    var stars = [1, 2, 3, 4, 5].map(function (n) {
      return '<label class="star"><input type="radio" name="rating" value="' + n + '"' + (n === 4 ? ' checked' : '') +
        '><span>' + n + '</span></label>';
    }).join('');

    openModal(
      modalHead(p, 'Before you go — how did it go?',
        'Two questions, thirty seconds. Feature requests go straight to the product team.') +
      '<form class="form" data-feedback-form novalidate>' +
        '<div class="field">' +
          '<span class="label">How useful was ' + esc(p ? p.name : 'the product') + ' for your work? *</span>' +
          '<div class="stars" role="radiogroup" aria-label="Rating out of 5">' + stars + '</div>' +
          '<p class="scale"><span>1 — not useful</span><span>5 — exactly what we need</span></p>' +
        '</div>' +
        '<div class="field">' +
          '<label for="fb-worked">What worked well?</label>' +
          '<textarea id="fb-worked" name="worked" rows="3" placeholder="e.g. QR scanning on the inspection round was quick"></textarea>' +
        '</div>' +
        '<div class="field">' +
          '<label for="fb-missing">What feature do you need that is missing? *</label>' +
          '<textarea id="fb-missing" name="missing" rows="4" required data-autofocus placeholder="Describe the feature, the workflow it fits into, and how often you would use it."></textarea>' +
        '</div>' +
        '<div class="grid-2">' +
          '<div class="field">' +
            '<label for="fb-priority">How important is it? *</label>' +
            '<select id="fb-priority" name="priority" required>' +
              '<option>Nice to have</option><option selected>Important</option>' +
              '<option>Blocker — we cannot buy without it</option>' +
            '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label for="fb-email">Email for the reply</label>' +
            '<input id="fb-email" name="email" type="email" value="' + esc(session ? session.email : '') + '">' +
          '</div>' +
        '</div>' +
        '<label class="check"><input type="checkbox" name="contactBack" value="yes" checked> Contact me when this is picked up.</label>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-primary btn-lg" type="submit">Send feedback &amp; log out</button>' +
          '<button class="btn btn-ghost btn-lg" type="button" data-skip-feedback>Log out without feedback</button>' +
        '</div>' +
      '</form>',
      function (root) {
        $('[data-skip-feedback]', root).addEventListener('click', function () {
          record('feedback', { skipped: true, product: session ? session.productId : null });
          endSession();
          closeModal();
        });
        $('[data-feedback-form]', root).addEventListener('submit', function (e) {
          e.preventDefault();
          var data = collect(this);
          if (!data) return;
          data.product = session ? session.productId : null;
          data.organisation = session ? session.org : null;
          var entry = record('feedback', data);
          var name = p ? p.name : 'WE EHS';
          endSession();
          openModal(
            modalHead(p, 'Thank you — logged and routed',
              'Your request is on the ' + esc(name) + ' backlog for review in the next sprint.') +
            '<div class="success-box">' +
              '<p class="success-line"><span>Reference</span><code>' + esc(entry.id) + '</code></p>' +
              '<p class="success-line"><span>Priority</span>' + esc(data.priority) + '</p>' +
              (data.contactBack ? '<p class="success-line"><span>We will reply to</span>' + esc(data.email || CONFIG.salesEmail) + '</p>' : '') +
            '</div>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-primary btn-lg" type="button" data-modal-close data-autofocus>Back to site</button>' +
              '<button class="btn btn-outline btn-lg" type="button" data-restart-trial>Trial another product</button>' +
            '</div>',
            function (r2) {
              $('[data-restart-trial]', r2).addEventListener('click', function () {
                closeModal();
                var el = $('#products');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              });
            }
          );
        });
      }
    );
  }

  /* ── 10. Enquiry ───────────────────────────────────────────────────────── */
  function openEnquiry(productId) {
    var p = byId[productId] || null;
    openModal(
      modalHead(p, 'Enquire about ' + (p ? p.name : 'WE EHS'),
        'Tell us what you are trying to solve — we reply within one business day.') +
      '<form class="form" data-enquiry-modal novalidate>' +
        '<div class="grid-2">' +
          '<div class="field"><label for="em-name">Your name *</label>' +
            '<input id="em-name" name="name" type="text" autocomplete="name" required data-autofocus></div>' +
          '<div class="field"><label for="em-org">Organisation *</label>' +
            '<input id="em-org" name="organisation" type="text" autocomplete="organization" required></div>' +
        '</div>' +
        '<div class="grid-2">' +
          '<div class="field"><label for="em-email">Work email *</label>' +
            '<input id="em-email" name="email" type="email" autocomplete="email" required></div>' +
          '<div class="field"><label for="em-phone">Phone</label>' +
            '<input id="em-phone" name="phone" type="tel" autocomplete="tel"></div>' +
        '</div>' +
        '<div class="field"><label for="em-product">Product *</label>' +
          '<select id="em-product" name="product" required>' + productOptionsHtml(p ? p.id : null) + '</select></div>' +
        '<div class="field"><label for="em-message">Your question *</label>' +
          '<textarea id="em-message" name="message" rows="4" required></textarea></div>' +
        '<label class="check"><input type="checkbox" name="consent" value="yes" required> WE EHS may contact me about this enquiry.</label>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">Send enquiry</button>' +
      '</form>',
      function (root) {
        $('[data-enquiry-modal]', root).addEventListener('submit', function (e) {
          e.preventDefault();
          var data = collect(this);
          if (!data) return;
          var entry = record('enquiry', data);
          openModal(
            modalHead(byId[data.product] || p, 'Enquiry received',
              'Reference <strong>' + esc(entry.id) + '</strong>. We will reply to ' + esc(data.email) + ' within one business day.') +
            '<p class="hint">Need it sooner? Call <a href="tel:' + esc(CONFIG.salesPhone.replace(/\s/g, '')) + '">' + esc(CONFIG.salesPhone) + '</a>.</p>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-primary btn-lg" type="button" data-modal-close data-autofocus>Close</button>' +
              '<button class="btn btn-outline btn-lg" type="button" data-open-trial="' + esc(data.product) + '">Start the trial anyway</button>' +
            '</div>'
          );
        });
      }
    );
  }

  function initPageEnquiryForm() {
    var form = $('[data-enquiry-form]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = $('[data-form-status]', form);
      var data = collect(form);
      if (!data) { status.textContent = 'Please correct the highlighted fields.'; status.className = 'form-status is-error'; return; }
      var entry = record('enquiry', data);
      form.reset();
      status.innerHTML = 'Thanks — enquiry <strong>' + esc(entry.id) + '</strong> received. We will reply to ' + esc(data.email) + ' within one business day.';
      status.className = 'form-status is-ok';
    });
  }

  /* ── Wiring ────────────────────────────────────────────────────────────── */
  function initGlobalClicks() {
    document.addEventListener('click', function (e) {
      var trial = e.target.closest('[data-open-trial]');
      if (trial) { e.preventDefault(); openTrial(trial.getAttribute('data-open-trial')); return; }

      var enq = e.target.closest('[data-open-enquiry]');
      if (enq) { e.preventDefault(); openEnquiry(enq.getAttribute('data-open-enquiry')); return; }

      if (e.target.closest('[data-open-signin]')) { e.preventDefault(); stepSignIn(session ? byId[session.productId] : null); return; }
      if (e.target.closest('[data-session-logout]')) { e.preventDefault(); openFeedback(); return; }

      var openWs = e.target.closest('[data-session-open]');
      if (openWs && session) {
        var wsProduct = byId[session.productId] || { hosting: session.app, domain: session.app };
        window.open(appLink(wsProduct, 'login'), '_blank', 'noopener');
        return;
      }

      var navLink = e.target.closest('.site-nav a');
      if (navLink) document.body.classList.remove('nav-open');
    });

    var toggle = $('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
  }

  function initStatics() {
    $$('[data-trial-days]').forEach(function (n) { n.textContent = CONFIG.trialDays; });
    var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
    var em = $('[data-sales-email]'); if (em) { em.textContent = CONFIG.salesEmail; em.href = 'mailto:' + CONFIG.salesEmail; }
    var ph = $('[data-sales-phone]'); if (ph) { ph.textContent = CONFIG.salesPhone; ph.href = 'tel:' + CONFIG.salesPhone.replace(/\s/g, ''); }
  }

  // Console helper for whoever is collecting leads before a backend exists.
  window.WEEHS = {
    config: CONFIG,
    leads: function () {
      return {
        signups: readStore('weehs_signup'),
        signins: readStore('weehs_signin'),
        enquiries: readStore('weehs_enquiry'),
        feedback: readStore('weehs_feedback')
      };
    },
    exportLeads: function () {
      var blob = new Blob([JSON.stringify(window.WEEHS.leads(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'weehs-leads.json';
      a.click();
      URL.revokeObjectURL(a.href);
    },
    endTrialSession: endSession
  };

  document.addEventListener('DOMContentLoaded', function () {
    initStatics();
    initProducts();
    initCarousel();
    initStrip();
    initPageEnquiryForm();
    initGlobalClicks();
    loadSession();
  });
})();
