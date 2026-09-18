# WE EHS — landing page

Static marketing site for the WE EHS product family. No build step, no framework —
open `index.html` (or serve the folder) and it runs.

```
index.html                 page structure
access.html                internal access-control console (not linked from the site)
DEPLOY.md                  weehs.org domain + subdomain cutover runbook
CNAME                      custom domain for GitHub Pages
firebase.json, .firebaserc Firebase Hosting config
robots.txt, sitemap.xml    for weehs.org
assets/css/styles.css      all styling
assets/js/products.js      product catalogue — the single source of truth
assets/js/app.js           carousel, trial flow, session bar, feedback, enquiry
assets/css/access.css      styling for access.html only
assets/js/access.js        accounts, day counter, app + module permissions
assets/screens/*.png       screenshots captured from the live apps
assets/img/favicon.svg
.claude/launch.json        dev-server config for the preview tool
```

## Run it

```bash
npx --yes http-server . -p 5173 -c-1
```

Then open http://127.0.0.1:5173

## Publish

The repo is the source of truth. Pushing to `main` on GitHub publishes the site when GitHub Pages
is enabled (`CNAME` in the repo root holds `weehs.org`); a Firebase Hosting copy also exists at
https://weehs-org-site.web.app and is redeployed with:

```bash
npx firebase-tools deploy --only hosting --project weehs-org-site
```

Pick one of the two to serve `weehs.org` — [DEPLOY.md](DEPLOY.md) §3 covers both and lists the
exact DNS records for each.

## The products, and the OHSMS origin

Every card opens **OHSMS** ([sarath200795/OHSMS](https://github.com/sarath200795/OHSMS)) — one
Firebase project, one organisation, one login. There are no live Vercel destinations on this
site anymore.

| Product | OHSMS key | Open-app path | Auth (shell) |
| --- | --- | --- | --- |
| Fire Marshal | `equipment` | `/equipment` | `/login` · `/register-org` · `/signup` |
| HECP LOTO | `loto` | `/loto` | same |
| Online Permit to Work | `ptw` | `/permits` | same |
| ISO 45001 Auditor | `audit` | `/audit` | same |
| HIRA | `hira` | `/hira` | same |
| OHS Suite (shell) | — | `/login` | same |

Keys and prefixes come from OHSMS `src/shared/modules/registry.js` and `apps.js` (`docs/APPS.md`).
Fire Marshal maps to **Emergency Equipment** (`equipment` / `/equipment`), not mock drills
(`/mock-drills`, key `drills`). Permit to Work is registry key `ptw` at path `/permits`.

Both origins live in `assets/js/products.js`. One flag in `assets/js/app.js` decides which every
link uses:

```js
domainsLive: false   // false = WEEHS_OHSMS_HOSTING · true = WEEHS_OHSMS_DOMAIN (suite.weehs.org)
```

```js
window.WEEHS_OHSMS_DOMAIN  = 'https://suite.weehs.org'
window.WEEHS_OHSMS_HOSTING = 'https://weehs-4eb28.web.app'  // change this if Firebase hosting moves
```

Leave `domainsLive` `false` until `suite.weehs.org` serves HTTPS, then flip it — see
[DEPLOY.md](DEPLOY.md). OHSMS `deploy.yml` already names `https://suite.weehs.org` as the
production environment URL.

**OHSMS must keep serving** `/login`, `/register-org` and `/signup` on the shell (already mounted
in `src/App.jsx`). It does **not** currently read `?module=` on `/login`. Open-app links therefore
go to the module prefix; `ProtectedRoute` bounces unsigned-in visitors to `/login` and, on the
combined SPA, returns them to that path via `location.state.from`. Split module apps
(`/apps/<key>/`) should keep that return — a parallel OHSMS follow-up.

New organisations seed every registry module as a **placeholder**. Suites (Core, Operations,
Fire & Emergency, Compliance, Full) and à-la-carte grants live in OHSMS on `/platform`. This
landing site does not invent a second entitlement system; `access.html` is intent-only.

Historical standalone hosts (not used by landing CTAs): `fire-marshal.vercel.app`,
`hecp-loto.vercel.app`, `permit-to-work-two.vercel.app`, `internal-audit-portal.vercel.app`,
`hira-ruddy.vercel.app`.

## Landing → OHSMS

This site is the public entry. All six cards, header trial, Open the live app, trial handoff,
and the session bar open the **same OHSMS origin**.

| What | Where |
| --- | --- |
| Canonical domain | `https://suite.weehs.org` |
| Firebase Hosting (today) | `window.WEEHS_OHSMS_HOSTING` |
| Sign in (shell) | `{base}/login` |
| Register organisation | `{base}/register-org` (seeds module placeholders) |
| Join an existing org | `{base}/signup` |
| Open Fire Marshal | `{base}/equipment` |
| Open HECP LOTO | `{base}/loto` |
| Open Permit to Work | `{base}/permits` |
| Open ISO 45001 Auditor | `{base}/audit` |
| Open HIRA | `{base}/hira` |
| Open OHS Suite | `{base}/login` |

`{base}` is `suite.weehs.org` when `domainsLive` is true, otherwise `WEEHS_OHSMS_HOSTING`.

The public OHSMS repo does **not** commit the production Firebase project id. If hosting moves,
change **only** `WEEHS_OHSMS_HOSTING`.

## What the page does

**Products** — six cards built from `assets/js/products.js`, each with a direct
"Open the live app" link.

**Trial flow** — clicking *Start free trial* opens a modal that first asks
**existing user or new user**:

- *Existing user* → work email + module → we record the lead, then hand off with two
  buttons: **Sign in** (OHSMS module path, or shell `/login` for the suite) and
  **Join your organisation** (`/signup`).
- *New user* → organisation details (name, industry, employees, sites, country), the primary
  contact who becomes the admin, the product to trial, starting-data preference and a free-text
  "anything specific you need?" box → we record the lead and hand off to **Register organisation**
  (`/register-org`), where they set their own password. After create, OHSMS seeds every module
  as a placeholder.

No password is ever typed on the landing page — that happens on the application itself.

**Trial session bar** — after either path, a bar pins to the bottom showing product,
organisation and days remaining, with *Open workspace* (OHSMS module path, or shell `/login`
for the suite) and *Log out & give feedback*. It survives a page reload (localStorage).

**Feedback on log out** — the feedback form asks for a usefulness rating, what worked,
**what feature is missing** (required), how important it is, and a reply email. Submitting
clears the session and shows a reference number. *Log out without feedback* is recorded as a skip.

**Enquiry** — the `#enquiry` section form and the *Enquire* button on each card capture name,
organisation, work email, phone, product and message.

## Where the data goes (important)

The landing page has no backend. Every submission — signup, signin, enquiry, feedback — is
stored in the visitor's own browser under `localStorage` keys `weehs_signup`, `weehs_signin`,
`weehs_enquiry`, `weehs_feedback`, and nothing is sent anywhere. The actual account is created
by the app itself on `/register-org`; this page captures the lead and routes the visitor there.

To collect leads centrally, set one value at the top of `assets/js/app.js`:

```js
var CONFIG = {
  site: 'https://weehs.org',
  endpoint: 'https://api.weehs.org/v1/leads',   // POSTs {id, type, at, data} as JSON
  trialDays: 14,
  salesEmail: 'info@weehs.org',
  salesPhone: '+91 74570 06625',
  carouselMs: 5000,
  domainsLive: false,
  routes: { login: '/login', register: '/register-org', join: '/signup' }
};
```

`type` is one of `signup`, `signin`, `enquiry`, `feedback` — route on that field. Until an
endpoint exists, run this in the browser console:

```js
WEEHS.leads()        // everything captured in this browser
WEEHS.exportLeads()  // downloads weehs-leads.json
```

**Placeholders to confirm before this goes public:** `trialDays: 14` (the apps do not enforce a
trial length today). Contact address is `info@weehs.org` (Namecheap Private Email); the phone is a personal mobile.

## Access control console

`access.html` is an internal page — no link from the site, `noindex`, and disallowed in
`robots.txt`. It answers two questions: **who is allowed into which app, and which modules
inside it**, and **how long has each account existed**.

- **Day counter.** Every account is counted from its created date. Day 1 is the day it was
  created and it ticks over at midnight, not at the hour they signed up. Trial accounts also
  show days remaining and flip to *Expired* on their own; back-date the created date on an
  account that existed before you added it here.
- **Apps and modules.** Each product in `products.js` carries a `modules` array whose ids match
  OHSMS registry keys. The console builds one block per card with a master switch plus a checkbox
  per module. That is intent only — live grants are suites / à-la-carte inside OHSMS.
- **Accounts come from two places.** *Import trial sign-ups* turns the `weehs_signup` records
  the landing page already captured into accounts, dated from when the form was submitted; a
  second product for the same email is added to that account instead of creating a duplicate.
  *Add account* enters anyone else by hand.
- **Passcode.** `CONFIG.passcode` at the top of `assets/js/access.js` (`weehs-admin` out of
  the box — change it). It only hides the screen; the value ships in the file.

Permissions are stored under the `weehs_accounts` localStorage key, in this browser only.
**Nothing here enforces anything.** It is the record of intent — each WE EHS app still has to
read the same record and enforce it server-side. Use *Export JSON* to get that record out:

```json
{
  "exportedAt": "2026-08-20T09:00:00.000Z",
  "products": [{ "id": "permit-to-work", "modules": ["raise", "hot-work", "…"] }],
  "accounts": [{
    "email": "ravi@bluesteel.co", "createdAt": "…", "dayNumber": 10,
    "plan": "trial", "trialEndsAt": "…", "status": "trial",
    "access": { "permit-to-work": { "enabled": true, "modules": ["raise", "hot-work"] } }
  }]
}
```

*Import JSON* reads the same shape back, matching on email, so the file can round-trip through
a backend once one exists.

## Screenshots

`assets/screens/` holds real captures of each app's `/login` and `/register-org` pages at
1600×1000. The apps are auth-gated, so those are the only screens capturable without an account.

To show in-app screens (registers, permit boards, dashboards) once you have safe-to-publish
captures:

1. Save them into `assets/screens/` at roughly 16:10.
2. Add entries to that product's `screens` array in `assets/js/products.js`:

```js
screens: [
  { src: 'assets/screens/fire-marshal-dashboard.png', caption: 'Fire Marshal — fleet dashboard' },
  { src: 'assets/screens/fire-marshal-dashboard.png', caption: 'Fire Marshal — Compliance dashboard' }
]
```

The hero carousel, the rolling strip and the mini-carousel in the trial modal all read from
that list, so nothing else changes. Use screenshots with demo data only — no real worker names,
no customer organisation names.

The PNGs are 300–580 KB each; run them through an image optimiser before deploying.

## Adding or editing a product

Edit `assets/js/products.js`:

```js
{
  id: 'incident-manager',        // lookup key
  name: 'Incident Manager',
  tagline: 'Reporting, investigation and CAPA',
  color: '#B45309',
  mark: 'IM',
  domain: window.WEEHS_OHSMS_DOMAIN,
  hosting: window.WEEHS_OHSMS_HOSTING,
  ohsmsKey: 'incidents',         // OHSMS registry key
  modulePath: '/incidents',      // Open app / session bar
  routes: { login: '/login', register: '/register-org', join: '/signup' },
  summary: '…',
  features: ['…'],
  modules: [                     // OHSMS keys; access.html is intent-only
    { id: 'incidents', name: 'Incidents & investigation', note: 'OHSMS · Core suite' }
  ],
  idealFor: '…',
  screens: [{ src: 'assets/screens/incident-dashboard.png', caption: 'Incident Manager — dashboard' }]
}
```

## Notes

- Accessible: keyboard-operable modal with focus trap and Escape, skip link, visible focus
  rings, `prefers-reduced-motion` disables the carousel and the rolling strip.
- Responsive down to 375px; the rolling strip pauses on hover or focus.
- All outbound app links open in a new tab with `rel="noopener"`.
