/* WE EHS — product catalogue.
   Single source of truth for the cards, the trial modal, the enquiry dropdown,
   the hero carousel and the rolling strip.

   All six cards open the same OHSMS deployment (github.com/sarath200795/OHSMS):
     domain   https://suite.weehs.org   (canonical; used when CONFIG.domainsLive)
     hosting  WEEHS_OHSMS_HOSTING       (Firebase Hosting until that flag is on)

   Do not point CTAs at the old per-product Vercel hosts (fire-marshal.vercel.app,
   hecp-loto.vercel.app, permit-to-work-two.vercel.app, internal-audit-portal.vercel.app,
   hira-ruddy.vercel.app). Those were standalone apps; landing no longer uses them.

   Shared shell routes (CONFIG.routes in app.js) — OHSMS App.jsx already mounts them:
     /login         sign in
     /register-org  create a new organisation (first account becomes admin)
     /signup        join an organisation that already exists

   Module cards also set modulePath / ohsmsKey from the OHSMS registry
   (src/shared/modules/registry.js) and apps.js pathPrefix (docs/APPS.md, PR 57):
     Fire Marshal          equipment  /equipment
     HECP LOTO             loto       /loto
     Online Permit to Work ptw        /permits
     ISO 45001 Auditor     audit      /audit
     HIRA                  hira       /hira
     OHS Suite             (shell)    /login · /register-org · /signup

   OHSMS does not currently read a ?module= query on /login. Open-app links go
   straight to the module prefix; ProtectedRoute bounces unsigned-in visitors
   to /login and (on the combined SPA) returns them to that path. A parallel
   OHSMS change should keep that return working for split module apps.

   New organisations seed every registry module as a placeholder. Suites /
   à-la-carte grants live in OHSMS on /platform — this site does not enforce them.

   modules[] feeds access.html (intent-only). Keys match the OHSMS registry. */

/* Live Firebase Hosting origin for OHSMS.
   Public OHSMS docs do not publish the production project id (.firebaserc is
   gitignored; docs/PRODUCTION.md is private). This is the best-known live
   host. Canonical public domain is suite.weehs.org (OHSMS deploy.yml).
   Change WEEHS_OHSMS_HOSTING if the Firebase hosting site moves — every card
   reads it. */
window.WEEHS_OHSMS_DOMAIN = 'https://suite.weehs.org';
window.WEEHS_OHSMS_HOSTING = 'https://weehs-4eb28.web.app';

window.WEEHS_PRODUCTS = [
  {
    id: 'fire-marshal',
    name: 'Fire Marshal',
    tagline: 'Fire extinguisher & fire equipment management',
    color: '#E11D2E',
    mark: 'FM',
    logo: 'assets/img/logos/fire-marshal.svg',
    domain: window.WEEHS_OHSMS_DOMAIN,
    hosting: window.WEEHS_OHSMS_HOSTING,
    ohsmsKey: 'equipment',
    modulePath: '/equipment',
    routes: { login: '/login', register: '/register-org', join: '/signup' },
    summary:
      'Track, inspect and refill fire safety equipment across all your sites — as the OHSMS Emergency Equipment module, with one organisation shared with every other module.',
    features: [
      'QR-tracked extinguishers, publicly scannable',
      'Inspection rounds, refill and hydro-test scheduling',
      'Defect capture with photo evidence and assignment',
      'Same login as the rest of OHSMS — other modules stay placeholders until a suite or à-la-carte grant is on',
      'Live, colour-coded compliance dashboard'
    ],
    launchNote:
      'Open app → OHSMS /equipment (registry key equipment, Fire & Emergency suite). Register / join use the shell /register-org and /signup. Mock drills live at /mock-drills (key drills) and are not this card’s target.',
    accessNote:
      'Maps to OHSMS equipment. Intent-only here — OHSMS /platform activates the Fire & Emergency suite or this key à-la-carte. New orgs start with it as a placeholder.',
    modules: [
      { id: 'equipment', name: 'Emergency equipment inventory', note: 'OHSMS key equipment · /equipment · Fire & Emergency suite' }
    ],
    idealFor: 'Fire officers, site EHS teams, facility managers',
    screens: [
      { src: 'assets/screens/fire-marshal-dashboard.png', caption: 'Fire Marshal — fleet dashboard' },
      { src: 'assets/screens/fire-marshal-add.png', caption: 'Fire Marshal — register an extinguisher' },
      { src: 'assets/screens/fire-marshal-qr.png', caption: 'Fire Marshal — print QR asset tags' }
    ]
  },
  {
    id: 'hecp',
    name: 'HECP LOTO',
    tagline: 'Hazardous Energy Control Program — lockout / tagout',
    color: '#B7791F',
    mark: 'HE',
    logo: 'assets/img/logos/hecp.svg',
    domain: window.WEEHS_OHSMS_DOMAIN,
    hosting: window.WEEHS_OHSMS_HOSTING,
    ohsmsKey: 'loto',
    modulePath: '/loto',
    routes: { login: '/login', register: '/register-org', join: '/signup' },
    summary:
      'Build LOTO procedures, generate energy tags & QR codes, and track every isolation point — as the OHSMS Lockout / Tagout module in the same organisation as the rest of the platform.',
    features: [
      'QR-tagged energy control procedures, publicly scannable',
      'Isolation point register by machine and energy source',
      'Energy tag generation for the shop floor',
      'Same login as the rest of OHSMS — other modules stay placeholders until a suite or à-la-carte grant is on',
      'Live, colour-coded LOTO register'
    ],
    launchNote:
      'Open app → OHSMS /loto (registry key loto, Operations suite). Register / join use the shell /register-org and /signup.',
    accessNote:
      'Maps to OHSMS loto. Intent-only here — OHSMS /platform activates the Operations suite or this key à-la-carte. New orgs start with it as a placeholder.',
    modules: [
      { id: 'loto', name: 'Lockout / tagout', note: 'OHSMS key loto · /loto · Operations suite' }
    ],
    idealFor: 'Maintenance, engineering and plant safety teams',
    screens: [
      { src: 'assets/screens/hecp-dashboard.png', caption: 'HECP LOTO — operations overview' },
      { src: 'assets/screens/hecp-inventory.png', caption: 'HECP LOTO — procedure inventory' },
      { src: 'assets/screens/hecp-procedure.png', caption: 'HECP LOTO — posted lockout procedure' },
      { src: 'assets/screens/hecp-tags.png', caption: 'HECP LOTO — printed energy tags' }
    ]
  },
  {
    id: 'permit-to-work',
    name: 'Online Permit to Work',
    tagline: 'Hot work, confined space, height, electrical & more',
    color: '#F97316',
    mark: 'PW',
    logo: 'assets/img/logos/permit-to-work.svg',
    domain: window.WEEHS_OHSMS_DOMAIN,
    hosting: window.WEEHS_OHSMS_HOSTING,
    ohsmsKey: 'ptw',
    modulePath: '/permits',
    routes: { login: '/login', register: '/register-org', join: '/signup' },
    summary:
      'Raise, review and close high-risk work permits — as the OHSMS Permit to Work module, with one organisation shared with LOTO, HIRA and the rest of the platform.',
    features: [
      'Digital permits with hazard, PPE & precaution checklists',
      'Dual-team approval — Engineering & Operations sign-off',
      'Live permit status with auto-expiry',
      'Same login as the rest of OHSMS — other modules stay placeholders until a suite or à-la-carte grant is on',
      'Full approval and closure audit trail'
    ],
    launchNote:
      'Open app → OHSMS /permits (registry key ptw, Operations suite). Register / join use the shell /register-org and /signup.',
    accessNote:
      'Maps to OHSMS ptw. Intent-only here — OHSMS /platform activates the Operations suite or this key à-la-carte. New orgs start with it as a placeholder.',
    modules: [
      { id: 'ptw', name: 'Permit to work', note: 'OHSMS key ptw · /permits · Operations suite' }
    ],
    idealFor: 'Operations, shutdown teams, contractor-heavy sites',
    screens: [
      { src: 'assets/screens/permits-dashboard.png', caption: 'Permit to Work — permit overview' },
      { src: 'assets/screens/permits-detail.png', caption: 'Permit to Work — permit with scan QR' },
      { src: 'assets/screens/permits-list.png', caption: 'Permit to Work — all permits' }
    ]
  },
  {
    id: 'iso-45001-auditor',
    name: 'ISO 45001 Auditor',
    tagline: 'Internal audit portal — findings and CAPA',
    color: '#2563EB',
    mark: 'IA',
    logo: 'assets/img/logos/iso-45001-auditor.svg',
    domain: window.WEEHS_OHSMS_DOMAIN,
    hosting: window.WEEHS_OHSMS_HOSTING,
    ohsmsKey: 'audit',
    modulePath: '/audit',
    routes: { login: '/login', register: '/register-org', join: '/signup' },
    summary:
      'Plan audits, raise findings and drive corrective actions — as the OHSMS Internal Audit module in the same organisation as every other OHSMS module.',
    features: [
      'ISO 45001 audit scheduling & execution matrix',
      'Clause-mapped findings, graded by severity',
      'CAPA workflow with owners and due dates',
      'Same login as the rest of OHSMS — other modules stay placeholders until a suite or à-la-carte grant is on',
      'Live findings, CAPA and closure dashboards'
    ],
    launchNote:
      'Open app → OHSMS /audit (registry key audit, Compliance suite). Register / join use the shell /register-org and /signup.',
    accessNote:
      'Maps to OHSMS audit. Intent-only here — OHSMS /platform activates the Compliance suite or this key à-la-carte. New orgs start with it as a placeholder.',
    modules: [
      { id: 'audit', name: 'Internal audit', note: 'OHSMS key audit · /audit · Compliance suite' }
    ],
    idealFor: 'QHSE managers, internal auditors, certification leads',
    screens: [
      { src: 'assets/screens/audit-hub.png', caption: 'ISO 45001 Auditor — audit hub' },
      { src: 'assets/screens/audit-workplace.png', caption: 'ISO 45001 Auditor — audit report details' },
      { src: 'assets/screens/audit-capa.png', caption: 'ISO 45001 Auditor — CAPA tracker' }
    ]
  },
  {
    id: 'hira',
    name: 'HIRA',
    tagline: 'Hazard identification & risk assessment',
    color: '#4338CA',
    mark: 'HR',
    logo: 'assets/img/logos/hira.svg',
    domain: window.WEEHS_OHSMS_DOMAIN,
    hosting: window.WEEHS_OHSMS_HOSTING,
    ohsmsKey: 'hira',
    modulePath: '/hira',
    routes: { login: '/login', register: '/register-org', join: '/signup' },
    summary:
      'Identify hazards, score risk on the 5×5 matrix, apply the hierarchy of controls and track residual risk to ALARP — as the OHSMS HIRA module, one organisation with the rest of the platform.',
    features: [
      'Structured hazard identification & risk assessments',
      '5×5 risk matrix with ALARP handling',
      'Hierarchy of controls applied to every hazard',
      'Same login as the rest of OHSMS — other modules stay placeholders until a suite or à-la-carte grant is on',
      'Residual risk tracked after controls'
    ],
    launchNote:
      'Open app → OHSMS /hira (registry key hira, Core suite). Register / join use the shell /register-org and /signup.',
    accessNote:
      'Maps to OHSMS hira. Intent-only here — OHSMS /platform activates the Core suite or this key à-la-carte. New orgs start with it as a placeholder.',
    modules: [
      { id: 'hira', name: 'Hazard identification & risk assessment', note: 'OHSMS key hira · /hira · Core suite' }
    ],
    idealFor: 'EHS teams, process safety, activity owners',
    screens: [
      { src: 'assets/screens/hira-register.png', caption: 'HIRA — register organization' }
    ]
  },
  {
    id: 'ohs-suite',
    name: 'OHS Suite',
    tagline: 'Occupational Health & Safety Management System',
    color: '#C0442C',
    mark: 'OS',
    logo: 'assets/img/logos/ohs-suite.svg',
    featured: true,
    ribbon: 'OHSMS shell',
    domain: window.WEEHS_OHSMS_DOMAIN,
    hosting: window.WEEHS_OHSMS_HOSTING,
    routes: { login: '/login', register: '/register-org', join: '/signup' },
    summary:
      'Opens the OHSMS shell — one login, one organisation, then individual operating modules launch from the portal according to the suite or à-la-carte subscription. New workspaces seed every module as a placeholder until it is activated.',
    features: [
      'Hands off to the OHSMS shell (not a standalone mini-app)',
      'One organisation, one user list, one site hierarchy',
      'Modules launch from the shell once a suite or à-la-carte grant is on',
      'Packaging suites: Core, Operations, Fire & Emergency, Compliance, Full',
      'Placeholders until activated — entitlements live in OHSMS, not this site'
    ],
    launchNote:
      'Open app / trial / register / join go to the OHSMS shell at /login, /register-org and /signup. Module cards deep-link their registry prefixes on the same origin.',
    accessNote:
      'These keys match the OHSMS module registry. This console is intent-only — OHSMS /platform activates suites and à-la-carte modules. New orgs start with every module as a placeholder.',
    modules: [
      { id: 'incidents', name: 'Incidents & investigation', note: 'OHSMS · Core suite — placeholder until activated' },
      { id: 'hira', name: 'Hazard identification & risk assessment', note: 'OHSMS · Core suite — placeholder until activated' },
      { id: 'inspections', name: 'Inspections', note: 'OHSMS · Core suite — placeholder until activated' },
      { id: 'training', name: 'Training & certifications', note: 'OHSMS · Core suite — placeholder until activated' },
      { id: 'documents', name: 'Document library & SDS', note: 'OHSMS · Core suite — placeholder until activated' },
      { id: 'actions', name: 'Central action tracker', note: 'OHSMS · Core suite — placeholder until activated' },
      { id: 'ptw', name: 'Permit to work', note: 'OHSMS · Operations suite — placeholder until activated' },
      { id: 'loto', name: 'Lockout / tagout', note: 'OHSMS · Operations suite — placeholder until activated' },
      { id: 'weather', name: 'Site weather risk', note: 'OHSMS · Operations suite — placeholder until activated' },
      { id: 'cctv', name: 'CCTV inventory & health', note: 'OHSMS · Operations suite — placeholder until activated' },
      { id: 'equipment', name: 'Emergency equipment inventory', note: 'OHSMS · Fire & Emergency suite — placeholder until activated' },
      { id: 'drills', name: 'Mock drills', note: 'OHSMS · Fire & Emergency suite — placeholder until activated' },
      { id: 'emergency', name: 'Emergency response (FERP)', note: 'OHSMS · Fire & Emergency suite — placeholder until activated' },
      { id: 'audit', name: 'Internal audit', note: 'OHSMS · Compliance suite — placeholder until activated' },
      { id: 'committee', name: 'HSE committee meetings', note: 'OHSMS · Compliance suite — placeholder until activated' },
      { id: 'objectives', name: 'Objectives & targets', note: 'OHSMS · Compliance suite — placeholder until activated' },
      { id: 'stakeholder', name: 'Customer escalations & legal', note: 'OHSMS · Compliance suite — placeholder until activated' }
    ],
    idealFor: 'Multi-site organisations standardising EHS on one platform',
    screens: [
      { src: 'assets/screens/ohs-suite-register.png', caption: 'OHS Suite — register organization' }
    ]
  }
];
