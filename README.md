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

## The products, and the domain switch

| Product | weehs.org subdomain (target) | Platform URL (today) |
| --- | --- | --- |
| Fire Marshal | `fire-marshal.weehs.org` | https://fire-marshal.vercel.app |
| HECP LOTO | `hecp.weehs.org` | https://hecp-loto.vercel.app |
| Online Permit to Work | `permits.weehs.org` | https://permit-to-work-two.vercel.app |
| ISO 45001 Auditor | `audit.weehs.org` | https://internal-audit-portal.vercel.app |
| HIRA | `hira.weehs.org` | https://hira-ruddy.vercel.app |
| OHS Suite | `suite.weehs.org` | https://weehs-4eb28.web.app |

Both URLs live on each product in `assets/js/products.js` (`domain` and `hosting`). One flag in
`assets/js/app.js` decides which one every link uses:

```js
domainsLive: false   // false = platform URLs · true = weehs.org subdomains
```

Leave it `false` until DNS resolves and HTTPS is live, then flip it and redeploy — see
[DEPLOY.md](DEPLOY.md) for the full cutover, including the Firebase Auth authorized-domains step
that silently breaks sign-in if skipped.

Every app shares the same routes, which is what the landing page links into:

- `/login` — sign in
- `/register-org` — create a new organisation (first account becomes admin)
- `/signup` — join an organisation that already exists

Those routes are set in `CONFIG.routes` in `assets/js/app.js`.

## What the page does

**Products** — six cards built from `assets/js/products.js`, each with a direct
"Open the live app" link.

**Trial flow** — clicking *Start free trial* opens a modal that first asks
**existing user or new user**:

- *Existing user* → work email + module → we record the lead, then hand off with two
  buttons: **Sign in** (`/login`) and **Join your organisation** (`/signup`).
- *New user* → organisation details (name, industry, employees, sites, country), the primary
  contact who becomes the admin, the product to trial, starting-data preference and a free-text
  "anything specific you need?" box → we record the lead and hand off to **Register organisation**
  (`/register-org`), where they set their own password.

No password is ever typed on the landing page — that happens on the application itself.

**Trial session bar** — after either path, a bar pins to the bottom showing product,
organisation and days remaining, with *Open workspace* (opens the app's sign-in) and
*Log out & give feedback*. It survives a page reload (localStorage).

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
- **Apps and modules.** Each product in `products.js` carries a `modules` array. The console
  builds one block per app with a master switch plus a checkbox per module, so an account can
  have Permit to Work but only hot work and approvals, for example.
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
  color: '#B45309',              // accent used across the card and modal
  mark: 'IM',                    // two-letter badge
  domain: 'https://incident-manager.weehs.org',
  hosting: 'https://incident-manager.example.app',
  summary: '…',
  features: ['…'],
  modules: [                     // what access.html can grant or withhold
    { id: 'register', name: 'Incident register', note: 'Report and log incidents' }
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
