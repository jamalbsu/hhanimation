// node season7-build.js <panther-pack-clash-lake.html> <outDir> [only]
// PANTHERA Season 7 — THE RAIN RUN, episodes 36-40. Built on season6(): the same engine plus season7.txt (calf, tortoise, ostrich, fennecs,
// oxpecker, keyed actors, a cliff edge, a flash flood). The scripts are in stories/season7/.
const fs = require('fs'), path = require('path');
const { season6 } = require('./season6-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');
const { BIOME_ADD } = require('./disaster-build.js');
const { DAY_PANTHER, PACK } = require('./hunt-build.js');

function season7(cfg, file) {
  let s = season6(cfg, null);
  const count = a => s.split(a).length - 1;
  const R = (a, b) => { const c = count(a); if (c !== 1) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  R('function drawPop(t) {', chunk('season7.txt') + '\nfunction drawPop(t) {');
  R('  s6Before(t);', '  s6Before(t);\n  s7Before(t);');
  R('  s6After(t);', '  s6After(t);\n  s7After(t);');
  // a sand wall: the chasing wall in the colours of a red dune
  R("else if (CFG.wall.ocean) hzPuff(p[0], p[1], r, 'rgba(50,150,190,1)', 'rgba(32,118,160,0.97)', 'rgba(20,90,130,0)');", "else if (CFG.wall.sand) hzPuff(p[0], p[1], r, 'rgba(214,112,56,1)', 'rgba(176,84,44,0.97)', 'rgba(120,56,34,0)'); else if (CFG.wall.ocean) hzPuff(p[0], p[1], r, 'rgba(50,150,190,1)', 'rgba(32,118,160,0.97)', 'rgba(20,90,130,0)');");
  R("else if (it.l === 2) { if (CFG.wall.ocean)", "else if (it.l === 2) { if (CFG.wall.sand) hzPuff(p[0], p[1], r, 'rgba(250,170,96,1)', 'rgba(226,128,70,0.95)', 'rgba(170,84,50,0)'); else if (CFG.wall.ocean)");
  // added biomes keep their base colours unless the derived palette is rebuilt (this also fixes sky and ground for the new lands)
  R('for (const [k, v] of Object.entries(CFG.biomeAdd || {})) BIOMES[k] = Object.assign({}, BIOMES[v.base], v);',
    'for (const [k, v] of Object.entries(CFG.biomeAdd || {})) { const nb = BIOMES[k] = Object.assign({}, BIOMES[v.base], v); nb.c = {}; for (const p of P_COLS) nb.c[p] = rgbOf(nb[p]); for (const p of P_LISTS) nb.c[p] = nb[p].map(rgbOf); }');
  R("if (it.l === 4) hzPuff(p[0], p[1], r, 'rgba(255,255,255,1)', 'rgba(236,240,240,0.92)', 'rgba(220,226,226,0)');", "if (it.l === 4) { if (CFG.wall.sand) hzPuff(p[0], p[1], r, 'rgba(255,216,164,1)', 'rgba(240,184,124,0.9)', 'rgba(220,150,100,0)'); else hzPuff(p[0], p[1], r, 'rgba(255,255,255,1)', 'rgba(236,240,240,0.92)', 'rgba(220,226,226,0)'); }");
  R("else if (it.l === 3) hzPuff(p[0], p[1], r, 'rgba(250,246,236,0.98)', 'rgba(226,214,190,0.85)', 'rgba(200,186,160,0)');", "else if (it.l === 3) { if (CFG.wall.sand) hzPuff(p[0], p[1], r, 'rgba(244,176,116,0.98)', 'rgba(216,140,86,0.85)', 'rgba(190,110,70,0)'); else hzPuff(p[0], p[1], r, 'rgba(250,246,236,0.98)', 'rgba(226,214,190,0.85)', 'rgba(200,186,160,0)'); }");
  // the snow-style wall (the one the avalanche uses) in sand colours: warm edges and sand-coloured spray
  R("g.addColorStop(0.8, `rgba(150,170,205,0.9)`);", "g.addColorStop(0.8, CFG.wall.sand ? `rgba(206,104,58,0.9)` : `rgba(150,170,205,0.9)`);");
  R("g.addColorStop(0.93, `rgba(120,140,180,0.45)`);", "g.addColorStop(0.93, CFG.wall.sand ? `rgba(170,80,50,0.45)` : `rgba(120,140,180,0.45)`);");
  R("ctx.fillStyle = 'rgba(255,255,255,0.85)';\n  for (let i = 0; i < 90; i++) {", "ctx.fillStyle = CFG.wall.sand ? 'rgba(255,206,140,0.85)' : 'rgba(255,255,255,0.85)';\n  for (let i = 0; i < 90; i++) {");
  R('drawRainbow(); drawRainbow2();', 'drawStorm(t); drawRainbow(); drawRainbow2();');
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

const BIO = { ...BIOME_ADD,
  grass: { base: 'savanna', sky: ['#5a8cc8', '#b9d4ea', '#f4e6c0'], ground: ['#e4c27c', '#caa052', '#a8803a', '#7e5e22'], haze: '240,225,190', hazeA: 0.4, dust: '206,160,110', keep: 0.25, farKeep: 0.25, amb: { wind: 0.7 } },
  dunes: { base: 'desert', sky: ['#3b2f6e', '#e0703c', '#ffc27a'], ground: ['#e8843c', '#c9622e', '#8a3a2a', '#5a2a22'], trail: ['236,160,100', '214,130,84'], haze: '236,160,100', hazeA: 0.5, keep: 0, farKeep: 0.2, dust: '236,160,100', amb: { wind: 1 } },
  fog: { base: 'savanna', sky: ['#c9d3da', '#dde3e6', '#eef0ee'], ground: ['#6f8a5a', '#5e7a4c', '#6e5340', '#4a3a2e'], haze: '233,237,240', hazeA: 0.82, dust: '150,130,110', keep: 0.4, farKeep: 0.3, amb: { wind: 0.4 } },
  drybed: { base: 'savanna', sky: ['#2a3442', '#4a5666', '#a8a090'], ground: ['#cdb89a', '#bca682', '#9a8662', '#6e5e44'], trail: ['205,184,154', '188,166,130'], haze: '200,190,170', hazeA: 0.5, dust: '206,184,150', keep: 0.1, farKeep: 0.2, amb: { wind: 0.9 } },
  greenup: { base: 'savanna', sky: ['#5a8cc8', '#a8cce4', '#f4e6c0'], ground: ['#7fbf5a', '#6aa84a', '#4e8c38', '#386a28'], haze: '230,240,220', hazeA: 0.35, dust: '170,200,130', keep: 0.4, farKeep: 0.3, amb: { wind: 0.4, birds: 0.6 } },
};
const EPIC = (seed, root, bpm, extra) => ({ seed, bpm, root, minor: true, prog: 'epic', lead: 'brass', arp: 'harp', pad: 'strings', epic: true, vol: 0.95, ...extra });
const base = { pack: PACK, biomeAdd: BIO, endCard: 2.2, depth: true, real: true, sound2: true, farView: 11500, drums: [], roars: [], panther: DAY_PANTHER };
const cloud = (t, text, bg, size = 0.13, y = 0.3) => ({ t, text, size, y, shape: 'cloud', bg, fg: '#ffffff' });
const keep = (a, t, v) => a;

const EPISODES = [
  // 36 — Buffalo River. Hook: buffalo head-on in the spray. Meet: a calf swept away. Twist: the herd comes back. Payoff: run to them.
  { file: 'panthera-36-buffalo-river.html', ep: 36, title: 'Buffalo River', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: ZEBRA CROSSING',
    grade: ['#ffa040', 0.12], glow: [0.5, '255,210,150'], rays: { x: 0.2, y: 0.03, col: '255,225,170', a: 0.06 }, music: EPIC(36, 57, 120),
    speed: [[0, 760], [28, 760]],
    river: { at: 0.2, w: 22000, col: ['#4f9aa0', '#3c7c84'], bank: '#8a6e48' },
    herds: [
      { kind: 'buffalo', dir: -1, at: [1.2, 320], spray: true, dust: 0, spread: true, speed: [[0, 520], [28, 520]], hd: [[0, 6]], snorts: [0.6, 1.4],
        members: [{ dfx: 0, z: -470 }, { dfx: 120, z: 520, size: 1.1 }, { dfx: 260, z: -760 }, { dfx: 380, z: 760 }, { dfx: 540, z: -300 }, { dfx: 640, z: 330, size: 1.1 }, { dfx: 760, z: -900 }, { dfx: 860, z: 900 }] },
      { kind: 'buffalo', dir: -1, at: [16.0, 640], spray: true, dust: 0, spread: true, speed: [[0, 0], [10.6, 0], [11.6, 640], [15.2, 640], [16.2, 0], [28, 0]], hd: [[0, 6]], snorts: [11.8, 12.6, 14],
        members: [{ dfx: 0, z: -420, size: 1.2 }, { dfx: 140, z: 440 }, { dfx: 300, z: -760 }, { dfx: 420, z: 740 }, { dfx: 560, z: -240 }, { dfx: 700, z: 560 }] },
      { kind: 'buffalo', dir: 1, fx0: -250, dust: 0.4, spray: true, speed: [[0, 0], [18.4, 0], [19.2, 900], [28, 800]], hd: [[0, 0]], members: [{ dfx: 0, z: -620 }, { dfx: 180, z: 640 }, { dfx: 360, z: -900 }, { dfx: 480, z: 920 }] }],
    flamingos: { t0: 3.4, n: 26 },
    riders: [{ kind: 'calf', from: 8.2, until: 17.5, cat: 2, size: 26, dx: 20 }],
    actors: [{ kind: 'calf', at: 5, df: [[5.0, 500], [6.8, 150], [7.6, 0]], z: [[5.0, 340], [7.0, 250], [7.6, 190]], hg: [[5, 20], [28, 20]], from: 5.0, until: 7.8, size: 28 },
      { kind: 'calf', at: 17.4, df: [[17.4, 700], [28, 700]], z: [[17.4, -260], [28, -260]], hg: [[17, 10]], from: 17.4, until: 18.6, size: 28 }],
    shoal: undefined,
    compass: undefined,
    cam: [{ t: 0, yaw: 86, tilt: 18, zoom: 0.72, y: 0.7, x: 0, d: 1000 }, { t: 1.4, yaw: 90, tilt: 24, zoom: 0.72 }, { t: 1.8, yaw: 90, tilt: 58, zoom: 0.5, y: 0.56, d: 1300 }, { t: 3.2, yaw: 80, tilt: 46, zoom: 0.52 },
      { t: 3.8, yaw: 18, tilt: 12, zoom: 0.62, y: 0.64, x: 0.05, d: 1500 }, { t: 6.4, yaw: 40, tilt: 16, zoom: 0.8, y: 0.66, d: 1200 }, { t: 8.0, yaw: 20, tilt: 10, zoom: 1.0, y: 0.64, x: -0.04, d: 1200 },
      { t: 11, yaw: 70, tilt: 14, zoom: 0.74, y: 0.66, x: 0, d: 1100 }, { t: 12.4, yaw: 82, tilt: 14, zoom: 0.8, y: 0.7, d: 1000 }, { t: 14.6, yaw: 20, tilt: 10, zoom: 0.9, y: 0.64, d: 1200 },
      { t: 15.4, yaw: 8, tilt: 5, zoom: 0.9, y: 0.7, d: 1100 }, { t: 17.2, yaw: 40, tilt: 12, zoom: 0.8, y: 0.66, d: 1300 }, { t: 20, yaw: 50, tilt: 14, zoom: 0.74, y: 0.64 }, { t: 28, yaw: 55, tilt: 16, zoom: 0.72 }],
    slow: [[1.8, 3.0, 0.45], [15.0, 16.2, 0.4]], shake: [[0, 1.2], [3.2, 1.2], [4, 0.5], [11.6, 1.6], [16, 1.6], [17.4, 0.6], [28, 0.5]], flashes: [0.45, 11.85, 16.2], slashes: [3.4, 18.4],
    says: [{ t0: 5.4, t1: 6.6, pt: [5, 300, 340, 80], text: 'MAMA!|HELP!' }, { t0: 6.8, t1: 7.8, cat: 2, text: "I'VE GOT HIM!" }, { t0: 8.2, t1: 9.6, cat: 2, text: "YOU'RE A...|SPOTTY BUFFALO?" },
      { t0: 12.5, t1: 13.5, herd: 1, m: 0, text: 'GIVE BACK|MY BABY!' }, { t0: 13.6, t1: 14.9, me: true, text: "DON'T RUN AWAY.|RUN TO THEM!" }, { t0: 15.0, t1: 16.1, cat: 2, text: 'MAMA!|THEY SAVED ME!' },
      { t0: 21.0, t1: 22.9, herd: 2, m: 0, text: "RIVER'S DRYING UP.|BIRDS FLY TO THE RAIN!" }, { t0: 23.2, t1: 25.0, me: true, text: 'THEN WE FOLLOW|THE BIRDS!' }],
    pops: [{ t: 0.9, text: 'BUFFALO!', size: 0.16, y: 0.72 }, { t: 11.85, text: "THEY'RE BACK!", size: 0.14, y: 0.38, boom: true }, { t: 16.2, text: 'SPLAAASH!', size: 0.17, y: 0.38, boom: true }, cloud(17.6, 'FAMILY!', '#ff9ac8', 0.11)],
    tags: [{ t0: 1.0, t1: 1.9, herd: 0, m: 0, label: 'CAPE BUFFALO ×8', sub: '800 KG EACH · HEAD-ON' }],
    lines: [[0, 0.5], [1.5, 1], [3.2, 1], [4, 0.25], [11.4, 0.3], [11.8, 1], [15.2, 1], [15.4, 0.2], [16.2, 1], [17.4, 0.3], [28, 0.3]], tone: [[0, 0.4], [1.5, 1], [3.0, 1], [3.8, 0.35], [11.6, 0.35], [11.9, 1], [12.8, 0.35]] },

  // 37 — Zebra Crossing. Hook: zebras from both sides. Meet: a tortoise. Twist: no gap. Payoff: stand still.
  { file: 'panthera-37-zebra-crossing.html', ep: 37, title: 'Zebra Crossing', dur: 28, biomes: [['grass', 0]], next: 'NEXT: SAND AVALANCHE',
    grade: ['#ffcf70', 0.08], glow: [0.4, '255,236,190'], music: { seed: 37, bpm: 126, root: 60, prog: 'hope', lead: 'whistle', arp: 'harp', pad: 'strings', epic: true }, whipCol: '110,86,44',
    speed: [[0, 780], [14.0, 780], [14.8, 110], [17.4, 110], [17.9, 800], [28, 800]],
    herds: [
      { kind: 'zebra', dir: -1, at: [1.5, 360], dust: 0.8, spread: true, speed: [[0, 700], [28, 700]], hd: [[0, 18]],
        members: [{ dfx: 0, z: -520 }, { dfx: 120, z: -820 }, { dfx: 260, z: -380, size: 0.95 }, { dfx: 380, z: -980 }, { dfx: 500, z: -620 }, { dfx: 640, z: -460 }] },
      { kind: 'zebra', dir: -1, at: [1.9, 360], dust: 0.8, spread: true, speed: [[0, 700], [28, 700]], hd: [[0, 18]],
        members: [{ dfx: 0, z: 520 }, { dfx: 120, z: 820 }, { dfx: 260, z: 380, size: 0.95 }, { dfx: 380, z: 980 }, { dfx: 500, z: 620 }, { dfx: 640, z: 460 }] },
      { kind: 'zebra', dir: -1, at: [16.0, 380], dust: 0.8, spread: true, speed: [[0, 720], [28, 720]], hd: [[0, 18]],
        members: [{ dfx: 0, z: -330 }, { dfx: 100, z: -560 }, { dfx: 240, z: -760 }, { dfx: 360, z: -420 }, { dfx: 480, z: 330 }, { dfx: 580, z: 560 }, { dfx: 700, z: 760 }, { dfx: 820, z: 420 }] },
      { kind: 'zebra', dir: 1, fx0: -300, dust: 0.5, speed: [[0, 0], [19.8, 0], [20.6, 860], [28, 800]], hd: [[0, 0]], members: [{ dfx: 0, z: -680 }, { dfx: 150, z: 700 }, { dfx: 300, z: -940 }, { dfx: 420, z: 960 }] }],
    riders: [{ kind: 'tortoise', from: 7.2, until: 24.0, cat: 1, size: 24, dx: 30 }],
    actors: [{ kind: 'ostrich', at: 4.4, df: [[4.4, -500], [5.0, -100], [5.8, 600], [6.2, 2400]], z: [[4.4, 520], [6.2, 520]], from: 4.4, until: 6.2, size: 26 },
      { kind: 'tortoise', at: 6.2, df: [[6.2, 300], [7.0, 300]], z: [[6.2, 330], [7.0, 190]], from: 6.2, until: 7.2, size: 28 },
      { kind: 'ostrich', i: 9, at: 20, df: [[20, 500], [21.2, 500]], z: [[20, 500], [21.2, 500]], from: 19.4, until: 21.4, size: 15 },
      { kind: 'tortoise', at: 24.2, df: [[24.2, 160], [25.8, 160]], z: [[24.2, -320], [25.8, -320]], from: 24.2, until: 28, size: 28 }],
    cam: [{ t: 0, yaw: 86, tilt: 14, zoom: 0.7, y: 0.7, x: 0, d: 1000 }, { t: 1.0, yaw: 60, tilt: 20, zoom: 0.6, y: 0.66, d: 1300 }, { t: 1.2, yaw: 90, tilt: 60, zoom: 0.46, y: 0.56, d: 1400 }, { t: 2.2, yaw: 84, tilt: 48, zoom: 0.5 },
      { t: 3.6, yaw: 20, tilt: 10, zoom: 0.7, y: 0.64, d: 1300 }, { t: 6.6, yaw: 40, tilt: 14, zoom: 0.84, y: 0.66, d: 1100 }, { t: 9, yaw: 20, tilt: 10, zoom: 1.0, y: 0.64, d: 1200 }, { t: 12.4, yaw: 80, tilt: 40, zoom: 0.52, y: 0.58, d: 1400 },
      { t: 13.8, yaw: 90, tilt: 60, zoom: 0.46 }, { t: 14.4, yaw: 24, tilt: 10, zoom: 0.95, y: 0.64, d: 1100 }, { t: 15.2, yaw: 12, tilt: 5, zoom: 0.8, y: 0.68, d: 1300 }, { t: 17.2, yaw: 30, tilt: 10, zoom: 0.85, y: 0.64 },
      { t: 21, yaw: 50, tilt: 14, zoom: 0.76, y: 0.64 }, { t: 28, yaw: 55, tilt: 16, zoom: 0.76 }],
    slow: [[2.4, 3.6, 0.45], [14.8, 17.0, 0.4]], shake: [[0, 1], [3.6, 1.2], [4.4, 0.4], [13.2, 1.4], [14.8, 0.3], [17, 1.2], [18, 0.5], [28, 0.4]], flashes: [0.5, 13.2, 17.2], slashes: [3.8, 17.8],
    says: [{ t0: 4.4, t1: 5.6, pt: [4.4, 200, 520, 220], text: 'TOO SLOW,|KITTIES!' }, { t0: 6.2, t1: 7.1, pt: [6.2, 300, 330, 90], text: 'OH DEAR...|NOT AGAIN.' }, { t0: 8.4, t1: 9.7, cat: 1, text: 'WHEEE! 100 YEARS...|NEVER THIS FAST!' },
      { t0: 9.8, t1: 11.0, cat: 1, text: "YOU GAVE ME FAST.|I'LL GIVE YOU SLOW." }, { t0: 11.0, t1: 12.2, cat: 1, text: 'WHEN THEY MEET...|STAND STILL.' }, { t0: 12.3, t1: 13.1, cat: 2, text: "STAND STILL?!|WE'RE RUNNERS!" },
      { t0: 14.0, t1: 14.8, me: true, text: 'TRUST HIM.|STOP!' }, { t0: 18.4, t1: 19.7, cat: 1, text: 'SEE? NOT EVERYTHING|IS A RACE.' }, { t0: 19.9, t1: 21.0, pt: [20, 500, 500, 120], text: 'IS IT|OVER?' },
      { t0: 22.4, t1: 23.8, cat: 1, text: 'THE RAIN COMES|OVER THE RED DUNES.' }, { t0: 24.0, t1: 25.4, pt: [24.2, 160, -320, 70], text: 'SEE YOU...|EVENTUALLY!' }],
    pops: [{ t: 0.5, text: 'ZEBRAS!', size: 0.16, y: 0.72 }, { t: 1.4, text: 'BOTH SIDES!', size: 0.14, y: 0.4, boom: true }, { t: 13.2, text: 'NO WAY OUT!', size: 0.15, y: 0.36, boom: true }, { t: 17.2, text: 'NOT A SCRATCH!', size: 0.13, y: 0.38, boom: true }, cloud(21.2, 'STRIPES & SPOTS!', '#ffd23f', 0.1)],
    tags: [{ t0: 1.6, t1: 2.6, herd: 0, m: 0, label: 'ZEBRAS ×12', sub: 'FROM BOTH SIDES' }],
    lines: [[0, 0.5], [0.5, 1], [3.6, 1], [4.2, 0.3], [13, 0.3], [13.2, 1], [14.6, 1], [14.8, 0.1], [17, 0.2], [17.2, 1], [18, 0.4], [28, 0.3]], tone: [[0, 0.4], [0.5, 1], [3.4, 1], [4.2, 0.35], [13, 0.35], [13.3, 1], [14.5, 0.35], [14.8, 0.1], [17.1, 0.35], [17.2, 1], [18, 0.35]] },

  // 38 — Sand Avalanche. Hook: a dune collapses. Meet: a fennec and her kit. Twist: the ground slides. Payoff: go up.
  { file: 'panthera-38-sand-avalanche.html', ep: 38, title: 'Sand Avalanche', dur: 28, biomes: [['dunes', 0]], next: 'NEXT: RHINO FOG',
    grade: ['#ff7a2a', 0.18], glow: [0.5, '255,170,100'], rays: { x: 0.85, y: 0.12, col: '255,190,120', a: 0.08 }, music: EPIC(38, 52, 124), whipCol: '96,50,30',
    speed: [[0, 800], [28, 800]],
    wall: { sand: true, col: [246, 170, 104], fx: [[0, -1300], [3, -1000], [8, -850], [12.6, -520], [14, -420], [15.9, -640], [18, -1000], [24, -1300], [28, -1500]] },
    haze: [[0, 0.5], [12.6, 0.62], [18, 0.4], [28, 0.3]], sand: [[0, 0.8], [17.8, 0.7], [20, 0.25], [28, 0.2]],
    herds: [{ kind: 'oryx', dir: 1, fx0: 260, dust: 0.8, zig: 40, speed: [[0, 840], [3.6, 840], [5, 960], [28, 960]], hd: [[0, 0]], members: [{ dfx: 0, z: 700 }, { dfx: 150, z: 860 }, { dfx: 300, z: -700, size: 0.95 }, { dfx: -140, z: 940 }] }],
    riders: [{ kind: 'fennec', from: 8.0, until: 22.4, size: 24, dx: -20 }, { kind: 'kit', from: 8.0, until: 22.4, size: 24, dx: -110, i: 1 }],
    actors: [{ kind: 'fennec', at: 6.0, df: [[6.0, 360], [7.4, 360]], z: [[6.0, 470], [7.4, 470]], hg: [[6, 40]], from: 5.0, until: 7.4, size: 19 }, { kind: 'kit', at: 6.0, df: [[6.0, 420], [7.4, 420]], z: [[6.0, 470], [7.4, 470]], hg: [[6, 40]], from: 5.0, until: 7.4, size: 19 },
      { kind: 'kit', at: 22.4, df: [[22.4, 340], [28, 340]], z: [[22.4, 600], [28, 600]], hg: [[22.4, 90]], from: 22.4, until: 26, size: 36 }],
    cam: [{ t: 0, yaw: -40, tilt: 8, zoom: 0.52, y: 0.72, x: 0.2, d: 1400 }, { t: 1.6, yaw: -30, tilt: 12, zoom: 0.55 }, { t: 2.6, yaw: 18, tilt: 10, zoom: 0.7, y: 0.64, d: 1300 }, { t: 3.8, yaw: 70, tilt: 16, zoom: 0.8, y: 0.68, d: 1100 }, { t: 6.4, yaw: 40, tilt: 14, zoom: 0.9, y: 0.66 },
      { t: 8.6, yaw: 20, tilt: 8, zoom: 1.1, y: 0.62, d: 1100 }, { t: 10.4, yaw: -30, tilt: 14, zoom: 0.74, y: 0.64 }, { t: 12.4, yaw: -35, tilt: 22, zoom: 0.55, y: 0.62, d: 1300 }, { t: 13.8, yaw: 20, tilt: 8, zoom: 1.2, y: 0.6, d: 1100 },
      { t: 15.8, yaw: -50, tilt: 30, zoom: 0.6, y: 0.62, d: 1300 }, { t: 17.6, yaw: 25, tilt: 10, zoom: 0.5, y: 0.66, d: 1700 }, { t: 20, yaw: 40, tilt: 12, zoom: 0.8, y: 0.66, d: 1200 }, { t: 28, yaw: 50, tilt: 14, zoom: 0.82 }],
    slow: [[2.6, 3.6, 0.45], [16.2, 17.6, 0.4]], shake: [[0, 1.4], [3.6, 1.2], [10.9, 1.4], [12.6, 1.8], [13.8, 0.2], [15.9, 1.8], [17.8, 1], [28, 0.5]], flashes: [0.45, 12.6, 15.9], slashes: [4, 15.9],
    says: [{ t0: 6.0, t1: 7.1, pt: [6, 360, 470, 110], text: 'OUR DEN IS GONE!|PLEASE!' }, { t0: 7.2, t1: 8.0, me: true, text: 'JUMP!' }, { t0: 8.6, t1: 10.0, back: true, text: 'MY EARS HEAR SAND|BEFORE IT FALLS.' },
      { t0: 10.2, t1: 10.9, back: true, text: 'LEFT DUNE...|NOW!' }, { t0: 13.8, t1: 14.7, back: true, text: 'SHHH...|LISTEN.' }, { t0: 14.8, t1: 15.8, back: true, text: 'THE RIDGE IS QUIET.|GO UP!' },
      { t0: 20.4, t1: 21.9, back: true, text: 'THUNDER...|BEYOND THE MISTY HILLS!' }, { t0: 22.6, t1: 24.0, pt: [22.4, 340, 600, 140], text: 'NEW HOME!|THANK YOU, BIG KITTIES!' }, { t0: 24.2, t1: 25.4, me: true, text: 'TO THE|MISTY HILLS!' }],
    pops: [{ t: 0.9, text: 'SAND AVALANCHE!', size: 0.13, y: 0.72, boom: true }, { t: 12.6, text: 'THE GROUND IS MOVING!', size: 0.1, y: 0.36, boom: true }, { t: 17.8, text: 'MADE IT!', size: 0.16, y: 0.38, boom: true }],
    tags: [{ t0: 1.6, t1: 2.8, wall: true, label: 'DUNE · 300 M HIGH', sub: 'COLLAPSING' }],
    lines: [[0, 0.5], [0.4, 1], [3.8, 1], [4.4, 0.3], [12.4, 0.3], [12.6, 1], [13.6, 1], [13.8, 0.1], [15.7, 0.1], [15.9, 1], [17.6, 1], [18, 0.3], [28, 0.3]], tone: [[0, 0.4], [0.4, 1], [3.6, 1], [4.4, 0.35], [12.4, 0.35], [12.7, 1], [13.6, 1], [13.8, 0.1], [15.8, 0.1], [15.9, 1], [17.4, 0.35]] },

  // 39 — Rhino Fog. Hook: rhinos out of the fog. Meet: a lost oxpecker. Twist: the cliff. Payoff: stop, turn left.
  { file: 'panthera-39-rhino-fog.html', ep: 39, title: 'Rhino Fog', dur: 28, biomes: [['fog', 0]], next: 'NEXT: STORM WALL',
    grade: ['#bcd3e6', 0.1], glow: [0.5, '255,225,180'], music: EPIC(39, 53, 128), whipCol: '60,50,40', warmUp: [17.4, 20.5, '#ffc98a', 0.55],
    speed: [[0, 780], [28, 780]],
    haze: [[0, 0.9], [12, 0.85], [13.4, 0.4], [17.4, 0.25], [28, 0.1]],
    herds: [
      { kind: 'rhino', dir: -1, at: [1.5, 330], dust: 0.9, zig: 20, spread: true, speed: [[0, 700], [28, 700]], hd: [[0, 14]],
        members: [{ dfx: 0, z: -430 }, { dfx: 140, z: 520 }, { dfx: 300, z: -740 }, { dfx: 420, z: 760, size: 1.05 }, { dfx: 560, z: -300 }] },
      { kind: 'rhino', dir: 1, fx0: 1500, dust: 1.0, zig: 15, speed: [[0, 700], [9.0, 700], [9.6, 700], [28, 760]], hd: [[0, 0]],
        members: [{ dfx: 0, z: -140, size: 1.2 }, { dfx: -260, z: 260 }, { dfx: -480, z: -300 }, { dfx: -700, z: 120 }, { dfx: -900, z: -120 }] }],
    riders: [{ kind: 'oxpecker', from: 6.6, until: 16.0, cat: 1, size: 22, dx: 40 }],
    actors: [{ kind: 'oxpecker', at: 5.0, df: [[5.0, 250], [6.6, 250]], z: [[5.0, 120], [6.6, 120]], hg: [[5, 14]], from: 5.0, until: 6.6, size: 30 }],
    edge: { at: 12.4, from: 12.2 },
    cam: [{ t: 0, yaw: 88, tilt: 14, zoom: 0.74, y: 0.7, x: 0, d: 1000 }, { t: 1.4, yaw: 90, tilt: 22, zoom: 0.72 }, { t: 1.6, yaw: 88, tilt: 40, zoom: 0.52, y: 0.58, d: 1200 }, { t: 3.0, yaw: 20, tilt: 10, zoom: 0.8, y: 0.64, d: 1200 },
      { t: 5.2, yaw: 30, tilt: 12, zoom: 1.0, y: 0.64 }, { t: 7.0, yaw: 20, tilt: 10, zoom: 1.1, y: 0.62 }, { t: 8.8, yaw: 20, tilt: 10, zoom: 0.8, y: 0.64, d: 1300 }, { t: 9.4, yaw: 24, tilt: 12, zoom: 0.62, y: 0.64, d: 1500 },
      { t: 12.0, yaw: 30, tilt: 14, zoom: 0.56, y: 0.64, d: 1700 }, { t: 13.6, yaw: 30, tilt: 12, zoom: 0.7, y: 0.66, d: 1500 }, { t: 16.0, yaw: 20, tilt: 8, zoom: 0.9, y: 0.64, d: 1200 }, { t: 17.4, yaw: 40, tilt: 10, zoom: 0.5, y: 0.66, d: 1800 }, { t: 20, yaw: 25, tilt: 10, zoom: 0.8, y: 0.64, d: 1200 }, { t: 28, yaw: 40, tilt: 12, zoom: 0.78 }],
    slow: [[1.8, 3.0, 0.45], [13.8, 15.4, 0.4]], shake: [[0, 1.2], [3.0, 1.2], [4, 0.5], [9, 1], [12.4, 1.6], [16.2, 1.6], [17.4, 0.6], [28, 0.5]], flashes: [0.45, 12.4, 16.2], slashes: [9.0],
    says: [{ t0: 3.6, t1: 4.7, pt: [3.6, 400, 540, 60], text: 'TAILS UP!|RUN!' }, { t0: 5.0, t1: 6.5, pt: [5, 250, 120, 60], text: "MY RHINOS CAN'T SEE!|I'M THEIR EYES!" }, { t0: 6.6, t1: 7.7, cat: 1, text: "THEN WE'LL|TAKE YOU BACK!" },
      { t0: 7.8, t1: 8.9, cat: 1, text: "THEY'RE RUNNING|AT THE CLIFF!" }, { t0: 13.4, t1: 13.8, cat: 1, text: 'HOLD ON!' }, { t0: 15.6, t1: 16.1, cat: 1, text: 'STOP!|TURN LEFT!' },
      { t0: 19.2, t1: 20.2, herd: 1, m: 0, text: "WHO'S ON|MY BACK?!" }, { t0: 20.4, t1: 21.2, cat: 1, text: 'A FRIEND!' }, { t0: 21.4, t1: 22.4, cat: 2, text: 'NO FAIR!' }, { t0: 22.8, t1: 24.6, cat: 1, text: 'THE STORM IS COMING...|TO THE DRY RIVER!' }],
    pops: [{ t: 0.9, text: 'RHINOS!', size: 0.16, y: 0.72 }, { t: 12.4, text: 'THE CLIFF!', size: 0.16, y: 0.38, boom: true }, { t: 16.2, text: 'WHOA!', size: 0.17, y: 0.38, boom: true }, cloud(17.6, 'SAVED!', '#7dff9a', 0.12)],
    tags: [{ t0: 1.0, t1: 1.9, herd: 0, m: 0, label: 'RHINOS ×5', sub: '2 TONS · CAN\'T SEE WELL' }],
    lines: [[0, 0.5], [0.4, 1], [3.0, 1], [4, 0.3], [9, 0.8], [12.2, 0.8], [12.4, 1], [16.4, 1], [17.4, 0.3], [28, 0.3]], tone: [[0, 0.4], [0.4, 1], [2.8, 1], [3.6, 0.35], [12.2, 0.35], [12.5, 1], [13.4, 0.5], [15.5, 0.1], [16.1, 0.1], [16.2, 1], [17, 0.35]] },

  // 40 — Storm Wall (finale). Hook: the storm head-on. Meet: a baby elephant. Twist: a flash flood. Payoff: all three, together.
  { file: 'panthera-40-storm-wall.html', ep: 40, title: 'Storm Wall', dur: 28, biomes: [['drybed', 0], ['storm', 9.5], ['greenup', 20]], next: 'SEASON 8?', endText: 'SEASON FINALE',
    grade: ['#ffb060', 0.1], glow: [0.4, '255,225,180'], music: EPIC(40, 60, 118, { minor: false, prog: 'hope' }), whipCol: '60,56,48',
    speed: [[0, 780], [28, 780]],
    dark: [[0, 0.35], [2, 0.5], [9, 0.5], [12, 0.45], [19, 0.3], [21, 0], [28, 0]], rain: [[0, 0], [10, 0], [11.4, 0.9], [18, 0.7], [20, 0.2], [22, 0.05], [28, 0]],
    bolts: [{ t: 0.5, x: 0.5, big: 1, y: 0.4 }, { t: 2.0, x: 0.3 }, { t: 3.6, x: 0.7 }, { t: 5.2, x: 0.45 }, { t: 7, x: 0.62 }, { t: 9.2, x: 0.25 }, { t: 12.0, x: 0.7, big: 1 }],
    rainbow: [[0, 0], [19.6, 0], [21, 1], [28, 1]], sparkle: [[0, 0.2], [20, 0.9], [28, 0.6]],
    stormWall: { size: [[0, 0.5], [1.8, 1.1], [9, 1.25], [12, 1.4], [18, 0.8], [21, 0]] },
    flood: { from: 12.8, at: 12.8, z0: -520, z1: 520, front: [[12.8, 4200], [14.4, 3300], [16.0, 2500], [17.2, 1300], [28, -2000]] },
    herds: [
      { kind: 'buffalo', dir: 1, fx0: 400, dust: 0.5, speed: [[0, 760], [28, 760]], hd: [[0, 0]], members: [{ dfx: 0, z: 1000 }, { dfx: 200, z: 1180, size: 0.5 }, { dfx: 420, z: 1040 }] },
      { kind: 'zebra', dir: 1, fx0: 900, dust: 0.5, speed: [[0, 780], [28, 780]], hd: [[0, 0]], members: [{ dfx: 0, z: -980 }, { dfx: 180, z: -1150 }, { dfx: 360, z: -1000 }] },
      { kind: 'elephant', dir: 1, fx0: 1200, dust: 0.3, speed: [[0, 800], [28, 800]], hd: [[0, 0]], members: [{ dfx: 0, z: 1250 }, { dfx: 260, z: 1320 }, { dfx: 520, z: 1220, size: 1 }] }],
    trumpets: [14.0, 15.6],
    riders: [], friends: [],
    actors: [{ kind: 'elephantcalf', at: 6.0, df: [[6.0, 380], [7.0, 380], [9.3, 2324], [28, 17500]], z: [[6.0, 280], [7.0, 280], [9.3, -330], [28, -330]], from: 6.0, size: 24 }],
    cam: [{ t: 0, yaw: 40, tilt: 6, zoom: 0.7, y: 0.72, x: 0.04, d: 1500 }, { t: 0.4, yaw: 40, tilt: 3, zoom: 0.66, y: 0.8 }, { t: 1.8, yaw: 70, tilt: 8, zoom: 0.7, y: 0.7, d: 1200 }, { t: 3.6, yaw: 30, tilt: 10, zoom: 0.66, y: 0.66, d: 1400 }, { t: 6, yaw: 22, tilt: 10, zoom: 0.9, y: 0.64, d: 1200 },
      { t: 8.2, yaw: 18, tilt: 8, zoom: 1.25, y: 0.62, d: 1000 }, { t: 10.4, yaw: 26, tilt: 14, zoom: 1.6, y: 0.62, d: 900 }, { t: 11.4, yaw: 30, tilt: 10, zoom: 0.8, y: 0.64, d: 1200 }, { t: 12.4, yaw: 20, tilt: 8, zoom: 1.3, y: 0.62, d: 1000 },
      { t: 13.2, yaw: 80, tilt: 18, zoom: 0.62, y: 0.66, d: 1300 }, { t: 15.6, yaw: 60, tilt: 12, zoom: 0.8, y: 0.66, d: 1100 }, { t: 17.4, yaw: 30, tilt: 10, zoom: 0.8, y: 0.64 }, { t: 20, yaw: 40, tilt: 8, zoom: 0.6, y: 0.7, d: 1500 }, { t: 23, yaw: 55, tilt: 6, zoom: 0.5, y: 0.78, d: 1700 }, { t: 24.4, yaw: 24, tilt: 8, zoom: 1.3, y: 0.62, d: 1100 }, { t: 28, yaw: 40, tilt: 10, zoom: 0.8 }],
    slow: [[10.2, 11.2, 0.5], [15.6, 17.0, 0.4]], shake: [[0, 0.8], [0.4, 1.6], [3, 0.8], [12.8, 1.8], [17.2, 1.2], [20, 0.4], [28, 0.3]], flashes: [0.45, 12.8, 17.2], slashes: [],
    says: [{ t0: 1.8, t1: 3.2, me: true, text: "IT'S THE RAIN!|WE FOUND IT!" }, { t0: 4.2, t1: 5.4, herd: 0, m: 1, text: 'HI,|SPOTTY BUFFALO!' }, { t0: 6.0, t1: 7.1, pt: [6, 380, 280, 120], text: 'WHAT IS|THAT NOISE?!' }, { t0: 7.2, t1: 8.1, cat: 2, text: 'THUNDER!|IT MEANS RAIN!' },
      { t0: 8.2, t1: 9.2, pt: [6, 380, 280, 120], text: "WHAT'S...|RAIN?" }, { t0: 9.3, t1: 10.3, me: true, text: "COME ON,|WE'LL SHOW YOU!" }, { t0: 11.4, t1: 12.3, back: true, text: 'IT TICKLES!' }, { t0: 12.4, t1: 12.8, me: true, text: 'LISTEN...' },
      { t0: 14.6, t1: 15.4, me: true, text: 'PUSH!' }, { t0: 21.6, t1: 23.0, back: true, text: 'NOW I KNOW|WHAT RAIN IS!' }, { t0: 24.0, t1: 25.4, cat: 0, text: 'BEST RUN|EVER.' }],
    pops: [{ t: 0.9, text: 'STORM WALL!', size: 0.15, y: 0.72, boom: true }, { t: 12.8, text: 'FLASH FLOOD!', size: 0.15, y: 0.36, boom: true }, { t: 17.2, text: 'SPLAAASH!', size: 0.17, y: 0.38, boom: true }, cloud(18.0, "EVERYONE'S SAFE!", '#5ce1e6', 0.1)],
    tags: [],
    lines: [[0, 0.5], [0.4, 1], [3.6, 0.9], [8.2, 0.2], [10.2, 0.4], [12.4, 0.2], [12.8, 1], [17.2, 1], [18.4, 0.4], [28, 0.3]], tone: [[0, 0.4], [0.4, 1], [3.4, 0.35], [8.2, 0.1], [12.4, 0.1], [12.8, 1], [14, 1], [15, 0.4]] },
];
module.exports = { season7 };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  season7({ ...base, ...cfg }, path.join(outDir, file));
});
