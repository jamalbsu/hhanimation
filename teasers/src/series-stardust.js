// STARDUST SERIES KIT — shared by the episode files s1…s5 (built on engine.js).
// The panther is a drawn character; stardust is one element of the show: a glowing trail, landing bursts,
// a little star friend, a world that lights up where the panther has run, a dust panther in the sky, and a title made of dust.
const SDC = ['#fff4d6', '#ffd98a', '#f3b14e', '#ffffff'];
const sdSprite = (name, rgb, mid = 0.3) => buf(name, 96, 96, g => { const r = g.createRadialGradient(48, 48, 0, 48, 48, 48); r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(mid, `rgba(${rgb},.32)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 96, 96); });
function sdGlow(c, x, y, r, rgb, a) { if (a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(sdSprite('g' + rgb, rgb), x - r, y - r, r * 2, r * 2); c.restore(); }
function sdStar(c, x, y, r, a = 1, rgb = '255,220,150') {
  if (a <= 0.01 || r <= 0.2) return; sdGlow(c, x, y, r * 2.4, rgb, a * 0.8);
  c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = '#fffdf2'; c.beginPath();
  for (let k = 0; k < 8; k++) { const rr = k % 2 ? r * 0.24 : r, an = k * Math.PI / 4 - Math.PI / 2; c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
  c.closePath(); c.fill(); c.restore();
}
function sdSample(w, h, draw, n, seed) {          // n points inside a white-on-black drawing
  const g = mk(w, h).getContext('2d', { willReadFrequently: true }); g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.save(); draw(g); g.restore();
  const d = g.getImageData(0, 0, w, h).data, out = new Float32Array(n * 2); let k = 0, s = 0;
  while (k < n && s < n * 80) { const x = hash(++s, seed) * w, y = hash(s, seed + 7) * h; if (d[(Math.floor(y) * w + Math.floor(x)) * 4] > 100) { out[k * 2] = x; out[k * 2 + 1] = y; k++; } }
  return out;
}
const sdLift = t => { const s = T.shots[shotIdx(t)]; return s.mode === 'leap' ? (s.leap || 220) * Math.sin(Math.PI * clamp((t - s.t[0]) / (s.t[1] - s.t[0]), 0, 1)) : 0; };
function sdTrail(c, st) {                         // dust shed along the path the panther actually ran
  const rate = 230, life = 2.0, S = SC(), gy = T.gy;
  for (let j = Math.max(0, Math.floor((st.t - life) * rate)); j < st.t * rate; j++) {
    const tj = j / rate, age = st.t - tj; if (speedAt(tj) < 60) continue;
    const u = age / life, x = panXAt(tj) + (hash(j, 1) * 230 - 150) * S - age * 40 * hash(j, 3), y = gy - (30 + hash(j, 2) * 130) * S - sdLift(tj) - age * (8 + 34 * hash(j, 4)) + Math.sin(age * 4 + j) * 7;
    const r = (2 + 5 * hash(j, 5) * hash(j, 5)) * (1 - u * 0.7), a = clamp((1 - u) * (0.55 + 0.45 * Math.sin(st.t * 9 + j)), 0, 1);
    if (j % 17 === 0) { sdStar(c, x, y, r * 3.4, a * 0.9); continue; }
    c.globalAlpha = a; c.fillStyle = SDC[j & 3]; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}
function sdBurst(c, st, t0, x, y, n = 90, pw = 1) {
  const age = st.t - t0, life = 1.5; if (age < 0 || age > life) return; const e = eOut(age / life);
  for (let k = 0; k < n; k++) {
    const an = hash(k, t0) * TAU, sp = (50 + 250 * hash(k, t0 + 2)) * pw, px = x + Math.cos(an) * sp * e, py = y + Math.sin(an) * sp * e * 0.75 - 40 * e + 70 * age * age, a = (1 - age / life) * (0.6 + 0.4 * Math.sin(st.t * 12 + k));
    if (k % 9 === 0) sdStar(c, px, py, 9 * (1 - age / life) + 2, a); else { c.globalAlpha = clamp(a, 0, 1); c.fillStyle = SDC[k & 3]; c.beginPath(); c.arc(px, py, 1.5 + 2.5 * hash(k, 8), 0, TAU); c.fill(); }
  }
  c.globalAlpha = 1;
}
// gentle, melodic score: music box, harp, warm bass, soft pad. m = { root, b (seconds per beat), mel: 16 pentatonic steps (null = rest) }
function sdMusic(A, m) {
  const b = m.b, root = m.root, PENT = [0, 2, 4, 7, 9], deg = i => root + 12 * Math.floor(i / 5) + PENT[((i % 5) + 5) % 5];
  const CH = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], BR = [0, 7, 9, 5], bar = t => ((Math.floor(t / (2 * b) + 1e-6) % 4) + 4) % 4;
  const box = (t, n, v = 1, pan = 0) => { A.tone(t, mtof(n), 1.1, { vol: 0.1 * v, a: 0.004, rev: 0.6, pan }); A.tone(t, mtof(n) * 3, 0.25, { vol: 0.018 * v, pan }); };
  const harp = (t, n, v = 1, pan = 0) => A.pluck(t, n, { type: 'triangle', vol: 0.12 * v, lp: 2600, lpTo: 500, fT: 0.4, dur: 0.8, rev: 0.45, pan });
  const warm = (t, n, d) => A.tone(t, mtof(n), d, { type: 'triangle', vol: 0.2, a: 0.02, r: 0.12, lp: 500 });
  const pad = (t, c, d, v = 1) => { for (const n of CH[c]) A.tone(t, mtof(root + n), d, { type: 'triangle', vol: 0.042 * v, a: Math.min(0.5, d / 3), r: Math.min(0.7, d / 2), rev: 0.6 }); A.tone(t, mtof(root + CH[c][0] + 12), d, { vol: 0.028 * v, a: Math.min(0.6, d / 3), r: Math.min(0.7, d / 2), rev: 0.6 }); };
  const gliss = (t, from, n, step, v = 0.6) => { for (let k = 0; k < n; k++) harp(t + k * step, deg(from + k), v * (0.6 + 0.4 * k / n), k / n - 0.5); };
  const section = (t0, t1, o) => {
    const e = b / 2, k0 = Math.ceil(t0 / e - 1e-6);
    for (let k = k0; k * e < t1 - 0.01; k++) {
      const t = k * e, c = bar(t), beat = k % 2 === 0;
      harp(t, root + CH[c][[0, 1, 2, 1][k & 3]] + 12, 0.75, k % 2 ? 0.35 : -0.35);
      if (beat) warm(t, root + BR[c] - 12, b * 0.9);
      if (o.drums) { if (beat) A.tone(t, 105, 0.3, { slide: 48, slideT: 0.1, vol: 0.3, a: 0.006 }); A.noise(t, 0.05, { vol: (beat ? 0.022 : 0.036), hp: 6500, a: 0.015 }); if (k % 4 === 2) A.tone(t, 1250, 0.03, { type: 'triangle', vol: 0.035 }); }
      if (o.mel) { const n = m.mel[(k - k0) % m.mel.length]; if (n !== null) box(t, deg(n) + (o.up ? 12 : 0), 0.95, ((k * 7) % 5) / 5 - 0.4); }
      if ((k % 4 === 0 || k === k0) && t1 - t > 0.3) pad(t, c, Math.min(2 * b, t1 - t), 0.9);
    }
  };
  [5, 6, 7, 8, 9, 10].forEach((d, k) => box(0.04 + k * 0.085, deg(d), 0.7, k / 5 - 0.5));
  section(0, 2, { drums: true }); section(2, 5, { drums: true, mel: true });
  section(5, 6.6, {}); A.noise(5, 0.9, { vol: 0.09, bp: 500, bpTo: 2200, q: 0.8, a: 0.5 }); gliss(5.05, 5, 9, 0.11, 0.5);
  A.tom(6.6, 130, 0.3); for (let k = 0; k < 9; k++) box(6.62 + k * 0.055, deg(8 + ((k * 3) % 7)), 0.55, hash(k, 3) - 0.5);
  for (let t = Math.ceil(6.7 / (2 * b)) * 2 * b; t < 8.9; t += 2 * b) pad(t, bar(t), Math.min(2 * b, 9 - t), 1.2);
  pad(6.65, bar(6.65), 0.9, 1);
  m.mel.filter(n => n !== null).slice(0, 5).forEach((n, k) => box(6.95 + k * b, deg(n), 0.8, k % 2 ? 0.3 : -0.3));
  box(7.5, deg(12), 0.6, 0.4); box(7.62, deg(14), 0.6, -0.4);
  section(9, 12.5, { drums: true, mel: true, up: true });
  gliss(12.5, 0, 13, 0.07, 0.7);
  for (const n of [0, 4, 7, 12, 16]) A.tone(13.4, mtof(root + n), 4.4, { type: 'triangle', vol: 0.045, a: 0.5, r: 2, rev: 0.6 });
  warm(13.4, root - 12, 3.6);
  [7, 9, 10, 12, 10, 12, 14, 15].forEach((d, k) => box(13.5 + k * b * (k > 4 ? 1.25 : 1), deg(d), 0.9, k % 2 ? 0.3 : -0.3));
  [15, 17, 19].forEach((d, k) => box(13.5 + 9.2 * b + k * 0.12, deg(d), 0.5, k / 2 - 0.5));
}

function StardustEpisode(cfg) {
  const P = cfg.pal, gy = 700, S = 0.75, F = '"Segoe UI Light", "Segoe UI", "Helvetica Neue", Arial, sans-serif', SERIF = '"Palatino Linotype", "Book Antiqua", Georgia, serif';
  let gap = [0, 0], titlePts = null, TWd = 1000, skyPts = null;
  const NT = 2600, lit = (px, x) => sm((px - x + 10) / 150), mix = (a, b, u) => `color-mix(in srgb, ${b} ${Math.round(u * 100)}%, ${a})`;
  const panFrac = st => 0.5 + (st.pan.x - st.cx) * st.z * U / W;

  function wake(c, x, i, r, l, t) {                 // things on the ground that wake up when the dust passes
    const pop = l * (1 + 0.3 * Math.sin(Math.PI * l)), sway = Math.sin(t * 1.7 + i) * 3 * l;
    c.lineCap = 'round';
    if (cfg.wake === 'flowers') {
      const h = 34 + r * 44, hx = x + sway, hy = gy - h; c.strokeStyle = P.rim; c.lineWidth = 3; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x - 4, gy - h * 0.5, hx, hy); c.stroke();
      sdGlow(c, hx, hy, 34, cfg.glow, 0.55 * l); c.fillStyle = mix('#2a3a5a', i % 3 ? P.accent : P.accent2, l);
      for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + i; c.beginPath(); c.arc(hx + Math.cos(a) * 8 * (0.25 + 0.75 * pop), hy + Math.sin(a) * 8 * (0.25 + 0.75 * pop), 3 + 4.5 * pop, 0, TAU); c.fill(); }
      c.fillStyle = mix('#3d4a66', '#fff2b8', l); c.beginPath(); c.arc(hx, hy, 3 + 2 * l, 0, TAU); c.fill();
    } else if (cfg.wake === 'lanterns') {
      const h = 22 + r * 40, w = 17 + r * 15; c.fillStyle = mix('#0c2a22', '#d8ffe6', l * 0.7); c.fillRect(x - 4, gy - h, 8, h);
      sdGlow(c, x, gy - h - 4, 46 + 20 * r, cfg.glow, 0.6 * l); c.fillStyle = mix('#12352b', i % 3 ? P.accent : P.accent2, l);
      c.beginPath(); c.ellipse(x, gy - h, w * (0.8 + 0.2 * pop), w * 0.72, 0, Math.PI, TAU); c.fill();
      c.fillStyle = mix('#1c463a', '#ffffff', l); for (const [dx, dy] of [[-w * 0.4, -w * 0.3], [w * 0.2, -w * 0.45], [w * 0.5, -w * 0.18]]) { c.beginPath(); c.arc(x + dx, gy - h + dy, 2.6, 0, TAU); c.fill(); }
    } else if (cfg.wake === 'footstars') {
      c.strokeStyle = P.rim; c.lineWidth = 2.4; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + k * 5, gy); c.quadraticCurveTo(x + k * 5 + 3 + sway, gy - 12, x + k * 6 - 6 + sway * 2, gy - 20 - hash(i, k) * 16); c.stroke(); }
      const sy = gy + 26 + r * 60; if (l > 0.02) sdStar(c, x + 30, sy, 10 * pop, l); else { c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x + 30, sy, 2.5, 0, TAU); c.fill(); }
    } else if (cfg.wake === 'crystals') {
      sdGlow(c, x, gy - 30, 70, cfg.glow, 0.5 * l);
      for (const [dx, hh, ww] of [[-14, 34 + r * 30, 9], [0, 56 + r * 44, 12], [15, 28 + r * 26, 8]]) {
        c.fillStyle = mix('#3f7396', '#e2fdff', l); c.beginPath(); c.moveTo(x + dx - ww, gy); c.lineTo(x + dx - ww * 0.5, gy - hh * 0.8); c.lineTo(x + dx, gy - hh * (0.9 + 0.1 * pop)); c.lineTo(x + dx + ww * 0.6, gy - hh * 0.75); c.lineTo(x + dx + ww, gy); c.fill();
        c.fillStyle = mix('#2c5878', P.accent, l); c.beginPath(); c.moveTo(x + dx, gy - hh * 0.9); c.lineTo(x + dx + ww * 0.6, gy - hh * 0.75); c.lineTo(x + dx + ww, gy); c.lineTo(x + dx, gy); c.fill();
      }
    } else {                                        // starflowers
      const h = 40 + r * 60, hx = x + sway * 1.5; c.strokeStyle = P.rim; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x + 6, gy - h * 0.5, hx, gy - h); c.stroke();
      if (l > 0.02) sdStar(c, hx, gy - h, (9 + 6 * r) * pop, l); else { c.fillStyle = '#4a4390'; c.beginPath(); c.arc(hx, gy - h, 3.5, 0, TAU); c.fill(); }
    }
  }
  function scenery(c, v, st) {                      // the middle distance, different in every episode
    const pf = panFrac(st), L = x => sm((pf - (x - v.x0) / (v.x1 - v.x0)) * 6), t = st.t;
    if (cfg.scene === 'meadow') tiles(v.x0, v.x1, 330, (x, i, r) => {
      const tx = x + r * 120, h = 150 + hash(i, 2) * 110, l = L(tx); c.fillStyle = P.mid; c.fillRect(tx - 8, 830 - h, 16, h);
      for (const [dx, dy, rr] of [[-42, 8, 52], [38, 0, 58], [0, -44, 62]]) { c.beginPath(); c.arc(tx + dx, 830 - h + dy, rr, 0, TAU); c.fill(); }
      for (let k = 0; k < 6; k++) sdStar(c, tx + (hash(i, k) - 0.5) * 170 + Math.sin(t + k) * 8, 830 - h - 30 + (hash(k, i) - 0.5) * 120 + Math.cos(t * 1.3 + k) * 8, 4, l * (0.5 + 0.5 * Math.sin(t * 3 + k * 2)));
    });
    else if (cfg.scene === 'forest') tiles(v.x0, v.x1, 210, (x, i, r) => {
      const tx = x + r * 90, w = 34 + hash(i, 2) * 40, l = L(tx); c.fillStyle = P.mid; c.fillRect(tx - w / 2, -300, w, 1200);
      for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(tx + (hash(i, k + 3) - 0.5) * 160, 140 + k * 60 + hash(k, i) * 60, 120, 60, 0, 0, TAU); c.fill(); }
      if (hash(i, 9) > 0.45) { const ey = 430 + hash(i, 10) * 180, open = l * (Math.sin(t * 1.3 + i * 2) > -0.93 ? 1 : 0.1);
        for (const s of [-1, 1]) { sdGlow(c, tx + s * 9, ey, 16, '255,215,120', 0.7 * l); c.fillStyle = '#ffe9a8'; c.globalAlpha = l; c.beginPath(); c.ellipse(tx + s * 9, ey, 6, 6 * open, 0, 0, TAU); c.fill(); c.fillStyle = '#1a1206'; c.beginPath(); c.ellipse(tx + s * 9, ey, 2.4, 2.4 * open, 0, 0, TAU); c.fill(); c.globalAlpha = 1; } }
    });
    else if (cfg.scene === 'dunes') { c.fillStyle = P.mid; c.beginPath(); c.moveTo(v.x0 - 80, 1200); for (let x = Math.floor(v.x0 / 40) * 40 - 40; x <= v.x1 + 40; x += 40) c.lineTo(x, 760 - 46 * Math.sin(x / 260) - 26 * Math.sin(x / 97 + 2)); c.lineTo(v.x1 + 80, 1200); c.fill();
      tiles(v.x0, v.x1, 620, (x, i, r) => { if (r < 0.4) return; const bx = x + r * 200, by = 760; c.strokeStyle = P.mid; c.lineWidth = 34; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx - 70, by + 40); c.quadraticCurveTo(bx - 60, by - 150 - r * 60, bx, by - 150 - r * 60); c.quadraticCurveTo(bx + 70, by - 150 - r * 60, bx + 76, by + 40); c.stroke(); sdStar(c, bx, by - 205 - r * 60, 8, L(bx)); }); }
    else if (cfg.scene === 'ice') tiles(v.x0, v.x1, 260, (x, i, r) => {
      const tx = x + r * 120, h = 220 + hash(i, 2) * 300, w = 50 + hash(i, 3) * 60, l = L(tx), g = c.createLinearGradient(0, 840 - h, 0, 840); g.addColorStop(0, '#5fa8cc'); g.addColorStop(1, P.mid);
      c.fillStyle = g; c.beginPath(); c.moveTo(tx - w, 860); c.lineTo(tx - w * 0.2, 840 - h); c.lineTo(tx + w * 0.3, 840 - h * 0.8); c.lineTo(tx + w, 860); c.fill();
      c.strokeStyle = P.accent; c.globalAlpha = 0.85 * l; c.lineWidth = 3; c.beginPath(); c.moveTo(tx - w, 860); c.lineTo(tx - w * 0.2, 840 - h); c.lineTo(tx + w * 0.3, 840 - h * 0.8); c.stroke(); c.globalAlpha = 1; sdStar(c, tx - w * 0.2, 840 - h, 7, l);
    });
    else tiles(v.x0, v.x1, 190, (x, i, r) => {      // peak: pines with a star on top
      const tx = x + r * 80, h = 190 + hash(i, 2) * 200, l = L(tx); c.fillStyle = P.mid; c.fillRect(tx - 6, 840 - h * 0.3, 12, h * 0.3);
      for (let k = 0; k < 4; k++) { const y0 = 840 - h * (0.25 + k * 0.19), ww = 70 - k * 14; c.beginPath(); c.moveTo(tx - ww, y0); c.lineTo(tx, y0 - h * 0.3); c.lineTo(tx + ww, y0); c.fill(); }
      sdStar(c, tx, 840 - h * 1.12, 8, l * (0.7 + 0.3 * Math.sin(t * 3 + i)));
    });
  }

  const T = {
    name: cfg.name, DUR: 18, gy, scale: S, vol: 1.2, revLen: 3,
    style: Object.assign({ mode: 'cel', fill: '#1a1630', far: '#0f0c20', near: '#221c3e', ink: '#07050f', ow: 2.6, hi: '#ffd98a', eye: '#ffcf5a', irisHi: '#7a4a00', earIn: '#6b4a8a', nose: '#07050f', whisk: '#ffe9b8', blush: true }, cfg.style),
    shadow: 'rgba(0,0,0,.28)', fxColor: '#ffe2a6',
    post: [['bloom', 0.5], ['vignette', 0.5], ['grain', 0.04]],
    shots: [
      { t: [0, 2], spd: 980, z: 1.5, cx: 70, cy: 590, speed: 'h', speedK: 0.4 },
      { t: [2, 5], spd: 680, z: [0.7, 0.78], cx: -30, cy: 470, px: -50 },
      { t: [5, 6.6], mode: 'leap', leap: 250, spd: 760, z: 0.98, cx: 40, cy: 560, follow: 0.4, tilt: 0.3 },
      { t: [6.6, 9], spd: 420, cam: 'head', z: [2.1, 2.5], hx: 34, hy: -24, blink: 7.5, sparkle: 7.7 },
      { t: [9, 12.5], spd: 900, z: [1.0, 0.8], px: [-200, 120], cy: [590, 500] },
      { t: [12.5, 18], mode: 'stand', spd: 0, snap: true, z: [1.25, 1.1], cx: 40, cy: 470 },
    ],
    init() {
      gap = [panXAt(5.05) + 110 * S, panXAt(6.55) + 40 * S];
      titlePts = sdSample(1000, 180, g => { let fs = 140; const f = () => { g.font = `700 ${fs}px ${SERIF}`; g.letterSpacing = Math.round(fs * 0.09) + 'px'; }; f(); const w = g.measureText('PANTHERA').width; if (w > 950) { fs *= 950 / w; f(); } TWd = g.measureText('PANTHERA').width;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('PANTHERA', 500 + fs * 0.045, 94); }, NT, 11);
      if (cfg.skyPanther) skyPts = Array.from({ length: 12 }, (_, k) => sdSample(620, 290, g => { const B = buildPanther({ x: 0, y: 0, lift: 0, rot: 0, s: 1, t: 0, ph: k / 12, lu: 0, mode: 'run' }); g.translate(310, 270); g.fillStyle = '#fff'; for (const grp of [B.far, B.main, B.near]) for (const p of grp) g.fill(p); }, 1100, 40 + k));
    },
    sky(c, st) {
      const t = st.t, g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, P.sky[0]); g.addColorStop(0.55, P.sky[1]); g.addColorStop(1, P.sky[2]); c.fillStyle = g; c.fillRect(-VW, 0, VW * 2, 1000);
      for (let i = 0; i < 130; i++) { const a = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.6 + hash(i, 3) * 1.6) + i)), s = 1 + hash(i, 4) * 2.4; c.globalAlpha = a; c.fillStyle = hash(i, 6) > 0.6 ? '#ffe7b0' : '#ffffff'; c.fillRect((hash(i, 1) - 0.5) * VW * 1.05, hash(i, 2) * 620, s, s); }
      c.globalAlpha = 1;
      if (cfg.moon) { const mx = VW * cfg.moon[0], my = cfg.moon[1], mr = cfg.moon[2]; sdGlow(c, mx, my, mr * 3, '255,240,200', 0.5); c.fillStyle = cfg.moon[3] || '#fff6da'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
        c.fillStyle = 'rgba(160,140,110,.25)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.2], [0.25, 0.1, 0.26], [-0.1, 0.4, 0.14]]) { c.beginPath(); c.arc(mx + dx * mr, my + dy * mr, rr * mr, 0, TAU); c.fill(); } }
      if (cfg.aurora) { const k = cfg.aurora === 'wake' ? sm((t - 8.6) / 3) : 0.8; c.save(); c.globalCompositeOperation = 'lighter';
        for (let r = 0; r < 3; r++) for (let x = -VW / 2 - 10; x < VW / 2 + 10; x += 9) { const y0 = 120 + r * 70 + Math.sin(x * 0.011 + t * 0.5 + r * 2) * 60 + Math.sin(x * 0.03 - t * 0.8) * 16, hh = 190 + 70 * Math.sin(x * 0.02 + t + r);
          const gr = c.createLinearGradient(0, y0, 0, y0 + hh); gr.addColorStop(0, ['rgba(90,255,190,0)', 'rgba(150,120,255,0)', 'rgba(90,220,255,0)'][r]); gr.addColorStop(0.25, ['rgba(90,255,190,.11)', 'rgba(150,120,255,.09)', 'rgba(90,220,255,.09)'][r]); gr.addColorStop(1, 'rgba(0,0,0,0)');
          c.globalAlpha = k; c.fillStyle = gr; c.fillRect(x, y0, 10, hh); }
        c.restore(); }
      if (cfg.meteor && t < 1.3) { const u = eOut(t / 0.9), x = lerp(VW * 0.5, -VW * 0.12, u), y = lerp(20, 440, u), a = 1 - sm((t - 0.9) / 0.4); const gr = c.createLinearGradient(x + 170, y - 130, x, y); gr.addColorStop(0, 'rgba(255,230,170,0)'); gr.addColorStop(1, 'rgba(255,244,214,1)');
        c.globalAlpha = a; c.strokeStyle = gr; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 170, y - 130); c.lineTo(x, y); c.stroke(); c.globalAlpha = 1; sdStar(c, x, y, 26, a); }
      if (skyPts) { const a = band(t, cfg.skyPanther[0], cfg.skyPanther[1], 0.9, 0.9); if (a > 0) { const pts = skyPts[Math.floor(PHat(st.ta) * 12) % 12], sc = Math.min(1.05, VW / 560), ox = -20, oy = 400;
          c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#ffe6ad';
          for (let i = 0; i < 1100; i++) { const x = ox + (pts[i * 2] - 310) * sc, y = oy + (pts[i * 2 + 1] - 160) * sc, tw = 0.45 + 0.55 * Math.sin(t * 5 + i * 1.7); if (i % 70 === 0) { sdStar(c, x, y, 8, a); continue; } c.globalAlpha = a * tw; c.fillRect(x, y, 2.4, 2.4); }
          c.restore(); } }
    },
    layers: [
      { p: 0.1, draw(c, v) { const R = cfg.ridge; c.fillStyle = P.far; c.beginPath(); c.moveTo(v.x0 - 100, 1200);
        for (let x = Math.floor(v.x0 / 40) * 40 - 40; x <= v.x1 + 40; x += 40) c.lineTo(x, 715 - R[0] * (0.55 + 0.45 * Math.sin(x / R[1]) + 0.25 * Math.sin(x / (R[1] * 0.37) + 1)) - R[2] * hash(Math.round(x / 40), 3));
        c.lineTo(v.x1 + 100, 1200); c.fill(); } },
      { p: 0.35, draw: scenery },
      { p: 1, draw(c, v, st) {
        const px = st.pan.x, t = st.t, [g0, g1] = gap;
        if (g0 < v.x1 && g1 > v.x0) { const gg = c.createLinearGradient(0, gy, 0, gy + 500); gg.addColorStop(0, P.gap); gg.addColorStop(1, P.ground[1]); c.fillStyle = gg; c.fillRect(g0 - 4, gy + 26, g1 - g0 + 8, 1200);
          for (let k = 0; k < 46; k++) sdStar(c, lerp(g0 + 12, g1 - 12, hash(k, 1)), gy + 44 + hash(k, 2) * 330, 2 + 5 * hash(k, 3), 0.25 + 0.75 * Math.abs(Math.sin(t * 2 + k * 1.3))); }
        for (const [a, b] of [[v.x0 - 60, Math.min(g0, v.x1 + 60)], [Math.max(g1, v.x0 - 60), v.x1 + 60]]) { if (b <= a) continue;
          const gr = c.createLinearGradient(0, gy, 0, gy + 520); gr.addColorStop(0, P.ground[0]); gr.addColorStop(1, P.ground[1]); c.fillStyle = gr; c.fillRect(a, gy, b - a, 1300);
          c.fillStyle = P.rim; c.fillRect(a, gy - 3, b - a, 7);
          const e = Math.min(b, px); if (e > a) { const s0 = Math.max(a, px - 1000), lg = c.createLinearGradient(px - 1000, 0, px, 0); lg.addColorStop(0, 'rgba(255,217,138,0)'); lg.addColorStop(1, 'rgba(255,217,138,.9)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = lg; c.fillRect(s0, gy - 4, e - s0, 8); c.restore(); }
          tiles(Math.max(a, v.x0), Math.min(b, v.x1), 95, (x, i, r) => { const xx = x + r * 40; if (xx > a + 34 && xx < b - 44) wake(c, xx, i, r, lit(px, xx), t); }, 1, 7);
        }
      } },
      { p: 1.5, draw(c, v, st) { if (st.sh.cam === 'head') return; c.strokeStyle = P.fg || '#03040a'; c.lineCap = 'round';
        tiles(v.x0, v.x1, 640, (x, i, r) => { if (r < 0.35) return; for (let k = 0; k < 7; k++) { const bx = x + k * 20, h = 170 + hash(i, k) * 220, lean = (k - 3) * 22 + Math.sin(st.t * 1.5 + k) * 8; c.lineWidth = 9 - k * 0.5; c.beginPath(); c.moveTo(bx, 1140); c.quadraticCurveTo(bx + lean * 0.3, 1140 - h * 0.6, bx + lean, 1140 - h); c.stroke(); } }); } },
    ],
    beforePanther(c, v, st) {
      if (cfg.reflect) { c.save(); c.globalAlpha = 0.3; c.translate(0, 2 * gy + 6); c.scale(1, -1); drawPanther(c, Object.assign({}, st.pan), { mode: 'sil', fill: '#1d4468', far: '#1d4468', eye: '#1d4468' }, v.k * S); c.restore(); }
      c.save(); c.globalCompositeOperation = 'lighter'; sdTrail(c, st); c.restore();
    },
    afterPanther(c, v, st) {
      const t = st.t, h = st.pan.P.head, close = st.sh.cam === 'head', j = cfg.buddyAt ?? -99;
      c.save(); c.globalCompositeOperation = 'lighter'; sdBurst(c, st, 6.6, panXAt(6.6) + 50 * S, gy - 6); if (!cfg.meteor) sdBurst(c, st, 0.02, panXAt(0.02) + 60 * S, gy - 90 * S, 70, 0.8); sdBurst(c, st, 12.5, panXAt(12.5), gy - 60, 60, 0.7); c.restore();
      if (t < j - 2.4) return;                      // the little star friend
      let x = h[0] + (close ? 100 : -34) * S + Math.sin(t * 2.1) * 9 * S, y = h[1] - (close ? 14 : 96) * S + Math.sin(t * 3.3) * 7 * S, r = (close ? 13 : 17) * S * (1 + 0.12 * Math.sin(t * 6));
      if (t < j) { const u = sm((t - (j - 2.4)) / 2.4); x = lerp(v.x1 - 70, x, u); y = lerp(v.y0 + 110, y, u); }
      for (let k = 1; k < 7; k++) sdStar(c, x - k * 9 * S + Math.sin(t * 5 + k) * 3, y + k * 3 * S + Math.cos(t * 4 + k) * 3, r * 0.3 * (1 - k / 8), 0.7 * (1 - k / 7));
      sdStar(c, x, y, r, 1, '255,225,150');
      if (close) { c.fillStyle = '#6b3a12'; for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * r * 0.2, y - r * 0.05, r * 0.07, 0, TAU); c.fill(); } c.strokeStyle = '#6b3a12'; c.lineWidth = r * 0.05; c.lineCap = 'round'; c.beginPath(); c.arc(x, y + r * 0.06, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    },
    overlay(c, st) {
      const t = st.t, vert = H > W, cs = Math.min(31 * LS, VW * 0.05), gold = '#f6e6c0';
      txt(c, 'STARDUST  ·  EPISODE ' + cfg.ep, 0, 52, cs * 0.7, { font: F, weight: 600, fill: gold, alpha: 0.8 * (1 - sm((t - 12.4) / 0.5)), spacing: cs * 0.3 });
      for (const [a, b, s] of cfg.caps) { const al = band(t, a, b, 0.5, 0.5); if (al > 0) { const y = vert ? 880 : 900, bg = c.createLinearGradient(0, y - 90, 0, y + 90); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.5, `rgba(0,0,0,${0.5 * al})`); bg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = bg; c.fillRect(-VW, y - 90, VW * 2, 180);
        txt(c, s, 0, y, cs, { font: F, weight: 600, fill: '#fff6dc', alpha: al, spacing: cs * 0.22, maxW: VW * 0.92 }); } }
      if (t > 12.6) {
        const ts = Math.min(VW * 0.86, 640 * LS) / TWd, ty = vert ? 230 : 200, sx = (st.pan.x - st.cx) * st.z, sy = 500 + (st.pan.y - 150 * S - st.cy) * st.z;
        { const a = sm((t - 12.6) / 1.2) * 0.62, bg = c.createLinearGradient(0, ty - 210, 0, ty + 290); bg.addColorStop(0, `rgba(4,4,14,${a})`); bg.addColorStop(0.6, `rgba(4,4,14,${a})`); bg.addColorStop(1, 'rgba(4,4,14,0)'); c.fillStyle = bg; c.fillRect(-VW, ty - 260, VW * 2, 560); }
        const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], sz = Math.max(1.7, 2.3 * ts * 1.6);
        for (let i = 0; i < NT; i++) {
          const tx = (titlePts[i * 2] - 500) * ts, tyy = ty + (titlePts[i * 2 + 1] - 90) * ts, d = (titlePts[i * 2] / 1000) * 0.75 + hash(i, 2) * 0.25, u = clamp((t - 12.65 - d * 1.0) / 1.0, 0, 1); if (u <= 0) continue;
          const e = u * u * (3 - 2 * u), sw = Math.sin(Math.PI * e) * (40 + 90 * hash(i, 3)), an = hash(i, 4) * TAU + e * 5;
          paths[i & 3].rect(lerp(sx + (hash(i, 5) - 0.5) * 220, tx, e) + Math.cos(an) * sw + Math.sin(t * 2 + i) * 0.5, lerp(sy + (hash(i, 6) - 0.5) * 90, tyy, e) + Math.sin(an) * sw * 0.6, sz, sz);
        }
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9; for (let k = 0; k < 4; k++) { c.fillStyle = SDC[k]; c.fill(paths[k]); }
        const sw = lerp(-0.7, 0.7, (t - 14.6) / 1.2) * TWd * ts; if (t > 14.6 && t < 15.8) sdGlow(c, sw, ty, 120 * ts + 40, '255,244,214', 0.5);
        c.restore();
        const y2 = ty + 78 * ts + 30 * LS, lw = VW * 0.28 * eOut((t - 14.0) / 1.0), lg = c.createLinearGradient(-lw, 0, lw, 0); lg.addColorStop(0, 'rgba(255,214,138,0)'); lg.addColorStop(0.5, 'rgba(255,214,138,.95)'); lg.addColorStop(1, 'rgba(255,214,138,0)'); c.fillStyle = lg; c.fillRect(-lw, y2 - 22 * LS, lw * 2, 1.6);
        txt(c, 'STARDUST', 0, y2 + 10 * LS, cs * 1.3, { font: F, weight: 300, fill: '#fbeecb', alpha: sm((t - 14.0) / 0.7), spacing: cs * 1.1 });
        txt(c, 'EPISODE ' + cfg.ep + '  —  ' + cfg.name, 0, y2 + 60 * LS, cs * 0.92, { font: F, weight: 600, fill: P.accent, alpha: sm((t - 14.5) / 0.7), spacing: cs * 0.2, maxW: VW * 0.9 });
        txt(c, cfg.next, 0, vert ? 905 : 930, cs * 0.85, { font: F, weight: 600, fill: gold, alpha: sm((t - 15.6) / 0.7) * 0.95, spacing: cs * 0.24, maxW: VW * 0.9 });
      }
    },
    music(A) { sdMusic(A, cfg.music); },
  };
  return T;
}
