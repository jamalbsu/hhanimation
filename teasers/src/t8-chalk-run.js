// TEASER 8 — CHALK RUN
// Style: chalk on a blackboard. Everything is a line: a hatched, rough-outlined panther, doodles, sums and a number line for a ground.
// Drawn "on twos" (12 pictures a second) with a slight wobble, like hand-drawn chalk animation.
// Story: a doodle panther comes alive after school and runs along the number line while the eraser chases it.
const CK = { board: '#1f3b33', white: '#f4f1e6', yellow: '#ffe27a', pink: '#ff9fb8', blue: '#8fd0ff', green: '#a8e6a1', red: '#ff6b5e' };
const CKF = '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive';
function ck(c, col, w = 4, a = 0.9) { c.strokeStyle = col; c.lineWidth = w; c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round'; }
function ckStroke(c, draw, col, w = 4, a = 0.9, seed = 0) {       // every line is drawn twice, slightly apart
  c.save(); ck(c, col, w, a); c.beginPath(); draw(c); c.stroke();
  c.globalAlpha = a * 0.4; c.lineWidth = w * 0.6; c.translate(1.5 + hash(seed, 1), -1.2); c.beginPath(); draw(c); c.stroke(); c.restore();
}
const ckStar = (c, x, y, r, rot = 0) => { for (let k = 0; k <= 5; k++) { const a = rot - Math.PI / 2 + k * 4 * Math.PI / 5; k ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } };
const ckText = (c, s, x, y, size, col, a = 0.9, o = {}) => txt(c, s, x, y, size, Object.assign({ font: CKF, weight: 700, fill: col, alpha: a }, o));
const T = {
  name: 'CHALK RUN', DUR: 15, gy: 700, scale: 0.75, stepFps: 12, boil: 1.6, vol: 1.5, revLen: 1.6,
  style: { mode: 'chalk', board: CK.board, fill: CK.white, far: CK.blue, near: CK.white, line: CK.white, line2: 'rgba(244,241,230,.75)', ow: 3.6, hatchA: 0.3,
    ink: CK.white, eye: '#ffd23f', irisHi: '#b9770a', white: '#fffdf2', earIn: CK.pink, nose: CK.pink, whisk: 'rgba(244,241,230,.85)', blush: true, mouth: '#12261f' },
  shadow: null, fxColor: 'rgba(244,241,230,.7)',
  post: [['speck', CK.board, 0.6], ['grain', 0.07], ['vignette', 0.45]],
  shots: [
    { t: [0, 1.8], spd: 950, z: 1.5, cx: 40, cy: 590, speed: 'h', speedK: 0.5 },
    { t: [1.8, 4.6], spd: 680, z: [0.68, 0.76], cx: -110, cy: 470, px: -40 },
    { t: [4.6, 6.1], mode: 'leap', leap: 250, spd: 780, z: 0.97, cx: 30, cy: 555, follow: 0.4, tilt: 0.32 },
    { t: [6.1, 8.1], spd: 440, cam: 'head', z: [2.1, 2.5], hx: 20, hy: -24, blink: 6.75, sparkle: 6.95 },
    { t: [8.1, 10.3], spd: 1050, z: [0.95, 0.85], px: [-150, 160], cx: -60, cy: [560, 520] },
    { t: [10.3, 15], mode: 'stand', spd: 0, snap: true, z: [1.16, 1.04], cx: -40, cy: 440 },
  ],
  init() { const S = this.scale; this.gap = [panXAt(4.65) + 110 * S, panXAt(6.05) + 40 * S]; },
  eraserX(t) { const d = t < 4.6 ? lerp(520, 400, t / 4.6) : t < 8.1 ? 430 : t < 10.3 ? lerp(430, 330, (t - 8.1) / 2.2) : 250; return panXAt(t) - d; },
  sky(c, st) {
    const t = st.t, g = c.createRadialGradient(0, 480, 60, 0, 480, 900); g.addColorStop(0, '#27493f'); g.addColorStop(1, '#162b25'); c.fillStyle = g; c.fillRect(-VW, 0, VW * 2, 1000);
    for (let i = 0; i < 9; i++) { c.save(); c.translate((hash(i, 1) - 0.5) * VW, hash(i, 2) * 900); c.rotate((hash(i, 3) - 0.5) * 0.5); c.fillStyle = `rgba(255,255,255,${0.018 + 0.02 * hash(i, 4)})`; c.fillRect(-180, -34, 360, 68); c.restore(); }   // old eraser smears
    const sx = VW * 0.24, sy = 190, rot = st.step * 0.03, dim = 1 - 0.88 * sm((t - 10.3) / 0.5);
    ckStroke(c, q => { q.arc(sx, sy, 58, 0, TAU); for (let k = 0; k < 12; k++) { const a = rot + k * TAU / 12; q.moveTo(sx + Math.cos(a) * 74, sy + Math.sin(a) * 74); q.lineTo(sx + Math.cos(a) * (98 + (k % 2) * 16), sy + Math.sin(a) * (98 + (k % 2) * 16)); } }, CK.yellow, 5, 0.9 * dim);
    ckStroke(c, q => { q.moveTo(sx - 22, sy + 12); q.quadraticCurveTo(sx, sy + 34, sx + 22, sy + 12); q.moveTo(sx - 18, sy - 14); q.lineTo(sx - 18, sy - 6); q.moveTo(sx + 18, sy - 14); q.lineTo(sx + 18, sy - 6); }, CK.yellow, 4.5, 0.9 * dim);
    for (let i = 0; i < 4; i++) { const x = ((hash(i, 5) * VW * 1.6 + t * (10 + i * 4)) % (VW * 1.6)) - VW * 0.8, y = 110 + i * 70, s = 0.7 + hash(i, 6) * 0.5;
      ckStroke(c, q => { q.moveTo(x - 60 * s, y); q.arc(x - 34 * s, y, 26 * s, Math.PI, TAU); q.arc(x + 6 * s, y - 12 * s, 34 * s, Math.PI * 1.1, TAU); q.arc(x + 46 * s, y, 24 * s, Math.PI * 1.2, TAU * 1.02); q.lineTo(x - 60 * s, y + 2); }, CK.blue, 3.6, 0.7 * dim, i); }
    for (let i = 0; i < 5; i++) { const x = ((hash(i, 7) * VW + t * 34) % (VW * 1.2)) - VW * 0.6, y = 300 + hash(i, 8) * 130, f = Math.sin(st.step * 0.9 + i) * 7; ckStroke(c, q => { q.moveTo(x - 13, y - f); q.quadraticCurveTo(x - 5, y - 5, x, y); q.quadraticCurveTo(x + 5, y - 5, x + 13, y - f); }, CK.white, 3, 0.7, i); }
  },
  layers: [
    { p: 0.1, draw(c, v) { tiles(v.x0, v.x1, 420, (x, i, r) => { const h = 260 + r * 200, px = x + hash(i, 2) * 100;
        ckStroke(c, q => { q.moveTo(px - 250, 790); q.lineTo(px - 60, 790 - h * 0.74); q.lineTo(px, 790 - h); q.lineTo(px + 70, 790 - h * 0.7); q.lineTo(px + 260, 790); q.moveTo(px - 44, 790 - h * 0.8); q.lineTo(px - 14, 790 - h * 0.72); q.lineTo(px + 6, 790 - h * 0.82); q.lineTo(px + 26, 790 - h * 0.72); q.lineTo(px + 48, 790 - h * 0.8); }, CK.white, 4, 0.42, i); }); } },
    { p: 0.3, draw(c, v, st) {
      const sums = ['2 + 2 = 4', 'E = mc²', 'π ≈ 3.14', 'a² + b² = c²', 'x → ∞', '7 × 8 = 56', '√81 = 9', 'cat + chalk = ♥'];
      tiles(v.x0, v.x1, 300, (x, i, r) => {
        const k = ((i % 6) + 6) % 6, y = 400 + hash(i, 2) * 230, a = 0.55;
        if (k === 0 || k === 3) { c.save(); c.translate(x, y); c.rotate((hash(i, 3) - 0.5) * 0.2); ckText(c, sums[((i % 8) + 8) % 8], 0, 0, 44, [CK.white, CK.yellow, CK.blue][((i % 3) + 3) % 3], a); c.restore(); }
        else if (k === 1) ckStroke(c, q => ckStar(q, x, y, 34, st.step * 0.02 + i), CK.yellow, 4, a, i);
        else if (k === 2) ckStroke(c, q => { q.moveTo(x, 800); q.lineTo(x, y + 40); for (let b = 0; b < 3; b++) { q.moveTo(x, y + 150 - b * 50); q.lineTo(x - 44 + b * 8, y + 120 - b * 50); q.moveTo(x, y + 150 - b * 50); q.lineTo(x + 44 - b * 8, y + 120 - b * 50); } q.moveTo(x + 46, y + 20); q.arc(x, y + 20, 46, 0, TAU); }, CK.green, 4, a, i);
        else if (k === 4) ckStroke(c, q => { q.moveTo(x, y + 26); q.bezierCurveTo(x - 60, y - 14, x - 22, y - 52, x, y - 18); q.bezierCurveTo(x + 22, y - 52, x + 60, y - 14, x, y + 26); }, CK.pink, 4, a, i);
        else ckStroke(c, q => { for (const d of [-18, 18]) { q.moveTo(x + d, y - 54); q.lineTo(x + d, y + 54); q.moveTo(x - 54, y + d); q.lineTo(x + 54, y + d); } q.moveTo(x - 46, y - 46); q.lineTo(x - 26, y - 26); q.moveTo(x - 26, y - 46); q.lineTo(x - 46, y - 26); q.moveTo(x + 14, y); q.arc(x, y, 14, 0, TAU); }, CK.blue, 3.6, a, i);
      });
    } },
    { p: 1, draw(c, v, st) {
      const gy = 700, [g0, g1] = T.gap, t = st.t, ex = T.eraserX(st.ta);
      for (const [a, b] of [[v.x0 - 60, Math.min(g0, v.x1 + 60)], [Math.max(g1, v.x0 - 60), v.x1 + 60]]) { if (b <= a) continue;
        ckStroke(c, q => { q.moveTo(a, gy); for (let x = Math.ceil(a / 60) * 60; x < b; x += 60) q.lineTo(x, gy + (hash(x, 2) - 0.5) * 3); q.lineTo(b, gy); }, CK.white, 6, 0.95);
        ckStroke(c, q => { for (let x = Math.ceil(a / 100) * 100; x < b; x += 100) { const big = x % 500 === 0; q.moveTo(x, gy - (big ? 20 : 10)); q.lineTo(x, gy + (big ? 26 : 12)); } }, CK.white, 3.6, 0.85);
        for (let x = Math.ceil(a / 500) * 500; x < b; x += 500) ckText(c, String(x / 500), x, gy + 64, 40, CK.yellow, 0.85);
        tiles(Math.max(a, v.x0), Math.min(b, v.x1), 260, (x, i, r) => { const fx = x + 60 + r * 80; if (fx < a + 40 || fx > b - 40) return; const col = [CK.pink, CK.yellow, CK.blue][((i % 3) + 3) % 3], h = 40 + r * 30;
          ckStroke(c, q => { q.moveTo(fx, gy - 2); q.quadraticCurveTo(fx - 6, gy - h * 0.5, fx, gy - h); }, CK.green, 3.4, 0.85, i);
          ckStroke(c, q => { for (let k = 0; k < 5; k++) { const an = k * TAU / 5 + i; q.moveTo(fx + Math.cos(an) * 17, gy - h + Math.sin(an) * 17); q.arc(fx + Math.cos(an) * 9, gy - h + Math.sin(an) * 9, 8, an, an + TAU); } }, col, 3, 0.9, i); }, 1, 4);
      }
      if (g0 < v.x1 && g1 > v.x0) {                              // the gap in the number line: a dotted jump and a question mark
        c.save(); c.setLineDash([16, 16]); ck(c, CK.yellow, 4.5, 0.8); c.beginPath(); c.moveTo(g0 - 20, gy - 30); c.quadraticCurveTo((g0 + g1) / 2, gy - 520, g1 + 20, gy - 30); c.stroke(); c.restore();
        ckText(c, '?', (g0 + g1) / 2, gy + 30, 110, CK.pink, 0.9); ckText(c, 'jump!', g0 - 120, gy - 150, 46, CK.yellow, 0.85);
        ckStroke(c, q => { q.moveTo(g0 - 90, gy - 120); q.quadraticCurveTo(g0 - 50, gy - 100, g0 - 30, gy - 56); q.moveTo(g0 - 52, gy - 62); q.lineTo(g0 - 30, gy - 56); q.lineTo(g0 - 28, gy - 82); }, CK.yellow, 4, 0.85);
      }
      // the eraser wipes everything behind it
      const sm0 = c.createLinearGradient(ex - 90, 0, ex + 10, 0); sm0.addColorStop(0, 'rgba(34,62,54,.96)'); sm0.addColorStop(1, 'rgba(34,62,54,0)');
      c.globalAlpha = 1; c.fillStyle = 'rgba(34,62,54,.96)'; c.fillRect(v.x0 - 100, gy - 330, Math.max(0, ex - 90 - v.x0 + 100), 470); c.fillStyle = sm0; c.fillRect(ex - 90, gy - 330, 100, 470);
      for (let k = 0; k < 7; k++) { c.fillStyle = `rgba(255,255,255,${0.03 + 0.03 * hash(k, 3)})`; c.fillRect(v.x0 - 100, gy - 310 + k * 64 + hash(k, 4) * 20, Math.max(0, ex - 40 - v.x0 + 100), 16 + hash(k, 5) * 22); }
      const rest = sm((t - 10.4) / 0.7), bob = Math.sin(st.step * 1.4) * 10 * (1 - rest), ey = gy - 150 + bob + rest * 96;
      c.save(); c.translate(ex, ey); c.rotate(lerp(-0.22, 0.02, rest) + Math.sin(st.step * 0.7) * 0.05 * (1 - rest));
      c.fillStyle = CK.board; c.fillRect(-70, -50, 140, 100);
      ckStroke(c, q => { q.rect(-70, -50, 140, 62); }, '#d8b48a', 5, 0.95); ckStroke(c, q => { q.rect(-70, 12, 140, 38); for (let x = -56; x < 70; x += 16) { q.moveTo(x, 18); q.lineTo(x - 8, 44); } }, CK.white, 4, 0.9);
      if (rest < 0.5) ckStroke(c, q => { q.moveTo(-40, -36); q.lineTo(-14, -26); q.moveTo(40, -36); q.lineTo(14, -26); q.moveTo(-30, -14); q.arc(-34, -14, 4, 0, TAU); q.moveTo(30, -14); q.arc(26, -14, 4, 0, TAU); q.moveTo(-18, 2); q.quadraticCurveTo(0, -8, 18, 2); }, '#d8b48a', 4, 0.95);
      else ckStroke(c, q => { q.moveTo(-40, -22); q.quadraticCurveTo(-28, -14, -16, -22); q.moveTo(16, -22); q.quadraticCurveTo(28, -14, 40, -22); q.moveTo(-10, -4); q.arc(0, -4, 10, 0, Math.PI); }, '#d8b48a', 4, 0.95);
      c.restore();
      if (rest > 0.5) ['z', 'z', 'Z'].forEach((s, k) => ckText(c, s, ex + 70 + k * 30, ey - 70 - k * 36 - ((t * 20) % 16), 30 + k * 10, CK.blue, 0.8 * rest));
      for (let k = 0; k < 14; k++) { const u = ((t * 1.3 + hash(k, 6)) % 1); c.fillStyle = `rgba(244,241,230,${0.5 * (1 - u) * (1 - rest)})`; c.beginPath(); c.arc(ex + 60 + u * 90 + hash(k, 7) * 30, ey + 60 - u * 80 * hash(k, 8), 3 + 5 * hash(k, 9), 0, TAU); c.fill(); }   // chalk dust
    } },
  ],
  afterPanther(c, v, st) {                                       // little puffs where the paws land
    if (st.pan.mode !== 'run') return; const S = T.scale;
    for (let k = 0; k < 6; k++) { const u = (st.ph * 2 + k / 6) % 1; c.fillStyle = `rgba(244,241,230,${0.45 * (1 - u)})`; c.beginPath(); c.arc(st.pan.x - (60 + u * 150 + hash(k, 2) * 60) * S, T.gy - (6 + u * 40 * hash(k, 3)) * S, (3 + 6 * u) * S, 0, TAU); c.fill(); }
  },
  overlay(c, st) {
    const t = st.t, vert = H > W, cs = Math.min(38 * LS, VW * 0.062);
    const cap = (s, a, b, col) => { const al = band(t, a, b, 0.3, 0.3); if (al > 0) ckText(c, s, 0, vert ? 880 : 900, cs, col, al, { maxW: VW * 0.92 }); };
    cap('uh-oh…  here comes the eraser!', 2.0, 4.4, CK.yellow); cap('run, little doodle, run!', 8.3, 10.1, CK.pink);
    if (t > 10.6) {
      const ts = Math.min(VW * 0.19, 140 * LS), y = vert ? 200 : 170, wr = clamp((t - 10.6) / 1.4, 0, 1), half = Math.min(VW * 0.45, ts * 2.9);
      c.save(); c.beginPath(); c.rect(-VW / 2, 0, VW / 2 - half + 2 * half * wr + 20, 1000); c.clip();
      ckText(c, 'PANTHERA', 0, y, ts, CK.white, 0.95, { maxW: VW * 0.9, spacing: ts * 0.04 }); ckText(c, 'PANTHERA', 2.5, y - 2, ts, CK.white, 0.3, { maxW: VW * 0.9, spacing: ts * 0.04 }); c.restore();
      const ul = eOut((t - 12.0) / 0.5); if (ul > 0) for (const d of [0, 12]) ckStroke(c, q => { q.moveTo(-half, y + ts * 0.5 + d); q.quadraticCurveTo(0, y + ts * 0.5 + d + 8, -half + 2 * half * ul, y + ts * 0.5 + d - 2); }, CK.yellow, 5, 0.9, d);
      ckText(c, 'CHALK RUN', 0, y + ts * 1.05, ts * 0.48, CK.pink, sm((t - 12.3) / 0.4), { spacing: ts * 0.05 });
      if (t > 12.9) { const s = lerp(1.6, 1, eOut((t - 12.9) / 0.3)), gx = Math.min(VW * 0.32, half * 0.9), gy2 = y + ts * 1.75; c.save(); c.translate(gx, gy2); c.rotate(-0.16); c.scale(s, s); ckStroke(c, q => q.ellipse(0, 0, 58, 44, 0, 0, TAU), CK.red, 5, 0.95); ckText(c, 'A+', 0, 2, 50, CK.red, 0.95); c.restore(); }
      ckText(c, 'coming soon!', 0, vert ? 890 : 940, cs * 0.9, CK.blue, sm((t - 13.4) / 0.5));
      if (t > 13.4) for (const sx of [-1, 1]) ckStroke(c, q => ckStar(q, sx * VW * 0.3, (vert ? 890 : 940) - 4, 16, t), CK.yellow, 3, 0.9);
    }
  },
  final(c, st) {                                                 // the chalk tray along the bottom of the board
    c.fillStyle = '#6b4a2e'; c.fillRect(-VW, 972, VW * 2, 28); c.fillStyle = '#8a6240'; c.fillRect(-VW, 972, VW * 2, 6); c.fillStyle = '#4a321e'; c.fillRect(-VW, 0, VW * 2, 12);
    [[-0.3, CK.white, 60], [-0.18, CK.pink, 44], [0.26, CK.yellow, 52], [0.34, CK.blue, 36]].forEach(([fx, col, w]) => { c.fillStyle = col; c.fillRect(VW * fx, 962, w, 11); });
  },
  music(A) {
    const b = 60 / 126, root = 60, CH = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], BR = [0, 5, 7, 0], bar = t => Math.floor(t / (2 * b) + 1e-6) % 4;
    const uke = (t, n, v = 1, pan = 0) => A.pluck(t, n, { type: 'triangle', vol: 0.11 * v, lp: 3000, lpTo: 700, fT: 0.25, dur: 0.4, rev: 0.2, pan });
    const xylo = (t, n, v = 1) => { A.tone(t, mtof(n), 0.45, { vol: 0.16 * v, a: 0.003, rev: 0.25 }); A.tone(t, mtof(n) * 4, 0.07, { vol: 0.03 * v }); };
    const tuba = (t, n, d) => A.tone(t, mtof(n), d, { type: 'triangle', vol: 0.2, a: 0.01, r: 0.06, lp: 460 });
    const tap = (t, v = 1) => A.tone(t, 2100, 0.025, { type: 'square', vol: 0.03 * v });                          // chalk tapping the board
    const scribble = (t, d) => A.noise(t, d, { vol: 0.045, bp: 3400, q: 2.5, a: 0.03, r: 0.05 });
    const groove = (t0, t1, mel, drums = true) => {
      const e = b / 2; for (let k = Math.ceil(t0 / e - 1e-6); k * e < t1 - 0.01; k++) { const t = k * e, c = bar(t), beat = k % 2 === 0;
        if (beat) { tuba(t, root + BR[c] - 24 + (k % 4 === 2 ? 7 : 0), b * 0.6); if (drums) A.tone(t, 110, 0.22, { slide: 55, slideT: 0.08, vol: 0.26, a: 0.006 }); }
        else { for (const n of CH[c]) uke(t, root + n, 0.6, 0.25); if (drums) tap(t); } }
      if (mel) for (const [at, n] of mel) { const t = t0 + at * b / 2; if (t < t1 - 0.02) xylo(t, n); }
    };
    const M1 = [[0, 72], [1, 76], [2, 79], [3, 76], [4, 77], [5, 81], [6, 84], [8, 83], [9, 79], [10, 74], [11, 79], [12, 76], [13, 72], [14, 67]];
    const M2 = [[0, 84], [1, 83], [2, 81], [3, 79], [4, 77], [5, 79], [6, 81], [7, 84], [8, 86], [9, 83], [10, 79], [11, 74], [12, 72]];
    scribble(0.02, 0.35); [72, 76, 79, 84].forEach((n, k) => xylo(0.05 + k * 0.09, n, 0.8));
    groove(0.4, 1.8, null); groove(1.9, 4.6, M1);
    A.tone(4.6, 300, 0.6, { slide: 900, slideT: 0.55, vol: 0.09, a: 0.02 }); groove(4.6, 6.1, null, false); xylo(5.95, 96, 0.7);     // slide whistle for the jump
    A.tone(6.1, 110, 0.25, { slide: 60, vol: 0.25 }); [76, 79, 84].forEach((n, k) => xylo(6.3 + k * b, n, 0.8)); xylo(6.95, 96, 0.6); xylo(7.06, 100, 0.6);
    for (let k = 0; k < 4; k++) tap(7.4 + k * 0.16, 1.4);
    groove(8.1, 10.3, M2);
    A.tone(10.3, 500, 0.5, { slide: 160, slideT: 0.45, vol: 0.08 }); A.tone(10.75, 90, 0.3, { slide: 50, vol: 0.28 });                // the eraser flops down
    scribble(10.65, 1.3); for (let k = 0; k < 8; k++) tap(10.7 + k * 0.17, 1.2);
    scribble(12.0, 0.45); [[0, 72], [1, 76], [2, 79], [3, 84]].forEach(([k, n]) => xylo(12.3 + k * 0.12, n, 1));
    for (const n of [48, 60, 64, 67, 72]) A.tone(12.9, mtof(n), 1.8, { type: 'triangle', vol: 0.06, a: 0.02, r: 0.9, rev: 0.4 });
    xylo(12.9, 88, 1.1); xylo(13.02, 91, 1.0);
    [[0, 79], [1, 76], [2, 79], [3, 84]].forEach(([k, n]) => xylo(13.6 + k * b * 0.75, n, 0.9)); tuba(13.6, 43, 0.3); tuba(13.6 + b * 1.5, 48, 0.9);
    A.noise(13.2, 0.8, { vol: 0.02, lp: 400, a: 0.3, r: 0.3 }); A.noise(14.2, 0.8, { vol: 0.02, lp: 400, a: 0.3, r: 0.3 });           // the eraser snoring
  },
};
