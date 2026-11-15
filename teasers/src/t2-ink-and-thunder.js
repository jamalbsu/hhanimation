// TEASER 2 — INK & THUNDER
// Styles combined: Japanese sumi-e ink wash on rice paper + anime impact frames, speed lines and calligraphy.
// Setting: misty mountains of old Japan under a red sun, with a thunderstorm brewing.
const PAPER = '#efe6d2', INK = '#141210', RED = '#c8352b';
const T = {
  name: 'INK & THUNDER', DUR: 15, gy: 700, scale: 0.75,
  style: { mode: 'ink', fill: INK, far: '#3b3632', ink: INK, eye: '#e0281d', irisHi: '#4a0804', white: '#f6eedb', hi: 'rgba(239,230,210,.55)', nose: INK, whisk: INK },
  shadow: 'rgba(20,18,16,.22)', fxColor: INK,
  post: [['paper', 0.55], ['vignette', 0.4, '50,35,20'], ['grain', 0.05]],
  inverts: [[0, 0.07], [6.93, 7.03], [7.2, 7.26], [10.2, 10.28]],
  shots: [
    { t: [0, 1.8], spd: 1050, z: 1.6, cx: 70, cy: 600, speed: 'h' },
    { t: [1.8, 4.4], spd: 720, z: [0.68, 0.76], cx: -40, cy: 450, px: -40 },
    { t: [4.4, 5.9], mode: 'leap', leap: 250, spd: 800, z: [1.05, 0.95], cx: 40, cy: 560, follow: 0.4, tilt: 0.34, speed: 'radial', speedT: [4.9, 5.4], speedK: 0.6 },
    { t: [5.9, 8.0], spd: 480, cam: 'head', z: [2.3, 2.8], hx: 10, hy: -24, jaw: [6.9, 7.75], shake: [6.95, 30], blink: 6.35, sparkle: 6.5, speed: 'radial', speedT: [6.95, 7.7] },
    { t: [8.0, 10.2], spd: 1200, z: 1.2, px: [-220, 170], cy: 600, speed: 'h' },
    { t: [10.2, 15], mode: 'stand', spd: 0, snap: true, z: [1.3, 1.15], cx: 40, cy: 420 },
  ],
  init() { const S = this.scale; this.gap = [panXAt(4.45) + 110 * S, panXAt(5.85) + 40 * S]; },
  sky(c, st) {
    const g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, '#f3ebd9'); g.addColorStop(1, '#e2d1ad');
    c.fillStyle = g; c.fillRect(-VW, 0, VW * 2, 1000);
    const sx = -VW * 0.16, sy = 300, r = 150;
    c.fillStyle = RED; c.globalAlpha = 0.92; c.beginPath(); c.arc(sx, sy, r, 0, TAU); c.fill();
    for (let i = 0; i < 26; i++) { const a = hash(i, 2) * TAU; c.globalAlpha = 0.25; c.beginPath(); c.arc(sx + Math.cos(a) * (r - 4), sy + Math.sin(a) * (r - 4), 6 + hash(i, 3) * 10, 0, TAU); c.fill(); }
    c.globalAlpha = 1; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const y = 110 + i * 62 + hash(i, 4) * 30, x = ((hash(i, 5) - 0.5) * VW * 1.6 + st.t * (8 + i * 3)) % (VW * 1.6) - VW * 0.8, len = 160 + hash(i, 6) * 260;
      c.strokeStyle = `rgba(20,18,16,${0.07 + hash(i, 7) * 0.08})`; c.lineWidth = 10 + hash(i, 8) * 18; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len / 2, y - 8, x + len, y + 4); c.stroke();
    }
    c.strokeStyle = INK; c.lineWidth = 2.2;
    for (let i = 0; i < 5; i++) { const bx = ((hash(i, 9) * VW + st.t * 30) % (VW * 1.2)) - VW * 0.6, by = 160 + hash(i, 10) * 180, f = Math.sin(st.t * 7 + i) * 6; c.beginPath(); c.moveTo(bx - 12, by - f); c.quadraticCurveTo(bx - 5, by - 4, bx, by); c.quadraticCurveTo(bx + 5, by - 4, bx + 12, by - f); c.stroke(); }
    for (const [a, b] of [[6.9, 7.12], [10.15, 10.4]]) if (st.t >= a && st.t < b) {   // lightning
      c.strokeStyle = INK; c.lineWidth = 7; c.lineJoin = 'miter'; c.beginPath(); let x = VW * 0.2, y = 0; c.moveTo(x, y);
      for (let k = 0; k < 9; k++) { x += (hash(k, a) - 0.5) * 90; y += 70; c.lineTo(x, y); } c.stroke();
    }
  },
  layers: [
    { p: 0.06, draw(c, v) {
      tiles(v.x0, v.x1, 420, (x, i, r) => {
        const h = 360 + r * 220, px = x + hash(i, 2) * 120, g = c.createLinearGradient(0, 760 - h, 0, 760);
        g.addColorStop(0, 'rgba(20,18,16,.34)'); g.addColorStop(1, 'rgba(20,18,16,0)'); c.fillStyle = g;
        c.beginPath(); c.moveTo(px - 300, 780); c.quadraticCurveTo(px - 90, 760 - h * 0.6, px, 760 - h); c.quadraticCurveTo(px + 110, 760 - h * 0.55, px + 320, 780); c.fill();
      });
    } },
    { p: 0.18, draw(c, v) {
      tiles(v.x0, v.x1, 300, (x, i, r) => {
        const h = 200 + r * 170, px = x + hash(i, 4) * 80, g = c.createLinearGradient(0, 800 - h, 0, 800);
        g.addColorStop(0, 'rgba(20,18,16,.6)'); g.addColorStop(0.7, 'rgba(20,18,16,.12)'); g.addColorStop(1, 'rgba(20,18,16,0)'); c.fillStyle = g;
        c.beginPath(); c.moveTo(px - 230, 820); c.lineTo(px - 60, 800 - h * 0.7); c.lineTo(px, 800 - h); c.lineTo(px + 70, 800 - h * 0.75); c.lineTo(px + 240, 820); c.fill();
      });
      const m = c.createLinearGradient(0, 640, 0, 840); m.addColorStop(0, 'rgba(239,230,210,0)'); m.addColorStop(1, 'rgba(239,230,210,.95)');
      c.fillStyle = m; c.fillRect(v.x0, 640, v.x1 - v.x0, 400);
    } },
    { p: 0.45, draw(c, v) {
      tiles(v.x0, v.x1, 640, (x, i, r) => {
        if (r < 0.35) return; const h = 260 + hash(i, 3) * 200, w = 90 + hash(i, 4) * 60, top = 820 - h;
        const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(20,18,16,.85)'); g.addColorStop(1, 'rgba(20,18,16,.35)');
        c.fillStyle = g; c.beginPath(); c.moveTo(x, 900); c.quadraticCurveTo(x - 10, top + 40, x + w * 0.3, top); c.quadraticCurveTo(x + w * 0.7, top - 14, x + w, top + 30); c.lineTo(x + w + 20, 900); c.fill();
        const tx = x + w * 0.5, ty = top - 4; c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 7; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + 30, ty - 60, tx - 10, ty - 120); c.stroke();
        c.fillStyle = 'rgba(20,18,16,.88)';
        for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(tx - 10 + (k % 2 ? 40 : -30), ty - 50 - k * 26, 54 - k * 8, 13, (k % 2 ? 0.08 : -0.08), 0, TAU); c.fill(); }
      });
    } },
    { p: 1, draw(c, v) {
      const gy = 700, [g0, g1] = T.gap;
      const segs = [[v.x0 - 60, Math.min(g0, v.x1 + 60)], [Math.max(g1, v.x0 - 60), v.x1 + 60]].filter(([a, b]) => b > a);
      for (const [a, b] of segs) {
        const g = c.createLinearGradient(0, gy, 0, gy + 500); g.addColorStop(0, 'rgba(20,18,16,.26)'); g.addColorStop(1, 'rgba(20,18,16,.06)');
        c.fillStyle = g; c.fillRect(a, gy, b - a, 1200);
        c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const [w, dy, al] of [[11, 0, 0.95], [5, 7, 0.5], [3, -4, 0.35]]) {
          c.lineWidth = w; c.globalAlpha = al; c.beginPath();
          for (let x = Math.floor(a / 24) * 24; x <= b; x += 24) { const y = gy + dy + (hash(x, w) - 0.5) * 4; x === Math.floor(a / 24) * 24 ? c.moveTo(Math.max(a, x), y) : c.lineTo(Math.min(b, x), y); }
          c.stroke();
        }
        c.globalAlpha = 1;
        for (const ex of [a, b]) if (ex > v.x0 - 50 && ex < v.x1 + 50 && (ex === g0 || ex === g1)) {
          for (let k = 0; k < 5; k++) { c.lineWidth = 9 - k; c.globalAlpha = 0.9 - k * 0.15; c.beginPath(); c.moveTo(ex + (ex === g0 ? -k * 8 : k * 8), gy); c.quadraticCurveTo(ex + (hash(k, ex) - 0.5) * 30, gy + 200, ex + (ex === g0 ? -20 : 20), gy + 520 + k * 60); c.stroke(); }
          c.globalAlpha = 1;
        }
        tiles(Math.max(a, v.x0), Math.min(b, v.x1), 90, (x, i, r) => {
          if (x < a + 30 || x > b - 30) return;
          c.lineWidth = 2.4; c.strokeStyle = INK; c.globalAlpha = 0.8;
          if (r > 0.55) for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + k * 5, gy); c.quadraticCurveTo(x + k * 5 + 4, gy - 12, x + k * 5 + 10 - k * 2, gy - 24 - hash(i, k) * 14); c.stroke(); }
          if (r < 0.12) { c.globalAlpha = 0.85; c.fillStyle = INK; c.beginPath(); c.ellipse(x, gy - 8, 34, 16, -0.1, Math.PI, TAU); c.fill(); }
          c.globalAlpha = 1;
        }, 1, 3);
      }
    } },
    { p: 1.6, draw(c, v, st) {
      if (st.sh.cam === 'head' || st.sh.mode === 'stand') return;
      tiles(v.x0, v.x1, 1150, (x, i, r) => {
        if (r < 0.3) return;
        for (let k = 0; k < 3; k++) {
          const bx = x + k * 46 + hash(i, k) * 20, w = 15 + hash(i, k + 5) * 7; c.fillStyle = `rgba(20,18,16,${0.82 - k * 0.12})`; c.fillRect(bx, -400, w, 1800);
          c.fillStyle = 'rgba(239,230,210,.6)'; for (let y = -380 + hash(i, k + 9) * 80; y < 1200; y += 130) { c.fillRect(bx - 2, y, w + 4, 4);
            if (hash(y, bx) > 0.6) { c.fillStyle = 'rgba(20,18,16,.85)'; c.beginPath(); c.moveTo(bx + w, y); c.quadraticCurveTo(bx + w + 40, y - 30, bx + w + 90, y - 10); c.quadraticCurveTo(bx + w + 40, y - 12, bx + w, y + 6); c.fill(); c.fillStyle = 'rgba(239,230,210,.6)'; } }
        }
      });
    } },
  ],
  overlay(c, st) {
    const t = st.t;
    for (let i = 0; i < 34; i++) {
      const x = ((hash(i, 1) * VW * 1.4 - t * (60 + hash(i, 2) * 80)) % (VW * 1.4) + VW * 1.4) % (VW * 1.4) - VW * 0.7, y = (hash(i, 3) * 1000 + t * (40 + hash(i, 4) * 50)) % 1000;
      c.save(); c.translate(x, y); c.rotate(t * (1 + hash(i, 5) * 2) + i); c.fillStyle = hash(i, 6) > 0.4 ? 'rgba(200,53,43,.8)' : 'rgba(230,120,130,.75)'; c.beginPath(); c.ellipse(0, 0, 7, 3.5, 0, 0, TAU); c.fill(); c.restore();
    }
    const JP = '"Yu Mincho", "MS Mincho", "Hiragino Mincho ProN", serif', EN = 'Georgia, "Times New Roman", serif';
    const vert = (s, x, y0, size, a) => { [...s].forEach((ch, k) => txt(c, ch, x, y0 + k * size * 1.05, size, { font: JP, weight: 900, fill: INK, alpha: a })); };
    const tag = (jp, en, a) => { if (a <= 0) return; const sz = Math.min(64 * LS, VW * 0.11); vert(jp, VW / 2 - sz * 0.9, 110, sz, a); txt(c, en, 0, 930, Math.min(36 * LS, VW * 0.055), { font: EN, weight: 700, fill: INK, alpha: a, spacing: 5, maxW: VW * 0.9 }); };
    tag('山は覚えている', 'THE MOUNTAINS REMEMBER', band(t, 2.0, 4.3, 0.3, 0.3));
    tag('雷より速く', 'FASTER THAN THUNDER', band(t, 8.15, 10.15, 0.2, 0.2));
    if (t > 10.35) {
      const u = clamp((t - 10.35) / 0.9, 0, 1), R = Math.min(VW * 0.36, 210), cy = 250;
      c.save(); c.strokeStyle = INK; c.lineCap = 'round';
      const segs = 60, end = eOut(u) * 0.92;
      for (let k = 0; k < segs * end; k++) { const a0 = -1.9 + (k / segs) * TAU, a1 = a0 + TAU / segs * 1.3; c.lineWidth = 6 + 22 * Math.sin(Math.PI * k / segs); c.globalAlpha = 0.85; c.beginPath(); c.arc(0, cy, R, a0, a1); c.stroke(); }
      c.restore();
      const w = clamp((t - 10.55) / 0.5, 0, 1);
      c.save(); c.beginPath(); c.rect(-VW / 2, 0, VW * eOut(w), 1000); c.clip();
      txt(c, '黒豹', 0, cy, R * 0.95, { font: JP, weight: 900, fill: INK });
      c.restore();
      const a2 = band(t, 11.0, 16, 0.3, 0.1), hs = R * 0.36;
      c.save(); c.globalAlpha = a2; c.translate(R * 0.82, cy + R * 0.62); c.rotate(-0.06); c.fillStyle = RED; c.fillRect(-hs / 2, -hs / 2, hs, hs);
      txt(c, '豹', 0, 2, hs * 0.72, { font: JP, weight: 900, fill: PAPER }); c.restore();
      txt(c, 'PANTHERA', 0, cy + R + 70, Math.min(78 * LS, VW * 0.13), { font: EN, weight: 700, fill: INK, alpha: a2, spacing: 14, maxW: VW * 0.9 });
      txt(c, 'INK  &  THUNDER', 0, cy + R + 130, Math.min(40 * LS, VW * 0.07), { font: EN, weight: 700, italic: true, fill: RED, alpha: a2, spacing: 8, maxW: VW * 0.9 });
      txt(c, '— COMING SOON —', 0, 920, Math.min(34 * LS, VW * 0.06), { font: EN, weight: 700, fill: INK, alpha: band(t, 12.3, 16, 0.4, 0.1), spacing: 6 });
    }
  },
  music(A) {
    const b = 60 / 90, IN = [50, 51, 55, 57, 58, 62, 63, 67, 69, 70, 74];
    const koto = (t, n, v = 1) => A.pluck(t, n, { type: 'triangle', vol: 0.2 * v, lp: 4200, lpTo: 700, fT: 0.5, dur: 0.9, rev: 0.4, pan: (n - 62) / 30 });
    const thunder = (t, v = 1) => { A.noise(t, 3.2, { vol: 0.7 * v, lp: 500, lpTo: 70, a: 0.03, rev: 0.4 }); A.noise(t, 0.25, { vol: 0.3 * v, hp: 1800 }); };
    const gong = (t, v = 1) => { for (const [f, g] of [[98, 1], [197, 0.5], [301, 0.35], [415, 0.25]]) A.tone(t, f, 4.5, { vol: 0.22 * v * g, a: 0.02, rev: 0.6 }); };
    const shime = (t, v = 1) => A.tone(t, 880, 0.06, { type: 'triangle', vol: 0.12 * v });
    const drums = (t0, t1, dense) => {
      for (let t = t0; t < t1 - 0.01; t += b) {
        const k = Math.round((t - t0) / b); A.taiko(t, k % 4 === 0 ? 1.1 : 0.55, k % 4 === 0 ? 62 : 95);
        shime(t + b / 2, 0.8); if (dense) { shime(t + b / 4, 0.5); shime(t + 3 * b / 4, 0.5); A.taiko(t + b / 2, 0.4, 120); }
      }
    };
    thunder(0, 0.8); A.impact(0, 0.9); drums(0, 5.9, false);
    A.tone(0, mtof(38), 5.9, { type: 'sawtooth', lp: 260, vol: 0.14, a: 0.6, r: 0.5 });
    for (let k = 0; k < 20; k++) koto(1.0 + k * b / 2, IN[[0, 2, 3, 4, 5, 4, 3, 2][k % 8] + (k > 11 ? 2 : 0)], 0.9);
    A.whoosh(4.3, 0.9); A.taiko(5.9, 1.3, 55);
    A.seq(5.95, b, [[0, 74, 1.4], [1.5, 75, 0.5]], (t, n, d) => A.flute(t, n, d));
    A.riser(6.3, 6.9, 0.7); for (let k = 0; k < 8; k++) A.taiko(6.4 + k * 0.06, 0.3 + k * 0.06, 110);
    thunder(6.9, 1); A.roar(6.9, 1.0); A.taiko(6.9, 1.4, 50); A.crash(6.9, 0.6); thunder(7.2, 0.6);
    A.impact(8.0, 0.8); drums(8.0, 10.2, true);
    for (let k = 0; k < 13; k++) koto(8.0 + k * b / 2, IN[[5, 7, 8, 7, 5, 4, 3, 4, 5, 7, 8, 9, 10][k]], 1);
    A.whoosh(9.7, 0.5); thunder(10.2, 1.1); A.impact(10.2, 1); A.taiko(10.2, 1.5, 48);
    for (let k = 0; k < 10; k++) koto(10.4 + k * 0.05, IN[10 - k], 0.7);
    gong(10.7, 1.2); A.taiko(10.7, 1.2, 50);
    A.flute(11.1, 62, 2.2, { vol: 0.15 }); A.flute(13.3, 67, 1.6, { vol: 0.13 });
    A.tone(10.7, mtof(38), 4.2, { type: 'sawtooth', lp: 220, vol: 0.12, a: 0.4, r: 1.2 });
    A.taiko(12.3, 0.8, 60); A.taiko(12.3 + b, 0.6, 60); A.taiko(13.9, 1.0, 52);
  },
};
