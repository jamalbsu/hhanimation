// =====================================================================================
//  PANTHER RIG — the panther and its pack, on their own.
//  Everything that makes the big cats: the gait (walk, gallop, leap, rest), the 3D-turned
//  body, head, legs and tail, the coats and markings, and the shading that paints them.
//
//  Used by every PANTHERA builder: each section below replaces the same section of a
//  built page (see adv/panther-module.js). Change the panther here and every new video
//  gets it. panther-rig.classic.js keeps the original look of episodes 1-20.
//
//  Style knobs (CFG.pantherStyle in an episode, or window.PANTHER_STYLE in the showcase):
//    outline  ink outline width (0 = off)      rim2   strength of the second, cool rim light
//    gloss    glossy highlight along the spine  bounce warm light bouncing up from the ground
//    ghost    how clearly the black panther's hidden rosettes show
//    face     'anime' (big glossy eyes, blush, ω smile) or 'real'     blush, fang  anime extras (0 = off)
//  Coats: COATS.<name> = { fur, far, rim, lt, belly?, muzzle?, mark?, eye?, rosetteFill?, ghost? }
// =====================================================================================
//#region panther:gait
// ---- gait ---------------------------------------------------------------------
// Panther faces right; the viewer sees its left side, so L legs are near, R legs far.
// Hind paws are centred just behind the hip (x0 = -105, hip at -93) so each one lands
// roughly in the print the fore paw on the same side just left, and pushes off behind the rump.
const LEGS = [
  { id: 'RH', far: true,  hind: true,  off: 0.50, x0: -105 },
  { id: 'RF', far: true,  hind: false, off: 0.75, x0: 104 },
  { id: 'LH', far: false, hind: true,  off: 0.00, x0: -105 },
  { id: 'LF', far: false, hind: false, off: 0.25, x0: 104 },
];
const HIP = [-93, -130];                 // hip joint, body coords
const THIGH = 54, SHIN = 58, METATARSUS = 36;
// paw "roll" angle (deg) over the swing: lifts, curls back, reaches forward, plants
const FRONT_SWING = [[0, 116], [0.3, 168], [0.62, 95], [0.86, 58], [1, 70]];
const HIND_SWING  = [[0, 116], [0.32, 150], [0.66, 80], [0.88, 60], [1, 68]];   // starts/ends where the stance angle does

function footState(leg, c) {                 // c = walk cycles so far
  const p = frac(c + leg.off);
  if (p < DUTY) {
    const s = p / DUTY;
    return { fx: leg.x0 + STRIDE * (0.5 - s), fy: 0, stance: true, s,
             ang: leg.hind ? 68 + 48 * s * s : 70 + 46 * s * s };
  }
  const s = (p - DUTY) / (1 - DUTY);
  const e = s - Math.sin(TAU * s) / TAU;
  const lift = leg.hind ? 17 : 22;
  return { fx: leg.x0 + STRIDE * (-0.5 + e), fy: -lift * Math.sin(Math.PI * Math.pow(s, 0.8)), stance: false, s,
           ang: keyframes(leg.hind ? HIND_SWING : FRONT_SWING, s) };
}

//#endregion panther:gait
//#region panther:curves
// ---- curve helpers ---------------------------------------------------------------
function cr(p0, p1, p2, p3, u) {              // Catmull-Rom on numbers
  const u2 = u * u, u3 = u2 * u;
  return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (3 * p1 - p0 - 3 * p2 + p3) * u3);
}
function keyCR(k, s) {                         // smooth curve through [time, value] keys
  if (s <= k[0][0]) return k[0][1];
  if (s >= k[k.length - 1][0]) return k[k.length - 1][1];
  let i = 0; while (s > k[i + 1][0]) i++;
  const u = (s - k[i][0]) / (k[i + 1][0] - k[i][0]);
  const v = j => k[clamp(j, 0, k.length - 1)][1];
  return cr(v(i - 1), v(i), v(i + 1), v(i + 2), u);
}
function keyP(k, s) {                          // same, repeating; first and last key hold the same value
  s = frac(s); const n = k.length - 1;
  let i = 0; while (i < n - 1 && s > k[i + 1][0]) i++;
  const u = (s - k[i][0]) / (k[i + 1][0] - k[i][0]);
  const v = j => k[((j % n) + n) % n][1];
  return cr(v(i - 1), v(i), v(i + 1), v(i + 2), u);
}
function keyPts(k, s) {                        // same, for [time, [x, y]] keys
  return [0, 1].map(d => keyCR(k.map(([j, p]) => [j, p[d]]), s));
}
function toLocal(xw, yw, L, Pd) {              // ground coords → panther body coords (lift L, pitch Pd°)
  const a = -Pd * DEG, x = xw, y = yw - L + 120;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a) - 120];
}
function toWorld(x, y, L, Pd) {
  const a = Pd * DEG, Y = y + 120;
  return [x * Math.cos(a) - Y * Math.sin(a), x * Math.sin(a) + Y * Math.cos(a) - 120 + L];
}

//#endregion panther:curves
//#region panther:motion
// ---- gallop ----------------------------------------------------------------------
const G_STANCE = { LH: [0.00, 0.24], RH: [0.06, 0.24], RF: [0.38, 0.22], LF: [0.45, 0.22] };   // [touchdown, duty] per cycle
const G_XC = { hind: -69, fore: 112 };
const G_SWING = {          // [progress, x, height] — paws stretch back, tuck under, reach forward
  hind: [[0, -109, 0], [0.2, -145, 26], [0.5, -77, 40], [0.8, -17, 24], [1, -29, 0]],
  fore: [[0, 76, 0], [0.3, 60, 38], [0.55, 90, 44], [0.85, 170, 30], [1, 148, 0]],
};
const G_LIFT  = [[0, -3], [0.15, -9], [0.3, -24], [0.4, -14], [0.55, -4], [0.68, -8], [0.8, -22], [0.92, -12], [1, -3]];
const G_PITCH = [[0, 2], [0.15, -4], [0.3, -6], [0.42, 5], [0.55, 6], [0.7, -2], [0.82, -3], [0.95, 3], [1, 2]];
const G_FLEX  = [[0, 0], [0.3, -1], [0.55, 0], [0.8, 1], [1, 0]];          // + = back arched (paws gathered), − = stretched out
const G_X = { hind: G_SWING.hind.map(r => [r[0], r[1]]), fore: G_SWING.fore.map(r => [r[0], r[1]]) };
const G_H = { hind: G_SWING.hind.map(r => [r[0], r[2]]), fore: G_SWING.fore.map(r => [r[0], r[2]]) };
function gallopFoot(L, g) {
  const [s0, duty] = G_STANCE[L.id], p = frac(g - s0), kind = L.hind ? 'hind' : 'fore';
  const xc = G_XC[kind], disp = SG * duty;
  if (p < duty) {
    const s = p / duty;
    return { x: xc + disp * (0.5 - s), h: 0, ang: L.hind ? 68 + 48 * s * s : 70 + 46 * s * s };
  }
  const s = (p - duty) / (1 - duty);
  return { x: keyCR(G_X[kind], s), h: keyCR(G_H[kind], s), ang: keyframes(L.hind ? HIND_SWING : FRONT_SWING, s) };
}

// ---- the leap ------------------------------------------------------------------
// J runs 0 → 1 over the jump. The body gets a lift (+y = down) and a pitch (deg, + = nose down)
// about a pivot in the middle of the torso; paws are planned in ground coordinates.
const LIFT_K  = [[0, 0], [0.2, 10], [0.32, 3], [0.48, -52], [0.6, -32], [0.68, -9], [0.78, 9], [0.9, 2], [1, 0]];
const PITCH_K = [[0, 0], [0.2, -3], [0.34, -16], [0.48, -2], [0.6, 11], [0.68, 12], [0.8, 1], [0.9, -2], [1, 0]];
const BLEND_K = [[0, 0], [0.12, 1], [0.86, 1], [1, 0]];
const FLIGHT_K = [[0, 0], [0.3, 0], [0.45, 1], [0.66, 1], [0.84, 0], [1, 0]];
const jumpLift = J => keyCR(LIFT_K, J), jumpPitch = J => keyCR(PITCH_K, J);
function jumpFoot(L, J, sp, amp) {
  const dx = L.far ? (L.hind ? 8 : 10) : 0;
  const loc = (xw, j) => toLocal(xw, -7.5, jumpLift(j) * amp, jumpPitch(j) * amp);
  if (L.hind) {
    const TO = 0.34, LD = 0.78;
    const A = j => -67 + dx - sp * j, B = j => 31 + dx - sp * (j - LD);
    const ang = keyCR([[0, 68], [0.22, 76], [0.34, 128], [0.46, 142], [0.64, 96], [0.78, 66], [0.9, 72], [1, 68]], J);
    const p = J <= TO ? loc(A(J), J) : J >= LD ? loc(B(J), J)
      : keyPts([[TO, loc(A(TO), TO)], [0.47, [-155 + dx, -56]], [0.64, [-65 + dx, -50]], [LD, loc(B(LD), LD)]], J);
    return { x: p[0], y: p[1], ang };
  }
  const LO = 0.22, LDf = 0.66;
  const A = j => 62 + dx - sp * j, B = j => 152 + dx - sp * (j - LDf);
  const ang = keyCR([[0, 70], [0.22, 112], [0.36, 168], [0.54, 52], [0.66, 70], [0.8, 106], [1, 80]], J);
  const p = J <= LO ? loc(A(J), J) : J >= LDf ? loc(B(J), J)
    : keyPts([[LO, loc(A(LO), LO)], [0.36, [128 + dx, -82]], [0.54, [188 + dx, -40]], [LDf, loc(B(LDf), LDf)]], J);
  return { x: p[0], y: p[1], ang };
}

// ---- resting poses -------------------------------------------------------------
const STAND_DX = { LH: 6, RH: -6, LF: -12, RF: 2 };   // standing square: hind paws under the hips, fore paws under the shoulders
const L_LIE = 66, P_LIE = -3;          // body lowered onto the ground, chest a touch high (sphinx pose)
const LIE_FEET = (() => {
  const spec = { LH: [-34, 4], RH: [-50, 4], LF: [168, 8], RF: [152, 8] }, o = {};
  for (const id in spec) { const p = toLocal(spec[id][0], -7.5, L_LIE, P_LIE); o[id] = { x: p[0], y: p[1], ang: spec[id][1] - P_LIE }; }
  return o;
})();

//#endregion panther:motion
//#region panther:pose-and-shapes
function poseSide(tl) {
  const W = weights(tl);
  const c = tab(TAB.w, tl), gph = tab(TAB.g, tl), gf = frac(gph), wG = W.wG;
  const U = clamp((tl - EVT.lie0) / (EVT.lie1 - EVT.lie0)), wL = smooth(U);

  let jmp = null;
  for (const j of JUMPS) { const J = (tl - j.t) / j.D; if (J > 0 && J < 1) jmp = { ...j, J }; }
  const J = jmp ? jmp.J : 0, amp = jmp ? jmp.amp : 1;
  const wJ = jmp ? keyframes(BLEND_K, J) : 0, fl = jmp ? keyframes(FLIGHT_K, J) : 0;

  // body-level pose: lift, pitch and spine flex blend between walk, gallop, rest and leap
  const gLift = keyP(G_LIFT, gf), gPitch = keyP(G_PITCH, gf), flex = wG * keyP(G_FLEX, gf);
  let lift = lerp(wG * gLift, L_LIE, wL), pitch = lerp(wG * gPitch, P_LIE, wL);
  if (jmp) { lift = lerp(lift, jumpLift(J) * amp, wJ); pitch = lerp(pitch, jumpPitch(J) * amp, wJ); }

  const bobAmt = W.wWalk * (1 - wL);
  const fBob = -2.6 * Math.cos(TAU * 2 * (c - (DUTY / 2 - 0.25))) * bobAmt;
  const hBob = -2.2 * Math.cos(TAU * 2 * (c - DUTY / 2)) * bobAmt;
  const arch = x => -9 * flex * Math.max(0, 1 - ((x + 10) / 140) ** 2);
  const off = x => lerp(hBob, fBob, clamp((x + 110) / 220)) + arch(x);

  const feet = {}, legs = {};
  for (const L of LEGS) feet[L.id] = footState(L, c);
  const bump = f => f.stance ? Math.sin(Math.PI * f.s) : 0;
  const walkAmt = bobAmt * (1 - wJ);
  const bF = (6.5 * bump(feet.LF) + 2.5 * bump(feet.RF)) * walkAmt;    // shoulder blade rolls up over the planted fore leg
  const bH = (4.0 * bump(feet.LH) + 1.5 * bump(feet.RH)) * walkAmt;    // hip rocks up over the planted hind leg
  const bAmp = 1 + 1.3 * wL;
  const breath = (Math.sin(TAU * 0.3 * tl) * (1 - wG) + Math.sin(TAU * gph) * wG) * bAmp;
  const stretch = 1 + 0.05 * fl - 0.05 * flex;       // the spine lengthens when the cat stretches out

  for (const L of LEGS) {
    const fw = feet[L.id], gp = gallopFoot(L, gph);
    const gF = toLocal(gp.x, -gp.h - 7.5, gLift, gPitch);
    const sx = L.x0 + STAND_DX[L.id];
    let Fx = fw.fx * W.wWalk + gF[0] * wG + sx * W.wStand;
    let Fy = (fw.fy - 7.5) * W.wWalk + gF[1] * wG - 7.5 * W.wStand;
    let ang = fw.ang * W.wWalk + (gp.ang - gPitch) * wG + (L.hind ? 72 : 70) * W.wStand;
    const wl = L.hind ? smooth(clamp((U - 0.25) / 0.75)) : smooth(clamp(U / 0.8));
    const lf = LIE_FEET[L.id];
    Fx = lerp(Fx, lf.x, wl); Fy = lerp(Fy, lf.y, wl); ang = lerp(ang, lf.ang, wl);
    if (jmp) { const jf = jumpFoot(L, J, jmp.sp, amp); Fx = lerp(Fx, jf.x, wJ); Fy = lerp(Fy, jf.y, wJ); ang = lerp(ang, jf.ang, wJ); }

    const F = [Fx, Fy], ext = clamp(Fx - L.x0, -75, 75), Fw = toWorld(Fx, Fy + 7.5, lift, pitch);
    if (L.hind) {
      const d = dir(ang), Hk = [F[0] - d[0] * METATARSUS, F[1] - d[1] * METATARSUS];
      const hx = HIP[0] + 0.08 * ext;                                      // pelvis rocks a little toward the paw
      const HJ = [hx * stretch, HIP[1] + off(hx) - 0.5 * bH];
      const K = ik(HJ[0], HJ[1], Hk[0], Hk[1], THIGH, SHIN, -1);
      const td = dir(ang - 66);
      legs[L.id] = { hind: true, HJ, K, Hk, F, Fw, toe: [F[0] + td[0] * 9, F[1] + td[1] * 9] };
    } else {
      const d = dir(ang), Wr = [F[0] - d[0] * 20, F[1] - d[1] * 20];
      const cx = 86 - 0.05 * ext, jx = 100 + 0.12 * ext;
      const SC = [cx * stretch, -150 + off(cx) - bF * (L.far ? 0.3 : 1)];  // top of the shoulder blade
      const SJ = [jx * stretch, -110 + off(jx)];                          // shoulder joint
      const E = ik(SJ[0], SJ[1], Wr[0], Wr[1], 48, 47, 1);
      const td = dir(ang - 72);
      legs[L.id] = { hind: false, SC, SJ, E, Wr, F, Fw, toe: [F[0] + td[0] * 9, F[1] + td[1] * 9] };
    }
  }

  const P = (x, y) => [x * stretch, y + off(x)];
  // The rump stops just behind the seat bone; below the hip the haunch is drawn by the thigh itself
  // (drawLeg), so it swings with the leg instead of hanging behind it.
  const hull = [
    P(-124, -141), P(-114, -157 - bH), P(-86, -163 - bH * 0.6), P(-42, -154), P(0, -151), P(42, -157),
    P(82, -168 - bF), P(110, -165), P(132, -158), P(148, -144),
    P(152, -118), P(140, -98), P(120, -80 - breath * 0.8), P(88, -70 - breath * 1.3),
    P(50, -74 - breath * 1.3), P(14, lerp(-86, -74, wL) - breath * 0.6), P(-20, lerp(-97, -76, wL)),
    P(-54, lerp(-104, -78, wL)), P(-86, lerp(-114, -84, wL)), P(-115, lerp(-128, -98, wL)),
  ];
  const head = {
    ear: (-16 * wG + (frac(tl / 5.9) > 0.94 ? Math.sin((frac(tl / 5.9) - 0.94) / 0.06 * TAU) * 9 : 0) * wL + 2 * Math.sin(TAU * 0.7 * tl) * (1 - wG)) * DEG,
    x: 136 * stretch,
    // head carried low, about level with the shoulder blades, so the weight reads as hanging off the shoulders
    y: -144 + 7 * (1 - wL) + off(136) + 1.4 * Math.cos(TAU * 2 * (c - DUTY / 2 + 0.1)) * bobAmt - 24 * wL,
    a: (7 + 2.5 * bobAmt + 1.6 * Math.sin(TAU * 2 * c) * walkAmt - pitch * 0.55 + wL * (2.5 * Math.sin(TAU * 0.11 * tl) - 3)) * DEG,
  };
  // tail: hangs low with the tip curling up when walking, streams out behind when running, lies along the ground at rest
  const tail = [];
  let tx = -120, ty = -146 + off(-120), N = 17;
  tail.push([tx, ty]);
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    const aW = (u < 0.45 ? lerp(158, 112, u / 0.45) : lerp(112, 220, Math.pow((u - 0.45) / 0.55, 1.4)))
             + Math.sin(TAU * (c / 2) - u * 2.6) * (3 + 13 * u) + Math.sin(TAU * c - u * 2) * 3 * u;
    const aR = lerp(172, 196, u) + Math.sin(TAU * gph - u * 3) * (6 + 10 * u);
    const aL = lerp(104, 176, smooth(clamp(u * 1.5))) + Math.sin(TAU * 0.35 * tl - u * 3) * (2 + 9 * u);
    let a = lerp(lerp(aW, aR, wG), aL, wL);
    a += fl * 30 * (1 - 0.5 * u) - pitch * 0.6;
    const dd = dir(a); tx += dd[0] * 11; ty = Math.min(ty + dd[1] * 11, -3 - lift);
    tail.push([tx, ty]);
  }
  const wD = drinkAmt(tl);
  if (wD > 0) {
    const sip = Math.sin(TAU * 2.4 * tl) * smooth(clamp((tl - DRINK0 - DLAG - 0.9) / 0.5));
    head.x = lerp(head.x, 150 + 1.5 * sip, wD);
    head.y = lerp(head.y, -90 + 3.5 * sip, wD);
    head.a = lerp(head.a, (58 + 2.5 * sip) * DEG, wD);
    head.ear = lerp(head.ear, (-4 + 3 * Math.sin(TAU * 0.4 * tl)) * DEG, wD);
  }
  const still = W.wStand * (1 - wL);
  if (still > 0.01) { const up = still * (1 - wD); head.y -= 9 * up; head.a -= 6 * DEG * up; }
  if (TALKW > 0.01) { const s1 = Math.sin(TAU * 2.3 * tl); head.a += TALKW * (5 * s1 - 4) * DEG; head.y += TALKW * 3 * Math.sin(TAU * 2.3 * tl + 1); head.ear += TALKW * 5 * DEG * Math.sin(TAU * 1.4 * tl); }
  const drowsy = smooth(clamp((tl - EVT.lie1) / 9));
  const eye = (frac(tl / 4.7) > 0.968 ? 0.12 : 1) * (1 - 0.6 * drowsy);
  return { legs, hull, head, tail, off, bF, bH, feet, lift, pitch, eye, wG, wL, wD, still };
}

// ---- panther drawing (into any context whose transform maps body units → screen) ----
const hh = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };

function rn(ax, ay, bx, by) {                    // unit normal of a segment, pointing toward the rear (−x)
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  let nx = dy / L, ny = -dx / L;
  if (nx > 0) { nx = -nx; ny = -ny; }
  return [nx, ny];
}
function blob(c, ax, ay, bx, by, t, rx, ry, shift) {   // a muscle: ellipse laid along a bone
  const n = rn(ax, ay, bx, by), dx = bx - ax, dy = by - ay;
  c.beginPath(); c.ellipse(ax + dx * t + n[0] * shift, ay + dy * t + n[1] * shift, rx, ry, Math.atan2(dy, dx), 0, TAU); c.fill();
}
function dot(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }

// points along a closed/open Catmull-Rom spline with outward normals (for fur on the edge)
function sampleSpline(pts, closed, per) {
  const n = pts.length, out = [], segs = closed ? n : n - 1;
  const Pp = i => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  for (let i = 0; i < segs; i++) {
    const p0 = Pp(i - 1), p1 = Pp(i), p2 = Pp(i + 1), p3 = Pp(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    for (let k = 0; k < per; k++) {
      const u = k / per, v = 1 - u;
      const x = v * v * v * p1[0] + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * p2[0];
      const y = v * v * v * p1[1] + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * p2[1];
      const dx = 3 * v * v * (c1x - p1[0]) + 6 * v * u * (c2x - c1x) + 3 * u * u * (p2[0] - c2x);
      const dy = 3 * v * v * (c1y - p1[1]) + 6 * v * u * (c2y - c1y) + 3 * u * u * (p2[1] - c2y);
      const L = Math.hypot(dx, dy) || 1;
      out.push({ x, y, nx: dy / L, ny: -dx / L });
    }
  }
  return out;
}
function furEdge(c, pts, closed, per, seed, len) {   // short hairs along an outline, leaning toward the tail
  const s = sampleSpline(pts, closed, per);
  for (let i = 0; i < s.length; i++) {
    const p = s[i];
    if (hh(i, seed) < 0.12) continue;
    const L = len * (0.45 + hh(seed, i + 31));
    let dx = p.nx * 0.7 - 0.7, dy = p.ny * 0.7 + 0.2; const m = Math.hypot(dx, dy); dx /= m; dy /= m;
    const tx = -p.ny * 0.6, ty = p.nx * 0.6;
    c.beginPath(); c.moveTo(p.x - tx, p.y - ty); c.lineTo(p.x + tx, p.y + ty); c.lineTo(p.x + dx * L, p.y + dy * L); c.fill();
  }
}
function furSeg(c, ax, ay, ar, bx, by, br, seed) {   // the same, along both sides of a limb segment
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, tx = dx / L, ty = dy / L, nx = ty, ny = -tx;
  const n = Math.max(2, Math.round(L / 4));
  for (let i = 0; i <= n; i++) for (const sd of [-1, 1]) {
    if (hh(i + seed, sd * 7.7) < 0.2) continue;
    const u = i / n, r = lerp(ar, br, u), len = 1.2 + 2.4 * hh(sd + seed, i * 3.1);
    const x0 = ax + dx * u + nx * sd * r * 0.95, y0 = ay + dy * u + ny * sd * r * 0.95;
    let sx = nx * sd * 0.8 + tx * 0.5, sy = ny * sd * 0.8 + ty * 0.5; const m = Math.hypot(sx, sy); sx /= m; sy /= m;
    c.beginPath(); c.moveTo(x0 - tx * 0.6, y0 - ty * 0.6); c.lineTo(x0 + tx * 0.6, y0 + ty * 0.6); c.lineTo(x0 + sx * len, y0 + sy * len); c.fill();
  }
}

// ---- head (local coords: origin at the back of the skull, facing right) ----
const HS = 1.16;   // head scale
const HEAD_PTS = [[-4, -6], [2, -22], [14, -34], [30, -40], [46, -38], [56, -33], [64, -27], [72, -22], [80, -17], [86, -12], [89.5, -6],
                  [88.5, 0], [85.5, 5], [82, 10], [77, 14], [71, 18], [64, 21], [52, 26], [38, 30], [24, 32], [10, 29], [-2, 19]];
function earPath(c, ear, dx, dy, k) {
  c.save(); c.translate(19 + dx, -30 + dy); c.rotate(ear); c.translate(-19, 30); c.scale(k, k);
  c.beginPath(); c.moveTo(6, -24); c.quadraticCurveTo(6, -44, 17, -48); c.quadraticCurveTo(29, -46, 33, -30); c.closePath(); c.fill();
  c.restore();
}
function drawHead(c, H) {
  if (H.polys) { for (const pg of H.polys) fillPoly(c, pg); return; }
  c.save(); c.translate(H.x, H.y); c.rotate(H.a); c.scale(HS, HS);
  earPath(c, (H.ear || 0) * 0.8, 9, -9, 0.92);                 // far ear, partly hidden
  c.beginPath(); splinePath(c, HEAD_PTS); c.fill();
  earPath(c, H.ear || 0, 0, -6, 1);                             // near ear
  furEdge(c, HEAD_PTS, true, 4, 9, 1.8);
  c.restore();
}

// ---- limbs: bones plus muscle, so the outline swells and tapers like a real cat ----
function drawPaw(c, F, toe) {
  const d = Math.hypot(toe[0] - F[0], toe[1] - F[1]) || 1, ux = (toe[0] - F[0]) / d, uy = (toe[1] - F[1]) / d;
  capsule(c, F[0], F[1], 9, toe[0], toe[1], 7.6);
  dot(c, toe[0] + ux * 3, toe[1] + uy * 3, 4.4);
}
// The haunch: a muscle mass hung between the pelvis (fixed to the body) and the knee (moves with the leg).
// Swing the leg forward and it tucks up under the croup; push it back and the hamstrings follow it.
function thighOutline(L, far) {
  if (L.th) return L.th;
  const k = far ? 0.82 : 1, H = [L.HJ[0], L.HJ[1] + (far ? 8 : 0)], K = L.K;
  const dx = K[0] - H[0], dy = K[1] - H[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const fx = uy, fy = -ux;                                      // normal toward the front of the thigh
  const at = (p, a, b) => [p[0] + ux * a + fx * b, p[1] + uy * a + fy * b];
  const seat = [H[0] - 29 * k, H[1] + 5 * k];                  // seat bone: back corner of the haunch
  const kneePit = at(K, -3, -16 * k);
  const ham = 0.45, bulge = far ? 5 : 11;                                             // where along the back of the thigh the hamstrings bulge most
  return [
    [H[0] - 21 * k, H[1] - 25 * k],                             // top of the haunch, under the croup
    at(H, 20, 25 * k),                                          // quadriceps
    at(K, -6, 13 * k),                                          // front of the stifle
    at(K, 8, 1),                                                // knee cap
    kneePit,
    [lerp(seat[0], kneePit[0], ham) - fx * bulge, lerp(seat[1], kneePit[1], ham) - fy * bulge],     // hamstrings
    seat,
  ];
}
function drawLeg(c, L, far = false) {
  if (L.hind) {
    const th = thighOutline(L, far);
    c.beginPath(); splinePath(c, th); c.fill();
    if (L.thr) capsule(c, L.HJ[0], L.HJ[1], L.thr, L.K[0], L.K[1], L.thr * 0.75);
    capsule(c, L.K[0], L.K[1], 15 * LEGK, L.Hk[0], L.Hk[1], 8.4);
    blob(c, L.K[0], L.K[1], L.Hk[0], L.Hk[1], 0.32, 24, 11.5, 6);                    // calf
    capsule(c, L.Hk[0], L.Hk[1], 8.4, L.F[0], L.F[1], 6.8);
    const n = rn(L.K[0], L.K[1], L.Hk[0], L.Hk[1]); dot(c, L.Hk[0] + n[0] * 3, L.Hk[1] + n[1] * 3, 7.6);   // hock
    drawPaw(c, L.F, L.toe);
    furEdge(c, th, true, 5, far ? 17 : 11, 2.2);
    furSeg(c, L.K[0], L.K[1], 15, L.Hk[0], L.Hk[1], 8.4, 12);
    furSeg(c, L.Hk[0], L.Hk[1], 8.4, L.F[0], L.F[1], 6.8, 13);
  } else {
    if (!far || RS > 0.55) { capsule(c, L.SC[0], L.SC[1], 22 * LEGK, L.SJ[0], L.SJ[1], 24 * LEGK); blob(c, L.SC[0], L.SC[1], L.SJ[0], L.SJ[1], 0.5, 30, 22 * LEGK, 2); }   // shoulder blade
    capsule(c, L.SJ[0], L.SJ[1], 22 * LEGK, L.E[0], L.E[1], 14.5 * LEGK);
    const n1 = rn(L.SJ[0], L.SJ[1], L.E[0], L.E[1]); dot(c, L.E[0] + n1[0] * 3, L.E[1] + n1[1] * 3, 13);       // elbow
    capsule(c, L.E[0], L.E[1], 14, L.Wr[0], L.Wr[1], 9.4);
    blob(c, L.E[0], L.E[1], L.Wr[0], L.Wr[1], 0.28, 25, 12, 2);                                                 // forearm
    capsule(c, L.Wr[0], L.Wr[1], 9.4, L.F[0], L.F[1], 8.6);
    const n2 = rn(L.E[0], L.E[1], L.Wr[0], L.Wr[1]); dot(c, L.Wr[0] + n2[0] * 3, L.Wr[1] + n2[1] * 3, 8.4);    // wrist
    drawPaw(c, L.F, L.toe);
    furSeg(c, L.SJ[0], L.SJ[1], 22, L.E[0], L.E[1], 14.5, 21);
    furSeg(c, L.E[0], L.E[1], 14, L.Wr[0], L.Wr[1], 9.4, 22);
    furSeg(c, L.Wr[0], L.Wr[1], 9.4, L.F[0], L.F[1], 8.6, 23);
  }
}
function drawTail(c, tail) {
  const n = tail.length - 1;
  for (let i = 0; i < n; i++) {
    const r0 = lerp(10.5, 6.6, Math.pow(i / n, 0.8)), r1 = lerp(10.5, 6.6, Math.pow((i + 1) / n, 0.8));
    capsule(c, tail[i][0], tail[i][1], r0, tail[i + 1][0], tail[i + 1][1], r1);
    furSeg(c, tail[i][0], tail[i][1], r0, tail[i + 1][0], tail[i + 1][1], r1, 40 + i);
  }
}
function drawBody(c, P) {
  drawTail(c, P.tail);
  if (P.tube) {
    for (const pg of P.tube) fillPoly(c, pg);
    for (const q of P.necks) { c.beginPath(); c.arc(q[0], q[1], 33, 0, TAU); c.fill(); }      // neck
  } else {
    c.beginPath(); splinePath(c, P.hull); c.fill();
    c.beginPath(); c.ellipse(P.head.x - 16, P.head.y + 12, 34, 32, 0.3, 0, TAU); c.fill();   // neck
    furEdge(c, P.hull, true, 6, 3, 2.6);
  }
  drawLeg(c, P.legs.LH);
  drawLeg(c, P.legs.LF);
  drawHead(c, P.head);
}

// Faint "ghost rosettes" — black panthers are spotted leopards; in moonlight the pattern just shows.
const ROSETTES = (() => {
  const r = rng(7), out = [];
  for (let x = -122; x < 128; x += 19) for (let y = -156; y < -88; y += 17) {
    const jx = x + (r() - 0.5) * 12, jy = y + (r() - 0.5) * 10;
    out.push({ x: jx, y: jy, r: 3.5 + r() * 2.8, rot: r() * TAU, gaps: 3 + Math.floor(r() * 3) });
  }
  return out;
})();

//#endregion panther:pose-and-shapes
//#region panther:compositing
// ---- panther compositing -----------------------------------------------------
const RIM = 'rgb(176,200,255)';
let JL = 0, JP = 0;      // current jump lift and pitch, applied to everything drawn as "the panther"
let CAMX = 0, CAMY = 0;     // how far the camera has risen over the panther (screen px), 0 for the side view
function setGroundTransform(c) { c.setTransform(sc * AK, 0, 0, sc * AK, ox + CAMX + AX * sc, oy + CAMY + AY * sc); }
function setBodyTransform(c) {
  c.setTransform(sc * AK, 0, 0, sc * AK, ox + CAMX + AX * sc, oy + CAMY + AY * sc);
  c.translate(0, JL - 120); c.rotate(JP * RC * DEG); c.translate(0, 120);   // body pitch only reads as a tilt from the side
}
const STRANDS = (() => {
  const r = rng(11), a = [], b = [];
  for (let i = 0; i < 460; i++) {
    const x = -135 + r() * 285, y = -166 + r() * 100, ang = (176 + (r() - 0.5) * 26 + (y + 120) * 0.1) * DEG, len = 2.5 + r() * 3.5;
    (r() < 0.5 ? a : b).push([x, y, Math.cos(ang) * len, Math.sin(ang) * len]);
  }
  return { a, b };
})();
function strandsAlong(c, pts, halfw, n, seed) {   // hairs running down a limb
  c.beginPath();
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = dy / L, ny = -dx / L;
    for (let i = 0; i < n; i++) {
      const u = hh(i + seed, s), side = (hh(s + seed, i) - 0.5) * 2 * halfw[s];
      const x = ax + dx * u + nx * side, y = ay + dy * u + ny * side;
      c.moveTo(x, y); c.lineTo(x + dx / L * 6, y + dy / L * 6);
    }
  }
  c.stroke();
}

// dust kicked up by galloping paws and by landings; it stays put in the world as the cat moves on
function drawDust() {
  for (const e of EVENTS) {
    if (e.px === undefined) continue;
    const a = STL - e.t; if (a < 0 || a > 1.1) continue;
    const x0 = e.px - (SD - tab(TAB.d, e.t)), k = e.k === 'land' ? 1.5 : 1, z0 = e.near ? 22 : -22;   // where the paw struck, in body units
    for (let i = 0; i < 5; i++) {
      const r1 = hh(e.t * 17.3, i), r2 = hh(i, e.t * 5.1);
      const rise = (6 + 26 * r1) * (1 - Math.exp(-a * 3)), drift = (r2 - 0.4) * 30 * a, zs = (hh(i + 3, e.t) - 0.5) * 30 * a;
      const ck = camK(x0 + drift, -rise, z0 + zs); if (ck > 1.6) continue;
      const q = pr(x0 + drift, -rise - 2, z0 + zs), x = ox + CAMX + q[0] * sc, y = oy + CAMY + q[1] * sc;
      const rad = (3 + 10 * a + 3 * r2) * sc * ck * 1.4, al = 0.2 * k * Math.pow(1 - a / 1.1, 2);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, col(PAL.c.dust, al)); g.addColorStop(1, col(PAL.c.dust, 0));
      ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }
}

//#endregion panther:compositing
//#region panther:projection
// ---- the turn: a real 3D rotation of the rig ------------------------------------
// The panther turns to its left (away from the camera) while the camera swings behind it and rises,
// ending in a game-style chase view that looks past the panther to where it is going. Rig points are
// x forward, y down, z toward the camera; the side view is the plane z = 0.
// every 2 s the camera swings the other way: side → chase → side → chase …  (0 = side view, 1 = chase view)
const FLIP = 2, SWING = 1.2;
const TURN = t => 1;   // the camera stays over the shoulder the whole time
const PIV = -110;                       // the body turns about this height
let CH_TH = 24 * DEG, CH_D = 900;     // chase camera: how far it looks down, and how far behind it sits (body units)
let RU = 0, RC = 1, RS = 0, CT = 1, ST = 0, LEGK = 1;   // turn amount, cos/sin of the turn, cos/sin of the camera tilt, upper-leg thickness
function setTurn(u) {
  RU = 1; const a = CAMYAW * DEG, th = CAMTILT * DEG;
  RC = Math.cos(a); RS = Math.sin(a); CT = Math.cos(th); ST = Math.sin(th); LEGK = 1 - 0.3 * RS * RS;
}
function camK(x, y, z) { return camK0(x * FA, y, z * FA); }   // in the frame of the animal being drawn
function camK0(x, y, z) {               // perspective: nearer is larger, further is smaller (none in the side view)
  const b = x * RS - z * RC, depth = b * CT - (PIV - y) * ST;
  return CH_D / Math.max(CH_D * 0.2, CH_D + depth * RU);
}
function pr(x, y, z) {                  // rig point → screen-plane point (body units)
  x *= FA; z *= FA;                     // an animal facing the camera is turned half way round
  const a = x * RC + z * RS, b = x * RS - z * RC, h = PIV - y, k = camK0(x, y, z);
  return [a * k, PIV - (b * ST + h * CT) * k];
}
function facing(nx, ny, nz) { nx *= FA; nz *= FA; return (-nx * RS + nz * RC) * CT - ny * ST; }   // >0 when a surface faces the camera
function rigAffine(z, rx = 0, ry = -120) {   // the plane at depth z, scaled for perspective around a reference point
  const zf = z * FA, A = [RC * FA, -RS * ST * FA, 0, CT, zf * RS, PIV * (1 - CT) + zf * RC * ST], k = camK(rx, ry, z);
  return mulAff([k, 0, 0, k, 0, PIV * (1 - k)], A);
}
function mulAff(A, B) {
  return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
          A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
}
function headAffine(H, lz) { const ca = Math.cos(H.a), sa = Math.sin(H.a), r = headPt(H, 40, 0, lz); return mulAff(rigAffine(HS * lz, r[0], r[1]), [HS * ca, HS * sa, -HS * sa, HS * ca, H.x, H.y]); }
function headPt(H, lx, ly, lz) {        // head-local point → rig point
  const ca = Math.cos(H.a), sa = Math.sin(H.a);
  return [H.x + HS * (lx * ca - ly * sa), H.y + HS * (lx * sa + ly * ca), HS * lz];
}
const lin = (t, x) => { if (x <= t[0][0]) return t[0][1]; for (let i = 0; i < t.length - 1; i++) if (x <= t[i + 1][0]) return lerp(t[i][1], t[i + 1][1], (x - t[i][0]) / (t[i + 1][0] - t[i][0])); return t[t.length - 1][1]; };
function crossY(poly, x) {              // top and bottom of an outline at this x
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (a[0] === b[0] || (a[0] - x) * (b[0] - x) > 0) continue;
    const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
    lo = Math.min(lo, y); hi = Math.max(hi, y);
  }
  return [lo, hi];
}
function hull2(pts) {                   // convex hull (monotone chain)
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr2 = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr2(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr2(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function fillPoly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); }
// a solid from a side outline: oval cross-sections along its length, their widths from a table
function tube(outline, wTbl, n, M, map, capK = 1.25) {
  const poly = sampleSpline(outline, true, 6).map(p => [p.x, p.y]);
  let x0 = Infinity, x1 = -Infinity; for (const p of poly) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
  const rings = [];
  for (let k = 0; k < n; k++) {
    const x = (x0 + x1) / 2 - (x1 - x0) / 2 * Math.cos(Math.PI * (k + 0.5) / n);
    const [lo, hi] = crossY(poly, x); if (!isFinite(lo)) continue;
    const yc = (lo + hi) / 2, hv = (hi - lo) / 2, w = Math.min(lin(wTbl, x), hv * capK + 4), ring = [];
    for (let a = 0; a < M; a++) { const t = TAU * a / M; ring.push(map(x, yc + hv * Math.cos(t), w * Math.sin(t))); }
    rings.push(ring);
  }
  const polys = [];
  for (let i = 0; i < rings.length - 1; i++) polys.push(hull2(rings[i].concat(rings[i + 1])));
  return { polys, poly };
}
const W_BODY = [[-128, 14], [-112, 40], [-92, 47], [-60, 42], [-20, 37], [20, 38], [60, 44], [96, 51], [126, 45], [150, 24]];   // half-width seen from above
const W_HEAD = [[-4, 12], [4, 30], [16, 40], [32, 43], [46, 40], [58, 33], [68, 27], [78, 22], [86, 16], [90, 9]];
const LAT = { hind: { HJ: 26, K: 38, Hk: 32, F: 27, toe: 27 }, fore: { SC: 14, SJ: 30, E: 36, Wr: 29, F: 25, toe: 25 } };   // how far out from the spine each joint sits
const EAR_RIM = (() => {               // the ear's outline, sampled from the profile ear's curves
  const q = (a, b, c, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]];
  const out = [];
  for (let i = 0; i <= 5; i++) out.push(q([6, -24], [6, -44], [17, -48], i / 5));
  for (let i = 1; i <= 5; i++) out.push(q([17, -48], [29, -46], [33, -30], i / 5));
  return out;
})();
function project3D(P, u, tl) {
  if (u <= 0.0001) return P;
  // body
  const body = tube(P.hull, W_BODY, 22, 14, (x, y, z) => pr(x, y, z), 1.75);
  const spine = [];
  for (let i = 0; i <= 8; i++) { const x = lerp(-110, 112, i / 8), [lo] = crossY(body.poly, x); if (isFinite(lo)) spine.push(pr(x, lo + 3, 0)); }
  // legs: every joint gets its distance out from the spine; near legs on +z, far legs on −z
  const legs = {};
  for (const D of LEGS) {
    const L = P.legs[D.id], s = D.far ? -1 : 1, lat = L.hind ? LAT.hind : LAT.fore, out = { ...L, fz: s * lat.F };
    if (L.hind) { out.th = thighOutline(L, D.far).map(p => pr(p[0], p[1], s * 30)); out.thr = 20 * Math.abs(RS); }
    for (const k in lat) out[k] = pr(L[k][0], L[k][1], s * lat[k]);
    legs[D.id] = out;
  }
  // tail: swings side to side with the walk (only visible once the camera is up)
  const c = tab(TAB.w, tl), N = P.tail.length - 1;
  const tail = P.tail.map(([x, y], i) => pr(x, y, 26 * Math.pow(i / N, 1.2) * lerp(Math.sin(TAU * c / 2 - i * 0.38), Math.sin(1.6 * tl - i * 0.38), Math.max(P.wD || 0, P.still || 0))));
  // head: a solid from the profile outline, plus two ears
  const H = P.head, hm = (x, y, z) => { const r = headPt(H, x, y, z); return pr(r[0], r[1], r[2]); };
  const headT = tube(HEAD_PTS, W_HEAD, 14, 12, hm, 1.9);
  const polys = headT.polys.slice();
  for (const s of [-1, 1]) {
    const k = s > 0 ? 1 : 0.92, dx = s > 0 ? 0 : 9, dy = s > 0 ? -6 : -9, ea = (H.ear || 0) * (s > 0 ? 1 : 0.8), ce = Math.cos(ea), se = Math.sin(ea);
    const place = (x, y) => { const px = x - 19, py = y + 30; return [19 + dx + k * (px * ce - py * se), -30 + dy + k * (px * se + py * ce)]; };
    const pts = EAR_RIM.map(([x, y]) => { const p = place(x, y); return hm(p[0], p[1], s * 25); });
    for (const zz of [15, 35]) { const p = place(19, -27); pts.push(hm(p[0], p[1], s * zz)); }
    polys.push(hull2(pts));
  }
  const head = { ...H, polys };
  const n0 = [lerp(H.x - 16, 124, P.wD), lerp(H.y + 12, -130, P.wD)], hb = headPt(H, 4, -2, 0), n1 = [lerp(H.x - 16, hb[0], P.wD), lerp(H.y + 12, hb[1], P.wD)];
  const necks = [0, 0.34, 0.67, 1].map(k => pr(lerp(n0[0], n1[0], k), lerp(n0[1], n1[1], k), 0)), neck = necks[3];
  return { ...P, legs, tail, head, tube: body.polys, spine, neck, necks };
}
function pose(tl, tu = tl) { const u = TURN(tu); setTurn(u); return project3D(poseSide(tl), u, tl); }

//#endregion panther:projection
//#region panther:coats
const COATS = {
  panther: { fur: ['#191d27', '#0c0e13', '#040405'], far: '#05060a', rim: RIM, lt: '150,172,225' },
  tiger:   { fur: ['#f2a456', '#da7a30', '#8a4418'], far: '#6a3210', rim: 'rgb(255,228,184)', lt: '255,236,200', belly: 'rgba(252,242,226,0.8)', muzzle: 'rgba(252,244,230,0.85)', mark: '#1d1208' },
  lioness: { fur: ['#e8c88a', '#d0a868', '#8c6a3c'], far: '#6e5230', rim: 'rgb(255,240,206)', lt: '255,245,222', belly: 'rgba(246,234,208,0.6)', muzzle: 'rgba(248,238,218,0.7)' },
  cheetah: { fur: ['#f0d08a', '#dcb466', '#9a7a40'], far: '#7a5c30', rim: 'rgb(255,240,202)', lt: '255,245,222', belly: 'rgba(250,244,228,0.75)', muzzle: 'rgba(250,244,230,0.7)', mark: '#1e150b' },
  // new panthers (bengalTiger keeps the orange tiger even where older scenes repaint COATS.tiger)
  bengalTiger: { fur: ['#f2a456', '#da7a30', '#8a4418'], far: '#6a3210', rim: 'rgb(255,228,184)', lt: '255,236,200', belly: 'rgba(252,242,226,0.8)', muzzle: 'rgba(252,244,230,0.85)', mark: '#1d1208', eye: ['#fff0a0', '#e0a830', '#6a4208'] },
  goldenLioness: { fur: ['#e8c88a', '#d0a868', '#8c6a3c'], far: '#6e5230', rim: 'rgb(255,240,206)', lt: '255,245,222', belly: 'rgba(246,234,208,0.6)', muzzle: 'rgba(248,238,218,0.7)', eye: ['#fff0b0', '#d8a838', '#6a4a10'] },
  snowLeopard: { fur: ['#e8e6e0', '#c9c6be', '#8e8a82'], far: '#6e6a64', rim: 'rgb(235,245,255)', lt: '245,250,255', belly: 'rgba(252,252,250,0.85)', muzzle: 'rgba(252,252,250,0.85)', mark: '#2e2c2a', rosetteFill: 'rgba(150,146,138,0.55)', eye: ['#e8f4ff', '#9cc4d8', '#3e5a66'] },
  whiteTiger:  { fur: ['#f6f2ea', '#e2dcd0', '#a8a094'], far: '#7e766c', rim: 'rgb(230,240,255)', lt: '255,255,255', belly: 'rgba(255,255,255,0.85)', muzzle: 'rgba(255,255,255,0.9)', mark: '#24201e', eye: ['#e6f6ff', '#7ab8e0', '#2a4a66'] },
  goldenPanther: { fur: ['#5a4428', '#3a2a18', '#160e08'], far: '#120a06', rim: 'rgb(255,214,140)', lt: '255,214,150', ghost: '200,150,70', eye: ['#fff2a0', '#f0b030', '#7a4a08'] },
};
// how the cats are painted; episodes set CFG.pantherStyle, the showcase sets window.PANTHER_STYLE
const PSTYLE = Object.assign({ outline: 1.15, rim2: 0.45, gloss: 1, bounce: 0.16, ghost: 1, eyeGlow: 0.35, face: 'anime', blush: 0.8, fang: 1 },
  (typeof CFG !== 'undefined' && CFG.pantherStyle) || {}, (typeof window !== 'undefined' && window.PANTHER_STYLE) || {});
const COOL_RIM = 'rgb(140,190,255)';
//#endregion panther:coats
//#region panther:drawing
// markings sit on the 3D body surface, so they turn with it and only show on the side facing the camera
const hexA = (h, a) => 'rgba(' + parseInt(h.slice(1, 3), 16) + ',' + parseInt(h.slice(3, 5), 16) + ',' + parseInt(h.slice(5, 7), 16) + ',' + a + ')';
let P_SCR = null;                                                  // a scratch canvas for the outline
function pantherScratch() { if (!P_SCR || P_SCR[0].width !== W || P_SCR[0].height !== H) { const c = document.createElement('canvas'); c.width = W; c.height = H; P_SCR = [c, c.getContext('2d')]; } return P_SCR; }
const MARK_SETS = {
  stripes: (() => { const r = rng(5), a = []; for (let x = -116; x < 130; x += 15 + r() * 7) a.push({ x, slant: (r() - 0.5) * 12, reach: 0.36 + r() * 0.24, w: 4 + r() * 3.5 }); return a; })(),
  spots: (() => { const r = rng(9), a = []; for (let i = 0; i < 170; i++) a.push({ x: -125 + r() * 272, a: (0.3 + r() * 1.4) * Math.PI, r: 2.3 + r() * 2.1 }); return a; })(),
};
function drawMarks(c, P, kind) {
  const poly = sampleSpline(P.hull, true, 4).map(p => [p.x, p.y]);
  const at = (x, ang) => {        // a point on the body's surface: ang = π on the spine, ±π/2 on the flanks, 0 under the belly
    const [lo, hi] = crossY(poly, x); if (!isFinite(lo)) return null;
    const yc = (lo + hi) / 2, hv = (hi - lo) / 2, w = Math.min(lin(W_BODY, x), hv * 1.75 + 4);
    return { p: pr(x, yc + hv * Math.cos(ang), w * Math.sin(ang)), f: facing(0, Math.cos(ang), Math.sin(ang)) };
  };
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (COAT.belly) {                // pale underside along both lower flanks
    c.strokeStyle = COAT.belly;
    for (const [lw, al] of [[34, 0.18], [22, 0.22], [12, 0.25]]) for (const sd of [1, -1]) {   // soft layers, so it shades into the coat
      c.lineWidth = lw; let prev = null;
      for (let x = -84; x <= 128; x += 12) {
        const s = at(x, sd * 0.12 * Math.PI);
        if (s && prev && s.f > 0.02) { c.globalAlpha = al * clamp(s.f * 3) * clamp(Math.min(x + 84, 128 - x) / 40); c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(s.p[0], s.p[1]); c.stroke(); }
        prev = s ? s.p : null;
      }
    }
  }
  if (kind === 'stripes') {
    c.strokeStyle = COAT.mark;
    for (const st of MARK_SETS.stripes) for (const sd of [1, -1]) {
      let prev = null;
      for (let k = 0; k <= 8; k++) {
        const u = k / 8, ang = Math.PI * (1 - sd * st.reach * u), s = at(st.x + st.slant * u, ang);
        if (s && prev && s.f > 0.02) { c.globalAlpha = clamp(s.f * 4); c.lineWidth = st.w * (1.1 - 0.6 * u); c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(s.p[0], s.p[1]); c.stroke(); }
        prev = s ? s.p : null;
      }
    }
  } else if (kind === 'spots') {
    c.fillStyle = COAT.mark;
    for (const sp of MARK_SETS.spots) {
      const s = at(sp.x, sp.a); if (!s || s.f < 0.05) continue;
      c.globalAlpha = clamp(s.f * 3); c.beginPath(); c.arc(s.p[0], s.p[1], sp.r, 0, TAU); c.fill();
    }
  } else if (kind === 'rosettes') {
    // real rosettes: a tinted centre ringed by four or five broken, uneven blots
    const fill = COAT.rosetteFill || 'rgba(150,92,30,0.45)';
    for (const sp of MARK_SETS.spots) {
      const s = at(sp.x, sp.a); if (!s || s.f < 0.05) continue;
      const r = sp.r * 1.6, a0 = sp.x * 0.7, n = 4 + ((sp.x * 7) & 1), al = clamp(s.f * 3);
      c.globalAlpha = al; c.fillStyle = fill; c.beginPath(); c.ellipse(s.p[0], s.p[1], r * 0.95, r * 0.8, a0, 0, TAU); c.fill();
      c.strokeStyle = COAT.mark;
      for (let k = 0; k < n; k++) {
        const a = a0 + k * TAU / n, len = TAU / n * (0.48 + 0.3 * Math.abs(Math.sin(sp.x * 3.1 + k * 1.7)));
        c.lineWidth = 1.6 + 1.3 * Math.abs(Math.sin(sp.x + k * 2.3)); c.beginPath(); c.arc(s.p[0], s.p[1], r * (0.95 + 0.12 * Math.sin(k * 2.1 + sp.x)), a, a + len); c.stroke();
      }
    }
  }
  c.globalAlpha = 1;
}

function drawPanther(t, ph = 0) {
  const P = pose(Math.max(0, STL - ph), STL);
  JL = P.lift; JP = P.pitch;

  // soft ground shadow + contact shadows under planted paws (these stay on the ground)
  setGroundTransform(ctx);
  const high = clamp(1 + P.lift / 90);              // the shadow fades and shrinks as the cat rises
  const groundEll = (x, y, z, rx, rz, thick) => {   // an ellipse lying on the ground, as the turned camera sees it
    const C = pr(x, y, z), A = pr(x + 1, y, z), B = pr(x, y, z + 1);
    ctx.save(); ctx.transform((A[0] - C[0]) * rx, (A[1] - C[1]) * rx, (B[0] - C[0]) * rz, (B[1] - C[1]) * rz + thick, C[0], C[1]);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  };
  const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  sh.addColorStop(0, `rgba(0,0,0,${0.6 * high})`); sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh; groundEll(10 - 12 * RS, 2, -20 * RS, 170 * lerp(0.7, 1, high), 70, 15.3 * RC);
  for (const L of LEGS) {                            // contact shadows under planted paws
    const Lg = P.legs[L.id], w = Lg.Fw, lift = clamp(1 + w[1] / 14);
    if (lift <= 0) continue;
    ctx.fillStyle = `rgba(0,0,0,${0.55 * lift})`;
    groundEll(w[0] + 4, 1, Lg.fz || 0, 15, 9, 3.2 * RC);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // far legs — behind the body, darker, only a whisper of rim
  cFar.setTransform(1, 0, 0, 1, 0, 0); cFar.clearRect(0, 0, W, H);
  cFar.globalCompositeOperation = 'source-over';
  setBodyTransform(cFar); cFar.translate(5, -1.5); cFar.fillStyle = '#000';
  drawLeg(cFar, P.legs.RH, true); drawLeg(cFar, P.legs.RF, true);
  cFar.setTransform(1, 0, 0, 1, 0, 0);
  cFar.globalCompositeOperation = 'source-in';
  cFar.fillStyle = COAT.far; cFar.fillRect(0, 0, W, H);
  cFar.globalCompositeOperation = 'source-over';
  ctx.drawImage(mFar, 0, 0);

  // near silhouette mask
  cBody.globalCompositeOperation = 'source-over';
  cBody.setTransform(1, 0, 0, 1, 0, 0); cBody.clearRect(0, 0, W, H);
  setBodyTransform(cBody); cBody.fillStyle = '#000'; drawBody(cBody, P);
  if (RS > 0.55) { drawLeg(cBody, P.legs.RH, true); drawLeg(cBody, P.legs.RF, true); }
  cBody.setTransform(1, 0, 0, 1, 0, 0);

  // rim light: the silhouette minus itself shifted away from the moon
  cRim.globalCompositeOperation = 'source-over';
  cRim.setTransform(1, 0, 0, 1, 0, 0); cRim.clearRect(0, 0, W, H);
  cRim.drawImage(mBody, 0, 0);
  cRim.globalCompositeOperation = 'source-in'; cRim.fillStyle = COAT.rim; cRim.fillRect(0, 0, W, H);
  cRim.globalCompositeOperation = 'destination-out'; cRim.drawImage(mBody, 1.4 * sc, 2.1 * sc);
  cRim.globalCompositeOperation = 'source-over';

  // fur: deep blue-black, lighter where the moon reaches the back
  cBody.globalCompositeOperation = 'source-in';
  const gy = oy + CAMY + AY * sc, g = cBody.createLinearGradient(0, gy - 190 * sc * AK, 0, gy);
  g.addColorStop(0, COAT.fur[0]); g.addColorStop(0.3, COAT.fur[1]); g.addColorStop(1, COAT.fur[2]);
  cBody.fillStyle = g; cBody.fillRect(0, 0, W, H);
  cBody.globalCompositeOperation = 'source-atop';
  if (PSTYLE.bounce > 0) {                                        // warm light bouncing up from the ground
    const bc = (typeof PAL !== 'undefined' && PAL.c && PAL.c.dust) ? PAL.c.dust.map(v => v | 0).join(',') : '255,190,120';
    const bg = cBody.createLinearGradient(0, gy - 80 * sc * AK, 0, gy); bg.addColorStop(0, 'rgba(' + bc + ',0)'); bg.addColorStop(1, 'rgba(' + bc + ',' + PSTYLE.bounce + ')');
    cBody.fillStyle = bg; cBody.fillRect(0, 0, W, H);
  }
  setBodyTransform(cBody);
  const glow = (x, y, r, a) => {
    const gg = cBody.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, `rgba(${COAT.lt},${a})`); gg.addColorStop(1, 'rgba(' + COAT.lt + ',0)');
    cBody.fillStyle = gg; cBody.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const shade = (x, y, r, a) => {
    const gg = cBody.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, `rgba(0,0,0,${a})`); gg.addColorStop(1, 'rgba(0,0,0,0)');
    cBody.fillStyle = gg; cBody.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const LF = P.legs.LF, LH = P.legs.LH, RF = P.legs.RF, RHl = P.legs.RH, o = P.off;
  const vis = RC * RC, top = RS * RS;                // how much the flank, and the back, face the camera
  // light on the shoulder and haunch (the leg joints are already where the camera sees them)
  glow(LF.SC[0] - 6, LF.SC[1] + 8, 32, 0.11);
  glow((LF.SJ[0] + LF.E[0]) / 2 - 4, (LF.SJ[1] + LF.E[1]) / 2, 20, 0.07);
  glow(LH.HJ[0] - 10, LH.HJ[1] - 14, 40, 0.1);
  glow(lerp(LH.HJ[0], LH.K[0], 0.5) - 6, lerp(LH.HJ[1], LH.K[1], 0.5) - 4, 22, 0.06);
  if (top > 0) {                                    // from above: shoulder blades and hips roll under the skin with each step
    for (const L of [LF, RF]) glow(L.SC[0], L.SC[1], 30, 0.14 * top);
    for (const L of [LH, RHl]) glow(L.HJ[0], L.HJ[1], 32, 0.1 * top);
  }
  // painted on the flank: these turn with it and fade as it turns away from the camera
  cBody.save(); cBody.transform(...rigAffine(26)); cBody.globalAlpha = vis;
  glow(10, -156 + o(10), 85, 0.07);
  shade(40, -74 + o(40), 70, 0.35);
  cBody.lineCap = 'round'; cBody.lineWidth = 0.6;
  cBody.strokeStyle = 'rgba(105,125,175,0.09)'; cBody.beginPath();
  for (const s of STRANDS.a) { cBody.moveTo(s[0], s[1] + o(s[0])); cBody.lineTo(s[0] + s[2], s[1] + s[3] + o(s[0])); }
  cBody.stroke();
  cBody.strokeStyle = 'rgba(0,0,0,0.22)'; cBody.beginPath();
  for (const s of STRANDS.b) { cBody.moveTo(s[0], s[1] + o(s[0])); cBody.lineTo(s[0] + s[2], s[1] + s[3] + o(s[0])); }
  cBody.stroke();
  cBody.strokeStyle = MARKS ? 'rgba(70,80,104,0.07)' : 'rgba(' + (COAT.ghost || '96,110,150') + ',' + (0.07 + 0.08 * PSTYLE.ghost) + ')'; cBody.lineWidth = MARKS ? 1.6 : 2.2;            // ghost rosettes ride on the torso
  if (!MARKS && !COAT.belly) for (const ro of ROSETTES) {          // only the dark panthers show hidden rosettes
    const y = ro.y + o(ro.x);
    for (let k = 0; k < ro.gaps; k++) {
      const a0 = ro.rot + k * TAU / ro.gaps;
      cBody.beginPath(); cBody.arc(ro.x, y, ro.r, a0, a0 + TAU / ro.gaps * 0.62); cBody.stroke();
    }
  }
  cBody.restore();
  // sheen along the spine: the side-view highlight, and a broad stripe down the back from above
  const spinePts = P.spine || P.hull.slice(1, 7);
  cBody.lineJoin = 'round'; cBody.lineCap = 'round';
  if (vis > 0.01) {
    const sg = cBody.createLinearGradient(0, -172, 0, -120);
    sg.addColorStop(0, 'rgba(' + COAT.lt + ',0.30)'); sg.addColorStop(1, 'rgba(' + COAT.lt + ',0)');
    cBody.globalAlpha = vis; cBody.strokeStyle = sg; cBody.lineWidth = 9;
    cBody.beginPath(); splinePath(cBody, spinePts, false); cBody.stroke();
  }
  if (top > 0.01 && P.spine) {
    cBody.globalAlpha = top;
    cBody.strokeStyle = 'rgba(' + COAT.lt + ',0.05)'; cBody.lineWidth = 40; cBody.beginPath(); splinePath(cBody, spinePts, false); cBody.stroke();
    cBody.strokeStyle = 'rgba(170,190,235,0.06)'; cBody.lineWidth = 12; cBody.beginPath(); splinePath(cBody, spinePts, false); cBody.stroke();
  }
  if (PSTYLE.gloss > 0 && vis > 0.01 && spinePts.length > 3) {
    cBody.globalAlpha = vis * PSTYLE.gloss; cBody.strokeStyle = 'rgba(' + COAT.lt + ',0.34)'; cBody.lineWidth = 2.4;
    cBody.save(); cBody.translate(0, 6); cBody.beginPath(); splinePath(cBody, spinePts.slice(1, -1), false); cBody.stroke(); cBody.restore(); cBody.globalAlpha = 1;
  }
  // shadow where the legs meet the body (side view)
  cBody.globalAlpha = vis;
  shade(LF.SJ[0] - 8, LF.SJ[1] + 20, 24, 0.5);
  shade(LH.HJ[0] + 18, LH.HJ[1] + 26, 26, 0.45);
  cBody.globalAlpha = 1;
  cBody.lineCap = 'round'; cBody.lineWidth = 0.6;
  cBody.strokeStyle = 'rgba(105,125,175,0.07)';
  strandsAlong(cBody, [LH.HJ, LH.K, LH.Hk, LH.F], [26, 14, 8], 14, 5);
  strandsAlong(cBody, [LF.SJ, LF.E, LF.Wr, LF.F], [16, 11, 8], 12, 9);
  // muscle seams (very soft, side view)
  cBody.globalAlpha = vis;
  cBody.strokeStyle = 'rgba(0,0,0,0.12)'; cBody.lineWidth = 3;
  cBody.beginPath(); cBody.moveTo(LF.SC[0] + 18, LF.SC[1] + 6); cBody.quadraticCurveTo(LF.SJ[0] + 22, LF.SJ[1] + 4, LF.E[0] + 10, LF.E[1] + 2); cBody.stroke();
  cBody.beginPath(); cBody.moveTo(LH.HJ[0] + 30, LH.HJ[1] - 4); cBody.quadraticCurveTo(LH.HJ[0] + 26, LH.HJ[1] + 30, LH.K[0] + 8, LH.K[1]); cBody.stroke();
  cBody.globalAlpha = 1;
  if (COAT.belly || MARKS) drawMarks(cBody, P, MARKS);           // pale underside, stripes or spots
  if (COAT.muzzle) {                                              // pale muzzle and chin
    cBody.save(); cBody.transform(...headAffine(P.head, 10)); cBody.globalAlpha = clamp(vis * 1.4 + top * 0.6);
    const mz = cBody.createRadialGradient(77, 6, 2, 77, 6, 26);
    mz.addColorStop(0, COAT.muzzle); mz.addColorStop(1, 'rgba(255,255,255,0)');
    cBody.fillStyle = mz; cBody.fillRect(46, -22, 64, 54); cBody.restore();
  }
  // head sheen
  cBody.save(); cBody.transform(...headAffine(P.head, 0));
  const hg = cBody.createRadialGradient(38, -30, 0, 38, -30, 30);
  hg.addColorStop(0, 'rgba(' + COAT.lt + ',0.2)'); hg.addColorStop(1, 'rgba(' + COAT.lt + ',0)');
  cBody.fillStyle = hg; cBody.fillRect(0, -50, 90, 70);
  cBody.globalAlpha = vis;
  const mg = cBody.createRadialGradient(58, 32, 4, 58, 32, 34);        // jaw in shadow
  mg.addColorStop(0, 'rgba(0,0,0,0.5)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
  cBody.fillStyle = mg; cBody.fillRect(14, 4, 80, 40);
  cBody.restore();
  if (top > 0.01) { const hp = headPt(P.head, 30, -28, 0), q = pr(hp[0], hp[1], hp[2]); glow(q[0], q[1], 36, 0.16 * top); }   // top of the head
  cBody.setTransform(1, 0, 0, 1, 0, 0); cBody.globalCompositeOperation = 'source-over';

  if (PSTYLE.outline > 0) {                                        // a thin ink outline: the silhouette nudged four ways, behind the body
    const [oc, og] = pantherScratch(); og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, W, H);
    og.drawImage(mBody, 0, 0); og.globalCompositeOperation = 'source-in'; og.fillStyle = COAT.ink || 'rgba(6,6,10,0.9)'; og.fillRect(0, 0, W, H); og.globalCompositeOperation = 'source-over';
    const w = PSTYLE.outline * sc * AK; for (const [dx, dy] of [[w, w], [-w, w], [w, -w], [-w, -w]]) ctx.drawImage(oc, dx, dy);
  }
  ctx.drawImage(mBody, 0, 0);
  // rim: a soft wide bloom plus a crisp edge
  ctx.save();
  ctx.globalAlpha = 0.22; ctx.filter = `blur(${2.2 * sc}px)`; ctx.drawImage(mRim, 0, 0);
  ctx.globalAlpha = 0.6; ctx.filter = `blur(${0.6 * sc}px)`; ctx.drawImage(mRim, 0, 0);
  ctx.restore();
  if (PSTYLE.rim2 > 0) {                                          // a second, cool kicker light catching the other edge
    cRim.globalCompositeOperation = 'source-over'; cRim.setTransform(1, 0, 0, 1, 0, 0); cRim.clearRect(0, 0, W, H);
    cRim.drawImage(mBody, 0, 0); cRim.globalCompositeOperation = 'source-in'; cRim.fillStyle = COAT.rim2 || COOL_RIM; cRim.fillRect(0, 0, W, H);
    cRim.globalCompositeOperation = 'destination-out'; cRim.drawImage(mBody, -1.6 * sc, -0.4 * sc); cRim.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = 0.55 * PSTYLE.rim2; ctx.filter = `blur(${0.7 * sc}px)`; ctx.drawImage(mRim, 0, 0); ctx.restore();
  }

  // ---- the face: painted on planes inside the head, each at the depth of the surface it sits on ----
  setBodyTransform(ctx);
  drawFace(P, vis);
  drawTopFace(P, faceSide(vis));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
}
const FACE_SPOTS = (() => { const r = rng(21), a = []; while (a.length < 22) { const x = 22 + r() * 44, y = -34 + r() * 46; if (Math.hypot((x - 58) / 12, (y + 19) / 8) < 1.25 || (x > 66 && y > -6)) continue; a.push([x, y, 0.9 + r() * 1.1]); } return a; })();
// the anime face: big glossy eyes, blush, a small nose and an ω cat smile with a tiny fang
function sparkle(x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); }
// one anime eye in its own frame: +x toward the nose, −y toward the brow (used by the side view and the views from above)
function animeEye(EC) {
  const ink = '#050506';
  const eye = () => { ctx.beginPath(); ctx.moveTo(-10, 2); ctx.bezierCurveTo(-9, -9.5, 7, -11.5, 10.5, -2); ctx.bezierCurveTo(9, 7.5, -5, 10, -10, 2); };
  ctx.fillStyle = '#fbfbff'; eye(); ctx.fill();
  ctx.save(); eye(); ctx.clip();
  const ig = ctx.createLinearGradient(0, -9, 0, 8); ig.addColorStop(0, EC[2]); ig.addColorStop(0.45, EC[1]); ig.addColorStop(1, EC[0]);
  ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(1.5, -0.5, 7.2, 8.8, 0, 0, TAU); ctx.fill();                       // a tall iris
  ctx.strokeStyle = hexA(EC[2], 0.95); ctx.lineWidth = 0.9; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.beginPath(); ctx.ellipse(1.5, 4.2, 4.8, 2.6, 0, 0, TAU); ctx.fill();   // light pooled low in the iris
  ctx.fillStyle = '#060608'; ctx.beginPath(); ctx.ellipse(1.8, -0.6, 2.4, 6.2, 0, 0, TAU); ctx.fill();                // pupil
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-12, -13, 24, 5.5);                                                 // the lid's shadow
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(-1.6, -4.4, 3, 2.3, -0.4, 0, TAU); ctx.fill();                                          // the big shine
  ctx.beginPath(); ctx.arc(4.8, 3.8, 1.25, 0, TAU); ctx.fill();                                                        // a small one below
  sparkle(5, -5.8, 2.2);                                                                                               // and a sparkle
  ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.8;
  ctx.beginPath(); ctx.moveTo(-10.6, 2.4); ctx.bezierCurveTo(-9, -9.5, 7, -11.5, 10.6, -2); ctx.stroke();             // bold upper lashes
  ctx.lineWidth = 1.9;
  ctx.beginPath(); ctx.moveTo(-9.4, -4); ctx.lineTo(-14.2, -7.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10.4, -0.2); ctx.lineTo(-15.4, -1.4); ctx.stroke();                                      // lash flicks toward the ear
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, 5.2); ctx.bezierCurveTo(-3, 9.2, 5, 8, 9, 3.2); ctx.stroke();    // fine lower lashes
}
function animeFeatures(P, F, al, plane) {
  const EC = COAT.eye || ['#fff2a0', '#dcb630', '#5e4a10'], ink = '#050506';
  plane(16);
  if (PSTYLE.blush > 0) {                                                           // blush, with the classic hatch lines
    ctx.save(); ctx.globalAlpha = al * PSTYLE.blush;
    const bg = ctx.createRadialGradient(66, 0, 0, 66, 0, 10); bg.addColorStop(0, 'rgba(255,110,145,0.8)'); bg.addColorStop(1, 'rgba(255,110,145,0)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(66, 0, 11, 6, -0.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(225,70,105,0.85)'; ctx.lineWidth = 1; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const x = 61.5 + k * 4; ctx.beginPath(); ctx.moveTo(x + 1.6, -3); ctx.lineTo(x - 1, 2.5); ctx.stroke(); }
    ctx.restore();
  }
  ctx.strokeStyle = F.light ? 'rgba(40,24,16,0.9)' : 'rgba(' + COAT.lt + ',0.75)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';   // a bold little brow
  ctx.beginPath(); ctx.moveTo(47, -31.5); ctx.quadraticCurveTo(54, -34, 61.5, -28.5); ctx.stroke();
  const ex = 59, ey = -14.5;
  if (PSTYLE.eyeGlow > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 20); eg.addColorStop(0, hexA(EC[1], 0.4 * PSTYLE.eyeGlow)); eg.addColorStop(1, hexA(EC[1], 0));
    ctx.fillStyle = eg; ctx.fillRect(ex - 20, ey - 20, 40, 40); ctx.restore();
  }
  ctx.save(); ctx.translate(ex, ey); ctx.rotate(-8 * DEG); ctx.scale(1.16, 1.16 * P.eye);
  animeEye(EC);
  ctx.restore();
  // nose: small and rounded
  plane(4);
  ctx.fillStyle = F.nose; ctx.beginPath(); ctx.moveTo(83, -12.5); ctx.quadraticCurveTo(89, -13, 89.6, -8.5); ctx.quadraticCurveTo(88.6, -5, 85.8, -5.2); ctx.quadraticCurveTo(82.6, -7.6, 83, -12.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(85.6, -10.6, 1.8, 0.9, -0.2, 0, TAU); ctx.fill();
  // the ω smile and a tiny fang
  plane(12);
  ctx.strokeStyle = F.lip; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(87, -5); ctx.lineTo(86.4, -1.6); ctx.quadraticCurveTo(85.6, 3.6, 81.6, 2.9); ctx.quadraticCurveTo(79, 2.4, 78.4, -0.2); ctx.stroke();
  if (PSTYLE.fang) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = ink; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(82.4, 2.8); ctx.lineTo(84.6, 2.6); ctx.lineTo(83.3, 6.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // three simple whiskers
  const sw = -0.3 * P.wG + 0.04 * Math.sin(STL * 2.3);
  ctx.strokeStyle = F.light ? 'rgba(60,40,30,0.55)' : 'rgba(240,244,255,0.6)'; ctx.lineWidth = 0.8;
  for (const [x0, y0, a0, len] of [[79, -1, -14, 30], [80, 2, 2, 33], [79, 5, 17, 29]]) {
    const a = a0 * DEG + sw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + Math.cos(a) * len * 0.5, y0 + Math.sin(a) * len * 0.5 - 2, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); ctx.stroke();
  }
}
// how much the side-view face shows: it hands over to the front/top view quickly, so the near eye is never seen twice
const faceSide = vis => smooth(clamp((vis * 1.6 - 0.45) / 0.2));
function faceTone() {                       // light coats get pink noses and dark whisker dots, dark coats the reverse
  const light = !!COAT.muzzle;
  return { light, nose: COAT.nose || (light ? '#c98a84' : '#2a1d22'), lip: light ? 'rgba(40,22,18,0.8)' : 'rgba(6,4,6,0.85)',
    dots: light ? 'rgba(60,36,28,0.55)' : 'rgba(' + COAT.lt + ',0.38)', ear: light ? 'rgba(236,190,184,0.7)' : 'rgba(120,98,122,0.4)',
    fur: 'rgba(' + COAT.lt + ',' + (light ? 0.45 : 0.22) + ')' };
}
function drawFace(P, vis) {
  const H = P.head, F = faceTone(), al = faceSide(vis); if (al <= 0) return;
  const flank = RC < 0 ? -1 : 1;                // the side face goes on the flank that faces the camera, so it is never seen through the head from the far side
  const plane = lz => { ctx.setTransform(1, 0, 0, 1, 0, 0); setBodyTransform(ctx); ctx.transform(...headAffine(H, lz * flank)); };
  ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // inner ear, with tufts of fur
  plane(16);
  ctx.save(); ctx.translate(19, -36); ctx.rotate(H.ear || 0); ctx.translate(-19, 36);
  ctx.fillStyle = F.ear; ctx.beginPath(); ctx.moveTo(11, -35); ctx.quadraticCurveTo(11, -48, 18, -51); ctx.quadraticCurveTo(26, -48, 28, -37); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = F.fur; ctx.lineWidth = 0.7;
  for (const [x0, x1, y1] of [[14, 12, -46], [17, 16, -49], [20, 21, -48], [23, 25, -44]]) { ctx.beginPath(); ctx.moveTo(x0, -36); ctx.quadraticCurveTo((x0 + x1) / 2 - 1, (y1 - 36) / 2, x1, y1); ctx.stroke(); }
  ctx.restore();
  // coat markings on the face
  if (MARKS === 'stripes') {
    ctx.fillStyle = COAT.mark;
    const stripe = (pts, w) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.quadraticCurveTo(pts[1][0] + w, pts[1][1], pts[2][0], pts[2][1]); ctx.quadraticCurveTo(pts[1][0] - w, pts[1][1], pts[0][0], pts[0][1]); ctx.fill(); };
    stripe([[50, -6], [42, -3], [33, 2]], 2.4); stripe([[52, 2], [44, 6], [35, 12]], 2.6); stripe([[54, 10], [46, 15], [38, 22]], 2.2);   // cheek stripes
    stripe([[46, -31], [42, -35], [40, -40]], 1.6); stripe([[40, -28], [36, -32], [33, -38]], 1.6); stripe([[34, -24], [30, -28], [26, -33]], 1.4);   // forehead
  } else if (MARKS === 'spots' || MARKS === 'rosettes') {
    ctx.fillStyle = COAT.mark;
    for (const [x, y, r] of FACE_SPOTS) { ctx.globalAlpha = al * 0.9; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.85, x, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = al;
  }
  if (F.light) {                                                    // pale patch above the eye and on the cheek
    ctx.fillStyle = COAT.muzzle; ctx.globalAlpha = al * 0.7;
    ctx.beginPath(); ctx.ellipse(55, -28, 7, 3.2, -0.2, 0, TAU); ctx.fill();
    ctx.globalAlpha = al;
  }
  if (COAT.tear || MARKS === 'spots') {                             // the cheetah's tear line
    ctx.strokeStyle = COAT.mark; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(65, -15); ctx.quadraticCurveTo(70, -4, 70, 9); ctx.stroke();
  }
  // cheek ruff
  ctx.strokeStyle = F.fur; ctx.lineWidth = 0.8;
  for (let k = 0; k < 6; k++) { const x = 40 + k * 4.5, y = 21 - k * 0.9; ctx.globalAlpha = al * 0.7; ctx.beginPath(); ctx.moveTo(x + 2, y - 3); ctx.quadraticCurveTo(x, y, x - 2.5, y + 3.5); ctx.stroke(); }
  ctx.globalAlpha = al;
  if (PSTYLE.face === 'anime') { animeFeatures(P, F, al, plane); ctx.restore(); return; }
  // brow: a soft highlight over the eye, and the eye itself
  ctx.strokeStyle = 'rgba(' + COAT.lt + ',0.3)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(47, -30); ctx.quadraticCurveTo(58, -31, 67, -24); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.9;                                          // the lid crease
  ctx.beginPath(); ctx.moveTo(50, -24); ctx.quadraticCurveTo(58, -28, 65, -23); ctx.stroke();
  const EC = COAT.eye || ['#fff2a0', '#dcb630', '#5e4a10'], ex = 58, ey = -19;
  if (PSTYLE.eyeGlow > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 17); eg.addColorStop(0, hexA(EC[1], 0.45 * PSTYLE.eyeGlow)); eg.addColorStop(1, hexA(EC[1], 0));
    ctx.fillStyle = eg; ctx.fillRect(ex - 18, ey - 18, 36, 36); ctx.restore();
  }
  ctx.save(); ctx.translate(ex, ey); ctx.rotate(-14 * DEG); ctx.scale(1.12, 1.12 * P.eye);
  ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.moveTo(-8.6, 0.6); ctx.quadraticCurveTo(-2, -6.4, 8.2, -0.8); ctx.quadraticCurveTo(2, 5.6, -8.6, 0.6); ctx.fill();   // almond lids
  ctx.save(); ctx.beginPath(); ctx.moveTo(-7.6, 0.5); ctx.quadraticCurveTo(-2, -5.2, 7.2, -0.7); ctx.quadraticCurveTo(2, 4.6, -7.6, 0.5); ctx.clip();
  const ig = ctx.createRadialGradient(0.8, -0.2, 0, 0.4, 0, 6.8); ig.addColorStop(0, EC[0]); ig.addColorStop(0.55, EC[1]); ig.addColorStop(1, EC[2]);
  ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(0.4, -0.2, 6.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(EC[2], 0.55); ctx.lineWidth = 0.35;
  for (let k = 0; k < 14; k++) { const a = k * TAU / 14; ctx.beginPath(); ctx.moveTo(0.4 + Math.cos(a) * 2.4, -0.2 + Math.sin(a) * 2.4); ctx.lineTo(0.4 + Math.cos(a) * 6, -0.2 + Math.sin(a) * 6); ctx.stroke(); }
  ctx.fillStyle = '#030303'; ctx.beginPath(); ctx.ellipse(0.8, -0.2, 1.9, 4.2, 0, 0, TAU); ctx.fill();          // pupil
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-9, -7, 18, 3.4);                                          // the upper lid shades the iris
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(-1.6, -1.8, 1.15, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(3.0, 1.3, 0.55, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#020202'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-8.6, 0.6); ctx.quadraticCurveTo(-2, -6.4, 8.2, -0.8); ctx.stroke();               // upper lid line
  ctx.beginPath(); ctx.moveTo(-8.4, 0.4); ctx.quadraticCurveTo(-11.5, -1.6, -13.6, -0.6); ctx.stroke();          // flick toward the ear
  ctx.strokeStyle = 'rgba(' + COAT.lt + ',0.35)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-6.5, 2.2); ctx.quadraticCurveTo(1, 5.6, 7.6, 0.6); ctx.stroke();                   // lower lid catches the light
  ctx.strokeStyle = '#020202'; ctx.lineWidth = 1.0; ctx.beginPath(); ctx.moveTo(8.0, -0.6); ctx.quadraticCurveTo(10.5, 2.5, 11.6, 6.5); ctx.stroke();   // tear duct line
  ctx.restore();
  // whisker pads and the mouth, on the side of the muzzle
  plane(12);
  const pad = ctx.createRadialGradient(77, 3, 1, 77, 4, 11); pad.addColorStop(0, F.light ? COAT.muzzle : 'rgba(' + COAT.lt + ',0.16)'); pad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = pad; ctx.beginPath(); ctx.ellipse(77, 4, 11, 8, 0.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = F.lip; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(86, 1); ctx.quadraticCurveTo(83, 9, 74, 10); ctx.quadraticCurveTo(64, 10.5, 58.5, 7.5); ctx.quadraticCurveTo(57, 6.5, 57.5, 5); ctx.stroke();   // mouth, corners lifted
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(81, 12.5); ctx.quadraticCurveTo(76, 16, 69, 16.5); ctx.stroke();   // chin
  ctx.fillStyle = F.dots;
  for (const [x, y] of [[73, 1], [77, 0.5], [81, 1.2], [71, 4.5], [75, 4.2], [79, 4.6], [83, 5], [74, 7.6], [78, 7.8]]) { ctx.beginPath(); ctx.arc(x, y, 0.8, 0, TAU); ctx.fill(); }
  // nose: leather at the tip of the muzzle, with a nostril and a wet shine
  plane(4);
  ctx.fillStyle = F.nose; ctx.beginPath(); ctx.moveTo(80, -14.5); ctx.quadraticCurveTo(87, -15, 89.5, -10); ctx.quadraticCurveTo(91, -5.5, 88.5, -2.5); ctx.quadraticCurveTo(85, -1.2, 83, -4); ctx.quadraticCurveTo(80.5, -8, 80, -14.5); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.beginPath(); ctx.moveTo(85.5, -6.5); ctx.quadraticCurveTo(88.5, -6.8, 89, -4.2); ctx.quadraticCurveTo(87, -4.8, 85.5, -6.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.beginPath(); ctx.ellipse(84.5, -12, 2.4, 1, -0.15, 0, TAU); ctx.fill();
  ctx.strokeStyle = F.lip; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(86.5, -2.6); ctx.lineTo(86, 1.2); ctx.stroke();   // the line under the nose
  // whiskers grow from the pads
  plane(12);
  const sw = -0.35 * P.wG + 0.04 * Math.sin(STL * 2.3);
  ctx.strokeStyle = 'rgba(240,244,255,0.55)'; ctx.lineWidth = 0.65;
  for (const [x0, y0, a0, len, cv] of [[77, 0.5, -16, 40, -5], [81, 1.2, -6, 44, -3], [75, 4.2, 5, 46, 2], [79, 4.6, 13, 42, 4], [74, 7.6, 24, 36, 6], [78, 7.8, 32, 30, 6]]) {
    const a = a0 * DEG + sw, x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + cv * 0.3, (y0 + y1) / 2 + cv, x1 + cv * 0.3, y1 + cv * 0.5); ctx.stroke();
  }
  plane(16);
  for (const [a0, len] of [[-72, 18], [-55, 22]]) { const a = a0 * DEG + sw * 0.5; ctx.beginPath(); ctx.moveTo(60, -28); ctx.lineTo(60 + Math.cos(a) * len, -28 + Math.sin(a) * len); ctx.stroke(); }   // brow whiskers
  ctx.restore();
}
// the face as the camera above sees it: two eyes, the nose and whiskers fanning out to both sides
const rotN = (H, x, y) => { const a = H.a - 7 * DEG, ca = Math.cos(a), sa = Math.sin(a); return [x * ca - y * sa, x * sa + y * ca]; };
function drawTopFace(P, side = 0) {      // side: how strongly the side-view face already shows the near eye, nose and whiskers
  const a = smooth(clamp((RU - 0.3) / 0.4)); if (a <= 0) return;
  const near = RC < 0 ? -1 : 1;                 // which flank the side-view face is on
  const lookAt = smooth(clamp((facing(...rotN(P.head, 1, -0.3), 0) + 0.05) / 0.2));   // 0 when the face points away from the camera: no eyes seen from behind
  const H = P.head, hp = (x, y, z) => { const r = headPt(H, x, y, z); return pr(r[0], r[1], r[2]); };
  ctx.save();
  {                                              // an eye can never poke out past the edge of the head: clip to the head's outline, seen from here
    const prof = [[5, -34, 31], [30, -42, 32], [58, -37, 34], [78, -23, 22], [91, -8, 8], [88, 6, 8], [76, 19, 13], [50, 24, 24], [22, 28, 31], [3, 10, 31]], q = [];
    for (const [x, y, w] of prof) for (const sd of [-1, 1]) q.push(hp(x, y, sd * w));
    const h = hull2(q); ctx.beginPath(); ctx.moveTo(h[0][0], h[0][1]); for (let i = 1; i < h.length; i++) ctx.lineTo(h[i][0], h[i][1]); ctx.closePath(); ctx.clip();
  }
  for (const sd of [-1, 1]) {
    const f = clamp(facing(...rotN(H, 0.55, -0.45), sd * 0.7) * 2.2) * a * (sd === near ? 1 - side : 1); if (f <= 0) continue;   // the near eye is already drawn by the side-view face
    const c0 = hp(58, -19, sd * 23), c1 = hp(64, -20, sd * 20), ang = Math.atan2(c1[1] - c0[1], c1[0] - c0[0]);
    ctx.globalAlpha = (PSTYLE.face === 'anime' ? smooth(clamp((f - 0.3) / 0.06)) : f) * lookAt;   // solid once it shows: a half-faded eye looks like a grey ghost
    ctx.save(); ctx.translate(c0[0], c0[1]); ctx.rotate(ang);
    if (PSTYLE.face === 'anime') {
      const r = headPt(H, 58, -19, sd * 23), k = HS * 1.16 * camK(r[0], r[1], r[2]), up = hp(58, -31, sd * 21);
      const ny = -(up[0] - c0[0]) * Math.sin(ang) + (up[1] - c0[1]) * Math.cos(ang);   // which way the brow lies in the eye's frame
      ctx.scale(k, k * P.eye * (ny > 0 ? -1 : 1) * lerp(0.62, 1, f));
      animeEye(COAT.eye || ['#fff2a0', '#dcb630', '#5e4a10']); ctx.restore();
      if (PSTYLE.blush > 0) {                                     // blush under each eye
        const b = hp(66, 1, sd * 24), kb = k * 9; ctx.save(); ctx.globalAlpha = f * PSTYLE.blush * 0.85;
        const bg = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], kb); bg.addColorStop(0, 'rgba(255,110,145,0.8)'); bg.addColorStop(1, 'rgba(255,110,145,0)');
        ctx.fillStyle = bg; ctx.fillRect(b[0] - kb, b[1] - kb, 2 * kb, 2 * kb); ctx.restore();
      }
      continue;
    }
    const ig = ctx.createRadialGradient(0.5, 0, 0, 0, 0, 7);
    const EC = COAT.eye || ['#fff2a0', '#dcb630', '#5e4a10']; ig.addColorStop(0, EC[0]); ig.addColorStop(0.6, EC[1]); ig.addColorStop(1, EC[2]);
    ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#040404'; ctx.beginPath(); ctx.ellipse(0.4, 0, 1.3, 2.9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(-1.8, -1, 0.9, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#020202'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 0, 7.1, 3.7, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = a * clamp(facing(...rotN(H, 1, -0.3), 0) * 3);   // the nose only shows when the head faces the camera
  const n0 = hp(87, -8, 0), n1 = hp(90, -8, 0), na = Math.atan2(n1[1] - n0[1], n1[0] - n0[0]);
  ctx.save(); ctx.translate(n0[0], n0[1]); ctx.rotate(na);
  ctx.fillStyle = faceTone().nose; ctx.beginPath(); ctx.ellipse(0, 0, 5, 6.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-1.5, d * 2.4, 1.7, 0.9, 0, 0, TAU); ctx.fill(); }   // nostrils
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(1.4, -1.4, 1.2, 2.6, 0, 0, TAU); ctx.fill();
  ctx.restore();
  {                                              // seen head on: whisker pads either side of the nose, the ω mouth with its little fang, and the chin
    const fr = a * clamp(facing(...rotN(H, 1, -0.3), 0) * 3) * (1 - clamp(side * 4));   // once the side face has its own mouth, this one steps aside
    if (fr > 0.02) {
      const F = faceTone(), r0 = headPt(H, 84, 0, 0), kk = HS * camK(r0[0], r0[1], r0[2]);
      const square = smooth(clamp((facing(...rotN(H, 1, -0.3), 0) - 0.9) / 0.08));   // flat ovals only look right when seen square on
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha = fr * 0.75 * square; ctx.fillStyle = F.light ? COAT.muzzle : 'rgba(' + COAT.lt + ',0.16)';
      for (const sd of [-1, 1]) { const c = hp(80, 3, sd * 9); ctx.beginPath(); ctx.ellipse(c[0], c[1], 11 * kk, 7.5 * kk, 0, 0, TAU); ctx.fill(); }          // whisker pads
      ctx.globalAlpha = fr * 0.5 * square; ctx.fillStyle = 'rgba(0,0,0,0.5)'; const ch = hp(74, 20, 0); ctx.beginPath(); ctx.ellipse(ch[0], ch[1], 9 * kk, 3.2 * kk, 0, 0, TAU); ctx.fill();   // shadow under the chin
      ctx.globalAlpha = fr; ctx.strokeStyle = F.lip; ctx.lineWidth = Math.max(1, 1.7 * kk);
      const m0 = hp(87, -2, 0), m1 = hp(86, 3, 0), ml = hp(79, 7, -12), mr = hp(79, 7, 12), cl = hp(85, 8.5, -5), cr = hp(85, 8.5, 5);
      ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.moveTo(m1[0], m1[1]); ctx.quadraticCurveTo(cl[0], cl[1], ml[0], ml[1]); ctx.moveTo(m1[0], m1[1]); ctx.quadraticCurveTo(cr[0], cr[1], mr[0], mr[1]); ctx.stroke();
      if (PSTYLE.fang) { const g0 = hp(84.5, 7, -4), g1 = hp(84.5, 7, -1.6), g2 = hp(84.5, 11, -3); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#050506'; ctx.lineWidth = Math.max(0.5, 0.6 * kk); ctx.beginPath(); ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
  }
  if (TALKW > 0.02) {
    const op = TALKW * (0.35 + 0.65 * Math.abs(Math.sin(STL * 9)));
    ctx.globalAlpha = a * clamp(facing(...rotN(H, 1, -0.3), 0) * 3);
    const m0 = hp(80, 8, 0), m1 = hp(83, 8, 0), ma = Math.atan2(m1[1] - m0[1], m1[0] - m0[0]);
    ctx.save(); ctx.translate(m0[0], m0[1]); ctx.rotate(ma); ctx.fillStyle = 'rgba(46,12,18,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 1.5 + 4.5 * op, 6.5, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = a * (1 - 0.9 * (P.wD || 0));   // whiskers drop out of sight with the bowed head
  ctx.strokeStyle = 'rgba(236,242,255,0.65)'; ctx.lineWidth = 0.7;
  const sw = 2 * Math.sin(STL * 2.3);
  const whA = ctx.globalAlpha;
  for (const sd of [-1, 1]) for (const [ex, ey, ez] of [[104, -3, 44], [99, 3, 56], [91, 8, 62], [81, 10, 58]]) {
    const sf = clamp(0.35 + facing(0, 0, sd) * 1.6) * (sd === near ? 1 - side : 1); if (sf <= 0) continue; ctx.globalAlpha = whA * sf;
    const p0 = hp(78, 4, sd * 18), p1 = hp(ex + sw, ey, sd * ez), m = hp((78 + ex) / 2, (4 + ey) / 2 + 5, sd * (14 + ez) / 2);
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(m[0], m[1], p1[0], p1[1]); ctx.stroke();
  }
  ctx.restore();
}

//#endregion panther:drawing
