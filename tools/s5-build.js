// node s5-build.js <panther-pack-clash-lake.html> <outDir> [only]
// PANTHERA episodes 21-24, with the new anime-faced panthers from panther/panther-rig.js.
const fs = require('fs'), path = require('path');
const { joy } = require('./joy-build.js');
const { BIOME_ADD } = require('./disaster-build.js');
const { DAY_PANTHER, PACK } = require('./hunt-build.js');
const { SNOW_PANTHER } = require('./blitz-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');

function s5(cfg, file) {
  let s = joy(cfg, null);
  const count = a => s.split(a).length - 1;
  const R = (a, b) => { const c = count(a); if (c !== 1) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  R('function drawPop(t) {', chunk('s5.txt') + '\nfunction drawPop(t) {');
  // friends run with their own pace among the pack
  R('  for (const e of ents) e.d = e.fx * RS - e.z * RC;', '  for (const fr of FRIENDS) ents.push({ friend: fr, fx: friendFx(fr, STL), z: friendZ(fr, STL) });\n  for (const e of ents) e.d = e.fx * RS - e.z * RC;');
  R('    if (e.beast) {', '    if (e.friend) {\n      const fr = e.friend; FA = 1; placeAnimal(e.fx, e.z, fr.size || 1); if (AK > 2.4 || Math.abs(AX) > 1400) continue;\n      COAT = fr.coatObj; MARKS = fr.marks || null; DLAG = 0; TAB = fr.tb; drawPanther(t, 0); TAB = TAB0; continue;\n    }\n    if (e.beast) {');
  R('  for (const h of HERDS) h.members.forEach((m, mi) => pts.push({ f: herdFx(h, m, STL)', '  for (const fr of FRIENDS) pts.push({ f: friendFx(fr, STL), z: friendZ(fr, STL), k: fr.size || 1 });\n  for (const h of HERDS) h.members.forEach((m, mi) => pts.push({ f: herdFx(h, m, STL)');
  R('function tagAnchor(g) {', 'function tagAnchor(g) {\n  if (g.friend !== undefined) { const fr = FRIENDS[g.friend], f = friendFx(fr, STL), z = friendZ(fr, STL); return hzVis(f, z) ? P3s(f + 60, 250 * (fr.size || 1), z) : null; }\n  if (g.cat !== undefined) { const a = OURS[g.cat]; return hzVis(a.fx, a.z) ? P3s(a.fx + 60, 250 * a.size, a.z) : null; }');
  R('  drawBed(t); drawRiver(t); drawCliff();', '  drawBed(t); drawRiver(t); drawCliff(); FRIENDS.forEach(fr => fr.island && drawIsland(fr)); drawFalls(t);');
  R('  drawSplashes(t);', '  drawSplashes(t);\n  drawBursts(t);');
  R('if (fx < -4500 || fx > 6500) return;', 'if (fx < -4500 || fx > (CFG.farView || 6500)) return;');   // big herds can be seen coming from further away
  R('function joySky(t) { ctx.setTransform(1, 0, 0, 1, 0, 0); drawRainbow();', 'function joySky(t) { ctx.setTransform(1, 0, 0, 1, 0, 0); drawRainbow(); drawRainbow2();');
  R("g.addColorStop(0, '#c8ab8c'); g.addColorStop(0.55, '#8a6a52'); g.addColorStop(1, '#4a3628');", "if (CFG.rockStyle === 'ice') { g.addColorStop(0, '#f6fcff'); g.addColorStop(0.55, '#a9d6f2'); g.addColorStop(1, '#5584b0'); } else { g.addColorStop(0, '#c8ab8c'); g.addColorStop(0.55, '#8a6a52'); g.addColorStop(1, '#4a3628'); }");
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

const PASTEL = ['#ffd23f', '#ff6fae', '#5ce1e6'];
const PACK_WT = [PACK[0], PACK[1], { coat: 'whiteTiger', marks: 'stripes', size: 1.04 }];
const base = { pack: PACK, biomeAdd: BIOME_ADD, endCard: 2.2 };
const cloud = (t, text, bg, size = 0.13, y = 0.3) => ({ t, text, size, y, shape: 'cloud', bg, fg: '#ffffff' });

const EPISODES = [
  { file: 'panthera-21-waterfall-splash.html', ep: 21, title: 'Waterfall Splash', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: CROCODILE RIVER RESCUE', endText: 'BEST DAY EVER!',
    panther: DAY_PANTHER, pack: PACK_WT, grade: ['#7fd4ff', 0.12], glow: [0.45, '255,240,210'], accent: PASTEL, toneCol: '#ff9fc8', joyHud: true,
    drums: [], roars: [], slow: [], flashes: [],
    music: { seed: 21, bpm: 124, root: 67, prog: 'sunny', lead: 'flute', arp: 'harp' },
    speed: [[0, 700], [0.55, 700], [1.0, 560], [8.8, 560], [9.4, 650], [28, 650]],
    river: { at: 0.5, w: 4500, col: ['#5fc0d8', '#46a8c4'], bank: '#cfa86a' },
    falls: { z: -1250, h: 950, from: 0.2, until: 8.9 },
    bursts: [{ t: 0.55, f: 130, z: 0, size: 1.5 }, { t: 0.7, f: 60, z: -260, size: 1.1 }, { t: 0.8, f: 120, z: 220, size: 1.1 }, { t: 4.2, f: 300, z: 640, size: 1.2 }, { t: 6.4, f: 260, z: -700, size: 1.1 }],
    herds: [{ kind: 'impala', dir: 1, fx0: 220, dust: 0.3, zig: 70, speed: [[0, 705], [0.55, 705], [1.0, 565], [8.8, 565], [9.4, 655], [28, 655]], hd: [[0, 0]],
      leaps: [[1.5, 0.8, 110], [4.0, 0.8, 120], [6.2, 0.8, 115], [11.5, 0.75, 90], [17.5, 0.75, 95]],
      members: [{ dfx: 0, z: 600 }, { dfx: 140, z: 780 }, { dfx: 280, z: 640, size: 0.95 }, { dfx: -140, z: -680 }, { dfx: 60, z: -860, size: 1.05 }] }],
    butterflies: 6, birds: 6, rainbow: [[0, 0], [9.0, 0], [11.0, 1], [28, 1]], rainbow2: true, sparkle: [[0, 0.5], [9, 0.9], [28, 0.6]],
    hearts: [5.0, 12.5, 20.5], joy: [[0, 2], [4, 3], [11, 4], [19, 5]],
    cam: [{ t: 0, yaw: 48, tilt: 18, zoom: 0.78, y: 0.66, x: 0, d: 1150 }, { t: 2.6, yaw: 14, tilt: 10, zoom: 0.68, y: 0.62, x: 0.1, d: 1500 },
      { t: 6, yaw: -38, tilt: 12, zoom: 0.8, y: 0.6, x: 0, d: 1100 }, { t: 9.4, yaw: 60, tilt: 24, zoom: 0.62, y: 0.7, d: 1300 }, { t: 13, yaw: 20, tilt: 10, zoom: 0.9, y: 0.64, d: 1200 },
      { t: 17, yaw: 88, tilt: 50, zoom: 0.55, y: 0.58, d: 1300 }, { t: 21, yaw: -30, tilt: 10, zoom: 0.85, y: 0.6, d: 1100 }, { t: 28, yaw: 25, tilt: 11, zoom: 0.82 }],
    shake: [[0, 0.25]], lines: [[0, 0]], tone: [[0, 0.2]], slashes: [8.9, 16.8],
    pops: [cloud(0.9, 'SPLASH!!!', '#5ce1e6', 0.16, 0.5), cloud(4.4, 'NEW FRIEND!', '#ff6fae'), cloud(11.2, 'DOUBLE RAINBOW!', '#b388ff', 0.11, 0.55), cloud(21.0, 'AGAIN! AGAIN!', '#ffd23f', 0.11)],
    tags: [{ t0: 4.6, t1: 7.4, cat: 2, label: 'WHITE TIGER', sub: 'JOINS THE PACK!' }, { t0: 13.5, t1: 16, herd: 0, m: 0, label: 'IMPALA', sub: 'CAN LEAP 10 METRES' }] },

  { file: 'panthera-22-crocodile-river-rescue.html', ep: 22, title: 'Crocodile River Rescue', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: AVALANCHE 2 — ICE MOUNTAIN', endText: 'FRIENDS FOREVER!',
    panther: DAY_PANTHER, grade: ['#ffa040', 0.14], glow: [0.4, '255,200,140'],
    speed: [[0, 740], [0.6, 740], [1.1, 640], [16.2, 640], [16.8, 780], [28, 780]],
    river: { at: 0.8, w: 9900, col: ['#4f8478', '#3c6a60'], bank: '#6a5636' },
    friends: [{ coat: 'snowLeopard', marks: 'rosettes', size: 0.92, island: true, at: [6.8, 60], z: [[0, 470], [7.0, 470], [8.6, 400]],
      speed: [[0, 0], [6.7, 0], [7.4, 640], [16.2, 640], [16.8, 780], [28, 780]] }],
    crocs: [
      { at: 0.95, df: 320, z: 660, reach: 300, lunge: true, size: 1.5 },
      { at: 6.8, df: -380, z: 960, size: 1.4 }, { at: 6.8, df: 460, z: 880, size: 1.3 }, { at: 6.8, df: 120, z: 1180, size: 1.5 },
      { at: 6.3, df: 180, z: 900, reach: 260, lunge: true, size: 1.5 }, { at: 9.6, df: -200, z: -640, reach: 290, lunge: true, size: 1.4 },
      { at: 12.65, df: -140, z: 760, reach: 320, lunge: true, size: 1.6 }, { at: 15.8, df: -260, z: -600, reach: 270, lunge: true, size: 1.4 },
      { at: 3.4, df: 1300, z: -1050, size: 1.3 }, { at: 11, df: 1500, z: -1200, size: 1.3 }],
    herds: [{ kind: 'wildebeest', dir: 1, fx0: 600, dust: 0.2, zig: 30, speed: [[0, 740], [0.6, 740], [1.1, 640], [16.2, 640], [16.8, 780], [28, 780]], hd: [[0, 14]],
      members: [{ dfx: 0, z: -820 }, { dfx: 200, z: -1100 }, { dfx: 380, z: -900, size: 1.05 }, { dfx: -260, z: -1250 }] }],
    cam: [{ t: 0, yaw: 44, tilt: 16, zoom: 0.68, y: 0.66, x: 0, d: 1150 }, { t: 2.2, yaw: 88, tilt: 20, zoom: 0.66, y: 0.7, x: -0.08, d: 1200 },
      { t: 5.4, yaw: 84, tilt: 18, zoom: 0.74, y: 0.7, x: -0.06 }, { t: 6.8, yaw: 30, tilt: 12, zoom: 0.74, y: 0.62, x: 0, d: 1300 }, { t: 8.4, yaw: -40, tilt: 14, zoom: 0.78, y: 0.6, d: 1100 },
      { t: 11.5, yaw: 88, tilt: 52, zoom: 0.52, y: 0.56, d: 1300 }, { t: 14.4, yaw: -45, tilt: 12, zoom: 0.75, y: 0.6, d: 1100 },
      { t: 18, yaw: 25, tilt: 10, zoom: 0.92, y: 0.64, d: 1200 }, { t: 23, yaw: 60, tilt: 18, zoom: 0.85, y: 0.66 }, { t: 28, yaw: 40, tilt: 14, zoom: 0.85 }],
    slow: [[12.75, 13.85, 0.4]], shake: [[0, 1], [12, 1.6], [14.5, 1], [28, 0.8]], drums: [[0, 17.5, 126]], roars: [19.2],
    hearts: [17.6, 21.4], flashes: [12.65], slashes: [2.4, 8.2, 17.2],
    pops: [{ t: 1.15, text: 'CROC!!!', size: 0.17, y: 0.5, boom: true }, { t: 5.2, text: 'HOLD ON!', size: 0.13, y: 0.3, bg: '#14e0ff' }, { t: 7.3, text: 'JUMP IN!', size: 0.14, y: 0.3 },
      { t: 12.65, text: 'CHOMP!', size: 0.18, y: 0.38, boom: true }, { t: 16.8, text: 'SAFE!', size: 0.15, y: 0.3, bg: '#14e0ff' }],
    tags: [{ t0: 2.4, t1: 5.0, friend: 0, label: 'SNOW LEOPARD', sub: 'STUCK ON A ROCK!' }, { t0: 9.8, t1: 11.6, croc: 5, label: 'NILE CROCODILES', sub: 'CIRCLING CLOSER' }],
    lines: [[0, 0.4], [12.3, 0.4], [12.7, 1], [14, 1], [15, 0.4], [17, 0.2], [28, 0.2]], tone: [[0, 0.45], [12.4, 0.45], [12.7, 1], [13.9, 1], [14.6, 0.45]] },

  { file: 'panthera-23-avalanche-ice-mountain.html', ep: 23, title: 'Avalanche 2: Ice Mountain', dur: 28, biomes: [['snow', 0]], next: 'NEXT: HEAD-ON — ELEPHANT HERD',
    panther: SNOW_PANTHER, grade: ['#6fa8ff', 0.2], glow: [0.75, '220,235,255'], toneCol: '#14e0ff',
    speed: [[0, 810], [9.5, 810], [10.3, 910], [16, 910], [17, 830], [28, 830]],
    wall: { fx: [[0, -1250], [5, -980], [9, -720], [12.5, -520], [15, -700], [19, -950], [23, -860], [28, -1150]] },
    friends: [{ coat: 'snowLeopard', marks: 'rosettes', size: 0.94, at: [0, 330], z: 40, speed: [[0, 810], [9.5, 810], [10.3, 910], [16, 910], [17, 830], [28, 830]] }],
    rockStyle: 'ice', rockV: 1150,
    rocks: [[2.2, 520, 90], [4.6, -300, 70], [6.9, 460, 110], [8.8, 240, 80], [11.2, 600, 120], [13.4, -260, 90], [15.8, 380, 100], [18.4, -340, 80]],
    herds: [{ kind: 'deer', dir: 1, fx0: 200, dust: 0.8, zig: 70, speed: [[0, 810], [9.5, 810], [10.3, 910], [28, 910]], hd: [[0, -4]], leaps: [[5.5, 0.9, 85], [12.3, 0.95, 95], [18.5, 0.9, 80]],
      members: [{ dfx: 0, z: 600, size: 1.08 }, { dfx: 150, z: 800 }, { dfx: 290, z: 640, size: 0.95 }, { dfx: 420, z: -660 }] }],
    cam: [{ t: 0, yaw: -40, tilt: 10, zoom: 0.72, y: 0.6, x: 0, d: 1100 }, { t: 4, yaw: 15, tilt: 9, zoom: 0.62, y: 0.62, x: 0.12, d: 1600 },
      { t: 8, yaw: -55, tilt: 14, zoom: 0.7, y: 0.6, x: 0, d: 1100 }, { t: 11.5, yaw: -30, tilt: 30, zoom: 0.55, y: 0.6, d: 1300 }, { t: 13.6, yaw: -25, tilt: 26, zoom: 0.58 },
      { t: 15, yaw: 25, tilt: 10, zoom: 0.9, y: 0.64, x: -0.05, d: 1200 }, { t: 19, yaw: -40, tilt: 9, zoom: 0.8, y: 0.6, x: 0, d: 1100 },
      { t: 23, yaw: 5, tilt: 8, zoom: 0.62, y: 0.62, x: 0.15, d: 1600 }, { t: 28, yaw: -20, tilt: 9, zoom: 0.7, x: 0 }],
    slow: [[12.6, 13.8, 0.4]], shake: [[0, 1.2], [10, 1.6], [14, 1.8], [17, 1.3], [28, 1.2]], drums: [[0, 28, 136]], roars: [20.4],
    flashes: [12.6], slashes: [3.8, 14.8, 22.8],
    pops: [{ t: 0.9, text: 'RUN!!!', size: 0.17, y: 0.5, boom: true }, { t: 6.6, text: 'FOLLOW HER!', size: 0.12, y: 0.3, bg: '#14e0ff' }, { t: 12.6, text: 'WHUMP!', size: 0.18, y: 0.4, boom: true }, { t: 20.0, text: 'WE MADE IT!', size: 0.13, y: 0.3 }],
    tags: [{ t0: 2.6, t1: 5.2, friend: 0, label: 'SNOW LEOPARD', sub: 'KNOWS EVERY SAFE PATH' }, { t0: 7.4, t1: 9.6, wall: true, label: 'AVALANCHE', sub: '130 KM/H OF SNOW' }, { t0: 10.4, t1: 12.2, rock: 4, label: 'ICE BLOCKS', sub: 'FLYING DOWNHILL' }],
    lines: [[0, 0.6], [12, 0.6], [12.6, 1], [14, 1], [15, 0.6], [28, 0.5]], tone: [[0, 0.5], [12.3, 0.5], [12.7, 1], [14, 1], [15, 0.5]] },

  { file: 'panthera-24-head-on-elephant-herd.html', ep: 24, title: 'Head-On: Elephant Herd', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: MEET THE PANTHERS PACK', farView: 11500,
    panther: DAY_PANTHER, grade: ['#ff9a3c', 0.18], glow: [0.35, '255,190,120'],
    speed: [[0, 780], [6.1, 780], [6.9, 900], [10.5, 900], [11.7, 790], [18.2, 790], [18.9, 900], [22, 900], [23, 800], [28, 800]],
    herds: [
      { kind: 'gazelle', dir: 1, fx0: 650, dust: 0.5, zig: 80, speed: [[0, 780], [2, 780], [3.2, 940], [28, 940]], hd: [[0, 0]], leaps: [[1.6, 0.8, 70]], zShift: [[0, 0], [2.4, 0], [5, -1800]],
        members: [{ dfx: 0, z: 30 }, { dfx: 110, z: -170, size: 0.95 }, { dfx: 200, z: 190 }, { dfx: 310, z: -60, size: 1.05 }] },
      { kind: 'elephant', dir: -1, at: [7.0, 420], dust: 1.0, zig: 15, spread: true, speed: [[0, 700], [28, 700]], hd: [[0, 12]],
        members: [{ dfx: 0, z: -620 }, { dfx: 140, z: 680, size: 1.05 }, { dfx: 380, z: -980, size: 0.95 }, { dfx: 480, z: 900 }, { dfx: 760, z: -660, size: 1.1 },
          { dfx: 880, z: 1180, size: 0.9 }, { dfx: 1140, z: -1250 }, { dfx: 1260, z: 640, size: 1.05 }, { dfx: 1520, z: -820 }, { dfx: 1640, z: 1000, size: 0.95 }] },
      { kind: 'elephant', dir: -1, at: [19.5, 380], dust: 1.0, zig: 15, spread: true, speed: [[0, 720], [28, 720]], hd: [[0, 14]],
        members: [{ dfx: 0, z: 600 }, { dfx: 180, z: -640, size: 1.1 }, { dfx: 420, z: 900, size: 0.95 }, { dfx: 600, z: -1000 }] }],
    trumpets: [1.2, 5.6, 7.0, 8.2, 17.4, 19.4],
    cam: [{ t: 0, yaw: 88, tilt: 16, zoom: 0.8, y: 0.7, x: 0, d: 1000 }, { t: 6.4, yaw: 90, tilt: 22, zoom: 0.74 },
      { t: 7.1, yaw: 90, tilt: 62, zoom: 0.46, y: 0.56, d: 1300 }, { t: 9.3, yaw: 80, tilt: 55, zoom: 0.48 },
      { t: 10.5, yaw: -40, tilt: 10, zoom: 0.78, y: 0.6, x: 0, d: 1000 }, { t: 14, yaw: 25, tilt: 10, zoom: 0.95, y: 0.64, x: -0.05, d: 1200 },
      { t: 16.6, yaw: 88, tilt: 18, zoom: 0.78, y: 0.7, x: 0, d: 1000 }, { t: 19.3, yaw: 90, tilt: 24, zoom: 0.74 },
      { t: 19.9, yaw: 88, tilt: 60, zoom: 0.48, y: 0.56, d: 1300 }, { t: 22, yaw: -35, tilt: 10, zoom: 0.8, y: 0.6, d: 1000 }, { t: 28, yaw: 40, tilt: 12, zoom: 0.9, y: 0.64 }],
    slow: [[7.5, 8.6, 0.4]], shake: [[0, 1.0], [6.4, 1.2], [7.0, 2.0], [9.5, 2.0], [11, 1], [19, 1.2], [19.5, 2], [21.5, 1.8], [23, 1], [28, 1]], drums: [[0, 28, 132]], roars: [24.8],
    flashes: [7.05, 19.55], slashes: [10.35, 21.85],
    pops: [{ t: 1.0, text: 'INCOMING!', size: 0.14, y: 0.5 }, { t: 7.05, text: 'STOMP!', size: 0.2, y: 0.4, boom: true, rot: -9 }, { t: 9.0, text: 'BETWEEN THE LEGS!', size: 0.09, y: 0.3, bg: '#14e0ff' },
      { t: 17.2, text: 'AGAIN?!', size: 0.15, y: 0.3 }, { t: 19.55, text: 'STOMP STOMP!', size: 0.15, y: 0.4, boom: true }, { t: 23.2, text: 'MADE IT!', size: 0.13, y: 0.3, bg: '#14e0ff' }],
    tags: [{ t0: 1.6, t1: 4.2, herd: 1, m: 0, label: 'ELEPHANTS ×10', sub: '6 TONS EACH · HEAD-ON' }, { t0: 15.4, t1: 17.0, herd: 2, m: 0, label: 'SECOND HERD', sub: 'HERE THEY COME AGAIN' }],
    lines: [[0, 0.45], [6.6, 0.45], [7.0, 1], [9.4, 1], [10.4, 0.35], [19, 0.4], [19.5, 1], [21.6, 1], [22.6, 0.4], [28, 0.4]],
    tone: [[0, 0.45], [6.8, 0.45], [7.1, 1], [9.2, 1], [10.2, 0.45], [19.3, 0.45], [19.6, 1], [21.5, 1], [22.4, 0.45]] },
];
module.exports = { s5 };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  s5({ ...base, ...cfg }, path.join(outDir, file));
});
