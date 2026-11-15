// node blitz-build.js <panther-pack-clash-lake.html> <outDir> [only]
// PANTHERA episodes 6-10: the pack is already flat out when the video starts, the action hits mid-run,
// and a flat comic graphic layer (impact words, callouts, speed meter, halftone) sits over the painted film.
const fs = require('fs'), path = require('path');
const { build, DAY_PANTHER, PACK } = require('./hunt-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');

const NEW_BEASTS = `const NEW_BEASTS = {
  zebra: { L: 82, H: 35, W: 25, legU: 58, legD: 60, legR: [9, 4.6], neck: [64, 46, 15, 10], head: [56, 13, 10, 48], horns: 'mane', tail: 26, stride: 340, earL: 17, zebra: true,
    body: '#f1ede4', back: '#e4ded2', belly: '#f6f2ea', leg: '#d8d2c6', dark: '#151313', horn: '#151313' },
  wildebeest: { L: 98, H: 44, W: 34, hump: 0.3, legU: 54, legD: 58, legR: [11, 5.5], neck: [40, 34, 26, 18], head: [60, 20, 16, 62], horns: 'boss', tail: 34, stride: 350, earL: 15,
    body: '#64636a', back: '#3e3d43', belly: '#4f4e55', leg: '#3c3c42', dark: '#141317', horn: '#2a2826', stripe: '#4a4950' },
  elephant: { L: 150, H: 86, W: 68, hump: 0.1, legU: 74, legD: 72, legR: [28, 24], neck: [22, 8, 66, 60], head: [70, 52, 44, 72], horns: 'trunk', tail: 40, stride: 430, earL: 10,
    body: '#8c857e', back: '#766f69', belly: '#706a64', leg: '#7e7771', dark: '#3a3633', horn: '#f2e9d6' },
};
Object.assign(BEASTS, NEW_BEASTS);
`;

function blitz(cfg, file) {
  let s = build({ series: 'PANTHERA', ...cfg }, null);
  const count = a => s.split(a).length - 1;
  const R = (a, b, n = 1) => { const c = count(a); if (c !== n) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  const REGION = (a, b, rep) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0 || count(a) !== 1) throw new Error('REGION ' + a); s = s.slice(0, i) + rep + s.slice(j); };

  // new animals: zebra stripes and mane, the elephant's ears, trunk and tusks
  R('for (const k in BEASTS) { const b = BEASTS[k];', NEW_BEASTS + 'for (const k in BEASTS) { const b = BEASTS[k];');
  R('if (C.rump && v.u < -0.72 && v.ca > -0.6) c = mixc(c, C.rump, 0.85);', `if (C.rump && v.u < -0.72 && v.ca > -0.6) c = mixc(c, C.rump, 0.85);
      if (sp.zebra && v.ca < 0.72 && Math.sin(v.u * 34 + v.ca * 1.7) > 0.05) c = C.dark;`);
  R('drawMesh(rings, (k, j, v) => v.ca > 0.4 ? mixc(sp.c.body, sp.c.belly, 0.6) : sp.c.body);', 'drawMesh(rings, (k, j, v) => sp.zebra ? (k % 2 ? sp.c.dark : sp.c.body) : v.ca > 0.4 ? mixc(sp.c.body, sp.c.belly, 0.6) : sp.c.body);');
  R("    if (sp.horns === 'rhino') {", `    if (sp.horns === 'mane') {
      const mp = []; for (let k = 0; k < 5; k++) { const q = k / 4, c = [lerp(n0[0], n1[0], q), lerp(n0[1], n1[1], q)], r = lerp(sp.neck[2], sp.neck[3], q) * 1.05; mp.push(B(c[0] - nq[0] * r, c[1] - nq[1] * r, 0)); }
      ctx.strokeStyle = sp.dark; curve(mp, 8, 6);
    }
    if (sp.horns === 'trunk') {
      let p = hpt(1.0, 0, 0), a = Math.atan2(hd[1], hd[0]); const pts = [p], sw = 0.3 * Math.sin(TAU * st.cyc), tgt = Math.atan2(1, 0.15 + sw) - (st.trunkUp || 0);
      for (let k = 0; k < 7; k++) { a = lerp(a, tgt, 0.35); p = [p[0] + Math.cos(a) * 15, p[1] + Math.sin(a) * 15, 0]; pts.push(p); }
      ctx.strokeStyle = litStyle(sp.c.body, [0.3, -0.4, 0.5], 0.6); curve(pts, 24, 10);
      ctx.strokeStyle = sp.horn;
      for (const s of [-1, 1]) { const o = hpt(0.8, rad(0.8) * 0.55, s * HW * 0.5), t1 = [o[0] + hd[0] * 22, o[1] + hd[1] * 22, o[2] + s * 4], t2 = [t1[0] + 26, t1[1] + 2, t1[2] + s * 4], t3 = [t2[0] + 14, t2[1] - 12, t2[2]]; curve([o, t1, t2, t3], 10, 4); }
    }
    if (sp.horns === 'rhino') {`);
  R('  // tail\n  parts.push({ d: dep(-sp.L, 0) - 0.5, draw: () => {', `  if (sp.horns === 'trunk') for (const s of [-1, 1]) parts.push({ d: dep(sp.L * 0.75, s * sp.W * 1.2), draw: () => {
    const fl = 0.25 + 0.2 * Math.sin(TAU * st.cyc * 2 + s), r = sp.head[1], c = [n1[0] + hd[0] * 8, n1[1] + hd[1] * 8], z0 = s * sp.head[2] * 0.7;
    const P = [B(c[0] + 6, c[1] - r * 0.95, z0), B(c[0] - r * 1.3, c[1] - r * 0.85, z0 + s * r * (0.5 + fl)), B(c[0] - r * 1.45, c[1] + r * 0.6, z0 + s * r * (0.6 + fl)), B(c[0] - r * 0.4, c[1] + r * 1.15, z0 + s * r * 0.3), B(c[0] + 4, c[1] + r * 0.4, z0)].map(q => pr(...q));
    ctx.fillStyle = litStyle(sp.c.back, [-0.3, -0.2, s], facing(0, 0, s) > 0 ? 0.6 : 0.2); fillPoly(ctx, P);
  } });
  // tail
  parts.push({ d: dep(-sp.L, 0) - 0.5, draw: () => {`);
  // the comic layer replaces the quiet title card
  REGION('function drawTitle() {', '// markings sit on the 3D body surface', chunk('blitz-pop.txt'));
  R('  drawHerdDust();\n  drawDust();', '  drawHerdDust();\n  drawWall(t);\n  drawDust();');
  R('  drawCine();\n  drawTitle();\n  const fade = STL < FIN ? 1 - STL / FIN : STL > SEND - FOUT ? Math.min(1, (STL - (SEND - FOUT)) / FOUT) : 0;', '  drawCine();\n  drawPop(t);\n  const fade = 0;   // no fades: it opens mid-sprint and ends on the TO BE CONTINUED panel');
  R('sc = SC0 * keyVal(CAMK.zoom, s);', 'sc = SC0 * keyVal(CAMK.zoom, s) * (1 + punchAt(s));');
  // sounds for the graphics
  R(`    case 'talk':`, `    case 'boom': boomSnd(a); break;
    case 'hit': hitSnd(a); break;
    case 'whoosh': noise(a, 0.38, 'bandpass', 1300, 0.6, 0.09, 0, 0.3); noise(a + 0.05, 0.3, 'highpass', 3500, 0.7, 0.03, 0, 0.2); break;
    case 'rumble': noise(a, 0.55, 'lowpass', 85, 0.7, e.v, 0, 0.2); noise(a, 0.4, 'lowpass', 240, 0.6, e.v * 0.35, 0, 0.2); break;
    case 'trumpet': trumpetSnd(a); break;
    case 'talk':`);
  R('function pad(at, notes, len) {', `function boomSnd(at) {              // a deep impact for the flash cuts
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(78, at); o.frequency.exponentialRampToValueAtTime(30, at + 0.6);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.42, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.75);
  o.connect(g); g.connect(master); g.connect(wet); o.start(at); o.stop(at + 0.8);
  noise(at, 0.45, 'lowpass', 500, 0.7, 0.2, 0, 0.4);
}
function hitSnd(at) {               // a punchy comic hit under the impact words
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(220, at); o.frequency.exponentialRampToValueAtTime(70, at + 0.16);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.22, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
  o.connect(g); g.connect(master); o.start(at); o.stop(at + 0.22);
  noise(at, 0.09, 'bandpass', 3200, 1, 0.07, 0, 0.2);
}
function trumpetSnd(at) {           // an elephant's trumpet blast
  const g = ac.createGain(), f = ac.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 0.9;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.13, at + 0.08); g.gain.setValueAtTime(0.11, at + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.35);
  for (const [type, d] of [['sawtooth', 0], ['square', 7]]) {
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(330 + d, at); o.frequency.linearRampToValueAtTime(520 + d, at + 0.25); o.frequency.linearRampToValueAtTime(470 - d, at + 1.0); o.frequency.linearRampToValueAtTime(380, at + 1.3);
    o.connect(f); o.start(at); o.stop(at + 1.4);
  }
  f.connect(g); g.connect(master); g.connect(wet);
  noise(at, 1.2, 'bandpass', 2200, 1.5, 0.04, 0, 0.3);
}
function pad(at, notes, len) {`);
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

// ---- the episodes: the pack is flat out from the first frame ----
const SNOW_PANTHER = { fur: ['#2a2d36', '#15171d', '#060608'], far: '#08090c', rim: 'rgb(225,235,255)', lt: '215,228,255' };
const EPISODES = [
  { file: 'panthera-6-crossfire.html', ep: 6, title: 'Crossfire', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: ELEPHANT CHARGE',
    panther: DAY_PANTHER, pack: PACK, grade: ['#ff9a3c', 0.18], glow: [0.35, '255,190,120'],
    speed: [[0, 780], [10.6, 780], [11.4, 900], [15, 900], [16.2, 790], [28, 790]],
    herds: [
      { kind: 'gazelle', dir: 1, fx0: 650, dust: 0.5, zig: 80, speed: [[0, 780], [7, 780], [8.4, 920], [28, 920]], hd: [[0, 0]],
        leaps: [[3.4, 0.85, 60], [8.2, 0.9, 75]], zShift: [[0, 0], [8, 0], [10.5, -1700]],
        members: [{ dfx: 0, z: 30 }, { dfx: 110, z: -170, size: 0.95 }, { dfx: 200, z: 190 }, { dfx: 310, z: -60, size: 1.05 }, { dfx: 420, z: 260 }] },
      { kind: 'buffalo', dir: -1, at: [11.5, 380], dust: 1.0, zig: 25, spread: true, speed: [[0, 820], [28, 820]], hd: [[0, 24]], snorts: [9.6, 10.8, 11.6, 12.5],
        members: [{ dfx: 0, z: -560 }, { dfx: 90, z: 580 }, { dfx: 260, z: -800, size: 1.06 }, { dfx: 330, z: 760 }, { dfx: 520, z: -500, size: 0.95 }, { dfx: 600, z: 920 },
          { dfx: 780, z: -980 }, { dfx: 860, z: 540, size: 1.05 }, { dfx: 1060, z: -650 }, { dfx: 1150, z: 800 }, { dfx: 1360, z: -1150, size: 0.95 }, { dfx: 1420, z: 1100 },
          { dfx: 1640, z: -560 }, { dfx: 1720, z: 620 }] }],
    cam: [{ t: 0, yaw: 70, tilt: 14, zoom: 0.95, y: 0.68, x: 0, d: 1000 }, { t: 3.0, yaw: 22, tilt: 10, zoom: 0.88, y: 0.64, x: -0.1, d: 1300 },
      { t: 6.6, yaw: 35, tilt: 12, zoom: 0.85 }, { t: 8.2, yaw: 88, tilt: 18, zoom: 0.8, y: 0.7, x: 0, d: 1000 }, { t: 11.0, yaw: 90, tilt: 22, zoom: 0.78 },
      { t: 11.7, yaw: 90, tilt: 62, zoom: 0.5, y: 0.56, d: 1300 }, { t: 13.8, yaw: 80, tilt: 55, zoom: 0.52 },
      { t: 15.0, yaw: -40, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1000 }, { t: 19, yaw: -30, tilt: 9, zoom: 0.82 },
      { t: 20.5, yaw: 25, tilt: 10, zoom: 1.0, y: 0.64, x: -0.05, d: 1200 }, { t: 24, yaw: 60, tilt: 14, zoom: 0.95, y: 0.68 }, { t: 28, yaw: 75, tilt: 16, zoom: 0.9 }],
    slow: [[12.0, 13.2, 0.4]], shake: [[0, 0.9], [10, 1.0], [11.4, 1.8], [13.5, 1.8], [15, 1], [28, 1]], drums: [[0, 28, 132]], roars: [21.8],
    flashes: [11.55], slashes: [2.85, 14.85, 20.35],
    pops: [{ t: 8.2, text: 'INCOMING!', size: 0.12, y: 0.3 }, { t: 11.55, text: 'BOOM!', size: 0.2, y: 0.4, boom: true, rot: -9 }, { t: 16.3, text: 'MADE IT!', size: 0.12, y: 0.3, bg: '#14e0ff' }, { t: 22.0, text: 'ROAAAR!', size: 0.12, y: 0.28 }],
    tags: [{ t0: 3.7, t1: 6.3, herd: 0, m: 2, label: 'GAZELLES', sub: 'TOP SPEED 80 KM/H' }, { t0: 9.4, t1: 11.3, herd: 1, m: 0, label: 'CAPE BUFFALO ×14', sub: '800 KG EACH · HEAD-ON' }],
    lines: [[0, 0.35], [10.8, 0.35], [11.4, 1], [13.6, 1], [14.6, 0.35], [28, 0.45]], tone: [[0, 0.45], [11, 0.45], [11.6, 1], [13.6, 1], [14.6, 0.45]] },

  { file: 'panthera-7-elephant-charge.html', ep: 7, title: 'Elephant Charge', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: SANDSTORM',
    panther: DAY_PANTHER, pack: PACK, grade: ['#ff7a2a', 0.22], glow: [0.7, '255,170,100'], accent: ['#ffe600', '#ff2e88', '#14e0ff'],
    speed: [[0, 760], [7, 760], [8, 860], [18, 860], [19.5, 790], [28, 790]],
    herds: [
      { kind: 'zebra', dir: 1, fx0: 170, dust: 0.6, zig: 60, speed: [[0, 770], [8, 770], [9, 850], [28, 850]], hd: [[0, 0]], zShift: [[0, 0], [9, 0], [11.5, 650]],
        members: [{ dfx: 0, z: 0 }, { dfx: 120, z: 200, size: 0.95 }, { dfx: 230, z: -140 }, { dfx: 340, z: 120, size: 1.05 }, { dfx: 450, z: 300 }, { dfx: 560, z: -40, size: 0.95 }] },
      { kind: 'elephant', dir: 1, at: [8.0, -1100], dust: 1.0, spread: true, speed: [[0, 0], [7.5, 0], [8.3, 1050], [13, 1050], [14.5, 860], [17, 860], [19, 400], [21, 0], [28, 0]],
        hd: [[0, 10], [7.5, 10], [8.2, -14], [18, -14], [20, 8]], zShift: [[0, -580], [10, -580], [13, -500]], members: [{ dfx: 0, z: 0, size: 1.0 }] }],
    trumpets: [7.5, 12.7, 19.6],
    cam: [{ t: 0, yaw: 30, tilt: 10, zoom: 0.85, y: 0.64, x: -0.12, d: 1400 }, { t: 5.4, yaw: 15, tilt: 9, zoom: 0.72, x: 0.05, d: 1500 },
      { t: 7.4, yaw: -45, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1000 }, { t: 10.6, yaw: -35, tilt: 12, zoom: 0.75 },
      { t: 12.3, yaw: 10, tilt: 8, zoom: 0.7, y: 0.62, x: 0.1, d: 1500 }, { t: 14.3, yaw: 88, tilt: 50, zoom: 0.55, y: 0.58, x: 0, d: 1300 },
      { t: 17.5, yaw: 70, tilt: 20, zoom: 0.85, y: 0.68, d: 1000 }, { t: 21, yaw: 25, tilt: 10, zoom: 0.95, y: 0.64, x: -0.08, d: 1200 },
      { t: 24, yaw: -30, tilt: 10, zoom: 0.85, y: 0.6, x: 0 }, { t: 28, yaw: -25, tilt: 10, zoom: 0.88 }],
    slow: [[12.6, 13.9, 0.4]], shake: [[0, 0.8], [7.4, 1.3], [17, 1.3], [19, 0.9], [28, 0.9]], drums: [[0, 28, 124]], roars: [23.0],
    flashes: [12.6], slashes: [7.2, 14.2, 23.8],
    pops: [{ t: 7.6, text: 'UH-OH...', size: 0.12, y: 0.28, bg: '#14e0ff' }, { t: 12.6, text: 'WHOOOA!', size: 0.18, y: 0.38, boom: true }, { t: 18.6, text: 'SHAKEN OFF!', size: 0.11, y: 0.3 }],
    tags: [{ t0: 2.8, t1: 5.4, herd: 0, m: 0, label: 'ZEBRAS', sub: 'TODAY\'S TARGET' }, { t0: 8.2, t1: 10.8, herd: 1, m: 0, label: 'ELEPHANT', sub: '6 TONS · 40 KM/H · FURIOUS' }],
    lines: [[0, 0.3], [7.5, 0.3], [8.2, 0.8], [17, 0.8], [19, 0.35], [28, 0.4]], tone: [[0, 0.45], [12, 0.45], [12.7, 1], [14, 1], [15, 0.45]] },

  { file: 'panthera-8-sandstorm.html', ep: 8, title: 'Sandstorm', dur: 28, biomes: [['desert', 0]], next: 'NEXT: AVALANCHE',
    panther: DAY_PANTHER, pack: PACK, grade: ['#ff6a1a', 0.26], glow: [0.6, '255,190,120'], accent: ['#ffe600', '#ff2e88', '#14e0ff'],
    speed: [[0, 770], [9, 770], [9.8, 880], [13, 880], [14, 790], [28, 790]],
    herds: [
      { kind: 'rhino', dir: -1, at: [10.0, 150], dust: 0.9, spread: true, speed: [[0, 700], [28, 700]], hd: [[0, 22]], snorts: [8.4, 9.7], members: [{ dfx: 0, z: -560, size: 1.05 }] },
      { kind: 'rhino', dir: -1, at: [10.5, 150], dust: 0.9, spread: true, speed: [[0, 680], [28, 680]], hd: [[0, 24]], snorts: [10.3], members: [{ dfx: 0, z: 540, size: 0.98 }] },
      { kind: 'wildebeest', dir: 1, at: [17.5, -700], dust: 1.0, zig: 40, spread: true, speed: [[0, 1000], [28, 1000]], hd: [[0, 18]],
        members: [{ dfx: 0, z: -520 }, { dfx: -120, z: 560 }, { dfx: -260, z: -760, size: 1.05 }, { dfx: -360, z: 720 }, { dfx: -520, z: -480, size: 0.95 },
          { dfx: -620, z: 900 }, { dfx: -780, z: -950 }, { dfx: -880, z: 520 }, { dfx: -1040, z: -640 }, { dfx: -1160, z: 820 }] }],
    cam: [{ t: 0, yaw: 80, tilt: 16, zoom: 0.85, y: 0.7, x: 0, d: 1000 }, { t: 4, yaw: 30, tilt: 10, zoom: 0.85, y: 0.64, x: -0.1, d: 1300 },
      { t: 7.5, yaw: 90, tilt: 18, zoom: 0.8, y: 0.7, x: 0, d: 1000 }, { t: 9.6, yaw: 90, tilt: 22, zoom: 0.78 }, { t: 10.4, yaw: 90, tilt: 60, zoom: 0.5, y: 0.56, d: 1300 },
      { t: 12.5, yaw: -40, tilt: 10, zoom: 0.8, y: 0.6, d: 1000 }, { t: 15.5, yaw: -30, tilt: 9, zoom: 0.72 },
      { t: 18.5, yaw: 85, tilt: 55, zoom: 0.5, y: 0.56, d: 1300 }, { t: 21.5, yaw: 15, tilt: 9, zoom: 0.7, y: 0.62, x: 0.05, d: 1500 },
      { t: 25, yaw: 60, tilt: 14, zoom: 0.9, y: 0.68, x: 0, d: 1000 }, { t: 28, yaw: 70, tilt: 15, zoom: 0.9 }],
    slow: [[10.6, 11.7, 0.4]], shake: [[0, 1], [9.5, 1.6], [12, 1.6], [14, 1], [17, 1.4], [21, 1], [28, 1]], drums: [[0, 28, 128]], roars: [24.6],
    haze: [[0, 0.6], [8, 0.75], [11, 0.5], [16, 0.65], [28, 0.55]], sand: [[0, 0.8], [28, 0.8]],
    flashes: [10.45], slashes: [3.9, 12.4, 21.3],
    pops: [{ t: 3.0, text: 'BLIND RUN', size: 0.11, y: 0.3, bg: '#14e0ff' }, { t: 10.45, text: 'LEFT! RIGHT!', size: 0.14, y: 0.36, boom: true }, { t: 16.0, text: 'HERE THEY COME!', size: 0.1, y: 0.3 }, { t: 19.4, text: 'SHHWOOOM', size: 0.12, y: 0.36, bg: '#14e0ff' }],
    tags: [{ t0: 7.8, t1: 9.9, herd: 0, m: 0, label: 'BLACK RHINO ×2', sub: 'OUT OF THE DUST · HEAD-ON' }, { t0: 15.7, t1: 17.8, herd: 2, m: 0, label: 'WILDEBEEST', sub: 'A STAMPEDE FROM BEHIND' }],
    lines: [[0, 0.35], [10, 0.35], [10.4, 1], [12, 1], [13, 0.35], [17, 0.35], [18.5, 0.8], [21, 0.4], [28, 0.4]], tone: [[0, 0.5], [28, 0.5]] },

  { file: 'panthera-9-avalanche.html', ep: 9, title: 'Avalanche', dur: 28, biomes: [['snow', 0]], next: 'NEXT: THE GREAT MIGRATION',
    panther: SNOW_PANTHER, pack: PACK, grade: ['#6fa8ff', 0.2], glow: [0.75, '220,235,255'], accent: ['#ffe600', '#ff2e88', '#14e0ff'], toneCol: '#14e0ff',
    speed: [[0, 800], [9.5, 800], [10.3, 900], [16, 900], [17, 820], [28, 820]],
    wall: { fx: [[0, -1500], [6, -1150], [10, -850], [13, -600], [16, -820], [20, -1050], [24, -950], [28, -1200]] },
    herds: [{ kind: 'deer', dir: 1, fx0: 260, dust: 0.8, zig: 70, speed: [[0, 800], [9.5, 800], [10.3, 900], [28, 900]], hd: [[0, -4]], leaps: [[6.5, 0.9, 85], [12.3, 0.95, 95], [18.5, 0.9, 80]],
      members: [{ dfx: 0, z: 560, size: 1.08 }, { dfx: 150, z: 760 }, { dfx: 290, z: 600, size: 0.95 }, { dfx: -120, z: 880, size: 0.9 }, { dfx: 420, z: -620 }] }],
    cam: [{ t: 0, yaw: -40, tilt: 10, zoom: 0.72, y: 0.6, x: 0, d: 1100 }, { t: 4, yaw: 15, tilt: 9, zoom: 0.62, y: 0.62, x: 0.12, d: 1600 },
      { t: 8, yaw: -55, tilt: 14, zoom: 0.7, y: 0.6, x: 0, d: 1100 }, { t: 11.5, yaw: -30, tilt: 30, zoom: 0.55, y: 0.6, d: 1300 }, { t: 13.6, yaw: -25, tilt: 26, zoom: 0.58 },
      { t: 15, yaw: 25, tilt: 10, zoom: 0.9, y: 0.64, x: -0.05, d: 1200 }, { t: 19, yaw: -40, tilt: 9, zoom: 0.8, y: 0.6, x: 0, d: 1100 },
      { t: 23, yaw: 5, tilt: 8, zoom: 0.62, y: 0.62, x: 0.15, d: 1600 }, { t: 28, yaw: -20, tilt: 9, zoom: 0.7, x: 0 }],
    slow: [[12.8, 14.0, 0.4]], shake: [[0, 1.2], [10, 1.6], [14, 1.8], [17, 1.3], [28, 1.2]], drums: [[0, 28, 136]], roars: [20.4],
    flashes: [12.85], slashes: [3.8, 14.8, 22.8],
    pops: [{ t: 2.7, text: 'RUN!!!', size: 0.17, y: 0.34, boom: true }, { t: 10.1, text: 'FASTER!', size: 0.13, y: 0.3, bg: '#14e0ff' }, { t: 12.85, text: 'WHUMP!', size: 0.18, y: 0.4, boom: true }, { t: 19.6, text: 'CLEAR!', size: 0.13, y: 0.3 }],
    tags: [{ t0: 4.4, t1: 7.2, wall: true, label: 'AVALANCHE', sub: '130 KM/H OF SNOW' }, { t0: 15.6, t1: 18.2, herd: 0, m: 0, label: 'RED DEER', sub: 'RUNNING FOR THEIR LIVES TOO' }],
    lines: [[0, 0.6], [12, 0.6], [12.8, 1], [14.2, 1], [15, 0.6], [28, 0.5]], tone: [[0, 0.5], [12.5, 0.5], [13, 1], [14.2, 1], [15, 0.5]] },

  { file: 'panthera-10-the-great-migration.html', ep: 10, title: 'The Great Migration', dur: 28, biomes: [['savanna', 0]], next: 'SEASON 2 · COMING SOON',
    panther: DAY_PANTHER, pack: PACK, grade: ['#ff9a3c', 0.18], glow: [0.3, '255,200,140'],
    speed: [[0, 800], [28, 800]],
    herds: [
      { kind: 'zebra', dir: 1, fx0: -300, dust: 0.7, zig: 40, speed: [[0, 800], [9, 800], [10.5, 920], [18, 920], [20, 860], [28, 860]], hd: [[0, 0]], zShift: [[0, 0], [19, 0], [23, 900]],
        members: [{ dfx: 0, z: 760 }, { dfx: 180, z: -640 }, { dfx: 320, z: 980 }, { dfx: 460, z: -900, size: 1.05 }, { dfx: 600, z: 820 }, { dfx: -200, z: -1100 },
          { dfx: 760, z: -560 }, { dfx: 900, z: 1180 }, { dfx: -380, z: 700 }, { dfx: 1060, z: -1250 }] },
      { kind: 'wildebeest', dir: 1, fx0: -600, dust: 1.0, zig: 30, speed: [[0, 800], [9, 800], [10.5, 940], [18, 940], [20, 860], [28, 860]], hd: [[0, 16]], zShift: [[0, 0], [19, 0], [23, -900]],
        members: [{ dfx: 0, z: -760 }, { dfx: 150, z: 1000 }, { dfx: 300, z: -1000 }, { dfx: 420, z: 1300 }, { dfx: 560, z: -1350 }, { dfx: 700, z: 760, size: 1.05 },
          { dfx: 850, z: -820 }, { dfx: -150, z: 1250 }, { dfx: 1000, z: 1050 }, { dfx: 1150, z: -1100 }, { dfx: -320, z: -700 }, { dfx: 1300, z: 900 }] },
      { kind: 'rhino', dir: -1, at: [13.6, 250], dust: 1.0, spread: true, speed: [[0, 720], [28, 720]], hd: [[0, 22]], snorts: [12.2, 13.5], members: [{ dfx: 0, z: 560, size: 1.05 }] }],
    cam: [{ t: 0, yaw: 88, tilt: 40, zoom: 0.55, y: 0.6, x: 0, d: 1300 }, { t: 3.5, yaw: 20, tilt: 9, zoom: 0.7, y: 0.62, x: -0.05, d: 1500 },
      { t: 7, yaw: -40, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1000 }, { t: 10, yaw: 70, tilt: 18, zoom: 0.8, y: 0.68, d: 1000 },
      { t: 12.6, yaw: 90, tilt: 20, zoom: 0.75, y: 0.7 }, { t: 13.5, yaw: 90, tilt: 64, zoom: 0.45, y: 0.55, d: 1300 }, { t: 15.8, yaw: 85, tilt: 58, zoom: 0.48 },
      { t: 17, yaw: -30, tilt: 10, zoom: 0.75, y: 0.6, x: 0, d: 1000 }, { t: 21, yaw: 30, tilt: 11, zoom: 0.95, y: 0.64, x: -0.06, d: 1200 },
      { t: 24, yaw: 85, tilt: 50, zoom: 0.5, y: 0.56, x: 0, d: 1300 }, { t: 28, yaw: 80, tilt: 45, zoom: 0.52 }],
    slow: [[13.9, 15.1, 0.4]], shake: [[0, 1], [10, 1.4], [16, 1.4], [18, 1], [28, 1]], drums: [[0, 28, 128]], roars: [24.5],
    haze: [[0, 0.25], [12, 0.35], [20, 0.25], [28, 0.15]],
    flashes: [13.8], slashes: [3.4, 16.8, 20.9],
    pops: [{ t: 2.9, text: 'STAMPEDE 2.0', size: 0.11, y: 0.3, bg: '#14e0ff' }, { t: 10.3, text: 'FULL SPEED!', size: 0.12, y: 0.3 }, { t: 13.8, text: 'WRONG WAY!!', size: 0.15, y: 0.38, boom: true }, { t: 22.2, text: 'FREE RUN', size: 0.12, y: 0.3, bg: '#14e0ff' }],
    tags: [{ t0: 4.0, t1: 6.6, herd: 0, m: 1, label: 'ZEBRA ×10', sub: 'RUNNING WITH THE PACK' }, { t0: 7.5, t1: 9.8, herd: 1, m: 0, label: 'WILDEBEEST ×12', sub: '1.5 MILLION MIGRATE EVERY YEAR' },
      { t0: 11.3, t1: 13.5, herd: 2, m: 0, label: 'WHITE RHINO', sub: '2.3 TONS · WRONG WAY' }],
    lines: [[0, 0.35], [10, 0.35], [10.6, 0.8], [13.6, 1], [15.4, 1], [16.4, 0.4], [28, 0.4]], tone: [[0, 0.45], [13.4, 0.45], [13.9, 1], [15.2, 1], [16, 0.45]] },
];
module.exports = { blitz, SNOW_PANTHER };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  blitz(cfg, path.join(outDir, file));
});
