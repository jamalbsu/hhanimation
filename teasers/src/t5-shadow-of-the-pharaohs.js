// TEASER 5 — SHADOW OF THE PHARAOHS
// Styles combined: shadow-puppet silhouettes + pop-art comic book (Ben-Day halftone sky, caption boxes, SFX bursts, panel frame).
// Setting: ancient Egypt at sunset; the panther wears a golden collar like the cat goddess Bastet.
const YEL = '#ffe14d', RD = '#ff3b30';
const T = {
  name: 'SHADOW OF THE PHARAOHS', DUR: 15, gy: 700, scale: 0.75,
  style: { mode: 'sil', fill: '#000', far: '#000', eye: '#ffd23f', collar: '#ffcf3f', gem: '#2ec4ff' },
  shadow: null, fxColor: '#000',
  post: [['vignette', 0.35], ['grain', 0.06]],
  shots: [
    { t: [0, 1.8], spd: 1050, z: 1.6, cx: 70, cy: 560, speed: 'h', flash: 1 },
    { t: [1.8, 4.4], spd: 720, z: [0.7, 0.78], cx: -40, cy: 460, px: -50 },
    { t: [4.4, 5.9], mode: 'leap', leap: 250, spd: 800, z: 1.0, cx: 40, cy: 560, follow: 0.4, tilt: 0.32 },
    { t: [5.9, 8.0], spd: 480, cam: 'head', z: [2.3, 2.7], hx: 10, hy: -24, jaw: [6.9, 7.7], shake: [6.95, 28], blink: 6.35, speed: 'radial', speedT: [6.95, 7.7], speedCol: '#000' },
    { t: [8.0, 10.2], spd: 1200, z: 1.2, px: [-220, 170], cy: 560, speed: 'h' },
    { t: [10.2, 15], mode: 'stand', spd: 0, snap: true, z: [1.32, 1.15], cx: 40, cy: 520, flash: 0.8 },
  ],
  init() { this.obelisk = panXAt(5.15) + 40; },
  sky(c, st) {
    const b = buf('sky5', W, H, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a0f6b'); gr.addColorStop(0.32, '#c2185b'); gr.addColorStop(0.58, '#ff6f3c'); gr.addColorStop(0.76, '#ffc93c'); gr.addColorStop(1, '#ffe9a8');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const sx = w * 0.5, sy = h * 0.6, sr = Math.min(w, h) * 0.32;
      g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill();
      const d = h / 95;
      for (let row = 0, y = 0; y < h; row++, y += d * 0.87) for (let x = (row % 2) * d / 2; x < w; x += d) {
        const dist = Math.hypot(x - sx, y - sy) / sr, inSun = dist < 1;
        const r = inSun ? d * 0.32 * clamp((dist - 0.55) / 0.45, 0, 1) : d * 0.42 * clamp(1 - y / (h * 0.75), 0.15, 1);
        if (r < 0.4) continue; g.fillStyle = inSun ? 'rgba(255,140,60,.55)' : 'rgba(90,10,60,.28)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    });
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(b, 0, 0);
  },
  layers: [
    { p: 0.06, draw(c, v) {
      c.fillStyle = '#a8325e';
      tiles(v.x0, v.x1, 820, (x, i, r) => { if (r < 0.25) return; const w = 360 + r * 220, h = w * 0.62, px = x + hash(i, 2) * 200; c.beginPath(); c.moveTo(px - w / 2, 780); c.lineTo(px, 780 - h); c.lineTo(px + w / 2, 780); c.fill(); });
    } },
    { p: 0.16, draw(c, v) {
      c.fillStyle = '#5e1846';
      tiles(v.x0, v.x1, 1100, (x, i, r) => {
        if (r > 0.55) {   // sphinx
          const sx = x, sy = 800; c.beginPath(); c.moveTo(sx - 260, sy); c.lineTo(sx - 250, sy - 70); c.quadraticCurveTo(sx - 120, sy - 110, sx + 30, sy - 100); c.lineTo(sx + 40, sy - 190);
          c.lineTo(sx + 20, sy - 200); c.lineTo(sx + 60, sy - 250); c.lineTo(sx + 120, sy - 250); c.lineTo(sx + 150, sy - 200); c.lineTo(sx + 130, sy - 190); c.lineTo(sx + 130, sy - 100);
          c.lineTo(sx + 240, sy - 40); c.lineTo(sx + 250, sy); c.fill();
        } else { const w = 300 + r * 200, h = w * 0.6; c.beginPath(); c.moveTo(x - w / 2, 800); c.lineTo(x, 800 - h); c.lineTo(x + w / 2, 800); c.fill(); }
      });
    } },
    { p: 0.3, draw(c, v, st) {
      c.fillStyle = '#26061f';
      tiles(v.x0, v.x1, 480, (x, i, r) => { if (r < 0.45) return; const bx = x + st.t * 50, by = 250 + hash(i, 2) * 200, f = Math.sin(st.t * 8 + i) * 14;
        c.beginPath(); c.moveTo(bx - 34, by - f); c.quadraticCurveTo(bx - 14, by - 10, bx, by); c.quadraticCurveTo(bx + 14, by - 10, bx + 34, by - f); c.lineTo(bx + 30, by - f + 4); c.quadraticCurveTo(bx + 12, by - 4, bx, by + 6); c.quadraticCurveTo(bx - 12, by - 4, bx - 30, by - f + 4); c.fill();
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 40, by + 4); c.lineTo(bx + 44, by + 12); c.lineWidth = 3; c.strokeStyle = '#26061f'; c.stroke(); });
    } },
    { p: 0.42, draw(c, v, st) {
      c.fillStyle = '#26061f'; c.strokeStyle = '#26061f'; c.lineCap = 'round';
      tiles(v.x0, v.x1, 330, (x, i, r) => {
        if (r < 0.3) return;
        if (r > 0.82) { c.beginPath(); c.moveTo(x - 30, 820); c.lineTo(x - 20, 820 - 360); c.lineTo(x, 820 - 410); c.lineTo(x + 20, 820 - 360); c.lineTo(x + 30, 820); c.fill(); return; }
        const h = 260 + hash(i, 3) * 160, lean = (hash(i, 4) - 0.5) * 120, tx = x + lean, ty = 820 - h, sway = Math.sin(st.t * 1.6 + i) * 6;
        c.lineWidth = 16; c.beginPath(); c.moveTo(x, 830); c.quadraticCurveTo(x + lean * 0.2, 820 - h * 0.5, tx, ty); c.stroke();
        c.lineWidth = 11; for (let k = 0; k < 7; k++) { const a = -Math.PI + (k / 6) * Math.PI, L = 120; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - 20 + sway, tx + Math.cos(a) * L, ty + Math.sin(a) * L * 0.4 + 40 + sway); c.stroke(); }
      });
    } },
    { p: 1, draw(c, v, st) {
      const gy = 700; c.fillStyle = '#000'; c.beginPath(); c.moveTo(v.x0 - 50, 1300);
      for (let x = Math.floor(v.x0 / 30) * 30 - 30; x <= v.x1 + 30; x += 30) c.lineTo(x, gy + 3 * Math.sin(x / 70) + 2);
      c.lineTo(v.x1 + 50, 1300); c.fill();
      const ng = c.createLinearGradient(0, gy + 80, 0, gy + 420); ng.addColorStop(0, '#3a0f3f'); ng.addColorStop(1, '#12031a');   // the Nile, reflecting the sunset
      c.fillStyle = ng; c.fillRect(v.x0 - 50, gy + 80, v.x1 - v.x0 + 100, 1200);
      for (let k = 0; k < 14; k++) { const y = gy + 92 + k * 22, w = 60 + hash(k, 2) * 160, sx = st.cx + (hash(k, 3) - 0.5) * 300 + Math.sin(st.t * 2 + k) * 20;
        c.fillStyle = k % 3 ? 'rgba(255,170,60,.55)' : 'rgba(255,225,120,.75)'; c.fillRect(sx - w / 2, y, w, 5); }
      c.fillStyle = '#000'; c.fillRect(v.x0 - 50, gy + 72, v.x1 - v.x0 + 100, 10);
      c.fillStyle = 'rgba(255,207,63,.28)'; c.font = '700 34px "Segoe UI Historic", "Segoe UI Symbol", sans-serif'; c.textBaseline = 'middle';
      tiles(v.x0, v.x1, 64, (x, i) => c.fillText(['𓃠', '𓂀', '𓆣', '𓋹', '𓅓', '𓇳'][i % 6 < 0 ? 0 : ((i % 6) + 6) % 6], x, gy + 40), 1);
      c.fillStyle = '#000';
      const ox = T.obelisk; if (ox > v.x0 - 400 && ox < v.x1 + 400) {   // a fallen obelisk to leap over
        c.beginPath(); c.moveTo(ox - 200, gy + 4); c.lineTo(ox - 196, gy - 62); c.lineTo(ox + 170, gy - 50); c.lineTo(ox + 215, gy - 22); c.lineTo(ox + 170, gy + 4); c.fill();
        c.fillStyle = 'rgba(255,207,63,.85)'; for (let k = 0; k < 6; k++) { const hx = ox - 160 + k * 55; c.fillRect(hx, gy - 40, 10, 18); c.beginPath(); c.arc(hx + 30, gy - 32, 7, 0, TAU); c.fill(); }
        c.fillStyle = '#000';
      }
      tiles(v.x0, v.x1, 900, (x, i, r) => { if (r < 0.6 || Math.abs(x - T.obelisk) < 500) return; c.fillRect(x - 26, gy - 240 + r * 100, 52, 260); c.fillRect(x - 36, gy - 250 + r * 100, 72, 18); });
    } },
    { p: 1.5, draw(c, v, st) {
      if (st.sh.cam === 'head') return; c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineCap = 'round';
      tiles(v.x0, v.x1, 760, (x, i, r) => { if (r < 0.4) return;
        for (let k = 0; k < 6; k++) { const bx = x + k * 26, h = 260 + hash(i, k) * 200, tx = bx + (k - 3) * 18 + Math.sin(st.t * 2 + k) * 6, ty = 1100 - h;
          c.lineWidth = 6; c.beginPath(); c.moveTo(bx, 1150); c.quadraticCurveTo(bx, 1100 - h * 0.5, tx, ty); c.stroke();
          c.beginPath(); c.moveTo(tx, ty); c.arc(tx, ty, 40, -Math.PI * 0.85, -Math.PI * 0.15); c.closePath(); c.fill(); } });
    } },
  ],
  overlay(c, st) {
    const t = st.t, CF = '"Comic Sans MS", "Segoe Print", "Arial Black", sans-serif';
    const caption = (s, y, a, rot = -0.02) => { if (a <= 0) return; c.save(); c.globalAlpha = a; c.translate(-VW / 2 + 30, y); c.rotate(rot);
      const sz = Math.min(36 * LS, VW * 0.058); c.font = `900 ${sz}px ${CF}`; const w = Math.min(c.measureText(s).width + 40, VW - 60);
      c.fillStyle = YEL; c.fillRect(0, -sz, w, sz * 2); c.strokeStyle = '#000'; c.lineWidth = 5; c.strokeRect(0, -sz, w, sz * 2);
      txt(c, s, w / 2, 2, sz, { font: CF, fill: '#000', maxW: w - 30 }); c.restore(); };
    const burst = (s, x, y, size, t0, t1, col = YEL) => {
      const a = band(t, t0, t1, 0.04, 0.15); if (a <= 0) return; const sc = lerp(0.4, 1, eOut((t - t0) / 0.15)) * (1 + 0.03 * Math.sin(t * 40));
      c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(-0.08); c.scale(sc, sc);
      for (const [R, fill] of [[size * 1.15, RD], [size * 0.95, col]]) { c.fillStyle = fill; c.strokeStyle = '#000'; c.lineWidth = 6; c.beginPath();
        for (let k = 0; k < 28; k++) { const r = (k % 2 ? 0.62 : 1) * R * (0.9 + hash(k, R) * 0.2); c.lineTo(Math.cos(k * TAU / 28) * r * 1.5, Math.sin(k * TAU / 28) * r * 0.85); } c.closePath(); c.fill(); c.stroke(); }
      txt(c, s, 0, 4, size * 0.62, { font: '"Arial Black", Impact, sans-serif', fill: '#fff', stroke: '#000', sw: size * 0.08, maxW: size * 2.4 }); c.restore(); };
    caption('MEANWHILE, IN ANCIENT EGYPT…', 110, band(t, 1.9, 4.3, 0.01, 0.2));
    caption('THE SHADOW RUNS AGAIN!', 110, band(t, 8.1, 10.15, 0.01, 0.2), 0.015);
    const B = Math.min(120 * LS, VW * 0.2);
    burst('WHOOSH!', VW * 0.18, 230, B, 0.05, 1.3);
    burst('FWOOSH!', -VW * 0.12, 200, B, 4.45, 5.4, '#7df9ff');
    burst('ROAAAR!', 0, 170, B * 1.25, 6.92, 7.9);
    burst('ZOOM!', VW * 0.2, 260, B * 0.9, 8.05, 9.0, '#b6ff5c');
    if (t > 10.45) {
      const u = eOut((t - 10.45) / 0.3), ts = Math.min(VW * 0.21, 160 * LS), y = 220;
      c.save(); c.translate(0, y); c.transform(1, 0, -0.18, 1, 0, 0); c.scale(lerp(1.6, 1, u), lerp(1.6, 1, u)); c.globalAlpha = clamp(u * 2, 0, 1);
      txt(c, 'PANTHERA', 10, 10, ts, { font: '"Arial Black", Impact, sans-serif', fill: RD, stroke: '#000', sw: ts * 0.1, maxW: VW * 0.9 });
      txt(c, 'PANTHERA', 0, 0, ts, { font: '"Arial Black", Impact, sans-serif', fill: YEL, stroke: '#000', sw: ts * 0.1, maxW: VW * 0.9 });
      c.restore();
      const a2 = band(t, 11.0, 16, 0.2, 0.1), bh = Math.min(48 * LS, VW * 0.08);
      c.save(); c.globalAlpha = a2; c.translate(0, y + ts * 0.8); c.rotate(-0.025); c.font = `900 ${bh * 0.6}px "Arial Black", Impact, sans-serif`;
      const w = Math.min(c.measureText('SHADOW OF THE PHARAOHS').width + 60, VW * 0.94);
      c.fillStyle = RD; c.strokeStyle = '#000'; c.lineWidth = 5; c.fillRect(-w / 2, -bh / 2, w, bh); c.strokeRect(-w / 2, -bh / 2, w, bh);
      txt(c, 'SHADOW OF THE PHARAOHS', 0, 2, bh * 0.6, { font: '"Arial Black", Impact, sans-serif', fill: '#fff', maxW: w - 30 }); c.restore();
      if (t > 12.3) caption('TO BE CONTINUED… COMING SOON!', 900, band(t, 12.3, 16, 0.01, 0.1), -0.015);
    }
    c.strokeStyle = '#000'; c.lineWidth = 22; c.strokeRect(-VW / 2 + 11, 11, VW - 22, 978);
  },
  music(A) {
    const b = 0.6, HZ = [50, 51, 54, 55, 57, 58, 60, 62, 63, 66, 67, 69];
    const doum = (t, v = 1) => { A.tone(t, 95, 0.4, { slide: 62, slideT: 0.1, vol: 0.85 * v, rev: 0.2 }); };
    const tek = (t, v = 1) => { A.noise(t, 0.05, { vol: 0.28 * v, hp: 3200 }); A.tone(t, 720, 0.05, { type: 'triangle', vol: 0.12 * v }); };
    const oud = (t, n, v = 1) => A.pluck(t, n, { vol: 0.17 * v, lp: 2600, lpTo: 350, fT: 0.3, dur: 0.6, rev: 0.3, pan: (n - 60) / 40 });
    const drums = (t0, t1, dense) => {
      for (let t = t0; t < t1 - 0.01; t += 2 * b) { doum(t); tek(t + b * 0.5, 0.7); tek(t + b * 0.75, 0.5); doum(t + b, 0.8); tek(t + b * 1.5); if (dense) { tek(t + b * 0.25, 0.4); tek(t + b * 1.25, 0.4); tek(t + b * 1.75, 0.6); } }
    };
    const riff = (t0, t1, idx) => { for (let k = 0; t0 + k * b / 2 < t1 - 0.01; k++) oud(t0 + k * b / 2, HZ[idx[k % idx.length]] + 12); };
    A.impact(0, 0.8); A.whoosh(0, 0.8);
    A.tone(0, mtof(38), 5.9, { type: 'sawtooth', lp: 240, vol: 0.15, a: 0.5, r: 0.4 }); A.tone(0, mtof(45), 5.9, { type: 'sawtooth', lp: 240, vol: 0.08, a: 0.5, r: 0.4 });
    drums(0, 5.9, false); riff(0.6, 5.9, [0, 1, 2, 1, 3, 2, 1, 0, 4, 3, 2, 1]);
    A.whoosh(4.4, 0.9); A.snare(4.45, 0.6); doum(5.9, 1.3);
    A.seq(5.95, b, [[0, 74, 1.2], [1.25, 75, 0.4]], (t, n, d) => A.flute(t, n, d, { vib: [6, 4] }));
    A.riser(6.3, 6.9, 0.6); A.roar(6.9, 1.0); A.boom(6.9, 0.8); A.crash(6.9, 0.6);
    A.impact(8.0, 0.7); A.whoosh(8.0, 0.6); drums(8.0, 10.2, true); riff(8.0, 10.2, [4, 5, 6, 5, 7, 6, 5, 4, 8, 7, 6, 5]);
    A.tone(8.0, mtof(38), 2.2, { type: 'sawtooth', lp: 260, vol: 0.15, a: 0.1, r: 0.2 });
    A.impact(10.2, 0.9); A.boom(10.5, 1); A.crash(10.5, 1);
    for (const [f, g] of [[98, 1], [197, 0.5], [301, 0.35], [415, 0.25]]) A.tone(10.5, f, 4.4, { vol: 0.2 * g, a: 0.02, rev: 0.6 });
    A.tone(10.5, mtof(38), 4.4, { type: 'sawtooth', lp: 220, vol: 0.14, a: 0.3, r: 1.2 });
    A.seq(11.0, b / 2, [[0, 62], [1, 63], [2, 66], [3, 67], [4, 69, 2], [6, 67], [7, 66], [8, 63, 2], [10, 62, 4]], (t, n) => oud(t, n + 12, 1.1));
    A.flute(12.3, 74, 2.2, { vol: 0.12, vib: [6, 4] }); doum(12.3); doum(13.5, 0.8); doum(14.1, 1);
  },
};
