// TEASER 10 — TWO SIDES
// Style: the cubist look of teaser 9 (Every Angle), reused for a story: a dog and a cat play with a ball, quarrel over it
// (the ball breaks into a dog half and a cat half), sulk apart, peek at each other, run back, join the ball and play again.
// Both animals are built the cubist way: flat sharp planes, heavy black lines, the head in profile and from the front at once.
// While they are apart the picture itself splits in two along a jagged seam: one side follows the dog, the other the cat.
// The teaser brings its own renderer (T.render) because it has two characters and two cameras.
const CU = { ink: '#141414', navy: '#1e3a6e', night: '#16233f', violet: '#4a3a7a', ochre: '#e2a13a', terra: '#c8553d', teal: '#2f8f83', cream: '#f1e3c6', rose: '#d9819b', sand: '#d9a05b' };
const DG = { dark: '#8a4b32', deep: '#5e3322', mid: '#a8673c' }, CT = { fur: '#7f8fb0', slate: '#56627f', deep: '#3e4760' };
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
function cuLeg(c, root, foot, l1, l2, cols, far) {
  const [j, f] = ik(root, foot, l1, l2);
  cuSeg(c, root, j, far ? 15 : 19, 9, cols[0]); cuSeg(c, j, f, 9, 6, cols[1], far ? {} : { stripes: cols[3], gap: 9, sw: 3 });
  cuPoly(c, [[j[0] - 9, j[1]], [j[0], j[1] - 9], [j[0] + 9, j[1]], [j[0], j[1] + 9]], cols[2]);
  cuPoly(c, [[f[0] - 12, f[1] - 13], [f[0] + 22, f[1] - 9], [f[0] + 30, f[1]], [f[0] - 13, f[1]]], cols[2]);
}

// ---------------------------------------------------------------- the story, as keyframes
// X: [time, world x, 'e' = ease into this key]; FX: facing (+1 right, −1 left; in between the animal turns like a card);
// M: [start, mode, extra]; MOOD: [start, mood]
function track(K, t) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const a = K[i - 1], b = K[i], u = (t - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], b[2] === 'e' ? sm(u) : u); }
  return K[K.length - 1][1];
}
function trackDist(K, t) { let d = 0; for (let i = 1; i < K.length && K[i - 1][0] < t; i++) d += Math.abs((t < K[i][0] ? track(K, t) : K[i][1]) - K[i - 1][1]); return d; }
const pick = (L, t) => { let r = L[0]; for (const e of L) if (e[0] <= t) r = e; return r; };
const DOG = { s: 0.75, kind: 'dog', blinks: [1.2, 3.3, 6.9, 9.1, 18.4, 20.6],
  X: [[0, -420], [2.2, 640], [2.6, 700, 'e'], [4.0, 700], [4.3, 760, 'e'], [4.6, 690, 'e'], [4.85, 690], [6.3, 370], [6.6, 330, 'e'], [10.5, 330], [12.2, 740], [12.5, 760, 'e'], [13.15, 760], [16.2, 1950], [16.8, 2010, 'e']],
  FX: [[0, 1], [4.6, 1], [4.8, -1, 'e'], [7.55, -1], [7.75, 1, 'e'], [8.3, 1], [8.5, -1, 'e'], [9.75, -1], [9.95, 1, 'e']],
  M: [[0, 'run'], [2.5, 'bow'], [4.0, 'lunge'], [4.3, 'stand'], [4.85, 'walk'], [6.6, 'sit'], [10.45, 'run'], [12.4, 'stand'], [13.1, 'run'], [14.5, 'leap', { t1: 15.3, h: 150 }], [15.3, 'run'], [16.7, 'stand']],
  MOOD: [[0, 'happy'], [4.25, 'cross'], [5.2, 'sad'], [9.95, 'happy']] };
const CAT = { s: 0.55, kind: 'cat', blinks: [1.6, 3.6, 7.2, 10.1, 19.0, 21.2],
  X: [[0, -60], [2.2, 1080], [2.6, 1120, 'e'], [4.0, 1120], [4.3, 1060, 'e'], [4.6, 1130, 'e'], [4.85, 1130], [6.3, 1460], [6.6, 1500, 'e'], [10.5, 1500], [12.2, 1100], [12.5, 1080, 'e'], [13.15, 1080], [16.2, 2290], [16.8, 2350, 'e']],
  FX: [[0, 1], [2.4, 1], [2.6, -1, 'e'], [4.6, -1], [4.8, 1, 'e'], [8.55, 1], [8.75, -1, 'e'], [9.3, -1], [9.5, 1, 'e'], [9.75, 1], [9.95, -1, 'e'], [12.9, -1], [13.1, 1, 'e'], [16.7, 1], [16.9, -1, 'e']],
  M: [[0, 'run'], [2.5, 'bow'], [4.0, 'lunge'], [4.3, 'stand'], [4.85, 'walk'], [6.6, 'sit'], [10.45, 'run'], [12.4, 'stand'], [13.1, 'run'], [14.95, 'leap', { t1: 15.8, h: 210 }], [15.8, 'run'], [16.7, 'stand'], [17.7, 'sit']],
  MOOD: [[0, 'happy'], [4.25, 'cross'], [5.2, 'sad'], [9.95, 'happy']] };
const GY = 700, SPLIT = t => band(t, 5.3, 12.3, 0.55, 0.5), HEART = 12.65;
function charAt(C, t) {
  const x = track(C.X, t), f = track(C.FX, t), [t0, mode, ex] = pick(C.M, t);
  const o = { x, y: GY, fx: Math.sign(f || 1) * Math.max(Math.abs(f), 0.1), mode, t, s: C.s, kind: C.kind, lift: 0, rot: 0, lu: 0, mood: pick(C.MOOD, t)[1] };
  o.ph = mode === 'lunge' ? 0.3 : trackDist(C.X, t) / ((mode === 'walk' ? 210 : 330) * C.s);
  if (mode === 'leap') { o.lu = clamp((t - t0) / (ex.t1 - t0), 0, 1); o.lift = ex.h * Math.sin(Math.PI * o.lu); o.rot = -0.3 * Math.cos(Math.PI * o.lu); }
  if (mode === 'lunge') o.rot = 0.12 * sm((t - t0) / 0.15);
  o.blink = C.blinks.some(b => Math.abs(t - b) < 0.07);
  o.sparkle = band(t, 12.55, 13.5, 0.1, 0.4);
  o.pop = band(t, 9.85, 10.45, 0.08, 0.2);
  return o;
}

// ---------------------------------------------------------------- the two animals
function qPose(o) {
  const ph = o.ph, t = o.t; let hip, sh, feet, ha = 0;
  if (o.mode === 'stand') { hip = [-88, -104]; sh = [80, -110 - Math.sin(t * 2.6) * 2]; feet = { hn: [-80, 0], hf: [-98, 0], fn: [94, 0], ff: [78, 0] }; ha = -0.05 + Math.sin(t * 1.3) * 0.04; }
  else if (o.mode === 'sit') { hip = [-62, -46]; sh = [46, -132 - Math.sin(t * 2) * 2]; feet = { hn: [-4, 0], hf: [-20, 0], fn: [72, 0], ff: [56, 0] }; ha = Math.sin(t * 1.1) * 0.04; }
  else if (o.mode === 'bow') { const w = Math.sin(t * 9) * 6; hip = [-92, -128 + w]; sh = [76, -62]; feet = { hn: [-96, 0], hf: [-110, 0], fn: [158, 0], ff: [138, 0] }; ha = -0.25 + Math.sin(t * 9) * 0.05; }
  else if (o.mode === 'leap') { const u = o.lu; hip = [-106, -104]; sh = [98, -112];
    feet = { fn: [sh[0] + lerp(118, 70, u), sh[1] + lerp(40, 104, u)], ff: [sh[0] + lerp(100, 54, u), sh[1] + lerp(56, 108, u)], hn: [hip[0] + lerp(-112, -40, u), hip[1] + lerp(64, 102, u)], hf: [hip[0] + lerp(-98, -26, u), hip[1] + lerp(78, 104, u)] };
    ha = lerp(-0.14, 0.12, u); }
  else { const g = o.mode === 'walk' ? 0.45 : 1, f = Math.cos(TAU * ph);
    hip = [-92 - 10 * f * g, -106 + 5 * g * Math.sin(TAU * ph * 2)]; sh = [80 + 10 * f * g, -110 + 5 * g * Math.sin(TAU * (ph * 2 + 0.25))];
    const foot = (base, R, Hs, off) => { const a = TAU * (ph + off), s = Math.sin(a); return [base - R * g * Math.cos(a), s > 0 ? -Hs * g * s : 0]; };
    const of = o.mode === 'walk' ? [0, 0.5, 0.25, 0.75] : [0, 0.09, 0.5, 0.59];
    feet = { hn: foot(hip[0] - 4, 64, 52, of[0]), hf: foot(hip[0] - 4, 64, 52, of[1]), fn: foot(sh[0] + 12, 68, 60, of[2]), ff: foot(sh[0] + 12, 68, 60, of[3]) };
    ha = 0.06 * g * Math.sin(TAU * ph * 2); }
  const th = Math.atan2(sh[1] - hip[1], sh[0] - hip[0]) - Math.atan2(-4, 168);
  return { hip, sh, feet, ha, th };
}
function tailAngles(o) {                                  // the angle of each tail piece (π = straight back)
  const t = o.t, m = o.mood, dog = o.kind === 'dog', P = Math.PI;
  if (o.mode === 'run' || o.mode === 'walk' || o.mode === 'leap' || o.mode === 'lunge') {
    if (m === 'sad') return k => P - 0.5 + k * 0.05;
    return dog ? k => P + 0.7 + Math.sin(t * 14) * 0.3 - k * 0.1 : k => P + 0.35 + Math.sin(TAU * o.ph - k * 0.9) * 0.3 - k * 0.05; }
  if (m === 'sad') return dog ? k => P - 0.9 + k * 0.12 : k => P - 0.35 - k * 0.04;
  if (m === 'cross') return dog ? k => P + 0.45 : k => P + 1.5 + Math.sin(t * 30) * 0.03;
  if (o.mode === 'sit') return dog ? k => P - 0.4 + Math.sin(t * 12) * 0.2 : k => P - 0.9 + k * 0.55 + Math.sin(t * 2 - k) * 0.08;
  return dog ? k => P + 1.0 + Math.sin(t * 17) * 0.42 - k * 0.12 : k => P + 1.35 + k * 0.28 + Math.sin(t * 2.2 - k) * 0.12;
}
function brow(c, x0, x1, y, mood) {                        // the inner end (toward the nose, +x) tells the mood
  const di = mood === 'sad' ? -7 : mood === 'cross' ? 7 : -3, do_ = mood === 'sad' ? 5 : mood === 'cross' ? -4 : 0;
  c.beginPath(); c.moveTo(x0, y + do_); c.lineTo((x0 + x1) / 2, y - (mood === 'happy' ? 5 : 0)); c.lineTo(x1, y + di); c.stroke();
}
function cuEyes(c, o, F, S, irisF, irisS, lidF, lidS, slit) {
  c.strokeStyle = CU.ink; c.lineCap = 'round';
  if (o.blink) { c.lineWidth = 4; c.beginPath(); c.moveTo(F[0] - 16, F[1] + 2); c.lineTo(F[0] + 16, F[1] + 4); c.moveTo(S[0] - 11, S[1] + 2); c.lineTo(S[0] + 10, S[1] - 1); c.stroke(); return; }
  cuPoly(c, [[F[0] - 18, F[1] + 2], [F[0] - 2, F[1] - 14], [F[0] + 18, F[1] + 2], [F[0], F[1] + 12]], '#fffaf0', { line: 3.5 });       // the eye seen from the front
  c.fillStyle = irisF; c.beginPath(); c.arc(F[0], F[1] - 1, 9, 0, TAU); c.fill(); c.fillStyle = CU.ink; c.beginPath(); slit ? c.ellipse(F[0], F[1] - 1, 2.6, 8.5, 0, 0, TAU) : c.arc(F[0], F[1] - 1, 4.5, 0, TAU); c.fill();
  c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(S[0], S[1], 11, 0, TAU); c.fill(); c.lineWidth = 3.5; c.stroke();                         // the eye seen from the side
  cuPoly(c, [[S[0], S[1] - 8], [S[0] + 6, S[1]], [S[0], S[1] + 8], [S[0] - 6, S[1]]], irisS, { line: 2 }); c.fillStyle = CU.ink; c.beginPath(); c.arc(S[0], S[1], 2.6, 0, TAU); c.fill();
  if (o.mood === 'sad' || o.mood === 'cross') {                                                                                       // heavy lids
    const cr = o.mood === 'cross';
    cuPoly(c, [[F[0] - 21, F[1] - 17], [F[0] + 21, F[1] - 17], [F[0] + 21, F[1] + (cr ? 3 : -4)], [F[0] - 21, F[1] + (cr ? -9 : 1)]], lidF, { line: 3 });
    cuPoly(c, [[S[0] - 13, S[1] - 14], [S[0] + 13, S[1] - 14], [S[0] + 13, S[1] + (cr ? 2 : -3)], [S[0] - 13, S[1] + (cr ? -6 : 2)]], lidS, { line: 3 });
  }
  if (o.sparkle) { c.fillStyle = '#fff'; c.globalAlpha = o.sparkle; for (const [x, y] of [[F[0] - 3, F[1] - 4], [S[0] - 3, S[1] - 3]]) { c.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 1.5 : 8 * o.sparkle, a = k * Math.PI / 4; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); } c.globalAlpha = 1; }
}
function dogHead(c, o) {
  const m = o.mood, dr = m === 'sad' ? 14 : 0;
  cuPoly(c, [[-14, -44], [-40, -36 + dr * 0.3], [-50, 14 + dr], [-30, 26 + dr]], DG.dark, { stripes: CU.ochre, gap: 10, sw: 3 });   // one floppy ear from the side…
  cuPoly(c, [[-30, -8], [-18, -44], [18, -52], [16, 14], [-20, 22]], CU.sand);                                                          // the side of the head
  cuPoly(c, [[18, -52], [54, -38], [62, -2], [42, 24], [16, 14]], CU.cream);                                                            // the front of the face
  cuPoly(c, [[46, -10], [108, -4], [110, 20], [56, 30]], CU.ochre);                                                                     // a long muzzle in profile
  cuPoly(c, [[50, -10], [106, -4], [104, 4], [54, 2]], CU.terra, { line: 2.5 });
  cuPoly(c, [[98, -13], [117, -7], [115, 10], [100, 6]], CU.ink);                                                                       // the nose
  if (m === 'happy') { cuPoly(c, [[76, 23], [94, 21], [96, 46], [80, 50]], CU.rose, { line: 3 }); c.lineWidth = 2; c.beginPath(); c.moveTo(86, 26); c.lineTo(88, 42); c.stroke(); }
  c.strokeStyle = CU.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(110, 20);
  if (m === 'happy') { c.lineTo(92, 28); c.lineTo(70, 22); } else if (m === 'sad') { c.lineTo(88, 24); c.lineTo(68, 30); } else { c.lineTo(66, 24); } c.stroke();
  cuPoly(c, [[24, -50], [54, -60 + dr * 0.4], [52, -10 + dr], [38, -18 + dr * 0.5]], DG.deep);                                          // …the other ear from the front
  cuEyes(c, o, [34, -24], [-2, -20], '#7a4a22', '#3d6fb0', CU.cream, CU.sand, false);
  c.strokeStyle = CU.ink; c.lineWidth = 4; brow(c, 18, 46, -44, m); brow(c, -16, 8, -38, m);
}
function catHead(c, o) {
  const m = o.mood, fl = m === 'cross' ? 10 : m === 'sad' ? 6 : 0;
  cuPoly(c, [[-14, -34], [-12 + fl, -82 + fl * 2], [12, -40]], CT.fur); cuPoly(c, [[-8, -40], [-7 + fl, -68 + fl * 2], [5, -42]], CU.rose, { line: 2 });   // one ear from the side…
  cuPoly(c, [[16, -40], [40 + fl, -84 + fl * 2], [48, -28]], CT.slate); cuPoly(c, [[25, -40], [38 + fl, -70 + fl * 2], [42, -33]], CU.rose, { line: 2 });  // …one from the front
  cuPoly(c, [[-28, -4], [-16, -40], [14, -46], [12, 12], [-20, 18]], CT.fur, { stripes: CU.ink, gap: 15, sw: 3 });                     // the side of the head, tabby
  cuPoly(c, [[14, -46], [50, -30], [60, 0], [38, 22], [12, 12]], CU.cream);                                                            // the front of the face
  cuPoly(c, [[40, -2], [72, 4], [60, 24], [38, 20]], '#fffaf0');                                                                       // a short muzzle
  cuPoly(c, [[60, 2], [73, 4], [65, 13]], CU.rose, { line: 2.5 });                                                                    // a pink nose from the front
  c.strokeStyle = CU.ink; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(65, 13);
  if (m === 'happy') { c.lineTo(61, 20); c.lineTo(55, 16); c.lineTo(49, 21); } else if (m === 'sad') { c.lineTo(58, 22); c.lineTo(48, 24); } else { c.lineTo(48, 18); } c.stroke();
  c.lineWidth = 2; for (const [x0, y0, x1, y1] of [[56, 10, 108, -2], [56, 14, 110, 14], [56, 18, 104, 30], [40, 12, 8, 30], [40, 16, 12, 40]]) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  cuEyes(c, o, [32, -16], [-4, -14], '#7fc24a', '#f6c21f', CU.cream, CT.fur, true);
  c.strokeStyle = CU.ink; c.lineWidth = 4; brow(c, 18, 44, -34, m); brow(c, -18, 6, -32, m);
}
function quad(c, o) {
  const dog = o.kind === 'dog', P = qPose(o), { hip, sh, feet, th } = P, cs = Math.cos(th), sn = Math.sin(th);
  const R = (b, dx, dy) => [b[0] + dx * cs - dy * sn, b[1] + dx * sn + dy * cs], mid = [(hip[0] + sh[0]) / 2, (hip[1] + sh[1]) / 2];
  c.save(); c.translate(o.x, o.y - o.lift); c.scale(o.fx * o.s, o.s); c.rotate(o.rot);
  const farC = dog ? [DG.deep, DG.mid, CU.ink, DG.dark] : [CT.deep, CT.slate, CU.navy, CT.fur], nearC = dog ? [DG.dark, CU.sand, CU.ink, CU.cream] : [CT.slate, CT.fur, CU.ink, CU.cream];
  cuLeg(c, R(hip, -8, 2), feet.hf, 64, 68, farC, true); cuLeg(c, R(sh, -2, 6), feet.ff, 60, 64, farC, true);
  const ta = tailAngles(o), n = dog ? 4 : 6, L = dog ? 32 : 30; let tp = R(hip, -40, -8);                      // the tail: straight pieces in alternating colours
  for (let k = 0; k < n; k++) { const a = ta(k), q = [tp[0] + Math.cos(a) * L, tp[1] + Math.sin(a) * L], w = dog ? 11 - k * 1.6 : 9 - k * 0.8 + (o.mood === 'cross' ? 4 : 0);
    cuSeg(c, tp, q, w, w - 1.2, dog ? (k % 2 ? CU.sand : DG.dark) : (k % 2 ? CU.ink : CT.fur)); tp = q; }
  cuPoly(c, [[tp[0] - 10, tp[1]], [tp[0], tp[1] - 10], [tp[0] + 10, tp[1]], [tp[0], tp[1] + 10]], dog ? CU.cream : CU.rose);
  const A = R(hip, -42, -34), B = R(hip, -50, 22), C = R(hip, 4, 46), D = R(mid, -6, 24), E = R(sh, -10, 48), F = R(sh, 50, 12), G = R(sh, 30, -48), Hh = R(mid, 8, -44);
  if (dog) {                                                                                                     // the body: five flat planes
    cuPoly(c, [A, B, C, Hh], CU.sand); cuPoly(c, [C, D, Hh], CU.terra, { dots: CU.ink }); cuPoly(c, [Hh, D, E], CU.cream);
    cuPoly(c, [Hh, E, G], CU.ochre, { stripes: DG.dark, gap: 13, sw: 4 }); cuPoly(c, [G, E, F], CU.cream);
  } else {
    cuPoly(c, [A, B, C, Hh], CT.fur, { stripes: CU.ink, gap: 16, sw: 4 }); cuPoly(c, [C, D, Hh], CU.cream); cuPoly(c, [Hh, D, E], CT.slate);
    cuPoly(c, [Hh, E, G], CT.fur, { stripes: CU.ink, gap: 16, sw: 4 }); cuPoly(c, [G, E, F], CU.rose);
  }
  const hz = o.mode === 'sit' ? 1.25 : 1;                                                                        // the haunch, a diamond
  cuPoly(c, [R(hip, -36 * hz, -6), R(hip, 0, -46 * hz), R(hip, 38 * hz, 2), R(hip, 2, 48 * hz)], dog ? DG.dark : CT.slate);
  cuPoly(c, [R(hip, -14, -4), R(hip, 0, -22), R(hip, 16, 0), R(hip, 2, 22)], dog ? CU.ochre : CU.cream);
  cuLeg(c, R(hip, 0, 8), feet.hn, 64, 68, nearC, false);
  cuPoly(c, [R(sh, -22, -20), R(sh, 26, -26), R(sh, 10, 34)], dog ? CU.terra : CT.slate);                        // the shoulder, a triangle
  cuLeg(c, R(sh, 6, 10), feet.fn, 60, 64, nearC, false);
  const HA = dog ? R(sh, 64, -54) : R(sh, 58, -50);
  cuPoly(c, [G, F, cuAdd(HA, 2, 26), cuAdd(HA, -26, -4)], dog ? CU.sand : CT.fur);                               // the neck
  const k1 = [(G[0] + HA[0] - 26) / 2, (G[1] + HA[1] - 4) / 2], k2 = [(F[0] + HA[0] + 2) / 2, (F[1] + HA[1] + 26) / 2];  // a collar
  cuSeg(c, k1, k2, 7, 7, dog ? CU.teal : CU.rose);
  if (dog) cuPoly(c, [cuAdd(k2, -2, 4), cuAdd(k2, 6, 12), cuAdd(k2, -2, 20), cuAdd(k2, -10, 12)], CU.ochre, { line: 2.5 });
  else { c.fillStyle = CU.ochre; c.beginPath(); c.arc(k2[0], k2[1] + 9, 7, 0, TAU); c.fill(); c.lineWidth = 2.5; c.strokeStyle = CU.ink; c.stroke(); }
  c.translate(HA[0], HA[1]); c.rotate(P.ha + (o.mood === 'sad' ? 0.22 : 0)); const hs = dog ? 1.2 : 1.32; c.scale(hs, hs);
  (dog ? dogHead : catHead)(c, o);
  if (o.pop) { c.globalAlpha = o.pop; for (const [x, y, r, col] of [[10, -112, 13, CU.ochre], [34, -100, 8, CU.terra], [-10, -98, 7, CU.teal]]) { const rr = r * (0.6 + 0.4 * o.pop); cuPoly(c, [[x, y - rr * 1.6], [x + rr, y], [x, y + rr * 1.6], [x - rr, y]], col, { line: 2.5 }); } c.globalAlpha = 1; }
  c.restore();
}
function backing(c, o) {                                    // a pale plane behind each animal so it stands clear of the busy world
  const S = o.s, x = o.x, y = o.y - o.lift - 120 * S, w = Math.sin(o.t * 0.8 + S * 9) * 12;
  c.save(); c.globalAlpha = 0.8; cuPoly(c, [[x - 300 * S, y + 40 * S + w], [x - 50 * S, y - 230 * S - w], [x + 310 * S, y - 70 * S + w], [x + 90 * S, y + 160 * S]], CU.cream, { line: 3 }); c.restore();
}

// ---------------------------------------------------------------- the ball: a dog half and a cat half
function ballAt(t) {
  const dX = track(DOG.X, t), cX = track(CAT.X, t), r = 22, rest = GY - r;
  if (t < 2.6) { const x = lerp(lerp(dX, cX, 0.55), 950, sm((t - 2.0) / 0.6)); return { whole: true, x, y: rest - 170 * Math.abs(Math.sin(Math.PI * t * 4 / 2.6)), rot: x / r }; }
  if (t < 4.3) { const u = Math.min(t, 4.0) - 2.6, x = 950 + 30 * Math.sin(TAU * u / (2.8 / 3)); return { whole: true, x, y: rest - 50 * Math.abs(Math.sin(Math.PI * u / (1.4 / 3))), rot: x / r }; }
  if (t < 12.4) { const u = sm((t - 4.3) / 0.6), up = 120 * Math.sin(Math.PI * clamp((t - 4.3) / 0.6, 0, 1)), y = lerp(rest, GY, u) - up;
    return { halves: [[lerp(950, 860, u), y, u * (Math.PI / 2 + TAU)], [lerp(950, 1040, u), y, -u * (Math.PI / 2 + TAU)]] }; }
  if (t < 12.7) { const u = sm((t - 12.4) / 0.3), y = lerp(GY, rest, u); return { halves: [[lerp(860, 920, u), y, lerp(Math.PI / 2, 0, u)], [lerp(1040, 920, u), y, lerp(-Math.PI / 2, 0, u)]] }; }
  if (t < 13.1) return { whole: true, x: 920, y: rest, rot: 0 };
  const u = Math.min(t, 16.8) - 13.1, x = (dX + cX) / 2;
  return { whole: true, x, y: rest - 190 * Math.abs(Math.sin(Math.PI * u / (3.7 / 6))), rot: (x - 920) / r };
}
function halfBall(c, x, y, rot, side) {                    // side 0: the dog's half (warm), 1: the cat's half (cool)
  const r = 22, a0 = side ? -Math.PI / 2 : Math.PI / 2, a1 = a0 + Math.PI;
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = side ? CU.teal : CU.ochre; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, a0, a1); c.closePath(); c.fill();
  c.fillStyle = side ? CU.violet : CU.terra; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * 0.55, a0, a1); c.closePath(); c.fill();
  c.strokeStyle = CU.ink; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, -r); c.arc(0, 0, r, a0, a1); c.closePath(); c.stroke();
  c.restore();
}
function drawBall(c, t) {
  const b = ballAt(t), shadow = (x, y) => { c.fillStyle = 'rgba(20,20,20,.25)'; c.beginPath(); c.ellipse(x, GY + 2, 22 * (1 - Math.min((GY - 22 - y) / 400, 0.5)), 5, 0, 0, TAU); c.fill(); };
  if (b.whole) { shadow(b.x, b.y); halfBall(c, b.x, b.y, b.rot, 0); halfBall(c, b.x, b.y, b.rot, 1); }
  else b.halves.forEach(([x, y, r], k) => { shadow(x, y); halfBall(c, x, y, r, k); });
  if (t > 4.3 && t < 4.6) { const u = (t - 4.3) / 0.3; c.save(); c.globalAlpha = 1 - u; for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.2, r0 = 30 + u * 40, r1 = r0 + 26; cuPoly(c, [[950 + Math.cos(a) * r0, 678 + Math.sin(a) * r0], [950 + Math.cos(a + 0.12) * r1, 678 + Math.sin(a + 0.12) * r1], [950 + Math.cos(a - 0.12) * r1, 678 + Math.sin(a - 0.12) * r1]], k % 2 ? CU.ochre : CU.cream, { line: 2.5 }); } c.restore(); }
}
function drawHeart(c, t) {                                  // the heart they share, in two halves of two colours
  const u = (t - HEART) / 1.4; if (u < 0 || u > 1) return; const s = 34 * eOut(u * 3) * (1 + 0.08 * Math.sin(t * 14)), x = 920, y = 520 - u * 90;
  c.save(); c.globalAlpha = 1 - sm((u - 0.7) / 0.3); c.translate(x, y); c.rotate(Math.sin(t * 3) * 0.08);
  cuPoly(c, [[0, -0.35 * s], [-0.5 * s, -0.95 * s], [-1.05 * s, -0.55 * s], [-0.95 * s, 0.05 * s], [0, s]], CU.terra);
  cuPoly(c, [[0, -0.35 * s], [0.45 * s, -0.9 * s], [1.05 * s, -0.6 * s], [1.0 * s, 0.1 * s], [0, s]], CU.rose, { stripes: CU.cream, gap: 10, sw: 3 }); c.restore();
}

// ---------------------------------------------------------------- the world (the same cubist town as Every Angle)
function cuSky(c, t) {
  const C0 = [Math.sin(t * 0.3) * 30, 380], R = 1700, N = 10;
  const cool = ['#203a63', '#2e4f7a', '#3d3a6b', '#1a2947', '#34597a'], warm = ['#e9b44c', '#e58f5a', '#f2d7a0', '#d9744a', '#f0c98a'];
  c.fillStyle = CU.cream; c.fillRect(-VW, 0, VW * 2, 1000);
  const ang = k => k * TAU / N + 0.16 * Math.sin(t * 0.25 + k * 1.7) + t * 0.012 + 0.3;
  for (let k = 0; k < N; k++) { const a0 = ang(k), a1 = ang(k + 1) + (k === N - 1 ? TAU : 0), m = (a0 + a1) / 2;
    cuPoly(c, [C0, [C0[0] + Math.cos(a0) * R, C0[1] + Math.sin(a0) * R], [C0[0] + Math.cos(a1) * R, C0[1] + Math.sin(a1) * R]], (Math.cos(m) > 0 ? warm : cool)[k % 5], { line: 2.5 }); }
  const mx = -VW * 0.27, my = 190;
  cuPoly(c, [[mx - 10, my - 62], [mx + 34, my - 34], [mx + 6, my], [mx + 34, my + 40], [mx - 12, my + 62], [mx - 46, my + 20], [mx - 46, my - 22]], CU.cream);
  cuPoly(c, [[mx - 10, my - 62], [mx + 6, my], [mx - 12, my + 62], [mx - 46, my + 20], [mx - 46, my - 22]], '#cfd8e6', { line: 2.5 });
  for (let i = 0; i < 9; i++) { const x = -VW * 0.5 + hash(i, 1) * VW * 0.45, y = 60 + hash(i, 2) * 380, r = 6 + hash(i, 3) * 8 * (0.6 + 0.4 * Math.sin(t * 3 + i)); cuPoly(c, [[x, y - r], [x + r * 0.4, y], [x, y + r], [x - r * 0.4, y]], CU.cream, { line: 1.5 }); }
  const sx = VW * 0.27, sy = 230, rot = t * 0.25;
  for (let k = 0; k < 10; k++) { const a = rot + k * TAU / 10; cuPoly(c, [[sx + Math.cos(a - 0.14) * 74, sy + Math.sin(a - 0.14) * 74], [sx + Math.cos(a) * (112 + (k % 2) * 20), sy + Math.sin(a) * (112 + (k % 2) * 20)], [sx + Math.cos(a + 0.14) * 74, sy + Math.sin(a + 0.14) * 74]], k % 2 ? CU.terra : '#f6d34a', { line: 2.5 }); }
  c.fillStyle = '#f6d34a'; c.beginPath(); c.arc(sx, sy, 66, Math.PI / 2, Math.PI * 1.5); c.fill(); c.fillStyle = '#e0672f'; c.beginPath(); c.arc(sx, sy, 66, -Math.PI / 2, Math.PI / 2); c.fill();
  c.strokeStyle = CU.ink; c.lineWidth = 4; c.beginPath(); c.arc(sx, sy, 66, 0, TAU); c.moveTo(sx, sy - 66); c.lineTo(sx - 12, sy - 10); c.lineTo(sx + 8, sy + 8); c.lineTo(sx, sy + 66); c.stroke();
}
const LAY = [
  { p: 0.12, draw(c, v) { tiles(v.x0, v.x1, 360, (x, i, r) => { const h = 250 + r * 230, px = x + hash(i, 2) * 100, top = [px + 20, 800 - h];
      cuPoly(c, [[px - 250, 800], top, [px + 10, 800]], i % 2 ? '#8fa6c8' : '#b7a6cc', { line: 3 }); cuPoly(c, [[px + 10, 800], top, [px + 250, 800]], i % 2 ? '#51648f' : '#6a5a94', { line: 3 }); }); } },
  { p: 0.4, draw(c, v) { tiles(v.x0, v.x1, 250, (x, i, r) => {
      const k = ((i % 4) + 4) % 4, base = 830;
      if (k === 3) {
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
      const tx = x + w + 100, th = 150 + hash(i, 5) * 140;
      cuPoly(c, [[tx, base - th], [tx, base], [tx - 20, base - th * 0.45]], CU.teal, { line: 3 }); cuPoly(c, [[tx, base - th], [tx + 20, base - th * 0.45], [tx, base]], '#1d5a52', { line: 3 });
    }); } },
  { p: 1, draw(c, v) {                                       // a tiled floor in skewed squares
    const a = v.x0 - 120, b = v.x1 + 120, cols = [CU.sand, CU.terra, CU.cream];
    c.fillStyle = '#8a4b32'; c.fillRect(a, GY, b - a, 1400);
    for (let row = 0; row < 6; row++) { const y0 = GY + row * 84, y1 = y0 + 84, sk = 46;
      for (let x = Math.floor(a / 96) * 96 - 192; x < b + 96 + row * sk; x += 96) { const i = Math.round(x / 96); cuPoly(c, [[x - row * sk, y0], [x + 96 - row * sk, y0], [x + 96 - (row + 1) * sk, y1], [x - (row + 1) * sk, y1]], cols[(((i + row * 2) % 3) + 3) % 3], (i + row) % 5 === 0 ? { dots: CU.ink, line: 2.5 } : { line: 2.5 }); } }
    c.fillStyle = CU.ink; c.fillRect(a, GY - 3, b - a, 7);
  }, chars: true },
  { p: 1.5, draw(c, v, st) { if (st.zz > 1.0 || st.sp > 0.02) return; tiles(v.x0, v.x1, 820, (x, i, r) => { if (r < 0.4) return;
      cuPoly(c, [[x - 30, 1120], [x + 60, 800 + r * 60], [x + 190, 1120]], CU.ink); cuPoly(c, [[x + 110, 1120], [x + 190, 900], [x + 290, 1120]], i % 2 ? CU.ochre : CU.teal, { stripes: CU.ink, gap: 16, sw: 3 }); }); } },
];

// ---------------------------------------------------------------- cameras: one, or two while they are apart
const CZ = [[0, 0.85], [2.2, 0.85], [2.8, 1.1, 'e'], [4.5, 1.1], [5.2, 1.0, 'e'], [11.8, 1.0], [12.4, 1.18, 'e'], [13.0, 1.18], [13.7, 0.85, 'e'], [16.4, 0.85], [17.2, 0.94, 'e']];
const CY = [[0, 560], [2.8, 590, 'e'], [11.8, 590], [12.4, 560, 'e'], [13.7, 545, 'e'], [16.4, 545], [17.2, 505, 'e']];
function mainCam(t) { const vert = H > W, z = track(CZ, t) * (vert ? 0.9 : 1.3); return { x: (track(DOG.X, t) + track(CAT.X, t)) / 2 - 25, y: track(CY, t) - (vert ? 90 : 55), z }; }
function sideCam(side, t) {                                // side 0 follows the dog (left / top), side 1 the cat (right / bottom)
  const vert = H > W, z = vert ? 1.1 : 1.35, x = track((side ? CAT : DOG).X, t), sg = side ? -1 : 1;
  return vert ? { x, y: 615 + sg * 215 / z, z } : { x: x + sg * VW / (4 * z * AZ), y: 545, z };
}
function seam(t) {                                          // the jagged line where the picture splits
  const vert = H > W, pts = [], n = 9;
  for (let k = 0; k <= n; k++) { const u = k / n, j = (k % 2 ? 1 : -1) * (k === 0 || k === n ? 0.5 : 1) * 0.022;
    pts.push(vert ? [lerp(-20, W + 20, u), H * (0.5 + j)] : [W * (0.5 + j), lerp(-20, H + 20, u)]); }
  return pts;
}
function scene(cam, t, sp) {
  const st = { t, ta: t, step: Math.floor(t * 30), cx: cam.x, cy: cam.y, z: cam.z * AZ, zz: cam.z, sp, sh: {} };
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.filter = 'none';
  screenTf(X); X.save(); cuSky(X, t); X.restore();
  for (const L of LAY) { const v = layerTf(X, st, L.p); X.save(); L.draw(X, v, st); X.restore();
    if (L.chars) { X.save(); layerTf(X, st, 1); const d = charAt(DOG, t), k = charAt(CAT, t);
      for (const o of [d, k]) { X.fillStyle = 'rgba(20,20,20,.3)'; X.beginPath(); X.ellipse(o.x, GY + 2, 120 * o.s * (1 - Math.min(o.lift / 500, 0.6)), 9 * o.s, 0, 0, TAU); X.fill(); }
      backing(X, d); backing(X, k); drawBall(X, t); quad(X, d); quad(X, k); drawHeart(X, t); X.restore(); } }
  return st;
}
function overlay(c, t) {
  const vert = H > W, SER = 'Georgia, "Times New Roman", serif', cs = Math.min(34 * LS, VW * 0.056);
  const cap = (s, a, b, rot, bg, yy) => { const al = band(t, a, b, 0.2, 0.25); if (al <= 0) return; c.save(); c.globalAlpha = al; c.translate(0, yy || (vert ? 880 : 905)); c.rotate(rot);
    c.font = `italic 700 ${cs}px ${SER}`; const w = Math.min(c.measureText(s).width + 56, VW * 0.94), h = cs * 1.9;
    cuPoly(c, [[-w / 2 + 6, -h / 2 + 8], [w / 2 + 8, -h / 2 + 4], [w / 2 + 4, h / 2 + 8], [-w / 2 + 10, h / 2 + 6]], CU.ink, { line: 0 }); cuPoly(c, [[-w / 2, -h / 2], [w / 2, -h / 2 - 5], [w / 2 - 6, h / 2], [-w / 2 + 4, h / 2 + 4]], bg);
    txt(c, s, 0, 2, cs, { font: SER, weight: 700, italic: true, fill: CU.ink, maxW: w - 36 }); c.restore(); };
  cap('two best friends…', 0.5, 2.3, -0.025, CU.cream); cap('…one little quarrel', 4.35, 5.6, 0.02, CU.ochre);
  cap('every story has two sides…', 6.7, 9.5, -0.02, CU.cream, vert ? 500 : 905); cap('…but only one friendship', 13.3, 15.8, 0.02, CU.ochre);
  if (t > 17.2) {                                             // the title, cut into three strips that slide into place
    const ts = Math.min(VW * 0.2, (vert ? 150 : 104) * LS), y = vert ? 215 : 165, F = '"Arial Black", Impact, sans-serif', e = eOut((t - 17.2) / 0.7);
    { const bw = Math.min(VW * 0.48, ts * 3.9); c.save(); c.globalAlpha = sm((t - 17.2) / 0.4); cuPoly(c, [[-bw + 8, y - ts * 0.6 + 10], [bw + 10, y - ts * 0.68 + 8], [bw + 4, y + ts * 0.62 + 10], [-bw + 12, y + ts * 0.58 + 8]], CU.ink, { line: 0 }); cuPoly(c, [[-bw, y - ts * 0.6], [bw, y - ts * 0.68], [bw - 8, y + ts * 0.62], [-bw + 6, y + ts * 0.58]], CU.cream); c.restore(); }
    [[CU.terra, -1], [CU.ink, 1], [CU.teal, -1]].forEach(([col, dir], k) => { c.save(); c.beginPath(); c.rect(-VW, y - ts * 0.5 + k * ts / 3, VW * 2, ts / 3 + 0.6); c.clip();
      const off = dir * (VW * (1 - e) + (k === 1 ? 0 : 9)); txt(c, 'TWO SIDES', off, y, ts, { font: F, fill: col, maxW: VW * 0.86 }); c.restore(); });
    const a2 = sm((t - 18.1) / 0.4); if (a2 > 0) { c.save(); c.globalAlpha = a2; c.translate(0, y + ts * 0.92); c.rotate(-0.03); const sz = ts * 0.32, s2 = 'AN EVERY ANGLE STORY'; c.font = `900 ${sz}px ${F}`; const w = Math.min(c.measureText(s2).width + 50, VW * 0.9);
      cuPoly(c, [[-w / 2, -sz * 0.8], [w / 2, -sz * 0.9], [w / 2 - 8, sz * 0.8], [-w / 2 + 6, sz * 0.9]], CU.ochre); txt(c, s2, 0, 3, sz, { font: F, fill: CU.ink, maxW: w - 30 }); c.restore(); }
    cap('a cubist cartoon  ·  coming soon', 19.0, 99, 0.015, CU.cream, vert ? 905 : 960);
  }
}
const T = {
  name: 'TWO SIDES', DUR: 22, vol: 1.6, revLen: 1.8,
  post: [['blotch', 0.22], ['paper', 0.6], ['grain', 0.05], ['vignette', 0.28, '60,40,20']],
  render(t) {
    const sp = SPLIT(t), main = mainCam(t); let st;
    if (sp < 0.002) st = scene(main, t, 0);
    else {
      const P = seam(t), vert = H > W, regions = vert ? [[[-20, -20], [W + 20, -20]], [[W + 20, H + 20], [-20, H + 20]]] : [[[-20, H + 20], [-20, -20]], [[W + 20, -20], [W + 20, H + 20]]];
      for (const side of [0, 1]) {
        const sc = sideCam(side, t), cam = { x: lerp(main.x, sc.x, sp), y: lerp(main.y, sc.y, sp), z: lerp(main.z, sc.z, sp) };
        X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.beginPath();
        const rg = regions[side], fwd = vert ? side : !side;   // the region on this side of the seam
        X.moveTo(rg[0][0], rg[0][1]); X.lineTo(rg[1][0], rg[1][1]); for (const p of (fwd ? P : P.slice().reverse())) X.lineTo(p[0], p[1]); X.closePath(); X.clip();
        st = scene(cam, t, sp);
        X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 0.16 * sp; X.fillStyle = side ? CU.navy : CU.ochre; X.fillRect(0, 0, W, H);   // a warm side and a cool side
        X.restore();
      }
      X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = sp; X.lineJoin = 'miter';
      for (const [w, col] of [[U * 16, CU.ink], [U * 6, CU.cream]]) { X.strokeStyle = col; X.lineWidth = w; X.beginPath(); P.forEach((p, k) => k ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.stroke(); }
      X.restore();
    }
    X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; screenTf(X); X.save(); overlay(X, t); X.restore();
    X.setTransform(1, 0, 0, 1, 0, 0);
    for (const fx of T.post) { const [n, ...a] = fx; X.save(); POST[n](st, ...a); X.restore(); }
    return st;
  },
  music(A) {
    const b = 60 / 116;
    const gtr = (t, n, v = 1, pan = 0) => { A.pluck(t, n, { type: 'triangle', vol: 0.13 * v, lp: 3400, lpTo: 600, fT: 0.3, dur: 0.7, rev: 0.25, pan }); A.tone(t, mtof(n) * 2, 0.12, { vol: 0.02 * v, pan }); };
    const strum = (t, ch, v = 1) => ch.concat(ch[0] + 12).forEach((n, k) => gtr(t + k * 0.018, n, 0.55 * v, 0.3));
    const bass = (t, n, d) => A.tone(t, mtof(n), d, { type: 'triangle', vol: 0.2, a: 0.01, r: 0.08, lp: 440 });
    const cast = (t, v = 1) => A.tone(t, 1700, 0.02, { type: 'square', vol: 0.03 * v });
    const clap = (t, v = 1) => { for (let k = 0; k < 2; k++) A.tone(t + k * 0.012, 900 + k * 300, 0.03, { type: 'square', vol: 0.028 * v, rev: 0.2 }); };
    const boing = (t, n) => A.marimba(t, n, 0.45);                       // a soft note for each bounce of the ball
    const Ch = { A: [57, 61, 64], D: [57, 62, 66], E: [56, 59, 64], Am: [57, 60, 64], Dm: [57, 62, 65], F: [57, 60, 65], G: [55, 59, 62] }, Rt = { A: 45, D: 50, E: 40, Am: 45, Dm: 50, F: 41, G: 43 };
    const groove = (t0, t1, prog, mel) => {
      const e = b / 2; for (let k = Math.ceil(t0 / e - 1e-6); k * e < t1 - 0.01; k++) { const t = k * e, c = prog[Math.floor((t - t0) / (2 * b) + 1e-6) % prog.length], q = k % 4;
        if (q === 0) { bass(t, Rt[c], b * 0.8); strum(t, Ch[c], 0.9); } else if (q === 2) { bass(t, Rt[c] + 7, b * 0.5); strum(t, Ch[c], 0.7); clap(t); } else { gtr(t, Ch[c][q === 1 ? 1 : 2] + 12, 0.45, -0.3); cast(t, 0.8); } }
      if (mel) for (const [at, n] of mel) { const t = t0 + at * b / 2; if (t < t1 - 0.02) gtr(t, n, 1.2, -0.1); }
    };
    // play together
    const M1 = [[0, 76], [1, 78], [2, 81], [4, 78], [5, 76], [6, 73], [8, 74], [9, 76], [10, 78], [12, 76], [14, 73]];
    [69, 73, 76, 81].forEach((n, k) => gtr(0.03 + k * 0.06, n, 0.9)); groove(0.3, 4.0, ['A', 'D', 'E', 'A'], M1);
    for (let k = 1; k <= 4; k++) boing(k * 2.6 / 4, [81, 85, 88, 81][k - 1]); for (let k = 1; k <= 3; k++) boing(2.6 + k * 1.4 / 3, [88, 85, 88][k - 1]);
    // the quarrel: both lunge, the ball breaks, two grumpy notes
    gtr(4.0, 64, 0.9); gtr(4.12, 68, 0.9); gtr(4.24, 71, 0.9);
    A.tone(4.3, 1400, 0.3, { type: 'triangle', slide: 300, vol: 0.12, rev: 0.3 }); cast(4.3, 1.4); cast(4.33, 1.2);
    gtr(4.55, 52, 1.1); gtr(4.8, 51, 1.1); boing(4.9, 64); boing(4.95, 69);
    // apart: slow, gentle arpeggios in minor, and one note for each look back
    const arp = (t0, ch, n = 6) => { const ns = [ch[0] - 12, ch[1], ch[2], ch[0] + 12, ch[2], ch[1]]; for (let k = 0; k < n; k++) gtr(t0 + k * 0.21, ns[k % 6], 0.6, k % 2 ? 0.25 : -0.25); bass(t0, ch[0] - 24, 1.2); };
    [['Am', 5.3], ['Dm', 6.55], ['Am', 7.8], ['E', 9.05]].forEach(([c, t]) => { arp(t, Ch[c]); A.pad(t, Ch[c].map(n => n - 12), 1.3, { vol: 0.02, lp: 900 }); });
    A.flute(7.6, 64, 0.5, { vol: 0.1 }); A.flute(8.62, 76, 0.5, { vol: 0.09 }); A.flute(9.82, 69, 0.8, { vol: 0.1 }); A.flute(9.82, 76, 0.8, { vol: 0.08 });
    [88, 93].forEach((n, k) => boing(9.95 + k * 0.12, n));
    // running back: F – G – A, faster and faster
    [['F', 10.35], ['G', 10.95], ['A', 11.55]].forEach(([c, t0], i) => { const step = [0.26, 0.18, 0.13][i]; for (let t = t0; t < t0 + 0.6; t += step) strum(t, Ch[c], 0.6 + i * 0.15); bass(t0, Rt[c], 0.5); });
    [69, 71, 73, 74, 76, 78, 80, 81].forEach((n, k) => gtr(10.4 + k * 0.23, n, 0.9));
    strum(12.15, Ch.E, 1); bass(12.15, 40, 0.3);
    // together again: a warm chord, a chime for the heart
    strum(12.45, Ch.A, 1.3); bass(12.45, 33, 1.2); [81, 85, 88, 93].forEach((n, k) => boing(HEART + k * 0.1, n)); A.pad(12.45, [57, 61, 64, 69], 1.2, { vol: 0.025 });
    // play again
    const M2 = [[0, 81], [1, 80], [2, 81], [3, 83], [4, 85], [6, 83], [7, 81], [8, 78], [9, 80], [10, 81], [12, 85], [13, 88]];
    groove(13.1, 16.75, ['A', 'D', 'E', 'A'], M2); for (let k = 1; k <= 6; k++) boing(13.1 + k * 3.7 / 6, [81, 85, 88, 85, 88, 93][k - 1]);
    // the title
    strum(16.8, Ch.E, 1.1); bass(16.8, 40, 0.4); strum(17.2, Ch.A, 1.3); bass(17.2, 45, 0.9); [0, 1, 2].forEach(k => clap(17.4 + k * 0.23, 1.4));
    [81, 85, 88, 93].forEach((n, k) => gtr(18.1 + k * 0.14, n, 0.9));
    groove(18.7, 20.8, ['D', 'A', 'E', 'A'], [[0, 78], [1, 76], [2, 73], [4, 74], [5, 76], [6, 81]]);
    strum(20.85, Ch.A, 1.3); bass(20.85, 33, 1.0); clap(20.85, 1.2); boing(21.2, 93);
  },
};
