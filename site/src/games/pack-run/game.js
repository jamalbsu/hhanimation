// =====================================================================================
//  PACK RUN: a Panthers Pack game for happyhillz.com
//  The pack runs down a five-lane savanna trail while one huge threat charges straight at it:
//  elephants, a buffalo stampede or a rockslide. Switch lanes, jump, roar the threat off the trail,
//  grab stars, last 45 seconds. (A roar spooks an elephant or buffalo away and cracks a boulder: no one gets hurt.)
//
//  site/scripts/build.js turns this file into /games/pack-run/pack-run.js. It puts the original panther
//  rig (panther/panther-rig.js) at the PANTHER_RIG marker and the hoofed animals of the episode engine
//  (taken from the trailer episode in src/trailer/) at the BEASTS marker, so the cats and the elephants
//  are drawn exactly as they are in the cartoon. Everything else is in this file: the few engine globals
//  the rig expects, the game, the savanna, the controls, the sound and the screens.
// =====================================================================================
(() => {
// ---- what the rig expects from the episode engine -----------------------------------
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const DUTY = 0.64, STRIDE = 112, SG = 330;          // walk duty and stride, gallop stride (body units)
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = x => x * x * (3 - 2 * x);
const frac = x => x - Math.floor(x);
const dir = a => [Math.cos(a * DEG), Math.sin(a * DEG)];
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function keyframes(k, s) {
  for (let i = 0; i < k.length - 1; i++) if (s <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], smooth(clamp((s - k[i][0]) / (k[i + 1][0] - k[i][0]))));
  return k[k.length - 1][1];
}
function splinePath(c, pts, closed = true) {
  const n = pts.length, P = i => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) c.closePath();
}
function capsule(c, ax, ay, ar, bx, by, br) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-3, a = Math.atan2(dy, dx), s = Math.asin(clamp((ar - br) / d, -1, 1));
  c.beginPath(); c.arc(ax, ay, ar, a + Math.PI / 2 - s, a + Math.PI * 1.5 + s); c.arc(bx, by, br, a - Math.PI / 2 + s, a + Math.PI / 2 - s); c.closePath(); c.fill();
}
function ik(ax, ay, bx, by, l1, l2, bend) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy), base = Math.atan2(dy, dx);
  if (d >= l1 + l2 - 0.01) { const r = l1 / (l1 + l2); return [ax + dx * r, ay + dy * r]; }
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  return [ax + l1 * Math.cos(base + bend * a), ay + l1 * Math.sin(base + bend * a)];
}
const rgbOf = c => { if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; } return c.split(',').map(Number); };
const col = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const EVT = { acc0: 1e9, acc1: 1e9, slow0: 1e9, slow1: 1e9, lie0: 1e9, lie1: 1e9 };   // no lying down, no drinking
const DRINK0 = 1e9, JUMPS = [], EVENTS = [];
let DLAG = 0, SD = 0, STL = 0, TALKW = 0;
const drinkAmt = () => 0;
const PAL = { c: { dust: [214, 186, 138] } };      // warm light bouncing up from the savanna floor
let W = 2, H = 2, sc = 1, ox = 0, oy = 0, ctx = null;                    // the canvas the rig is drawing into
let mBody, cBody, mRim, cRim, mFar, cFar;
let CAMYAW = 90, CAMTILT = 24, FA = 1, AX = 0, AY = 0, AK = 1;
// The gait table: distance, walk cycles and gallop cycles, integrated from the pack's speed as the game runs.
// The episodes integrate a whole story once; here it grows a frame at a time and forgets what is long past.
const TAB_DT = 1 / 120, TAB = { d: [0], w: [0], g: [0], v: [0] };
let tab0 = 0;
function tab(a, t) { const n = a.length; if (n < 2) return a[0]; const x = clamp((t - tab0) / TAB_DT, 0, n - 1), i = Math.min(n - 2, Math.floor(x)); return lerp(a[i], a[i + 1], x - i); }
function growTab(until, v) {
  let n = TAB.d.length;
  while (tab0 + (n - 1) * TAB_DT < until) {
    const i = n - 1, pv = TAB.v[i];
    TAB.d.push(TAB.d[i] + pv * TAB_DT); TAB.w.push(TAB.w[i] + pv * DUTY / STRIDE * TAB_DT); TAB.g.push(TAB.g[i] + pv / SG * TAB_DT); TAB.v.push(v); n++;
  }
  if (n > 2400) { const cut = n - 1200; for (const k in TAB) TAB[k].splice(0, cut); tab0 += cut * TAB_DT; }
}
function weights(t) {
  const v = tab(TAB.v, t), wG = smooth(clamp((v - 230) / 110)), sStand = smooth(clamp((90 - v) / 60));
  return { v, wG, wStand: sStand * (1 - wG), wWalk: (1 - wG) * (1 - sStand) };
}

//@@PANTHER_RIG@@

// ---- the Panthers Pack, in the coats of the daytime episodes -------------------------
let COAT = COATS.panther, MARKS = null;
Object.assign(COATS.panther, { fur: ['#2a2c33', '#15171c', '#060607'], far: '#08090b', rim: 'rgb(255,222,180)', lt: '255,220,182' });
COATS.blackP2 = { fur: ['#33302e', '#1a1719', '#070606'], far: '#0a0908', rim: 'rgb(255,215,170)', lt: '255,215,175' };
COATS.leopardDay = { fur: ['#e6b862', '#cc9442', '#7c5628'], far: '#5e4020', rim: 'rgb(255,236,196)', lt: '255,240,214', belly: 'rgba(250,240,220,0.75)', muzzle: 'rgba(250,242,226,0.7)', mark: '#24180c' };
COATS.jaguar = { fur: ['#e0a854', '#c08436', '#6e4a1c'], far: '#4c3014', rim: 'rgb(255,232,190)', lt: '255,238,205', belly: 'rgba(248,236,214,0.7)', muzzle: 'rgba(248,238,222,0.7)', mark: '#1a1006' };

//@@BEASTS@@

// ---- one cat, painted by the rig into a canvas of its own ------------------------------
// s: the cat's canvas plus the rig's working canvases (body, rim light, far legs, outline), all the same size.
// j: what to paint: the moment, the cat, the camera, the scale and where its feet go in the canvas.
function catSet(w, h, mk) { const s = { w, h }; [s.c, s.g] = mk(w, h); s.body = mk(w, h); s.rim = mk(w, h); s.far = mk(w, h); s.scr = mk(w, h); return s; }
function paintCat(s, j) {
  W = s.w; H = s.h; ctx = s.g; [mBody, cBody] = s.body; [mRim, cRim] = s.rim; [mFar, cFar] = s.far; P_SCR = s.scr;
  sc = j.sc; ox = j.ax; oy = j.ay; AX = 0; AY = 0; AK = j.k; FA = 1;
  CAMYAW = j.yaw; CAMTILT = j.tilt; CH_D = j.dist; STL = j.t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);
  COAT = COATS[j.coat]; MARKS = j.marks; DLAG = 0; TALKW = j.talk || 0;
  drawPanther(j.t, j.ph);
}
// one elephant or buffalo, as the episode engine draws its herds (st: its stride, lift, head and trunk)
function paintBeast(s, j) {
  ctx = s.g; sc = j.sc; ox = j.ax; oy = j.ay; AX = 0; AY = 0; AK = j.k;
  CAMYAW = j.yaw; CAMTILT = j.tilt; CH_D = j.dist; setTurn(1);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, s.w, s.h);
  const sp = BEASTS[j.sp];
  FA = -1; setGroundTransform(ctx); beastShadow(sp, j.st.lift); drawBeast(sp, j.st);
  ctx.setTransform(1, 0, 0, 1, 0, 0); FA = 1;
}
// Loaded as a worker, this same file paints the animals it is sent, in software, and hands them back as pictures.
if (typeof document === 'undefined') {
  const mkOff = (w, h) => { const c = new OffscreenCanvas(w, h); return [c, c.getContext('2d', { willReadFrequently: true })]; };
  const sets = new Map();
  self.onmessage = ({ data: m }) => {
    tab0 = m.tab0; for (const k in TAB) TAB[k] = m.tab[k];
    JUMPS.length = 0; JUMPS.push(...m.jumps); Object.assign(PSTYLE, m.style);
    for (const key of sets.keys()) if (!m.live.includes(key)) sets.delete(key);       // animals that have gone by
    const out = [], pics = [];
    for (const j of m.jobs) {
      let s = sets.get(j.key);
      if (!s || s.w !== j.w || s.h !== j.h) {
        if (j.sp) { s = { w: j.w, h: j.h }; [s.c, s.g] = mkOff(j.w, j.h); } else s = catSet(j.w, j.h, mkOff);
        sets.set(j.key, s);
      }
      j.sp ? paintBeast(s, j) : paintCat(s, j);
      const b = s.c.transferToImageBitmap(); out.push({ ...j, b }); pics.push(b);
    }
    self.postMessage(out, pics);
  };
  return;
}

// =====================================================================================
//  THE GAME
// =====================================================================================
const SCRIPT = document.currentScript && document.currentScript.src;
const root = document.getElementById('pack-run');
if (!root) return;
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
const stage = $('.game__stage'), canvas = $('.game__canvas'), main = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const SHOT = params.has('shot'), BOT = params.has('bot');                 // ?shot: a still for the share image; ?bot: plays itself
if (SHOT) document.documentElement.classList.add('is-shot');      // the stage fills the window, for the share image
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };

const ROUND = 45;                 // seconds in a round
const LANES = 5, MID = (LANES - 1) / 2;     // lanes 0 to 4; the pack starts in the middle one
const LANE = 240;                 // lane spacing (body units)
const laneZ = l => (l - MID) * LANE;
const JD = 0.8;                   // jump length (s)
const F_SPAWN = 5200;             // threats appear this far up the trail
// block: how many lanes a wave can close, early and late in the round (one lane always stays open)
const THREATS = {
  elephants: { name: 'Elephant Charge', pop: 'ELEPHANTS!', hint: 'SWITCH LANES!', kind: 'elephant', v: 430, every: [2.2, 1.35], block: [1.7, 3.6], logs: 0.45 },
  buffalo:   { name: 'Buffalo Stampede', pop: 'STAMPEDE!', hint: 'SWITCH LANES!', kind: 'buffalo', v: 640, every: [1.7, 1.05], block: [1.9, 3.8], logs: 0.35 },
  boulders:  { name: 'Rockslide', pop: 'ROCKSLIDE!', hint: 'JUMP!', kind: 'boulder', v: 280, every: [1.4, 0.9], logs: 0 },
};
// the roar blast: the leader roars a ball of sound straight down its lane. hp: roars it takes; pts: points for it
const BLAST_V = 3600, BLAST_CD = 0.26, BLAST_RANGE = 4600;
// diamonds: a rare pickup on the trail; each puts a different armor on the pack for a few seconds
const ARMORS = {
  bubble: { name: 'Bubble Armor', c: '#4fd2ff', c2: '#c8f4ff', dur: 10, hits: 3 },   // soaks up three bumps or shots
  rock:   { name: 'Rock Armor', c: '#f09a3a', c2: '#ffd9a0', dur: 7 },              // the pack plows through anything in its way
  triple: { name: 'Triple Roar', c: '#ff4fb8', c2: '#ffc4e8', dur: 8 },             // every roar goes down three lanes
  mirror: { name: 'Mirror Armor', c: '#9be05a', c2: '#e6ffc8', dur: 9 },            // shots bounce back at whoever threw them
};
const ARMOR_KEYS = Object.keys(ARMORS);
// the herds shoot back: elephants squirt water balls from their trunks, buffalo fling mud. A roar and a ball cancel out.
const SPIT = { elephant: { kind: 'water', v: 1150, y: -210 }, buffalo: { kind: 'mud', v: 1300, y: -110 } };
const TOUGH = { elephant: { hp: 3, pts: 50, word: 'SPOOKED!' }, buffalo: { hp: 1, pts: 20, word: 'SHOO!' }, boulder: { hp: 2, pts: 30, word: 'CRACK!' }, log: { hp: 1, pts: 10, word: 'SNAP!' } };
// the pack: the leader up front, the second panther and the leopard on either side, the jaguar at the back
const PACK = [
  { coat: 'panther', marks: null, size: 1.0, fx: 60, dz: 0, ph: 0, rate: 20 },
  { coat: 'blackP2', marks: null, size: 0.95, fx: -95, dz: -88, ph: 0.15, rate: 12 },
  { coat: 'leopardDay', marks: 'rosettes', size: 0.92, fx: -112, dz: 92, ph: 0.21, rate: 10.5 },
  { coat: 'jaguar', marks: 'rosettes', size: 1.02, fx: -268, dz: 6, ph: 0.34, rate: 8 },
].map(c => ({ ...c, z: c.dz, vz: 0, turn: 0, dim: { w: 0, h: 0 }, set: null }));

// ---- the screen ---------------------------------------------------------------------
const QUAL_DPR = [2, 1.6, 1.3, 1];
let quality = 0, CW = 2, CH = 2, DPR = 1, S0 = 1;
function resize() {
  const r = stage.getBoundingClientRect();
  // the canvas is at most about 2.4 megapixels: a big high-density screen gets a slightly softer picture, not a slow one
  DPR = Math.min(window.devicePixelRatio || 1, QUAL_DPR[quality], Math.sqrt(2.4e6 / Math.max(1, r.width * r.height)));
  CW = canvas.width = Math.max(2, Math.round(r.width * DPR));
  CH = canvas.height = Math.max(2, Math.round(r.height * DPR));
  S0 = Math.min(CW / 720, CH / 860); redrawAll = true;
  root.classList.toggle('is-wide', CW / CH > 1.15);
  CAMS.title = titleCam(); CAMS.over = titleCam();
  if (state === 'title' || (state === 'over' && STL - stateT > 2)) Object.assign(cam, CAMS.title), camFrom = camTo = CAMS.title;
}

// ---- the camera: a front-three-quarter portrait of the pack on the menus, the chase view behind it in play ----
const wideNow = () => CW / CH > 1.15;
const titleCam = () => wideNow() ? { yaw: -26, tilt: 9, dist: 1700, zoom: 1.12, fx: 0.62, fy: 0.72, ff: -100, follow: 0 }
                                  : { yaw: -24, tilt: 10, dist: 1700, zoom: 0.94, fx: 0.5, fy: 0.33, ff: -100, follow: 0 };
const CAMS = { title: titleCam(), run: { yaw: 90, tilt: 23, dist: 1150, zoom: 1, fx: 0.5, fy: 0.78, ff: 0, follow: 0.72 } };
CAMS.over = CAMS.title;
const cam = { ...CAMS.title };
let camFrom = CAMS.title, camTo = CAMS.title, camT0 = 0, camDur = 1;
function camGo(to, dur) { camFrom = { ...cam }; camTo = to; camT0 = STL; camDur = dur; }
function camStep() {
  const u = smooth(clamp((STL - camT0) / camDur));
  for (const k in camTo) cam[k] = lerp(camFrom[k], camTo[k], u);
  if (state === 'run' || state === 'go') cam.fy = lerp(cam.fy, wideNow() ? 0.8 : 0.76, u);
}

let OX = 0, OY = 0, SC = 1, CAMZ = 0, HY = 0, shakeX = 0, shakeY = 0, shake = 0, flash = 0;
function setCamera() {
  CAMYAW = cam.yaw; CAMTILT = cam.tilt; CH_D = cam.dist; FA = 1; setTurn(1);
  SC = S0 * cam.zoom;
  const p = pr(cam.ff, 0, 0);
  OX = CW * cam.fx - p[0] * SC + shakeX; OY = CH * cam.fy - p[1] * SC + shakeY;
  HY = OY + (PIV - CH_D * ST / CT) * SC;
}
const S = (f, y, z) => { const p = pr(f, y, z - CAMZ); return [OX + p[0] * SC, OY + p[1] * SC]; };
const kAt = (f, y, z) => camK0(f, y, z - CAMZ);
const depthOf = (f, z) => f * RS - (z - CAMZ) * RC;
const inFront = (f, z, y = -110) => CH_D + (depthOf(f, z) * CT - (PIV - y) * ST) > CH_D * 0.32;
function place(f, z, size) {                  // where an animal at (f, z) sits relative to the pack, and how big (the engine's placeAnimal)
  const o = pr(0, 0, 0), p = pr(f, 0, z - CAMZ);
  AX = p[0] - o[0]; AY = p[1] - o[1]; AK = size * camK0(f, PIV, z - CAMZ) / camK0(0, PIV, 0);
}

// ---- painting the animals -------------------------------------------------------------------
// The rig's compositing (fur, rim light, outline) works on whole canvases, so each cat is painted into a cat-sized
// canvas and then laid onto the scene. A cat is thousands of small shapes, and the herds hundreds more, which is more
// than the browser's one drawing thread can rasterize 60 times a second. So workers (this same file, see above) paint
// the animals in software on other cores, and the page only places the pictures. An animal's pose is repainted up to
// 30 times a second, the frame rate of the episodes, while where it is on screen moves every frame.
// Without workers (or with ?cats=page) the page paints half the pack each frame and draws the herds itself.
const crew = [], CORES = navigator.hardwareConcurrency || 4, pics = new Map();
let frameN = 0, redrawAll = true, catPics = 0;
if (!SHOT && params.get('cats') !== 'page' && SCRIPT && typeof Worker === 'function' && typeof OffscreenCanvas === 'function' && 'transferToImageBitmap' in OffscreenCanvas.prototype) {
  try {
    for (let w = 0, n = CORES >= 6 ? 4 : 2; w < n; w++) {      // one worker per cat where there are cores to spare, else two cats each
      const me = { wk: new Worker(SCRIPT), busy: false };
      me.wk.onmessage = e => { me.busy = false; for (const r of e.data) { setPic(r.key, r.b, r); if (!r.sp) catPics++; } };
      me.wk.onerror = e => { e.preventDefault(); crewDown(); };
      crew.push(me);
    }
  } catch (e) { crewDown(); }
}
function crewDown() { for (const m of crew) m.wk.terminate(); crew.length = 0; redrawAll = true; }
function setPic(key, img, pic) { const old = pics.get(key); if (old && old.img !== img && old.img.close) old.img.close(); pics.set(key, { img, pic }); }
function dropPic(key) { const old = pics.get(key); if (old && old.img.close) old.img.close(); pics.delete(key); }
// A cat's picture is at most this many pixels; on a big high-density screen it is painted smaller and drawn scaled up,
// so a phone or a slow laptop still repaints each cat often enough to look alive.
const CAT_PX = crew.length >= 4 ? 230000 : crew.length ? 140000 : 110000;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function catBox() {                         // the space a cat can take, in body units around its feet (wider from the side)
  const side = 1 - Math.abs(Math.sin(cam.yaw * DEG));
  const hw = lerp(165, 345, side);
  return { x0: -hw, x1: hw, y0: -330, y1: lerp(135, 70, side) };
}
function catJob(c, i, box) {                // where the cat is on screen now, and the picture to paint of it
  FA = 1; place(c.fx, c.z, c.size);
  const k = AK, s = SC * k, px = OX + AX * SC, py = OY + AY * SC, bw = (box.x1 - box.x0) * 1.04, bh = (box.y1 - box.y0) * 1.04;
  const ps = Math.min(s, Math.sqrt(CAT_PX / (bw * bh)));          // the scale it is painted at
  const w = Math.ceil(bw * ps), h = Math.ceil(bh * ps), d = c.dim;
  if (!d.w || w > d.w || h > d.h || w < d.w * 0.72 || h < d.h * 0.72) { d.w = w; d.h = h; }   // keep the canvas size steady
  const seen = !(px + box.x1 * s < 0 || px + box.x0 * s > CW || py + box.y0 * s > CH || py + box.y1 * s < 0);
  const talk = i === 0 ? clamp(1 - (STL - run.fireT) / 0.4) : 0;            // the leader's head jerks forward as it roars
  return { key: 'c' + i, i, px, py, seen, s, t: STL, ph: c.ph, yaw: cam.yaw + c.turn, tilt: cam.tilt, dist: cam.dist, sc: ps / k, k, ax: -box.x0 * ps, ay: -box.y0 * ps, w: d.w, h: d.h, coat: c.coat, marks: c.marks, talk };
}
const due = j => { const p = pics.get(j.key); return j.seen && (redrawAll || !p || STL - p.pic.t > 1 / 32 || (j.talk > 0.9 && !(p.pic.talk > 0.9))); };   // at most 30 poses a second
const lastPainted = j => { const p = pics.get(j.key); return p ? p.pic.t : -1; };
function paintAnimals(cats, beasts) {
  if (crew.length) {                       // whenever a worker is free: its cat (the older picture, if it has two) and its share of the herd
    let base = null;
    crew.forEach((m, w) => {
      if (m.busy) return;
      const n = crew.length, myCats = cats.filter(j => j.i % n === w), myBeasts = beasts.filter(j => j.at % n === w);
      const dc = myCats.filter(due).sort((a, b) => lastPainted(a) - lastPainted(b));
      const todo = (redrawAll ? dc : dc.slice(0, 1)).concat(myBeasts.filter(due));
      if (!todo.length) return;
      if (!base) {
        const i0 = Math.max(0, Math.floor((STL - 0.7 - tab0) / TAB_DT)), tab = {};
        for (const k in TAB) tab[k] = TAB[k].slice(i0);
        base = { tab0: tab0 + i0 * TAB_DT, tab, jumps: JUMPS.map(j => ({ ...j })), style: { rim2: PSTYLE.rim2 } };
      }
      m.busy = true;
      m.wk.postMessage({ ...base, live: myCats.concat(myBeasts).map(j => j.key), jobs: todo.map(({ px, py, seen, s, ...j }) => j) });
    });
  } else {                                 // painted here: half the pack each frame (the herds are drawn straight onto the scene)
    for (const j of cats) {
      const c = PACK[j.i];
      if (!due(j) || !(redrawAll || !pics.has(j.key) || (j.i + frameN) % 2 === 0)) continue;
      if (!c.set || c.set.w !== j.w || c.set.h !== j.h) c.set = catSet(j.w, j.h, mk);
      paintCat(c.set, j); setPic(j.key, c.set.c, j); catPics++;
    }
    CAMYAW = cam.yaw; CAMTILT = cam.tilt; CH_D = cam.dist; setTurn(1); FA = 1; ctx = main;
  }
  redrawAll = false;
}
function drawPic(j, alpha) {
  const e = pics.get(j.key); if (!e || !j.seen) return;
  const p = e.pic, r = j.s / (p.sc * p.k);   // painted a moment ago, maybe smaller: scale it to the size of the animal now
  main.globalAlpha = alpha; main.drawImage(e.img, 0, 0, p.w, p.h, j.px - p.ax * r, j.py - p.ay * r, p.w * r, p.h * r); main.globalAlpha = 1;
}
function beastJob(o) {                      // an elephant or buffalo: where it is on screen, and the picture to paint of it
  const sp = BEASTS[o.kind];
  FA = 1; place(o.f, o.z, o.size);
  const k = AK, s = SC * k, px = OX + AX * SC, py = OY + AY * SC;
  const amp = clamp((o.v - 150) / 300), cyc = o.D / (sp.stride * o.size) + o.ph;
  const st = { cyc, amp, A: clamp(o.v / 90), lift: amp * 8 * Math.max(0, Math.sin(TAU * (cyc - 0.25))), pitch: amp * 0.06 * Math.sin(TAU * cyc),
    hd: o.kind === 'buffalo' ? 12 : 2, leap: 0, tail: STL * (3 + 6 * amp) + o.ph * 9, trunkUp: o.kind === 'elephant' ? 1.4 * smooth(clamp((2600 - o.f) / 1200)) : 0 };
  const hw = lerp(sp.L * 1.35 + 50, sp.W * 2.3 + 50, Math.abs(Math.sin(cam.yaw * DEG))), x0 = -hw, y0 = -(sp.legU + sp.legD + sp.H * 2.5), bw = hw * 2, bh = -y0 + 90;
  const ps = Math.min(s, Math.sqrt(CAT_PX / (bw * bh))), w = Math.ceil(bw * ps), h = Math.ceil(bh * ps), d = o.dim;
  if (!d.w || w > d.w || h > d.h || w < d.w * 0.72 || h < d.h * 0.72) { d.w = w; d.h = h; }
  const seen = AK < 2.8 && px + hw * s > 0 && px - hw * s < CW && py + y0 * s < CH && py + 90 * s > 0;
  return { key: 'b' + o.id, at: o.id, px, py, seen, s, t: STL, sp: o.kind, st, yaw: cam.yaw, tilt: cam.tilt, dist: cam.dist, sc: ps / k, k, ax: -x0 * ps, ay: -y0 * ps, w: d.w, h: d.h };
}
function drawBeastHere(j, alpha) {          // without workers the page draws the herd itself, straight onto the scene
  if (!j.seen) return;
  const sp = BEASTS[j.sp];
  ctx = main; sc = SC; ox = j.px; oy = j.py; AX = 0; AY = 0; AK = j.k;
  main.globalAlpha = alpha; FA = -1; setGroundTransform(main); beastShadow(sp, j.st.lift); drawBeast(sp, j.st);
  main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; FA = 1;
}

// ---- the savanna ----------------------------------------------------------------------
const SKY = ['#5d88c2', '#f2a765', '#fbe0b0'], GROUND = ['#ecc896', '#d6ad6a', '#bb8f4a', '#8c6830'];
const TRAIL = ['rgba(222,192,142,0.55)', 'rgba(196,160,104,0.7)'];
const SPAN_T = 7200, SPAN_D = 3600;
const TREES = (() => { const r = rng(91), a = []; for (let i = 0; i < 58; i++) { const sd = i % 2 ? 1 : -1; a.push({ wf: r() * SPAN_T, z: sd * (LANE * (MID + 0.5) + 240 + r() * 1900), ht: 380 + r() * 220, cr: 115 + r() * 70, tw: 18 + r() * 12, seed: 1 + Math.floor(r() * 1e6) }); } return a; })();
const DECOR = (() => { const r = rng(77), a = []; for (let i = 0; i < 260; i++) { let z = (r() - 0.5) * 4400; if (Math.abs(z) < LANE * (MID + 0.55)) z = Math.sign(z || 1) * (LANE * (MID + 0.55) + r() * 500); a.push({ wf: r() * SPAN_D, z, kind: r(), s: r(), c: r() }); } return a; })();
const FAR = (() => { const r = rng(24), a = []; for (let i = 0; i < 26; i++) a.push({ u: i / 26 + (r() - 0.5) * 0.02, s: 0.45 + r() * 0.7, h: r() }); return a; })();
const CLOUDS = [[0.08, 0.5, 0.06], [0.42, 0.72, 0.075], [0.7, 0.42, 0.05], [0.9, 0.64, 0.065]];
const wrapF = (wf, span, back) => (((wf - SD) % span) + span) % span - back;

function drawSky() {
  const top = Math.max(0, HY);
  const g = main.createLinearGradient(0, HY - CH * 0.75, 0, HY);
  g.addColorStop(0, SKY[0]); g.addColorStop(0.62, SKY[1]); g.addColorStop(1, SKY[2]);
  main.fillStyle = g; main.fillRect(0, 0, CW, top + 2);
  const pan = -cam.yaw * DEG * CH_D * SC * 0.55 - CAMZ * SC * 0.06, M = Math.min(CW, CH);
  // the sun, low ahead of the pack
  const sx = CW * 0.5 + ((pan * 0.35 + CW * 0.3) % (CW * 2.4) + CW * 2.4) % (CW * 2.4) - CW * 1.2, sy = HY - M * 0.16, sr = M * 0.07;
  const halo = main.createRadialGradient(sx, sy, sr, sx, sy, sr * 7);
  halo.addColorStop(0, 'rgba(255,236,190,0.75)'); halo.addColorStop(1, 'rgba(255,214,150,0)');
  main.fillStyle = halo; main.fillRect(sx - sr * 7, sy - sr * 7, sr * 14, sr * 14);
  main.fillStyle = '#fff3d2'; main.beginPath(); main.arc(sx, sy, sr, 0, TAU); main.fill();
  main.fillStyle = 'rgba(255,240,226,0.55)';
  for (const [cx, cy, r] of CLOUDS) {
    const P = CW * 1.6, x = ((CW * cx * 1.6 + pan * 0.5 + STL * 6 * DPR) % P + P) % P - CW * 0.3, y = HY - (HY + CH * 0.1) * cy, rr = M * r;
    main.beginPath(); main.arc(x, y, rr, 0, TAU); main.arc(x + rr * 1.3, y - rr * 0.35, rr * 0.8, 0, TAU); main.arc(x + rr * 2.3, y, rr * 0.9, 0, TAU); main.fill();
  }
  // a hazy skyline of flat-topped acacias, like the one along the top of the site
  const P = CW * 2.2, base = HY + 2;
  for (const t of FAR) {
    const x = ((t.u * P + pan) % P + P) % P - CW * 0.6, s = t.s * M * 0.0016, o = 0.28 + 0.5 * t.s;
    if (x < -200 * s || x > CW + 200 * s) continue;
    main.save(); main.translate(x, base); main.scale(s, s); main.globalAlpha = o * 0.55;
    main.strokeStyle = '#8a6a48'; main.lineWidth = 7; main.lineCap = 'round';
    main.beginPath(); main.moveTo(0, 0); main.lineTo(0, -74); main.moveTo(0, -64); main.lineTo(-36, -116); main.moveTo(0, -74); main.lineTo(32, -122); main.stroke();
    main.fillStyle = '#8f9a5a'; main.beginPath(); main.ellipse(-6, -128, 94, 22, 0, 0, TAU); main.fill();
    main.fillStyle = '#a3ab6c'; main.beginPath(); main.ellipse(16, -137, 64, 14, 0, 0, TAU); main.fill();
    main.restore();
  }
}
function drawGround() {
  const top = Math.max(0, HY);
  const g = main.createLinearGradient(0, HY, 0, CH);
  [0, 0.06, 0.45, 1].forEach((s, i) => g.addColorStop(s, GROUND[i]));
  main.fillStyle = g; main.fillRect(0, top, CW, CH - top + 2);
  // haze where the land meets the sky
  const hz = main.createLinearGradient(0, HY - 70 * SC, 0, HY + 150 * SC);
  hz.addColorStop(0, 'rgba(255,220,176,0)'); hz.addColorStop(0.42, 'rgba(255,220,176,0.6)'); hz.addColorStop(1, 'rgba(255,220,176,0)');
  main.fillStyle = hz; main.fillRect(0, HY - 70 * SC, CW, 220 * SC);
}
const FS = (() => { const a = []; for (let i = 0; i <= 44; i++) { const u = i / 44; a.push(-2600 + 16000 * Math.pow(u, 2.3)); } return a; })();
function band(z0, z1, fill) {            // a strip of ground running along the trail, as far as the eye can see
  const L = [], R = [];
  for (const f of FS) { if (!inFront(f, (z0 + z1) / 2, 0)) continue; L.push(S(f, 0, z0)); R.push(S(f, 0, z1)); }
  if (L.length < 2) return;
  main.fillStyle = fill; main.beginPath(); main.moveTo(L[0][0], L[0][1]);
  for (const p of L) main.lineTo(p[0], p[1]); for (let i = R.length - 1; i >= 0; i--) main.lineTo(R[i][0], R[i][1]);
  main.closePath(); main.fill();
}
function quad(f0, f1, z0, z1, fill) {
  if (!inFront(f0, (z0 + z1) / 2, 0)) f0 = Math.max(f0, -400); if (!inFront(f0, (z0 + z1) / 2, 0)) return;
  const a = S(f0, 0, z0), b = S(f1, 0, z0), c = S(f1, 0, z1), d = S(f0, 0, z1);
  main.fillStyle = fill; main.beginPath(); main.moveTo(a[0], a[1]); main.lineTo(b[0], b[1]); main.lineTo(c[0], c[1]); main.lineTo(d[0], d[1]); main.closePath(); main.fill();
}
function drawTrail() {
  const edge = LANE * (MID + 0.62);
  band(-edge, edge, 'rgba(206,170,112,0.32)');
  for (let l = 0; l < LANES; l++) { const z = laneZ(l); band(z - 100, z + 100, TRAIL[0]); band(z - 76, z + 76, TRAIL[1]); }
  // tufts of grass between the lanes and along the edges, rushing past: the speed you see
  const step = 300, off = SD % step, tufts = [-edge, edge];
  for (let l = 0; l < LANES - 1; l++) tufts.push(laneZ(l) + LANE / 2);
  for (const zc of tufts)
    for (let f = -off - 600; f < 7200; f += step) quad(f, f + 120, zc - 12, zc + 12, 'rgba(120,128,52,0.55)');
}
function drawDecor() {
  for (const it of DECOR) {
    const f = wrapF(it.wf, SPAN_D, 1100);
    if (f > 2600 || !inFront(f, it.z, 0)) continue;
    const p = S(f, 0, it.z), k = kAt(f, 0, it.z) * SC, sq = Math.max(0.3, ST * 1.3);
    main.globalAlpha = clamp(1 - (f - 1900) / 700);
    if (it.kind < 0.3) { main.fillStyle = it.c < 0.5 ? 'rgba(240,210,150,0.3)' : 'rgba(140,100,40,0.2)'; main.beginPath(); main.ellipse(p[0], p[1], (40 + 80 * it.s) * k, (40 + 80 * it.s) * k * sq, 0, 0, TAU); main.fill(); }
    else if (it.kind < 0.85) {
      main.strokeStyle = it.c < 0.5 ? 'rgba(150,118,56,0.9)' : 'rgba(126,140,60,0.85)'; main.lineWidth = Math.max(0.6, 2 * k); main.beginPath();
      for (let j = 0; j < 5; j++) { const a = (-90 + (j - 2) * 16 + (it.s - 0.5) * 20) * DEG, l = (11 + 9 * it.c) * k; main.moveTo(p[0] + (j - 2) * 2.4 * k, p[1]); main.lineTo(p[0] + (j - 2) * 2.4 * k + Math.cos(a) * l, p[1] + Math.sin(a) * l); }
      main.stroke();
    } else { const r = (5 + 9 * it.s) * k; main.fillStyle = '#a89070'; main.beginPath(); main.ellipse(p[0], p[1] - r * 0.4, r, r * 0.62, 0, 0, TAU); main.fill(); main.fillStyle = 'rgba(255,245,220,0.5)'; main.beginPath(); main.ellipse(p[0] - r * 0.3, p[1] - r * 0.7, r * 0.4, r * 0.22, 0, 0, TAU); main.fill(); }
  }
  main.globalAlpha = 1;
}
function drawTree(f, tr, al) {
  const b = S(f, 0, tr.z), tp = S(f, -tr.ht, tr.z), k = kAt(f, -tr.ht * 0.5, tr.z) * SC, hgt = b[1] - tp[1];
  if (hgt <= 0) return;
  const tw = tr.tw * k, cr = tr.cr * k, r = rng(tr.seed), C = ['#4a5622', '#5c6a2c', '#7a8a3c'];
  main.globalAlpha = al;
  const fork = [lerp(b[0], tp[0], 0.6), lerp(b[1], tp[1], 0.6)];
  main.fillStyle = '#4a3420'; main.beginPath(); main.moveTo(b[0] - tw * 0.55, b[1]); main.lineTo(fork[0] - tw * 0.35, fork[1]); main.lineTo(fork[0] + tw * 0.35, fork[1]); main.lineTo(b[0] + tw * 0.55, b[1]); main.fill();
  main.strokeStyle = '#4a3420'; main.lineWidth = tw * 0.45; main.lineCap = 'round';
  main.beginPath(); main.moveTo(fork[0], fork[1]); main.lineTo(tp[0] - cr * 0.8, tp[1] + cr * 0.1); main.moveTo(fork[0], fork[1]); main.lineTo(tp[0] + cr * 0.9, tp[1]); main.stroke();
  for (let i = 0; i < 3; i++) { main.fillStyle = C[i]; main.beginPath(); main.ellipse(tp[0] + (r() - 0.5) * cr * 0.4, tp[1] - i * cr * 0.14, cr * (1.9 - i * 0.35), cr * (0.36 - i * 0.05), 0, 0, TAU); main.fill(); }
  main.globalAlpha = 1;
}
function drawBoulder(o, al) {
  const bounce = Math.abs(Math.sin(o.roll * 1.3)) * o.r * 0.12;
  const k = kAt(o.f, -o.r, o.z) * SC, c = S(o.f, -o.r - bounce, o.z), g0 = S(o.f, 0, o.z), rr = o.r * k;
  main.globalAlpha = al;
  main.fillStyle = 'rgba(70,46,20,0.3)'; main.beginPath(); main.ellipse(g0[0], g0[1], rr * 1.15, rr * Math.max(0.22, ST * 0.9), 0, 0, TAU); main.fill();
  const g = main.createRadialGradient(c[0] - rr * 0.35, c[1] - rr * 0.4, rr * 0.1, c[0], c[1], rr * 1.05);
  g.addColorStop(0, '#d8c4a0'); g.addColorStop(0.55, '#a48a68'); g.addColorStop(1, '#6a5640');
  main.fillStyle = g; main.strokeStyle = '#2a2018'; main.lineWidth = Math.max(1, 3.2 * k);
  main.beginPath(); for (let i = 0; i < 11; i++) { const a = TAU * i / 11, q = 1 + 0.07 * Math.sin(i * 2.7 + o.seed); main.lineTo(c[0] + Math.cos(a) * rr * q, c[1] + Math.sin(a) * rr * q); } main.closePath(); main.fill(); main.stroke();
  main.fillStyle = 'rgba(60,44,30,0.55)';
  for (let i = 0; i < 6; i++) {             // pits that roll over the top toward us as the boulder comes on
    const th = i * 1.9 + o.roll, ph = Math.sin(i * 4.1 + o.seed) * 1.1, fz = Math.cos(th);
    if (fz < 0.1) continue;
    main.beginPath(); main.ellipse(c[0] + Math.sin(ph) * rr * 0.72, c[1] - Math.sin(th) * rr * 0.72 * Math.cos(ph), rr * 0.13, rr * 0.13 * fz, 0, 0, TAU); main.fill();
  }
  main.globalAlpha = 1;
}
function drawLog(o, al) {
  const r = 26, k = kAt(o.f, -r, o.z) * SC, a = S(o.f, -r, o.z - 118), b = S(o.f, -r, o.z + 118), rr = r * k;
  main.globalAlpha = al;
  main.fillStyle = 'rgba(70,46,20,0.3)'; const s0 = S(o.f, 0, o.z); main.beginPath(); main.ellipse(s0[0], s0[1] + rr * 0.15, Math.abs(b[0] - a[0]) * 0.56, rr * 0.5, 0, 0, TAU); main.fill();
  const g = main.createLinearGradient(0, a[1] - rr, 0, a[1] + rr); g.addColorStop(0, '#9a6a3c'); g.addColorStop(0.5, '#6e4826'); g.addColorStop(1, '#3e2812');
  main.fillStyle = g; main.strokeStyle = '#1e140a'; main.lineWidth = Math.max(1, 2.6 * k);
  main.beginPath(); main.moveTo(a[0], a[1] - rr); main.lineTo(b[0], b[1] - rr); main.lineTo(b[0], b[1] + rr); main.lineTo(a[0], a[1] + rr); main.closePath(); main.fill(); main.stroke();
  main.strokeStyle = 'rgba(30,20,10,0.45)'; main.lineWidth = Math.max(1, 1.6 * k);
  for (const y of [-0.45, 0.1, 0.55]) { main.beginPath(); main.moveTo(a[0] + rr * 0.6, a[1] + rr * y); main.lineTo(b[0] - rr * 0.6, b[1] + rr * y + rr * 0.1); main.stroke(); }
  const e = Math.abs(a[0] - CW / 2) < Math.abs(b[0] - CW / 2) ? a : b;        // the cut end facing the middle of the screen
  main.fillStyle = '#d9b483'; main.strokeStyle = '#1e140a'; main.lineWidth = Math.max(1, 2.4 * k);
  main.beginPath(); main.ellipse(e[0], e[1], rr * 0.42, rr, 0, 0, TAU); main.fill(); main.stroke();
  main.strokeStyle = 'rgba(120,80,40,0.7)'; main.lineWidth = Math.max(0.6, k); main.beginPath(); main.ellipse(e[0], e[1], rr * 0.22, rr * 0.55, 0, 0, TAU); main.stroke();
  main.globalAlpha = 1;
}
function starPath(c, x, y, r, sx) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.46 : 1; c.lineTo(x + Math.cos(a) * r * q * sx, y + Math.sin(a) * r * q); } c.closePath(); }
function drawStar(o, al) {
  const bob = Math.sin(STL * 4 + o.seed) * 6, k = kAt(o.f, -o.hg, o.z) * SC, p = S(o.f, -o.hg - bob, o.z), r = 34 * k;
  main.globalAlpha = al;
  const g = main.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2.2); g.addColorStop(0, 'rgba(255,246,160,0.7)'); g.addColorStop(1, 'rgba(255,230,0,0)');
  main.fillStyle = g; main.fillRect(p[0] - r * 2.2, p[1] - r * 2.2, r * 4.4, r * 4.4);
  const sx = 0.35 + 0.65 * Math.abs(Math.cos(STL * 3 + o.seed));
  starPath(main, p[0], p[1], r, sx); main.fillStyle = '#ffe600'; main.fill(); main.strokeStyle = '#0b0b0f'; main.lineWidth = Math.max(1, 3 * k); main.lineJoin = 'round'; main.stroke();
  starPath(main, p[0] - r * 0.12 * sx, p[1] - r * 0.12, r * 0.42, sx); main.fillStyle = 'rgba(255,255,255,0.7)'; main.fill();
  main.globalAlpha = 1;
}
function drawPuff(d) {
  const k = kAt(d.f, d.y, d.z) * SC, p = S(d.f, d.y, d.z), r = d.r * k, a = d.a * Math.pow(1 - d.age / d.life, 1.6);
  if (r < 0.5 || a < 0.01) return;
  const g = main.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
  g.addColorStop(0, `rgba(226,196,146,${a})`); g.addColorStop(1, 'rgba(226,196,146,0)');
  main.fillStyle = g; main.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
}
function drawSpark(d) {
  const k = kAt(d.f, d.y, d.z) * SC, p = S(d.f, d.y, d.z), u = d.age / d.life, r = (14 + 26 * u) * k;
  main.globalAlpha = 1 - u; main.strokeStyle = '#ffe600'; main.lineWidth = Math.max(1, 3 * k * (1 - u)); main.lineCap = 'round';
  main.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + d.seed; main.moveTo(p[0] + Math.cos(a) * r * 0.45, p[1] + Math.sin(a) * r * 0.45); main.lineTo(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r); } main.stroke();
  main.globalAlpha = 1;
}
function drawRing(d) {                     // the roar leaving the leader's mouth, and the shock of a hit: a ring that widens and fades
  if (d.age < 0) return;
  const k = kAt(d.f, d.y, d.z) * SC, p = S(d.f, d.y, d.z), u = d.age / d.life, r = Math.max(0, d.r0 + d.r1 * smooth(u)) * k;
  main.globalAlpha = (1 - u) * 0.9; main.strokeStyle = d.c || '#fff4c2'; main.lineWidth = Math.max(1, (d.w || 7) * k * (1 - u * 0.7));
  main.beginPath(); main.ellipse(p[0], p[1], r, r * 0.8, 0, 0, TAU); main.stroke();
  main.globalAlpha = 1;
}
function drawBlast(b) {                    // a roar blast: a glowing ball of sound with a comet tail, in the cartoon's ink outline
  const k = kAt(b.f, b.y, b.z) * SC, p = S(b.f, b.y, b.z), t = S(b.f - 320, b.y + 10, b.z), r = 40 * k * (1 + 0.12 * Math.sin(b.age * 40));
  const fade = clamp((BLAST_RANGE - (b.f - b.f0)) / 600);
  main.globalAlpha = fade;
  const g = main.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2.8);
  g.addColorStop(0, 'rgba(255,240,150,0.85)'); g.addColorStop(1, 'rgba(255,170,40,0)');
  main.fillStyle = g; main.fillRect(p[0] - r * 2.8, p[1] - r * 2.8, r * 5.6, r * 5.6);
  main.lineCap = 'round';
  main.strokeStyle = 'rgba(255,170,40,0.55)'; main.lineWidth = r * 1.4; main.beginPath(); main.moveTo(t[0], t[1]); main.lineTo(p[0], p[1]); main.stroke();
  main.strokeStyle = 'rgba(255,246,200,0.9)'; main.lineWidth = r * 0.6; main.beginPath(); main.moveTo(lerp(t[0], p[0], 0.4), lerp(t[1], p[1], 0.4)); main.lineTo(p[0], p[1]); main.stroke();
  main.fillStyle = '#ffe600'; main.strokeStyle = '#0b0b0f'; main.lineWidth = Math.max(1, 3 * k);
  main.beginPath(); main.arc(p[0], p[1], r, 0, TAU); main.fill(); main.stroke();
  main.strokeStyle = '#ff8a1e'; main.lineWidth = Math.max(1, 3.4 * k);          // sound waves inside the ball
  for (const q of [0.38, 0.68]) { main.beginPath(); main.arc(p[0], p[1], r * q, -0.9, 0.9); main.stroke(); main.beginPath(); main.arc(p[0], p[1], r * q, Math.PI - 0.9, Math.PI + 0.9); main.stroke(); }
  main.fillStyle = 'rgba(255,255,255,0.8)'; main.beginPath(); main.ellipse(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.26, r * 0.16, -0.5, 0, TAU); main.fill();
  main.globalAlpha = 1;
}
function gemPath(c, x, y, r, sx) {          // a cut diamond: a flat top, a crown and a pointed base
  c.beginPath(); c.moveTo(x - r * 0.55 * sx, y - r * 0.62); c.lineTo(x + r * 0.55 * sx, y - r * 0.62); c.lineTo(x + r * sx, y - r * 0.15);
  c.lineTo(x, y + r); c.lineTo(x - r * sx, y - r * 0.15); c.closePath();
}
function drawGem(o, al) {
  const A = ARMORS[o.gem], bob = Math.sin(STL * 4 + o.seed) * 8, k = kAt(o.f, -o.hg, o.z) * SC, p = S(o.f, -o.hg - bob, o.z), r = 46 * k;
  const sx = 0.3 + 0.7 * Math.abs(Math.cos(STL * 2.4 + o.seed));
  main.globalAlpha = al;
  const g = main.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2.6); g.addColorStop(0, A.c2); g.addColorStop(0.35, A.c + 'aa'); g.addColorStop(1, A.c + '00');
  main.fillStyle = g; main.fillRect(p[0] - r * 2.6, p[1] - r * 2.6, r * 5.2, r * 5.2);
  gemPath(main, p[0], p[1], r, sx); main.fillStyle = A.c; main.fill();
  main.fillStyle = A.c2; main.beginPath(); main.moveTo(p[0] - r * 0.55 * sx, p[1] - r * 0.62); main.lineTo(p[0] + r * 0.2 * sx, p[1] - r * 0.62); main.lineTo(p[0] - r * 0.1 * sx, p[1] + r * 0.4); main.lineTo(p[0] - r * sx, p[1] - r * 0.15); main.closePath(); main.fill();
  main.strokeStyle = 'rgba(255,255,255,0.75)'; main.lineWidth = Math.max(1, 1.6 * k); main.beginPath(); main.moveTo(p[0] - r * sx, p[1] - r * 0.15); main.lineTo(p[0] + r * sx, p[1] - r * 0.15); main.stroke();
  gemPath(main, p[0], p[1], r, sx); main.strokeStyle = '#0b0b0f'; main.lineWidth = Math.max(1, 3.2 * k); main.lineJoin = 'round'; main.stroke();
  if (Math.sin(STL * 5 + o.seed) > 0.75) { main.fillStyle = '#fff'; starPath(main, p[0] + r * 0.4 * sx, p[1] - r * 0.6, r * 0.32, 1); main.fill(); }   // a glint
  main.globalAlpha = 1;
}
function drawSpit(s) {                       // a water ball or a mud ball flying at the pack, with drops trailing behind
  const k = kAt(s.f, s.y, s.z) * SC, p = S(s.f, s.y, s.z), r = 30 * k, water = s.kind === 'water';
  const C = water ? ['#7fd0ff', '#2f86d6', '#e8f8ff'] : ['#a0703c', '#5e3c1a', '#d8b48a'];
  for (let i = 1; i <= 3; i++) { const q = S(s.f + i * 70, s.y - 6 * i, s.z), rr = r * (0.5 - i * 0.1); main.fillStyle = C[1]; main.globalAlpha = 0.8 - i * 0.2; main.beginPath(); main.arc(q[0], q[1], rr, 0, TAU); main.fill(); }
  main.globalAlpha = 1;
  const g = main.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.3, r * 0.1, p[0], p[1], r);
  g.addColorStop(0, C[0]); g.addColorStop(1, C[1]);
  main.fillStyle = g; main.strokeStyle = '#0b0b0f'; main.lineWidth = Math.max(1, 3 * k);
  const wob = 1 + 0.1 * Math.sin(STL * 30 + s.seed);
  main.beginPath(); main.ellipse(p[0], p[1], r * wob, r / wob, 0, 0, TAU); main.fill(); main.stroke();
  main.fillStyle = C[2]; main.beginPath(); main.ellipse(p[0] - r * 0.35, p[1] - r * 0.38, r * 0.25, r * 0.15, -0.5, 0, TAU); main.fill();
}
// The armor: a glowing shell around the whole pack, in the diamond's color. Each shell is painted once into a
// picture of its own and only placed each frame: a big soft gradient redrawn 60 times a second costs more than the cats.
const shells = {};
function shellPic(kind) {
  if (shells[kind]) return shells[kind];
  const A = ARMORS[kind], w = 560, h = 400, rx = 250, ry = 170, [cv, c] = mk(w, h), x = w / 2, y = h / 2;
  const g = c.createRadialGradient(x, y, ry * 0.5, x, y, rx);
  g.addColorStop(0, A.c + '00'); g.addColorStop(0.8, A.c + '30'); g.addColorStop(1, A.c + '70');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
  c.strokeStyle = A.c; c.lineWidth = 7; c.lineJoin = 'round';
  if (kind === 'rock') c.setLineDash([24, 10]); else if (kind === 'mirror') c.setLineDash([42, 18]);
  c.beginPath();
  if (kind === 'triple') for (let i = 0; i <= 64; i++) { const t = i / 64 * TAU, q = 1 + 0.07 * Math.sin(t * 11); c.lineTo(x + Math.cos(t) * rx * q, y + Math.sin(t) * ry * q); }   // flames
  else c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.closePath(); c.stroke(); c.setLineDash([]);
  c.strokeStyle = A.c2; c.lineWidth = 5; c.beginPath(); c.ellipse(x, y, rx * 0.9, ry * 0.88, 0, Math.PI * 1.1, Math.PI * 1.45); c.stroke();   // shine
  return (shells[kind] = { cv, w, h, rx, ry });
}
function drawArmor() {
  const a = run.armor, A = ARMORS[a.kind], left = a.until - STL, P = shellPic(a.kind);
  const al = (left < 2 ? (Math.floor(STL * 8) % 2 ? 0.35 : 1) : 1) * clamp((STL - a.t0) / 0.25);
  const c = S(-110, -150, packZ), k = kAt(-110, -150, packZ) * SC, sx = 330 * k / P.rx * (1 + 0.025 * Math.sin(STL * 9)), sy = 230 * k / P.ry;
  main.globalAlpha = al;
  main.save(); main.translate(c[0], c[1]);
  if (a.kind === 'rock' || a.kind === 'mirror') main.rotate(Math.sin(STL * 3) * 0.04);     // a slow wobble instead of moving dashes
  main.drawImage(P.cv, -P.w / 2 * sx, -P.h / 2 * sy, P.w * sx, P.h * sy);
  main.restore();
  if (a.kind === 'bubble') for (let i = 0; i < Math.min(a.hits, 3); i++) { main.fillStyle = A.c2; main.strokeStyle = '#0b0b0f'; main.lineWidth = Math.max(1, 2 * k); main.beginPath(); main.arc(c[0] + (i - (Math.min(a.hits, 3) - 1) / 2) * 26 * k, c[1] - 230 * k - 18 * k, 8 * k, 0, TAU); main.fill(); main.stroke(); }   // hits left
  main.globalAlpha = 1;
}
function drawComic() {
  const sp = clamp((packV - 700) / 600) * (state === 'run' ? 1 : 0.5) * (REDUCE ? 0.4 : 1);
  if (sp > 0.02 && cam.yaw > 60) {          // speed lines streaming out from where the trail meets the sky
    const vp = S(40000, 0, CAMZ), r = rng(Math.floor(STL * 14)), M = Math.hypot(CW, CH);
    main.strokeStyle = `rgba(255,255,255,${0.32 * sp})`; main.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, r0 = M * (0.36 + r() * 0.2), r1 = r0 + M * (0.12 + r() * 0.22);
      main.lineWidth = (1 + r() * 2.5) * DPR; main.beginPath(); main.moveTo(vp[0] + Math.cos(a) * r0, vp[1] + Math.sin(a) * r0); main.lineTo(vp[0] + Math.cos(a) * r1, vp[1] + Math.sin(a) * r1); main.stroke();
    }
  }
  const v = main.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.45, CW / 2, CH / 2, Math.hypot(CW, CH) * 0.62);
  v.addColorStop(0, 'rgba(60,30,0,0)'); v.addColorStop(1, 'rgba(60,30,0,0.28)');
  main.fillStyle = v; main.fillRect(0, 0, CW, CH);
  if (flash > 0.01) { main.fillStyle = `rgba(255,255,255,${flash})`; main.fillRect(0, 0, CW, CH); }
}

function render() {
  setCamera();
  drawSky(); drawGround(); drawTrail(); drawDecor();
  const items = [];
  for (const tr of TREES) {
    const f = wrapF(tr.wf, SPAN_T, 1500);
    if (!inFront(f, tr.z)) continue;
    const d = depthOf(f, tr.z), lat = Math.abs(f * RC + (tr.z - CAMZ) * RS), nf = d < 0 ? clamp((lat - 320) / 320) : 1;   // trees fade rather than block the cats
    const al = nf * clamp(1 - (f - 4800) / 1200);
    if (al > 0.01) items.push({ d, draw: () => drawTree(f, tr, al) });
  }
  const beasts = [];
  for (const o of obs) {
    const herd = o.kind === 'elephant' || o.kind === 'buffalo', al = clamp(1 - (o.f - 4300) / 900) * o.alpha;
    if (!inFront(o.f, o.z, -100) || al <= 0.01) continue;
    const d = depthOf(o.f, o.z) + (pickup(o) ? -1 : 0), bj = herd ? beastJob(o) : null;
    if (bj) beasts.push(bj);
    items.push({ d, draw: o.kind === 'boulder' ? () => drawBoulder(o, al) : o.kind === 'log' ? () => drawLog(o, al) : o.kind === 'star' ? () => drawStar(o, al) : o.kind === 'gem' ? () => drawGem(o, al) : crew.length ? () => drawPic(bj, al) : () => drawBeastHere(bj, al) });
  }
  for (const p of puffs) if (inFront(p.f, p.z, p.y)) items.push({ d: depthOf(p.f, p.z) - 30, draw: () => (p.ring ? drawRing(p) : p.spark ? drawSpark(p) : drawPuff(p)) });
  for (const b of blasts) if (inFront(b.f, b.z, b.y)) items.push({ d: depthOf(b.f, b.z) - 40, draw: () => drawBlast(b) });
  const box = catBox(), blink = STL < run.inv && state === 'run' ? (Math.floor(STL * 12) % 2 ? 0.45 : 1) : 1;
  const cats = PACK.map((c, i) => catJob(c, i, box));
  paintAnimals(cats, beasts);
  PACK.forEach((c, i) => items.push({ d: depthOf(c.fx, c.z), draw: () => drawPic(cats[i], blink) }));
  for (const s of spits) if (inFront(s.f, s.z, s.y)) items.push({ d: depthOf(s.f, s.z) - 40, draw: () => drawSpit(s) });
  if (run.armor && state !== 'title') items.push({ d: Math.min(...PACK.map(c => depthOf(c.fx, c.z))) - 50, draw: drawArmor });   // over the pack
  items.sort((a, b) => b.d - a.d);
  for (const it of items) it.draw();
  drawComic();
  frameN++;
}

// ---- the round --------------------------------------------------------------------------
let state = 'title', stateT = 0, paused = false, packV = 0, packZ = 0;
let threat = [params.get('threat'), store.get('packrun.threat')].find(t => THREATS[t]) || 'elephants';   // ?threat=buffalo picks one, for testing
const obs = [], puffs = [], blasts = [], spits = [];
const pickup = o => o.kind === 'star' || o.kind === 'gem';
const run = { t: 0, dist: 0, stars: 0, paws: 3, inv: 0, lane: MID, jumpT: -9, jumpBuf: -9, fireT: -9, fireBuf: -9, next: 0, nextLog: 0, wave: 0, lastRow: -9, rnd: rng(1), hinted: false, combo: 0, won: false, slow: 0, bonus: 0, spooked: 0, popT: -9, armor: null, nextGem: 0, spitT: 0, cancels: 0, gems: 0 };
const progress = () => clamp(run.t / ROUND);
const airborne = () => { const J = (STL - run.jumpT) / JD; return J > 0.14 && J < 0.9; };
const scoreNow = () => Math.floor(run.dist / 100) + run.stars * 25 + run.bonus + (run.won ? 200 : 0);

function setState(s) { state = s; stateT = STL; root.dataset.state = s; }
// Counting players: one anonymous random number kept in this browser, sent when a round starts and ends
// (to /api/play.php; the numbers show on the site's admin page). No name, no cookie, nothing else about the player.
const PLAYER = (() => {
  let id = store.get('packrun.player');
  if (!/^[a-f0-9]{32}$/.test(id || '') && window.crypto && crypto.getRandomValues) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    store.set('packrun.player', id);
  }
  return id;
})();
const COUNT = PLAYER && !SHOT && !BOT && (location.protocol === 'https:' || params.has('count')) && navigator.sendBeacon;
function tell(event, extra) {
  if (!COUNT) return;
  try { navigator.sendBeacon('/api/play.php', JSON.stringify({ id: PLAYER, event, threat, ...extra })); } catch (e) { /* counting never gets in the way of playing */ }
}
function startRound() {
  if (state === 'go' || state === 'run') return;
  sound.unlock();
  Object.assign(run, { t: 0, dist: 0, stars: 0, paws: 3, inv: 0, lane: MID, jumpT: -9, jumpBuf: -9, fireT: -9, fireBuf: -9, next: 1.2, nextLog: 2.4, wave: 0, lastRow: -9, lastGap: MID, botT: 0, rnd: rng(SHOT ? 7 : (Date.now() & 0xffffff)), hinted: false, combo: 0, won: false, slow: 0, bonus: 0, spooked: 0, popT: -9, armor: null, nextGem: 5 + Math.random() * 2, spitT: 6, cancels: 0, gems: 0, warned: false });
  for (const o of obs) dropPic('b' + o.id);
  obs.length = 0; blasts.length = 0; spits.length = 0;
  setState('go');
  camGo(CAMS.run, REDUCE ? 0.5 : 1.5);
  show(null); hud(true); updateHud(true);
  stage.focus({ preventScroll: true });
  pop(THREATS[threat].pop, { big: true, hue: threat === 'boulders' ? 'zap' : 'hot' });
  sound.go(); sound.music(true);
  const forced = params.get('armor');          // ?armor=bubble wears one armor all round, for testing
  if (ARMORS[forced]) run.armor = { kind: forced, t0: STL, until: 1e9, hits: ARMORS[forced].hits || 0 };
  tell('start');
}
function finish(won) {
  run.won = won;
  setState('over');
  camGo(CAMS.title, REDUCE ? 0.6 : 2.2);
  pop(won ? 'PHEW!' : 'SO CLOSE!', { big: true, hue: won ? 'pop' : 'hot' });
  won ? sound.win() : sound.lose();
  sound.music(false);
  for (const o of obs) o.leaving = true;
  for (const sp of spits) sp.dead = true;
  run.armor = null;
  const score = scoreNow(), key = 'packrun.best.' + threat, best = +(store.get(key) || 0), isBest = score > best;
  if (isBest) store.set(key, String(score));
  tell('finish', { score, won });
  setTimeout(() => endScreen(score, Math.max(best, score), isBest && score > 0), REDUCE ? 500 : 1500);
}

// threats come in waves; every wave leaves at least one lane open unless the whole pack can jump it
const ALL_LANES = Array.from({ length: LANES }, (_, i) => i);
function spawnWave() {
  const T = THREATS[threat], r = run.rnd, pg = progress(), lanes = ALL_LANES;
  run.wave++;
  if (T.kind === 'boulder') {
    const row = run.t - run.lastRow > 3.2 && r() < lerp(0.18, 0.4, pg) && run.wave > 2;
    const near = shuffle(lanes.filter(l => Math.abs(l - run.lane) <= 1), r), rest = shuffle(lanes.filter(l => Math.abs(l - run.lane) > 1), r);
    const n = row ? LANES : 1 + (r() < lerp(0.3, 0.6, pg) ? 1 : 0) + (r() < lerp(0.1, 0.45, pg) ? 1 : 0);
    const pick = row ? lanes : (r() < 0.75 ? near.concat(rest) : rest.concat(near)).slice(0, n), big = !row && r() < 0.25;   // mostly at the pack
    if (row) run.lastRow = run.t;
    const v = T.v + r() * 80;
    for (const l of pick) obs.push(mkObs('boulder', l, F_SPAWN, { v, r: row ? 50 + r() * 6 : big ? 84 : 58 + r() * 10 }));
    const meet = F_SPAWN * packV / (packV + v);                    // where the boulders will be when they reach the pack
    if (r() < 0.6) for (let i = 0; i < 3; i++) obs.push(mkObs('star', pick[0], meet + (i - 1) * 140, { hg: [70, 165, 70][i] }));   // an arc of stars over a boulder
    if (row && !run.hinted) hint('JUMP!');
    return;
  }
  // the open lane drifts at most a lane or two from the last one, so it can always be reached
  const first = run.wave === 1;
  const gap = first ? (run.lane < MID ? run.lane + 1 : run.lane - 1) : r() < 0.6 ? pickNear(run.lastGap ?? MID, r) : clamp(run.lastGap + Math.round((r() - 0.5) * 4), 0, LANES - 1);
  const n = first ? 1 : Math.min(LANES - 1, 1 + Math.floor(r() * lerp(T.block[0], T.block[1], pg)));
  const others = shuffle(lanes.filter(l => l !== gap), r);
  if (others.includes(run.lane) && r() < 0.7) others.unshift(...others.splice(others.indexOf(run.lane), 1));   // usually aimed at the pack
  const blocked = first ? [run.lane] : others.slice(0, n);
  run.lastGap = gap;
  for (const l of blocked) {
    // a wide wave sends fewer animals down each lane, so the herd on screen stays about the same size
    const herd = T.kind === 'buffalo' ? (n <= 2 ? 2 + (r() < pg ? 1 : 0) : 1 + (r() < 0.45 ? 1 : 0)) : 1 + (n <= 2 && r() < pg * 0.45 ? 1 : 0);
    for (let i = 0; i < herd; i++) obs.push(mkObs(T.kind, l, F_SPAWN + r() * 160 + i * (T.kind === 'buffalo' ? 210 + r() * 80 : 430), { v: T.v + r() * 60, size: T.kind === 'buffalo' ? 0.95 + r() * 0.15 : 0.96 + r() * 0.14, dz: (r() - 0.5) * (T.kind === 'buffalo' ? 70 : 30) }));
  }
  const free = lanes.filter(l => !blocked.includes(l));
  const sl = free[Math.floor(r() * free.length)];
  const vClose = packV + T.v, tArr = F_SPAWN / vClose;           // stars wait in an open lane for the moment the herd arrives
  for (let i = 0; i < 4; i++) obs.push(mkObs('star', sl, tArr * packV - 120 + i * 150, { hg: 60 }));
  if (T.kind === 'elephant') sound.trumpet((blocked[0] - run.lane) / 2); else sound.snort();
  if (run.wave === 1) hint(T.hint);
  if (run.wave === 3) hint('TAP TO ROAR!', 'SPACE TO ROAR!');
}
function spawnLog() {
  const r = run.rnd, l = Math.floor(r() * LANES), f = 4800;
  // keep logs clear of the moment a herd goes by
  const tLog = f / packV;
  for (const o of obs) if (o.kind === THREATS[threat].kind && Math.abs(o.f / (packV + o.v) - tLog) < 0.7) return;
  obs.push(mkObs('log', l, f, {}));
  for (let i = 0; i < 3; i++) obs.push(mkObs('star', l, f - 170 + i * 170, { hg: [60, 150, 60][i] }));
}
const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickNear = (g, r) => clamp(g + (r() < 0.5 ? -1 : 1), 0, LANES - 1);
let SEEDN = 0;
function mkObs(kind, lane, f, o) {
  const tough = TOUGH[kind], hp = tough ? tough.hp + (kind === 'boulder' && o.r > 80 ? 1 : 0) : 0;   // a big boulder takes one roar more
  return { hp, id: SEEDN, dim: { w: 0, h: 0 }, kind, lane, f, fPrev: f, z: laneZ(lane) + (o.dz || 0), v: o.v || 0, size: o.size || 1, r: o.r || 0, hg: o.hg || 0, D: 0, ph: (SEEDN * 0.37) % 1, seed: (SEEDN++ * 2.3) % 7, roll: 0, alpha: 1, hit: false, leaving: false, dust: 0 };
}
function extent(o) {                       // [front, back] along the trail and half the width, for bumping into it
  if (o.kind === 'elephant') return [-(BEASTS.elephant.L + 110) * o.size, BEASTS.elephant.L * o.size, 92 * o.size];
  if (o.kind === 'buffalo') return [-(BEASTS.buffalo.L + 80) * o.size, BEASTS.buffalo.L * o.size, 68 * o.size];
  if (o.kind === 'boulder') return [-o.r, o.r, o.r * 0.95];
  if (o.kind === 'log') return [-26, 26, 118];
  return [-60, 60, 105];
}
function bump(o) {
  o.hit = true; o.leaving = true;                 // whatever bumped the pack swerves off the trail
  run.paws--; run.inv = STL + 1.5; run.slow = 1; run.combo = 0;
  shake = REDUCE ? 0 : 1; flash = 0.35;
  pop(['BUMP!', 'OOF!', 'WHOA!'][run.paws % 3], { hue: 'hot' });
  sound.bump(); updateHud();
  if (run.paws <= 0) finish(false);
}
function collect(o) {
  o.hit = true; o.alpha = 0; run.stars++; run.combo++;
  puffs.push({ spark: true, f: o.f, y: -o.hg, z: o.z, age: 0, life: 0.45, seed: o.seed });
  sound.star(run.combo);
  if (run.combo % 8 === 0) pop('STAR STREAK!', { hue: 'zap' });
  bumpChip();
}
// a roar blast reaches something on the trail: it is knocked back a little, and after enough roars it gives up
function roarHit(o, b) {
  const [lo] = extent(o), y = o.kind === 'log' ? -40 : o.kind === 'boulder' ? -o.r : -150;
  b.dead = true; o.hp--;
  o.f += o.kind === 'elephant' ? 70 : 110; o.v *= 0.8;                       // the roar pushes it back up the trail
  puffs.push({ ring: true, f: o.f + lo, y, z: o.z, r0: 30, r1: 150, w: 9, c: '#ffe600', age: 0, life: 0.35 });
  puffs.push({ spark: true, f: o.f + lo, y, z: o.z, age: 0, life: 0.4, seed: o.seed + o.hp });
  if (o.hp > 0) { sound.thud(); return; }
  clearIt(o);
}
// it gives up: an animal turns tail and runs off, a boulder or a log cracks apart (rammed: rock armor ran into it)
function clearIt(o, rammed) {
  const tough = TOUGH[o.kind];
  if (!tough) return;
  if (rammed) { shake = REDUCE ? 0 : 0.5; puffs.push({ ring: true, f: o.f + extent(o)[0], y: -120, z: o.z, r0: 40, r1: 180, w: 10, c: ARMORS.rock.c, age: 0, life: 0.35 }); }
  o.hp = 0; o.leaving = true; o.spooked = true; run.spooked++; run.bonus += tough.pts; bumpChip();
  if (o.kind === 'boulder' || o.kind === 'log') {               // it cracks apart into a cloud of dust and chips
    o.alpha = Math.min(o.alpha, 0.5);
    for (let i = 0; i < 9; i++) puffs.push({ f: o.f + (Math.random() - 0.5) * 120, y: -20 - Math.random() * 80, z: o.z + (Math.random() - 0.5) * 160, r: 40 + Math.random() * 50, a: 0.6, age: 0, life: 0.8 + Math.random() * 0.5, vy: -40 });
    sound.crack();
  } else {                                                      // it turns tail and runs off the trail
    o.v = Math.min(o.v, 120);
    sound.spook(o.kind);
  }
  if (STL - run.popT > 0.7) { run.popT = STL; pop(`${tough.word} +${tough.pts}`, { hue: o.kind === 'boulder' || o.kind === 'log' ? 'zap' : 'pop', small: true }); }
}

// ---- diamonds and armor --------------------------------------------------------------------
function spawnGem() {
  const r = run.rnd, kinds = ARMOR_KEYS.filter(k => !run.armor || k !== run.armor.kind);
  const gem = kinds[Math.floor(r() * kinds.length)];
  const l = THREATS[threat].kind === 'boulder' ? Math.floor(r() * LANES) : run.lastGap;        // in the open lane, where the pack can reach it
  obs.push(mkObs('gem', l, 4900, { hg: 70 }));
  obs[obs.length - 1].gem = gem;
}
function grabGem(o) {
  o.hit = true; o.alpha = 0; run.gems++;
  const A = ARMORS[o.gem];
  run.armor = { kind: o.gem, t0: STL, until: STL + A.dur, hits: A.hits || 0 };
  for (let i = 0; i < 3; i++) puffs.push({ ring: true, stay: true, f: -110, y: -150, z: packZ, r0: 60 + i * 40, r1: 260, w: 8, c: A.c, age: -i * 0.08, life: 0.5 });
  pop(A.name.toUpperCase() + '!', { hue: 'zap', big: false });
  sound.gem(); updateHud(true);
}
function armorHit() {                       // the bubble takes a hit; after its last one it pops
  const a = run.armor;
  puffs.push({ ring: true, stay: true, f: -110, y: -150, z: packZ, r0: 200, r1: 120, w: 10, c: ARMORS[a.kind].c2, age: 0, life: 0.3 });
  sound.block();
  if (a.kind === 'bubble' && --a.hits <= 0) { run.armor = null; pop('POP!', { hue: 'hot', small: true }); updateHud(true); }
}
function shielded(o) {                      // something runs into the pack: the bubble can take it instead of a paw
  if (!run.armor || run.armor.kind !== 'bubble') return false;
  o.hit = true; o.leaving = true; flash = 0.15;
  armorHit();
  return true;
}
// ---- the herds shoot back ----------------------------------------------------------------------
function enemyFire(dt) {
  if (run.t < run.spitT) return;
  const pg = progress(), lead = PACK[0].fx;
  // only animals charging down the pack's lane or one next to it, far enough off to give the player time
  const can = obs.filter(o => SPIT[o.kind] && !o.leaving && !o.hit && Math.abs(o.lane - run.lane) <= 1 && o.f - lead > 1700 && o.f - lead < 4200);
  if (!can.length || run.rnd() > dt * lerp(1.2, 2.6, pg)) return;
  const o = can[Math.floor(run.rnd() * can.length)], sp = SPIT[o.kind], [lo] = extent(o);
  spits.push({ kind: sp.kind, f: o.f + lo, fPrev: o.f + lo, y: sp.y, z: o.z, v: o.v + sp.v, seed: Math.random() * 9, dead: false });
  run.spitT = run.t + lerp(1.1, 0.55, pg);
  if (!run.warned) { run.warned = true; pop('INCOMING!', { hue: 'hot', small: true }); }
  sound.spit(sp.kind, (o.lane - run.lane) / 2);
}
function cancel(b, s) {                     // a roar and a ball meet: both burst in a shower of sparks
  b.dead = true; s.dead = true; run.cancels++; run.bonus += 5;
  puffs.push({ ring: true, f: s.f, y: s.y, z: s.z, r0: 20, r1: 120, w: 8, c: s.kind === 'water' ? '#bfe9ff' : '#e0c090', age: 0, life: 0.3 });
  puffs.push({ spark: true, f: s.f, y: s.y, z: s.z, age: 0, life: 0.4, seed: s.seed });
  sound.cancel();
}
function spitHits(s) {                      // a ball reaches the pack
  s.dead = true;
  const a = run.armor;
  if (a && a.kind === 'mirror') {           // and bounces straight back up the trail as a roar
    const z = laneZ(clamp(Math.round(s.z / LANE + MID), 0, LANES - 1));
    blasts.push({ f: s.f + 40, f0: s.f + 40, fPrev: s.f + 40, y: s.y, z: s.z, zT: z, age: 0, dead: false });
    puffs.push({ ring: true, stay: true, f: s.f, y: s.y, z: s.z, r0: 20, r1: 110, w: 7, c: ARMORS.mirror.c, age: 0, life: 0.3 });
    sound.block(); return;
  }
  if (a && a.kind === 'rock') { puffs.push({ spark: true, f: s.f, y: s.y, z: s.z, age: 0, life: 0.4, seed: s.seed }); sound.block(); return; }   // it just splats on the rock
  if (a && a.kind === 'bubble') { armorHit(); return; }
  if (STL < run.inv) return;
  bump(s);
}

function update(dt) {
  STL += dt;
  camStep();
  // speed
  let target = 0;
  if (state === 'go') target = 980 * smooth(clamp((STL - stateT) / 1.2));
  else if (state === 'run') target = lerp(980, 1380, progress()) * (1 - 0.45 * run.slow);
  packV = state === 'over' ? packV * Math.exp(-1.6 * dt) * (packV < 40 ? 0 : 1) : lerp(packV, target, 1 - Math.exp(-6 * dt));
  run.slow = Math.max(0, run.slow - dt * 0.9);
  growTab(STL, packV);
  SD += packV * dt;
  // lanes: the pack slides over; the others follow the leader a beat later
  const zT = laneZ(run.lane);
  packZ = lerp(packZ, zT, 1 - Math.exp(-15 * dt));
  for (const c of PACK) {
    const z0 = c.z; c.z = lerp(c.z, packZ + c.dz, 1 - Math.exp(-c.rate * dt));
    c.vz = lerp(c.vz, (c.z - z0) / Math.max(dt, 1e-3), 1 - Math.exp(-12 * dt));
    c.turn = clamp(-c.vz * 0.016, -24, 24);
  }
  CAMZ = packZ * cam.follow;
  // play
  if (state === 'go' && STL - stateT > 1.5) { setState('run'); pop('RUN!', { hue: 'pop' }); }
  if (state === 'run') {
    run.t += dt; run.dist += packV * dt;
    if (BOT || SHOT) bot();
    if (run.t < ROUND - 2.4) {
      if (run.t >= run.next) { spawnWave(); const T = THREATS[threat]; run.next = run.t + lerp(T.every[0], T.every[1], progress()) * (0.9 + run.rnd() * 0.2); }
      if (THREATS[threat].logs && run.t >= run.nextLog) { if (run.rnd() < THREATS[threat].logs) spawnLog(); run.nextLog = run.t + 1.6 + run.rnd() * 1.4; }
    }
    if (run.t >= ROUND) finish(true);
    if (run.jumpBuf > STL - 0.16 && (STL - run.jumpT) / JD > 0.88) jump();
    if (run.fireBuf > STL - 0.16 && STL - run.fireT >= BLAST_CD) fire();
    if (run.t < ROUND - 3 && run.t >= run.nextGem) { spawnGem(); run.nextGem = run.t + 7 + run.rnd() * 3; }
    enemyFire(dt);
    if (run.armor && STL > run.armor.until) { run.armor = null; updateHud(true); }
  }
  // enemy balls fly at the pack
  const zA = PACK[0].fx - 60, zB = PACK[0].fx + 90;
  for (const s of spits) {
    s.fPrev = s.f; s.f -= (packV + s.v) * dt;
    if (s.f < -900) { s.dead = true; continue; }
    if (state === 'run' && !s.dead && s.f < zB && s.fPrev > zA - 40 && Math.abs(s.z - packZ) < 110 && !airborne()) spitHits(s);   // jumping clears them
  }
  // roar blasts fly down their lane, straight at whatever is coming
  for (const b of blasts) {
    b.fPrev = b.f; b.f += BLAST_V * dt; b.age += dt; b.z = lerp(b.z, b.zT, 1 - Math.exp(-16 * dt)); b.y = lerp(b.y, -120, 1 - Math.exp(-5 * dt));
    if (b.f - b.f0 > BLAST_RANGE) { b.dead = true; continue; }
    let hit = null, best = 1e9;
    for (const o of obs) {
      if (pickup(o) || o.hit || o.leaving || !o.hp) continue;
      const [lo, hi, hw] = extent(o);
      if (Math.abs(o.z - b.z) > hw + 34) continue;
      if (b.f > o.f + lo && b.fPrev < o.f + hi + (packV + o.v) * dt && o.f + lo < best) { hit = o; best = o.f + lo; }   // the nearest thing it reaches
    }
    let ball = null;
    for (const s of spits) {                 // a ball coming the other way down the same lane: they cancel out
      if (s.dead || Math.abs(s.z - b.z) > 80) continue;
      if (b.f + 40 >= s.f && b.fPrev - 40 <= s.fPrev && s.f < best) { ball = s; best = s.f; }
    }
    if (ball) cancel(b, ball); else if (hit) roarHit(hit, b);
  }
  for (let i = blasts.length - 1; i >= 0; i--) if (blasts[i].dead) blasts.splice(i, 1);
  for (let i = spits.length - 1; i >= 0; i--) if (spits[i].dead) spits.splice(i, 1);
  // threats move
  const air = airborne(), lead = PACK[0], zoneA = lead.fx - 60, zoneB = lead.fx + 90;
  for (const o of obs) {
    o.fPrev = o.f; o.f -= (packV + o.v) * dt; o.D += o.v * dt;
    if (o.kind === 'boulder') o.roll += (o.v + 0.2 * packV) * dt / Math.max(20, o.r);
    if (o.leaving) { o.alpha -= dt * 2.2; if (!pickup(o)) o.z += Math.sign(o.z - packZ || 1) * 900 * dt; }
    if (!pickup(o) && o.kind !== 'log' && o.v > 0 && o.f < 5200 && o.alpha > 0.3) {          // dust thrown up behind the charge
      o.dust += dt * (o.kind === 'boulder' ? 9 : o.kind === 'buffalo' ? 16 : 12);
      while (o.dust > 1) { o.dust--; const [, back, hw] = extent(o); puffs.push({ f: o.f + back * 0.7, y: -12 - Math.random() * 30, z: o.z + (Math.random() - 0.5) * hw * 2, r: 50 + Math.random() * 60, a: 0.45, age: 0, life: 1.1 + Math.random() * 0.6, vy: -20 }); }
    }
    if (state !== 'run' || o.hit || o.leaving) continue;
    const [lo, hi, hw] = extent(o), a = Math.min(o.f, o.fPrev) + lo, b = Math.max(o.f, o.fPrev) + hi;
    if (b < zoneA || a > zoneB) continue;
    if (pickup(o)) { if (Math.abs(o.z - packZ) < hw && (o.hg < 100 || air)) (o.kind === 'gem' ? grabGem : collect)(o); continue; }
    if (Math.abs(o.z - packZ) > hw + 62) continue;
    if ((o.kind === 'boulder' || o.kind === 'log') && air) continue;
    if (run.armor && run.armor.kind === 'rock') { clearIt(o, true); continue; }      // rock armor: the pack plows straight through
    if (STL < run.inv) continue;
    if (shielded(o)) continue;
    bump(o);
  }
  for (let i = obs.length - 1; i >= 0; i--) { const o = obs[i]; if (o.f < -CH_D * 0.9 || o.alpha <= 0) { obs.splice(i, 1); dropPic('b' + o.id); } }
  // dust kicked back by the cats
  if (packV > 300) for (const c of PACK) if (Math.random() < dt * 7) puffs.push({ f: c.fx - 120, y: -8, z: c.z + (Math.random() - 0.5) * 60, r: 26 + Math.random() * 26, a: 0.35, age: 0, life: 0.7, vy: -10 });
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]; p.age += dt; if (!p.stay) p.f -= packV * dt; if (!p.spark && !p.ring) { p.r += 40 * dt; p.y += (p.vy || 0) * dt; }
    if (p.age > p.life) puffs.splice(i, 1);
  }
  if (puffs.length > 160) puffs.splice(0, puffs.length - 160);
  // camera shake: a bump, and the ground trembling as a herd thunders past
  let near = 0;
  for (const o of obs) if (o.kind === 'elephant' || o.kind === 'buffalo' || o.kind === 'boulder') near = Math.max(near, clamp(1 - Math.abs(o.f) / 1600) * clamp(1 - Math.abs(o.z - packZ) / 900));
  sound.rumble(state === 'run' ? near : 0);
  shake = Math.max(0, shake - dt * 2.4);
  const amp = REDUCE ? 0 : (shake * 14 + near * 2.2) * DPR;
  shakeX = amp * (Math.sin(STL * 47.1) + 0.6 * Math.sin(STL * 31.7 + 1.3)); shakeY = amp * (Math.sin(STL * 41.3 + 0.7) + 0.5 * Math.sin(STL * 27.1 + 2.1));
  flash = Math.max(0, flash - dt * 2.5);
  for (let i = JUMPS.length - 1; i >= 0; i--) if (JUMPS[i].t < STL - 3) JUMPS.splice(i, 1);
  if (state === 'run' || state === 'go') updateHud();
}

// ---- moves -------------------------------------------------------------------------------
const canMove = () => (state === 'run' || state === 'go') && !paused;
function steer(d) {
  if (!canMove()) return;
  const l = clamp(run.lane + d, 0, LANES - 1);
  if (l !== run.lane) { run.lane = l; sound.swish(d * 0.6 + (l - MID) * 0.15); }
}
function fire() {                          // the leader roars: a blast flies straight down the lane the pack is heading into
  if (!canMove() || state !== 'run') return;
  if (STL - run.fireT < BLAST_CD) { run.fireBuf = STL; return; }
  run.fireT = STL; run.fireBuf = -9;
  const lead = PACK[0], y = airborne() ? -300 : -190;
  const lanes = run.armor && run.armor.kind === 'triple' ? [run.lane - 1, run.lane, run.lane + 1].filter(l => l >= 0 && l < LANES) : [run.lane];
  for (const l of lanes) blasts.push({ f: lead.fx + 130, f0: lead.fx + 130, fPrev: lead.fx + 130, y, z: lead.z, zT: laneZ(l), age: 0, dead: false });
  puffs.push({ ring: true, stay: true, f: lead.fx + 110, y, z: lead.z, r0: 20, r1: 90, w: 6, age: 0, life: 0.3 });
  sound.roar();
}
function jump() {
  if (!canMove()) return;
  if ((STL - run.jumpT) / JD < 0.88) { run.jumpBuf = STL; return; }
  run.jumpT = STL; run.jumpBuf = -9;
  JUMPS.push({ t: STL, D: JD, amp: 1.2, sp: clamp(0.57 * packV * JD, 260, 560) });
  sound.jump();
  setTimeout(() => sound.land(), JD * 650);
}
function bot() {                           // plays by itself with ?bot, for testing
  run.botT = run.botT || 0;
  const lead = PACK[0].fx, ahead = obs.filter(o => !o.hit && o.f - lead > -80 && o.f - lead < 1500 && !pickup(o));
  const blockedIn = l => ahead.some(o => o.lane === l && (o.kind === 'elephant' || o.kind === 'buffalo') && o.f - lead < 1300);
  if (STL > run.botT && blockedIn(run.lane)) {
    const best = [run.lane - 1, run.lane + 1].filter(l => l >= 0 && l < LANES && !blockedIn(l));
    if (best.length) { steer(best[0] - run.lane); run.botT = STL + 0.2; }
    else { const open = ALL_LANES.filter(l => !blockedIn(l)).sort((a, b) => Math.abs(a - run.lane) - Math.abs(b - run.lane)); if (open.length) { steer(Math.sign(open[0] - run.lane)); run.botT = STL + 0.16; } }
  }
  const gem = obs.find(o => o.kind === 'gem' && !o.hit && o.f - lead > 300 && o.f - lead < 2600);
  if (gem && STL > run.botT && gem.lane !== run.lane && !blockedIn(run.lane + Math.sign(gem.lane - run.lane))) { steer(Math.sign(gem.lane - run.lane)); run.botT = STL + 0.25; }
  if (spits.some(sp => Math.abs(sp.z - packZ) < 120 && sp.f - lead < 2600)) fire();
  if (obs.some(o => o.hp > 0 && !o.hit && !o.leaving && o.lane === run.lane && o.f - lead > 0 && o.f - lead < 3200)) fire();   // and roars at whatever is in its lane
  for (const o of ahead) if ((o.kind === 'boulder' || o.kind === 'log') && o.lane === run.lane) { const tt = (o.f - lead) / (packV + o.v); if (tt > 0.12 && tt < 0.3) jump(); }
}

// ---- input: swipes and taps on the stage, arrow keys anywhere while the game is on screen ----
let touch = null;
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('button, a, input, label') || !canMove()) return;
  touch = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), used: false };
  if (e.pointerType !== 'mouse') e.preventDefault();
});
stage.addEventListener('pointermove', e => {
  if (!touch || touch.used || e.pointerId !== touch.id) return;
  const dx = e.clientX - touch.x, dy = e.clientY - touch.y, th = Math.max(24, Math.min(stage.clientWidth, stage.clientHeight) * 0.05);
  if (Math.abs(dx) > th && Math.abs(dx) > Math.abs(dy) * 0.9) { steer(Math.sign(dx)); touch.used = true; }
  else if (-dy > th && -dy > Math.abs(dx)) { jump(); touch.used = true; }
});
const lift = e => {
  if (!touch || e.pointerId !== touch.id) return;
  const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
  if (!touch.used && e.type === 'pointerup' && Math.hypot(dx, dy) < 22 && performance.now() - touch.t < 450) fire();   // a tap roars
  touch = null;
};
stage.addEventListener('pointerup', lift); stage.addEventListener('pointercancel', lift);
const KEYS = { ArrowLeft: () => steer(-1), KeyA: () => steer(-1), ArrowRight: () => steer(1), KeyD: () => steer(1), ArrowUp: jump, KeyW: jump, Space: fire, KeyF: fire, KeyJ: fire };
const HOLD = new Set(['ArrowLeft', 'ArrowRight', 'Space', 'KeyF', 'KeyJ']);      // keys that repeat while held (a held roar key keeps roaring)
addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || !visible) return;
  if (e.target.closest && e.target.closest('input, textarea, select') && !e.target.closest('#pack-run')) return;
  if (canMove() && KEYS[e.code]) { e.preventDefault(); if (!e.repeat || HOLD.has(e.code)) KEYS[e.code](); return; }
  if ((e.code === 'KeyP' || e.code === 'Escape') && (state === 'run' || state === 'go')) { e.preventDefault(); setPaused(!paused); return; }
  if (e.code === 'KeyM') { sound.toggle(); return; }
  if ((e.code === 'Enter' || e.code === 'Space') && paused) { e.preventDefault(); setPaused(false); }
});

// ---- screens, scores and pops (plain HTML over the canvas, in the site's own lettering) ----
const screens = { start: $('[data-screen="start"]'), end: $('[data-screen="end"]'), pause: $('[data-screen="pause"]') };
function show(name) { for (const k in screens) screens[k].hidden = k !== name; }
const hudEl = $('.game__hud'), armorEl = $('[data-armor]');
function hud(on) { hudEl.hidden = !on; $('[data-pause]').hidden = !on; }
let shown = {};
function updateHud(force) {
  const score = scoreNow(), left = Math.max(0, Math.ceil(ROUND - run.t));
  if (force || shown.score !== score) { $('[data-score]').textContent = score; shown.score = score; }
  if (force || shown.left !== left) { $('[data-time]').textContent = `0:${String(left).padStart(2, '0')}`; shown.left = left; $('.game__time').classList.toggle('is-low', left <= 5 && state === 'run'); }
  const ak = run.armor ? run.armor.kind : '';
  if (force || shown.armor !== ak) {
    armorEl.hidden = !ak; shown.armor = ak;
    if (ak) { armorEl.querySelector('[data-armor-name]').textContent = ARMORS[ak].name; armorEl.style.setProperty('--armor', ARMORS[ak].c); }
  }
  if (ak) armorEl.style.setProperty('--left', clamp((run.armor.until - STL) / ARMORS[ak].dur).toFixed(3));
  if (force || shown.paws !== run.paws) {
    $$('.game__paw').forEach((p, i) => p.classList.toggle('is-gone', i >= run.paws));
    $('.game__paws').setAttribute('aria-label', `${run.paws} ${run.paws === 1 ? 'paw' : 'paws'} left`); shown.paws = run.paws;
  }
}
function bumpChip() { const el = $('.game__score'); el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
function endScreen(score, best, isBest) {
  if (state !== 'over') return;
  const T = THREATS[threat], won = run.won;
  $('[data-end-word]').textContent = won ? 'Phew!' : 'So close!';
  $('[data-end-title]').textContent = won ? `You outran the ${T.name.toLowerCase()}!` : `The ${T.name.toLowerCase()} got you this time`;
  $('[data-end-score]').textContent = score;
  $('[data-end-stats]').textContent = `${Math.floor(run.dist / 100)} m run · ${run.stars} ${run.stars === 1 ? 'star' : 'stars'} · ${run.spooked} roared away${run.gems ? ` · ${run.gems} ${run.gems === 1 ? 'diamond' : 'diamonds'}` : ''}${won ? ' · +200 for making it' : ''} · best ${best}`;
  $('[data-end-best]').hidden = !isBest;
  $$('[data-ep]').forEach(a => { a.hidden = a.dataset.ep !== threat; });
  hud(false); show('end');
  const again = $('[data-screen="end"] [data-play]');
  if (again && root.contains(document.activeElement)) again.focus({ preventScroll: true });
  $('[data-live]').textContent = `${won ? 'Phew! You made it.' : 'So close!'} Score ${score}.`;
}
function setPaused(p) {
  if (paused === p || !(state === 'run' || state === 'go')) return;
  paused = p; show(p ? 'pause' : null); sound.pause(p);
  if (!p) { last = performance.now(); stage.focus({ preventScroll: true }); }
}
function hint(text, keysText) { run.hinted = true; const t = keysText && !coarse ? keysText : text; setTimeout(() => state === 'run' && pop(t, { hue: 'zap', small: true }), 900); }
function lcg(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function burstSvg(seed, spikes = 13) {           // the same uneven starburst the site's pages use
  const r = lcg(seed), w = 240, h = 150, pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * TAU - Math.PI / 2, k = i % 2 ? 0.63 + r() * 0.07 : 0.84 + r() * 0.16;
    pts.push(`${(w / 2 + Math.cos(a) * (w / 2 - 4) * k).toFixed(1)},${(h / 2 + Math.sin(a) * (h / 2 - 4) * k).toFixed(1)}`);
  }
  return `<svg class="burst__shape" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><polygon points="${pts.join(' ')}"/></svg>`;
}
const popsEl = $('.game__pops');
let popN = 0;
function pop(text, { big = false, small = false, hue = 'hot' } = {}) {
  if (SHOT) return;
  const el = document.createElement('p');
  el.className = `burst game__pop game__pop--${hue}${big ? ' game__pop--big' : ''}${small ? ' game__pop--small' : ''}`;
  el.style.setProperty('--rot', `${((popN * 7) % 15) - 7}deg`);
  el.style.left = `${50 + (((popN * 37) % 21) - 10) * (big ? 0.4 : 1)}%`;
  el.style.top = `${big ? 34 : 26 + ((popN * 13) % 12)}%`;
  el.innerHTML = burstSvg(popN * 31 + 5, big ? 15 : 13) + `<span class="burst__text"></span>`;
  el.lastChild.textContent = text;
  popsEl.appendChild(el); popN++;
  setTimeout(() => el.remove(), big ? 1500 : 1100);
}

// threat picker: one choice, shown on both the start and the end screen
function pickThreat(t) {
  if (!THREATS[t]) return;
  threat = t; store.set('packrun.threat', t);
  $$('input[data-threat]').forEach(i => { i.checked = i.value === t; });
  $$('[data-next-threat]').forEach(el => { el.textContent = THREATS[t].name; });
}
root.addEventListener('change', e => { if (e.target.matches('input[data-threat]')) pickThreat(e.target.value); });
root.addEventListener('click', e => {
  if (e.target.closest('[data-play]')) { e.preventDefault(); startRound(); }
  else if (e.target.closest('[data-resume]')) setPaused(false);
  else if (e.target.closest('[data-pause]')) setPaused(true);
  else if (e.target.closest('[data-sound]')) sound.toggle();
});

// ---- sound: generated, like the cartoon's scores. Off until the player turns it on. ----
const sound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, master, sfx, mus, rum, noise, on = false, musicOn = false, next = 0, step = 0, timer = 0;
  const btn = $('[data-sound]');
  function init() {
    ac = new AC();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = 0; master.connect(comp);
    sfx = ac.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
    mus = ac.createGain(); mus.gain.value = 0.5; mus.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), lp = ac.createBiquadFilter(); src.buffer = noise; src.loop = true; lp.type = 'lowpass'; lp.frequency.value = 130;
    rum = ac.createGain(); rum.gain.value = 0; src.connect(lp); lp.connect(rum); rum.connect(master); src.start();
  }
  const live = () => on && ac && ac.state === 'running';
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function pan(node, p) { if (!ac.createStereoPanner || !p) return node; const s = ac.createStereoPanner(); s.pan.value = clamp(p, -1, 1); node.connect(s); return s; }
  function tone(f0, f1, dur, type = 'sine', vol = 0.3, t = ac.currentTime, bus = sfx, p = 0) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.006, vol, dur); o.connect(g); pan(g, p).connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(dur, vol, type, f0, f1, q = 1, t = ac.currentTime, bus = sfx, p = 0) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.008, vol, dur); s.connect(f); f.connect(g); pan(g, p).connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // A minor, F, C, G: a running loop with a four-on-the-floor kick
  const CH = [[45, 48, 52, 57], [41, 45, 48, 53], [48, 52, 55, 60], [43, 47, 50, 55]], STEP = 60 / 132 / 4, ARP = [0, 1, 2, 3, 2, 1, 2, 3];
  function beat(i, t) {
    const s = i % 16, c = CH[(i >> 4) % 4];
    if (s % 4 === 0) tone(150, 42, 0.18, 'sine', 0.5, t, mus);
    if (s === 4 || s === 12) hiss(0.11, 0.22, 'bandpass', 1900, 1100, 0.8, t, mus);
    if (s % 2 === 1) hiss(0.03, 0.07, 'highpass', 7500, 7000, 0.7, t, mus);
    if (s % 2 === 0) { const n = c[0] + (s % 8 === 6 ? 12 : 0); tone(mtof(n), mtof(n), 0.13, 'triangle', 0.3, t, mus); }
    tone(mtof(c[ARP[s % 8]] + 24), mtof(c[ARP[s % 8]] + 24), 0.09, 'triangle', s % 4 === 0 ? 0.07 : 0.045, t, mus);
  }
  function tick() {
    if (!live() || !musicOn) return;
    if (next < ac.currentTime) next = ac.currentTime + 0.05;
    while (next < ac.currentTime + 0.14) { beat(step++, next); next += STEP; }
  }
  function set(v) {
    on = v;
    btn.setAttribute('aria-pressed', String(v)); btn.querySelector('[data-sound-label]').textContent = v ? 'Sound on' : 'Sound off';
    root.classList.toggle('has-sound', v);
    if (v && !ac) { if (!AC) return; init(); }
    if (!ac) return;
    if (v) { ac.resume(); master.gain.setTargetAtTime(0.85, ac.currentTime, 0.05); if (!timer) timer = setInterval(tick, 30); }
    else { master.gain.setTargetAtTime(0, ac.currentTime, 0.04); setTimeout(() => { if (!on && ac) ac.suspend(); }, 250); }
  }
  const api = {
    toggle() { set(!on); },
    unlock() { if (on && ac && ac.state !== 'running') ac.resume(); },
    pause(p) { if (!ac || !on) return; p ? ac.suspend() : ac.resume(); },
    music(v) { musicOn = v; step = 0; if (ac) next = ac.currentTime + 0.05; },
    rumble(x) { if (live()) rum.gain.setTargetAtTime(x * 0.55, ac.currentTime, 0.12); },
    go() { if (!live()) return; const t = ac.currentTime; tone(523, 523, 0.12, 'triangle', 0.22, t); tone(784, 784, 0.3, 'triangle', 0.24, t + 0.13); },
    jump() { if (!live()) return; hiss(0.26, 0.2, 'bandpass', 500, 2600, 1.3); tone(330, 640, 0.13, 'triangle', 0.1); },
    land() { if (!live()) return; tone(150, 60, 0.13, 'sine', 0.32); hiss(0.08, 0.1, 'lowpass', 900, 300); },
    swish(d) { if (live()) hiss(0.13, 0.12, 'bandpass', 1300, 3200, 2, ac.currentTime, sfx, d * 0.6); },
    star(n) { if (!live()) return; const t = ac.currentTime, m = 81 + [0, 2, 4, 7, 9][n % 5]; tone(mtof(m), mtof(m), 0.12, 'triangle', 0.16, t); tone(mtof(m + 7), mtof(m + 7), 0.2, 'triangle', 0.14, t + 0.06); },
    bump() { if (!live()) return; tone(240, 70, 0.32, 'triangle', 0.42); hiss(0.22, 0.28, 'lowpass', 1400, 200); tone(560, 190, 0.2, 'square', 0.05); },
    trumpet(p) {
      if (!live()) return;
      const t = ac.currentTime, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.22); o.frequency.exponentialRampToValueAtTime(420, t + 0.75);
      lfo.frequency.value = 7; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.1; env(g, t, 0.05, 0.16, 0.8);
      o.connect(f); f.connect(g); pan(g, p * 0.5).connect(sfx); o.start(t); lfo.start(t); o.stop(t + 0.95); lfo.stop(t + 0.95);
    },
    snort() { if (live()) { hiss(0.3, 0.28, 'lowpass', 700, 160, 1); hiss(0.2, 0.2, 'lowpass', 600, 180, 1, ac.currentTime + 0.32); } },
    roar() {                       // a short cartoon roar: a growl that drops, over a breathy burst
      if (!live()) return;
      const t = ac.currentTime, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(95, t + 0.28);
      lfo.frequency.value = 34; lg.gain.value = 22; lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'lowpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.3); env(g, t, 0.01, 0.2, 0.28);
      o.connect(f); f.connect(g); g.connect(sfx); o.start(t); lfo.start(t); o.stop(t + 0.35); lfo.stop(t + 0.35);
      hiss(0.22, 0.14, 'bandpass', 1500, 600, 1.2);
    },
    gem() { if (!live()) return; const t = ac.currentTime; [76, 80, 83, 88, 92].forEach((m, i) => tone(mtof(m), mtof(m), 0.16, 'triangle', 0.14, t + i * 0.05)); hiss(0.4, 0.06, 'highpass', 8000, 6000, 0.7); },
    block() { if (live()) { tone(900, 1300, 0.1, 'sine', 0.16); tone(1300, 700, 0.18, 'triangle', 0.1, ac.currentTime + 0.05); } },
    cancel() { if (live()) { hiss(0.16, 0.22, 'bandpass', 2500, 900, 1.2); tone(700, 300, 0.12, 'square', 0.05); } },
    spit(kind, p) {               // a trunk squirt, or a wet splat of mud flung up
      if (!live()) return;
      if (kind === 'water') { hiss(0.28, 0.16, 'bandpass', 900, 3200, 2, ac.currentTime, sfx, p); tone(500, 900, 0.15, 'sine', 0.06); }
      else hiss(0.2, 0.2, 'lowpass', 1200, 300, 1, ac.currentTime, sfx, p);
    },
    thud() { if (live()) { tone(180, 90, 0.12, 'sine', 0.3); hiss(0.08, 0.12, 'bandpass', 2400, 1200, 1.5); } },
    crack() { if (!live()) return; hiss(0.3, 0.32, 'highpass', 3000, 900, 0.8); tone(300, 80, 0.2, 'triangle', 0.25); },
    spook(kind) {                  // a startled squeak and a boing as it turns tail
      if (!live()) return;
      const t = ac.currentTime, hi = kind === 'buffalo' ? 0.8 : 1;
      tone(400 * hi, 900 * hi, 0.16, 'triangle', 0.16, t); tone(900 * hi, 500 * hi, 0.2, 'triangle', 0.12, t + 0.12);
    },
    win() { if (!live()) return; const t = ac.currentTime; [72, 76, 79, 84].forEach((m, i) => tone(mtof(m), mtof(m), i === 3 ? 0.5 : 0.16, 'triangle', 0.22, t + i * 0.12)); },
    lose() { if (!live()) return; const t = ac.currentTime; [67, 64, 60].forEach((m, i) => tone(mtof(m), mtof(m - 0.6), i === 2 ? 0.6 : 0.22, 'triangle', 0.2, t + i * 0.24)); },
  };
  set(false);
  return api;
})();

// ---- the loop: it only runs while the game is on screen, and it pauses a round when you look away ----
let last = 0, raf = 0, visible = true, fpsT = 0, fpsN = 0, slowFor = 0, workSum = 0;
// numbers for testing: frames per second, milliseconds of script per frame, cat pictures per second per cat
const stats = window.__packRun = { fps: 0, work: 0, catFps: 0, quality: 0, painter: crew.length ? 'workers' : 'page' };
Object.defineProperties(stats, { lane: { get: () => run.lane, enumerable: true }, blasts: { get: () => blasts.length, enumerable: true }, roarAgo: { get: () => +(STL - run.fireT).toFixed(2), enumerable: true }, armor: { get: () => run.armor && run.armor.kind, enumerable: true }, gems: { get: () => run.gems, enumerable: true }, spits: { get: () => spits.length, enumerable: true }, cancels: { get: () => run.cancels, enumerable: true }, spooked: { get: () => run.spooked, enumerable: true }, score: { get: scoreNow, enumerable: true }, paws: { get: () => run.paws, enumerable: true }, air: { get: airborne, enumerable: true }, state: { get: () => paused ? 'paused' : state, enumerable: true } });
function frame(ts) {
  raf = requestAnimationFrame(frame);
  const raw = (ts - last) / 1000, dt = clamp(raw, 0, 0.05); last = ts;
  const w0 = performance.now();
  if (!paused) update(dt);
  render();
  fpsN++; workSum += performance.now() - w0;
  if (ts - fpsT > 1000) {
    const s = (ts - fpsT) / 1000;
    Object.assign(stats, { fps: Math.round(fpsN / s), work: +(workSum / fpsN).toFixed(2), catFps: Math.round(catPics / PACK.length / s), quality, painter: crew.length ? 'workers' : 'page' });
    // a device that can't keep up draws at a lower resolution (each step is about a third fewer pixels)
    if ((state === 'run' || state === 'go') && !paused && stats.fps < 50) slowFor++; else slowFor = 0;
    if (slowFor >= 2 && quality < QUAL_DPR.length - 1) { quality++; slowFor = 0; if (quality >= 2) PSTYLE.rim2 = 0; resize(); }
    fpsT = ts; fpsN = 0; workSum = 0; catPics = 0;
  }
}
function wake() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
function sleep() { if (raf) cancelAnimationFrame(raf); raf = 0; }
new ResizeObserver(() => { resize(); if (!raf) render(); }).observe(stage);
if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) { setPaused(true); sleep(); } else wake(); }, { threshold: 0.15 }).observe(stage);
document.addEventListener('visibilitychange', () => { if (document.hidden) { setPaused(true); sleep(); } else wake(); });
addEventListener('blur', () => setPaused(true));

// ---- start ----------------------------------------------------------------------------------
const coarse = matchMedia('(pointer: coarse)').matches;
root.classList.toggle('is-touch', coarse);
pickThreat(threat);
resize();
setState('title'); show('start'); hud(false); updateHud(true);
root.classList.add('is-ready');
if (SHOT) {                                // a still for the share image: the herd splits around the pack, stars lead through the gap
  threat = 'elephants'; startRound(); show(null); hud(false);
  for (let i = 0; i < 60 * 2.4; i++) update(1 / 60);
  run.next = run.nextLog = 1e9; obs.length = 0;
  obs.push(mkObs('elephant', 1, 2350, { v: 430, size: 1.08 }), mkObs('elephant', 3, 2150, { v: 430, size: 1.02, dz: 20 }),
    mkObs('elephant', 2, 4700, { v: 430 }), mkObs('elephant', 1, 5000, { v: 430, size: 0.96 }), mkObs('log', 3, 3900, {}), mkObs('elephant', 4, 3300, { v: 430, size: 0.98 }));
  for (let i = 0; i < 5; i++) obs.push(mkObs('star', 2, 1150 + i * 165, { hg: 60 }));
  for (let i = 0; i < 60 * 0.6; i++) update(1 / 60);
  fire(); for (let i = 0; i < 9; i++) update(1 / 60);         // a roar blast on its way up the trail
  const title = document.createElement('div');
  title.className = 'game__shot-title';
  title.innerHTML = '<p class="chips"><span class="chip chip--ink">Panthers Pack</span><span class="chip chip--pop">Free game</span></p><p class="lockup game__logo"><span class="lockup__a">Pack</span> <span class="lockup__b">Run</span></p>';
  stage.appendChild(title);
  render(); document.documentElement.dataset.shot = 'ready';
} else {
  if (BOT) startRound();
  wake();
}
})();
