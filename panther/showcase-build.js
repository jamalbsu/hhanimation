// node showcase-build.js <panther-pack-clash-lake.html> <outDir>
// panther-showcase.html: the panther from panther/panther-rig.js on a studio stage, with a guided camera tour and controls.
const fs = require('fs'), path = require('path');
const { joy } = require('./joy-build.js');
const { PACK } = require('./hunt-build.js');
const [src, outDir] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');

const cfg = {
  ep: 0, title: 'Meet the Cast', dur: 36, biomes: [['savanna', 0]], pack: PACK, endCard: 0.01, accent: ['#ffb46e', '#ff6fae', '#7ae8ff'],
  panther: { fur: ['#33302e', '#1a1719', '#070606'], far: '#0a0908', rim: 'rgb(255,215,170)', lt: '255,215,175' },
  grade: null, glow: null, drums: [], roars: [], slow: [], flashes: [], herds: [], pops: [], tags: [],
  music: { seed: 31, bpm: 100, root: 57, prog: 'dream', lead: 'flute', arp: 'harp', soft: true, vol: 0.8 },
  speed: [[0, 'walk'], [7.6, 'walk'], [9.2, 'run'], [16.6, 'run'], [18.2, 820], [26.4, 820], [28.2, 'walk'], [36, 'walk']],
  cam: [{ t: 0, yaw: 12, tilt: 6, zoom: 1.25, y: 0.62, x: 0, d: 1300 }, { t: 4, yaw: 35, tilt: 10, zoom: 1.1 }, { t: 8, yaw: 60, tilt: 18, zoom: 1.0, y: 0.66 },
    { t: 12, yaw: 88, tilt: 30, zoom: 0.95, y: 0.68 }, { t: 16, yaw: -30, tilt: 8, zoom: 1.2, y: 0.6 }, { t: 20, yaw: -55, tilt: 14, zoom: 1.35, y: 0.58 },
    { t: 24, yaw: 5, tilt: 4, zoom: 1.75, y: 0.6, x: -0.16 }, { t: 28, yaw: 20, tilt: 10, zoom: 1.05, y: 0.63, x: 0 }, { t: 32, yaw: 70, tilt: 45, zoom: 0.9, y: 0.64 },
    { t: 36, yaw: 12, tilt: 6, zoom: 1.25, y: 0.62 }],
  shake: [[0, 0]], lines: [[0, 0]], tone: [[0, 0]], slashes: [], joyHud: false, butterflies: 0, birds: 0,
};
let s = joy(cfg, null);
const count = a => s.split(a).length - 1;
const R = (a, b) => { const c = count(a); if (c !== 1) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
R("const T0 = +(params.get('t0') || 0);", "let T0 = +(params.get('t0') || 0);");
R('function drawPop(t) {', chunk('showcase.txt') + '\nfunction drawPop(t) {');
R('  drawChase(t, 1);', '  drawStage(t);');
R('  drawPop(t);\n', '  drawShowcase(t);\n');
R('camUpdate(STL); setTurn(1);', 'camUpdate(STL); showcaseCam(); setTurn(1);');
R('COAT = COATS.panther; MARKS = null; DLAG = 0; TAB = TAB0; drawPanther', 'COAT = SHOW_COAT || COATS.panther; MARKS = SHOW_MARKS; DLAG = 0; TAB = TAB0; drawPanther');
R('  OURS.forEach((a, i) => ents.push({ a, fa: 1,', '  if (!SHOW_SOLO) OURS.forEach((a, i) => ents.push({ a, fa: 1,');
s = s.replace(/<title>[^<]*<\/title>/, '<title>Panther Showcase</title>');
const out = path.join(outDir, 'panther-showcase.html');
fs.writeFileSync(out, s); console.log('wrote', out, s.length);
