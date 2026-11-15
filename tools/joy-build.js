// node joy-build.js <panther-pack-clash-lake.html> <outDir> [only]
// PANTHERA episodes 16-20: happy runs with friends, set to an original cheerful score.
const fs = require('fs'), path = require('path');
const { disaster, BIOME_ADD } = require('./disaster-build.js');
const { DAY_PANTHER, PACK } = require('./hunt-build.js');
const { SNOW_PANTHER } = require('./blitz-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');

function joy(cfg, file) {
  let s = disaster(cfg, null);
  const count = a => s.split(a).length - 1;
  const R = (a, b, n = 1) => { const c = count(a); if (c !== n) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  R("for (const p of CFG.pops || []) EVENTS.push({ t: p.t, k: p.boom ? 'boom' : 'hit' });", "if (!CFG.music) for (const p of CFG.pops || []) EVENTS.push({ t: p.t, k: p.boom ? 'boom' : 'hit' });");
  R("  EVENTS.push({ t: ENDAT, k: 'boom' });", "  if (!CFG.music) EVENTS.push({ t: ENDAT, k: 'boom' });");
  R('    if (p.burst !== false) starburst(', "    if (p.shape === 'cloud') cloudBubble(x, y, Math.max(sz * 1.2, tw * 0.68), sz * 1.0, p.bg || '#ffffff');\n    else if (p.burst !== false) starburst(");
  R("comicText('TO BE CONTINUED',", "comicText(CFG.endText || 'TO BE CONTINUED',");
  R('  halftone(1.5 * k, INK);', '  halftone(1.5 * k, CFG.music ? ACC[1] : INK);');
  R('function drawHUD() {', 'function drawHUD() {\n  if (CFG.joyHud) return drawJoyHud();');
  R('  drawTitle();\n  drawEnd();\n}', '  drawTitle();\n  drawEnd();\n  drawConfetti();\n}');
  R('function drawPop(t) {', chunk('joy.txt') + '\nfunction drawPop(t) {');
  R('  hzBefore(t);', '  joySky(t);\n  hzBefore(t);');
  R('  hzAfter(t);', '  hzAfter(t);\n  joyAfter(t);');
  R(`    case 'boom': boomSnd(a); break;`, `    case 'boom': boomSnd(a); break;\n    case 'note': noteSnd(a, e); break;`);
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

const PASTEL_ACC = ['#ffd23f', '#ff6fae', '#5ce1e6'];
const HAPPY = { pack: PACK, biomeAdd: { ...BIOME_ADD,
  dawn: { base: 'savanna', sky: ['#7aa6e0', '#ffc0a8', '#ffe8c0'], haze: '255,220,200', hazeA: 0.5, keep: 0.45 },
  meadow: { base: 'blossom', keep: 0.4 },
}, endCard: 2.4, joyHud: true, accent: PASTEL_ACC, toneCol: '#ff9fc8', drums: [], roars: [], slow: [], flashes: [] };
const FIREFLY_PANTHER = { fur: ['#2c2f3a', '#16181f', '#060709'], far: '#08090c', rim: 'rgb(255,230,160)', lt: '255,232,170' };

const EPISODES = [
  { file: 'panthera-16-sunrise-friends.html', ep: 16, title: 'Sunrise Friends', dur: 28, biomes: [['dawn', 0]], next: 'NEXT: SPLASH DAY', endText: 'SEE YOU TOMORROW!',
    panther: DAY_PANTHER, grade: ['#ffb07a', 0.18], glow: [0.3, '255,210,170'],
    music: { seed: 16, bpm: 116, root: 60, prog: 'pop', lead: 'bell', arp: 'pluck' },
    speed: [[0, 620], [28, 640]],
    herds: [
      { kind: 'zebra', dir: 1, fx0: 120, dust: 0.3, zig: 60, speed: [[0, 625], [28, 645]], hd: [[0, 0]], members: [{ dfx: 0, z: 560 }, { dfx: 160, z: 760, size: 0.95 }, { dfx: -150, z: 680 }, { dfx: 300, z: 900 }] },
      { kind: 'gazelle', dir: 1, fx0: 260, dust: 0.3, zig: 80, speed: [[0, 630], [28, 650]], hd: [[0, 0]],
        leaps: [[3.0, 0.7, 70], [6.4, 0.7, 80], [10.0, 0.75, 90], [13.6, 0.7, 75], [17.2, 0.7, 85], [20.8, 0.75, 95], [24.0, 0.7, 80]],
        members: [{ dfx: 0, z: -560 }, { dfx: 130, z: -720, size: 0.95 }, { dfx: 260, z: -600 }, { dfx: -130, z: -820, size: 1.05 }] }],
    butterflies: 12, birds: 8, sparkle: [[0, 0.4], [28, 0.6]], hearts: [8.2, 15.6, 22.4], joy: [[0, 2], [8, 3], [15, 4], [22, 5]],
    cam: [{ t: 0, yaw: 40, tilt: 12, zoom: 0.85, y: 0.64, x: 0, d: 1200 }, { t: 4, yaw: 15, tilt: 9, zoom: 0.75, y: 0.62, x: -0.05, d: 1400 },
      { t: 8, yaw: -35, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1100 }, { t: 12, yaw: 70, tilt: 20, zoom: 0.8, y: 0.68 }, { t: 15, yaw: 88, tilt: 52, zoom: 0.55, y: 0.58, d: 1300 },
      { t: 18.5, yaw: 25, tilt: 10, zoom: 0.92, y: 0.64, x: -0.05, d: 1200 }, { t: 22, yaw: -30, tilt: 11, zoom: 0.85, y: 0.6, x: 0 }, { t: 28, yaw: 20, tilt: 10, zoom: 0.8, y: 0.62 }],
    shake: [[0, 0.25]], lines: [[0, 0]], tone: [[0, 0.22]], slashes: [7.8, 18.2],
    pops: [{ t: 3.0, text: 'GOOD MORNING!', size: 0.1, y: 0.5, shape: 'cloud', bg: '#ffd23f', fg: '#ffffff' }, { t: 8.2, text: 'FRIENDS!', size: 0.13, y: 0.3, shape: 'cloud', bg: '#ff6fae', fg: '#ffffff' },
      { t: 15.6, text: 'WHEEE!', size: 0.14, y: 0.32, shape: 'cloud', bg: '#5ce1e6', fg: '#ffffff' }, { t: 22.4, text: 'YAY!', size: 0.15, y: 0.3, shape: 'cloud', bg: '#7ee081', fg: '#ffffff' }],
    tags: [{ t0: 4.4, t1: 7.0, herd: 0, m: 0, label: 'ZEBRAS', sub: 'BEST RUNNING BUDDIES' }, { t0: 10.4, t1: 13.0, herd: 1, m: 0, label: 'GAZELLES', sub: 'PRONKING = JUMPING FOR JOY' }] },

  { file: 'panthera-17-splash-day.html', ep: 17, title: 'Splash Day', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: BLOSSOM VALLEY', endText: 'WHAT A DAY!',
    panther: DAY_PANTHER, grade: ['#7fd4ff', 0.14], glow: [0.4, '255,240,210'],
    music: { seed: 17, bpm: 122, root: 67, prog: 'sunny', lead: 'flute', arp: 'harp' },
    speed: [[0, 640], [5.5, 640], [6.2, 560], [12.3, 560], [13, 650], [28, 650]],
    river: { at: 6.0, w: 3500, col: ['#5fc0d8', '#46a8c4'], bank: '#cfa86a' },
    herds: [{ kind: 'impala', dir: 1, fx0: 200, dust: 0.3, zig: 70, speed: [[0, 645], [5.5, 645], [6.2, 565], [12.3, 565], [13, 655], [28, 655]], hd: [[0, 0]],
      leaps: [[6.0, 0.8, 110], [8.4, 0.8, 120], [10.6, 0.8, 110], [14.5, 0.75, 90], [19.5, 0.75, 95]],
      members: [{ dfx: 0, z: 540 }, { dfx: 140, z: 720 }, { dfx: 280, z: 580, size: 0.95 }, { dfx: -140, z: -620 }, { dfx: 60, z: -800, size: 1.05 }] }],
    butterflies: 8, birds: 6, rainbow: [[0, 0], [11.5, 0], [13.5, 1], [28, 1]], sparkle: [[0, 0.3], [6, 0.9], [12.5, 0.9], [14, 0.5], [28, 0.5]],
    hearts: [9.0, 16.0, 22.6], joy: [[0, 2], [7, 3], [13.6, 4], [20, 5]],
    cam: [{ t: 0, yaw: 60, tilt: 18, zoom: 0.8, y: 0.66, x: 0, d: 1150 }, { t: 4.5, yaw: 30, tilt: 14, zoom: 0.75, y: 0.64 }, { t: 7, yaw: -38, tilt: 12, zoom: 0.8, y: 0.6, d: 1100 },
      { t: 10, yaw: 15, tilt: 10, zoom: 0.85, y: 0.62, x: -0.04, d: 1250 }, { t: 13, yaw: 60, tilt: 22, zoom: 0.62, y: 0.7, d: 1300 }, { t: 17, yaw: -30, tilt: 10, zoom: 0.82, y: 0.6, x: 0, d: 1100 },
      { t: 21, yaw: 25, tilt: 10, zoom: 0.9, y: 0.64, d: 1200 }, { t: 28, yaw: 45, tilt: 14, zoom: 0.8 }],
    shake: [[0, 0.25]], lines: [[0, 0]], tone: [[0, 0.22]], slashes: [6.8, 16.8],
    pops: [{ t: 6.2, text: 'SPLASH!', size: 0.15, y: 0.32, shape: 'cloud', bg: '#5ce1e6', fg: '#ffffff' }, { t: 9.0, text: 'SO FRESH!', size: 0.12, y: 0.3, shape: 'cloud', bg: '#ff6fae', fg: '#ffffff' },
      { t: 13.8, text: 'RAINBOW!', size: 0.13, y: 0.55, shape: 'cloud', bg: '#b388ff', fg: '#ffffff' }, { t: 22.6, text: 'AGAIN! AGAIN!', size: 0.1, y: 0.3, shape: 'cloud', bg: '#ffd23f', fg: '#ffffff' }],
    tags: [{ t0: 2.0, t1: 4.6, herd: 0, m: 0, label: 'IMPALA', sub: 'CAN LEAP 10 METRES IN ONE JUMP' }] },

  { file: 'panthera-18-blossom-valley.html', ep: 18, title: 'Blossom Valley', dur: 28, biomes: [['meadow', 0]], next: 'NEXT: SNOW DAY', endText: 'SPRING IS HERE!',
    panther: DAY_PANTHER, grade: ['#ff9fc8', 0.14], glow: [0.35, '255,220,235'],
    music: { seed: 18, bpm: 108, root: 65, prog: 'doo', lead: 'whistle', arp: 'harp', arpPat: [0, 2, 1, 2, 0, 2, 1, 2] },
    speed: [[0, 600], [28, 620]],
    herds: [{ kind: 'deer', dir: 1, fx0: 180, dust: 0.2, zig: 70, speed: [[0, 605], [28, 625]], hd: [[0, 0]], leaps: [[4.2, 0.8, 80], [11.5, 0.85, 90], [18.8, 0.8, 85], [24.6, 0.8, 80]],
      members: [{ dfx: 0, z: 560, size: 1.05 }, { dfx: 150, z: 740 }, { dfx: -150, z: 680, size: 0.9 }, { dfx: 80, z: -640, size: 0.85 }] }],
    butterflies: 18, birds: 5, sparkle: [[0, 0.4], [28, 0.6]], hearts: [7.6, 14.8, 21.8], joy: [[0, 2], [7.5, 3], [14.5, 4], [21.5, 5]],
    cam: [{ t: 0, yaw: 25, tilt: 10, zoom: 0.85, y: 0.63, x: -0.05, d: 1300 }, { t: 5, yaw: -35, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1100 },
      { t: 9.5, yaw: 72, tilt: 24, zoom: 0.78, y: 0.68 }, { t: 13, yaw: 88, tilt: 55, zoom: 0.55, y: 0.58, d: 1300 }, { t: 16.5, yaw: 15, tilt: 9, zoom: 0.8, y: 0.62, x: -0.04, d: 1300 },
      { t: 21, yaw: -40, tilt: 12, zoom: 0.82, y: 0.6, x: 0, d: 1100 }, { t: 28, yaw: 30, tilt: 12, zoom: 0.85, y: 0.63 }],
    shake: [[0, 0.2]], lines: [[0, 0]], tone: [[0, 0.22]], slashes: [9.3, 16.3],
    pops: [{ t: 3.0, text: 'SPRING!', size: 0.14, y: 0.5, shape: 'cloud', bg: '#ff6fae', fg: '#ffffff' }, { t: 7.6, text: 'PETALS!', size: 0.13, y: 0.3, shape: 'cloud', bg: '#b388ff', fg: '#ffffff' },
      { t: 14.8, text: 'SO PRETTY!', size: 0.12, y: 0.32, shape: 'cloud', bg: '#ffd23f', fg: '#ffffff' }, { t: 21.8, text: 'HAPPY!', size: 0.14, y: 0.3, shape: 'cloud', bg: '#7ee081', fg: '#ffffff' }],
    tags: [{ t0: 9.8, t1: 12.4, herd: 0, m: 0, label: 'RED DEER', sub: 'SPRING BUDDIES' }] },

  { file: 'panthera-19-snow-day.html', ep: 19, title: 'Snow Day', dur: 28, biomes: [['snow', 0]], next: 'NEXT: FIREFLY NIGHT', endText: 'SNOW DAY FOREVER!',
    panther: SNOW_PANTHER, grade: ['#9fd0ff', 0.12], glow: [0.6, '230,240,255'],
    music: { seed: 19, bpm: 126, root: 62, prog: 'pop', lead: 'bell', arp: 'pluck', bells: true },
    speed: [[0, 640], [28, 660]],
    herds: [{ kind: 'deer', dir: 1, fx0: 220, dust: 0.9, zig: 80, speed: [[0, 645], [28, 665]], hd: [[0, -2]], leaps: [[2.6, 0.8, 90], [7.8, 0.85, 100], [13.0, 0.8, 95], [18.2, 0.85, 105], [23.4, 0.8, 90]],
      members: [{ dfx: 0, z: 560, size: 1.08 }, { dfx: 160, z: 760 }, { dfx: 300, z: 600, size: 0.95 }, { dfx: -140, z: -640 }, { dfx: 120, z: -820, size: 0.9 }] }],
    butterflies: 0, birds: 4, birdCol: 'rgba(60,70,100,0.7)', sparkle: [[0, 0.9], [28, 1]], hearts: [9.4, 16.4, 23.0], joy: [[0, 2], [9, 3], [16, 4], [22.5, 5]],
    cam: [{ t: 0, yaw: -35, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1100 }, { t: 4.5, yaw: 20, tilt: 10, zoom: 0.75, y: 0.62, x: -0.04, d: 1400 },
      { t: 9, yaw: 70, tilt: 22, zoom: 0.78, y: 0.68 }, { t: 12.5, yaw: 88, tilt: 55, zoom: 0.55, y: 0.58, d: 1300 }, { t: 16, yaw: -40, tilt: 12, zoom: 0.8, y: 0.6, d: 1100 },
      { t: 21, yaw: 15, tilt: 9, zoom: 0.85, y: 0.62, x: -0.04, d: 1300 }, { t: 28, yaw: 40, tilt: 12, zoom: 0.82 }],
    shake: [[0, 0.25]], lines: [[0, 0]], tone: [[0, 0.22]], slashes: [8.8, 15.8],
    pops: [{ t: 2.8, text: 'SNOW DAY!', size: 0.13, y: 0.5, shape: 'cloud', bg: '#5ce1e6', fg: '#ffffff' }, { t: 9.4, text: 'BRRR!', size: 0.14, y: 0.3, shape: 'cloud', bg: '#b388ff', fg: '#ffffff' },
      { t: 16.4, text: 'WHEEE!', size: 0.14, y: 0.32, shape: 'cloud', bg: '#ff6fae', fg: '#ffffff' }, { t: 23.0, text: 'SO MUCH FUN!', size: 0.1, y: 0.3, shape: 'cloud', bg: '#ffd23f', fg: '#ffffff' }],
    tags: [{ t0: 4.8, t1: 7.4, herd: 0, m: 0, label: 'RED DEER', sub: 'SNOW DAY BUDDIES' }] },

  { file: 'panthera-20-firefly-night.html', ep: 20, title: 'Firefly Night', dur: 28, biomes: [['night', 0]], next: 'SEASON 4 · COMING SOON', endText: 'SWEET DREAMS!',
    panther: FIREFLY_PANTHER, grade: ['#8a7aff', 0.12], glow: [0.2, '255,230,170'], accent: ['#ffe27a', '#ff8fc8', '#7ae8ff'],
    music: { seed: 20, bpm: 96, root: 69, prog: 'dream', lead: 'flute', arp: 'harp', soft: true, vol: 0.95 },
    speed: [[0, 560], [28, 580]],
    herds: [{ kind: 'gazelle', dir: 1, fx0: 200, dust: 0.1, zig: 60, speed: [[0, 565], [28, 585]], hd: [[0, 0]], leaps: [[5.0, 0.8, 70], [12.5, 0.8, 80], [20.0, 0.8, 75]],
      members: [{ dfx: 0, z: 560 }, { dfx: 150, z: 720, size: 0.95 }, { dfx: -150, z: -640 }, { dfx: 80, z: -800 }] }],
    butterflies: 0, birds: 0, fireflies: 90, sparkle: [[0, 0.8], [28, 1]], hearts: [8.8, 16.2, 22.6], joy: [[0, 2], [8.5, 3], [16, 4], [22, 5]],
    cam: [{ t: 0, yaw: 30, tilt: 12, zoom: 0.82, y: 0.63, x: -0.04, d: 1300 }, { t: 5, yaw: -35, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1100 },
      { t: 10, yaw: 75, tilt: 26, zoom: 0.72, y: 0.68 }, { t: 14, yaw: 15, tilt: 8, zoom: 0.78, y: 0.62, x: -0.04, d: 1350 }, { t: 19, yaw: 88, tilt: 50, zoom: 0.55, y: 0.58, d: 1300 },
      { t: 23, yaw: -30, tilt: 10, zoom: 0.8, y: 0.6, x: 0, d: 1100 }, { t: 28, yaw: 25, tilt: 10, zoom: 0.82 }],
    shake: [[0, 0.15]], lines: [[0, 0]], tone: [[0, 0.18]], toneCol: '#ffe27a', slashes: [9.8, 18.8],
    pops: [{ t: 3.0, text: 'MAGIC!', size: 0.14, y: 0.5, shape: 'cloud', bg: '#ffe27a', fg: '#ffffff' }, { t: 8.8, text: 'FIREFLIES!', size: 0.12, y: 0.3, shape: 'cloud', bg: '#7ae8ff', fg: '#ffffff' },
      { t: 16.2, text: 'SO PEACEFUL', size: 0.11, y: 0.32, shape: 'cloud', bg: '#ff8fc8', fg: '#ffffff' }, { t: 22.6, text: 'GOODNIGHT!', size: 0.12, y: 0.3, shape: 'cloud', bg: '#b388ff', fg: '#ffffff' }],
    tags: [{ t0: 10.4, t1: 13.0, herd: 0, m: 0, label: 'GAZELLES', sub: 'A MOONLIGHT RUN' }] },
];
module.exports = { joy };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  joy({ ...HAPPY, ...cfg }, path.join(outDir, file));
});
