/* WE EHS — product catalogue.
   Single source of truth for the cards, the trial modal, the enquiry dropdown,
   the hero carousel and the rolling strip.

   Each product carries two URLs:
     domain   the weehs.org subdomain it will be served from (canonical)
     hosting  the platform URL it runs on today (Vercel / Firebase)

   Links use `hosting` until DNS is cut over, then flip CONFIG.domainsLive to
   true in app.js and everything switches to the weehs.org subdomains.

   Every app follows the same routes:
     /login         sign in
     /register-org  create a new organisation (the first account becomes admin)
     /signup        join an organisation that already exists

   screens[] are real screenshots taken from those apps. Replace the files in
   assets/screens/ (same names) to refresh them, or add entries for in-app
   screens once we have captures that are safe to publish. */

window.WEEHS_PRODUCTS = [
  {
    id: 'fire-marshal',
    name: 'Fire Marshal',
    tagline: 'Fire extinguisher & fire equipment management',
    color: '#E11D2E',
    mark: 'FM',
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
    idealFor: 'Fire officers, site EHS teams, facility managers',
    screens: [
      { src: 'assets/screens/fire-marshal-login.png', caption: 'Fire Marshal — Sign in' },
      { src: 'assets/screens/fire-marshal-register.png', caption: 'Fire Marshal — Register organization' }
    ]
  },
  {
    id: 'hecp',
    name: 'HECP LOTO',
    tagline: 'Hazardous Energy Control Program — lockout / tagout',
    color: '#B7791F',
    mark: 'HE',
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
    idealFor: 'Maintenance, engineering and plant safety teams',
    screens: [
      { src: 'assets/screens/hecp-login.png', caption: 'HECP LOTO — Sign in' },
      { src: 'assets/screens/hecp-register.png', caption: 'HECP LOTO — Register organization' }
    ]
  },
  {
    id: 'permit-to-work',
    name: 'Online Permit to Work',
    tagline: 'Hot work, confined space, height, electrical & more',
    color: '#F97316',
    mark: 'PW',
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
    idealFor: 'Operations, shutdown teams, contractor-heavy sites',
    screens: [
      { src: 'assets/screens/permit-to-work-login.png', caption: 'Permit to Work — Sign in' },
      { src: 'assets/screens/permit-to-work-register.png', caption: 'Permit to Work — Register organization' }
    ]
  },
  {
    id: 'iso-45001-auditor',
    name: 'ISO 45001 Auditor',
    tagline: 'Internal audit portal — findings and CAPA',
    color: '#2563EB',
    mark: 'IA',
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
    idealFor: 'QHSE managers, internal auditors, certification leads',
    screens: [
      { src: 'assets/screens/iso-45001-login.png', caption: 'ISO 45001 Auditor — Sign in' },
      { src: 'assets/screens/iso-45001-register.png', caption: 'ISO 45001 Auditor — Register organization' }
    ]
  },
  {
    id: 'hira',
    name: 'HIRA',
    tagline: 'Hazard identification & risk assessment',
    color: '#4338CA',
    mark: 'HR',
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
    idealFor: 'EHS teams, process safety, activity owners',
    screens: [
      { src: 'assets/screens/hira-login.png', caption: 'HIRA — Sign in' },
      { src: 'assets/screens/hira-register.png', caption: 'HIRA — Register organization' }
    ]
  },
  {
    id: 'ohs-suite',
    name: 'OHS Suite',
    tagline: 'Occupational Health & Safety Management System',
    color: '#C0442C',
    mark: 'OS',
    featured: true,
    domain: 'https://suite.weehs.org',
    hosting: 'https://weehs-4eb28.web.app',
    summary:
      'Every OHS module under one login — fire equipment, LOTO, permits, audits and risk assessment in a single management system with one user list and one site hierarchy.',
    features: [
      'All WE EHS modules included, nothing switched off',
      'One organisation, one user list, one site hierarchy',
      'Cross-module dashboards and reporting',
      'Admin approvals and role-based access',
      'Single sign-in for the whole safety team'
    ],
    idealFor: 'Multi-site organisations standardising EHS',
    screens: [
      { src: 'assets/screens/ohs-suite-login.png', caption: 'OHS Suite — Sign in' },
      { src: 'assets/screens/ohs-suite-register.png', caption: 'OHS Suite — Register organization' }
    ]
  }
];
