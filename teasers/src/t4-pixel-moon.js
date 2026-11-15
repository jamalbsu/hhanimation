// TEASER 4 — 8-BIT ODYSSEY
// Styles combined: pixel art (live pixelation + 6-level palette) + retro arcade HUD + CRT scanlines + chiptune.
// Setting: the Moon, with the Earth rising. Low gravity = giant leaps. The panther collects star coins.
const T = {
  name: '8-BIT ODYSSEY', DUR: 15, gy: 720, scale: 0.75, maxCadence: 2.6,
  style: { mode: 'cel', fill: '#231b3d', far: '#130e24', near: '#2a2148', ink: '#05030a', ow: 3.6, hi: '#7a62d8', eye: '#59f0ff', irisHi: '#0f4b86', white: '#ffffff', earIn: '#6a4aa0', nose: '#05030a', whisk: '#d8d0ff' },
  shadow: 'rgba(10,10,30,.45)', fxColor: '#ffffff',
  post: [['pixel', 118, 6], ['scan', 0.3], ['vignette', 0.5]],
  shots: [
    { t: [0, 1.8], spd: 1000, z: 1.6, cx: 70, cy: 610, speed: 'h', flash: 1 },
    { t: [1.8, 4.2], spd: 700, z: [0.7, 0.78], cx: -30, cy: 480, px: -50 },
    { t: [4.2, 6.4], mode: 'leap', leap: 420, spd: 700, z: [1.0, 0.85], cx: 40, cy: 560, follow: 0.55, tilt: 0.28 },
    { t: [6.4, 8.2], spd: 460, cam: 'head', z: [2.3, 2.7], hx: 10, hy: -24, jaw: [7.2, 7.9], shake: [7.25, 26], blink: 6.75, sparkle: 6.9 },
    { t: [8.2, 10.4], spd: 1150, z: 1.2, px: [-220, 170], cy: 610, speed: 'h', flash: 0.5 },
    { t: [10.4, 15], mode: 'stand', spd: 0, snap: true, z: [1.32, 1.15], cx: 40, cy: 560, flash: 0.8 },
  ],
  init() {
    const S = this.scale; this.gap = [panXAt(4.25) + 110 * S, panXAt(6.35) + 40 * S];
    this.coins = [];
    const liftAt = t => { const s = T.shots[shotIdx(t)]; return s.mode === 'leap' ? (s.leap || 220) * Math.sin(Math.PI * clamp((t - s.t[0]) / (s.t[1] - s.t[0]), 0, 1)) : 0; };
    for (let x = panXAt(0.3) + 260; x < panXAt(10.3); x += 230) {
      let tc = null; for (let t = 0; t < DUR; t += 1 / 120) if (panXAt(t) + 120 * S >= x) { tc = t; break; }
      if (tc === null || tc > 10.35 || (tc > 6.4 && tc < 8.2)) continue;
      this.coins.push({ x, y: this.gy - 125 - liftAt(tc), tc });
    }
  },
  sky(c, st) {
    const g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, '#04041a'); g.addColorStop(1, '#1d1552');
    c.fillStyle = g; c.fillRect(-VW, 0, VW * 2, 1000);
    for (let i = 0; i < 140; i++) { const tw = Math.sin(st.t * (2 + hash(i, 5) * 4) + i * 3) > 0.6; c.fillStyle = tw ? '#ffffff' : hash(i, 6) > 0.5 ? '#9fb4ff' : '#ffe9a8'; const s = hash(i, 4) > 0.85 ? 6 : 3;
      c.fillRect((hash(i, 1) - 0.5) * VW * 1.05 - (st.D * 0.004) % 40, hash(i, 2) * 700, s, s); }
    const ex = VW * 0.2, ey = 230, er = 120;
    c.fillStyle = 'rgba(120,180,255,.25)'; c.beginPath(); c.arc(ex, ey, er + 14, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip();
    c.fillStyle = '#2a6fdb'; c.fillRect(ex - er, ey - er, er * 2, er * 2);
    c.fillStyle = '#3fae5a'; const sp = st.t * 6;
    for (const [dx, dy, rx, ry] of [[-40, -30, 46, 30], [10, 20, 40, 54], [70, -50, 36, 24], [-90, 50, 30, 40], [140, 30, 40, 34]]) { const x = ex + ((dx + sp + 200) % 300) - 150; c.beginPath(); c.ellipse(x, ey + dy, rx, ry, 0.4, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.85)'; for (const [dx, dy] of [[-60, -70], [20, -10], [-10, 70], [80, 40]]) { c.beginPath(); c.ellipse(ex + dx, ey + dy, 40, 9, -0.2, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(0,0,25,.6)'; c.beginPath(); c.arc(ex - 70, ey + 40, er * 1.15, 0, TAU); c.fill(); c.restore();
    const px = -VW * 0.3, py = 380; c.fillStyle = '#f0a050'; c.beginPath(); c.arc(px, py, 34, 0, TAU); c.fill();
    c.strokeStyle = '#ffd88a'; c.lineWidth = 6; c.beginPath(); c.ellipse(px, py, 62, 14, -0.3, 0, TAU); c.stroke();
    const cu = (st.t % 5) / 1.2; if (cu < 1) { const cx = -VW * 0.6 + cu * VW * 1.2, cy = 60 + cu * 260; const gr = c.createLinearGradient(cx - 160, cy - 40, cx, cy); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, '#fff');
      c.strokeStyle = gr; c.lineWidth = 6; c.beginPath(); c.moveTo(cx - 160, cy - 40); c.lineTo(cx, cy); c.stroke(); }
  },
  layers: [
    { p: 0.12, draw(c, v) {
      c.fillStyle = '#4a4a78'; c.beginPath(); c.moveTo(v.x0 - 100, 1000);
      for (let x = Math.floor(v.x0 / 60) * 60 - 60; x <= v.x1 + 60; x += 60) c.lineTo(x, 650 - hash(x, 1) * 110 - (hash(Math.floor(x / 360), 2) * 80));
      c.lineTo(v.x1 + 100, 1000); c.fill();
    } },
    { p: 0.35, draw(c, v) {
      c.fillStyle = '#6e6e9c'; c.beginPath(); c.moveTo(v.x0 - 100, 1100);
      for (let x = Math.floor(v.x0 / 40) * 40 - 40; x <= v.x1 + 40; x += 40) c.lineTo(x, 735 - 50 * Math.sin(x / 210) - 30 * Math.sin(x / 93 + 1));
      c.lineTo(v.x1 + 100, 1100); c.fill();
      tiles(v.x0, v.x1, 260, (x, i, r) => { if (r < 0.4) return; const y = 760 + r * 50; c.fillStyle = '#56567e'; c.beginPath(); c.ellipse(x, y, 50 + r * 30, 12, 0, 0, TAU); c.fill(); c.fillStyle = '#8a8ab4'; c.fillRect(x - 50 - r * 30, y - 3, 30, 4); });
    } },
    { p: 1, draw(c, v, st) {
      const gy = T.gy, [g0, g1] = T.gap;
      if (g0 < v.x1 && g1 > v.x0) { c.fillStyle = '#0a0a20'; c.fillRect(g0, gy, g1 - g0, 1200); c.fillStyle = '#1a1a3a'; for (let y = gy + 40; y < gy + 600; y += 60) c.fillRect(g0 + 20, y, g1 - g0 - 40, 6); }
      const segs = [[v.x0 - 60, Math.min(g0, v.x1 + 60)], [Math.max(g1, v.x0 - 60), v.x1 + 60]].filter(([a, b]) => b > a);
      for (const [a, b] of segs) {
        c.fillStyle = '#9a9abb'; c.fillRect(a, gy, b - a, 1200);
        c.fillStyle = '#cfcfe4'; c.fillRect(a, gy - 4, b - a, 22); c.fillStyle = '#ffffff'; c.fillRect(a, gy - 4, b - a, 5);
        tiles(Math.max(a, v.x0), Math.min(b, v.x1), 150, (x, i, r) => {
          if (x < a + 60 || x > b - 60) return; const y = gy + 60 + r * 260, rx = 30 + hash(i, 3) * 40;
          c.fillStyle = '#7d7da2'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.35, 0, 0, TAU); c.fill(); c.fillStyle = '#d6d6ea'; c.fillRect(x - rx * 0.6, y + rx * 0.28, rx * 1.2, 5);
        }, 1, 4);
        for (const ex of [a, b]) if (ex === g0 || ex === g1) { c.fillStyle = '#5f5f86'; c.fillRect(ex === g0 ? ex - 14 : ex, gy, 14, 1200); }
      }
      const fx = panXAt(0) + 140; if (fx > v.x0 - 100 && fx < v.x1 + 100) {
        c.fillStyle = '#d8d8e8'; c.fillRect(fx, gy - 200, 8, 200); c.fillStyle = '#ff3f6c'; c.fillRect(fx + 8, gy - 200, 90, 56);
        c.fillStyle = '#fff'; c.font = '900 40px Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P1', fx + 53, gy - 171);
      }
    } },
    { p: 1.4, draw(c, v, st) {
      if (st.sh.cam === 'head') return;
      c.fillStyle = '#26263f';
      tiles(v.x0, v.x1, 700, (x, i, r) => { if (r < 0.4) return; c.beginPath(); c.moveTo(x - 120, 1200); c.lineTo(x - 90, 1010); c.lineTo(x - 20, 970); c.lineTo(x + 60, 990); c.lineTo(x + 120, 1200); c.fill(); });
    } },
  ],
  beforePanther(c, v, st) {
    for (const k of T.coins) {
      if (k.x < v.x0 - 80 || k.x > v.x1 + 80) continue;
      if (st.ta < k.tc) {
        const bob = Math.sin(st.t * 5 + k.x) * 8, sq = Math.abs(Math.cos(st.t * 4 + k.x));
        c.save(); c.translate(k.x, k.y + bob); c.scale(0.35 + sq * 0.65, 1); c.fillStyle = '#ffd23f'; c.strokeStyle = '#7a4a00'; c.lineWidth = 5; c.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 32, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.stroke(); c.fill(); c.restore();
      } else if (st.ta < k.tc + 0.7) {
        const u = (st.ta - k.tc) / 0.7; c.globalAlpha = 1 - u; c.fillStyle = '#ffffff'; c.font = '900 40px Consolas, monospace'; c.textAlign = 'center'; c.fillText('+100', k.x, k.y - 20 - u * 90); c.globalAlpha = 1;
      }
    }
  },
  overlay(c, st) {
    const t = st.t, F = 'Consolas, "Courier New", monospace', s = Math.min(30 * LS, VW * 0.052);
    const score = 100 * T.coins.filter(k => k.tc <= st.ta).length + (t > 10.4 ? 5000 : 0);
    const hud = (str, x, y, al, col = '#fff', size = s) => txt(c, str, x, y, size, { font: F, weight: 900, fill: col, align: al, shadow: '#000', sx: 4, sy: 4 });
    hud('1UP', -VW / 2 + 24, 40, 'left', '#ff3f6c'); hud('SCORE ' + String(score).padStart(6, '0'), -VW / 2 + 24, 40 + s * 1.2, 'left');
    hud('HI 099900', VW / 2 - 24, 40, 'right', '#59f0ff'); hud('STAGE 4-1', VW / 2 - 24, 40 + s * 1.2, 'right');
    for (let k = 0; k < 3; k++) { const hx = -VW / 2 + 34 + k * 44, hy = 40 + s * 2.6; c.fillStyle = '#ff3f6c'; c.beginPath(); c.arc(hx - 8, hy, 10, Math.PI, 0); c.arc(hx + 8, hy, 10, Math.PI, 0); c.lineTo(hx, hy + 20); c.closePath(); c.fill(); }
    const box = (str, y, a) => { if (a <= 0) return; c.save(); c.globalAlpha = a; c.font = `900 ${s * 1.3}px ${F}`; const w = Math.min(c.measureText(str).width + 50, VW * 0.92);
      c.fillStyle = '#000'; c.fillRect(-w / 2, y - s * 1.2, w, s * 2.4); c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(-w / 2 + 6, y - s * 1.2 + 6, w - 12, s * 2.4 - 12);
      txt(c, str, 0, y + 2, s * 1.3, { font: F, fill: '#fff', maxW: w - 40 }); c.restore(); };
    box('PLAYER 1: PANTHER', 230, band(t, 1.9, 4.1, 0.01, 0.01));
    box('LOW GRAVITY…', 230, band(t, 8.3, 9.3, 0.01, 0.01)); box('…HIGH SCORE!', 230, band(t, 9.3, 10.4, 0.01, 0.01));
    if (t > 10.6) {
      const ts = Math.min(VW * 0.2, 150 * LS), y = 300, drop = eOut((t - 10.6) / 0.5);
      const yy = lerp(-200, y, drop) + (drop < 1 ? 0 : Math.max(0, 1 - (t - 11.1) * 4) * Math.sin((t - 11.1) * 30) * 10);
      for (const [d, col] of [[12, '#ff3f6c'], [6, '#ffd23f']]) txt(c, 'PANTHERA', d, yy + d, ts, { font: '"Arial Black", Impact, sans-serif', fill: col, maxW: VW * 0.9 });
      txt(c, 'PANTHERA', 0, yy, ts, { font: '"Arial Black", Impact, sans-serif', fill: '#ffffff', stroke: '#05030a', sw: ts * 0.06, maxW: VW * 0.9 });
      const a2 = band(t, 11.2, 16, 0.01, 0.01);
      txt(c, '8-BIT ODYSSEY', 0, y + ts * 0.95, ts * 0.38, { font: F, weight: 900, fill: '#59f0ff', alpha: a2, shadow: '#000', sx: 5, sy: 5, maxW: VW * 0.85, spacing: 4 });
      if (t > 12.2 && Math.floor(t * 2.5) % 2 === 0) txt(c, t < 13.4 ? 'PRESS START' : 'COMING SOON', 0, 860, s * 1.4, { font: F, weight: 900, fill: '#ffd23f', shadow: '#000', sx: 5, sy: 5 });
    }
  },
  music(A) {
    const b = 0.4, prog = [[40, [64, 67, 71]], [36, [60, 64, 67]], [43, [62, 67, 71]], [38, [62, 66, 69]]];
    const bar = t => prog[Math.floor(t / (4 * b)) % 4];
    const tri = (t, n, d) => A.tone(t, mtof(n), d, { type: 'triangle', vol: 0.3, r: 0.02 });
    const snare8 = (t, v = 1) => A.noise(t, 0.09, { vol: 0.28 * v, bp: 2600, q: 0.6 });
    const groove = (t0, t1, lead) => {
      for (let t = t0; t < t1 - 0.01; t += b) { const k = Math.round(t / b); A.kick(t, 0.7); if (k % 2) snare8(t); A.noise(t + b / 2, 0.03, { vol: 0.1, hp: 8000 }); }
      for (let t = t0; t < t1 - 0.01; t += b / 2) { const [r] = bar(t); tri(t, r + (Math.round(t / (b / 2)) % 2 ? 12 : 0), b / 2 * 0.85); }
      for (let t = t0; t < t1 - 0.01; t += b / 4) { const ch = bar(t)[1], k = Math.round(t / (b / 4)); A.chip(t, ch[k % 3] + 12, b / 4 * 0.8, { vol: 0.035, type: 'square' }); }
      if (lead) A.seq(t0, b / 2, lead, (t, n, d) => { if (t < t1) A.chip(t, n, d * 0.9, { vol: 0.08 }); });
    };
    const coin = t => { A.chip(t, 83, 0.06, { vol: 0.08 }); A.chip(t + 0.06, 88, 0.2, { vol: 0.08 }); };
    A.boom(0, 0.6); A.chip(0, 76, 0.3, { vol: 0.1, slide: mtof(64) });
    groove(0, 4.2, [[0, 76], [1, 79], [2, 83], [3, 81], [4, 79, 2], [6, 76, 2], [8, 74], [9, 76], [10, 79, 2], [12, 76, 4]]);
    A.chip(4.2, 60, 0.35, { slide: mtof(84), vol: 0.12 });
    groove(4.2, 6.4, [[0, 88, 2], [2, 86, 2], [4, 83, 4]]);
    A.kick(6.4, 1); A.noise(6.4, 0.3, { vol: 0.3, lp: 600 });
    for (let k = 0; k < 12; k++) A.chip(6.55 + k * 0.05, 60 + k * 2, 0.05, { vol: 0.06 });
    A.chip(6.9, 96, 0.4, { vol: 0.05 });
    A.chip(7.2, 55, 0.8, { slide: mtof(31), vol: 0.14 }); A.noise(7.2, 0.8, { vol: 0.4, lp: 1200, lpTo: 200, vib: 0 }); A.boom(7.2, 0.7);
    groove(8.2, 10.4, [[0, 79], [1, 83], [2, 88, 2], [4, 86], [5, 83], [6, 79, 2], [8, 81, 2], [10, 83, 2]]);
    for (const k of T.coins) coin(k.tc);
    A.boom(10.4, 0.7); A.crash(10.4, 0.5);
    A.seq(10.6, 0.15, [[0, 72], [1, 76], [2, 79], [3, 84, 3], [7, 79], [8, 84, 6]], (t, n, d) => A.chip(t, n, d * 0.9, { vol: 0.1 }));
    A.seq(10.6, 0.15, [[0, 48, 3], [3, 52, 4], [7, 55, 7]], (t, n, d) => tri(t, n, d));
    for (let k = 0; k < 6; k++) A.chip(12.2 + k * 0.4, k % 2 ? 79 : 84, 0.1, { vol: 0.05 });
    A.seq(13.4, 0.2, [[0, 72], [1, 76], [2, 79], [3, 84, 6]], (t, n, d) => A.chip(t, n, d * 0.9, { vol: 0.09 }));
  },
};
