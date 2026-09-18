# Deploying WE EHS on weehs.org

Landing CTAs all open **OHSMS** on `suite.weehs.org` (or `WEEHS_OHSMS_HOSTING` until that
domain is live). You need the **weehs.org registrar/DNS** and the **Firebase project that
hosts OHSMS** (best-known live host `weehs-4eb28.web.app`). The old per-product Vercel apps
are no longer destinations from this site.

## 1. Target map

| Host | Serves | Platform |
| --- | --- | --- |
| `weehs.org` + `www.weehs.org` | this landing page | GitHub Pages or Firebase — see §3 |
| `suite.weehs.org` | **OHSMS** (shell + module apps) | Firebase Hosting — `WEEHS_OHSMS_HOSTING` (`weehs-4eb28.web.app` today) |

Landing does not send visitors to `fire-marshal.weehs.org`, `hecp.weehs.org`, `permits.weehs.org`,
`audit.weehs.org`, `hira.weehs.org`, or the old `*.vercel.app` hosts. Those five cards deep-link
OHSMS module prefixes on `suite.weehs.org`:

| Card | OHSMS key | Path |
| --- | --- | --- |
| Fire Marshal | `equipment` | `/equipment` |
| HECP LOTO | `loto` | `/loto` |
| Online Permit to Work | `ptw` | `/permits` |
| ISO 45001 Auditor | `audit` | `/audit` |
| HIRA | `hira` | `/hira` |
| OHS Suite | shell | `/login` · `/register-org` · `/signup` |

See README § Landing → OHSMS. If the Firebase hosting origin is not `weehs-4eb28.web.app`,
change `WEEHS_OHSMS_HOSTING` in `assets/js/products.js`.

## 2. Source of truth: GitHub

The site is a git repository. Push it to GitHub and everything below hangs off that:

```bash
gh repo create weehs-landing --public --source=. --remote=origin --push
```

Repository: `sarath200795/weehs-landing` · branch `main` · site files at the repo root.

## 3. Where weehs.org is served from — pick one

Both options work; the domain can only point at one of them.

### 3A. GitHub Pages (serve straight from the repo — no build, no secrets)

Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)` → Save.
Then Settings → Pages → Custom domain → `weehs.org` → Save → tick **Enforce HTTPS** once the
certificate is issued (a few minutes to an hour after DNS resolves).

The `CNAME` file in the repo root already contains `weehs.org`, which keeps the domain attached
across pushes. Every push to `main` republishes the site — no workflow file needed.

Also verify the domain under GitHub → Settings → Pages → "Verify a domain" so nobody else can
claim `*.weehs.org` on GitHub Pages.

### 3B. Firebase Hosting (already deployed, live today)

- Project: **`weehs-org-site`** (display name "WE EHS")
- Live at: **https://weehs-org-site.web.app**
- Console: https://console.firebase.google.com/project/weehs-org-site/hosting

Config is committed as `firebase.json` + `.firebaserc`. To publish a change:

```bash
npx firebase-tools deploy --only hosting --project weehs-org-site
```

Attach the domain in Hosting → Add custom domain → `weehs.org` (console only — the CLI cannot add
custom domains). Firebase issues a TXT verification record and its own A records.

If you go with 3A, keep this as a staging URL — nothing breaks by leaving it deployed.

Either way, keep the redirect direction (`www` → apex, or the reverse) consistent with
`<link rel="canonical" href="https://weehs.org/">` in `index.html`.

## 4. DNS records at the registrar

**OHSMS (required for every product CTA):**

```
suite          A       (two values from the OHSMS Firebase hosting console)
suite          TXT     (verification value from that console)
```

**The apex and www**, if you chose GitHub Pages (3A):

```
@     A       185.199.108.153
@     A       185.199.109.153
@     A       185.199.110.153
@     A       185.199.111.153
@     AAAA    2606:50c0:8000::153
@     AAAA    2606:50c0:8001::153
@     AAAA    2606:50c0:8002::153
@     AAAA    2606:50c0:8003::153
www   CNAME   sarath200795.github.io.
```

If you chose Firebase (3B) instead, use the A and TXT records the `weehs-org-site` console shows
you — they are issued per project, so do not copy values from anywhere else.

Keep TTL low (300s) during the cutover, raise it afterwards.

Legacy `fire-marshal` / `hecp` / `permits` / `audit` / `hira` CNAMEs to Vercel are unused by
this landing page. Keep them only if printed QR codes still encode those hosts.

## 5. Attach suite.weehs.org on the OHSMS Firebase project

The suite subdomain must serve **OHSMS** (the same Firebase project OHSMS deploys to).
Hosting → Add custom domain → `suite.weehs.org` → TXT → A records → certificate (up to 24h).

OHSMS must keep `/login`, `/register-org` and `/signup` on the shell, and the module prefixes
`/equipment`, `/loto`, `/permits`, `/audit`, `/hira` (registry keys `equipment`, `loto`, `ptw`,
`audit`, `hira`). OHSMS does not currently honour `?module=` on `/login`; Open-app links hit
the module path and rely on `ProtectedRoute` to bounce to `/login`.

## 6. The part that breaks sign-in if you skip it

- **Firebase Auth** (OHSMS): Authentication → Settings → **Authorized domains** → add
  `suite.weehs.org`. Sign-in fails with `auth/unauthorized-domain` until you do. Landing
  (`weehs.org`) does not run Auth and does not need to be on that list.
- **App Check / reCAPTCHA** domain list: include `suite.weehs.org`.
- **OAuth providers** (Google/Microsoft, if enabled):
  `https://suite.weehs.org/__/auth/handler`.
- **Email templates / password reset links**: the suite host.
- **QR codes** printed for extinguishers and LOTO tags encode a URL. If old codes used
  `*.vercel.app` or a product subdomain, keep those hosts as redirects rather than removing them.

## 7. Flip the landing page over

Once `https://suite.weehs.org/login` loads over HTTPS, `domainsLive: true` in
`assets/js/app.js` (already the current setting) sends every card to that host. `false` uses
`WEEHS_OHSMS_HOSTING` instead. Redeploy the landing page after changing it.

## 8. Verify

- [ ] `https://weehs.org` and `https://www.weehs.org` both resolve, one redirects to the other
- [ ] `https://suite.weehs.org` loads OHSMS over HTTPS
- [ ] Sign in works on `suite.weehs.org` — including Google/Microsoft if enabled
- [ ] Register organisation works end to end (`/register-org`)
- [ ] Password reset email link points at `suite.weehs.org`
- [ ] **OHS Suite** Open the live app → `{base}/login`
- [ ] **OHS Suite** trial → new user → `{base}/register-org`; existing → Join `{base}/signup`
- [ ] **Fire Marshal** Open the live app → `{base}/equipment`
- [ ] **HECP LOTO** Open the live app → `{base}/loto`
- [ ] **Permit to Work** Open the live app → `{base}/permits`
- [ ] **ISO 45001 Auditor** Open the live app → `{base}/audit`
- [ ] **HIRA** Open the live app → `{base}/hira`
- [ ] Each of the five module cards’ trial Sign in opens that same module path (or shell `/login` then the module); Register / Join still `{base}/register-org` and `{base}/signup`
- [ ] No card “Open the live app” href contains `vercel.app`
- [ ] `https://weehs.org/sitemap.xml` and `/robots.txt` return 200

`{base}` is `https://suite.weehs.org` when `domainsLive` is true, else `WEEHS_OHSMS_HOSTING`.

## 9. Still placeholders

The 14-day trial length in `assets/js/app.js` is an
assumption — confirm it before announcing the domain. Contact address is `info@weehs.org`; the phone is a personal mobile. If you want lead capture to survive
deployment, also set `CONFIG.endpoint`; until then submissions only live in the visitor's browser.
