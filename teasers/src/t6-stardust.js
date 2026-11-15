// TEASER 6 — STARDUST
// A different technique from teasers 1–5: nothing is "drawn". The panther is 9,000 particles of gold dust in 3D.
// Each shape (eyes, 16 gallop poses, leap, face, title) is sampled into points; particles flow between them.
// The camera orbits in 3D, with motion-blur streaks, bokeh dust, bloom and lens flares. Every frame is a pure function of time.
const T = (() => {
  const N = 9000, K = 24, CAMD = 1500, BY = 115, ES = 0.95, FS = 1.25;
  const COL = ['#fff1cc', '#ffd68a', '#f0aa48', '#ffffff'];
  const R = [], L = [], eyeR = [], eyeL = [];
  let EYES, FACE, TITLE, TW = 1000, TS = 0.5, faceEye, h1, h2, h3, th, col, TAUT;
  const A3 = [0, 0, 0, 1], B3 = [0, 0, 0, 1];

  function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // draw a shape in white on black (brightness = dust density) and turn it into n points with pseudo-volume
  function sampleShape(w, h, draw, n, seed, ox, oy, sc, zk) {
    const g = mk(w, h).getContext('2d', { willReadFrequently: true }); g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.save(); draw(g); g.restore();
    const d = g.getImageData(0, 0, w, h).data, wt = new Float32Array(w * h), dist = new Float32Array(w * h), cum = new Float64Array(w * h);
    let tot = 0;
    for (let p = 0; p < w * h; p++) { const v = d[p * 4] / 255; wt[p] = v > 0.06 ? v : 0; dist[p] = wt[p] ? 999 : 0; tot += wt[p]; cum[p] = tot; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = y * w + x; if (dist[p]) dist[p] = Math.min(dist[p], (x ? dist[p - 1] : 0) + 1, (y ? dist[p - w] : 0) + 1); }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const p = y * w + x; if (dist[p]) dist[p] = Math.min(dist[p], (x < w - 1 ? dist[p + 1] : 0) + 1, (y < h - 1 ? dist[p + w] : 0) + 1); }
    const r = rng(seed), px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const u = r() * tot; let lo = 0, hi = w * h - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; }
      px[k] = (lo % w + r() - ox) * sc; py[k] = (Math.floor(lo / w) + r() - oy) * sc; pz[k] = (r() * 2 - 1) * Math.min(dist[lo], 34) * zk * sc;
    }
    // give particle i a similar place in every shape: order by x in columns, by y inside each column
    const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => px[a] - px[b]), per = Math.ceil(n / 48), out = new Float32Array(n * 3);
    for (let b = 0, o = 0; b < n; b += per) for (const i of idx.slice(b, b + per).sort((a, c) => py[a] - py[c])) { out[o++] = px[i]; out[o++] = py[i]; out[o++] = pz[i]; }
    return out;
  }
  const rig = (o, eyeCb) => g => {
    const P = buildPanther(Object.assign({ x: 0, y: 0, lift: 0, rot: 0, s: 1, t: 0, ph: 0, lu: 0, mode: 'run' }, o));
    g.translate(310, 270); g.lineJoin = 'round'; g.fillStyle = '#767676'; g.strokeStyle = '#fff'; g.lineWidth = 3;
    for (const grp of [P.far, P.main, P.near]) for (const p of grp) { g.fill(p); g.stroke(p); }
    const e = P.HM.transformPoint(new DOMPoint(27, -15)); eyeCb([e.x, e.y + BY]);
  };
  function eyeShape(g, cx, cy, dir, s) {
    const p = new Path2D(), ix = cx - dir * 92 * s, iy = cy + 26 * s, ox = cx + dir * 100 * s, oy = cy - 30 * s;
    p.moveTo(ix, iy); p.bezierCurveTo(cx - dir * 40 * s, cy - 55 * s, cx + dir * 50 * s, cy - 70 * s, ox, oy); p.bezierCurveTo(cx + dir * 55 * s, cy + 30 * s, cx - dir * 30 * s, cy + 52 * s, ix, iy); p.closePath();
    g.save(); g.fillStyle = '#8f8f8f'; g.fill(p); g.clip(p); g.fillStyle = '#000'; g.beginPath(); g.ellipse(cx + dir * 4 * s, cy - 8 * s, 20 * s, 54 * s, 0, 0, TAU); g.fill(); g.restore();
    g.strokeStyle = '#fff'; g.lineWidth = 5 * s; g.lineJoin = 'round'; g.stroke(p);
  }
  function faceShape(g) {
    g.translate(260, 275); g.lineJoin = 'round'; g.lineCap = 'round';
    const head = smooth(new Path2D(), [[-150, -40], [-165, 40], [-122, 128], [-52, 184], [0, 194], [52, 184], [122, 128], [165, 40], [150, -40], [108, -108], [0, -136], [-108, -108]]);
    for (const s of [-1, 1]) { const ear = smooth(new Path2D(), [[s * 158, -50], [s * 172, -150], [s * 150, -212], [s * 104, -170], [s * 52, -118]]); g.fillStyle = '#262626'; g.fill(ear); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(ear);
      g.fillStyle = '#4a4a4a'; g.fill(smooth(new Path2D(), [[s * 140, -92], [s * 152, -150], [s * 142, -178], [s * 108, -146], [s * 84, -114]])); }
    g.fillStyle = '#262626'; g.fill(head); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(head);
    g.strokeStyle = '#8a8a8a'; g.lineWidth = 2.4;                                   // brow, nose bridge and cheek lines
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 16, -92); g.quadraticCurveTo(s * 20, -20, s * 26, 58); g.stroke(); g.beginPath(); g.moveTo(s * 132, -70); g.quadraticCurveTo(s * 80, -84, s * 34, -56); g.stroke();
      g.beginPath(); g.moveTo(s * 150, 60); g.quadraticCurveTo(s * 110, 120, s * 60, 150); g.stroke(); }
    eyeShape(g, -80, -8, -1, 0.7); eyeShape(g, 80, -8, 1, 0.7);
    g.fillStyle = '#fff'; g.fill(smooth(new Path2D(), [[-26, 66], [0, 60], [26, 66], [10, 90], [0, 96], [-10, 90]]));
    g.strokeStyle = '#fff'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(0, 96); g.lineTo(0, 116); g.moveTo(-46, 124); g.quadraticCurveTo(-18, 140, 0, 116); g.quadraticCurveTo(18, 140, 46, 124); g.stroke();
    g.fillStyle = '#c8c8c8'; for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(s * (34 + (k % 3) * 16), 98 + Math.floor(k / 3) * 13 + (k % 3) * 3, 2.6, 0, TAU); g.fill(); }
    g.strokeStyle = '#b0b0b0'; g.lineWidth = 2; for (const s of [-1, 1]) for (const [y1, y2] of [[96, 70], [106, 104], [116, 140]]) { g.beginPath(); g.moveTo(s * 62, y1); g.quadraticCurveTo(s * 140, (y1 + y2) / 2 - 6, s * 236, y2); g.stroke(); }
  }

  function init() {
    const r = rng(7); h1 = new Float32Array(N); h2 = new Float32Array(N); h3 = new Float32Array(N); th = new Float32Array(N); col = new Uint8Array(N);
    for (let i = 0; i < N; i++) { h1[i] = r(); h2[i] = r(); h3[i] = r(); th[i] = r() * TAU; col[i] = r() < 0.1 ? 3 : Math.floor(r() * 3); }
    for (let k = 0; k < K; k++) R[k] = sampleShape(620, 290, rig({ ph: k / K }, e => eyeR[k] = e), N, 100 + k, 310, 270 - BY, 1, 0.85);
    [0.12, 0.5, 0.88].forEach((lu, j) => L[j] = sampleShape(620, 290, rig({ mode: 'leap', lu }, e => eyeL[j] = e), N, 200 + j, 310, 270 - BY, 1, 0.85));
    EYES = sampleShape(660, 260, g => { eyeShape(g, 170, 130, -1, 1.15); eyeShape(g, 490, 130, 1, 1.15); }, N, 300, 330, 130, ES, 0.25);
    FACE = sampleShape(520, 520, faceShape, N, 301, 260, 275, FS, 0.7);
    faceEye = new Uint8Array(N); for (let i = 0; i < N; i++) { const x = Math.abs(FACE[i * 3] / FS), y = FACE[i * 3 + 1] / FS; faceEye[i] = x > 8 && x < 156 && y > -62 && y < 36 ? 1 : 0; }
    TITLE = sampleShape(1100, 200, g => {
      let fs = 150; const f = () => { g.font = `700 ${fs}px "Palatino Linotype", "Book Antiqua", Georgia, serif`; g.letterSpacing = Math.round(fs * 0.1) + 'px'; };
      f(); const w = g.measureText('PANTHERA').width; if (w > 1040) { fs *= 1040 / w; f(); } TW = g.measureText('PANTHERA').width;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('PANTHERA', 550 + fs * 0.05, 104);
    }, N, 302, 550, 100, 1, 0.22);
    const n = Math.ceil((T.DUR + 1) * 120); TAUT = new Float64Array(n + 1); let tau = 0;
    for (let i = 0; i <= n; i++) { TAUT[i] = tau; tau += (1 - 0.8 * band(i / 120, 6.75, 8.4, 0.3, 0.3)) / 120; }   // slow motion during the leap
  }
  const tauAt = t => TAUT[clamp(Math.round(t * 120), 0, TAUT.length - 1)];
  const key = (k, t) => { if (t <= k[0][0]) return k[0][1]; for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], sm((t - k[i][0]) / (k[i + 1][0] - k[i][0]))); return k[k.length - 1][1]; };
  const eyeOpen = t => eOut((t - 0.15) / 0.45) * (1 - 0.94 * band(t, 1.25, 1.52, 0.08, 0.12));
  const faceOpen = t => 1 - 0.95 * band(t, 10.2, 10.47, 0.08, 0.12);

  // ---- the shapes, as functions of (particle, time)
  function fEyes(i, t, o) { const j = i * 3; o[0] = EYES[j]; o[1] = EYES[j + 1] * eyeOpen(t); o[2] = EYES[j + 2]; o[3] = 1.25; }
  function bodyPoint(a, b, fr, c, d, lr, j, t, o) {            // gallop pose blended with the leap pose
    let x = a[j] + (b[j] - a[j]) * fr, y = a[j + 1] + (b[j + 1] - a[j + 1]) * fr, z = a.length > 2 && j + 2 < a.length ? a[j + 2] + (b[j + 2] - a[j + 2]) * fr : 0;
    const wl = sm((t - 6.6) / 0.3);
    if (wl > 0) {
      const lu = clamp((t - 6.6) / 2, 0, 1), lx = c[j] + (d[j] - c[j]) * lr, ly = c[j + 1] + (d[j + 1] - c[j + 1]) * lr, lz = j + 2 < c.length ? c[j + 2] + (d[j + 2] - c[j + 2]) * lr : 0;
      const rot = -0.32 * Math.cos(Math.PI * lu), cs = Math.cos(rot), sn = Math.sin(rot);
      x += (lx * cs - ly * sn - x) * wl; y += (lx * sn + ly * cs - 175 * Math.sin(Math.PI * lu) - y) * wl; z += (lz - z) * wl;
    }
    o[0] = x; o[1] = y; o[2] = z;
  }
  let GAITT = null;
  function gait(t0) { const t = GAITT === null ? t0 : GAITT, f = ((tauAt(t) * 2.5) % 1) * K, k0 = Math.round(f) % K, lu = clamp((t - 6.6) / 2, 0, 1), lf = lu * 2, j0 = Math.min(1, Math.floor(lf)); return [k0, k0, 0, j0, lf - j0]; }
  let G = null, GT = -1;
  function fBody(i, t, o) {
    if (GT !== t) { G = gait(t); GT = t; }
    bodyPoint(R[G[0]], R[G[1]], G[2], L[G[3]], L[G[3] + 1], G[4], i * 3, t, o); o[3] = 1;
    if (i % 5 === 0) {                                          // one in five grains streams off the back as a comet tail
      const sA = sm((t - 2.9) / 0.6), age = (tauAt(t) * 0.8 + h1[i]) % 1, a = age * sA;
      o[0] -= a * (260 + 420 * h2[i]); o[1] += -a * a * 70 * (h3[i] - 0.3) + Math.sin(age * 8 + th[i]) * 18 * a; o[2] += Math.sin(age * 6 + th[i] * 2) * 60 * a; o[3] = 1 - 0.85 * a;
    }
  }
  function fFace(i, t, o) { const j = i * 3; o[0] = FACE[j]; o[1] = faceEye[i] ? -8 * FS + (FACE[j + 1] + 8 * FS) * faceOpen(t) : FACE[j + 1]; o[2] = FACE[j + 2]; o[3] = faceEye[i] ? 1.5 : 1; }
  function fTitle(i, t, o) {
    const j = i * 3, x = TITLE[j] * TS, sweep = lerp(-0.75, 0.75, (t - 13.1) / 1.3) * TW * TS, d = (x - sweep) / (46 * TS + 20);
    o[0] = x; o[1] = TITLE[j + 1] * TS; o[2] = TITLE[j + 2] * TS; o[3] = 0.82 + 1.5 * Math.exp(-d * d);
  }
  function trans(i, t, a, b, FA, FB, o, byX) {                  // flow from one shape to the next along a spiral
    FA(i, t, A3); FB(i, t, B3);
    const d = byX ? clamp(B3[0] / (TW * TS) + 0.5, 0, 1) * 0.8 + h1[i] * 0.2 : h1[i];
    const u = clamp((t - a - d * (b - a) * 0.45) / ((b - a) * 0.55), 0, 1), e = u * u * u * (u * (6 * u - 15) + 10);
    const s = Math.sin(Math.PI * e), rad = (70 + 230 * h2[i]) * s, ang = th[i] + 5 * e;
    o[0] = lerp(A3[0], B3[0], e) + Math.cos(ang) * rad; o[1] = lerp(A3[1], B3[1], e) + Math.sin(ang) * rad * 0.7; o[2] = lerp(A3[2], B3[2], e) + Math.sin(ang * 1.7 + 1) * rad; o[3] = lerp(A3[3], B3[3], e);
  }
  function P(i, t, o) {
    if (t < 2.1) fEyes(i, t, o); else if (t < 3.0) trans(i, t, 2.1, 3.0, fEyes, fBody, o);
    else if (t < 8.45) fBody(i, t, o); else if (t < 9.4) trans(i, t, 8.45, 9.4, fBody, fFace, o);
    else if (t < 11.3) fFace(i, t, o); else if (t < 12.5) trans(i, t, 11.3, 12.5, fFace, fTitle, o, true);
    else fTitle(i, t, o);
    o[0] += Math.sin(t * (1 + 2 * h1[i]) + th[i]) * 1.5; o[1] += Math.cos(t * (1.3 + 2 * h2[i]) + th[i] * 1.3) * 1.5;   // the dust is never quite still
  }

  // ---- camera
  const YAW = [[0, 0.06], [2.0, -0.05], [3.0, -0.55], [6.6, 0.3], [8.4, -0.75], [9.5, 0.22], [11.2, -0.2], [12.5, -0.25], [16, 0.1]];
  const PITCH = [[0, 0], [2.2, 0], [3.0, 0.14], [6.6, 0.1], [7.6, 0.22], [8.5, 0.1], [9.5, 0], [16, 0.04]];
  const ZOOM = [[0, 0.93], [2, 1.02], [3, 1.06], [6.6, 1.0], [7.6, 0.9], [8.5, 0.95], [9.5, 1.0], [11.2, 1.07], [12.5, 0.98], [16, 1.05]];
  const CY = [[0, 0.46], [2.2, 0.46], [3, 0.5], [8.5, 0.5], [9.5, 0.46], [11.3, 0.46], [12.5, 0.42], [16, 0.42]];
  const cam = { cy: 1, sy: 0, cp: 1, sp: 0, k: 1, y0: 0 };
  function proj(p, s) {
    const x1 = p[0] * cam.cy + p[2] * cam.sy, z1 = -p[0] * cam.sy + p[2] * cam.cy, y2 = p[1] * cam.cp - z1 * cam.sp, zc = p[1] * cam.sp + z1 * cam.cp + CAMD;
    if (zc < 280) return false; const k = CAMD / zc * cam.k; s[0] = W / 2 + x1 * k; s[1] = cam.y0 + y2 * k; s[2] = k; return true;
  }
  const sprite = (name, rgb, hard) => buf(name, 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(hard || 0.3, `rgba(${rgb},.35)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const starSprite = () => buf('star', 96, 96, (g) => {
    const gr = g.createRadialGradient(48, 48, 0, 48, 48, 22); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, 'rgba(255,230,170,.6)'); gr.addColorStop(1, 'rgba(255,230,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
    for (const horiz of [true, false]) { const l = g.createLinearGradient(horiz ? 0 : 48, horiz ? 48 : 0, horiz ? 96 : 48, horiz ? 48 : 96); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, '#fff'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; horiz ? g.fillRect(0, 46.5, 96, 3) : g.fillRect(46.5, 0, 3, 96); }
  });
  function glow(img, w, s, r, a, sq = 1) { if (a <= 0.003 || !proj(w, s)) return; X.globalAlpha = Math.min(1, a); const rr = r * s[2]; X.drawImage(img, s[0] - rr, s[1] - rr * sq, rr * 2, rr * 2 * sq); }

  function render(t) {
    const pu = Math.min(W * 0.8 / 480, H * 0.5 / 300), vert = H > W, tau = tauAt(t), spd = (tauAt(t + 1 / 120) - tauAt(t - 1 / 120)) * 60;
    TS = Math.min(W / pu * 0.88, 880) / TW;
    const yaw = key(YAW, t), pitch = key(PITCH, t), zoom = key(ZOOM, t) * (vert ? 1 : 0.94);
    cam.cy = Math.cos(yaw); cam.sy = Math.sin(yaw); cam.cp = Math.cos(pitch); cam.sp = Math.sin(pitch); cam.k = pu * zoom; cam.y0 = H * key(CY, t);
    const s0 = [0, 0, 0], s1 = [0, 0, 0], o = [0, 0, 0, 1], q = [0, 0, 0, 1], px = pu / 1.8;
    X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.filter = 'none'; X.shadowBlur = 0;
    const bg = X.createRadialGradient(W / 2, cam.y0, 0, W / 2, cam.y0, Math.hypot(W, H) * 0.62); bg.addColorStop(0, '#141b2c'); bg.addColorStop(0.5, '#070a13'); bg.addColorStop(1, '#010204');
    X.fillStyle = bg; X.fillRect(0, 0, W, H);
    X.globalCompositeOperation = 'lighter';
    const aura = sprite('aura', '255,190,90', 0.25); X.globalAlpha = 0.16; X.drawImage(aura, W / 2 - 520 * cam.k, cam.y0 - 420 * cam.k, 1040 * cam.k, 840 * cam.k);

    // a far ring of dust — a moon the panther runs past
    const runA = band(t, 2.8, 8.7, 0.6, 0.4);
    if (runA > 0) { const p = new Path2D(); for (let i = 0; i < 260; i++) { const a = i / 260 * TAU, rr = 330 + (hash(i, 4) - 0.5) * 14; if (proj([140 + Math.cos(a) * rr, -170 + Math.sin(a) * rr, 760], s0)) { const w = (1.5 + hash(i, 5) * 2.5) * px; p.rect(s0[0], s0[1], w, w); } }
      X.globalAlpha = 0.5 * runA; X.fillStyle = '#ffe2a6'; X.fill(p); }
    // drifting dust in depth, the nearest grains out of focus
    { const p = new Path2D(), bok = sprite('bokeh', '255,214,150', 0.75);
      for (let i = 0; i < 620; i++) {
        const x = ((((hash(i, 1) * 2400 - tau * 70 * (0.4 + hash(i, 6))) % 2400) + 2400) % 2400) - 1200, y = (hash(i, 2) - 0.5) * 1800 + Math.sin(t * 0.4 + i) * 18, z = (hash(i, 3) - 0.5) * 2000;
        if (!proj([x, y, z], s0)) continue; const rel = s0[2] / cam.k;
        if (rel > 1.45) { const rr = (5 + 14 * hash(i, 7)) * s0[2]; X.globalAlpha = 0.07 + 0.07 * hash(i, 8); X.drawImage(bok, s0[0] - rr, s0[1] - rr, rr * 2, rr * 2); }
        else { const w = (1.2 + 2 * hash(i, 9)) * px * rel; p.rect(s0[0], s0[1], w, w); }
      }
      X.globalAlpha = 0.42; X.fillStyle = '#d9c7a0'; X.fill(p); }
    // the ground: emerald streaks rushing under the paws
    if (runA > 0) { const near = new Path2D(), far = new Path2D();
      for (let gz = -5; gz <= 5; gz++) for (let gx = 0; gx < 26; gx++) {
        const wx = ((((gx * 70 + gz * 23 - tau * 900) % 1820) + 1820) % 1820) - 910, len = 10 + 80 * spd;
        if (!proj([wx, BY, gz * 95], s0) || !proj([wx + len, BY, gz * 95], s1)) continue;
        const p = Math.abs(wx) < 430 ? near : far; p.moveTo(s0[0], s0[1]); p.lineTo(s1[0], s1[1]);
      }
      X.lineCap = 'round'; X.strokeStyle = '#46e0b4'; X.lineWidth = 2 * px; X.globalAlpha = 0.6 * runA; X.stroke(near); X.globalAlpha = 0.22 * runA; X.stroke(far); }
    // emerald light behind the eyes
    const emer = sprite('emer', '70,255,190', 0.35), eo = eyeOpen(t), fo = faceOpen(t);
    const eA = band(t, 0.1, 2.5, 0.25, 0.5) * eo; for (const s of [-1, 1]) glow(emer, [s * 160 * ES, 0, 0], s0, 170, 0.36 * eA, 0.25 + 0.75 * eo);
    const fA = band(t, 9.1, 11.7, 0.45, 0.5) * fo; for (const s of [-1, 1]) glow(emer, [s * 80 * FS, -8 * FS, 0], s0, 80, 0.2 * fA, 0.3 + 0.7 * fo);
    const bA = band(t, 2.75, 8.55, 0.4, 0.12);
    if (bA > 0) { const g = gait(t), e = [0, 0, 0]; bodyPoint(eyeR[g[0]], eyeR[g[1]], g[2], eyeL[g[3]], eyeL[g[3] + 1], g[4], 0, t, e);
      glow(emer, e, s0, 30, 0.7 * bA); glow(sprite('white', '255,255,255', 0.2), e, s0, 13, bA); }

    // the 9,000 grains, each drawn as a streak from where it was to where it is
    GAITT = t; GT = -1;
    const NB = 6, paths = Array.from({ length: 4 * NB }, () => new Path2D()), sparks = [], maxL = 46 * px, dt = 1 / 45;
    for (let i = 0; i < N; i++) {
      P(i, t, o); if (!proj(o, s0)) continue; P(i, t - dt, q); if (!proj(q, s1)) continue;
      const w = (0.8 + 0.5 * h3[i] + 2.6 * h3[i] * h3[i] * h3[i]) * o[3] * s0[2] * 0.58; if (w < 0.45 * px) continue;
      let dx = s1[0] - s0[0], dy = s1[1] - s0[1]; const len = Math.hypot(dx, dy);
      if (len > maxL) { dx *= maxL / len; dy *= maxL / len; } else if (len < 0.5) { dx = -0.5; dy = 0; }
      const p = paths[col[i] * NB + clamp(Math.floor(Math.log(w / (1.1 * px)) / 0.37), 0, NB - 1)]; p.moveTo(s0[0] + dx, s0[1] + dy); p.lineTo(s0[0], s0[1]);
      if (i % 29 === 0) { const tw = Math.sin(t * (2 + 5 * h1[i]) + th[i] * 3); if (tw > 0.84) sparks.push(s0[0], s0[1], (tw - 0.84) / 0.16 * o[3] * (8 + 17 * h2[i]) * s0[2]); }
    }
    GAITT = null; GT = -1;
    X.lineCap = 'round'; X.globalAlpha = 0.62;
    for (let c = 0; c < 4; c++) for (let b = 0; b < NB; b++) { X.strokeStyle = COL[c]; X.lineWidth = 1.1 * px * Math.exp(0.37 * (b + 0.5)); X.stroke(paths[c * NB + b]); }
    const star = starSprite(); X.globalAlpha = 0.9; for (let k = 0; k < sparks.length; k += 3) { const r = sparks[k + 2]; X.drawImage(star, sparks[k] - r, sparks[k + 1] - r, r * 2, r * 2); }

    // lens flares on the three big beats
    for (const [t0, amp] of [[2.97, 0.9], [8.5, 1], [12.45, 1.15]]) if (t >= t0) { const a = Math.exp(-(t - t0) * 4.2) * amp; if (a < 0.01) continue;
      const fl = sprite('flare', '255,236,200', 0.12); X.globalAlpha = Math.min(1, a); X.drawImage(fl, W / 2 - W * 0.75, cam.y0 - 26 * px, W * 1.5, 52 * px); X.drawImage(fl, W / 2 - 260 * px, cam.y0 - 260 * px, 520 * px, 520 * px);
      X.globalAlpha = a * 0.16; X.fillStyle = '#fff'; X.fillRect(0, 0, W, H); }
    X.globalAlpha = 1; X.globalCompositeOperation = 'source-over';
    X.save(); POST.bloom(null, 0.6); X.restore(); X.save(); POST.vignette(null, 0.62); X.restore(); X.save(); POST.grain({ step: Math.floor(t * 30) }, 0.05); X.restore();

    // typography: thin, wide-spaced, quiet
    screenTf(X); const F = '"Segoe UI Light", "Segoe UI", "Helvetica Neue", Arial, sans-serif', cs = Math.min(27 * LS, VW * 0.043);
    const cap = (s, a, b, y) => { const al = band(t, a, b, 0.5, 0.5); if (al > 0) txt(X, s, 0, y, cs, { font: F, weight: 300, fill: '#f3e3bd', alpha: al * 0.92, spacing: cs * 0.42, maxW: VW * 0.9 }); };
    cap('IN THE DARK, TWO EYES OPEN', 0.5, 2.2, vert ? 640 : 760); cap('BORN OF STARLIGHT', 3.4, 6.3, vert ? 760 : 860);
    cap('NOTHING CAN HOLD IT', 6.9, 8.4, vert ? 760 : 860); cap('A NEW LEGEND AWAKENS', 9.7, 11.3, vert ? 800 : 900);
    if (t > 12.3) {
      const y = key(CY, t) * 1000 + 56 * TS * pu * zoom / U + 54 * LS, a = sm((t - 12.6) / 0.8), lw = VW * 0.3 * eOut((t - 12.5) / 1.1);
      const lg = X.createLinearGradient(-lw, 0, lw, 0); lg.addColorStop(0, 'rgba(255,214,138,0)'); lg.addColorStop(0.5, 'rgba(255,214,138,.95)'); lg.addColorStop(1, 'rgba(255,214,138,0)'); X.fillStyle = lg; X.fillRect(-lw, y - 34 * LS, lw * 2, 1.6);
      txt(X, 'STARDUST', 0, y + 8 * LS, Math.min(40 * LS, VW * 0.066), { font: F, weight: 300, fill: '#fbeecb', alpha: a, spacing: Math.min(40 * LS, VW * 0.066) * 0.9 });
      txt(X, 'COMING SOON', 0, y + 78 * LS, cs * 0.78, { font: F, weight: 400, fill: '#46e0b4', alpha: sm((t - 13.7) / 0.8) * 0.9, spacing: cs * 0.5 });
    }
  }

  function music(A) {
    const bell = (t, n, v = 1, pan = 0) => { A.tone(t, mtof(n), 1.6, { vol: 0.07 * v, a: 0.003, rev: 0.9, pan }); A.tone(t, mtof(n) * 2.76, 0.5, { vol: 0.018 * v, rev: 0.6, pan }); };
    const beat = (t, v = 1) => { A.kick(t, 0.75 * v); A.kick(t + 0.23, 0.5 * v); };
    A.tone(0, mtof(26), 16, { vol: 0.3, a: 2, r: 2 }); A.tone(0, mtof(38), 16, { type: 'sawtooth', lp: 170, vol: 0.13, a: 1.5, r: 2 });
    // 0–3: eyes open in the dark
    beat(0.15); beat(1.05); beat(1.85, 1.1); A.pad(0.15, [62, 69, 74], 2.7, { vol: 0.03, a: 0.8 });
    [86, 81, 88, 93, 86, 90, 98, 93].forEach((n, k) => bell(0.35 + k * 0.21, n, 0.7, k % 2 ? 0.5 : -0.5));
    A.noise(1.25, 0.25, { vol: 0.05, hp: 5000, a: 0.1 });
    A.riser(2.05, 2.97, 0.8); A.whoosh(2.3, 0.7, 0.8); A.impact(2.97, 0.85);
    // 3–6.6: the run
    const b = 0.45, roots = [38, 34, 41, 36], chords = [[62, 65, 69], [62, 65, 70], [60, 65, 69], [60, 64, 67]];
    for (let k = 0; k < 8; k++) { const t = 3 + k * b, c = Math.floor(k / 2); A.kick(t, 0.9); A.hat(t + b / 2, 0.7); A.hat(t + b / 4, 0.3); A.hat(t + 3 * b / 4, 0.3); if (k % 2) A.clap(t, 0.45);
      A.bass(t, roots[c], b / 2 * 0.9); A.bass(t + b / 2, roots[c] + 12, b / 2 * 0.9, { vol: 0.24 });
      for (let s = 0; s < 4; s++) A.pluck(t + s * b / 4, chords[c][(k * 4 + s) % 3] + 12 * (s % 2 + 1), { vol: 0.06, dur: 0.22, pan: s % 2 ? 0.4 : -0.4 });
      if (k % 2 === 0) A.pad(t, chords[c].map(n => n + 12), 2 * b, { vol: 0.04, a: 0.1, r: 0.3 }); }
    [[0, 81], [2, 77], [3, 74], [4, 72], [6, 76], [7, 79]].forEach(([k, n]) => bell(3 + k * b, n + 12, 1.3));
    // 6.6–8.5: the leap, in slow motion
    A.whoosh(6.35, 0.5, 0.8); A.tone(6.7, 220, 1.5, { slide: 50, slideT: 1.3, vol: 0.2, a: 0.02 }); A.kick(6.62, 1.1);
    A.pad(6.8, [74, 81, 86], 1.7, { vol: 0.04, a: 0.4, r: 0.4, lp: 3000 }); bell(7.1, 98, 1, -0.4); bell(7.5, 93, 1, 0.4); bell(7.9, 102, 1, 0);
    beat(7.25, 0.8); A.riser(7.8, 8.5, 0.9); A.impact(8.5, 1); A.boom(8.5, 0.7);
    // 9.4–11.3: face to face
    A.pad(9.2, [50, 57, 62, 65], 2.4, { vol: 0.05, a: 0.5, r: 0.6 }); A.tone(9.5, 55, 1.7, { type: 'sawtooth', lp: 320, vib: [24, 9], vol: 0.12, a: 0.3, r: 0.5 });
    bell(9.6, 86); bell(10.0, 89); bell(10.25, 98, 1.2, 0.3); bell(10.38, 105, 1.1, -0.3); beat(10.7, 0.8);
    // 11.3–16: the title assembles
    A.riser(11.3, 12.45, 1); A.whoosh(11.5, 0.9, 0.7); [62, 66, 69, 74, 78, 81, 86, 90].forEach((n, k) => bell(11.45 + k * 0.12, n + 12, 0.5 + k * 0.08, k / 4 - 1));
    A.impact(12.45, 1.1); A.boom(12.45, 0.9);
    A.pad(12.45, [50, 57, 62, 66, 69], 3.5, { vol: 0.055, a: 0.1, r: 1.6 }); A.bass(12.45, 26, 3.4, { vol: 0.3, r: 1.5, lp: 300 });
    [74, 78, 81, 86, 90, 93, 98].forEach((n, k) => bell(12.55 + k * 0.16, n, 1, k % 2 ? 0.5 : -0.5));
    for (let k = 0; k < 9; k++) A.noise(13.1 + k * 0.14, 0.3, { vol: 0.02, hp: 6000 + k * 500, a: 0.1, pan: k / 4 - 1 });   // the light sweeping across the letters
    bell(13.75, 86, 1.2); bell(14.2, 93, 1.2); beat(14.6, 0.7); bell(14.95, 98, 0.8);
  }
  return { name: 'STARDUST', DUR: 16, vol: 0.6, revLen: 3.6, init, render, music };
})();
