/* WhatBreaks BREAK THE PAGE — UI choreography. Vanilla JS. */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasIO = 'IntersectionObserver' in window;
const clamp01 = v => Math.min(1, Math.max(0, v));
const isMobileView = () => window.innerWidth < 700;

/* ---------- mobile menu ---------- */
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => mainNav.classList.toggle('nav-open'));
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('nav-open')));
}

/* ---------- header state ---------- */
(function () {
  const onScroll = () => document.body.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- slice-snap glitch headings ----------
   Each .glitch-h keeps its markup in a hidden base (for layout) and gets 3
   clip-path slice clones + 1 vermilion ghost that converge on reveal. */
(function () {
  document.querySelectorAll('.glitch-h').forEach(h => {
    const html = h.innerHTML;
    h.classList.add('glx');
    h.innerHTML =
      '<span class="glx-base">' + html + '</span>' +
      '<span class="glx-g" aria-hidden="true">' + html + '</span>' +
      '<span class="glx-s glx-s0" aria-hidden="true">' + html + '</span>' +
      '<span class="glx-s glx-s1" aria-hidden="true">' + html + '</span>' +
      '<span class="glx-s glx-s2" aria-hidden="true">' + html + '</span>';
  });
  const heads = document.querySelectorAll('.glx');
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.35 });
    heads.forEach(h => io.observe(h));
  } else {
    heads.forEach(h => h.classList.add('in'));
  }
})();

/* ---------- hero idle flicker: the stable page isn't quite stable ---------- */
(function () {
  const hero = document.getElementById('heroWord');
  if (!hero || reduceMotion) return;
  const flick = () => {
    hero.classList.add('glx-flick');
    setTimeout(() => hero.classList.remove('glx-flick'), 340);
    setTimeout(flick, 3400 + Math.random() * 3400);
  };
  setTimeout(flick, 1800);
})();

/* ---------- rift words: scroll-coupled slice displacement ---------- */
(function () {
  const words = Array.from(document.querySelectorAll('.rift-word'));
  if (!words.length || reduceMotion) return;
  const slices = words.map(w => ({
    el: w,
    s: [w.querySelector('.rw-0'), w.querySelector('.rw-1'), w.querySelector('.rw-2')]
  }));
  function paint() {
    const vh = window.innerHeight;
    slices.forEach(({ el, s }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) return;
      /* distance of the word's center from viewport center, -1..1 */
      const d = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / (vh / 2)));
      const mag = d * (isMobileView() ? 26 : 64);
      if (s[0]) s[0].style.transform = 'translateX(' + (-mag).toFixed(1) + 'px)';
      if (s[1]) s[1].style.transform = 'translateX(' + (mag * 0.8).toFixed(1) + 'px)';
      if (s[2]) s[2].style.transform = 'translateX(' + (-mag * 0.55).toFixed(1) + 'px)';
    });
  }
  let tick = false;
  const onScroll = () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => { paint(); tick = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint();
})();

/* ---------- noise overlay: constant grain + bursts on act boundaries ---------- */
const Noise = (function () {
  const canvas = document.getElementById('noiseCanvas');
  if (!canvas || reduceMotion) return { burst() {} };
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  function size() {
    const scale = 0.5; /* small buffer, scaled up by CSS — chunkier grain */
    w = canvas.width = Math.max(2, Math.floor(window.innerWidth * scale));
    h = canvas.height = Math.max(2, Math.floor(window.innerHeight * scale));
  }
  window.addEventListener('resize', size);
  size();
  let burstT = 0;        /* 0..1 burst envelope */
  let last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (t - last < 66) return;  /* ~15fps grain is plenty */
    last = t;
    const grain = isMobileView() ? 0 : 0.045;
    const op = grain + burstT * 0.75;
    if (op <= 0.004) { canvas.style.opacity = '0'; return; }
    burstT *= 0.82;
    const img = ctx.createImageData(w, h);
    const buf = new Uint32Array(img.data.buffer);
    for (let i = 0; i < buf.length; i++) {
      const v = (Math.random() * 255) | 0;
      /* mostly dark static with occasional bone/vermilion pixels */
      buf[i] = (Math.random() < 0.06)
        ? (255 << 24) | (v << 16) | (v << 8) | v
        : (Math.random() < 0.012)
          ? (255 << 24) | (240 << 16) | (74 << 8) | 30
          : (255 << 24) | (v << 16) | (v << 8) | v;
    }
    ctx.putImageData(img, 0, 0);
    canvas.style.opacity = op.toFixed(3);
  }
  requestAnimationFrame(frame);
  return { burst(strength) { burstT = Math.min(1, Math.max(burstT, strength || 0.7)); } };
})();

/* ---------- act-boundary noise bursts ---------- */
(function () {
  if (reduceMotion) return;
  const marks = ['change', 'crash', 'replay', 'evidence', 'cli', 'demo']
    .map(id => document.getElementById(id)).filter(Boolean);
  const seen = new WeakSet();
  function check() {
    marks.forEach(el => {
      if (seen.has(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.62 && r.bottom > 0) {
        seen.add(el);
        Noise.burst(0.65);
      }
    });
  }
  let tick = false;
  window.addEventListener('scroll', () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => { check(); tick = false; });
  }, { passive: true });
})();

/* ---------- ACT II: THE CRASH — scroll-driven destruction ---------- */
(function () {
  const section = document.getElementById('crash');
  const stage = document.getElementById('crashStage');
  const page = document.getElementById('statusPage');
  const rowsEl = document.getElementById('spRows');
  const live = document.getElementById('spLive');
  const cracks = document.getElementById('crackSvg');
  const log = document.getElementById('crashLog');
  const linesEl = document.getElementById('clLines');
  const countEl = document.getElementById('clCount');
  const tailEl = document.getElementById('clTail');
  const caption = document.getElementById('crashCaption');
  if (!section || !stage || !page || !rowsEl || !log) return;

  const STRIPS = [
    { name: 'secret/license-data', kind: 'SECRET · V1 · NS LICENSE-SYSTEM', status: 'DELETED', origin: true, bar: 0 },
    { name: 'deploy/license-service', kind: 'DEPLOYMENT · 3 REPLICAS', status: 'HEALTHY', bar: .86 },
    { name: 'svc/license-service', kind: 'SERVICE · CLUSTERIP', status: 'HEALTHY', bar: .74 },
    { name: 'deploy/api-gateway', kind: 'DEPLOYMENT · APPS/V1', status: 'HEALTHY', bar: .68 },
    { name: 'deploy/billing-service', kind: 'DEPLOYMENT · APPS/V1', status: 'HEALTHY', bar: .81 },
    { name: 'deploy/worker', kind: 'DEPLOYMENT · APPS/V1', status: 'HEALTHY', bar: .52 },
    { name: 'ing/api', kind: 'INGRESS · NETWORKING.K8S.IO', status: 'HEALTHY', bar: .63 },
    { name: 'deploy/analytics', kind: 'DEPLOYMENT · APPS/V1', status: 'HEALTHY', bar: .44 }
  ];
  const stripEls = STRIPS.map((s, i) => {
    const d = document.createElement('div');
    d.className = 'sp-strip' + (s.origin ? ' origin' : '');
    d.innerHTML =
      '<span class="sp-name">' + s.name + '<span class="sp-kind">' + s.kind + '</span></span>' +
      '<span class="sp-bargraph"><i style="transform:scaleX(' + s.bar + ')"></i></span>' +
      '<span class="sp-pill">' + s.status + '</span>';
    rowsEl.appendChild(d);
    return d;
  });
  /* deterministic tear directions / magnitudes per strip */
  const tear = stripEls.map((_, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    return { dir, mag: 300 + ((i * 173) % 5) * 120, rot: dir * (2 + (i % 3)), lift: ((i * 97) % 3 - 1) * 46 };
  });

  const LOG_LINES = [
    '[FATAL] deploy/license-service — secret mount unresolvable → CrashLoopBackOff',
    '[FATAL] svc/license-service    — endpoints drained (3/3 pods down)',
    '[WARN]  deploy/api-gateway     — entitlement checks → 503 cascade',
    '[FATAL] deploy/billing-service — invoice runs halted at license gate',
    '[WARN]  deploy/worker          — renewal retries exhausted',
    '[WARN]  ing/api                — upstream pool degraded',
    '[INFO]  deploy/analytics       — billing events dry up'
  ];

  /* phase thresholds */
  const FLIP0 = 0.07, FLIPSTEP = 0.033;      /* statuses flip FAULT one by one */
  const TEAR0 = 0.30, TEAR1 = 0.50;          /* strips tear apart */
  const CUT = 0.52;                          /* hard cut to the crash log */
  const LINE0 = 0.55, LINESTEP = 0.040;      /* log lines appear */
  const TAIL = 0.90;                         /* rewind hint */

  let wasCut = false;
  function progress() {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return clamp01(-r.top / Math.max(1, total));
  }
  function paint() {
    const p = progress();
    const mob = isMobileView() ? 0.5 : 1;

    /* caption fades as the page starts tearing */
    if (caption) caption.style.opacity = (1 - clamp01((p - 0.16) / 0.08)).toFixed(3);

    /* strip flips */
    stripEls.forEach((el, i) => {
      if (STRIPS[i].origin) return;
      const bad = p > FLIP0 + (i - 1) * FLIPSTEP;
      el.classList.toggle('fault', bad);
      const pill = el.querySelector('.sp-pill');
      const want = bad ? 'FAULT' : 'HEALTHY';
      if (pill.textContent !== want) pill.textContent = want;
    });
    if (live) {
      const dead = p > FLIP0;
      live.classList.toggle('dead', dead);
      const want = dead ? '● DEGRADED' : '● LIVE';
      if (live.textContent !== want) live.textContent = want;
    }

    /* tear phase: strips displace, cracks creep in */
    const tp = clamp01((p - TEAR0) / (TEAR1 - TEAR0));
    const tpEase = tp * tp;
    stripEls.forEach((el, i) => {
      const t = tear[i];
      const jx = tp > 0 ? Math.sin(p * 90 + i * 3.3) * 6 * tp : 0;  /* vibration */
      el.style.transform =
        'translate(' + ((t.dir * t.mag * tpEase * mob) + jx).toFixed(1) + 'px,' +
        (t.lift * tpEase * mob).toFixed(1) + 'px) rotate(' + (t.rot * tpEase).toFixed(2) + 'deg)';
      el.style.opacity = (1 - tpEase * 0.25).toFixed(3);
    });
    if (cracks) {
      cracks.style.opacity = clamp01((p - 0.28) / 0.10).toFixed(3);
      const cs = 1 + clamp01((p - 0.28) / 0.22) * 0.16;
      cracks.style.transform = 'scale(' + cs.toFixed(3) + ')';
    }

    /* hard cut to the crash log */
    const cut = p >= CUT;
    if (cut !== wasCut) {
      wasCut = cut;
      page.style.visibility = cut ? 'hidden' : 'visible';
      if (cracks) cracks.style.visibility = cut ? 'hidden' : 'visible';
      log.style.opacity = cut ? '1' : '0';
      log.style.visibility = cut ? 'visible' : 'hidden';
      log.classList.toggle('shudder', cut && !reduceMotion);
      if (cut) Noise.burst(1);
    }
    if (cut) {
      const lp = LOG_LINES.map((_, i) => p > LINE0 + i * LINESTEP);
      const txt = LOG_LINES.filter((_, i) => lp[i]).join('\n');
      if (linesEl.textContent !== txt) linesEl.textContent = txt;
      const cp = clamp01((p - LINE0) / (LINESTEP * LOG_LINES.length));
      const imp = Math.round(cp * 7);
      const hops = Math.round(cp * 3);
      const ev = Math.round(cp * 8);
      const ctxt = imp + ' IMPACTED · ' + hops + ' HOPS · ' + ev + ' EVIDENCE';
      if (countEl.textContent !== ctxt) countEl.textContent = ctxt;
      tailEl.classList.toggle('on', p > TAIL);
    }
  }
  if (reduceMotion) {
    /* static end state: full crash log */
    page.style.visibility = 'hidden';
    if (cracks) cracks.style.visibility = 'hidden';
    log.style.opacity = '1';
    log.style.visibility = 'visible';
    linesEl.textContent = LOG_LINES.join('\n');
    countEl.textContent = '7 IMPACTED · 3 HOPS · 8 EVIDENCE';
    tailEl.classList.add('on');
    if (caption) caption.style.opacity = '0';
    return;
  }
  let tick = false;
  const onScroll = () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      const r = section.getBoundingClientRect();
      if (r.bottom > -80 && r.top < window.innerHeight + 80) paint();
      tick = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint();
})();

/* ---------- ACT IV: the evidence ledger (paper) ---------- */
const RESOURCES = [
  { name: 'license-data', type: 'Secret (v1) · ns license-system', depLabel: 'CHANGE ORIGIN', sev: 'ORIGIN',
    details: [
      ['ROLE', 'Change origin — kubectl delete secret license-data, proposed at PR #412'],
      ['MOUNTED BY', 'license-service Deployment via envFrom.secretRef (3 replicas)'],
      ['STATUS', 'Origin of 7 impacted resources']
    ] },
  { name: 'license-service', type: 'Deployment (apps/v1) · 3 replicas', depLabel: 'DIRECT DEPENDENCY', sev: 'HIGH',
    details: [
      ['FAILURE PATH', 'envFrom.secretRef unresolvable — new pods fail the secret mount and CrashLoopBackOff on the next rollout'],
      ['EVIDENCE', 'spec.template.spec.containers[0].envFrom[0].secretRef.name = license-data'],
      ['STATUS', 'HIGH — blocking violation found']
    ] },
  { name: 'license-service', type: 'Service (v1) · ClusterIP', depLabel: 'DIRECT DEPENDENCY', sev: 'HIGH',
    details: [
      ['FAILURE PATH', 'Endpoints drain to zero as the 3 pods crash — ClusterIP has nothing left to route'],
      ['EVIDENCE', 'selector app=license-service matches only the crashing Deployment'],
      ['STATUS', 'HIGH']
    ] },
  { name: 'api-gateway', type: 'Deployment (apps/v1)', depLabel: 'HOP 2 · VIA license-service', sev: 'MEDIUM',
    details: [
      ['FAILURE PATH', 'Entitlement checks call the license-service API — 503s cascade to every authenticated request'],
      ['EVIDENCE', 'env LICENSE_URL = http://license-service:8080'],
      ['STATUS', 'MEDIUM']
    ] },
  { name: 'billing-service', type: 'Deployment (apps/v1)', depLabel: 'HOP 2 · VIA license-service', sev: 'HIGH',
    details: [
      ['FAILURE PATH', 'Invoice runs hard-gate on license validation — jobs halt and queue depth grows'],
      ['EVIDENCE', 'gRPC dial license-service:9090 in billing-worker config'],
      ['STATUS', 'HIGH']
    ] },
  { name: 'worker', type: 'Deployment (apps/v1)', depLabel: 'HOP 2 · VIA license-service', sev: 'MEDIUM',
    details: [
      ['FAILURE PATH', 'Nightly renewal jobs call license-service — retries exhaust, dead-letter queue fills'],
      ['EVIDENCE', 'CronJob schedule + LICENSE_URL env reference'],
      ['STATUS', 'MEDIUM']
    ] },
  { name: 'api', type: 'Ingress (networking.k8s.io)', depLabel: 'HOP 3 · VIA api-gateway', sev: 'MEDIUM',
    details: [
      ['FAILURE PATH', '/api/* routes degrade when the api-gateway upstream pool turns unhealthy'],
      ['EVIDENCE', 'Ingress backend service api-gateway:80'],
      ['STATUS', 'MEDIUM']
    ] },
  { name: 'analytics', type: 'Deployment (apps/v1)', depLabel: 'HOP 3 · VIA billing-service', sev: 'LOW',
    details: [
      ['FAILURE PATH', 'Billing events stop flowing — dashboards go stale, no user-facing outage'],
      ['EVIDENCE', 'Kafka topic billing.events producer = billing-service'],
      ['STATUS', 'LOW']
    ] }
];
(function () {
  const grid = document.getElementById('ledgerGrid');
  if (!grid) return;
  RESOURCES.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'res-card reveal';
    card.style.setProperty('--d', ((i % 3) * 90) + 'ms');
    const stampCls = (r.sev === 'HIGH' || r.sev === 'ORIGIN') ? '' : (r.sev === 'MEDIUM' ? ' med' : ' ok');
    card.innerHTML =
      '<span class="rc-stamp mono' + stampCls + '">' + r.sev + '</span>' +
      '<div class="rc-top"><span class="rc-tag mono">' + r.depLabel + '</span></div>' +
      '<p class="rc-name">' + r.name + '</p>' +
      '<p class="rc-type">' + r.type + '</p>' +
      '<div class="rc-details">' +
      r.details.map(d => '<div class="rc-d"><span class="l mono">' + d[0] + '</span><span class="v">' + d[1] + '</span></div>').join('') +
      '</div>';
    grid.appendChild(card);
  });
})();

/* ---------- CLI terminal (same scenario, same numbers) ---------- */
const CLI = {
  analyze: {
    cmd: 'whatbreaks analyze --pr 412',
    out: 'Analyzing infrastructure change...\n\n✓ Dependency graph loaded\n✓ 13 resources discovered\n✓ 12 relationships traced\n✓ 7 potential impacts found\n\nRISK     RESOURCE                    REASON\n----------------------------------------------------------------------\nHIGH     deploy/license-service    envFrom.secretRef unresolvable → CrashLoopBackOff\nHIGH     svc/license-service       endpoints drain to zero (3/3 pods crash)\nHIGH     deploy/billing-service    license check gates invoice runs\nMED      deploy/api-gateway        entitlement 503s cascade to edge\nMED      deploy/worker             renewal jobs exhaust retries\nMED      ing/api                   upstream pool degraded\nLOW      deploy/analytics          billing events dry up\n\nAnalysis complete. 3 hops · 8 evidence items · 1 blocking violation.'
  },
  blast: {
    cmd: 'whatbreaks blast-radius --resource secret/license-data -n license-system',
    out: 'Evaluating downstream blast propagation from [secret/license-data]...\n\nDirect (Hop 1):\n  - deployment/license-service (mounts the secret, 3 replicas)\n  - service/license-service (endpoints drain)\n\nHop 2:\n  - deployment/api-gateway (via license-service API)\n  - deployment/billing-service (via license-service gRPC)\n  - deployment/worker (via license-service API)\n\nHop 3:\n  - ingress/api (via api-gateway)\n  - deployment/analytics (via billing-service)\n\nBlast Radius Summary: 7 impacted · 3 hops · 8 evidence items'
  },
  gate: {
    cmd: 'whatbreaks gate --pr 412 --strict',
    out: 'Evaluating CI deployment gate for PR #412...\n\nTarget Cluster:  k3d-demo\nChange Origin:   secret/license-data (delete) · ns license-system\n\n[RULE: no-unmitigated-high-risk]   FAILED\n  -> deploy/license-service will CrashLoopBackOff: secret mount unresolvable\n\n[RULE: endpoint-availability]      FAILED\n  -> svc/license-service loses all endpoints\n\nGate Decision: REJECTED (Exit Code 1)\nThe delete never reached the cluster.'
  }
};
(function () {
  let cliTab = 'analyze';
  let cliTimer = null;
  const cliCmd = document.getElementById('cliCmd');
  const cliOut = document.getElementById('cliOut');
  if (!cliCmd || !cliOut) return;
  function renderCli(typed) {
    if (cliTimer) { clearInterval(cliTimer); cliTimer = null; }
    const cmd = CLI[cliTab].cmd;
    if (typed && !reduceMotion) {
      cliCmd.textContent = '';
      cliOut.textContent = '';
      let i = 0;
      cliTimer = setInterval(() => {
        i += 1;
        cliCmd.textContent = cmd.slice(0, i);
        if (i >= cmd.length) {
          clearInterval(cliTimer); cliTimer = null;
          setTimeout(() => { cliOut.textContent = CLI[cliTab].out; }, 220);
        }
      }, 26);
    } else {
      cliCmd.textContent = cmd;
      cliOut.textContent = CLI[cliTab].out;
    }
  }
  document.querySelectorAll('#cliTabs .term-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('#cliTabs .term-tab').forEach(x => x.classList.remove('term-tab-active'));
      t.classList.add('term-tab-active');
      cliTab = t.dataset.tab;
      renderCli(true);
    });
  });
  const cliCopy = document.getElementById('cliCopy');
  if (cliCopy) cliCopy.addEventListener('click', () => {
    const text = '$ ' + CLI[cliTab].cmd;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        cliCopy.textContent = 'COPIED'; setTimeout(() => cliCopy.textContent = 'COPY', 2000);
      });
    }
  });
  const term = document.querySelector('.terminal');
  if (hasIO && !reduceMotion && term) {
    const tio = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { renderCli(true); tio.disconnect(); } });
    }, { threshold: 0.3 });
    tio.observe(term);
  } else {
    renderCli(false);
  }
})();

/* ---------- reveals ---------- */
(function () {
  const io = (hasIO && !reduceMotion) ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.06, rootMargin: '0px 0px -7% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach((el, i) => {
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', ((i % 5) * 55) + 'ms');
    if (io) io.observe(el); else el.classList.add('in');
  });
})();

/* ---------- mobile demo overlay ---------- */
(function () {
  const openBtn = document.getElementById('demoOpen');
  const overlay = document.getElementById('demoOverlay');
  const body = document.getElementById('demoOverlayBody');
  const closeBtn = document.getElementById('demoClose');
  if (!openBtn || !overlay || !body || !closeBtn) return;
  let frame = null;
  const openDemo = () => {
    if (!frame) {
      frame = document.createElement('iframe');
      frame.src = 'assets/demo-app/index.html';
      frame.title = 'WhatBreaks dashboard demo';
      body.appendChild(frame);
    }
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('demo-locked');
  };
  const closeDemo = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('demo-locked');
  };
  openBtn.addEventListener('click', openDemo);
  closeBtn.addEventListener('click', closeDemo);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDemo(); });
})();
