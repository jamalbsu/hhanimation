// TEASER 7 — AFTER THE RAIN
// Style: watercolour. Everything is a translucent wash on paper: colours multiply where they overlap, pigment pools at the edges,
// paint bleeds a little, and the paper shows through. The panther is an indigo-to-teal wash with an amber eye.
// Setting: a garden as the rain ends; a lotus pond to leap, then a rainbow.
const WC = { paper: '#f7f0e1', ink: '#2a2440', indigo: '#2f2a5c', teal: '#2f7f86', plum: '#6a3a7a', coral: '#f08a6c', gold: '#f3c04f', leaf: '#6fae6a', moss: '#3f8a66', sky: '#7cc4cf', water: '#4f9fc8', earth: '#b98a62' };
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
function wcBlot(c, path, col, a = 0.5, edge = 0.35) {      // one wash: fill, then a darker rim where the pigment settled
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = rgba(col, a); c.fill(path);
  if (edge) { c.strokeStyle = rgba(col, edge); c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(path); } c.restore();
}
const wcEll = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
function wcCloud(x, y, s, seed) {                           // a wobbly blob
  const pts = []; for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, r = 1 + (hash(k, seed) - 0.5) * 0.5; pts.push([x + Math.cos(a) * 90 * s * r, y + Math.sin(a) * 34 * s * r]); } return smooth(new Path2D(), pts);
}
const T = {
  name: 'AFTER THE RAIN', DUR: 15, gy: 700, scale: 0.75, vol: 1.6, revLen: 3.2,
  style: { mode: 'wash', fill: WC.indigo, far: '#5a568c', near: '#262250', w0: '#1f1b44', w1: WC.teal, edge: '#15122e', dilute: 0.88,
    ink: WC.ink, eye: '#f2a93b', irisHi: '#8a4a10', white: '#fff8e6', earIn: '#b86a8c', nose: '#15122e', whisk: 'rgba(42,36,64,.7)', blush: true },
  shadow: 'rgba(60,70,110,.22)', fxColor: rgba(WC.indigo, 0.5),
  post: [['bleed', 0.38, 7], ['blotch', 0.32], ['paper', 0.55], ['vignette', 0.22, '90,70,40']],
  shots: [
    { t: [0, 1.8], spd: 900, z: 1.55, cx: 70, cy: 590 },
    { t: [1.8, 4.6], spd: 640, z: [0.7, 0.78], cx: -30, cy: 465, px: -50 },
    { t: [4.6, 6.1], mode: 'leap', leap: 250, spd: 760, z: 0.97, cx: 40, cy: 555, follow: 0.4, tilt: 0.32 },
    { t: [6.1, 8.1], spd: 420, cam: 'head', z: [2.1, 2.5], hx: 20, hy: -24, blink: 6.75, sparkle: 6.95 },
    { t: [8.1, 10.3], spd: 980, z: [1.1, 0.95], px: [-210, 150], cy: [595, 540] },
    { t: [10.3, 15], mode: 'stand', spd: 0, snap: true, z: [1.3, 1.14], cx: 40, cy: 455 },
  ],
  init() { const S = this.scale; this.gap = [panXAt(4.65) + 110 * S, panXAt(6.05) + 40 * S]; this.fishX = (this.gap[0] + this.gap[1]) / 2 - 50; },
  sky(c, st) {
    const t = st.t, dry = sm((t - 7.5) / 3);
    c.fillStyle = WC.paper; c.fillRect(-VW, 0, VW * 2, 1000);
    c.globalCompositeOperation = 'multiply';
    const g = c.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, rgba(WC.sky, 0.6)); g.addColorStop(0.6, rgba('#b9d8d2', 0.35)); g.addColorStop(1, rgba(WC.coral, 0.3)); c.fillStyle = g; c.fillRect(-VW, 0, VW * 2, 800);
    c.globalCompositeOperation = 'source-over';
    const sx = VW * 0.2, sy = 250;                           // the sun comes out as the rain stops
    for (const [r, a] of [[150, 0.14], [105, 0.3], [70, 0.5]]) wcBlot(c, wcEll(sx, sy, r, r), WC.gold, a * (0.35 + 0.65 * dry), 0.12);
    if (dry > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.lineCap = 'butt';             // a rainbow, one loose brush stroke per colour
      ['#e8705f', '#f0a04f', '#f3d260', '#7fbf7a', '#62a8d8', '#8a78c8'].forEach((col, k) => { c.strokeStyle = rgba(col, 0.42 * dry); c.lineWidth = 17; c.beginPath(); c.arc(-VW * 0.05, 760, 520 - k * 16, Math.PI, Math.PI + Math.PI * eOut((t - 7.5) / 2.6)); c.stroke(); });
      c.restore(); }
    for (let i = 0; i < 6; i++) { const x = ((hash(i, 1) * VW * 1.8 + t * (9 + i * 3)) % (VW * 1.8)) - VW * 0.9, y = 90 + i * 60 + hash(i, 2) * 40, s = 0.8 + hash(i, 3) * 0.9;
      wcBlot(c, wcCloud(x, y, s, i), i % 2 ? '#8f97b8' : '#a9a4c4', 0.3 * (1 - 0.5 * dry), 0.22); wcBlot(c, wcCloud(x + 40 * s, y + 14 * s, s * 0.7, i + 9), '#8f97b8', 0.2 * (1 - 0.5 * dry), 0.15); }
  },
  layers: [
    { p: 0.07, draw(c, v) { tiles(v.x0, v.x1, 380, (x, i, r) => { const h = 300 + r * 240, px = x + hash(i, 2) * 120, p = new Path2D();
        p.moveTo(px - 300, 800); p.quadraticCurveTo(px - 110, 800 - h * 0.7, px, 800 - h); p.quadraticCurveTo(px + 120, 800 - h * 0.6, px + 320, 800); p.closePath(); wcBlot(c, p, i % 2 ? '#7f9fc4' : '#9a93c8', 0.36, 0.28); }); } },
    { p: 0.22, draw(c, v) { tiles(v.x0, v.x1, 300, (x, i, r) => { const p = new Path2D(), h = 120 + r * 110; p.moveTo(x - 260, 860); p.quadraticCurveTo(x, 860 - h * 2, x + 260, 860); p.closePath(); wcBlot(c, p, i % 2 ? WC.leaf : '#8fc08a', 0.42, 0.3); }); } },
    { p: 0.45, draw(c, v, st) { tiles(v.x0, v.x1, 250, (x, i, r) => {
        const tx = x + r * 90, h = 250 + hash(i, 2) * 190, top = 850 - h, sway = Math.sin(st.t * 1.2 + i) * 6;
        c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = rgba('#7a5a48', 0.6); c.lineCap = 'round'; c.lineWidth = 12; c.beginPath(); c.moveTo(tx, 870); c.quadraticCurveTo(tx + 14, 850 - h * 0.5, tx + sway, top + 30); c.stroke();
        c.lineWidth = 5; c.beginPath(); c.moveTo(tx + 6, 850 - h * 0.55); c.quadraticCurveTo(tx + 40, 850 - h * 0.7, tx + 62 + sway, top + 46); c.stroke(); c.restore();
        const cols = [WC.moss, WC.leaf, '#a8cf6a', i % 3 ? WC.coral : '#e9a0c0'];
        for (let k = 0; k < 5; k++) wcBlot(c, wcEll(tx + (hash(i, k + 3) - 0.5) * 150 + sway, top + (hash(k, i) - 0.5) * 90, 52 + hash(i, k + 8) * 40, 44 + hash(k, i + 4) * 30, hash(i, k) * 3), cols[k % 4], 0.42, 0.3);
      }); } },
    { p: 1, draw(c, v, st) {
      const gy = 700, [g0, g1] = T.gap, t = st.t;
      if (g0 < v.x1 && g1 > v.x0) {                          // the lotus pond
        const pond = new Path2D(); pond.rect(g0 - 6, gy + 22, g1 - g0 + 12, 1300); c.fillStyle = WC.paper; c.fill(pond); wcBlot(c, pond, WC.water, 0.62, 0); wcBlot(c, pond, WC.teal, 0.25, 0);
        c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = rgba('#2f6f9a', 0.4); c.lineWidth = 2.5;
        for (let k = 0; k < 7; k++) { const rx = lerp(g0 + 40, g1 - 40, hash(k, 1)), ry = gy + 70 + hash(k, 2) * 300, rr = ((t * 30 + k * 40) % 90); c.globalAlpha = 1 - rr / 90; c.beginPath(); c.ellipse(rx, ry, 14 + rr, 4 + rr * 0.3, 0, 0, TAU); c.stroke(); }
        c.restore();
        for (let k = 0; k < 6; k++) { const lx = lerp(g0 + 50, g1 - 50, hash(k, 4)), ly = gy + 60 + hash(k, 5) * 260, pad = new Path2D(); pad.moveTo(lx, ly); pad.arc(lx, ly, 34 + hash(k, 6) * 16, 0.35, TAU - 0.1); pad.closePath();
          c.save(); c.translate(0, ly); c.scale(1, 0.42); c.translate(0, -ly); wcBlot(c, pad, WC.moss, 0.6, 0.4); c.restore();
          if (k % 2) for (let q = 0; q < 5; q++) wcBlot(c, wcEll(lx + Math.cos(q * 1.26) * 9, ly - 12 + Math.sin(q * 1.26) * 4, 9, 5, q * 1.26), '#ee8fb4', 0.6, 0.35); }
        const fu = (st.ta - 4.95) / 0.9;                     // a koi jumps under the leaping panther
        if (fu > 0 && fu < 1) { const fx = T.fishX + fu * 130, fy = gy + 60 - Math.sin(Math.PI * fu) * 190; c.save(); c.translate(fx, fy); c.rotate(-Math.cos(Math.PI * fu) * 0.9);
          wcBlot(c, wcEll(0, 0, 36, 15), '#f08a3c', 0.8, 0.5); const tail = new Path2D(); tail.moveTo(-28, 0); tail.lineTo(-56, -17); tail.lineTo(-50, 0); tail.lineTo(-56, 17); tail.closePath(); wcBlot(c, tail, '#f08a3c', 0.65, 0.4);
          wcBlot(c, wcEll(6, -3, 12, 7), '#fff2e0', 0.01, 0); wcBlot(c, wcEll(-6, 2, 10, 6), '#c8402c', 0.55, 0); c.fillStyle = WC.ink; c.beginPath(); c.arc(22, -4, 2.6, 0, TAU); c.fill(); c.restore(); }
      }
      for (const [a, b] of [[v.x0 - 60, Math.min(g0, v.x1 + 60)], [Math.max(g1, v.x0 - 60), v.x1 + 60]]) { if (b <= a) continue;
        const band = new Path2D(); band.moveTo(a, gy + 4); for (let x = Math.ceil(a / 26) * 26; x < b; x += 26) band.lineTo(x, gy + (hash(x, 3) - 0.5) * 6); band.lineTo(b, gy + 4); band.lineTo(b, gy + 1300); band.lineTo(a, gy + 1300); band.closePath();
        const gg = c.createLinearGradient(0, gy, 0, gy + 520); gg.addColorStop(0, rgba(WC.moss, 0.6)); gg.addColorStop(0.16, rgba(WC.earth, 0.55)); gg.addColorStop(1, rgba('#8fa8a8', 0.4));
        c.fillStyle = WC.paper; c.fill(band);
        c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = gg; c.fill(band); c.strokeStyle = rgba('#2f5a48', 0.55); c.lineWidth = 4; c.stroke(band); c.restore();
        tiles(Math.max(a, v.x0), Math.min(b, v.x1), 120, (x, i, r) => {
          if (x < a + 40 || x > b - 50) return;
          if (r > 0.62) { wcBlot(c, wcEll(x, gy + 70 + hash(i, 2) * 200, 60 + r * 40, 13 + r * 8), WC.water, 0.45, 0.3); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x - 14, gy + 66 + hash(i, 2) * 200, 20, 3, 0, 0, TAU); c.fill(); }
          c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = rgba(WC.moss, 0.7); c.lineWidth = 3; c.lineCap = 'round';
          for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + k * 6, gy + 2); c.quadraticCurveTo(x + k * 6 + 3, gy - 14, x + k * 7 - 6 + Math.sin(t * 2 + k + i) * 2, gy - 24 - hash(i, k) * 18); c.stroke(); } c.restore();
          if (r < 0.4) for (let q = 0; q < 5; q++) wcBlot(c, wcEll(x + 40 + Math.cos(q * 1.26) * 7, gy - 34 + Math.sin(q * 1.26) * 7, 7, 7), i % 2 ? WC.coral : WC.gold, 0.7, 0.4);
        }, 1, 5);
      }
    } },
    { p: 1.5, draw(c, v, st) { if (st.sh.cam === 'head') return;
      tiles(v.x0, v.x1, 760, (x, i, r) => { if (r < 0.35) return; const top = r > 0.72;
        c.save(); c.translate(x, top ? -30 : 1070); c.rotate((top ? 0.9 : -0.8) + (hash(i, 3) - 0.5) * 0.5 + Math.sin(st.t * 1.3 + i) * 0.03);
        const leaf = new Path2D(); leaf.moveTo(0, 0); leaf.quadraticCurveTo(120, -140, 0, -330); leaf.quadraticCurveTo(-120, -140, 0, 0); wcBlot(c, leaf, i % 2 ? WC.moss : WC.teal, 0.55, 0.45);
        c.globalCompositeOperation = 'multiply'; c.strokeStyle = rgba('#24503c', 0.5); c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -310); c.stroke(); c.restore(); }); } },
  ],
  overlay(c, st) {
    const t = st.t, rain = 1 - sm((t - 6.5) / 3), vert = H > W;
    if (rain > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = rgba('#5f7fa8', 0.42 * rain); c.lineWidth = 2.2; c.lineCap = 'round';
      for (let i = 0; i < 120 * rain; i++) { const sp = 900 + hash(i, 3) * 500, x = (hash(i, 1) - 0.5) * VW * 1.3, y = ((hash(i, 2) * 1150 + t * sp) % 1150) - 80, l = 26 + hash(i, 4) * 30; c.beginPath(); c.moveTo(x, y); c.lineTo(x - l * 0.22, y + l); c.stroke(); }
      c.restore(); }
    for (let i = 0; i < 26; i++) wcBlot(c, wcEll((hash(i, 11) - 0.5) * VW * 1.05, hash(i, 12) * 1000, 2 + hash(i, 13) * 7, 2 + hash(i, 14) * 6), [WC.indigo, WC.coral, WC.teal, WC.gold][i & 3], 0.35, 0.2);   // paint splatter
    const SCR = '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive', SER = '"Palatino Linotype", "Book Antiqua", Georgia, serif', cs = Math.min(40 * LS, VW * 0.066);
    const cap = (s, a, b) => { const al = band(t, a, b, 0.5, 0.5); if (al > 0) txt(c, s, 0, vert ? 880 : 905, cs, { font: SCR, weight: 700, fill: WC.ink, alpha: al * 0.9, maxW: VW * 0.9 }); };
    cap('the rain is ending…', 2.0, 4.5); cap('…and someone is out to play', 8.3, 10.2);
    if (t > 10.5) {
      const ts = Math.min(VW * 0.2, 150 * LS), y = vert ? 210 : 190, wipe = eOut((t - 10.5) / 1.3);
      c.save(); c.beginPath(); c.rect(-VW / 2, 0, VW * wipe, 1000); c.clip(); c.globalCompositeOperation = 'multiply';
      const g = c.createLinearGradient(-ts * 2.6, 0, ts * 2.6, 0); g.addColorStop(0, rgba(WC.indigo, 0.9)); g.addColorStop(0.45, rgba(WC.plum, 0.85)); g.addColorStop(0.75, rgba(WC.teal, 0.85)); g.addColorStop(1, rgba(WC.coral, 0.85));
      txt(c, 'PANTHERA', 0, y, ts, { font: SER, weight: 700, fill: g, spacing: ts * 0.06, maxW: VW * 0.9, stroke: rgba(WC.indigo, 0.35), sw: 2.5 });
      c.strokeStyle = rgba(WC.plum, 0.5); c.lineCap = 'round';                                             // drips
      for (let k = 0; k < 7; k++) { const dx = (hash(k, 21) - 0.5) * ts * 4.4, len = (30 + hash(k, 22) * 90) * sm((t - 11.3 - hash(k, 23)) / 2.2); if (len > 1) { c.lineWidth = 3 + hash(k, 24) * 3; c.beginPath(); c.moveTo(dx, y + ts * 0.3); c.lineTo(dx, y + ts * 0.3 + len); c.stroke(); } }
      c.restore();
      txt(c, 'After the Rain', 0, y + ts * 1.02, ts * 0.5, { font: SCR, weight: 700, fill: rgba(WC.teal, 0.95), alpha: sm((t - 11.6) / 0.8), maxW: VW * 0.86 });
      txt(c, 'a watercolour  ·  coming soon', 0, vert ? 905 : 925, cs * 0.62, { font: SER, weight: 700, fill: WC.ink, alpha: sm((t - 12.6) / 0.8) * 0.8, spacing: cs * 0.12 });
    }
  },
  music(A) {
    const b = 0.5, root = 62, CH = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], BR = [0, 7, 9, 5], bar = t => Math.floor(t / (2 * b) + 1e-6) % 4;
    const piano = (t, n, v = 1, pan = 0) => { A.tone(t, mtof(n), 1.3, { type: 'triangle', vol: 0.13 * v, a: 0.005, rev: 0.5, pan, lp: 2400, lpTo: 600, fT: 0.6 }); A.tone(t, mtof(n) * 2, 0.5, { vol: 0.03 * v, a: 0.004, pan }); };
    const warm = (t, n, d) => A.tone(t, mtof(n), d, { type: 'triangle', vol: 0.17, a: 0.03, r: 0.2, lp: 420 });
    const pad = (t, c, d) => { for (const n of CH[c]) A.tone(t, mtof(root + n), d, { type: 'triangle', vol: 0.04, a: Math.min(0.5, d / 3), r: Math.min(0.7, d / 2), rev: 0.6 }); };
    const drip = (t, f = 1400, pan = 0) => A.tone(t, f, 0.09, { slide: f * 1.7, slideT: 0.06, vol: 0.05, rev: 0.5, pan });
    const bird = (t, f = 2400) => { A.tone(t, f, 0.08, { slide: f * 1.35, vol: 0.035, rev: 0.3 }); A.tone(t + 0.11, f * 1.12, 0.08, { slide: f * 1.5, vol: 0.03, rev: 0.3 }); };
    A.noise(0, 9.5, { vol: 0.05, hp: 2500, a: 0.4, r: 3.2 }); A.noise(0, 9.5, { vol: 0.035, lp: 500, a: 0.4, r: 3.2 });           // the rain, fading
    for (let k = 0; k < 16; k++) drip(0.3 + k * 0.55 + hash(k, 1) * 0.3, 1100 + hash(k, 2) * 900, hash(k, 3) * 1.6 - 0.8);
    const MEL = [[0, 78], [1.5, 76], [2, 74], [4, 76], [5, 78], [6, 81, 2], [8, 83], [9.5, 81], [10, 78], [12, 76], [13, 74], [14, 76, 2]];
    const play = (t0, t1, mel, up = 0) => {
      for (let k = Math.ceil(t0 / (b / 2) - 1e-6); k * b / 2 < t1 - 0.01; k++) { const t = k * b / 2, c = bar(t);
        piano(t, root + CH[c][[0, 1, 2, 1][k & 3]] + (k % 8 > 3 ? 12 : 0), 0.6, k % 2 ? 0.3 : -0.3);
        if (k % 2 === 0) warm(t, root + BR[c] - 24 + 12, b * 0.95);
        if (k % 4 === 0 && t1 - t > 0.3) pad(t, c, Math.min(2 * b, t1 - t)); }
      if (mel) for (const [at, n, len] of MEL) { const t = t0 + at * b / 2; if (t < t1 - 0.05) piano(t, n + up, 1.15); }
    };
    play(0, 1.8, false); play(2, 4.6, true);
    play(4.6, 6.1, false); A.noise(4.6, 0.9, { vol: 0.07, bp: 500, bpTo: 2000, q: 0.8, a: 0.5 }); [74, 78, 81, 86, 90].forEach((n, k) => piano(4.7 + k * 0.13, n, 0.7, k / 4 - 0.5));
    A.noise(5.1, 0.45, { vol: 0.09, bp: 900, bpTo: 400, a: 0.02, rev: 0.4 }); drip(5.1, 900); drip(5.22, 1300, 0.4);                  // the koi
    pad(6.1, 0, 2.0); piano(6.3, 74, 0.9); piano(6.8, 78, 0.9); piano(7.3, 81, 0.9); piano(6.95, 93, 0.5, 0.4); piano(7.07, 98, 0.5, -0.4);
    play(8, 10.3, true, 12); bird(8.6); bird(9.5, 2800);
    [62, 66, 69, 74, 78, 81, 86].forEach((n, k) => piano(10.4 + k * 0.1, n, 0.7 + k * 0.05, k / 6 - 0.5));
    for (const n of [0, 7, 12, 16, 19]) A.tone(11.1, mtof(root - 12 + n), 3.8, { type: 'triangle', vol: 0.05, a: 0.4, r: 1.8, rev: 0.6 });
    warm(11.1, root - 24, 3.2); [[0, 81], [1, 78], [2, 81], [3, 86], [5, 90]].forEach(([k, n]) => piano(11.4 + k * b, n, 1));
    bird(11.9, 2500); bird(13.2, 3000); bird(14.1, 2300); drip(12.6, 1500, -0.5); drip(13.7, 1200, 0.5);
  },
};
