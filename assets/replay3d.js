/* WhatBreaks BREAK THE PAGE — ACT III: THE REPLAY. Real WebGL: the shattered
   graph flies back together, turns, then replays the blast hop by hop —
   nothing is deleted here, because the delete never reached a cluster. */
import * as THREE from './three.module.min.js';

(function () {
  const section = document.getElementById('replay');
  const canvas = document.getElementById('replayCanvas');
  if (!section || !canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = [0, 1, 2, 3, 4].map(i => document.getElementById('rp' + i));
  const rpChapter = document.getElementById('rpChapter');
  const rpCount = document.getElementById('rpCount');
  const labelLayer = document.getElementById('replayLabels');
  const ambient = document.getElementById('replayAmbient');

  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = t => t * t * (3 - 2 * t);

  /* ---------- graph data (same k3d-demo map, same numbers) ---------- */
  const RAW = [
    { id: 'licData',   x: 0,    y: 0,    n: 'license-data',    hop: 0 },
    { id: 'licDep',    x: 210,  y: 30,   n: 'license-service', hop: 1 },
    { id: 'licSvc',    x: 195,  y: -165, n: 'license-service', hop: 1 },
    { id: 'apiGw',     x: 470,  y: -80,  n: 'api-gateway',     hop: 2 },
    { id: 'billing',   x: 480,  y: 140,  n: 'billing-service', hop: 2 },
    { id: 'worker',    x: 240,  y: 290,  n: 'worker',          hop: 2 },
    { id: 'analytics', x: 740,  y: 180,  n: 'analytics',       hop: 3 },
    { id: 'apiIng',    x: 710,  y: -160, n: 'api',             hop: 3 },
    { id: 'postgres',  x: 730,  y: 360,  n: 'postgres',        hop: -1 },
    { id: 'pgCreds',   x: 480,  y: 340,  n: 'pg-credentials',  hop: -1 },
    { id: 'appCfg',    x: 40,   y: -310, n: 'app-config',      hop: -1 },
    { id: 'prom',      x: -300, y: 160,  n: 'prometheus',      hop: -1 },
    { id: 'grafana',   x: -540, y: 280,  n: 'grafana',         hop: -1 }
  ];
  const NODES = RAW.map((r, i) => ({ ...r, z: (((i * 137) % 5) - 2) * 80 }));
  /* deterministic shard start positions — the page in pieces */
  NODES.forEach((n, i) => {
    const a = i * 2.399963 + 0.6;
    const r = 700 + ((i * 197) % 5) * 170;
    n.sx = 100 + Math.cos(a) * r;
    n.sy = 25 + Math.sin(a) * r * 0.66;
    n.sz = (((i * 89) % 7) - 3) * 160;
  });
  const byId = {};
  NODES.forEach(n => byId[n.id] = n);
  const EDGES = [
    ['licDep', 'licData'], ['licSvc', 'licDep'], ['apiGw', 'licSvc'],
    ['billing', 'licDep'], ['worker', 'licDep'], ['analytics', 'billing'],
    ['apiIng', 'apiGw'], ['appCfg', 'licDep'], ['pgCreds', 'postgres'],
    ['prom', 'licDep'], ['prom', 'apiGw'], ['grafana', 'prom']
  ].map(([a, b]) => ({ a: byId[a], b: byId[b] }));
  const CX = 100, CY = 25;
  const LIC = byId.licData;

  /* ---------- scroll stage mapping ---------- */
  const asmAt   = p => smooth(clamp01((p - 0.05) / 0.25));   // shards -> graph
  const turnAt  = p => smooth(clamp01((p - 0.34) / 0.20));   // turntable
  const blastAt = p => smooth(clamp01((p - 0.58) / 0.28));   // replay the blast
  const dockAt  = p => smooth(clamp01((p - 0.90) / 0.10));   // pull back to verdict
  const hopThr  = h => [0.02, 0.12, 0.42, 0.72][h] || 0;

  /* ---------- chapter windows + HUD ---------- */
  const WIN = [
    [-0.020, 0.000, 0.065, 0.095],
    [ 0.115, 0.145, 0.260, 0.290],
    [ 0.340, 0.370, 0.500, 0.530],
    [ 0.580, 0.610, 0.830, 0.860],
    [ 0.880, 0.910, 1.020, 1.050]
  ];
  const winW = (p, w) => {
    const a = smooth(clamp01((p - w[0]) / (w[1] - w[0])));
    const b = smooth(clamp01((p - w[2]) / (w[3] - w[2])));
    return a * (1 - b);
  };
  const HUD_LABELS = [
    [0.00, 'WHATBREAKS REPLAY · CLUSTER k3d-demo'],
    [0.06, 'REASSEMBLY · 13 RESOURCES'],
    [0.34, 'THE GRAPH · 12 RELATIONSHIPS'],
    [0.58, 'BLAST REPLAY · 3 HOPS'],
    [0.90, 'REPLAY VERDICT']
  ];
  function hudAt(p) {
    let s = HUD_LABELS[0][1];
    for (const [q, l] of HUD_LABELS) if (p >= q) s = l;
    return s;
  }
  function paintOverlays(p, bt) {
    for (let i = 0; i < chapters.length; i++) {
      const el = chapters[i];
      if (!el) continue;
      const o = winW(p, WIN[i]);
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 0.004 ? 'visible' : 'hidden';
      el.style.transform = 'translateY(' + ((1 - o) * 16).toFixed(1) + 'px)';
      el.classList.toggle('on', o > 0.5);
    }
    if (rpChapter) rpChapter.textContent = hudAt(p);
    if (rpCount) {
      const show = p > 0.56 && p < 0.885;
      rpCount.classList.toggle('on', show);
      if (show) {
        let impacted = 0;
        if (bt > hopThr(1)) impacted += 2;
        if (bt > hopThr(2)) impacted += 3;
        if (bt > hopThr(3)) impacted += 2;
        const ev = Math.min(8, Math.floor(bt * 10));
        rpCount.textContent = impacted + ' IMPACTED · 3 HOPS · ' + ev + ' EVIDENCE';
      }
    }
  }

  /* ---------- blast choreography ---------- */
  function edgeBurn(e, bt) {
    const ha = e.a.hop, hb = e.b.hop;
    if (ha < 0 || hb < 0) return 0;
    const lo = Math.min(ha, hb), hi = Math.max(ha, hb);
    const t0 = hopThr(lo) + 0.02, t1 = hopThr(hi) + 0.14;
    if (bt <= t0) return 0;
    if (t1 <= t0) return 1;
    return Math.min(1, (bt - t0) / (t1 - t0));
  }

  /* ---------- renderer ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    section.classList.add('no-webgl');
    chapters.forEach((el, i) => {
      if (!el) return;
      const on = i === chapters.length - 1;
      el.style.opacity = on ? 1 : 0;
      el.style.visibility = on ? 'visible' : 'hidden';
      el.classList.toggle('on', on);
    });
    return;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090D, 0.00062);
  const camera = new THREE.PerspectiveCamera(55, 1, 8, 6000);

  scene.add(new THREE.AmbientLight(0x8a93a6, 0.85));
  const key = new THREE.DirectionalLight(0xF1EAD8, 1.5);
  key.position.set(400, 650, 900);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6E7E96, 0.7);
  rim.position.set(-500, -300, 400);
  scene.add(rim);
  const blastLight = new THREE.PointLight(0xF04A1E, 0, 1600, 1.7);
  blastLight.position.set(LIC.x, LIC.y, LIC.z + 40);
  scene.add(blastLight);

  const C_BONE = new THREE.Color(0xF1EAD8);
  const C_ACC = new THREE.Color(0xF04A1E);
  const C_INK = new THREE.Color(0x07090D);

  const graph = new THREE.Group();
  scene.add(graph);

  /* nodes — boxes, the origin a vermilion octahedron */
  const nodeMeshes = NODES.map((n, i) => {
    const isOrigin = n.hop === 0;
    const geo = isOrigin ? new THREE.OctahedronGeometry(30) : new THREE.BoxGeometry(24, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: isOrigin ? C_ACC.clone() : C_BONE.clone(),
      roughness: 0.55, metalness: 0.15,
      emissive: isOrigin ? C_ACC.clone() : C_BONE.clone(),
      emissiveIntensity: isOrigin ? 0.30 : 0.06,
      transparent: true, opacity: 1
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(n.sx, n.sy, n.sz);
    const core = new THREE.Mesh(
      isOrigin ? new THREE.OctahedronGeometry(13) : new THREE.BoxGeometry(9.5, 9.5, 9.5),
      new THREE.MeshStandardMaterial({ color: C_INK.clone(), roughness: 0.4, metalness: 0.3, transparent: true })
    );
    m.add(core);
    graph.add(m);
    return { n, m, mat, lit: 0, phase: i * 1.7, spin: 0.12 + (i % 4) * 0.05 };
  });

  /* edges: individual lines so they can draw on one by one */
  const SEG = 24;
  const edgeLines = EDGES.map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({
      color: 0xDDD6C4, transparent: true, opacity: 0
    }));
    graph.add(l);
    return l;
  });
  const burnLines = EDGES.map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({
      color: 0xFF6A3D, transparent: true, opacity: 0.95
    }));
    l.visible = false;
    graph.add(l);
    return l;
  });
  const pulses = EDGES.map(() => {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(5, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xFFAA78 })
    );
    s.visible = false;
    graph.add(s);
    return s;
  });

  /* dust field — the fragments of the broken page settling */
  let dust = null;
  function seedDust() {
    if (dust) { graph.remove(dust); dust.geometry.dispose(); dust.material.dispose(); }
    const n = window.innerWidth < 700 ? 380 : 720;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = CX - 1050 + Math.random() * 2300;
      pos[i * 3 + 1] = CY - 680 + Math.random() * 1360;
      pos[i * 3 + 2] = -520 + Math.random() * 940;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xDDD6C4, size: 3.4, sizeAttenuation: true,
      transparent: true, opacity: 0.4, depthWrite: false
    }));
    graph.add(dust);
  }
  seedDust();

  /* ripples at the origin during the replay */
  function flatRing(inner, outer, color, opacity) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 64),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
    );
    m.position.set(LIC.x, LIC.y, LIC.z);
    m.visible = false;
    graph.add(m);
    return m;
  }
  const ripples = [flatRing(0.94, 1, 0xFF6A3D, 0.5), flatRing(0.94, 1, 0xFF6A3D, 0.5), flatRing(0.94, 1, 0xFF6A3D, 0.5)];
  const originRing = flatRing(46, 49, 0xFF6A3D, 0.6);

  /* HTML labels projected from 3D */
  const labels = nodeMeshes.map(({ n }) => {
    const d = document.createElement('span');
    d.className = 'node-label mono';
    d.textContent = n.n;
    d.style.display = 'none';
    if (labelLayer) labelLayer.appendChild(d);
    return d;
  });

  /* ---------- sizing ---------- */
  let vw = 0, vh = 0;
  function resize() {
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.75 : 2));
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.fov = vw < 700 ? 70 : 55;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- camera ---------- */
  function camAt(p) {
    const a = asmAt(p), bt = blastAt(p), dk = dockAt(p);
    let r = 1620 - 570 * a;      // dolly in as the graph reassembles
    r += 430 * bt;               // pull back through the replay
    r += 150 * dk;               // final retreat for the verdict
    const ang = -0.05 + p * 0.30;
    const y = 130 - 55 * a + 40 * Math.sin(p * 2.2);
    return {
      pos: [CX + Math.sin(ang) * r, y, Math.cos(ang) * r],
      tgt: [CX, CY, 0]
    };
  }

  /* ---------- per-frame ---------- */
  const _v = new THREE.Vector3();
  const _va = new THREE.Vector3(), _vb = new THREE.Vector3();
  const FOG_D = 0.00062;
  let lastT = 0, sceneT = 0;

  function nodePos(nm, a, t, out) {
    const n = nm.n;
    const sa = smooth(clamp01(a * 1.35 - (nm.phase / 1.7) * 0.028));
    out.set(
      n.sx + (n.x - n.sx) * sa,
      n.sy + (n.y - n.sy) * sa + Math.sin(t * 0.00045 + nm.phase) * 7 * sa,
      n.sz + (n.z - n.sz) * sa
    );
    return out;
  }

  function renderFrame(p, t, dt) {
    const a = asmAt(p), tt = turnAt(p), bt = blastAt(p), dk = dockAt(p);
    const c = camAt(p);
    const sw = reduceMotion ? 0 : 1;

    graph.rotation.y = tt * Math.PI * 1.72 + sceneT * 0.00003 * sw;
    graph.rotation.x = Math.sin(tt * Math.PI) * 0.10;

    camera.position.set(
      c.pos[0] + Math.sin(t * 0.00042) * 7 * sw,
      c.pos[1] + Math.cos(t * 0.00037) * 5 * sw,
      c.pos[2]
    );
    camera.lookAt(c.tgt[0], c.tgt[1], c.tgt[2]);

    /* nodes: fly in, spin, light vermilion as the replay reaches them */
    for (let i = 0; i < nodeMeshes.length; i++) {
      const nm = nodeMeshes[i];
      nodePos(nm, a, sceneT, nm.m.position);
      nm.m.rotation.y += dt * nm.spin;
      nm.m.rotation.x += dt * nm.spin * 0.6;
      const isOrigin = nm.n.hop === 0;
      const target = isOrigin
        ? (bt > 0.02 ? 1 : 0)
        : (nm.n.hop > 0 && bt > hopThr(nm.n.hop)) ? 1 : 0;
      nm.lit += (target - nm.lit) * Math.min(1, dt * 5);
      nm.mat.color.lerpColors(C_BONE, C_ACC, Math.max(nm.lit, isOrigin ? 0.85 : 0));
      nm.mat.emissive.lerpColors(C_BONE, C_ACC, nm.lit);
      nm.mat.emissiveIntensity = isOrigin
        ? 0.30 + nm.lit * 0.55
        : 0.06 + nm.lit * 0.65;
      if (nm.lit > 0.02) {
        const pulse = 1 + Math.sin(sceneT * 0.006 + nm.phase) * 0.05 * nm.lit;
        nm.m.scale.setScalar(pulse);
      } else {
        nm.m.scale.setScalar(1);
      }
    }

    /* edges: draw on during assembly, then the replay burns over the top */
    for (let i = 0; i < EDGES.length; i++) {
      const e = EDGES[i];
      const na = nodeMeshes[NODES.indexOf(e.a)], nb = nodeMeshes[NODES.indexOf(e.b)];
      nodePos(na, a, sceneT, _va);
      nodePos(nb, a, sceneT, _vb);

      const el = edgeLines[i];
      const grow = smooth(clamp01(a * 1.6 - 0.42 - i * 0.045));
      el.material.opacity = 0.32 * grow;
      el.visible = grow > 0.01;
      if (el.visible) {
        const arr = el.geometry.attributes.position.array;
        for (let k = 0; k < SEG; k++) {
          const f = k / (SEG - 1);
          arr[k * 3] = _va.x + (_vb.x - _va.x) * f;
          arr[k * 3 + 1] = _va.y + (_vb.y - _va.y) * f;
          arr[k * 3 + 2] = _va.z + (_vb.z - _va.z) * f;
        }
        el.geometry.attributes.position.needsUpdate = true;
        el.geometry.setDrawRange(0, Math.max(2, Math.round(grow * (SEG - 1)) + 1));
      }

      const burn = edgeBurn(e, bt);
      const bl = burnLines[i], pu = pulses[i];
      if (burn > 0) {
        bl.visible = true;
        const arr = bl.geometry.attributes.position.array;
        for (let k = 0; k < SEG; k++) {
          const f = k / (SEG - 1);
          arr[k * 3] = _va.x + (_vb.x - _va.x) * f;
          arr[k * 3 + 1] = _va.y + (_vb.y - _va.y) * f;
          arr[k * 3 + 2] = _va.z + (_vb.z - _va.z) * f;
        }
        bl.geometry.attributes.position.needsUpdate = true;
        bl.geometry.setDrawRange(0, Math.max(2, Math.round(burn * (SEG - 1)) + 1));
        if (burn < 1) {
          pu.visible = true;
          pu.position.set(
            _va.x + (_vb.x - _va.x) * burn,
            _va.y + (_vb.y - _va.y) * burn,
            _va.z + (_vb.z - _va.z) * burn
          );
        } else pu.visible = false;
      } else { bl.visible = false; pu.visible = false; }
    }

    /* replay atmosphere */
    blastLight.intensity = 900 * bt;
    if (ambient) ambient.style.opacity = (bt * 0.9 * (1 - dk * 0.5)).toFixed(3);

    /* origin marker ring once assembled; ripples during the replay */
    const marker = a > 0.9 && dk < 1 ? 1 - bt * 0.4 : 0;
    originRing.visible = marker > 0.02;
    if (originRing.visible) {
      originRing.material.opacity = marker * (0.45 + 0.2 * Math.sin(sceneT * 0.004));
      originRing.scale.setScalar(1 + Math.sin(sceneT * 0.0026) * 0.06 + bt * 0.8);
      originRing.quaternion.copy(camera.quaternion);
    }
    if (bt > 0.06) {
      for (let i = 0; i < 3; i++) {
        const rr = Math.min(1, Math.max(0, bt * 2.6 - i * 0.55));
        const ring = ripples[i];
        if (rr > 0 && rr < 1) {
          ring.visible = true;
          ring.scale.setScalar(30 + rr * 340);
          ring.material.opacity = (1 - rr) * 0.5;
          ring.quaternion.copy(camera.quaternion);
        } else ring.visible = false;
      }
    } else {
      ripples.forEach(r => r.visible = false);
    }

    /* dust settles as the page reassembles */
    if (dust) {
      dust.position.x = Math.sin(sceneT * 0.00005) * 24;
      dust.material.opacity = 0.4 * (1 - a * 0.55);
    }

    renderer.render(scene, camera);

    /* project labels */
    const labelVis = smooth(clamp01((a - 0.5) / 0.3));
    for (let i = 0; i < nodeMeshes.length; i++) {
      const nm = nodeMeshes[i], el = labels[i];
      if (!el) continue;
      const alpha = labelVis;
      if (alpha < 0.04) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
      nm.m.getWorldPosition(_v);
      const dist = camera.position.distanceTo(_v);
      if (dist > 1500) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
      _v.project(camera);
      if (_v.z > 1 || _v.x < -1.02 || _v.x > 1.02 || _v.y < -1.02 || _v.y > 1.02) {
        if (el.style.display !== 'none') el.style.display = 'none';
        continue;
      }
      const fogF = Math.exp(-Math.pow(dist * FOG_D, 2));
      const a2 = Math.min(1, fogF * 1.7) * alpha * (dist > 1380 ? (1500 - dist) / 120 : 1);
      if (a2 < 0.06) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
      el.style.display = 'block';
      el.style.opacity = a2.toFixed(3);
      el.classList.toggle('lit', nm.lit > 0.5);
      el.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * vw + 20).toFixed(1) + 'px,' +
        ((-_v.y * 0.5 + 0.5) * vh - 6).toFixed(1) + 'px)';
    }
  }

  function progress() {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return clamp01(-r.top / Math.max(1, total));
  }

  if (reduceMotion) {
    renderFrame(0.95, 1000, 0.016);
    paintOverlays(0.95, blastAt(0.95));
    chapters.forEach((el, i) => {
      if (!el) return;
      const on = i === chapters.length - 1;
      el.style.opacity = on ? 1 : 0;
      el.style.visibility = on ? 'visible' : 'hidden';
      el.classList.toggle('on', on);
    });
    return;
  }

  let rafId = 0;
  function loop(t) {
    rafId = requestAnimationFrame(loop);
    const r = section.getBoundingClientRect();
    if (r.bottom < -80 || r.top > window.innerHeight + 80) { lastT = t; return; }
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    const p = progress();
    sceneT += dt * 1000;
    renderFrame(p, t, dt);
    paintOverlays(p, blastAt(p));
  }
  rafId = requestAnimationFrame(loop);
})();
