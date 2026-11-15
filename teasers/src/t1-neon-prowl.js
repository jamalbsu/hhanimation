// TEASER 1 — NEON PROWL
// Styles combined: neon line-art panther with motion trails + synthwave sunset + VHS/CRT tape look.
// Setting: rain-soaked cyberpunk rooftops at night.
const CY = '#3ff6ff', PK = '#ff3fd8';
const T = {
  name: 'NEON PROWL', DUR: 15, gy: 700, scale: 0.75,
  style: { mode: 'neon', fill: '#0a0614', far: '#0a0614', line: CY, line2: PK, ow: 3.2, glow: 14, eye: PK, hi: PK, trail: 4 },
  shadow: 'rgba(255,63,216,.32)', fxColor: CY,
  post: [['bloom', 0.6], ['vhs', 1], ['scan', 0.22], ['vignette', 0.6], ['grain', 0.07]],
  shots: [
    { t: [0, 1.8], spd: 1100, z: 1.7, cx: 70, cy: 600, speed: 'h', flash: 1 },
    { t: [1.8, 4.4], spd: 760, z: [0.7, 0.78], cx: 20, cy: 470, px: -60 },
    { t: [4.4, 5.9], mode: 'leap', leap: 240, spd: 820, z: 1.0, cx: 40, cy: 560, follow: 0.4, tilt: 0.32 },
    { t: [5.9, 8.0], spd: 520, cam: 'head', z: [2.4, 2.9], hx: 10, hy: -24, jaw: [6.9, 7.7], shake: [6.95, 28], blink: 6.3, sparkle: 6.45, speed: 'radial', speedT: [6.95, 7.6], speedCol: PK },
    { t: [8.0, 10.2], spd: 1250, z: 1.25, px: [-230, 170], cy: 600, speed: 'h', flash: 0.6 },
    { t: [10.2, 15], mode: 'stand', spd: 0, snap: true, z: [1.3, 1.12], cx: 40, cy: 560, flash: 0.8 },
  ],
  init() { const S = this.scale; this.gap = [panXAt(4.45) + 110 * S, panXAt(5.85) + 40 * S]; },
  sky(c, st) {
    const g = c.createLinearGradient(0, 0, 0, 1000);
    g.addColorStop(0, '#05010d'); g.addColorStop(0.45, '#1d0638'); g.addColorStop(0.7, '#5b0f5e'); g.addColorStop(0.86, '#ff2e7e'); g.addColorStop(1, '#ff8a4c');
    c.fillStyle = g; c.fillRect(-VW, 0, VW * 2, 1000);
    for (let i = 0; i < 110; i++) { c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(st.t * (1 + hash(i, 3) * 3) + i)); c.fillStyle = '#fff'; const s = 1 + hash(i, 4) * 2.2; c.fillRect((hash(i, 1) - 0.5) * VW * 1.1, hash(i, 2) * 480, s, s); }
    c.globalAlpha = 1;
    const sx = VW * 0.14, sy = 560, r = 170;
    const halo = c.createRadialGradient(sx, sy, r * 0.6, sx, sy, r * 2.4); halo.addColorStop(0, 'rgba(255,60,160,.55)'); halo.addColorStop(1, 'rgba(255,60,160,0)');
    c.fillStyle = halo; c.fillRect(sx - r * 3, sy - r * 3, r * 6, r * 6);
    const sg = c.createLinearGradient(0, sy - r, 0, sy + r); sg.addColorStop(0, '#fff3a0'); sg.addColorStop(0.5, '#ff9a3c'); sg.addColorStop(1, '#ff2e88');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, r, 0, TAU); c.fill();
    c.fillStyle = g; for (let k = 0; k < 7; k++) { const y = sy + 10 + k * 24 + ((st.t * 12) % 24); c.fillRect(sx - r - 2, y, r * 2 + 4, 3 + k * 1.6); }
  },
  layers: [
    { p: 0.12, draw(c, v) {
      tiles(v.x0, v.x1, 70, (x, i, r) => {
        const w = 50 + r * 60, h = 120 + hash(i, 3) * 300, top = 760 - h;
        c.fillStyle = '#170a2e'; c.fillRect(x, top, w, h + 500);
        c.strokeStyle = 'rgba(255,63,216,.4)'; c.lineWidth = 1.5; c.strokeRect(x, top, w, h + 500);
        for (let k = 0; k < 9; k++) if (hash(i, k + 70) > 0.35) { c.fillStyle = hash(i, k + 50) > 0.5 ? 'rgba(63,246,255,.7)' : 'rgba(255,63,216,.6)'; c.fillRect(x + 6 + hash(i, k + 10) * (w - 14), top + 10 + hash(i, k + 30) * (h - 20), 4, 6); }
      });
    } },
    { p: 0.4, draw(c, v, st) {
      const signs = ['パンサー', '黒豹', 'ネオン', '夜猫'];
      tiles(v.x0, v.x1, 200, (x, i, r) => {
        const w = 110 + r * 70, h = 280 + hash(i, 3) * 360, top = 840 - h;
        c.fillStyle = '#0e0620'; c.fillRect(x, top, w, h + 600);
        for (let wy = top + 24; wy < top + h; wy += 34) for (let wx = x + 10; wx < x + w - 14; wx += 22) if (hash(wx * 0.1, wy) > 0.72) { c.fillStyle = hash(wy, wx) > 0.5 ? 'rgba(63,246,255,.45)' : 'rgba(255,200,120,.35)'; c.fillRect(wx, wy, 10, 14); }
        c.strokeStyle = CY; c.globalAlpha = 0.85; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, top + h + 600); c.lineTo(x, top); c.lineTo(x + w, top); c.lineTo(x + w, top + h + 600); c.stroke(); c.globalAlpha = 1;
        c.strokeStyle = '#2a1840'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w * 0.5, top); c.lineTo(x + w * 0.5, top - 60); c.stroke();
        if (Math.sin(st.t * 4 + i) > 0) { c.fillStyle = '#ff2040'; c.beginPath(); c.arc(x + w * 0.5, top - 62, 4, 0, TAU); c.fill(); }
        if (hash(i, 7) > 0.4) {
          const s = signs[Math.floor(hash(i, 8) * signs.length)], sx = x + w - 34, sy = top + 50, col = hash(i, 9) > 0.5 ? PK : CY;
          const on = hash(Math.floor(st.t * 10), i) > 0.06;
          c.fillStyle = 'rgba(10,4,20,.9)'; c.fillRect(sx, sy, 28, s.length * 30 + 12);
          c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(sx, sy, 28, s.length * 30 + 12);
          c.globalAlpha = on ? 1 : 0.25; c.fillStyle = col; c.font = '900 22px "Yu Gothic", "Meiryo", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          [...s].forEach((ch, k) => c.fillText(ch, sx + 14, sy + 22 + k * 30)); c.globalAlpha = 1;
        }
      });
    } },
    { p: 1, draw(c, v, st) {
      const gy = 700, [g0, g1] = T.gap;
      const segs = [[v.x0 - 60, Math.min(g0, v.x1 + 60)], [Math.max(g1, v.x0 - 60), v.x1 + 60]].filter(([a, b]) => b > a);
      if (g0 < v.x1 && g1 > v.x0) {
        const gg = c.createLinearGradient(0, gy, 0, gy + 700); gg.addColorStop(0, 'rgba(255,46,126,0)'); gg.addColorStop(1, 'rgba(255,46,126,.35)');
        c.fillStyle = gg; c.fillRect(g0, gy, g1 - g0, 900);
      }
      for (const [a, b] of segs) {
        c.fillStyle = '#0b0618'; c.fillRect(a, gy, b - a, 1200);
        for (let wx = Math.floor(a / 60) * 60; wx < b - 20; wx += 60) for (let wy = gy + 70; wy < gy + 900; wy += 72) if (wx > a + 10 && hash(wx, wy) > 0.66) { c.fillStyle = hash(wy, wx) > 0.5 ? 'rgba(63,246,255,.4)' : 'rgba(255,63,216,.35)'; c.fillRect(wx, wy, 16, 22); }
        c.fillStyle = '#1b1132'; c.fillRect(a, gy - 4, b - a, 20);
        c.save(); c.strokeStyle = CY; c.lineWidth = 3; c.shadowColor = CY; c.shadowBlur = 12 * v.k;
        c.beginPath(); c.moveTo(a, gy - 4); c.lineTo(b, gy - 4); c.stroke();
        if (a > v.x0 - 50) { c.beginPath(); c.moveTo(a, gy - 4); c.lineTo(a, gy + 1200); c.stroke(); }
        if (b < v.x1 + 50) { c.beginPath(); c.moveTo(b, gy - 4); c.lineTo(b, gy + 1200); c.stroke(); }
        c.restore();
        tiles(Math.max(a, v.x0), Math.min(b, v.x1), 340, (x, i, r) => {
          if (x < a + 120 || x > b - 160 || r < 0.35) return;
          c.fillStyle = '#140c26'; c.strokeStyle = 'rgba(255,63,216,.7)'; c.lineWidth = 2;
          if (r > 0.7) { c.fillRect(x, gy - 50, 70, 46); c.strokeRect(x, gy - 50, 70, 46); c.beginPath(); c.arc(x + 35, gy - 27, 15, 0, TAU); c.stroke(); }
          else { c.fillRect(x, gy - 130, 8, 126); c.beginPath(); c.moveTo(x - 30, gy - 110); c.lineTo(x + 38, gy - 110); c.moveTo(x - 20, gy - 90); c.lineTo(x + 28, gy - 90); c.stroke(); }
        }, 1, 5);
      }
    } },
    { p: 1.6, draw(c, v) {
      tiles(v.x0, v.x1, 1500, (x, i, r) => {
        const y0 = 230 + r * 80, x1 = x + 1000, y1 = 260 + hash(i, 2) * 60, sag = 170;
        c.strokeStyle = '#05020a'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo((x + x1) / 2, Math.max(y0, y1) + sag, x1, y1); c.stroke();
        for (let k = 1; k < 5; k++) { const u = k / 5, lx = lerp(x, x1, u), ly = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (Math.max(y0, y1) + sag) + u * u * y1;
          c.save(); c.fillStyle = k % 2 ? PK : CY; c.shadowColor = c.fillStyle; c.shadowBlur = 16 * v.k; c.beginPath(); c.arc(lx, ly + 16, 9, 0, TAU); c.fill(); c.restore(); }
      });
    } },
  ],
  overlay(c, st) {
    const t = st.t;
    c.strokeStyle = 'rgba(160,240,255,.35)'; c.lineWidth = 1.4;
    for (let i = 0; i < 140; i++) { const sp = 1300 + hash(i, 3) * 700, x = (hash(i, 1) - 0.5) * VW * 1.3, y = ((hash(i, 2) * 1100 + t * sp) % 1150) - 80; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y + 38); c.stroke(); }
    const big = Math.min(VW * 0.13, 92 * LS), glitch = hash(Math.floor(t * 20), 4) > 0.82;
    const say = (s, y, a, size = big) => {
      if (a <= 0) return;
      if (glitch) { txt(c, s, -5, y, size, { fill: PK, alpha: a * 0.7, maxW: VW * 0.9, italic: true }); txt(c, s, 5, y, size, { fill: CY, alpha: a * 0.7, maxW: VW * 0.9, italic: true }); }
      txt(c, s, 0, y, size, { fill: '#f4fbff', glow: CY, blur: 16, alpha: a, maxW: VW * 0.9, italic: true });
    };
    say('THE CITY NEVER SLEEPS', 150, band(t, 2.0, 4.3, 0.2, 0.3));
    say('NEITHER DOES', 140, band(t, 8.15, 10.15, 0.15, 0.2)); say('THE PANTHER', 140 + big * 1.05, band(t, 8.35, 10.15, 0.15, 0.2));
    if (t > 10.5) {
      const u = (t - 10.5) / 0.35, flick = u < 1 ? (hash(Math.floor(t * 40), 2) > 0.45 ? 1 : 0.15) : 1, s = lerp(1.35, 1, eOut(u));
      const ts = Math.min(VW * 0.22, 170 * LS) * s, y = 210;
      const gr = c.createLinearGradient(0, y - ts / 2, 0, y + ts / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#8fe6ff'); gr.addColorStop(0.52, '#3a2a7a'); gr.addColorStop(1, PK);
      txt(c, 'PANTHERA', 0, y, ts, { fill: gr, stroke: '#12062a', sw: ts * 0.08, glow: CY, blur: 24, alpha: flick, maxW: VW * 0.92, italic: true, spacing: 2 });
      const a2 = band(t, 10.9, 16, 0.3, 0.1);
      txt(c, 'Neon Prowl', 0, y + ts * 0.82, ts * 0.52, { font: '"Segoe Script", "Brush Script MT", cursive', weight: 700, fill: '#ffe6fb', glow: PK, blur: 18, alpha: a2, double: true, maxW: VW * 0.8 });
      txt(c, 'パンサー ・ ネオン', 0, y + ts * 1.32, ts * 0.17, { font: '"Yu Gothic", "Meiryo", sans-serif', fill: CY, alpha: a2 * 0.9, spacing: 6 });
      if (t > 12.4 && Math.floor(t * 2.2) % 2 === 0) txt(c, 'COMING SOON', 0, 900, Math.min(VW * 0.075, 48 * LS), { fill: '#fff', glow: PK, blur: 14, spacing: 8 });
    }
    c.font = '700 22px Consolas, monospace'; c.fillStyle = 'rgba(255,255,255,.8)'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('▶ PLAY', -VW / 2 + 26, 30); c.textAlign = 'right'; c.fillText('REC ' + String(Math.floor(t / 60)).padStart(2, '0') + ':' + (t % 60).toFixed(2).padStart(5, '0'), VW / 2 - 26, 30);
    if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ff2040'; c.beginPath(); c.arc(VW / 2 - 26 - c.measureText('REC 00:00.00').width - 18, 41, 7, 0, TAU); c.fill(); }
  },
  music(A) {
    const b = 0.5, chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], roots = [45, 41, 48, 43];
    const bar = t => Math.floor(t / (4 * b)) % 4;
    const groove = (t0, t1, lead) => {
      for (let t = t0; t < t1 - 0.01; t += b) { const k = Math.round(t / b); A.kick(t); if (k % 2) A.clap(t, 0.8); A.hat(t + b / 2, 0.8); A.hat(t, 0.4); }
      for (let t = t0; t < t1 - 0.01; t += b / 2) { const r = roots[bar(t)]; A.bass(t, r + (Math.round(t / (b / 2)) % 2 ? 12 : 0), b / 2 * 0.9); }
      for (let t = t0; t < t1 - 0.01; t += b / 4) { const ch = chords[bar(t)], k = Math.round(t / (b / 4)); A.pluck(t, ch[k % 3] + 12 * (Math.floor(k / 3) % 2), { vol: 0.07, dur: 0.25, pan: k % 2 ? 0.3 : -0.3 }); }
      for (let t = Math.ceil(t0 / (4 * b)) * 4 * b; t < t1; t += 4 * b) A.pad(t, chords[bar(t)].map(n => n + 12), Math.min(4 * b, t1 - t));
      if (t0 % (4 * b)) A.pad(t0, chords[bar(t0)].map(n => n + 12), 4 * b - (t0 % (4 * b)));
    };
    A.impact(0); groove(0, 5.9);
    A.whoosh(4.3, 0.8); A.kick(5.9, 1.2); A.boom(5.9, 0.6);
    A.pad(5.9, [45, 52, 57, 60], 2.2, { vol: 0.06, lp: 900 });
    A.kick(6.0, 0.7); A.kick(6.22, 0.5); A.kick(6.6, 0.7); A.kick(6.82, 0.5);
    A.pluck(6.45, 88, { vol: 0.12, dur: 0.9 }); A.pluck(6.52, 93, { vol: 0.1, dur: 1.1 });
    A.riser(6.2, 6.9); A.roar(6.9, 0.95); A.boom(6.9, 0.8); A.crash(6.9);
    A.impact(8.0, 0.8); groove(8.0, 10.2);
    A.seq(8.0, b / 2, [[0, 76, 1], [1, 74, 1], [2, 72, 1], [3, 74, 1], [4, 76, 2], [6, 79, 2]], (t, n, d) => A.tone(t, mtof(n), d, { type: 'sawtooth', lp: 2600, vol: 0.09, r: 0.05, vib: [6, 3], rev: 0.4 }));
    A.whoosh(9.6, 0.6); A.impact(10.2, 1); A.riser(10.25, 10.6, 0.6); A.boom(10.6, 0.9); A.crash(10.6, 1.2);
    A.pad(10.6, [57, 60, 64, 69], 4.4, { vol: 0.05, a: 0.2, r: 1.5 }); A.bass(10.6, 33, 4.2, { vol: 0.3, r: 1.2 });
    for (let k = 0; k < 16; k++) A.pluck(10.6 + k * 0.25, [69, 72, 76, 79][k % 4], { vol: 0.06 * (1 - k / 18), dur: 0.4 });
    A.chip(12.4, 81, 0.08, { vol: 0.05 }); A.chip(12.5, 88, 0.15, { vol: 0.05 });
  },
};
