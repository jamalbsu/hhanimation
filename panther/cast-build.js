// node cast-build.js <panther-pack-clash-lake.html> <outDir>
// "Meet the Panthers Pack": each cat steps on stage for a face close-up, its name and a fun fact.
const fs = require('fs'), path = require('path');
const { joy } = require('./joy-build.js');
const { PACK } = require('./hunt-build.js');
const [src, outDir] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');
const SEG = 4.3;
const CAST = [
  ['Black Panther', 'blackP2', null, 'Panthera pardus · melanistic', 'A leopard in a black coat. Look closely: the spots are still there!'],
  ['Leopard', 'leopardDay', 'rosettes', 'Panthera pardus', 'Can carry its dinner all the way up a tree.'],
  ['Jaguar', 'jaguar', 'rosettes', 'Panthera onca', 'The big cat that loves to swim.'],
  ['Snow Leopard', 'snowLeopard', 'rosettes', 'Panthera uncia', 'Wraps its fluffy tail around itself like a scarf.'],
  ['White Tiger', 'whiteTiger', 'stripes', 'Panthera tigris · white', 'No two tigers have the same stripes.'],
  ['Golden Panther', 'goldenPanther', null, 'Panthera pardus · golden', 'The rarest coat in the whole pack.']];
const aim = [], cam = [];
CAST.forEach((c, i) => {                        // each cat: a face close-up, then the camera pulls back to the whole cat
  const s = i * SEG;
  cam.push({ t: s, yaw: 8, tilt: 6, zoom: 2.3, y: 0.66, d: 1300 }, { t: s + 1.9, yaw: 10, tilt: 7, zoom: 2.2 }, { t: s + 3.3, yaw: 28, tilt: 11, zoom: 1.15, y: 0.64 }, { t: s + SEG - 0.05, yaw: 30, tilt: 11, zoom: 1.12 });
  aim.push([s, 165], [s + 1.9, 160], [s + 3.3, 40], [s + SEG - 0.05, 40]);
});
const END = CAST.length * SEG;
cam.push({ t: END + 0.6, yaw: 60, tilt: 24, zoom: 0.9, y: 0.66 }, { t: END + 3, yaw: 70, tilt: 28, zoom: 0.85 }); aim.push([END + 0.6, 20], [END + 3, 20]);
const cfg = {
  ep: 25, title: 'Meet the Panthers Pack', dur: +(END + 3).toFixed(2), biomes: [['savanna', 0]], pack: PACK, endCard: 0.01, accent: ['#ffb46e', '#ff6fae', '#7ae8ff'],
  panther: { fur: ['#33302e', '#1a1719', '#070606'], far: '#0a0908', rim: 'rgb(255,215,170)', lt: '255,215,175' },
  grade: null, glow: null, drums: [], roars: [], slow: [], flashes: [], herds: [], pops: [], tags: [],
  music: { seed: 25, bpm: 112, root: 62, prog: 'pop', lead: 'bell', arp: 'pluck' },
  speed: [[0, 'walk'], [END + 3, 'walk']], cam, aim, cast: CAST, castSeg: SEG,
  castHeader: 'PANTHERS PACK  ·  MEET THE CAST', castEnd: "WHO'S YOUR|FAVOURITE?|TELL US IN THE COMMENTS",
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
s = s.replace(/<title>[^<]*<\/title>/, '<title>Meet the Panthers Pack</title>');
const out = path.join(outDir, 'panthera-25-meet-the-panthers-pack.html');
fs.writeFileSync(out, s); console.log('wrote', out, s.length);
