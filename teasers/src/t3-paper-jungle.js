// TEASER 3 — THE PAPER JUNGLE
// Styles combined: cut-paper craft + stop-motion (12 fps with "boiling" layers) + pop-up-book depth.
// Setting: a jungle with a lost temple and a river to leap.
const PJ = { sky0: '#9fd8cf', sky1: '#f4f0c6', hill: '#86c08b', temple: '#a9b994', templeD: '#6f8466', tree: '#3f8f5a', tree2: '#5aa86f', trunk: '#7b5536',
  bush: '#2f7a4a', grass: '#5ba455', soil: '#9b6a43', stone: '#bd8e60', water: '#4aa3dc', fg: '#1f5e3a', cream: '#fff8e6', brown: '#4a2c17' };
const paperShadow = (c, k = 1) => { c.shadowColor = 'rgba(40,30,10,.32)'; c.shadowOffsetX = 5 * U * k; c.shadowOffsetY = 6 * U * k; c.shadowBlur = 8 * U * k; };
const T = {
  name: 'THE PAPER JUNGLE', DUR: 15, vol: 0.95, gy: 700, scale: 0.75, stepFps: 12, boil: 2.2,
  style: { mode: 'paper', fill: '#2b2533', far: '#1b1722', near: '#302939', ink: '#17131d', hi: '#4b4256', eye: '#f6c445', irisHi: '#8a5a00', earIn: '#d98fa6', nose: '#17131d', whisk: 'rgba(255,248,230,.8)', blush: true },
  shadow: 'rgba(40,30,10,.25)', fxColor: PJ.cream,
  post: [['paper', 0.42], ['vignette', 0.3, '60,40,10'], ['grain', 0.04]],
  shots: [
    { t: [0, 1.8], spd: 1000, z: 1.6, cx: 70, cy: 600, speed: 'h', speedCol: PJ.cream },
    { t: [1.8, 4.4], spd: 700, z: [0.7, 0.78], cx: -40, cy: 470, px: -50 },
    { t: [4.4, 5.9], mode: 'leap', leap: 260, spd: 780, z: 0.95, cx: 40, cy: 560, follow: 0.4, tilt: 0.34 },
    { t: [5.9, 8.0], spd: 460, cam: 'head', z: [2.3, 2.7], hx: 10, hy: -24, jaw: [6.9, 7.6], shake: [6.95, 22], blink: 6.35, sparkle: 6.5 },
    { t: [8.0, 10.2], spd: 1100, z: 1.2, px: [-220, 170], cy: 600, speed: 'h', speedCol: PJ.cream },
    { t: [10.2, 15], mode: 'stand', spd: 0, snap: true, z: [1.32, 1.15], cx: 40, cy: 545 },
  ],
  init() { const S = this.scale; this.gap = [panXAt(4.45) + 110 * S, panXAt(5.85) + 40 * S]; this.fishX = (this.gap[0] + this.gap[1]) / 2 - 40; },
  sky(c, st) {
    const g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, PJ.sky0); g.addColorStop(0.75, PJ.sky1);
    c.fillStyle = g; c.fillRect(-VW, 0, VW * 2, 1000);
    const sx = VW * 0.2, sy = 190, rot = st.step * 0.02;
    c.save(); paperShadow(c); c.translate(sx, sy); c.rotate(rot); c.fillStyle = '#ffd25a';
    for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(-14, -74); c.lineTo(0, -118); c.lineTo(14, -74); c.fill(); }
    c.fillStyle = '#ffbf3a'; c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.fill(); c.restore();
    c.save(); paperShadow(c, 0.7); c.fillStyle = PJ.cream;
    for (let i = 0; i < 4; i++) { const x = ((hash(i, 1) * VW * 1.5 + st.ta * 14) % (VW * 1.5)) - VW * 0.75, y = 90 + i * 85 + hash(i, 2) * 40, s = 0.7 + hash(i, 3) * 0.6;
      c.beginPath(); c.arc(x, y, 34 * s, Math.PI, TAU); c.arc(x + 44 * s, y - 14 * s, 44 * s, Math.PI, TAU); c.arc(x + 92 * s, y, 30 * s, Math.PI, TAU); c.closePath(); c.fill(); }
    c.restore();
  },
  layers: [
    { p: 0.1, draw(c, v) {
      c.save(); paperShadow(c, 0.8); c.fillStyle = PJ.hill; c.beginPath(); c.moveTo(v.x0 - 300, 1200);
      tiles(v.x0 - 300, v.x1 + 300, 260, (x, i, r) => { c.lineTo(x, 760); c.arc(x + 130, 760, 130, Math.PI, TAU); }, 0);
      c.lineTo(v.x1 + 600, 1200); c.closePath(); c.fill(); c.restore();
    } },
    { p: 0.2, draw(c, v) {
      tiles(v.x0, v.x1, 1500, (x, i, r) => {
        if (r < 0.15) return; c.save(); paperShadow(c);
        for (let k = 0; k < 5; k++) { const w = 440 - k * 72, y = 790 - (k + 1) * 52; c.fillStyle = k % 2 ? PJ.temple : '#b7c6a0'; c.fillRect(x - w / 2, y, w, 54); }
        c.fillStyle = PJ.temple; c.fillRect(x - 60, 790 - 6 * 52 - 40, 120, 92); c.fillStyle = PJ.templeD; c.fillRect(x - 22, 790 - 6 * 52 - 10, 44, 62);
        c.restore(); c.strokeStyle = PJ.tree; c.lineWidth = 7; c.lineCap = 'round';
        for (let k = 0; k < 5; k++) { const vx = x - 180 + k * 85 + hash(i, k) * 30; c.beginPath(); c.moveTo(vx, 790 - 260 + k * 30); c.bezierCurveTo(vx + 14, 790 - 200 + k * 20, vx - 14, 790 - 150, vx + 6, 790 - 100 + hash(k, i) * 40); c.stroke(); }
      });
    } },
    { p: 0.35, draw(c, v) {
      c.save(); paperShadow(c);
      tiles(v.x0, v.x1, 240, (x, i, r) => {
        const h = 330 + r * 160, tx = x + hash(i, 2) * 60;
        c.fillStyle = PJ.trunk; c.beginPath(); c.moveTo(tx - 22, 860); c.lineTo(tx - 12, 860 - h); c.lineTo(tx + 12, 860 - h); c.lineTo(tx + 24, 860); c.fill();
        c.fillStyle = PJ.tree; for (const [dx, dy, rr] of [[-60, 0, 80], [50, -10, 90], [0, -60, 95]]) { c.beginPath(); c.arc(tx + dx, 860 - h + dy, rr, 0, TAU); c.fill(); }
        c.fillStyle = PJ.tree2; c.beginPath(); c.arc(tx - 10, 860 - h - 70, 50, 0, TAU); c.fill();
      });
      c.restore();
    } },
    { p: 0.6, draw(c, v) {
      c.save(); paperShadow(c);
      tiles(v.x0, v.x1, 150, (x, i, r) => {
        const w = 120 + r * 90, h = 70 + hash(i, 3) * 60, bx = x + hash(i, 4) * 40; c.fillStyle = r > 0.5 ? PJ.bush : '#2a6e43';
        c.beginPath(); c.moveTo(bx - w / 2, 800); for (let k = 0; k <= 8; k++) { const u = k / 8, px = bx - w / 2 + u * w, top = 800 - h * Math.sin(Math.PI * u); c.lineTo(px - w / 16, top + 14); c.lineTo(px, top - 6); } c.lineTo(bx + w / 2, 800); c.fill();
      });
      c.restore();
    } },
    { p: 0.8, draw(c, v, st) {
      tiles(v.x0, v.x1, 520, (x, i, r) => {
        if (r < 0.45) return; const bx = x + Math.sin(st.ta * 1.5 + i) * 40, by = 520 + hash(i, 2) * 120 + Math.sin(st.ta * 2.3 + i) * 30, flap = Math.abs(Math.sin(st.step * 1.1 + i));
        const cols = ['#ff7b3a', '#3f88c5', '#f2668b', '#f6c445'], col = cols[i & 3];
        c.save(); paperShadow(c, 0.5); c.translate(bx, by); c.fillStyle = col;
        for (const s of [-1, 1]) { c.save(); c.scale(s * (0.25 + flap * 0.75), 1); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(26, -34, 34, -8); c.quadraticCurveTo(30, 14, 0, 4); c.fill(); c.restore(); }
        c.fillStyle = PJ.brown; c.fillRect(-2, -10, 4, 20); c.restore();
      });
    } },
    { p: 1, draw(c, v, st) {
      const gy = 700, [g0, g1] = T.gap;
      if (g0 < v.x1 && g1 > v.x0) {
        c.fillStyle = PJ.water; c.fillRect(g0, gy + 40, g1 - g0, 1200);
        c.fillStyle = 'rgba(255,255,255,.8)';
        for (let row = 0; row < 6; row++) for (let x = g0 + ((st.step * 7 + row * 23) % 60); x < g1 - 30; x += 60) { const y = gy + 64 + row * 46; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10, y - 7); c.lineTo(x + 20, y); c.lineTo(x + 30, y - 7); c.lineTo(x + 26, y + 2); c.lineTo(x + 20, y + 4); c.lineTo(x + 10, y - 3); c.lineTo(x + 2, y + 3); c.fill(); }
        const fu = (st.ta - 4.75) / 0.9;                  // a paper fish jumps under the leaping panther
        if (fu > 0 && fu < 1) { const fx = T.fishX + fu * 120, fy = gy + 60 - Math.sin(Math.PI * fu) * 190, a = -Math.cos(Math.PI * fu) * 0.9;
          c.save(); paperShadow(c); c.translate(fx, fy); c.rotate(a); c.fillStyle = '#ff8a3d'; c.beginPath(); c.ellipse(0, 0, 34, 16, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(-28, 0); c.lineTo(-52, -16); c.lineTo(-52, 16); c.fill(); c.fillStyle = PJ.cream; c.beginPath(); c.arc(18, -4, 5, 0, TAU); c.fill(); c.fillStyle = PJ.brown; c.beginPath(); c.arc(19, -4, 2.4, 0, TAU); c.fill(); c.restore(); }
      }
      const segs = [[v.x0 - 60, Math.min(g0, v.x1 + 60)], [Math.max(g1, v.x0 - 60), v.x1 + 60]].filter(([a, b]) => b > a);
      for (const [a, b] of segs) {
        c.save(); paperShadow(c); c.fillStyle = PJ.soil; c.fillRect(a, gy + 12, b - a, 1200); c.restore();
        c.fillStyle = PJ.stone; tiles(Math.max(a, v.x0), Math.min(b, v.x1), 110, (x, i, r) => { if (x > a + 30 && x < b - 40) { c.beginPath(); c.ellipse(x, gy + 70 + r * 220, 22 + r * 18, 12 + r * 8, r, 0, TAU); c.fill(); } }, 1, 2);
        c.save(); paperShadow(c, 0.8); c.fillStyle = PJ.grass; c.beginPath(); c.moveTo(a, gy + 30);
        for (let x = Math.ceil(a / 18) * 18; x < b; x += 18) { c.lineTo(x, gy - 4 - hash(x, 3) * 10); c.lineTo(x + 9, gy + 10); }
        c.lineTo(b, gy + 30); c.closePath(); c.fill(); c.restore();
      }
    } },
    { p: 1.5, draw(c, v, st) {
      if (st.sh.cam === 'head') return;
      c.save(); paperShadow(c, 1.4);
      tiles(v.x0, v.x1, 820, (x, i, r) => {
        if (r < 0.35) return; const top = r > 0.75, by = top ? -60 : 1090, a = (top ? 0.9 : -0.9) + (hash(i, 3) - 0.5) * 0.5;
        c.save(); c.translate(x, by); c.rotate(a); c.fillStyle = PJ.fg;
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(110, -130, 0, -300); c.quadraticCurveTo(-110, -130, 0, 0); c.fill();
        c.strokeStyle = '#3d8a5c'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -280); c.stroke();
        for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(0, -k * 48); c.lineTo(60 - k * 6, -k * 48 - 30); c.moveTo(0, -k * 48); c.lineTo(-60 + k * 6, -k * 48 - 30); c.stroke(); }
        c.restore();
      });
      c.restore();
    } },
  ],
  overlay(c, st) {
    const t = st.t, F = '"Segoe UI Black", "Arial Rounded MT Bold", "Arial Black", sans-serif';
    const strip = (s, y, a, rot, col = PJ.cream, size = Math.min(48 * LS, VW * 0.075)) => {
      if (a <= 0) return; c.save(); c.globalAlpha = a; c.translate(0, y); c.rotate(rot);
      c.font = `900 ${size}px ${F}`; const w = Math.min(c.measureText(s).width, VW * 0.86) + 50, h = size * 1.7;
      paperShadow(c); c.fillStyle = col; c.beginPath(); c.moveTo(-w / 2, -h / 2);
      for (let x = -w / 2; x <= w / 2; x += 14) c.lineTo(x, -h / 2 + (hash(x, 1) - 0.5) * 6); for (let x = w / 2; x >= -w / 2; x -= 14) c.lineTo(x, h / 2 + (hash(x, 2) - 0.5) * 6); c.fill();
      c.shadowColor = 'transparent'; txt(c, s, 0, 2, size, { font: F, fill: PJ.brown, maxW: VW * 0.86 }); c.restore();
    };
    const pop = (t0) => { const u = (st.ta - t0); return u < 0 ? 0 : u < 0.17 ? 1.25 : 1; };
    if (pop(2.0)) strip('DEEP IN THE PAPER JUNGLE…', 150, band(t, 2.0, 4.3, 0.01, 0.2), -0.04);
    if (pop(8.15)) { strip('ONE BRAVE PANTHER', 130, band(t, 8.15, 10.15, 0.01, 0.2), 0.03); }
    if (pop(8.6)) strip('IS ON THE RUN!', 130 + Math.min(48 * LS, VW * 0.075) * 1.9, band(t, 8.6, 10.15, 0.01, 0.2), -0.03, '#ffe08a');
    if (t > 10.5) {
      const L = 'PANTHERA', cols = ['#e94f37', '#f6c445', '#3f88c5', '#44bba4'], tile = Math.min(VW * 0.105, 96 * LS), y = 210;
      for (let k = 0; k < L.length; k++) {
        const s = pop(10.5 + k * 0.083); if (!s) continue;
        const x = (k - (L.length - 1) / 2) * tile * 1.08, rot = (hash(k, 3) - 0.5) * 0.35 + (hash(st.step, k) - 0.5) * 0.04;
        c.save(); c.translate(x, y + (hash(k, 5) - 0.5) * 18); c.rotate(rot); c.scale(s, s); paperShadow(c);
        c.fillStyle = cols[k % 4]; c.fillRect(-tile / 2, -tile * 0.6, tile, tile * 1.2); c.shadowColor = 'transparent';
        txt(c, L[k], 0, 4, tile * 0.95, { font: F, fill: k % 4 === 1 ? PJ.brown : PJ.cream }); c.restore();
      }
      if (pop(11.3)) strip('THE PAPER JUNGLE', y + tile * 1.15, 1, -0.02, PJ.cream, Math.min(54 * LS, VW * 0.08));
      if (pop(12.3)) { c.save(); c.translate(0, 905); c.rotate(-0.08 + (hash(st.step, 9) - 0.5) * 0.03); paperShadow(c); c.fillStyle = '#e94f37'; c.beginPath();
        for (let k = 0; k < 24; k++) { const r = k % 2 ? 64 : 74; c.lineTo(Math.cos(k * TAU / 24) * r * 2.2, Math.sin(k * TAU / 24) * r * 0.75); } c.fill(); c.shadowColor = 'transparent';
        txt(c, 'COMING SOON', 0, 2, Math.min(36 * LS, VW * 0.06), { font: F, fill: PJ.cream }); c.restore(); }
    }
  },
  music(A) {
    const b = 60 / 112, P = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
    const bongo = (t, hi, v = 1) => A.tone(t, hi ? 420 : 290, 0.14, { slide: hi ? 380 : 250, vol: 0.32 * v, rev: 0.1 });
    const shaker = (t, v = 1) => A.noise(t, 0.06, { vol: 0.08 * v, bp: 6000, q: 1.5, a: 0.02 });
    const pizz = (t, n) => A.pluck(t, n, { type: 'triangle', vol: 0.3, lp: 1200, lpTo: 200, fT: 0.25, dur: 0.35 });
    const bird = (t, f = 1800) => { A.tone(t, f, 0.09, { slide: f * 1.5, vol: 0.06 }); A.tone(t + 0.12, f * 1.1, 0.09, { slide: f * 1.6, vol: 0.05 }); };
    const groove = (t0, t1, riff) => {
      for (let t = t0; t < t1 - 0.01; t += b / 2) { const k = Math.round((t - t0) / (b / 2)); bongo(t, k % 4 === 1 || k % 4 === 2, k % 2 ? 0.6 : 1); shaker(t + b / 4); if (k % 2 === 0) pizz(t, [48, 48, 55, 57, 53, 53, 55, 55][(k / 2) % 8]); }
      for (let k = 0; t0 + k * b / 2 < t1 - 0.01; k++) A.marimba(t0 + k * b / 2, P[riff[k % riff.length]], 0.9);
    };
    A.impact(0, 0.6); groove(0, 5.9, [0, 2, 4, 2, 3, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2]);
    bird(0.8); bird(2.6, 2300); bird(3.9, 2000);
    A.tone(4.4, 220, 0.55, { slide: 760, vol: 0.2, vib: [12, 30] }); A.whoosh(4.4, 0.8, 0.7);
    A.noise(5.0, 0.5, { vol: 0.35, bp: 900, bpTo: 300, a: 0.01, rev: 0.3 }); A.tone(5.0, 600, 0.12, { slide: 1200, vol: 0.12 });
    A.kick(5.9, 1); A.tom(5.9, 140);
    A.pad(5.9, [60, 64, 67], 2.1, { type: 'triangle', vol: 0.07, lp: 2000 });
    for (let k = 0; k < 6; k++) A.marimba(6.0 + k * 0.08, P[3 + k], 0.6);
    A.riser(6.3, 6.9, 0.5); A.roar(6.9, 0.8, 0.75); A.boom(6.9, 0.6);
    A.impact(8.0, 0.6); groove(8.0, 10.2, [5, 7, 8, 7, 5, 4, 5, 7, 9, 8, 7, 5]);
    A.impact(10.2, 0.8);
    for (let k = 0; k < 8; k++) A.tone(10.5 + k * 0.083, mtof(P[k + 1]), 0.12, { type: 'triangle', vol: 0.18 });
    A.boom(10.6, 0.5); A.pad(10.6, [60, 64, 67, 72], 4.2, { type: 'triangle', vol: 0.06, r: 1.2 });
    A.seq(11.3, b / 2, [[0, 72], [1, 76], [2, 79], [3, 76], [4, 74], [5, 76], [6, 72, 2]], (t, n, d) => A.marimba(t, n));
    bird(12.0, 2100); A.seq(12.3, b / 2, [[0, 67], [1, 72, 3]], (t, n, d) => A.marimba(t, n, 1.1)); bird(13.6, 1900);
  },
};
