// node disaster-build.js <panther-pack-clash-lake.html> <outDir> [only]
// PANTHERA episodes 11-15: one big, unmissable disaster per episode, on screen from the first second.
const fs = require('fs'), path = require('path');
const { blitz } = require('./blitz-build.js');
const { DAY_PANTHER, PACK } = require('./hunt-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');

function disaster(cfg, file) {
  let s = blitz(cfg, null);
  const count = a => s.split(a).length - 1;
  const R = (a, b, n = 1) => { const c = count(a); if (c !== n) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  R('const BSEQ = CFG.biomes', 'for (const [k, v] of Object.entries(CFG.biomeAdd || {})) BIOMES[k] = Object.assign({}, BIOMES[v.base], v);\nconst BSEQ = CFG.biomes');
  R('Object.assign(BEASTS, NEW_BEASTS);', `Object.assign(NEW_BEASTS, {
  goat: { L: 60, H: 27, W: 21, legU: 40, legD: 42, legR: [8, 4.4], neck: [36, 42, 13, 9], head: [36, 11, 9, 42], horns: 'lyre', tail: 8, stride: 280, earL: 13,
    body: '#efe9de', back: '#ddd4c4', belly: '#f6f2ea', leg: '#d4cbbb', dark: '#2a2622', horn: '#2b2723' },
  impala: { L: 84, H: 32, W: 24, legU: 62, legD: 68, legR: [8.5, 4.4], neck: [66, 50, 13, 9], head: [50, 13, 10, 36], horns: 'lyre', tail: 18, stride: 360, earL: 20,
    body: '#c27a3e', back: '#9c5a2a', belly: '#f6eee2', leg: '#b8763e', dark: '#2a1a10', horn: '#2a2018', stripe: '#6e3e1c' },
});
Object.assign(BEASTS, NEW_BEASTS);`);
  R('    const dep = f * RS - tr.z * RC, nf = dep < 0', '    if (HZ_NOTREE(f, tr.z)) continue;\n    const dep = f * RS - tr.z * RC, nf = dep < 0');
  R('function drawPop(t) {', chunk('disaster.txt') + '\nfunction drawPop(t) {');
  R('function tagAnchor(g) {', 'function tagAnchor(g) {\n  if (g.croc !== undefined) return crocAnchor(g.croc);\n  if (g.rock !== undefined) return rockAnchor(g.rock);');
  R("  if (g.wall) { const f = keyVal(CFG.wall.fx, STL) + 120;", "  if (g.wall) { const f = hzWallF() + 120;");
  R('  drawChase(t, 1);\n  drawHerdDust();\n  drawWall(t);\n  drawDust();\n  drawPack(t);\n  drawWeather(t);',
    '  drawChase(t, 1);\n  hzBefore(t);\n  drawHerdDust();\n  drawDust();\n  drawPack(t);\n  hzAfter(t);\n  drawWeather(t);\n  drawStorm(t);');
  R(`    case 'boom': boomSnd(a); break;`, `    case 'boom': boomSnd(a); break;
    case 'splash': noise(a, 0.3, 'bandpass', 900, 0.7, e.v, e.pan || 0, 0.25); noise(a + 0.02, 0.18, 'highpass', 3000, 0.7, e.v * 0.5, e.pan || 0, 0.2); break;
    case 'snap': hitSnd(a); noise(a, 0.07, 'bandpass', 2400, 2, 0.22, 0, 0.2); noise(a + 0.05, 0.4, 'bandpass', 700, 0.8, 0.12, 0, 0.3); break;
    case 'thud': noise(a, 0.45, 'lowpass', 110, 0.8, e.v, 0, 0.3); noise(a, 0.12, 'bandpass', 900, 1, e.v * 0.35, 0, 0.2); break;
    case 'crack': noise(a, 0.22, 'highpass', 1600, 0.7, e.v, 0, 0.4); break;
    case 'thunder': noise(a, 3.2, 'lowpass', 150, 0.7, e.v, 0, 0.5); noise(a + 0.25, 2.4, 'lowpass', 300, 0.6, e.v * 0.4, 0, 0.5); break;
    case 'crackle': noise(a, 0.05, 'highpass', 2600, 0.8, e.v, e.pan || 0, 0.1); break;
    case 'hiss': noise(a, 0.45, 'bandpass', 650, 0.5, e.v, 0, 0.2); break;`);
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

const BIOME_ADD = {
  dryland: { base: 'savanna', sky: ['#5a4232', '#c4703a', '#f0a45e'], ground: ['#e4c27c', '#caa052', '#a8803a', '#7e5e22'], haze: '255,170,110', hazeA: 0.62, dust: '206,160,110',
    crowns: ['#6a5c26', '#7c6c2e', '#8e7c3c'], keep: 0.32, farKeep: 0.3, amb: { wind: 0.6 } },
  storm: { base: 'savanna', sky: ['#1c232e', '#3a4452', '#66707a'], orb: { x: 0.2, y: 0.1, r: 0.001, col: '#888888', halo: '120,120,120', ha: 0 }, cloud: '110,120,138', cloudA: 0.6,
    ground: ['#8c836c', '#726a54', '#5a5342', '#423d31'], trail: ['138,128,108', '116,106,88'], haze: '118,128,140', hazeA: 0.62, vig: '0,0,10', vigA: 0.45, dust: '138,128,112',
    trunk: '#2a241a', trunkLt: '200,210,230', crowns: ['#323e2a', '#3c4a30', '#4a5a3a'], shadow: '20,20,30', keep: 0.35, farKeep: 0.35, amb: { wind: 1 } },
  canyon: { base: 'desert', sky: ['#4c76ae', '#c4b6a8', '#f2dcc0'], ground: ['#c8a284', '#a9805e', '#8a6448', '#64462f'], trail: ['192,162,132', '162,132,102'],
    haze: '235,208,178', hazeA: 0.5, dust: '200,170,140', keep: 0, farKeep: 0.5, amb: { wind: 0.8 } },
  stormnight: { base: 'night', stars: 0, ff: 0, cloud: '80,92,124', cloudA: 0.5, orb: { x: 0.2, y: 0.18, r: 0.03, col: '#c8d0e8', halo: '150,170,220', ha: 0.12, moon: 1 }, amb: { wind: 1 } },
};
const NIGHT_PANTHER = { fur: ['#2a2d38', '#14161e', '#050608'], far: '#07080c', rim: 'rgb(190,205,255)', lt: '190,205,255' };
const STORM_PANTHER = { fur: ['#2c2f36', '#16181e', '#060708'], far: '#08090c', rim: 'rgb(210,220,240)', lt: '205,215,235' };
const base = { pack: PACK, biomeAdd: BIOME_ADD, endCard: 2.2 };

const EPISODES = [
  { file: 'panthera-11-wildfire.html', ep: 11, title: 'Wildfire', dur: 28, biomes: [['dryland', 0]], next: 'NEXT: FLASH FLOOD',
    panther: DAY_PANTHER, grade: ['#ff5a1a', 0.24], glow: [0.4, '255,150,80'],
    speed: [[0, 800], [9, 800], [9.8, 880], [16, 880], [17, 810], [28, 810]],
    wall: { type: 'fire', fx: [[0, -1250], [5, -950], [9, -700], [11.6, -460], [13, -620], [17, -880], [20, -700], [28, -1300]] },
    river: { at: 20.4, w: 950, col: ['#4f8a90', '#3a6c74'], bank: '#6e5a40' },
    herds: [{ kind: 'impala', dir: 1, fx0: 220, dust: 0.6, zig: 70, speed: [[0, 820], [9, 820], [9.8, 900], [28, 900]], hd: [[0, 0]], leaps: [[5.5, 0.85, 80], [14.6, 0.9, 90], [20.3, 0.9, 110]],
      members: [{ dfx: 0, z: 520 }, { dfx: 140, z: 760, size: 0.95 }, { dfx: 290, z: 600 }, { dfx: -140, z: 900, size: 1.05 }, { dfx: 420, z: -560 }, { dfx: 80, z: -760, size: 0.95 }] }],
    cam: [{ t: 0, yaw: -38, tilt: 10, zoom: 0.72, y: 0.6, x: 0, d: 1100 }, { t: 3.8, yaw: 15, tilt: 9, zoom: 0.62, y: 0.62, x: 0.15, d: 1600 },
      { t: 7.5, yaw: -50, tilt: 14, zoom: 0.74, y: 0.6, x: 0, d: 1100 }, { t: 11, yaw: -25, tilt: 28, zoom: 0.55, d: 1300 }, { t: 13, yaw: -22, tilt: 24, zoom: 0.58 },
      { t: 14.2, yaw: 20, tilt: 10, zoom: 0.88, y: 0.64, x: -0.05, d: 1200 }, { t: 17.5, yaw: -40, tilt: 9, zoom: 0.78, y: 0.6, x: 0, d: 1100 },
      { t: 19.6, yaw: 35, tilt: 26, zoom: 0.7, y: 0.66, d: 1200 }, { t: 22.5, yaw: 25, tilt: 14, zoom: 0.78 }, { t: 24.5, yaw: -45, tilt: 12, zoom: 0.7, y: 0.6 }, { t: 28, yaw: -40, tilt: 11, zoom: 0.72 }],
    slow: [[11.9, 13.0, 0.4]], shake: [[0, 1.1], [10, 1.5], [13.5, 1.6], [17, 1.1], [28, 1]], drums: [[0, 28, 132]], roars: [24.8],
    haze: [[0, 0.4], [12, 0.55], [28, 0.4]], smoke: [[0, 0.55], [11, 0.75], [21, 0.5], [28, 0.35]],
    flashes: [11.6], slashes: [3.6, 13.9, 22.3],
    pops: [{ t: 1.0, text: 'FIRE!!!', size: 0.17, y: 0.5, boom: true }, { t: 11.6, text: 'TOO HOT!', size: 0.16, y: 0.38, boom: true }, { t: 20.6, text: 'SPLASH!', size: 0.13, y: 0.3, bg: '#14e0ff' }, { t: 23.4, text: 'SAFE!', size: 0.14, y: 0.3 }],
    tags: [{ t0: 4.2, t1: 6.8, wall: true, label: 'WILDFIRE', sub: 'HOT WIND · SPREADING FAST' }, { t0: 14.6, t1: 17.0, herd: 0, m: 0, label: 'IMPALA', sub: 'EVERYONE RUNS FROM FIRE' }],
    lines: [[0, 0.55], [11, 0.55], [11.6, 1], [13.2, 1], [14, 0.5], [28, 0.4]], tone: [[0, 0.45], [11.3, 0.45], [11.7, 1], [13.1, 1], [14, 0.45]] },

  { file: 'panthera-12-flash-flood.html', ep: 12, title: 'Flash Flood', dur: 28, biomes: [['storm', 0]], next: 'NEXT: CROCODILE CROSSING',
    panther: STORM_PANTHER, grade: ['#4a7fa8', 0.2], glow: [0.5, '200,215,235'],
    speed: [[0, 810], [9.5, 810], [10.3, 900], [16, 900], [17, 820], [28, 820]],
    bed: { w: 650 }, trickle: [[0, 1400], [6, 3000], [28, 9000]], trickleW: [[0, 60], [6, 160], [28, 300]],
    wall: { type: 'water', fx: [[0, -1150], [4, -950], [8, -760], [11, -560], [13.1, -330], [14.6, -480], [18, -720], [22, -900], [28, -1200]] },
    bolts: [{ t: 0.3, x: 0.72, big: 1, y: 0.45 }, { t: 5.2, x: 0.25 }, { t: 9.8, x: 0.8 }, { t: 16.4, x: 0.3, big: 1 }, { t: 21.2, x: 0.62 }],
    dark: [[0, 0.3], [28, 0.3]], rain: [[0, 0.85], [28, 0.95]],
    herds: [{ kind: 'impala', dir: 1, fx0: 250, dust: 0.3, zig: 60, speed: [[0, 830], [9.5, 830], [10.3, 920], [28, 920]], hd: [[0, 0]], leaps: [[7.0, 0.9, 90], [15.2, 0.95, 110]],
      members: [{ dfx: 0, z: 560 }, { dfx: 150, z: 780 }, { dfx: 300, z: 620, size: 0.95 }, { dfx: -150, z: 920 }, { dfx: 420, z: -600, size: 1.05 }] }],
    cam: [{ t: 0, yaw: -42, tilt: 12, zoom: 0.7, y: 0.6, x: 0, d: 1100 }, { t: 3.5, yaw: 12, tilt: 9, zoom: 0.6, y: 0.62, x: 0.16, d: 1700 },
      { t: 7, yaw: -55, tilt: 16, zoom: 0.72, y: 0.6, x: 0, d: 1100 }, { t: 10.5, yaw: -30, tilt: 34, zoom: 0.55, d: 1300 }, { t: 13, yaw: -28, tilt: 30, zoom: 0.56 },
      { t: 14.6, yaw: 18, tilt: 10, zoom: 0.85, y: 0.64, x: -0.04, d: 1250 }, { t: 18, yaw: -40, tilt: 10, zoom: 0.78, y: 0.6, x: 0, d: 1100 },
      { t: 22, yaw: 5, tilt: 8, zoom: 0.62, y: 0.62, x: 0.15, d: 1600 }, { t: 28, yaw: -20, tilt: 9, zoom: 0.68, x: 0 }],
    slow: [[13.2, 14.3, 0.4]], shake: [[0, 1.2], [10, 1.6], [14, 1.8], [17, 1.2], [28, 1.1]], drums: [[0, 28, 134]], roars: [20.2],
    flashes: [13.1], slashes: [3.3, 14.4, 21.8],
    pops: [{ t: 1.0, text: 'FLOOD!!!', size: 0.17, y: 0.5, boom: true }, { t: 9.4, text: 'HIGHER GROUND!', size: 0.1, y: 0.3, bg: '#14e0ff' }, { t: 13.1, text: 'SPLOOSH!', size: 0.17, y: 0.38, boom: true }, { t: 19.4, text: 'NEAR MISS!', size: 0.12, y: 0.3 }],
    tags: [{ t0: 4.0, t1: 6.6, wall: true, label: 'FLASH FLOOD', sub: 'A WALL OF WATER · 30 KM/H' }, { t0: 15.2, t1: 17.6, herd: 0, m: 0, label: 'IMPALA', sub: 'CAN LEAP 3 METRES HIGH' }],
    lines: [[0, 0.55], [12.5, 0.55], [13.1, 1], [14.4, 1], [15.2, 0.5], [28, 0.45]], tone: [[0, 0.45], [12.8, 0.45], [13.2, 1], [14.4, 1], [15.2, 0.45]] },

  { file: 'panthera-13-crocodile-crossing.html', ep: 13, title: 'Crocodile Crossing', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: ROCKSLIDE',
    panther: DAY_PANTHER, grade: ['#ffa040', 0.16], glow: [0.4, '255,200,140'],
    speed: [[0, 760], [0.5, 760], [1.0, 650], [19.4, 650], [20.1, 800], [28, 800]],
    river: { at: 0.6, w: 12150, col: ['#4f8478', '#3c6a60'], bank: '#6a5636' },
    herds: [
      { kind: 'wildebeest', dir: 1, fx0: 380, dust: 0.2, zig: 30, speed: [[0, 760], [0.5, 760], [1.0, 650], [19.4, 650], [20.1, 800], [28, 800]], hd: [[0, 14]],
        members: [{ dfx: 0, z: 560 }, { dfx: 180, z: -620 }, { dfx: 330, z: 820 }, { dfx: 480, z: -900, size: 1.05 }, { dfx: 640, z: 640 }, { dfx: -220, z: 1050 }, { dfx: 820, z: -560 }, { dfx: 980, z: 980 }, { dfx: -380, z: -820 }] },
      { kind: 'zebra', dir: 1, fx0: 700, dust: 0.2, zig: 40, speed: [[0, 760], [0.5, 760], [1.0, 660], [19.4, 660], [20.1, 810], [28, 810]], hd: [[0, 0]],
        members: [{ dfx: 0, z: -1200 }, { dfx: 160, z: 1300 }, { dfx: 320, z: -1450 }, { dfx: -300, z: 1400 }] }],
    crocs: [
      { at: 1.1, df: 260, z: 640, reach: 300, lunge: true, size: 1.5 }, { at: 5.0, df: 140, z: -640, reach: 300, lunge: true, size: 1.4 },
      { at: 8.7, df: 260, z: 640, reach: 280, lunge: true, size: 1.4 }, { at: 12.1, df: -160, z: -600, reach: 270, lunge: true, size: 1.35 },
      { at: 15.4, df: 160, z: 680, reach: 340, lunge: true, size: 1.6 }, { at: 19.0, df: -260, z: -560, reach: 260, lunge: true, size: 1.4 },
      { at: 3.4, df: 1300, z: -1050, size: 1.3 }, { at: 6.5, df: 1600, z: 1150, size: 1.2 }, { at: 10.0, df: 1400, z: -1250, size: 1.4 }, { at: 13.5, df: 1800, z: 950, size: 1.3 }, { at: 17, df: 1500, z: -900, size: 1.25 }],
    cam: [{ t: 0, yaw: 48, tilt: 18, zoom: 0.66, y: 0.66, x: 0, d: 1150 }, { t: 2.9, yaw: 20, tilt: 12, zoom: 0.66, y: 0.62, x: 0, d: 1500 },
      { t: 4.4, yaw: -40, tilt: 16, zoom: 0.75, y: 0.6, d: 1100 }, { t: 7.5, yaw: 88, tilt: 55, zoom: 0.5, y: 0.56, d: 1300 }, { t: 8.4, yaw: 85, tilt: 52, zoom: 0.52 },
      { t: 10.5, yaw: 30, tilt: 10, zoom: 0.85, y: 0.64, x: -0.05, d: 1200 }, { t: 13.5, yaw: -35, tilt: 12, zoom: 0.75, y: 0.6, x: 0, d: 1100 },
      { t: 17, yaw: 60, tilt: 30, zoom: 0.6, y: 0.64, d: 1200 }, { t: 18.6, yaw: -45, tilt: 12, zoom: 0.75, y: 0.6, d: 1100 },
      { t: 22, yaw: 25, tilt: 10, zoom: 0.95, y: 0.64, x: -0.05, d: 1200 }, { t: 28, yaw: 60, tilt: 16, zoom: 0.85, x: 0 }],
    slow: [[15.5, 16.6, 0.4]], shake: [[0, 1], [15, 1.6], [17, 1], [28, 1]], drums: [[0, 28, 126]], roars: [23.0],
    flashes: [15.45], slashes: [2.8, 10.3, 21.8],
    pops: [{ t: 1.3, text: 'CROC!!!', size: 0.17, y: 0.5, boom: true }, { t: 5.1, text: 'SNAP!', size: 0.13, y: 0.3 }, { t: 15.45, text: 'CHOMP!', size: 0.18, y: 0.38, boom: true }, { t: 19.2, text: 'MISSED!', size: 0.13, y: 0.3, bg: '#14e0ff' }],
    tags: [{ t0: 3.6, t1: 5.0, croc: 1, label: 'NILE CROCODILE', sub: '1-TON BITE · WAITING BELOW' }, { t0: 10.6, t1: 13.0, herd: 0, m: 0, label: 'WILDEBEEST', sub: 'THE GREAT RIVER CROSSING' }],
    lines: [[0, 0.4], [15, 0.4], [15.5, 1], [16.8, 1], [17.5, 0.4], [28, 0.4]], tone: [[0, 0.45], [15.2, 0.45], [15.5, 1], [16.7, 1], [17.4, 0.45]] },

  { file: 'panthera-14-rockslide.html', ep: 14, title: 'Rockslide', dur: 28, biomes: [['canyon', 0]], next: 'NEXT: LIGHTNING STAMPEDE',
    panther: DAY_PANTHER, grade: ['#ff8a4a', 0.15], glow: [0.6, '255,210,160'],
    speed: [[0, 790], [9, 790], [9.8, 880], [14, 880], [15, 800], [28, 800]],
    cliff: { z: -820, h: 1400, until: 21.5 }, rockV: 950,
    rocks: [[1.6, 380, 143], [3.2, -260, 104], [4.4, 520, 130], [5.6, 130, 91], [6.8, -330, 156], [8.0, 290, 117], [9.2, 620, 182], [10.4, -160, 111], [11.6, 200, 169],
      [12.6, -390, 98], [13.8, 430, 130], [15.0, -210, 117], [16.4, 310, 143], [17.8, -270, 104], [19.0, 540, 156], [20.2, -330, 117]],
    rumble: [[0, 0.12], [1.5, 0.2], [20, 0.2], [22, 0.04], [28, 0.02]],
    herds: [{ kind: 'goat', dir: 1, fx0: 260, dust: 0.5, zig: 60, speed: [[0, 810], [9, 810], [9.8, 890], [28, 890]], hd: [[0, 0]], leaps: [[4.0, 0.7, 70], [10.6, 0.75, 90], [17.2, 0.7, 80]],
      members: [{ dfx: 0, z: 420 }, { dfx: 120, z: 600, size: 0.95 }, { dfx: 240, z: 480 }, { dfx: -120, z: 720, size: 1.05 }, { dfx: 360, z: 650 }] }],
    cam: [{ t: 0, yaw: 58, tilt: 16, zoom: 0.78, y: 0.68, x: 0, d: 1100 }, { t: 3.5, yaw: 12, tilt: 10, zoom: 0.64, y: 0.62, x: 0.05, d: 1600 },
      { t: 7, yaw: -40, tilt: 12, zoom: 0.75, y: 0.6, x: 0, d: 1100 }, { t: 10.3, yaw: 30, tilt: 16, zoom: 0.7, y: 0.64 }, { t: 11.3, yaw: 88, tilt: 58, zoom: 0.5, y: 0.56, d: 1300 },
      { t: 14, yaw: 85, tilt: 50, zoom: 0.52 }, { t: 15.5, yaw: 15, tilt: 9, zoom: 0.7, y: 0.62, x: 0.05, d: 1500 }, { t: 19, yaw: -35, tilt: 10, zoom: 0.75, y: 0.6, x: 0, d: 1100 },
      { t: 22, yaw: 65, tilt: 18, zoom: 0.8, y: 0.68, d: 1100 }, { t: 28, yaw: 55, tilt: 15, zoom: 0.82 }],
    slow: [[11.8, 12.9, 0.4]], shake: [[0, 1.3], [11, 1.8], [14, 1.6], [21, 1.2], [23, 0.8], [28, 0.8]], drums: [[0, 28, 130]], roars: [23.4],
    haze: [[0, 0.25], [8, 0.5], [16, 0.7], [21, 0.6], [23, 0.12], [28, 0.08]],
    flashes: [11.6], slashes: [3.3, 15.3, 21.8],
    pops: [{ t: 1.2, text: 'LOOK OUT!', size: 0.15, y: 0.5, boom: true }, { t: 6.8, text: 'DODGE!', size: 0.13, y: 0.3, bg: '#14e0ff' }, { t: 11.6, text: 'CRAAACK!', size: 0.17, y: 0.38, boom: true }, { t: 22.4, text: 'WAY OUT!', size: 0.13, y: 0.3, bg: '#14e0ff' }],
    tags: [{ t0: 3.6, t1: 5.4, rock: 2, label: 'BOULDER', sub: '2 TONS · BOUNCING DOWNHILL' }, { t0: 16.0, t1: 18.4, herd: 0, m: 0, label: 'MOUNTAIN GOATS', sub: 'BORN FOR THIS' }],
    lines: [[0, 0.45], [11, 0.45], [11.6, 1], [13, 1], [14, 0.45], [28, 0.4]], tone: [[0, 0.45], [11.3, 0.45], [11.7, 1], [13, 1], [13.8, 0.45]] },

  { file: 'panthera-15-lightning-stampede.html', ep: 15, title: 'Lightning Stampede', dur: 28, biomes: [['stormnight', 0]], next: 'SEASON 3 · COMING SOON',
    panther: NIGHT_PANTHER, grade: ['#5a6aff', 0.16], glow: [0.2, '170,190,255'],
    speed: [[0, 800], [28, 800]],
    bolts: [{ t: 0.25, x: 0.3, y: 0.45 }, { t: 3.0, x: 0.62, big: 1, y: 0.62 }, { t: 6.4, x: 0.2 }, { t: 9.0, x: 0.8, big: 1 }, { t: 12.5, x: 0.45, big: 1, y: 0.55 },
      { t: 15.2, x: 0.15 }, { t: 18.1, x: 0.7, big: 1 }, { t: 21.5, x: 0.35 }, { t: 24.4, x: 0.6, big: 1 }, { t: 1.6, x: 0.85 }, { t: 4.8, x: 0.4 }, { t: 7.7, x: 0.9 }, { t: 10.6, x: 0.1 }, { t: 13.9, x: 0.75 }, { t: 16.6, x: 0.5 }, { t: 19.8, x: 0.12 }, { t: 23, x: 0.88 }, { t: 26, x: 0.3 }],
    dark: [[0, 0.28], [28, 0.28]], rain: [[0, 0.9], [28, 0.9]],
    herds: [
      { kind: 'buffalo', dir: 1, fx0: -150, dust: 0.6, zig: 30, spread: true, speed: [[0, 700], [3.0, 700], [3.8, 1050], [28, 1050]], hd: [[0, 10], [3, 10], [3.6, 24]], snorts: [0.8, 3.2, 3.6, 9.4, 18.3],
        members: [{ dfx: 0, z: -520 }, { dfx: 160, z: 560 }, { dfx: 320, z: -800, size: 1.06 }, { dfx: -200, z: 760 }, { dfx: 520, z: -460, size: 0.95 }, { dfx: -420, z: -900 },
          { dfx: 700, z: 940 }, { dfx: -640, z: 520, size: 1.05 }, { dfx: 900, z: -650 }, { dfx: -860, z: 820 }, { dfx: 1100, z: -1100, size: 0.95 }, { dfx: -1080, z: -600 }] },
      { kind: 'wildebeest', dir: 1, fx0: -900, dust: 0.6, zig: 40, spread: true, speed: [[0, 700], [3.0, 700], [3.8, 1080], [28, 1080]], hd: [[0, 12], [3, 12], [3.6, 20]],
        members: [{ dfx: 0, z: 1150 }, { dfx: 180, z: -1250 }, { dfx: 360, z: 1350 }, { dfx: -200, z: -1400 }, { dfx: 540, z: 1000 }, { dfx: -400, z: 1250 },
          { dfx: 720, z: -1050 }, { dfx: -600, z: -1150 }, { dfx: 900, z: 1450 }, { dfx: -800, z: 1500 }] }],
    cam: [{ t: 0, yaw: 68, tilt: 28, zoom: 0.6, y: 0.64, x: 0, d: 1200 }, { t: 2.6, yaw: 40, tilt: 14, zoom: 0.7, y: 0.64 },
      { t: 3.6, yaw: -40, tilt: 10, zoom: 0.75, y: 0.6, d: 1000 }, { t: 7, yaw: -30, tilt: 9, zoom: 0.72 }, { t: 9.4, yaw: 90, tilt: 62, zoom: 0.45, y: 0.55, d: 1300 },
      { t: 12.4, yaw: 86, tilt: 56, zoom: 0.48 }, { t: 13.8, yaw: 20, tilt: 9, zoom: 0.7, y: 0.62, x: 0.05, d: 1500 }, { t: 17, yaw: 88, tilt: 22, zoom: 0.75, y: 0.7, x: 0, d: 1000 },
      { t: 20.5, yaw: -35, tilt: 12, zoom: 0.72, y: 0.6, d: 1100 }, { t: 24, yaw: 85, tilt: 50, zoom: 0.5, y: 0.56, d: 1300 }, { t: 28, yaw: 80, tilt: 46, zoom: 0.52 }],
    slow: [[12.6, 13.7, 0.4]], shake: [[0, 0.9], [3, 1.6], [24, 1.6], [28, 1.4]], drums: [[0, 28, 132]], roars: [22.4],
    haze: [[0, 0.15], [28, 0.15]],
    flashes: [3.0], slashes: [7.0, 16.9, 20.3],
    pops: [{ t: 3.0, text: 'KRA-KOOM!', size: 0.16, y: 0.5, boom: true }, { t: 9.3, text: 'STAMPEDE!', size: 0.14, y: 0.3, bg: '#14e0ff' }, { t: 12.6, text: 'BLIND RUN!', size: 0.15, y: 0.38 }, { t: 22.0, text: 'HOLD ON!', size: 0.13, y: 0.3, bg: '#14e0ff' }],
    tags: [{ t0: 4.8, t1: 7.2, herd: 0, m: 0, label: 'CAPE BUFFALO ×12', sub: 'SPOOKED BY THUNDER' }, { t0: 14.2, t1: 16.6, herd: 1, m: 0, label: 'WILDEBEEST ×10', sub: 'NO WAY OUT' }],
    lines: [[0, 0.4], [3, 0.9], [5, 0.6], [12.4, 0.6], [12.7, 1], [13.8, 1], [14.5, 0.6], [28, 0.5]], tone: [[0, 0.4], [2.9, 0.4], [3.1, 1], [4, 0.4], [12.5, 0.4], [12.7, 1], [13.7, 1], [14.4, 0.4]] },
];
module.exports = { disaster, BIOME_ADD };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  disaster({ ...base, ...cfg }, path.join(outDir, file));
});
