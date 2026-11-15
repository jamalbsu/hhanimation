// TEASER 9 — EVERY ANGLE
// Style: cubism. The panther has its own geometry here (not the shared rig's smooth shapes): the body is broken into flat,
// sharp-cornered planes with heavy black lines, and the head shows profile and front view at the same time — both eyes on one side,
// two different ears, a nose seen from the front on a muzzle seen from the side. The world is built the same way:
// a sky split into night and day, two-faced mountains, tilted cube houses, guitars and a tiled floor.
const CU = { ink: '#141414', navy: '#1e3a6e', night: '#16233f', violet: '#4a3a7a', ochre: '#e2a13a', terra: '#c8553d', teal: '#2f8f83', cream: '#f1e3c6', rose: '#d9819b', sand: '#d9a05b' };
function cuPoly(c, pts, fill, o = {}) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (o.stripes || o.dots) { c.save(); c.clip(); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (o.stripes) { c.strokeStyle = o.stripes; c.lineWidth = o.sw || 4; c.beginPath(); for (let x = x0 - (y1 - y0); x < x1; x += o.gap || 12) { c.moveTo(x, y1); c.lineTo(x + (y1 - y0), y0); } c.stroke(); }
    if (o.dots) { c.fillStyle = o.dots; for (let y = y0; y < y1; y += 12) for (let x = x0 + ((y / 12) % 2) * 6; x < x1; x += 12) { c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill(); } }
    c.restore(); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  if (o.line !== 0) { c.strokeStyle = CU.ink; c.lineWidth = o.line || 4; c.lineJoin = 'miter'; c.miterLimit = 4; c.stroke(); }
}
const cuAdd = (a, dx, dy) => [a[0] + dx, a[1] + dy];
function cuSeg(c, a, b, w0, w1, fill, o) { const th = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(th), ny = Math.cos(th); cuPoly(c, [[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], fill, o); }
function cuPose(o) {                                    // the skeleton: same gallop timing as the other teasers, new shapes on top
  const ph = o.ph; let hip, sh, feet, ha, tail;
  if (o.mode === 'stand') { hip = [-88, -102]; sh = [80, -110 - Math.sin(o.t * 2.6) * 2]; feet = { hn: [-80, 0], hf: [-98, 0], fn: [94, 0], ff: [78, 0] }; ha = -0.05 + Math.sin(o.t * 1.3) * 0.04; tail = k => 2.5 - k * 0.42 + Math.sin(o.t * 2 - k) * 0.12; }
  else if (o.mode === 'leap') { const u = o.lu; hip = [-106, -104]; sh = [98, -112];
    feet = { fn: [sh[0] + lerp(118, 70, u), sh[1] + lerp(40, 104, u)], ff: [sh[0] + lerp(100, 54, u), sh[1] + lerp(56, 108, u)], hn: [hip[0] + lerp(-112, -40, u), hip[1] + lerp(64, 102, u)], hf: [hip[0] + lerp(-98, -26, u), hip[1] + lerp(78, 104, u)] };
    ha = lerp(-0.14, 0.12, u); tail = k => Math.PI + 0.1 - k * 0.12 + Math.sin(u * 4 - k) * 0.15; }
  else { const f = Math.cos(TAU * ph); hip = [-92 - 10 * f, -106 + 5 * Math.sin(TAU * ph * 2)]; sh = [80 + 10 * f, -110 + 5 * Math.sin(TAU * (ph * 2 + 0.25))];
    const foot = (base, R, Hs, off) => { const a = TAU * (ph + off), s = Math.sin(a); return [base - R * Math.cos(a), s > 0 ? -Hs * s : 0]; };
    feet = { hn: foot(hip[0] - 4, 64, 52, 0), hf: foot(hip[0] - 4, 64, 52, 0.09), fn: foot(sh[0] + 12, 68, 60, 0.5), ff: foot(sh[0] + 12, 68, 60, 0.59) };
    ha = 0.06 * Math.sin(TAU * ph * 2); tail = k => Math.PI - 0.25 + Math.sin(TAU * ph - k * 0.9) * 0.3 * (0.5 + k * 0.3); }
  return { hip, sh, feet, ha, tail };
}
function cuLeg(c, root, foot, l1, l2, cols, far) {
  const [j, f] = ik(root, foot, l1, l2);
  cuSeg(c, root, j, far ? 15 : 19, 9, cols[0]); cuSeg(c, j, f, 9, 6, cols[1], far ? {} : { stripes: cols[3], gap: 9, sw: 3 });
  cuPoly(c, [[j[0] - 9, j[1]], [j[0], j[1] - 9], [j[0] + 9, j[1]], [j[0], j[1] + 9]], cols[2]);                  // the joint, shown as a diamond
  cuPoly(c, [[f[0] - 12, f[1] - 13], [f[0] + 22, f[1] - 9], [f[0] + 30, f[1]], [f[0] - 13, f[1]]], cols[2]);     // the paw, a wedge
}
function cuPanther(c, o) {
  const P = cuPose(o), { hip, sh, feet } = P, mx = (hip[0] + sh[0]) / 2, my = (hip[1] + sh[1]) / 2;
  c.save(); c.translate(o.x, o.y - o.lift); c.rotate(o.rot); c.scale(o.s, o.s); c.globalAlpha *= (o.alpha ?? 1);
  const farC = [CU.night, CU.violet, CU.teal, CU.navy], nearC = [CU.ink, CU.navy, CU.ochre, CU.cream];
  cuLeg(c, cuAdd(hip, -8, 2), feet.hf, 64, 68, farC, true); cuLeg(c, cuAdd(sh, -2, 6), feet.ff, 60, 64, farC, true);
  let tp = cuAdd(hip, -40, -8);                                              // the tail: five straight pieces, alternating colours
  for (let k = 0; k < 5; k++) { const a = P.tail(k), q = [tp[0] + Math.cos(a) * 36, tp[1] + Math.sin(a) * 36]; cuSeg(c, tp, q, 11 - k * 1.5, 9.5 - k * 1.5, k % 2 ? CU.ochre : CU.ink); tp = q; }
  cuPoly(c, [[tp[0] - 12, tp[1]], [tp[0], tp[1] - 12], [tp[0] + 12, tp[1]], [tp[0], tp[1] + 12]], CU.terra);
  const A = cuAdd(hip, -42, -34), B = cuAdd(hip, -50, 22), C = cuAdd(hip, 4, 46), D = [mx - 6, my + 24], E = cuAdd(sh, -10, 48), F = cuAdd(sh, 50, 12), G = cuAdd(sh, 30, -48), Hh = [mx + 8, my - 44];
  cuPoly(c, [A, B, C, Hh], CU.navy);                                         // the body: five flat planes meeting at a peak on the back
  cuPoly(c, [C, D, Hh], CU.terra, { dots: CU.ink });
  cuPoly(c, [Hh, D, E], CU.ink);
  cuPoly(c, [Hh, E, G], CU.violet, { stripes: CU.rose, gap: 13, sw: 4 });
  cuPoly(c, [G, E, F], CU.teal);
  cuPoly(c, [cuAdd(hip, -36, -6), cuAdd(hip, 0, -46), cuAdd(hip, 38, 2), cuAdd(hip, 2, 48)], CU.ink);              // the haunch, a diamond
  cuPoly(c, [cuAdd(hip, -14, -4), cuAdd(hip, 0, -22), cuAdd(hip, 16, 0), cuAdd(hip, 2, 22)], CU.ochre);
  cuLeg(c, cuAdd(hip, 0, 8), feet.hn, 64, 68, nearC, false);
  cuPoly(c, [cuAdd(sh, -22, -20), cuAdd(sh, 26, -26), cuAdd(sh, 10, 34)], CU.navy);                                // the shoulder, a triangle
  cuLeg(c, cuAdd(sh, 6, 10), feet.fn, 60, 64, nearC, false);
  const HA = cuAdd(sh, 64, -54);
  cuPoly(c, [G, F, cuAdd(HA, 2, 26), cuAdd(HA, -26, -4)], CU.ink);                                                  // the neck
  c.translate(HA[0], HA[1]); c.rotate(P.ha); c.scale(1.18, 1.18);
  cuPoly(c, [[-12, -38], [-8, -92], [14, -44]], CU.rose);                                                           // one ear from the side…
  cuPoly(c, [[18, -44], [44, -90], [50, -30]], CU.teal); cuPoly(c, [[27, -46], [42, -74], [45, -38]], CU.cream, { line: 2.5 });   // …one from the front
  cuPoly(c, [[-32, -6], [-18, -40], [16, -48], [12, 14], [-22, 20]], CU.navy);                                      // the side of the head
  cuPoly(c, [[16, -48], [54, -32], [68, 0], [42, 26], [12, 14]], CU.ochre);                                         // the front of the face
  cuPoly(c, [[42, -4], [88, 6], [64, 30], [40, 26]], CU.cream);                                                     // the muzzle, in profile
  cuPoly(c, [[72, 3], [88, 6], [78, 16]], CU.ink);                                                                  // a nose seen from the front
  c.strokeStyle = CU.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(78, 16); c.lineTo(70, 22); c.lineTo(62, 17); c.lineTo(54, 23); c.stroke();
  c.lineWidth = 2; for (const [x0, y0, x1, y1] of [[58, 12, 104, 2], [58, 16, 106, 16], [58, 20, 102, 30], [44, 14, 20, 36], [44, 18, 26, 46]]) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  const blink = o.blink;
  if (blink) { c.lineWidth = 4; c.beginPath(); c.moveTo(22, -16); c.lineTo(52, -12); c.moveTo(-18, -14); c.lineTo(6, -18); c.stroke(); }
  else {
    cuPoly(c, [[20, -14], [36, -30], [56, -12], [38, -2]], '#fffaf0', { line: 3.5 });                               // a big eye seen from the front
    c.fillStyle = '#f6c21f'; c.beginPath(); c.arc(38, -15, 9.5, 0, TAU); c.fill(); c.fillStyle = CU.ink; c.beginPath(); c.ellipse(38, -15, 3, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(-6, -16, 11, 0, TAU); c.fill(); c.lineWidth = 3.5; c.stroke();     // a round eye seen from the side — on the same side of the head
    cuPoly(c, [[-6, -24], [0, -16], [-6, -8], [-12, -16]], '#2f8f83', { line: 2 }); c.fillStyle = CU.ink; c.beginPath(); c.arc(-6, -16, 2.6, 0, TAU); c.fill();
    if (o.sparkle) { c.fillStyle = '#fff'; c.globalAlpha = o.sparkle; for (const [x, y] of [[34, -19], [-9, -19]]) { c.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 1.5 : 8 * o.sparkle, a = k * Math.PI / 4; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); } c.globalAlpha = 1; }
  }
  c.strokeStyle = CU.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(14, -34); c.lineTo(34, -40); c.moveTo(-22, -32); c.lineTo(-2, -34); c.stroke();    // brows
  c.restore();
}
const T = {
  name: 'EVERY ANGLE', DUR: 15, gy: 700, scale: 0.75, vol: 1.5, revLen: 1.8,
  style: { mode: 'cel', fill: CU.ink, ink: CU.ink, ow: 3, eye: '#f6c21f' }, drawPanther: (c, o) => cuPanther(c, o),
  shadow: 'rgba(20,20,20,.3)', fxColor: CU.ink,
  post: [['blotch', 0.22], ['paper', 0.6], ['grain', 0.05], ['vignette', 0.28, '60,40,20']],
  shots: [
    { t: [0, 1.8], spd: 950, z: 1.5, cx: 60, cy: 585, speed: 'h', speedK: 0.5 },
    { t: [1.8, 4.6], spd: 680, z: [0.7, 0.78], cx: -30, cy: 465, px: -50 },
    { t: [4.6, 6.1], mode: 'leap', leap: 250, spd: 780, z: 0.97, cx: 40, cy: 555, follow: 0.4, tilt: 0.32 },
    { t: [6.1, 8.3], spd: 440, cam: 'head', z: [1.9, 2.3], hx: -6, hy: -30, blink: 6.9, sparkle: 7.1 },
    { t: [8.3, 10.3], spd: 1050, z: [1.1, 0.95], px: [-210, 150], cy: [590, 540] },
    { t: [10.3, 15], mode: 'stand', spd: 0, snap: true, z: [1.3, 1.14], cx: 40, cy: 450 },
  ],
  beforePanther(c, v, st) {                                    // a pale plane behind the panther, so it stands clear of the busy world
    const o = st.pan, S = T.scale, x = o.x, y = o.y - o.lift - 120 * S, w = Math.sin(st.t * 0.8) * 14;
    c.save(); c.globalAlpha = 0.86; cuPoly(c, [[x - 330 * S, y + 30 + w], [x - 60 * S, y - 215 * S - w], [x + 300 * S, y - 60 * S + w], [x + 80 * S, y + 150 * S]], CU.cream, { line: 3 }); c.restore();
  },
  init() { const S = this.scale; this.gap = [panXAt(4.65) + 110 * S, panXAt(6.05) + 40 * S]; },
  sky(c, st) {
    const t = st.t, C0 = [Math.sin(t * 0.3) * 30, 380], R = 1700, N = 10;
    const cool = ['#203a63', '#2e4f7a', '#3d3a6b', '#1a2947', '#34597a'], warm = ['#e9b44c', '#e58f5a', '#f2d7a0', '#d9744a', '#f0c98a'];
    c.fillStyle = CU.cream; c.fillRect(-VW, 0, VW * 2, 1000);
    const ang = k => k * TAU / N + 0.16 * Math.sin(t * 0.25 + k * 1.7) + t * 0.012 + 0.3;
    for (let k = 0; k < N; k++) { const a0 = ang(k), a1 = ang(k + 1) + (k === N - 1 ? TAU : 0), m = (a0 + a1) / 2;      // the sky is a fan of planes: night on the left, day on the right
      cuPoly(c, [C0, [C0[0] + Math.cos(a0) * R, C0[1] + Math.sin(a0) * R], [C0[0] + Math.cos(a1) * R, C0[1] + Math.sin(a1) * R]], (Math.cos(m) > 0 ? warm : cool)[k % 5], { line: 2.5 }); }
    const mx = -VW * 0.27, my = 190;                                          // a moon cut from two corners
    cuPoly(c, [[mx - 10, my - 62], [mx + 34, my - 34], [mx + 6, my], [mx + 34, my + 40], [mx - 12, my + 62], [mx - 46, my + 20], [mx - 46, my - 22]], CU.cream);
    cuPoly(c, [[mx - 10, my - 62], [mx + 6, my], [mx - 12, my + 62], [mx - 46, my + 20], [mx - 46, my - 22]], '#cfd8e6', { line: 2.5 });
    for (let i = 0; i < 9; i++) { const x = -VW * 0.5 + hash(i, 1) * VW * 0.45, y = 60 + hash(i, 2) * 380, r = 6 + hash(i, 3) * 8 * (0.6 + 0.4 * Math.sin(t * 3 + i)); cuPoly(c, [[x, y - r], [x + r * 0.4, y], [x, y + r], [x - r * 0.4, y]], CU.cream, { line: 1.5 }); }
    const sx = VW * 0.27, sy = 230, rot = t * 0.25;                           // a sun in two halves
    for (let k = 0; k < 10; k++) { const a = rot + k * TAU / 10; cuPoly(c, [[sx + Math.cos(a - 0.14) * 74, sy + Math.sin(a - 0.14) * 74], [sx + Math.cos(a) * (112 + (k % 2) * 20), sy + Math.sin(a) * (112 + (k % 2) * 20)], [sx + Math.cos(a + 0.14) * 74, sy + Math.sin(a + 0.14) * 74]], k % 2 ? CU.terra : '#f6d34a', { line: 2.5 }); }
    c.fillStyle = '#f6d34a'; c.beginPath(); c.arc(sx, sy, 66, Math.PI / 2, Math.PI * 1.5); c.fill(); c.fillStyle = '#e0672f'; c.beginPath(); c.arc(sx, sy, 66, -Math.PI / 2, Math.PI / 2); c.fill();
    c.strokeStyle = CU.ink; c.lineWidth = 4; c.beginPath(); c.arc(sx, sy, 66, 0, TAU); c.moveTo(sx, sy - 66); c.lineTo(sx - 12, sy - 10); c.lineTo(sx + 8, sy + 8); c.lineTo(sx, sy + 66); c.stroke();
  },
  layers: [
    { p: 0.12, draw(c, v) { tiles(v.x0, v.x1, 360, (x, i, r) => { const h = 250 + r * 230, px = x + hash(i, 2) * 100, top = [px + 20, 800 - h];
        cuPoly(c, [[px - 250, 800], top, [px + 10, 800]], i % 2 ? '#8fa6c8' : '#b7a6cc', { line: 3 }); cuPoly(c, [[px + 10, 800], top, [px + 250, 800]], i % 2 ? '#51648f' : '#6a5a94', { line: 3 }); }); } },
    { p: 0.4, draw(c, v) { tiles(v.x0, v.x1, 250, (x, i, r) => {
        const k = ((i % 4) + 4) % 4, base = 830;
        if (k === 3) {                                                           // a guitar leaning on nothing
          c.save(); c.translate(x + 60, base - 120); c.rotate(-0.35 + r * 0.3);
          cuSeg(c, [0, -40], [0, -190], 9, 7, CU.ink); cuPoly(c, [[-14, -190], [14, -190], [10, -222], [-10, -222]], CU.terra);
          c.fillStyle = CU.ochre; c.beginPath(); c.arc(0, 30, 52, 0, TAU); c.arc(0, -34, 38, 0, TAU); c.fill(); c.fillStyle = CU.terra; c.beginPath(); c.arc(0, 30, 52, -Math.PI / 2, Math.PI / 2); c.arc(0, -34, 38, -Math.PI / 2, Math.PI / 2); c.fill();
          c.strokeStyle = CU.ink; c.lineWidth = 4; c.beginPath(); c.arc(0, 30, 52, 0, TAU); c.moveTo(38, -34); c.arc(0, -34, 38, 0, TAU); c.moveTo(0, -72); c.lineTo(0, 82); c.stroke(); c.fillStyle = CU.ink; c.beginPath(); c.arc(0, 4, 13, 0, TAU); c.fill(); c.restore(); return; }
        const w = 90 + r * 70, h = 120 + hash(i, 2) * 150, y0 = base - h, cols = [[CU.sand, '#a8673c'], [CU.cream, '#b99a6a'], ['#e58f5a', '#9c4a34']][((i % 3) + 3) % 3];
        c.save(); c.translate(x, base); c.rotate((hash(i, 3) - 0.5) * 0.14); c.translate(-x, -base);
        cuPoly(c, [[x, y0], [x + w, y0 - 10], [x + w, base + 40], [x, base + 40]], cols[0]); cuPoly(c, [[x + w, y0 - 10], [x + w + 44, y0 + 16], [x + w + 44, base + 40], [x + w, base + 40]], cols[1]);
        cuPoly(c, [[x - 10, y0], [x + w * 0.45, y0 - 56], [x + w + 44, y0 + 16], [x + w, y0 - 10]], CU.terra, { stripes: CU.ink, gap: 14, sw: 2 });
        for (let q = 0; q < 2; q++) cuPoly(c, [[x + 16 + q * w * 0.45, y0 + 30], [x + 40 + q * w * 0.45, y0 + 26], [x + 40 + q * w * 0.45, y0 + 62], [x + 16 + q * w * 0.45, y0 + 66]], q ? CU.navy : CU.ink, { line: 2.5 });
        c.restore();
        const tx = x + w + 100, th = 150 + hash(i, 5) * 140;                    // a cypress, as a two-faced diamond
        cuPoly(c, [[tx, base - th], [tx, base], [tx - 20, base - th * 0.45]], CU.teal, { line: 3 }); cuPoly(c, [[tx, base - th], [tx + 20, base - th * 0.45], [tx, base]], '#1d5a52', { line: 3 });
      }); } },
    { p: 1, draw(c, v, st) {
      const gy = 700, [g0, g1] = T.gap, cols = [CU.sand, CU.terra, CU.cream, '#8a4b32'];
      if (g0 < v.x1 && g1 > v.x0) { c.fillStyle = CU.night; c.fillRect(g0 - 4, gy, g1 - g0 + 8, 1300);                 // the gap: water, as blue shards
        for (let k = 0; k < 26; k++) { const x = lerp(g0, g1, hash(k, 1)), y = gy + 30 + hash(k, 2) * 420, w = 40 + hash(k, 3) * 70, d = Math.sin(st.t * 2 + k) * 8; cuPoly(c, [[x - w, y + d], [x, y - 16 + d], [x + w, y + d], [x, y + 12 + d]], ['#2e4f7a', '#34597a', '#5f86b0', CU.teal][k & 3], { line: 2 }); } }
      for (const [a, b] of [[v.x0 - 120, Math.min(g0, v.x1 + 120)], [Math.max(g1, v.x0 - 120), v.x1 + 120]]) { if (b <= a) continue;
        c.save(); c.beginPath(); c.rect(a, gy, b - a, 1400); c.clip(); c.fillStyle = '#8a4b32'; c.fillRect(a, gy, b - a, 1400);
        for (let row = 0; row < 5; row++) { const y0 = gy + row * 84, y1 = y0 + 84, sk = 46;                               // a tiled floor in skewed squares
          for (let x = Math.floor(a / 96) * 96 - 192; x < b + 96; x += 96) { const i = Math.round(x / 96); cuPoly(c, [[x - row * sk, y0], [x + 96 - row * sk, y0], [x + 96 - (row + 1) * sk, y1], [x - (row + 1) * sk, y1]], cols[(((i + row * 2) % 3) + 3) % 3], (i + row) % 5 === 0 ? { dots: CU.ink, line: 2.5 } : { line: 2.5 }); } }
        c.restore(); c.fillStyle = CU.ink; c.fillRect(a, gy - 3, b - a, 7);
      }
    } },
    { p: 1.5, draw(c, v, st) { if (st.sh.cam === 'head') return; tiles(v.x0, v.x1, 820, (x, i, r) => { if (r < 0.4) return;
        cuPoly(c, [[x - 30, 1120], [x + 60, 800 + r * 60], [x + 190, 1120]], CU.ink); cuPoly(c, [[x + 110, 1120], [x + 190, 900], [x + 290, 1120]], i % 2 ? CU.ochre : CU.teal, { stripes: CU.ink, gap: 16, sw: 3 }); }); } },
  ],
  overlay(c, st) {
    const t = st.t, vert = H > W, SER = 'Georgia, "Times New Roman", serif', cs = Math.min(36 * LS, VW * 0.058);
    const cap = (s, a, b, rot, bg) => { const al = band(t, a, b, 0.2, 0.25); if (al <= 0) return; c.save(); c.globalAlpha = al; c.translate(0, vert ? 880 : 900); c.rotate(rot);
      c.font = `italic 700 ${cs}px ${SER}`; const w = Math.min(c.measureText(s).width + 56, VW * 0.94), h = cs * 1.9;
      cuPoly(c, [[-w / 2 + 6, -h / 2 + 8], [w / 2 + 8, -h / 2 + 4], [w / 2 + 4, h / 2 + 8], [-w / 2 + 10, h / 2 + 6]], CU.ink, { line: 0 }); cuPoly(c, [[-w / 2, -h / 2], [w / 2, -h / 2 - 5], [w / 2 - 6, h / 2], [-w / 2 + 4, h / 2 + 4]], bg);
      txt(c, s, 0, 2, cs, { font: SER, weight: 700, italic: true, fill: CU.ink, maxW: w - 36 }); c.restore(); };
    cap('why look from only one side…', 2.0, 4.4, -0.025, CU.cream); cap('…when you can see every angle?', 8.4, 10.2, 0.02, CU.ochre);
    if (t > 10.5) {                                                           // the title, cut into three strips that slide into place
      const ts = Math.min(VW * 0.21, (vert ? 160 : 112) * LS), y = vert ? 215 : 170, F = '"Arial Black", Impact, sans-serif', e = eOut((t - 10.5) / 0.7);
      { const bw = Math.min(VW * 0.48, ts * 2.75); c.save(); c.globalAlpha = sm((t - 10.5) / 0.4); cuPoly(c, [[-bw + 8, y - ts * 0.6 + 10], [bw + 10, y - ts * 0.68 + 8], [bw + 4, y + ts * 0.62 + 10], [-bw + 12, y + ts * 0.58 + 8]], CU.ink, { line: 0 }); cuPoly(c, [[-bw, y - ts * 0.6], [bw, y - ts * 0.68], [bw - 8, y + ts * 0.62], [-bw + 6, y + ts * 0.58]], CU.cream); c.restore(); }
      [[CU.terra, -1], [CU.ink, 1], [CU.navy, -1]].forEach(([col, dir], k) => { c.save(); c.beginPath(); c.rect(-VW, y - ts * 0.5 + k * ts / 3, VW * 2, ts / 3 + 0.6); c.clip();
        const off = dir * (VW * (1 - e) + (k === 1 ? 0 : 9)); txt(c, 'PANTHERA', off, y, ts, { font: F, fill: col, maxW: VW * 0.84 }); c.restore(); });
      const a2 = sm((t - 11.4) / 0.4); if (a2 > 0) { c.save(); c.globalAlpha = a2; c.translate(0, y + ts * 0.92); c.rotate(-0.03); const sz = ts * 0.34; c.font = `900 ${sz}px ${F}`; const w = Math.min(c.measureText('EVERY ANGLE').width + 50, VW * 0.9);
        cuPoly(c, [[-w / 2, -sz * 0.8], [w / 2, -sz * 0.9], [w / 2 - 8, sz * 0.8], [-w / 2 + 6, sz * 0.9]], CU.ochre); txt(c, 'EVERY ANGLE', 0, 3, sz, { font: F, fill: CU.ink, maxW: w - 30 }); c.restore(); }
      cap('a cubist cartoon  ·  coming soon', 12.4, 99, 0.015, CU.cream);
    }
  },
  music(A) {
    const b = 60 / 112, CH = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], BR = [45, 43, 41, 40], bar = t => Math.floor(t / (2 * b) + 1e-6) % 4;   // Am – G – F – E
    const gtr = (t, n, v = 1, pan = 0) => { A.pluck(t, n, { type: 'triangle', vol: 0.13 * v, lp: 3400, lpTo: 600, fT: 0.3, dur: 0.7, rev: 0.25, pan }); A.tone(t, mtof(n) * 2, 0.12, { vol: 0.02 * v, pan }); };
    const strum = (t, c, v = 1) => CH[c].concat(CH[c][0] + 12).forEach((n, k) => gtr(t + k * 0.018, n, 0.55 * v, 0.3));
    const bass = (t, n, d) => A.tone(t, mtof(n), d, { type: 'triangle', vol: 0.2, a: 0.01, r: 0.08, lp: 440 });
    const cast = (t, v = 1) => A.tone(t, 1700, 0.02, { type: 'square', vol: 0.035 * v });                         // castanets
    const clap = (t, v = 1) => { for (let k = 0; k < 2; k++) A.tone(t + k * 0.012, 900 + k * 300, 0.03, { type: 'square', vol: 0.03 * v, rev: 0.2 }); };
    const groove = (t0, t1, mel) => {
      const e = b / 2; for (let k = Math.ceil(t0 / e - 1e-6); k * e < t1 - 0.01; k++) { const t = k * e, c = bar(t), q = k % 4;
        if (q === 0) { bass(t, BR[c], b * 0.8); strum(t, c); } else if (q === 2) { bass(t, BR[c] + 7, b * 0.5); strum(t, c, 0.8); clap(t); } else { gtr(t, CH[c][q === 1 ? 1 : 2] + 12, 0.5, -0.3); cast(t); cast(t + e / 2, 0.6); } }
      if (mel) for (const [at, n] of mel) { const t = t0 + at * b / 2; if (t < t1 - 0.02) gtr(t, n, 1.25, -0.1); }
    };
    const M1 = [[0, 76], [1, 77], [2, 76], [3, 74], [4, 72], [6, 74], [7, 76], [8, 77], [9, 76], [10, 74], [11, 72], [12, 71], [14, 68]];
    const M2 = [[0, 81], [1, 79], [2, 77], [3, 76], [4, 77], [5, 79], [6, 81], [8, 84], [9, 83], [10, 81], [11, 80], [12, 81]];
    [64, 69, 72, 76].forEach((n, k) => gtr(0.04 + k * 0.07, n, 1)); groove(0.4, 1.8, null); groove(1.9, 4.6, M1);
    [69, 72, 76, 81, 84, 88].forEach((n, k) => gtr(4.65 + k * 0.11, n, 0.9, k / 5 - 0.5)); A.noise(4.6, 0.8, { vol: 0.05, bp: 600, bpTo: 2200, q: 0.8, a: 0.5 });
    bass(6.1, 45, 0.6); strum(6.1, 0, 1.2); for (let k = 0; k < 10; k++) cast(6.5 + k * 0.09, 0.5 + k * 0.08);     // a castanet roll for the close-up
    gtr(6.9, 88, 0.8); gtr(7.02, 93, 0.8); strum(7.5, 3, 1.1); bass(7.5, 40, 0.6);
    groove(8.3, 10.3, M2);
    strum(10.3, 3, 1.3); bass(10.3, 40, 0.5); [[0, 0], [1, 1], [2, 2]].forEach(([k]) => clap(10.5 + k * 0.23, 1.5));
    strum(11.2, 0, 1.4); bass(11.2, 45, 1.4); [[0, 81], [1, 84], [2, 88], [3, 93]].forEach(([k, n]) => gtr(11.4 + k * 0.14, n, 1));
    groove(12.3, 14.0, [[0, 76], [1, 72], [2, 69], [4, 72], [5, 76]]); strum(14.0, 0, 1.4); bass(14.0, 33, 0.9); clap(14.0, 1.5); cast(14.3); cast(14.4); gtr(14.5, 93, 0.9);
  },
};
