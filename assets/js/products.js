/* WE EHS — product catalogue.
   Single source of truth for the cards, the trial modal, the enquiry dropdown,
   the hero carousel and the rolling strip.

   Each product carries two URLs:
     domain   the weehs.org subdomain it will be served from (canonical)
     hosting  the platform URL it runs on today (Vercel / Firebase)

   Links use `hosting` until DNS is cut over, then flip CONFIG.domainsLive to
   true in app.js and everything switches to the weehs.org subdomains.

   Every app follows the same public routes (CONFIG.routes in app.js). A product
   may set its own `routes` object; otherwise it inherits:
     /login         sign in
     /register-org  create a new organisation (the first account becomes admin)
     /signup        join an organisation that already exists

   OHS Suite (id `ohs-suite`) is the public entry into OHSMS — the multi-app
   shell at github.com/sarath200795/OHSMS. Set WEEHS_OHSMS_HOSTING if the live
   Firebase Hosting URL changes. Canonical domain is suite.weehs.org.

   modules[] is the list of things inside each app that access can be granted or
   withheld on, one entry per module. access.html reads it to build the per-user
   permission grid, so adding a module there makes it regulatable immediately.
   For OHS Suite those ids match the OHSMS registry; they are intent-only here.
   Real entitlements (suites / à-la-carte) live in OHSMS on /platform.

   screens[] are real screenshots taken from those apps. Replace the files in
   assets/screens/ (same names) to refresh them, or add entries for in-app
   screens once we have captures that are safe to publish. */

/* Live Firebase Hosting origin for the OHSMS shell (OHS Suite).
   Public OHSMS docs do not publish the production project id (.firebaserc is
   gitignored; docs/PRODUCTION.md is private). This is the best-known live
   host: it serves the OHSMS sign-in with /login, /register-org and /signup.
   OHSMS deploy.yml names https://suite.weehs.org as the production environment
   URL — that is the canonical domain once CONFIG.domainsLive is true.
   Change this one value if the Firebase hosting site moves; every OHS Suite
   handoff (Open app, trial, register, join, session bar) reads it. */
window.WEEHS_OHSMS_HOSTING = 'https://weehs-4eb28.web.app';

window.WEEHS_PRODUCTS = [
  {
    id: 'fire-marshal',
    name: 'Fire Marshal',
    tagline: 'Fire extinguisher & fire equipment management',
    color: '#E11D2E',
    mark: 'FM',
    logo: 'assets/img/logos/fire-marshal.svg',
    domain: 'https://fire-marshal.weehs.org',
    hosting: 'https://fire-marshal.vercel.app',
    summary:
      'Track, inspect and refill fire safety equipment across all your sites — with QR codes, defect workflows and real-time dashboards.',
    features: [
      'QR-tracked extinguishers, publicly scannable',
      'Inspection rounds, refill and hydro-test scheduling',
      'Defect capture with photo evidence and assignment',
      'Org-scoped access with admin approvals',
      'Live, colour-coded compliance dashboard'
    ],
    modules: [
      { id: 'equipment', name: 'Equipment register', note: 'Extinguishers, hydrants, hose reels, alarms' },
      { id: 'qr', name: 'QR codes & scanning', note: 'Generate, print and scan equipment tags' },
      { id: 'inspections', name: 'Inspection rounds', note: 'Monthly / quarterly round scheduling and sign-off' },
      { id: 'refill', name: 'Refill & hydro-test', note: 'Due dates, vendor jobs and certificates' },
      { id: 'defects', name: 'Defects & work orders', note: 'Photo evidence, assignment and closure' },
      { id: 'reports', name: 'Dashboards & reports', note: 'Compliance %, overdue and site roll-ups' },
      { id: 'admin', name: 'Users, sites & approvals', note: 'Invite, approve and assign roles' }
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
    domain: 'https://hecp.weehs.org',
    hosting: 'https://hecp-loto.vercel.app',
    summary:
      'Build LOTO procedures, generate energy tags & QR codes, and track every isolation point across your sites — in one auditable system.',
    features: [
      'QR-tagged energy control procedures, publicly scannable',
      'Isolation point register by machine and energy source',
      'Energy tag generation for the shop floor',
      'Org-scoped access with admin approvals',
      'Live, colour-coded LOTO register'
    ],
    modules: [
      { id: 'procedures', name: 'LOTO procedures', note: 'Write, version and publish energy control procedures' },
      { id: 'isolation', name: 'Isolation point register', note: 'Points by machine, energy source and location' },
      { id: 'tags', name: 'Energy tag generation', note: 'Printable shop-floor tags' },
      { id: 'qr', name: 'QR codes & scanning', note: 'Publicly scannable procedure codes' },
      { id: 'executions', name: 'Isolation execution log', note: 'Who isolated what, when and de-isolation' },
      { id: 'reports', name: 'Dashboards & reports', note: 'Live LOTO register and overdue reviews' },
      { id: 'admin', name: 'Users, sites & approvals', note: 'Invite, approve and assign roles' }
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
    domain: 'https://permits.weehs.org',
    hosting: 'https://permit-to-work-two.vercel.app',
    summary:
      'Raise, review and close high-risk work permits — hot work, confined space, height, electrical and more — with a clear approval trail across every team.',
    features: [
      'Digital permits with hazard, PPE & precaution checklists',
      'Dual-team approval — Engineering & Operations sign-off',
      'Live permit status with auto-expiry',
      'Printable permit records for the work site',
      'Full approval and closure audit trail'
    ],
    modules: [
      { id: 'raise', name: 'Raise permits', note: 'Create and submit new permits' },
      { id: 'hot-work', name: 'Hot work permits', note: 'Welding, cutting, grinding, naked flame' },
      { id: 'confined', name: 'Confined space permits', note: 'Entry, gas testing and standby watch' },
      { id: 'height', name: 'Work at height permits', note: 'Scaffold, ladder, roof and fall arrest' },
      { id: 'electrical', name: 'Electrical permits', note: 'LV / HV work, linked to LOTO isolations' },
      { id: 'approvals', name: 'Approvals & sign-off', note: 'Engineering and Operations dual approval' },
      { id: 'closure', name: 'Closure & audit trail', note: 'Auto-expiry, closure records and history' },
      { id: 'reports', name: 'Dashboards & reports', note: 'Live permit status and site roll-ups' },
      { id: 'admin', name: 'Users, sites & approvals', note: 'Invite, approve and assign roles' }
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
    domain: 'https://audit.weehs.org',
    hosting: 'https://internal-audit-portal.vercel.app',
    summary:
      'Plan audits, raise findings and drive corrective actions across all your sites — with scheduling, CAPA workflows and real-time compliance dashboards.',
    features: [
      'ISO 45001 audit scheduling & execution matrix',
      'Clause-mapped findings, graded by severity',
      'CAPA workflow with owners and due dates',
      'Org-scoped access with admin approvals',
      'Live findings, CAPA and closure dashboards'
    ],
    modules: [
      { id: 'plan', name: 'Audit plan & schedule', note: 'Annual matrix, auditors and audit windows' },
      { id: 'execute', name: 'Audit execution', note: 'Checklists, evidence capture and notes' },
      { id: 'findings', name: 'Findings & NCs', note: 'Clause-mapped findings graded by severity' },
      { id: 'capa', name: 'CAPA workflow', note: 'Owners, due dates, verification and closure' },
      { id: 'clauses', name: 'Clause library', note: 'ISO 45001 clause set and local standards' },
      { id: 'reports', name: 'Dashboards & reports', note: 'Findings, CAPA ageing and closure rates' },
      { id: 'admin', name: 'Users, sites & approvals', note: 'Invite, approve and assign roles' }
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
    domain: 'https://hira.weehs.org',
    hosting: 'https://hira-ruddy.vercel.app',
    summary:
      'Identify hazards, score risk on the 5×5 matrix, apply the hierarchy of controls and track residual risk to ALARP — across all your activities and sites.',
    features: [
      'Structured hazard identification & risk assessments',
      '5×5 risk matrix with ALARP handling',
      'Hierarchy of controls applied to every hazard',
      'Residual risk tracked after controls',
      'Live risk dashboard across every site & activity'
    ],
    modules: [
      { id: 'register', name: 'Hazard register', note: 'Activities, tasks and identified hazards' },
      { id: 'assessments', name: 'Risk assessments', note: 'Create, review and re-assess HIRA records' },
      { id: 'matrix', name: 'Risk matrix settings', note: '5x5 matrix, thresholds and ALARP rules' },
      { id: 'controls', name: 'Hierarchy of controls', note: 'Elimination through to PPE, per hazard' },
      { id: 'residual', name: 'Residual risk & ALARP', note: 'Post-control scoring and sign-off' },
      { id: 'reports', name: 'Dashboards & reports', note: 'Risk profile by site, activity and owner' },
      { id: 'admin', name: 'Users, sites & approvals', note: 'Invite, approve and assign roles' }
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
    domain: 'https://suite.weehs.org',
    hosting: window.WEEHS_OHSMS_HOSTING,
    // Same public contract as CONFIG.routes — OHSMS App.jsx already exposes these
    // on the shell. Keep them here so a future path change is a product edit.
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
      'Open app / trial / register / join go to the OHSMS shell at /login, /register-org and /signup.',
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
