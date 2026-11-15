// node saga-build.js <panther-pack-clash-lake.html> <outDir> [only]
// THE STAR RUN — PANTHERA episodes 26-30, one continuing story. Each episode: a hook in the first second, a goal,
// someone met and something traded (a word, a spark, a warning), a twist, a payoff and a pull into the next part.
const fs = require('fs'), path = require('path');
const { s5 } = require('./s5-build.js');
const { BIOME_ADD } = require('./disaster-build.js');
const { DAY_PANTHER, PACK } = require('./hunt-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');

function saga(cfg, file) {
  let s = s5(cfg, null);
  const count = a => s.split(a).length - 1;
  const R = (a, b) => { const c = count(a); if (c !== 1) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  // new animals: the hippo, and the giraffe with its patchwork coat
  R('Object.assign(BEASTS, NEW_BEASTS);', `Object.assign(NEW_BEASTS, {
  hippo: { L: 125, H: 66, W: 60, hump: 0.05, legU: 38, legD: 36, legR: [22, 18], neck: [22, 4, 52, 48], head: [96, 40, 36, 20], horns: 'none', tail: 16, stride: 300, earL: 10,
    body: '#80707a', back: '#62545e', belly: '#b89098', leg: '#6e5e68', dark: '#2e2630', horn: '#2e2630' },
  giraffe: { L: 90, H: 40, W: 30, legU: 112, legD: 112, legR: [11, 6.5], neck: [190, 64, 21, 12], head: [58, 13, 10, 22], horns: 'none', tail: 50, stride: 540, earL: 14, patch: true,
    body: '#f0d9a0', back: '#e2c88c', belly: '#f8ecc8', leg: '#e8d098', dark: '#8a5422', horn: '#5a3a18' },
});
Object.assign(BEASTS, NEW_BEASTS);`);
  R('if (sp.zebra && v.ca < 0.72 && Math.sin(v.u * 34 + v.ca * 1.7) > 0.05) c = C.dark;', 'if (sp.zebra && v.ca < 0.72 && Math.sin(v.u * 34 + v.ca * 1.7) > 0.05) c = C.dark;\n      if (sp.patch && v.ca < 0.8 && Math.sin(v.u * 9 + j * 2.1) * Math.sin(v.ca * 6 + k * 1.3) > 0.12) c = C.dark;');
  R('drawMesh(rings, (k, j, v) => sp.zebra ? (k % 2 ? sp.c.dark : sp.c.body) :', 'drawMesh(rings, (k, j, v) => sp.patch ? ((k + j) % 2 ? sp.c.dark : sp.c.body) : sp.zebra ? (k % 2 ? sp.c.dark : sp.c.body) :');
  // a canyon: the cliff can stand on both sides of the road
  R('  if (!CLIFF) return; const z = CLIFF.z, step = 240, k0 = Math.floor((SD - 7000) / step);', '  if (!CLIFF) return; for (const zz of CFG.cliff.z2 !== undefined ? [CLIFF.z, CFG.cliff.z2] : [CLIFF.z]) drawCliffZ(zz);\n}\nfunction drawCliffZ(z) {\n  const step = 240, k0 = Math.floor((SD - 7000) / step);');
  // a cinematic score: minor keys, strings, brass and taiko
  R('const MAJ = [0, 2, 4, 5, 7, 9, 11];', 'const MAJ = MUSIC.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];');
  R('dream: [0, 5, 1, 4] };', 'dream: [0, 5, 1, 4], epic: [0, 5, 2, 6], hope: [0, 2, 5, 4] };');
  R("tri.forEach(m => push(t0, 'pad', m, bar * 1.02, 1));", "tri.forEach(m => push(t0, MUSIC.pad || 'pad', m, bar * 1.02, 1));");
  R("push(tt, 'kick', 0, 0, MUSIC.soft ? 0.6 : 1);", "push(tt, MUSIC.epic ? 'taiko' : 'kick', 0, 0, MUSIC.soft ? 0.6 : 1);");
  R("if (e.inst === 'pad' || e.inst === 'bass' || e.inst === 'flute') {", "if (e.inst === 'pad' || e.inst === 'bass' || e.inst === 'flute' || e.inst === 'strings' || e.inst === 'brass') {");
  R("    case 'kick': {", `    case 'strings': tone('sawtooth', f, 0.016 * v, 0.35, e.len * 0.6, 0.7, -9); tone('sawtooth', f, 0.016 * v, 0.35, e.len * 0.6, 0.7, 9); tone('sawtooth', f * 2, 0.005 * v, 0.4, e.len * 0.5, 0.6, 4); break;
    case 'brass': tone('sawtooth', f, 0.034 * v, 0.045, Math.max(0, e.len - 0.1), 0.2, -5); tone('square', f, 0.014 * v, 0.045, Math.max(0, e.len - 0.1), 0.2, 5); break;
    case 'taiko': { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(96, at); o.frequency.exponentialRampToValueAtTime(38, at + 0.3); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.3 * v, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5); o.connect(g); g.connect(master); g.connect(wet); o.start(at); o.stop(at + 0.55); noise(at, 0.07, 'bandpass', 1800, 1, 0.035 * v, 0, 0.3); break; }
    case 'kick': {`);
  // the saga layer
  R('function drawPop(t) {', chunk('saga.txt') + '\nfunction drawPop(t) {');
  R('  drawStorm(t);', '  drawStorm(t);' + String.fromCharCode(10) + '  sagaTop(t);');
  R('  joySky(t);', '  joySky(t);\n  sagaSky(t);');
  R('  hzBefore(t);', '  hzBefore(t);\n  sagaBefore(t);');
  R('  joyAfter(t);', '  joyAfter(t);\n  sagaAfter(t);');
  R('  drawTags();', '  drawTags();\n  drawSays();\n  drawEchoes();');
  R(`    case 'boom': boomSnd(a); break;`, `    case 'boom': boomSnd(a); break;\n    case 'say': saySnd(a, e.f, e.v); break;`);
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

const BIO = { ...BIOME_ADD,
  dusk: { base: 'savanna', sky: ['#3b2f6e', '#c96a98', '#ffb27a'], haze: '255,170,150', hazeA: 0.5, keep: 0.4 },
  summit: { base: 'snow', sky: ['#04061a', '#121a44', '#33457a'], stars: 1, ground: ['#8fa2c8', '#7186b0', '#586c98', '#3d4e78'], trail: ['150,165,205', '120,136,180'], haze: '60,80,150', hazeA: 0.25,
    vig: '0,0,20', vigA: 0.5, dust: '200,215,245', orb: { x: 0.2, y: 0.16, r: 0.035, col: '#eef2ff', halo: '190,210,255', ha: 0.4, moon: 1 }, cloud: '120,140,200', cloudA: 0.15,
    crowns: ['#0f2a33', '#17383f', '#c8d6ee'], shadow: '10,16,40', snow: 0.5 },
};
const NIGHT_PANTHER = { fur: ['#2a2d38', '#14161e', '#050608'], far: '#07080c', rim: 'rgb(190,205,255)', lt: '190,205,255' };
const EPIC = (seed, root, bpm) => ({ seed, bpm, root, minor: true, prog: 'epic', lead: 'brass', arp: 'harp', pad: 'strings', epic: true, vol: 0.95 });
const base = { pack: PACK, biomeAdd: BIO, endCard: 2.2, depth: true, farView: 11500, drums: [], roars: [], panther: DAY_PANTHER };
const GOLD = '#ffd76a', PINK = '#ff7fbe', GREEN = '#7dff9a', ICE = '#9fd8ff';
const cloud = (t, text, bg, size = 0.13, y = 0.3) => ({ t, text, size, y, shape: 'cloud', bg, fg: '#ffffff' });

const EPISODES = [
  // 1 — the promise. Hook: a star falls. Meet: the old elephant, who gives them a word. Twist: the light draws a stampede.
  { file: 'panthera-26-the-falling-star.html', ep: 26, title: 'The Falling Star', dur: 28, biomes: [['dusk', 0]], next: 'NEXT: THE RIVER TOLL',
    grade: ['#b46aff', 0.12], glow: [0.3, '255,180,150'], rays: { x: 0.25, y: 0.03, col: '255,190,140', a: 0.045 }, music: EPIC(26, 57, 118),
    speed: [[0, 760], [17.4, 770], [18.2, 900], [21, 900], [22, 790], [28, 790]],
    star: { fall: 1.5, from: 6.0, col: [[0, GOLD], [28, GOLD]] },
    herds: [
      { kind: 'zebra', dir: 1, fx0: 900, dust: 0.3, zig: 40, speed: [[0, 500], [28, 500]], hd: [[0, 0]], members: [{ dfx: 0, z: 520 }, { dfx: 150, z: 720, size: 0.95 }, { dfx: -160, z: 640 }] },
      { kind: 'elephant', dir: -1, at: [10.5, 300], dust: 0.5, spread: true, speed: [[0, 200], [28, 200]], hd: [[0, 8]], members: [{ dfx: 0, z: -540, size: 1.1 }, { dfx: 260, z: -900, size: 0.9 }, { dfx: 180, z: 680 }] },
      { kind: 'wildebeest', dir: -1, at: [18.5, 400], dust: 1.0, zig: 25, spread: true, speed: [[0, 820], [28, 820]], hd: [[0, 20]],
        members: [{ dfx: 0, z: -520 }, { dfx: 100, z: 560 }, { dfx: 300, z: -780 }, { dfx: 380, z: 760 }, { dfx: 600, z: -480 }, { dfx: 700, z: 900 }, { dfx: 900, z: -960 }, { dfx: 1000, z: 540 }, { dfx: 1250, z: -640 }, { dfx: 1350, z: 800 }] }],
    trumpets: [8.2],
    cam: [{ t: 0, yaw: 82, tilt: 18, zoom: 0.8, y: 0.7, x: 0, d: 1000 }, { t: 4.6, yaw: 62, tilt: 16, zoom: 0.8 }, { t: 6.3, yaw: 20, tilt: 10, zoom: 0.85, y: 0.64, x: -0.05, d: 1250 },
      { t: 8.2, yaw: 86, tilt: 18, zoom: 0.78, y: 0.7, x: 0, d: 1000 }, { t: 10.3, yaw: 84, tilt: 18, zoom: 0.8 }, { t: 11.4, yaw: 15, tilt: 9, zoom: 0.7, y: 0.62, x: 0.1, d: 1500 },
      { t: 16.2, yaw: 88, tilt: 20, zoom: 0.76, y: 0.7, x: 0, d: 1000 }, { t: 18.4, yaw: 90, tilt: 24, zoom: 0.74 }, { t: 18.9, yaw: 90, tilt: 60, zoom: 0.47, y: 0.56, d: 1300 },
      { t: 21, yaw: -38, tilt: 10, zoom: 0.8, y: 0.6, d: 1000 }, { t: 24, yaw: 22, tilt: 10, zoom: 0.9, y: 0.64, d: 1200 }, { t: 28, yaw: 30, tilt: 11, zoom: 0.88 }],
    slow: [[19.0, 20.0, 0.4]], shake: [[0, 0.6], [17.5, 0.8], [18.5, 1.9], [20.5, 1.9], [22, 0.8], [28, 0.7]], flashes: [6.0, 18.55], slashes: [11.2, 20.9],
    says: [{ t0: 1.7, t1: 3.5, me: true, text: 'WHAT WAS THAT?!' }, { t0: 8.3, t1: 10.3, herd: 1, m: 0, text: 'CARRY IT TO|THE MOUNTAIN.' }, { t0: 11.6, t1: 13.4, me: true, text: 'WE PROMISE!', gift: true }, { t0: 22.4, t1: 24.4, me: true, text: 'IT DRAWS|EVERYONE IN...' }],
    pops: [cloud(6.1, 'A STAR!', '#ffb400', 0.15, 0.32), { t: 18.55, text: 'STAMPEDE!', size: 0.17, y: 0.4, boom: true }],
    tags: [{ t0: 2.6, t1: 4.6, herd: 0, m: 0, label: 'ZEBRAS', sub: 'JUST PASSING BY' }, { t0: 15.6, t1: 17.8, herd: 2, m: 0, label: 'WILDEBEEST', sub: 'CHASING THE LIGHT' }],
    lines: [[0, 0.3], [18, 0.3], [18.5, 1], [20.4, 1], [21.4, 0.3]], tone: [[0, 0.35], [18.3, 0.35], [18.6, 1], [20.3, 1], [21.2, 0.35]] },

  // 2 — the price. Hook: hippos head-on. Meet: the Crocodile King, who wants a toll. Trade: a spark. Payoff: the flamingos rise.
  { file: 'panthera-27-the-river-toll.html', ep: 27, title: 'The River Toll', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: CANYON OF ECHOES',
    grade: ['#ffa040', 0.12], glow: [0.4, '255,200,140'], rays: { x: 0.7, y: 0.03, col: '255,220,170', a: 0.06 }, music: EPIC(27, 59, 120),
    speed: [[0, 740], [0.6, 740], [1.1, 650], [17.2, 650], [17.9, 790], [28, 790]],
    star: { from: -1, col: [[0, GOLD], [11.5, GOLD], [12.5, PINK], [28, PINK]] }, motifs: [11.6],
    river: { at: 0.6, w: 10900, col: ['#4f9aa0', '#3c7c84'], bank: '#8a6e48' },
    herds: [{ kind: 'hippo', dir: -1, at: [2.2, 300], dust: 0, spread: true, speed: [[0, 320], [28, 320]], hd: [[0, 6]], snorts: [0.6, 2.0, 2.9],
      members: [{ dfx: 0, z: -560 }, { dfx: 200, z: 620, size: 1.08 }, { dfx: 520, z: -880, size: 0.95 }, { dfx: 700, z: 840 }] }],
    crocs: [{ at: 9.4, df: 380, z: -480, reach: 250, lunge: true, size: 1.9 }, { at: 8, df: 300, z: 760, size: 1.4 }, { at: 8, df: 900, z: -940, size: 1.3 }, { at: 8, df: 1300, z: 560, size: 1.4 },
      { at: 14.6, df: -220, z: 600, reach: 290, lunge: true, size: 1.5 }, { at: 12, df: 1500, z: -1100, size: 1.3 }],
    flamingos: { t0: 11.7, n: 80 },
    cam: [{ t: 0, yaw: 86, tilt: 18, zoom: 0.72, y: 0.7, x: 0, d: 1000 }, { t: 2.0, yaw: 90, tilt: 24, zoom: 0.72 }, { t: 2.5, yaw: 90, tilt: 58, zoom: 0.5, y: 0.56, d: 1300 }, { t: 3.8, yaw: 84, tilt: 50, zoom: 0.52 },
      { t: 5.2, yaw: 62, tilt: 18, zoom: 0.7, y: 0.68, d: 1100 }, { t: 8.8, yaw: 28, tilt: 11, zoom: 0.78, y: 0.63, d: 1300 }, { t: 11.3, yaw: 15, tilt: 12, zoom: 0.6, y: 0.66, x: 0.05, d: 1600 },
      { t: 14.2, yaw: -42, tilt: 12, zoom: 0.76, y: 0.6, x: 0, d: 1100 }, { t: 17.4, yaw: 30, tilt: 12, zoom: 0.85, y: 0.64, d: 1200 }, { t: 22, yaw: 70, tilt: 20, zoom: 0.82, y: 0.68 }, { t: 28, yaw: 60, tilt: 16, zoom: 0.85 }],
    slow: [[2.5, 3.3, 0.45]], shake: [[0, 1.2], [3.6, 1.4], [5, 0.6], [14, 0.8], [14.6, 1.6], [16, 0.7], [28, 0.7]], flashes: [2.25, 14.6], slashes: [5.0, 17.3],
    says: [{ t0: 6.2, t1: 8.6, croc: 0, text: 'PAY THE|RIVER TOLL!' }, { t0: 8.8, t1: 10.6, me: true, text: 'ALL WE HAVE|IS LIGHT...' }, { t0: 11.5, t1: 13.2, me: true, text: 'TAKE A SPARK!', gift: true }, { t0: 18.6, t1: 20.6, me: true, text: 'IT TURNED PINK!' }],
    pops: [{ t: 0.9, text: 'HIPPOS!', size: 0.16, y: 0.5 }, cloud(11.9, 'WHOOOSH!', '#ff7fbe', 0.15, 0.3), { t: 14.6, text: 'SNAP!', size: 0.16, y: 0.38, boom: true }, cloud(17.6, 'TOLL PAID!', '#5ce1e6')],
    tags: [{ t0: 1.0, t1: 2.1, herd: 0, m: 0, label: 'HIPPOS', sub: '1.5 TONS · HEAD-ON' }, { t0: 4.4, t1: 6.0, croc: 0, label: 'THE CROCODILE KING', sub: 'GUARDS THE FORD' }],
    lines: [[0, 0.5], [2.2, 1], [3.6, 1], [4.6, 0.25], [28, 0.25]], tone: [[0, 0.4], [2.2, 1], [3.5, 1], [4.4, 0.35], [14.4, 0.35], [14.7, 1], [15.6, 0.35]] },

  // 3 — the lesson. Hook: a stampede fills the canyon. Meet: the goats, who trade a word that echoes. Twist: no way back.
  { file: 'panthera-28-canyon-of-echoes.html', ep: 28, title: 'Canyon of Echoes', dur: 28, biomes: [['canyon', 0]], next: 'NEXT: THE STORM GIRAFFES',
    grade: ['#ff8a4a', 0.14], glow: [0.5, '255,210,160'], rays: { x: 0.5, y: 0.0, col: '255,220,180', a: 0.07 }, music: EPIC(28, 55, 124), echoHoof: true, whipCol: '60,36,22',
    speed: [[0, 790], [6.5, 790], [7.1, 900], [10.5, 900], [11.5, 800], [28, 800]],
    star: { from: -1, col: [[0, PINK], [11.9, PINK], [12.9, GREEN], [28, GREEN]] }, motifs: [12.0],
    cliff: { z: -760, h: 1300, z2: 760, until: 22.5 }, rockV: 900,
    rocks: [[17.8, -420, 150], [18.4, -620, 130], [19.0, -380, 160], [19.7, -720, 140]],
    herds: [
      { kind: 'goat', dir: 1, fx0: 250, dust: 0.4, zig: 30, speed: [[0, 790], [6.5, 790], [7.1, 900], [10.5, 900], [11.5, 800], [28, 800]], hd: [[0, 0]], leaps: [[7.05, 0.9, 150], [13.6, 0.7, 80]],
        members: [{ dfx: 0, z: 400 }, { dfx: 130, z: -430, size: 0.95 }, { dfx: 260, z: 520, size: 1.05 }] },
      { kind: 'wildebeest', dir: -1, at: [7.2, 380], dust: 1.0, zig: 15, spread: true, speed: [[0, 800], [28, 800]], hd: [[0, 20]],
        members: [{ dfx: 0, z: -560 }, { dfx: 120, z: 590 }, { dfx: 320, z: -660 }, { dfx: 420, z: 640 }, { dfx: 640, z: -520 }, { dfx: 760, z: 680 }, { dfx: 980, z: -620 }, { dfx: 1100, z: 560 },
          { dfx: 1340, z: -680 }, { dfx: 1460, z: 620 }, { dfx: 1700, z: -540 }, { dfx: 1820, z: 660 }] }],
    cam: [{ t: 0, yaw: 88, tilt: 18, zoom: 0.74, y: 0.7, x: 0, d: 1000 }, { t: 6.6, yaw: 90, tilt: 24, zoom: 0.72 }, { t: 7.2, yaw: 90, tilt: 62, zoom: 0.46, y: 0.56, d: 1300 }, { t: 9.4, yaw: 82, tilt: 54, zoom: 0.48 },
      { t: 10.6, yaw: -42, tilt: 12, zoom: 0.78, y: 0.6, d: 1000 }, { t: 15.6, yaw: 86, tilt: 20, zoom: 0.8, y: 0.7 }, { t: 17.4, yaw: -40, tilt: 14, zoom: 0.68, y: 0.6 },
      { t: 21, yaw: 80, tilt: 30, zoom: 0.7, y: 0.68 }, { t: 28, yaw: 70, tilt: 22, zoom: 0.75 }],
    slow: [[7.4, 8.4, 0.4]], shake: [[0, 1], [6.6, 1.3], [7.1, 2], [9.5, 2], [11, 0.9], [17.6, 1.6], [20, 1.4], [22, 0.7], [28, 0.7]], flashes: [7.1], slashes: [10.45, 20.8],
    haze: [[0, 0.2], [17.5, 0.2], [19.5, 0.6], [22.5, 0.15]], rumble: [[0, 0.1], [5, 0.16], [7, 0.2], [10, 0.05], [17.4, 0.05], [18, 0.2], [20.5, 0.2], [22, 0.02]],
    says: [{ t0: 1.6, t1: 3.6, herd: 0, m: 0, text: 'STAMPEDE AHEAD!|JUMP ON MY WORD!' }, { t0: 3.8, t1: 5.2, me: true, text: 'WHAT WORD?!' }, { t0: 5.4, t1: 6.8, herd: 0, m: 0, text: 'WAIT FOR IT...' },
      { t0: 11.6, t1: 13.4, me: true, text: 'A SPARK FOR|YOUR WORD!', gift: true }, { t0: 13.6, t1: 15.6, herd: 0, m: 0, text: 'KEEP THE ECHO.|IT IS YOURS!' }, { t0: 23, t1: 25, me: true, text: 'ONLY FORWARD|NOW.' }],
    echoes: [{ t: 7.05, text: 'NOW!', y: 0.36, size: 0.17 }],
    pops: [{ t: 18.3, text: 'NO WAY BACK!', size: 0.13, y: 0.32, boom: true }],
    tags: [{ t0: 0.9, t1: 2.4, herd: 1, m: 0, label: 'WILDEBEEST ×12', sub: 'NOWHERE TO DODGE' }],
    lines: [[0, 0.4], [6.8, 0.4], [7.1, 1], [9.4, 1], [10.4, 0.3], [28, 0.3]], tone: [[0, 0.4], [6.9, 0.4], [7.2, 1], [9.2, 1], [10.2, 0.4]] },

  // 4 — the kindness. Hook: lightning shows giraffes charging. Meet: a lost calf. Trade: their light for its trust. Payoff: mama.
  { file: 'panthera-29-the-storm-giraffes.html', ep: 29, title: 'The Storm Giraffes', dur: 28, biomes: [['stormnight', 0]], next: 'NEXT: THE MOUNTAIN OF STARS',
    panther: NIGHT_PANTHER, grade: ['#5a6aff', 0.14], glow: [0.2, '170,190,255'], music: EPIC(29, 52, 126), whipCol: '8,12,20',
    speed: [[0, 800], [4.6, 800], [5.2, 900], [8, 900], [9, 800], [28, 800]],
    star: { from: -1, col: [[0, GREEN], [11.7, GREEN], [12.7, ICE], [28, ICE]] }, motifs: [11.9, 20.4],
    bolts: [{ t: 0.3, x: 0.7, big: 1, y: 0.5 }, { t: 3.1, x: 0.2 }, { t: 5.2, x: 0.55, big: 1, y: 0.6 }, { t: 9, x: 0.85 }, { t: 13.5, x: 0.3 }, { t: 17.8, x: 0.6, big: 1 }, { t: 22, x: 0.15 }, { t: 25, x: 0.8 }],
    dark: [[0, 0.24], [28, 0.24]], rain: [[0, 0.8], [28, 0.7]],
    herds: [
      { kind: 'giraffe', dir: -1, at: [5.2, 380], dust: 0.5, zig: 15, spread: true, speed: [[0, 700], [28, 700]], hd: [[0, 0]],
        members: [{ dfx: 0, z: -470, size: 1.3 }, { dfx: 160, z: 500, size: 1.35 }, { dfx: 420, z: -640, size: 1.25 }, { dfx: 560, z: 660, size: 1.2 }, { dfx: 840, z: -500, size: 1.35 }, { dfx: 980, z: 900, size: 1.25 }, { dfx: 1300, z: -860, size: 1.3 }, { dfx: 1500, z: 540, size: 1.25 }] },
      { kind: 'giraffe', dir: 1, at: [9.2, 230], dust: 0.2, speed: [[0, 0], [8.3, 0], [9.1, 800], [28, 800]], hd: [[0, 6]], members: [{ dfx: 0, z: 440, size: 0.5 }] },
      { kind: 'giraffe', dir: 1, at: [19.6, 160], dust: 0.4, zig: 20, speed: [[0, 600], [19.4, 600], [20.4, 800], [28, 800]], hd: [[0, 0]], members: [{ dfx: 0, z: -620, size: 1.25 }, { dfx: 260, z: -900, size: 1.15 }, { dfx: -240, z: -780, size: 1.1 }] }],
    cam: [{ t: 0, yaw: 88, tilt: 18, zoom: 0.74, y: 0.7, x: 0, d: 1000 }, { t: 4.8, yaw: 90, tilt: 20, zoom: 0.72 }, { t: 5.3, yaw: 90, tilt: 8, zoom: 0.6, y: 0.8 }, { t: 6.6, yaw: 86, tilt: 9, zoom: 0.62, y: 0.78 },
      { t: 7.4, yaw: 80, tilt: 16, zoom: 0.76, y: 0.7 }, { t: 9.6, yaw: 25, tilt: 10, zoom: 0.8, y: 0.64, d: 1300 }, { t: 14, yaw: -35, tilt: 12, zoom: 0.75, y: 0.6, d: 1100 },
      { t: 17.4, yaw: 84, tilt: 18, zoom: 0.7, y: 0.7, d: 1000 }, { t: 20.2, yaw: 18, tilt: 9, zoom: 0.52, y: 0.74, x: 0, d: 1600 }, { t: 24.5, yaw: 60, tilt: 18, zoom: 0.78, y: 0.68, x: 0 }, { t: 28, yaw: 70, tilt: 20, zoom: 0.78 }],
    slow: [[5.5, 6.5, 0.4]], shake: [[0, 1], [5, 1.3], [5.2, 2], [7.2, 2], [8.5, 0.8], [28, 0.7]], flashes: [5.25], slashes: [9.4, 19.9],
    says: [{ t0: 6.9, t1: 8.7, herd: 1, m: 0, text: 'I LOST|MY HERD!' }, { t0: 9.4, t1: 11.0, me: true, text: 'RUN WITH US!' }, { t0: 11.8, t1: 13.6, me: true, text: 'OUR LIGHT WILL|FIND THEM!', gift: true },
      { t0: 18.0, t1: 19.6, herd: 1, m: 0, text: 'MAMA!!!' }, { t0: 20.6, t1: 23.0, herd: 2, m: 0, text: 'THANK YOU.|THE MOUNTAIN IS NEAR.' }],
    pops: [{ t: 1.0, text: 'GIRAFFES?!', size: 0.15, y: 0.5 }, { t: 5.25, text: 'UNDER THE LEGS!', size: 0.11, y: 0.36, boom: true }, cloud(23.6, 'ALMOST THERE!', '#9fd8ff', 0.12)],
    tags: [{ t0: 1.6, t1: 3.4, herd: 0, m: 0, label: 'GIRAFFES ×8', sub: '5 METRES TALL · HEAD-ON' }, { t0: 14.4, t1: 16.6, herd: 1, m: 0, label: 'LOST CALF', sub: 'FOLLOWING THE LIGHT' }],
    lines: [[0, 0.4], [5, 0.4], [5.2, 1], [7.2, 1], [8.2, 0.3], [28, 0.3]], tone: [[0, 0.4], [5.1, 0.4], [5.3, 1], [7, 1], [8, 0.4]] },

  // 5 — the promise kept. Hook: the star pulls for home. Everyone they met runs beside them. Payoff: the sky answers.
  { file: 'panthera-30-the-mountain-of-stars.html', ep: 30, title: 'The Mountain of Stars', dur: 28, biomes: [['summit', 0]], next: 'SEASON 6 · COMING SOON', endText: 'THE END',
    panther: NIGHT_PANTHER, grade: ['#6f8aff', 0.12], glow: [0.2, '190,210,255'], music: { seed: 30, bpm: 108, root: 60, prog: 'hope', lead: 'bell', arp: 'harp', pad: 'strings', soft: true }, whipCol: '40,52,90',
    speed: [[0, 780], [28, 780]],
    star: { from: -1, release: 17.5, col: [[0, ICE], [17, '#ffffff'], [28, '#ffffff']] }, motifs: [17.5, 19.3],
    friends: [{ coat: 'snowLeopard', marks: 'rosettes', size: 0.94, at: [0, 300], z: 60, speed: [[0, 780], [28, 780]] }],
    herds: [
      { kind: 'goat', dir: 1, at: [5.2, 160], dust: 0.4, zig: 30, speed: [[0, 900], [4.4, 900], [5.4, 780], [28, 780]], hd: [[0, 0]], leaps: [[9.5, 0.7, 80], [20.5, 0.8, 110]], members: [{ dfx: 0, z: 470 }, { dfx: 130, z: 600, size: 0.95 }, { dfx: -120, z: 540 }] },
      { kind: 'elephant', dir: 1, at: [7.2, -260], dust: 0.6, speed: [[0, 880], [6.4, 880], [7.4, 780], [28, 780]], hd: [[0, 4]], members: [{ dfx: 0, z: -720, size: 1.1 }, { dfx: -330, z: -1000, size: 0.9 }] },
      { kind: 'giraffe', dir: 1, at: [9.2, -120], dust: 0.4, speed: [[0, 870], [8.4, 870], [9.4, 780], [28, 780]], hd: [[0, 0]], members: [{ dfx: 0, z: 900, size: 1.05 }, { dfx: -260, z: 1150, size: 0.5 }] },
      { kind: 'zebra', dir: 1, at: [10.6, 420], dust: 0.4, zig: 30, speed: [[0, 890], [9.8, 890], [10.8, 780], [28, 780]], hd: [[0, 0]], members: [{ dfx: 0, z: -1250 }, { dfx: 160, z: -1450 }, { dfx: -170, z: -1350, size: 0.95 }] }],
    trumpets: [8.4, 18.4],
    aurora: [[0, 0.3], [17.4, 0.35], [19, 1], [28, 1]], constel: { t0: 19.3, label: 'THE PANTHERS PACK' }, hearts: [21.5, 24.2], sparkle: [[0, 0.3], [17.5, 0.4], [18.5, 1.2], [28, 1]],
    cam: [{ t: 0, yaw: 30, tilt: 10, zoom: 0.82, y: 0.64, x: -0.05, d: 1250 }, { t: 4.2, yaw: 70, tilt: 22, zoom: 0.6, y: 0.68, x: 0, d: 1250 }, { t: 8.4, yaw: 15, tilt: 9, zoom: 0.58, y: 0.66, x: 0.05, d: 1600 },
      { t: 12.5, yaw: -38, tilt: 10, zoom: 0.76, y: 0.6, x: 0, d: 1100 }, { t: 15.3, yaw: 22, tilt: 8, zoom: 1.0, y: 0.66, x: -0.05, d: 1200 }, { t: 17.3, yaw: 24, tilt: 8, zoom: 0.95 },
      { t: 18.6, yaw: 60, tilt: 6, zoom: 0.6, y: 0.82, x: 0 }, { t: 28, yaw: 72, tilt: 6, zoom: 0.56, y: 0.84 }],
    slow: [], shake: [[0, 0.5], [17.4, 0.5], [17.6, 1.6], [18.6, 0.3], [28, 0.2]], flashes: [17.55], slashes: [], dark: [[0, 0.52], [28, 0.56]], haze: [[0, 0]],
    says: [{ t0: 1.6, t1: 3.6, friend: 0, text: 'THIS WAY!|THE PEAK IS CLOSE!' }, { t0: 5.0, t1: 6.8, me: true, text: 'LOOK!|EVERYONE CAME!' }, { t0: 8.8, t1: 10.8, herd: 1, m: 0, text: 'WE KEPT|OUR WORD TOO.' },
      { t0: 15.4, t1: 17.3, me: true, text: 'GO HOME,|LITTLE STAR.', gift: true }],
    pops: [cloud(0.8, "IT'S CALLING!", '#9fd8ff', 0.13, 0.5), cloud(18.4, "IT'S HOME!", '#b388ff', 0.16, 0.5)],
    tags: [], lines: [[0, 0]], tone: [[0, 0.25]], toneCol: '#9fd8ff', accent: ['#ffe27a', '#b388ff', '#7ae8ff'] },
];
module.exports = { saga };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  saga({ ...base, ...cfg }, path.join(outDir, file));
});
