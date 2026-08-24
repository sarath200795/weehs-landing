# Deploying WE EHS on weehs.org

Everything here needs access to the **weehs.org registrar/DNS**, the **Vercel account** that owns
the five app projects, and the **Firebase project** `weehs-4eb28`. Nothing in this repo can do it
for you — run the steps in order and the site plus all six apps end up on one domain.

## 1. Target map

| Host | Serves | Platform today |
| --- | --- | --- |
| `weehs.org` + `www.weehs.org` | this landing page | GitHub Pages or Firebase — see §3 |
| `fire-marshal.weehs.org` | Fire Marshal | Vercel — `fire-marshal.vercel.app` |
| `hecp.weehs.org` | HECP LOTO | Vercel — `hecp-loto.vercel.app` |
| `permits.weehs.org` | Online Permit to Work | Vercel — `permit-to-work-two.vercel.app` |
| `audit.weehs.org` | ISO 45001 Auditor | Vercel — `internal-audit-portal.vercel.app` |
| `hira.weehs.org` | HIRA | Vercel — `hira-ruddy.vercel.app` |
| `suite.weehs.org` | OHS Suite | Firebase Hosting — `weehs-4eb28.web.app` |

Change any name you dislike in `assets/js/products.js` (`domain` field) and in this table — the
landing page reads it from there.

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

**The six app subdomains** — five on Vercel, one on Firebase:

```
fire-marshal   CNAME   cname.vercel-dns.com.
hecp           CNAME   cname.vercel-dns.com.
permits        CNAME   cname.vercel-dns.com.
audit          CNAME   cname.vercel-dns.com.
hira           CNAME   cname.vercel-dns.com.
suite          A       (two values from the weehs-4eb28 Firebase console)
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

## 5. Attach the domain in each platform

**Vercel — once per project** (5 projects):
Project → Settings → Domains → Add → `<sub>.weehs.org` → it verifies the CNAME and issues the
certificate automatically. Set the weehs.org subdomain as the **production domain** so the
`*.vercel.app` URL redirects to it.

**Firebase — OHS Suite:**
Hosting → Add custom domain → `suite.weehs.org` → add the TXT record it shows → wait for
verification → add the two A records → certificate provisioning takes up to 24h.

## 6. The part that breaks sign-in if you skip it

Adding a domain is not enough — the apps' auth and API layers only accept known origins:

- **Firebase Auth** (used by the OHS Suite, and by any app on Firebase Auth):
  Authentication → Settings → **Authorized domains** → add `suite.weehs.org` and every other
  weehs.org subdomain that talks to that Firebase project. Sign-in fails with
  `auth/unauthorized-domain` until you do.
- **Firestore/Storage rules and any API CORS allowlist**: add the new origins.
- **OAuth providers** (Google/Microsoft sign-in, if enabled): add
  `https://<sub>.weehs.org/__/auth/handler` to the provider's authorized redirect URIs.
- **Email templates / password reset links**: point them at the new host.
- **Environment variables** holding absolute URLs (`NEXT_PUBLIC_SITE_URL`, callback URLs,
  QR-code base URLs) — the QR codes on extinguishers and LOTO tags encode a URL, so decide whether
  old codes must keep resolving. If they do, keep the `*.vercel.app` host alive as a redirect
  rather than removing it.

## 7. Flip the landing page over

Once `https://fire-marshal.weehs.org` (and the rest) load over HTTPS, edit
`assets/js/app.js`:

```js
domainsLive: true,
```

Every card link, trial handoff, session bar and carousel URL label switches from the platform
URLs to the weehs.org subdomains. Redeploy the landing page.

## 8. Verify

- [ ] `https://weehs.org` and `https://www.weehs.org` both resolve, one redirects to the other
- [ ] All six subdomains load over HTTPS with a valid certificate
- [ ] Old `*.vercel.app` / `*.web.app` URLs redirect (or are intentionally kept alive for QR codes)
- [ ] Sign in works on each subdomain — including Google/Microsoft sign-in if enabled
- [ ] Register organisation works end to end on one app
- [ ] Password reset email arrives and its link points at the weehs.org host
- [ ] Landing page trial flow opens the right subdomain for each of the six products
- [ ] `https://weehs.org/sitemap.xml` and `/robots.txt` return 200

## 9. Still placeholders

The 14-day trial length in `assets/js/app.js` is an
assumption — confirm it before announcing the domain. Contact details are a personal Gmail and mobile. If you want lead capture to survive
deployment, also set `CONFIG.endpoint`; until then submissions only live in the visitor's browser.
