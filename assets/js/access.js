/* WE EHS — access control console.
   ---------------------------------------------------------------------------
   Sections: 1) config  2) store  3) day maths  4) helpers  5) stats  6) table
   7) access drawer  8) account form  9) import / export  10) gate  11) boot.

   The record of "who may open which app, and which modules inside it" lives in
   localStorage under weehs_accounts, next to the leads app.js already keeps.
   Nothing is sent anywhere. Export the JSON and hand it to the API once each
   app can read permissions server-side — this page decides intent, not access.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  /* ── 1. Config ─────────────────────────────────────────────────────────── */
  var CONFIG = {
    // Change this before you share the page. It hides the screen from a casual
    // visitor; it is not a security control — the value ships in this file.
    passcode: 'weehs-admin',
    trialDays: 14,          // matches CONFIG.trialDays in app.js
    expiringSoonDays: 3     // "expiring" band in the stat row
  };

  var PRODUCTS = window.WEEHS_PRODUCTS || [];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var STORE_KEY = 'weehs_accounts';
  var GATE_KEY = 'weehs_access_open';
  var SIGNUP_KEY = 'weehs_signup';

  var INDUSTRIES = ['Manufacturing', 'Construction', 'Oil & gas / energy', 'Chemicals & pharma',
    'Power & utilities', 'Mining & metals', 'Logistics & warehousing', 'Healthcare',
    'Facilities & real estate', 'Government / public sector', 'Other'];

  /* ── 2. Store ──────────────────────────────────────────────────────────── */
  var accounts = [];

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }

  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function load() {
    accounts = readStore(STORE_KEY).map(normalise);
  }

  function save() {
    if (!writeStore(STORE_KEY, accounts)) {
      toast('Could not save — this browser is blocking storage.', true);
    }
  }

  function uid() {
    return 'ACC-' + Date.now().toString(36).toUpperCase().slice(-6) +
      Math.floor(Math.random() * 900 + 100);
  }

  // Fills in anything an older or imported record is missing, and drops access
  // entries for products that no longer exist in the catalogue.
  function normalise(a) {
    var out = {
      id: a.id || uid(),
      name: a.name || '',
      email: a.email || '',
      org: a.org || '',
      role: a.role || '',
      phone: a.phone || '',
      industry: a.industry || '',
      createdAt: a.createdAt || new Date().toISOString(),
      plan: a.plan === 'active' ? 'active' : 'trial',
      trialDays: Number(a.trialDays) > 0 ? Number(a.trialDays) : CONFIG.trialDays,
      suspended: !!a.suspended,
      note: a.note || '',
      source: a.source || 'manual',
      ref: a.ref || '',
      access: {}
    };
    var given = a.access || {};
    PRODUCTS.forEach(function (p) {
      var g = given[p.id] || {};
      var valid = (p.modules || []).map(function (m) { return m.id; });
      var picked = (g.modules || []).filter(function (id) { return valid.indexOf(id) > -1; });
      out.access[p.id] = { enabled: !!g.enabled, modules: picked };
    });
    return out;
  }

  function blankAccess(grantProductId) {
    var access = {};
    PRODUCTS.forEach(function (p) {
      var on = p.id === grantProductId;
      access[p.id] = {
        enabled: on,
        modules: on ? (p.modules || []).map(function (m) { return m.id; }) : []
      };
    });
    return access;
  }

  function find(id) {
    for (var i = 0; i < accounts.length; i++) if (accounts[i].id === id) return accounts[i];
    return null;
  }

  /* ── 3. Day maths ──────────────────────────────────────────────────────── */
  // Whole days, counted on calendar dates so "Day 1" is the day of creation and
  // it ticks over at midnight rather than at the hour they signed up.
  function midnight(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  }

  function daysSince(iso) {
    var then = midnight(new Date(iso));
    if (isNaN(then)) return 0;
    return Math.max(0, Math.round((midnight(new Date()) - then) / 864e5));
  }

  // Day 1 = the day the account was created.
  function dayNumber(a) { return daysSince(a.createdAt) + 1; }

  function trialEnds(a) {
    var start = new Date(a.createdAt);
    return new Date(midnight(start) + a.trialDays * 864e5);
  }

  function trialDaysLeft(a) {
    return a.trialDays - daysSince(a.createdAt);
  }

  function statusOf(a) {
    if (a.suspended) return 'suspended';
    if (a.plan === 'active') return 'active';
    return trialDaysLeft(a) > 0 ? 'trial' : 'expired';
  }

  var STATUS_LABEL = {
    trial: 'Trial', active: 'Active', suspended: 'Suspended', expired: 'Expired'
  };

  /* ── 4. Helpers ────────────────────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); }

  function fmtDate(d) {
    d = (d instanceof Date) ? d : new Date(d);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  function grantedApps(a) {
    return PRODUCTS.filter(function (p) { return a.access[p.id] && a.access[p.id].enabled; });
  }

  function moduleCount(a, p) {
    var g = a.access[p.id];
    return g && g.enabled ? g.modules.length : 0;
  }

  var toastTimer = null;
  function toast(msg, bad) {
    var el = $('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('is-bad', !!bad);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3600);
  }

  // Same validation contract as app.js: paint errors, return data or null.
  function collect(form) {
    var data = {}, firstBad = null;
    $$('.field-error', form).forEach(function (n) { n.remove(); });
    $$('.is-invalid', form).forEach(function (n) { n.classList.remove('is-invalid'); });

    $$('input, select, textarea', form).forEach(function (input) {
      if (!input.name || input.type === 'checkbox') return;
      var value = input.value.trim();
      var problem = '';
      if (input.hasAttribute('required') && !value) problem = 'This field is required.';
      else if (value && input.type === 'email' && !isEmail(value)) problem = 'Enter a valid email address.';

      if (problem) {
        var holder = input.closest('.field') || input;
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

  /* ── Modal / drawer engines ────────────────────────────────────────────── */
  var lastFocus = null;

  function openModal(html, onMount) {
    var modal = $('[data-modal]'), body = $('[data-modal-body]');
    lastFocus = document.activeElement;
    body.innerHTML = html;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    if (onMount) onMount(body);
    var focusMe = $('[data-autofocus]', body) || $('button, input, select', body);
    if (focusMe) focusMe.focus();
  }

  function closeModal() {
    var modal = $('[data-modal]');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    $('[data-modal-body]').innerHTML = '';
    if (!isDrawerOpen()) document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isDrawerOpen() {
    var d = $('[data-drawer]');
    return d && !d.hidden;
  }

  function openDrawer(html, onMount) {
    var drawer = $('[data-drawer]'), body = $('[data-drawer-body]');
    lastFocus = document.activeElement;
    body.innerHTML = html;
    drawer.hidden = false;
    document.body.classList.add('no-scroll');
    if (onMount) onMount(body);
    var focusMe = $('[data-autofocus]', body) || $('button, input', body);
    if (focusMe) focusMe.focus();
  }

  function closeDrawer() {
    var drawer = $('[data-drawer]');
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    $('[data-drawer-body]').innerHTML = '';
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ── 5. Stats ──────────────────────────────────────────────────────────── */
  function renderStats() {
    var s = { total: accounts.length, trial: 0, active: 0, suspended: 0, expired: 0, expiring: 0 };
    accounts.forEach(function (a) {
      var st = statusOf(a);
      s[st]++;
      if (st === 'trial' && trialDaysLeft(a) <= CONFIG.expiringSoonDays) s.expiring++;
    });
    Object.keys(s).forEach(function (k) {
      var el = $('[data-stat="' + k + '"]');
      if (el) el.textContent = s[k];
    });
  }

  /* ── 6. Table ──────────────────────────────────────────────────────────── */
  var view = { q: '', app: '', status: '', sort: 'age-desc' };

  function visibleAccounts() {
    var q = view.q.toLowerCase();
    var list = accounts.filter(function (a) {
      if (q && (a.name + ' ' + a.email + ' ' + a.org).toLowerCase().indexOf(q) < 0) return false;
      if (view.app && !(a.access[view.app] && a.access[view.app].enabled)) return false;
      if (view.status && statusOf(a) !== view.status) return false;
      return true;
    });

    var by = {
      'age-desc': function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); },
      'age-asc': function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); },
      'name': function (a, b) { return a.name.localeCompare(b.name); },
      'org': function (a, b) { return a.org.localeCompare(b.org); },
      'apps': function (a, b) { return grantedApps(b).length - grantedApps(a).length; }
    };
    return list.sort(by[view.sort] || by['age-desc']);
  }

  function appChipsHtml(a) {
    var apps = grantedApps(a);
    if (!apps.length) return '<span class="chip chip-none">No access</span>';
    return apps.map(function (p) {
      var total = (p.modules || []).length;
      var n = moduleCount(a, p);
      var all = n === total;
      return '<span class="chip" style="--chip:' + esc(p.color) + '" title="' +
        esc(p.name + ' — ' + n + ' of ' + total + ' modules') + '">' +
        '<span class="chip-mark">' + esc(p.mark) + '</span>' +
        esc(p.name) +
        '<span class="chip-count' + (all ? ' is-all' : '') + '">' + n + '/' + total + '</span>' +
        '</span>';
    }).join('');
  }

  function dayCellHtml(a) {
    var n = dayNumber(a);
    var st = statusOf(a);
    var sub;
    if (st === 'trial') sub = plural(trialDaysLeft(a), 'day') + ' of trial left';
    else if (st === 'expired') sub = 'trial ended ' + fmtDate(trialEnds(a));
    else if (st === 'suspended') sub = 'suspended';
    else sub = plural(daysSince(a.createdAt), 'day') + ' as a customer';
    return '<div class="daycell"><strong>' + n + '</strong><span>' + esc(sub) + '</span></div>';
  }

  function rowHtml(a) {
    var st = statusOf(a);
    var extra = st === 'trial'
      ? ' · day ' + Math.min(dayNumber(a), a.trialDays) + ' of ' + a.trialDays
      : '';
    return '<tr data-row="' + esc(a.id) + '">' +
      '<td class="col-who">' +
        '<strong>' + esc(a.name || 'Unnamed') + '</strong>' +
        '<span class="who-org">' + esc(a.org || '—') + '</span>' +
        '<span class="who-mail">' + esc(a.email || '—') + '</span>' +
      '</td>' +
      '<td class="col-created">' + esc(fmtDate(a.createdAt)) +
        '<span class="who-mail">' + esc(a.source === 'signup' ? 'from trial sign-up' : 'added manually') + '</span>' +
      '</td>' +
      '<td class="col-day">' + dayCellHtml(a) + '</td>' +
      '<td class="col-status">' +
        '<span class="pill pill-' + st + '">' + STATUS_LABEL[st] + '</span>' +
        '<span class="who-mail">' + esc(a.plan === 'active' ? 'Paid plan' : 'Trial plan') + esc(extra) + '</span>' +
      '</td>' +
      '<td class="col-apps"><div class="chips">' + appChipsHtml(a) + '</div></td>' +
      '<td class="col-act">' +
        '<button class="btn btn-primary btn-sm" type="button" data-manage="' + esc(a.id) + '">Manage access</button>' +
        '<button class="btn btn-outline btn-sm" type="button" data-edit="' + esc(a.id) + '">Edit</button>' +
        '<button class="btn btn-outline btn-sm" type="button" data-toggle-suspend="' + esc(a.id) + '">' +
          (a.suspended ? 'Resume' : 'Suspend') + '</button>' +
        '<button class="btn btn-outline btn-sm btn-danger" type="button" data-delete="' + esc(a.id) + '">Delete</button>' +
      '</td>' +
    '</tr>';
  }

  function render() {
    var list = visibleAccounts();
    var body = $('[data-rows]');
    body.innerHTML = list.map(rowHtml).join('');

    $('[data-count]').textContent = !accounts.length ? ''
      : list.length === accounts.length
        ? plural(accounts.length, 'account') + '.'
        : 'Showing ' + list.length + ' of ' + plural(accounts.length, 'account') + '.';
    $('[data-empty]').hidden = accounts.length > 0;
    $('.table-wrap').hidden = accounts.length === 0;
    renderStats();
  }

  /* ── 7. Access drawer ──────────────────────────────────────────────────── */
  function appBlockHtml(p, granted) {
    var mods = p.modules || [];
    var on = !!granted.enabled;
    return '<section class="app-block' + (on ? ' is-on' : '') + '" data-app="' + esc(p.id) + '"' +
        ' style="--app:' + esc(p.color) + '">' +
      '<header class="app-head">' +
        '<span class="app-mark" aria-hidden="true">' + esc(p.mark) + '</span>' +
        '<span class="app-name"><strong>' + esc(p.name) + '</strong>' +
          '<em>' + esc(p.tagline) + '</em></span>' +
        '<span class="app-tally" data-tally>' + granted.modules.length + ' / ' + mods.length + '</span>' +
        '<label class="switch">' +
          '<input type="checkbox" data-app-toggle' + (on ? ' checked' : '') + '>' +
          '<span class="switch-track" aria-hidden="true"></span>' +
          '<span class="sr-only">Allow access to ' + esc(p.name) + '</span>' +
        '</label>' +
      '</header>' +
      '<div class="app-mods">' +
        '<div class="mods-bulk">' +
          '<button class="linkish" type="button" data-mods-all>Select all modules</button>' +
          '<button class="linkish" type="button" data-mods-none>Clear</button>' +
        '</div>' +
        '<ul class="mod-list">' +
          mods.map(function (m) {
            var checked = granted.modules.indexOf(m.id) > -1;
            return '<li><label class="mod">' +
              '<input type="checkbox" data-mod="' + esc(m.id) + '"' + (checked ? ' checked' : '') +
                (on ? '' : ' disabled') + '>' +
              '<span class="mod-text"><strong>' + esc(m.name) + '</strong>' +
                '<em>' + esc(m.note) + '</em></span>' +
            '</label></li>';
          }).join('') +
        '</ul>' +
      '</div>' +
    '</section>';
  }

  function openAccess(id) {
    var a = find(id);
    if (!a) return;

    // Work on a copy so Cancel really cancels.
    var draft = JSON.parse(JSON.stringify(a.access));
    var st = statusOf(a);
    var totalMods = PRODUCTS.reduce(function (n, p) { return n + (p.modules || []).length; }, 0);

    openDrawer(
      '<header class="drawer-head">' +
        '<p class="modal-kicker">Access control</p>' +
        '<h2 id="drawer-title" class="modal-title">' + esc(a.name || 'Unnamed') + '</h2>' +
        '<p class="modal-sub">' + esc(a.org || '—') + ' · ' + esc(a.email || '—') + '</p>' +
        '<div class="drawer-meta">' +
          '<div><span>Created</span><strong>' + esc(fmtDate(a.createdAt)) + '</strong></div>' +
          '<div><span>Account age</span><strong>Day ' + dayNumber(a) + '</strong></div>' +
          '<div><span>Status</span><strong class="pill pill-' + st + '">' + STATUS_LABEL[st] + '</strong></div>' +
          '<div><span>' + (a.plan === 'active' ? 'Plan' : 'Trial') + '</span><strong>' +
            (a.plan === 'active' ? 'Paid — no end date' :
              (trialDaysLeft(a) > 0 ? plural(trialDaysLeft(a), 'day') + ' left' : 'ended ' + fmtDate(trialEnds(a)))) +
            '</strong></div>' +
        '</div>' +
        '<div class="drawer-bulk">' +
          '<button class="btn btn-outline btn-sm" type="button" data-all-apps>Grant every app</button>' +
          '<button class="btn btn-outline btn-sm" type="button" data-no-apps>Revoke everything</button>' +
          '<span class="drawer-total" data-drawer-total></span>' +
        '</div>' +
      '</header>' +

      '<div class="app-blocks" data-blocks>' +
        PRODUCTS.map(function (p) { return appBlockHtml(p, draft[p.id]); }).join('') +
      '</div>' +

      '<footer class="drawer-foot">' +
        '<button class="btn btn-primary btn-lg" type="button" data-save-access>Save access</button>' +
        '<button class="btn btn-outline btn-lg" type="button" data-drawer-close>Cancel</button>' +
      '</footer>',

      function (root) {
        function refreshTotals() {
          var apps = 0, mods = 0;
          PRODUCTS.forEach(function (p) {
            if (draft[p.id].enabled) { apps++; mods += draft[p.id].modules.length; }
          });
          $('[data-drawer-total]', root).textContent =
            apps + ' of ' + PRODUCTS.length + ' apps · ' + mods + ' of ' + totalMods + ' modules granted';
        }

        function syncBlock(block) {
          var pid = block.getAttribute('data-app');
          var g = draft[pid];
          block.classList.toggle('is-on', g.enabled);
          $('[data-app-toggle]', block).checked = g.enabled;
          $$('[data-mod]', block).forEach(function (cb) {
            cb.disabled = !g.enabled;
            cb.checked = g.modules.indexOf(cb.getAttribute('data-mod')) > -1;
          });
          $('[data-tally]', block).textContent =
            g.modules.length + ' / ' + (byId[pid].modules || []).length;
        }

        function syncAll() {
          $$('.app-block', root).forEach(syncBlock);
          refreshTotals();
        }

        $$('.app-block', root).forEach(function (block) {
          var pid = block.getAttribute('data-app');
          var p = byId[pid];
          var allIds = (p.modules || []).map(function (m) { return m.id; });

          // Turning an app on grants every module by default — turning it off
          // keeps nothing, so a re-grant is always a deliberate choice.
          $('[data-app-toggle]', block).addEventListener('change', function () {
            draft[pid].enabled = this.checked;
            draft[pid].modules = this.checked ? allIds.slice() : [];
            syncBlock(block);
            refreshTotals();
          });

          $('[data-mods-all]', block).addEventListener('click', function () {
            draft[pid].enabled = true;
            draft[pid].modules = allIds.slice();
            syncBlock(block);
            refreshTotals();
          });

          $('[data-mods-none]', block).addEventListener('click', function () {
            draft[pid].modules = [];
            syncBlock(block);
            refreshTotals();
          });

          $$('[data-mod]', block).forEach(function (cb) {
            cb.addEventListener('change', function () {
              var mid = cb.getAttribute('data-mod');
              var at = draft[pid].modules.indexOf(mid);
              if (cb.checked && at < 0) draft[pid].modules.push(mid);
              if (!cb.checked && at > -1) draft[pid].modules.splice(at, 1);
              syncBlock(block);
              refreshTotals();
            });
          });
        });

        $('[data-all-apps]', root).addEventListener('click', function () {
          PRODUCTS.forEach(function (p) {
            draft[p.id].enabled = true;
            draft[p.id].modules = (p.modules || []).map(function (m) { return m.id; });
          });
          syncAll();
        });

        $('[data-no-apps]', root).addEventListener('click', function () {
          PRODUCTS.forEach(function (p) { draft[p.id] = { enabled: false, modules: [] }; });
          syncAll();
        });

        $('[data-save-access]', root).addEventListener('click', function () {
          a.access = draft;
          save();
          render();
          closeDrawer();
          toast('Access updated for ' + (a.name || a.email || 'the account') + '.');
        });

        refreshTotals();
      }
    );
  }

  /* ── 8. Account form ───────────────────────────────────────────────────── */
  function accountFormHtml(a) {
    var isNew = !a;
    a = a || {};
    var created = a.createdAt ? new Date(a.createdAt) : new Date();
    var dateValue = isNaN(created) ? '' : new Date(created.getTime() -
      created.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    return '<p class="modal-kicker">' + (isNew ? 'New account' : 'Edit account') + '</p>' +
      '<h2 id="modal-title" class="modal-title">' +
        (isNew ? 'Add an account' : esc(a.name || 'Edit account')) + '</h2>' +
      '<p class="modal-sub">' + (isNew
        ? 'Created-on is what the day counter runs from — back-date it if the account already existed.'
        : 'Changing the created date moves the day counter with it.') + '</p>' +

      '<form class="form" data-account-form novalidate>' +
        '<fieldset class="fieldset"><legend>Person</legend>' +
          '<div class="grid-2">' +
            '<div class="field"><label for="ac-name">Full name *</label>' +
              '<input id="ac-name" name="name" type="text" required value="' + esc(a.name) + '" data-autofocus></div>' +
            '<div class="field"><label for="ac-email">Work email *</label>' +
              '<input id="ac-email" name="email" type="email" required value="' + esc(a.email) + '"></div>' +
          '</div>' +
          '<div class="grid-2">' +
            '<div class="field"><label for="ac-role">Job title</label>' +
              '<input id="ac-role" name="role" type="text" value="' + esc(a.role) + '"></div>' +
            '<div class="field"><label for="ac-phone">Phone</label>' +
              '<input id="ac-phone" name="phone" type="tel" value="' + esc(a.phone) + '"></div>' +
          '</div>' +
        '</fieldset>' +

        '<fieldset class="fieldset"><legend>Organisation</legend>' +
          '<div class="grid-2">' +
            '<div class="field"><label for="ac-org">Organisation *</label>' +
              '<input id="ac-org" name="org" type="text" required value="' + esc(a.org) + '"></div>' +
            '<div class="field"><label for="ac-industry">Industry</label>' +
              '<select id="ac-industry" name="industry"><option value="">Select…</option>' +
              INDUSTRIES.map(function (i) {
                return '<option' + (i === a.industry ? ' selected' : '') + '>' + esc(i) + '</option>';
              }).join('') + '</select></div>' +
          '</div>' +
        '</fieldset>' +

        '<fieldset class="fieldset"><legend>Account clock</legend>' +
          '<div class="grid-3">' +
            '<div class="field"><label for="ac-created">Created on *</label>' +
              '<input id="ac-created" name="created" type="date" required value="' + esc(dateValue) + '"></div>' +
            '<div class="field"><label for="ac-plan">Plan</label>' +
              '<select id="ac-plan" name="plan">' +
                '<option value="trial"' + (a.plan === 'active' ? '' : ' selected') + '>Trial</option>' +
                '<option value="active"' + (a.plan === 'active' ? ' selected' : '') + '>Active (paid)</option>' +
              '</select></div>' +
            '<div class="field"><label for="ac-days">Trial length (days)</label>' +
              '<input id="ac-days" name="trialDays" type="number" min="1" step="1" value="' +
                esc(a.trialDays || CONFIG.trialDays) + '"></div>' +
          '</div>' +
          '<div class="field"><label for="ac-note">Internal note</label>' +
            '<textarea id="ac-note" name="note" rows="2" placeholder="e.g. POC for 3 sites, decision due after the audit">' +
              esc(a.note) + '</textarea></div>' +
        '</fieldset>' +

        (isNew
          ? '<fieldset class="fieldset"><legend>Start them on</legend>' +
              '<div class="field"><label for="ac-grant">Grant this app straight away</label>' +
                '<select id="ac-grant" name="grant"><option value="">Nothing yet — I will set it after</option>' +
                PRODUCTS.map(function (p) {
                  return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' — every module</option>';
                }).join('') + '</select></div>' +
            '</fieldset>'
          : '') +

        '<div class="modal-actions">' +
          '<button class="btn btn-primary btn-lg" type="submit">' +
            (isNew ? 'Create account' : 'Save changes') + '</button>' +
          '<button class="btn btn-outline btn-lg" type="button" data-modal-close>Cancel</button>' +
        '</div>' +
      '</form>';
  }

  // A date input gives "2026-08-20"; keep it at local midday so the day counter
  // cannot slip a day either side of a timezone boundary.
  function fromDateInput(v) {
    var parts = String(v).split('-');
    if (parts.length !== 3) return new Date().toISOString();
    return new Date(+parts[0], +parts[1] - 1, +parts[2], 12, 0, 0).toISOString();
  }

  function openAccountForm(id) {
    var existing = id ? find(id) : null;
    openModal(accountFormHtml(existing), function (root) {
      $('[data-account-form]', root).addEventListener('submit', function (e) {
        e.preventDefault();
        var data = collect(this);
        if (!data) return;

        var clash = accounts.filter(function (x) {
          return x.email.toLowerCase() === data.email.toLowerCase() &&
            (!existing || x.id !== existing.id);
        })[0];
        if (clash) {
          toast('That email is already on ' + (clash.org || 'another account') + '.', true);
          return;
        }

        var target = existing || normalise({
          id: uid(),
          access: blankAccess(data.grant || null),
          source: 'manual'
        });

        target.name = data.name;
        target.email = data.email;
        target.role = data.role;
        target.phone = data.phone;
        target.org = data.org;
        target.industry = data.industry;
        target.note = data.note;
        target.plan = data.plan === 'active' ? 'active' : 'trial';
        target.trialDays = Math.max(1, parseInt(data.trialDays, 10) || CONFIG.trialDays);
        target.createdAt = fromDateInput(data.created);

        if (!existing) accounts.push(target);
        save();
        render();
        closeModal();
        toast(existing
          ? 'Saved ' + (target.name || 'the account') + '.'
          : 'Added ' + (target.name || target.email) + ' — day 1 starts ' + fmtDate(target.createdAt) + '.');
        if (!existing) openAccess(target.id);
      });
    });
  }

  function confirmDelete(id) {
    var a = find(id);
    if (!a) return;
    openModal(
      '<p class="modal-kicker">Delete account</p>' +
      '<h2 id="modal-title" class="modal-title">Remove ' + esc(a.name || a.email) + '?</h2>' +
      '<p class="modal-sub">This deletes the permission record for <strong>' + esc(a.org || '—') +
        '</strong>, including ' + plural(grantedApps(a).length, 'granted app') +
        '. It cannot be undone from this page.</p>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-primary btn-lg btn-danger" type="button" data-confirm-delete>Delete account</button>' +
        '<button class="btn btn-outline btn-lg" type="button" data-modal-close data-autofocus>Keep it</button>' +
      '</div>',
      function (root) {
        $('[data-confirm-delete]', root).addEventListener('click', function () {
          accounts = accounts.filter(function (x) { return x.id !== id; });
          save();
          render();
          closeModal();
          toast('Deleted ' + (a.name || a.email) + '.');
        });
      }
    );
  }

  /* ── 9. Import / export ────────────────────────────────────────────────── */
  // Turns the landing page's trial sign-ups into accounts, dated from when the
  // form was submitted. Someone who trialled a second product gets that app
  // added to the account they already have rather than a duplicate row.
  function importSignups() {
    var raw = readStore(SIGNUP_KEY);
    if (!raw.length) {
      toast('No trial sign-ups stored in this browser.', true);
      return;
    }

    var added = 0, updated = 0;
    raw.forEach(function (entry) {
      var d = entry.data || {};
      if (!d.email) return;
      var product = byId[d.product];
      var existing = accounts.filter(function (x) {
        return x.email.toLowerCase() === String(d.email).toLowerCase();
      })[0];

      if (existing) {
        if (product && !existing.access[product.id].enabled) {
          existing.access[product.id] = {
            enabled: true,
            modules: (product.modules || []).map(function (m) { return m.id; })
          };
          updated++;
        }
        return;
      }

      accounts.push(normalise({
        id: uid(),
        name: d.contactName || '',
        email: d.email,
        org: d.organisation || '',
        role: d.role || '',
        phone: d.phone || '',
        industry: d.industry || '',
        createdAt: entry.at || new Date().toISOString(),
        plan: 'trial',
        trialDays: CONFIG.trialDays,
        note: d.requirements || '',
        source: 'signup',
        ref: entry.id || '',
        access: blankAccess(product ? product.id : null)
      }));
      added++;
    });

    save();
    render();
    if (!added && !updated) toast('Every sign-up is already on the list.');
    else toast('Imported ' + plural(added, 'new account') + ', ' + updated + ' updated.');
  }

  function exportJson() {
    var payload = {
      exportedAt: new Date().toISOString(),
      source: 'weehs-access-console',
      products: PRODUCTS.map(function (p) {
        return { id: p.id, name: p.name, modules: (p.modules || []).map(function (m) { return m.id; }) };
      }),
      accounts: accounts.map(function (a) {
        return {
          id: a.id, name: a.name, email: a.email, org: a.org, role: a.role, phone: a.phone,
          industry: a.industry, createdAt: a.createdAt, dayNumber: dayNumber(a),
          plan: a.plan, trialDays: a.trialDays, trialEndsAt: trialEnds(a).toISOString(),
          status: statusOf(a), suspended: a.suspended, note: a.note,
          source: a.source, ref: a.ref, access: a.access
        };
      })
    };

    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'weehs-access-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Exported ' + plural(accounts.length, 'account') + '.');
  }

  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try { parsed = JSON.parse(reader.result); }
      catch (e) { toast('That file is not valid JSON.', true); return; }

      var incoming = Array.isArray(parsed) ? parsed : (parsed.accounts || []);
      if (!incoming.length) { toast('No accounts found in that file.', true); return; }

      var added = 0, merged = 0;
      incoming.forEach(function (raw) {
        if (!raw || !raw.email) return;
        var a = normalise(raw);
        var at = -1;
        accounts.forEach(function (x, i) {
          if (x.email.toLowerCase() === a.email.toLowerCase()) at = i;
        });
        if (at > -1) { a.id = accounts[at].id; accounts[at] = a; merged++; }
        else { accounts.push(a); added++; }
      });

      save();
      render();
      toast('Imported ' + plural(added, 'account') + ', ' + merged + ' overwritten.');
    };
    reader.readAsText(file);
  }

  /* ── 10. Gate ──────────────────────────────────────────────────────────── */
  function showConsole() {
    $('[data-gate]').hidden = true;
    $('[data-console]').hidden = false;
    load();
    render();
  }

  function initGate() {
    var gate = $('[data-gate]');
    var unlocked = false;
    try { unlocked = sessionStorage.getItem(GATE_KEY) === '1'; } catch (e) { /* ignore */ }

    if (!CONFIG.passcode || unlocked) { showConsole(); return; }

    gate.hidden = false;
    $('[data-gate-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#gate-code');
      if (input.value === CONFIG.passcode) {
        try { sessionStorage.setItem(GATE_KEY, '1'); } catch (err) { /* ignore */ }
        showConsole();
      } else {
        input.value = '';
        input.focus();
        toast('Wrong passcode.', true);
      }
    });
    $('#gate-code').focus();
  }

  /* ── 11. Boot ──────────────────────────────────────────────────────────── */
  function initFilters() {
    var appSel = $('[data-filter-app]');
    PRODUCTS.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      appSel.appendChild(o);
    });

    $('[data-search]').addEventListener('input', function () { view.q = this.value.trim(); render(); });
    appSel.addEventListener('change', function () { view.app = this.value; render(); });
    $('[data-filter-status]').addEventListener('change', function () { view.status = this.value; render(); });
    $('[data-sort]').addEventListener('change', function () { view.sort = this.value; render(); });
  }

  function initClicks() {
    document.addEventListener('click', function (e) {
      var t = e.target;

      var manage = t.closest('[data-manage]');
      if (manage) { openAccess(manage.getAttribute('data-manage')); return; }

      var edit = t.closest('[data-edit]');
      if (edit) { openAccountForm(edit.getAttribute('data-edit')); return; }

      var del = t.closest('[data-delete]');
      if (del) { confirmDelete(del.getAttribute('data-delete')); return; }

      var susp = t.closest('[data-toggle-suspend]');
      if (susp) {
        var a = find(susp.getAttribute('data-toggle-suspend'));
        if (a) {
          a.suspended = !a.suspended;
          save();
          render();
          toast((a.name || a.email) + (a.suspended ? ' suspended.' : ' resumed.'));
        }
        return;
      }

      if (t.closest('[data-add-account]')) { openAccountForm(null); return; }
      if (t.closest('[data-import-signups]')) { importSignups(); return; }
      if (t.closest('[data-export]')) { exportJson(); return; }
      if (t.closest('[data-import]')) { $('[data-import-file]').click(); return; }
      if (t.closest('[data-modal-close]')) { closeModal(); return; }
      if (t.closest('[data-drawer-close]')) { closeDrawer(); return; }
    });

    $('[data-import-file]').addEventListener('change', function () {
      if (this.files && this.files[0]) importJson(this.files[0]);
      this.value = '';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!$('[data-modal]').hidden) closeModal();
      else if (isDrawerOpen()) closeDrawer();
    });
  }

  function init() {
    var year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
    if (!PRODUCTS.length) {
      toast('No products loaded — check assets/js/products.js.', true);
    }
    initFilters();
    initClicks();
    initGate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
