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
const HEAD_PTS = [[-4, -6], [1, -20], [12, -31], [28, -36], [44, -33], [56, -26], [66, -17], [74, -11], [80, -8], [83, -3],
                  [81, 3], [77, 7], [74, 11], [69, 16], [62, 20], [50, 25], [36, 29], [22, 31], [8, 28], [-2, 19]];
function earPath(c, ear, dx, dy, k) {
  c.save(); c.translate(19 + dx, -30 + dy); c.rotate(ear); c.translate(-19, 30); c.scale(k, k);
  c.beginPath(); c.moveTo(6, -24); c.quadraticCurveTo(6, -44, 17, -48); c.quadraticCurveTo(29, -46, 33, -30); c.closePath(); c.fill();
  c.restore();
}
function drawHead(c, H) {
  if (H.polys) { for (const pg of H.polys) fillPoly(c, pg); return; }
  c.save(); c.translate(H.x, H.y); c.rotate(H.a); c.scale(HS, HS);
  earPath(c, (H.ear || 0) * 0.8, 9, -3, 0.92);                 // far ear, partly hidden
  c.beginPath(); splinePath(c, HEAD_PTS); c.fill();
  earPath(c, H.ear || 0, 0, 0, 1);                             // near ear
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
const W_HEAD = [[-4, 12], [4, 30], [16, 39], [32, 41], [46, 37], [58, 30], [68, 22], [78, 15], [84, 8]];
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
    const k = s > 0 ? 1 : 0.92, dx = s > 0 ? 0 : 9, dy = s > 0 ? 0 : -3, ea = (H.ear || 0) * (s > 0 ? 1 : 0.8), ce = Math.cos(ea), se = Math.sin(ea);
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
};
//#endregion panther:coats
//#region panther:drawing
// markings sit on the 3D body surface, so they turn with it and only show on the side facing the camera
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
    c.strokeStyle = COAT.mark; c.lineWidth = 1.9;
    for (const sp of MARK_SETS.spots) {
      const s = at(sp.x, sp.a); if (!s || s.f < 0.05) continue;
      c.globalAlpha = clamp(s.f * 3); const r = sp.r * 1.5, a0 = sp.x * 0.7;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(s.p[0], s.p[1], r, a0 + k * TAU / 3, a0 + k * TAU / 3 + 1.4); c.stroke(); }
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
  cBody.strokeStyle = 'rgba(105,125,175,0.065)'; cBody.beginPath();
  for (const s of STRANDS.a) { cBody.moveTo(s[0], s[1] + o(s[0])); cBody.lineTo(s[0] + s[2], s[1] + s[3] + o(s[0])); }
  cBody.stroke();
  cBody.strokeStyle = 'rgba(0,0,0,0.22)'; cBody.beginPath();
  for (const s of STRANDS.b) { cBody.moveTo(s[0], s[1] + o(s[0])); cBody.lineTo(s[0] + s[2], s[1] + s[3] + o(s[0])); }
  cBody.stroke();
  cBody.strokeStyle = 'rgba(70,80,104,0.07)'; cBody.lineWidth = 1.6;            // ghost rosettes ride on the torso
  for (const ro of ROSETTES) {
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
    const mz = cBody.createRadialGradient(70, 8, 2, 70, 8, 24);
    mz.addColorStop(0, COAT.muzzle); mz.addColorStop(1, 'rgba(255,255,255,0)');
    cBody.fillStyle = mz; cBody.fillRect(40, -20, 60, 50); cBody.restore();
  }
  // head sheen
  cBody.save(); cBody.transform(...headAffine(P.head, 0));
  const hg = cBody.createRadialGradient(36, -24, 0, 36, -24, 28);
  hg.addColorStop(0, 'rgba(' + COAT.lt + ',0.2)'); hg.addColorStop(1, 'rgba(' + COAT.lt + ',0)');
  cBody.fillStyle = hg; cBody.fillRect(0, -50, 90, 70);
  cBody.globalAlpha = vis;
  const mg = cBody.createRadialGradient(52, 34, 4, 52, 34, 34);        // jaw in shadow
  mg.addColorStop(0, 'rgba(0,0,0,0.5)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
  cBody.fillStyle = mg; cBody.fillRect(14, 4, 80, 40);
  cBody.restore();
  if (top > 0.01) { const hp = headPt(P.head, 30, -28, 0), q = pr(hp[0], hp[1], hp[2]); glow(q[0], q[1], 36, 0.16 * top); }   // top of the head
  cBody.setTransform(1, 0, 0, 1, 0, 0); cBody.globalCompositeOperation = 'source-over';

  ctx.drawImage(mBody, 0, 0);
  // rim: a soft wide bloom plus a crisp edge
  ctx.save();
  ctx.globalAlpha = 0.22; ctx.filter = `blur(${2.2 * sc}px)`; ctx.drawImage(mRim, 0, 0);
  ctx.globalAlpha = 0.6; ctx.filter = `blur(${0.6 * sc}px)`; ctx.drawImage(mRim, 0, 0);
  ctx.restore();

  // face details: ear, brow, eye, nose, mouth, whiskers
  setBodyTransform(ctx);
  ctx.save(); ctx.globalAlpha = clamp(vis * 1.6);
  ctx.transform(...headAffine(P.head, 16));
  ctx.save(); ctx.translate(19, -30); ctx.rotate(P.head.ear); ctx.translate(-19, 30);       // inner ear
  ctx.fillStyle = 'rgba(120,98,122,0.3)'; ctx.beginPath(); ctx.moveTo(12, -29); ctx.quadraticCurveTo(12, -41, 18, -44); ctx.quadraticCurveTo(25, -41, 27, -31); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(175,195,245,0.2)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(8, -33); ctx.quadraticCurveTo(8, -45, 17, -48); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(160,180,230,0.2)'; ctx.lineWidth = 1.1;                           // brow and cheekbone catch the light
  ctx.beginPath(); ctx.moveTo(46, -29); ctx.quadraticCurveTo(58, -27, 66, -18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(50, -6); ctx.quadraticCurveTo(60, -3, 68, 0); ctx.stroke();
  const eg = ctx.createRadialGradient(57, -16, 0, 57, -16, 13);
  eg.addColorStop(0, 'rgba(210,220,110,0.3)'); eg.addColorStop(1, 'rgba(210,220,110,0)');
  ctx.fillStyle = eg; ctx.fillRect(40, -32, 36, 36);
  ctx.save(); ctx.translate(57, -16); ctx.rotate(-12 * DEG); ctx.scale(1, P.eye);
  const ig = ctx.createRadialGradient(0.5, 0, 0, 0, 0, 6.4);
  ig.addColorStop(0, '#f2e48a'); ig.addColorStop(0.6, '#c2ab38'); ig.addColorStop(1, '#5e5218');
  ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(0, 0, 6.4, 3.8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#040404'; ctx.beginPath(); ctx.ellipse(0.4, 0, 2.5, 3.3, 0, 0, TAU); ctx.fill();   // wide pupil: it is night
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(-1.7, -1.3, 0.9, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#020202'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 3.9, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();   // upper lid
  ctx.restore();
  ctx.fillStyle = 'rgba(112,88,104,0.6)'; ctx.beginPath(); ctx.ellipse(82.5, -5, 3.8, 3, -0.2, 0, TAU); ctx.fill();   // nose pad
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.ellipse(83.5, -4.5, 1.1, 1.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(190,200,240,0.3)'; ctx.beginPath(); ctx.ellipse(81, -7.2, 1.8, 0.9, -0.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(120,135,180,0.28)'; ctx.lineWidth = 0.9;                           // mouth
  ctx.beginPath(); ctx.moveTo(81, 1); ctx.quadraticCurveTo(79, 6, 70, 7); ctx.quadraticCurveTo(62, 8, 55, 5); ctx.stroke();
  ctx.fillStyle = 'rgba(150,170,220,0.26)';                                                   // whisker pad dots
  for (const [dx, dy] of [[72, 1], [68, 3], [73, 5], [66, 6]]) { ctx.beginPath(); ctx.arc(dx, dy, 0.7, 0, TAU); ctx.fill(); }
  const sw = -0.35 * P.wG + 0.04 * Math.sin(STL * 2.3);
  ctx.strokeStyle = 'rgba(205,218,255,0.42)'; ctx.lineWidth = 0.55;
  for (const [a0, len, cv] of [[-24, 38, -6], [-9, 42, -4], [5, 42, 2], [19, 37, 6], [32, 30, 7]]) {
    const a = a0 * DEG + sw, x1 = 72 + Math.cos(a) * len, y1 = 3 + Math.sin(a) * len;
    ctx.beginPath(); ctx.moveTo(72, 3); ctx.quadraticCurveTo((72 + x1) / 2 + cv * 0.3, (3 + y1) / 2 + cv, x1 + cv * 0.3, y1 + cv * 0.5); ctx.stroke();
  }
  for (const [a0, len] of [[-70, 17], [-52, 20]]) {                                           // brow whiskers
    const a = a0 * DEG + sw * 0.5; ctx.beginPath(); ctx.moveTo(60, -22); ctx.lineTo(60 + Math.cos(a) * len, -22 + Math.sin(a) * len); ctx.stroke();
  }
  ctx.restore();
  drawTopFace(P);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
}
// the face as the camera above sees it: two eyes, the nose and whiskers fanning out to both sides
const rotN = (H, x, y) => { const a = H.a - 7 * DEG, ca = Math.cos(a), sa = Math.sin(a); return [x * ca - y * sa, x * sa + y * ca]; };
function drawTopFace(P) {
  const a = smooth(clamp((RU - 0.3) / 0.4)); if (a <= 0) return;
  const H = P.head, hp = (x, y, z) => { const r = headPt(H, x, y, z); return pr(r[0], r[1], r[2]); };
  ctx.save();
  for (const sd of [-1, 1]) {
    const f = clamp(facing(...rotN(H, 0.55, -0.45), sd * 0.7) * 2.2) * a; if (f <= 0) continue;
    const c0 = hp(58, -17, sd * 22), c1 = hp(64, -18, sd * 19), ang = Math.atan2(c1[1] - c0[1], c1[0] - c0[0]);
    ctx.globalAlpha = f;
    ctx.save(); ctx.translate(c0[0], c0[1]); ctx.rotate(ang);
    const ig = ctx.createRadialGradient(0.5, 0, 0, 0, 0, 7);
    ig.addColorStop(0, '#f2e48a'); ig.addColorStop(0.6, '#c2ab38'); ig.addColorStop(1, '#5e5218');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#040404'; ctx.beginPath(); ctx.ellipse(0.4, 0, 1.3, 2.9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(-1.8, -1, 0.9, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#020202'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 0, 7.1, 3.7, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = a * clamp(facing(...rotN(H, 1, -0.3), 0) * 3);   // the nose only shows when the head faces the camera
  const n0 = hp(83, -4, 0), n1 = hp(86, -4, 0), na = Math.atan2(n1[1] - n0[1], n1[0] - n0[0]);
  ctx.save(); ctx.translate(n0[0], n0[1]); ctx.rotate(na);
  ctx.fillStyle = 'rgba(112,88,104,0.75)'; ctx.beginPath(); ctx.ellipse(0, 0, 3.4, 4.6, 0, 0, TAU); ctx.fill();
  ctx.restore();
  if (TALKW > 0.02) {
    const op = TALKW * (0.35 + 0.65 * Math.abs(Math.sin(STL * 9)));
    ctx.globalAlpha = a * clamp(facing(...rotN(H, 1, -0.3), 0) * 3);
    const m0 = hp(75, 9, 0), m1 = hp(78, 9, 0), ma = Math.atan2(m1[1] - m0[1], m1[0] - m0[0]);
    ctx.save(); ctx.translate(m0[0], m0[1]); ctx.rotate(ma); ctx.fillStyle = 'rgba(46,12,18,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 1.5 + 4.5 * op, 6.5, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = a * (1 - 0.9 * (P.wD || 0));   // whiskers drop out of sight with the bowed head
  ctx.strokeStyle = 'rgba(225,232,255,0.5)'; ctx.lineWidth = 0.6;
  const sw = 2 * Math.sin(STL * 2.3);
  for (const sd of [-1, 1]) for (const [ex, ey, ez] of [[98, -2, 40], [93, 3, 52], [85, 7, 58], [75, 9, 55]]) {
    const p0 = hp(72, 3, sd * 17), p1 = hp(ex + sw, ey, sd * ez), m = hp((72 + ex) / 2, (3 + ey) / 2 + 5, sd * (13 + ez) / 2);
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(m[0], m[1], p1[0], p1[1]); ctx.stroke();
  }
  ctx.restore();
}

//#endregion panther:drawing
