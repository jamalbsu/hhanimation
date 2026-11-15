// node adv-build.js <panther-pack-clash-lake.html> <outDir> [only]
// The Panther Pack adventures: the lake page turned into a story engine, plus five stories.
const fs = require('fs'), path = require('path');
const [src, outDir, only] = require.main === module ? process.argv.slice(2) : [];
const here = __dirname, chunk = n => fs.readFileSync(path.join(here, n), 'utf8');
let base = src ? fs.readFileSync(src, 'utf8') : null;

function engine(cfg, file, from) {
  let s = from || base;
  const count = a => s.split(a).length - 1;
  const R = (a, b) => { const n = count(a); if (n !== 1) throw new Error(`R: ${n} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.replace(a, () => b); };
  const REGION = (a, b, rep) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0 || count(a) !== 1) throw new Error('REGION ' + a); s = s.slice(0, i) + rep + s.slice(j); };

  R('<title>Panther Pack Lake</title>', `<title>${cfg.title}</title>`);
  R('<span class="sub">Daylight walk</span>', `<span class="sub">${cfg.title}</span>`);
  REGION('// ---- the story: one run of the animation', 'function tab(a, t)', chunk('header.txt').replace('__CFG__', JSON.stringify(cfg, null, 1)));
  R('  [[0, 0, 0.06], [0.5, -0.45, 0.03]', '  if (CFG.drink) [[0, 0, 0.06], [0.5, -0.45, 0.03]');
  R('  for (let t = 24.2; t < STORY - 0.5;', '  for (let t = CFG.drink ? DRINK0 - 5.7 : 1e9; t < STORY - 0.5;');
  // standing, the head comes up to look; talking, it nods and the ears flick
  R('  const drowsy = smooth(clamp((tl - EVT.lie1) / 9));', `  const still = W.wStand * (1 - wL);
  if (still > 0.01) { const up = still * (1 - wD); head.y -= 9 * up; head.a -= 6 * DEG * up; }
  if (TALKW > 0.01) { const s1 = Math.sin(TAU * 2.3 * tl); head.a += TALKW * (5 * s1 - 4) * DEG; head.y += TALKW * 3 * Math.sin(TAU * 2.3 * tl + 1); head.ear += TALKW * 5 * DEG * Math.sin(TAU * 1.4 * tl); }
  const drowsy = smooth(clamp((tl - EVT.lie1) / 9));`);
  R('return { legs, hull, head, tail, off, bF, bH, feet, lift, pitch, eye, wG, wL, wD };', 'return { legs, hull, head, tail, off, bF, bH, feet, lift, pitch, eye, wG, wL, wD, still };');
  R('26 * Math.pow(i / N, 1.2) * Math.sin(TAU * c / 2 + (P.wD || 0) * 1.6 * tl - i * 0.38)',
    '26 * Math.pow(i / N, 1.2) * lerp(Math.sin(TAU * c / 2 - i * 0.38), Math.sin(1.6 * tl - i * 0.38), Math.max(P.wD || 0, P.still || 0))');
  REGION('const D_END = tab(TAB.d, STORY)', '// ---- the pack', chunk('world.txt'));
  REGION('const V_CLOSE = 1500;', '// markings sit on the 3D body surface', chunk('pack.txt'));
  R('const f = clamp(facing(...rotN(H, 0.25, -0.6), sd * 0.75) * 2.2) * a;', 'const f = clamp(facing(...rotN(H, 0.55, -0.45), sd * 0.7) * 2.2) * a;');   // eyes sit on the front of the face
  // a talking face opens and closes its mouth
  R('  ctx.globalAlpha = a * (1 - 0.9 * (P.wD || 0));', `  if (TALKW > 0.02) {
    const op = TALKW * (0.35 + 0.65 * Math.abs(Math.sin(STL * 9)));
    ctx.globalAlpha = a * clamp(facing(...rotN(H, 1, -0.3), 0) * 3);
    const m0 = hp(75, 9, 0), m1 = hp(78, 9, 0), ma = Math.atan2(m1[1] - m0[1], m1[0] - m0[0]);
    ctx.save(); ctx.translate(m0[0], m0[1]); ctx.rotate(ma); ctx.fillStyle = 'rgba(46,12,18,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 1.5 + 4.5 * op, 6.5, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = a * (1 - 0.9 * (P.wD || 0));`);
  // main loop: story camera tilt, the land's palette, weather, speech and title
  R('  STL = t % STORY; SD = tab(TAB.d, STL);\n  CH_TH = lerp(24, 38, smooth(clamp((STL - 27.2) / 4))) * DEG;      // crane up over the shore',
    '  STL = t % STORY; TAB = TAB0; SD = tab(TAB.d, STL);\n  CH_TH = keyVal(CFG.tilt, STL) * DEG; PAL = palAt(SD + 1400, 1400);   // camera tilt and the colours of the land we are crossing');
  R('  drawFireflies(t);\n  vignette();', '  drawWeather(t);\n  vignette();\n  drawBubbles();\n  drawTitle();');
  R("g.addColorStop(0, 'rgba(0,0,12,0)'); g.addColorStop(1, 'rgba(0,0,12,0.6)');", 'g.addColorStop(0, col(PAL.c.vig, 0)); g.addColorStop(1, col(PAL.c.vig, PAL.vigA));');
  R("g.addColorStop(0, `rgba(120,135,170,${al})`); g.addColorStop(1, 'rgba(120,135,170,0)');", 'g.addColorStop(0, col(PAL.c.dust, al)); g.addColorStop(1, col(PAL.c.dust, 0));');
  // sound: ambience now comes from the land, through the event list
  R(`  between(0.83, 0.2, te => chirp(at(te), 4700, -0.5, 0.012));
  between(1.07, 0.5, te => chirp(at(te), 5200, 0.55, 0.009));`, '');
  R(`  for (let t = 0.1; t < dur - 1; t += 0.42) chirp(t, 5400, (t * 7 % 2) - 1, 0.008);   // crickets
  for (const t of [3.5, 12, 19.5, 31.5]) owl(t);`, '');
  R(`    case 'shore':`, `    case 'talk': talkSnd(a, e); break;
    case 'cricket': chirp(a, 5400, e.pan, 0.008 * e.v); break;
    case 'owl': owl(a); break;
    case 'tweet': tweet(a, e.f, e.pan, 0.018 * e.v); break;
    case 'wind': breathSnd(a, 3.2, 0.05 * e.v, 480); break;
    case 'buzz': noise(a, 0.9, 'bandpass', 5200, 6, 0.012 * e.v, e.pan, 0.3); break;
    case 'shore':`);
  R('function pad(at, notes, len) {', `function talkSnd(at, e) {          // a cat's voice: soft chuffs and rumbles, one per syllable
  for (let i = 0; i < e.n; i++) {
    const t0 = at + i * e.d / e.n + 0.02 * Math.sin(i * 7.1), len = e.d / e.n * 0.85, f0 = e.f * (1 + 0.16 * Math.sin(i * 2.7 + e.f));
    const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(), p = ac.createStereoPanner();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * 1.08, t0); o.frequency.exponentialRampToValueAtTime(f0 * 0.8, t0 + len);
    fl.type = 'bandpass'; fl.frequency.value = f0 * 3.2; fl.Q.value = 1.3; p.pan.value = e.pan || 0;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.11, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(fl); fl.connect(g); g.connect(p); p.connect(master); p.connect(wet);
    o.start(t0); o.stop(t0 + len + 0.05);
    noise(t0, len * 0.7, 'bandpass', 900, 1, 0.02, e.pan || 0, 0.2);
  }
}
function tweet(at, f, pan, vol) {  // a small bird
  for (let i = 0; i < 3; i++) {
    const o = ac.createOscillator(), g = ac.createGain(), p = ac.createStereoPanner(), t0 = at + i * 0.09;
    o.type = 'sine'; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * (i % 2 ? 0.8 : 1.35), t0 + 0.06); p.pan.value = pan;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
    o.connect(g); g.connect(p); p.connect(master); p.connect(wet); o.start(t0); o.stop(t0 + 0.09);
  }
}
function pad(at, notes, len) {`);
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}
module.exports = { engine };

// ---- the stories ----
const STORIES = [
  { file: 'panther-adventure-1-golden-plains.html', title: 'The Golden Plains', dur: 44,
    biomes: [['savanna', 0], ['night', 34]],
    speed: [[0, 'run'], [9, 'run'], [10.8, 'walk'], [12, 'walk'], [13, 0], [22, 0], [23, 'walk'], [25.2, 'walk'], [27, 'run'], [44, 'run']],
    tilt: [[0, 24], [11, 24], [13, 40], [22, 40], [24.5, 24]],
    meets: [{ tm: 13, gap: 700, speed: [[0, 'walk'], [12, 'walk'], [13, 0], [22, 0], [23, 'walk'], [44, 'walk']], members: [
      { coat: 'lion', size: 1.0, dfx: 0, zMeet: 75, zPass: 112, name: 'Amara', voice: 175, ph: 0.1 },
      { coat: 'lion', size: 0.55, dfx: 120, zMeet: -130, zPass: -103, name: 'Kito', voice: 340, ph: 0.3 },
      { coat: 'lion', size: 0.55, dfx: 170, zMeet: 170, zPass: 340, name: 'Zola', voice: 370, ph: 0.45 },
      { coat: 'lion', size: 0.96, dfx: 270, zMeet: -270, zPass: -310, name: 'Nia', voice: 165, ph: 0.2 }] }],
    talk: [
      { t: 13.4, d: 2.6, who: 'A0', text: 'Evening, travelers! Where are you headed?' },
      { t: 16.2, d: 2.4, who: 'P', text: 'North, to the moon forest.' },
      { t: 18.8, d: 2.5, who: 'A0', text: 'Mind the river. It runs high tonight.' },
      { t: 21.0, d: 1.6, who: 'A1', text: 'Bye, big kitties!' },
      { t: 22.4, d: 1.8, who: 'P', text: 'Safe roads, friends!' }] },
  { file: 'panther-adventure-2-snow-pass.html', title: 'The Snow Pass', dur: 44,
    biomes: [['autumn', 0], ['snow', 15]],
    speed: [[0, 'run'], [20, 'run'], [21.8, 'walk'], [23, 'walk'], [24, 0], [33, 0], [34, 'walk'], [36, 'walk'], [38, 'run'], [44, 'run']],
    tilt: [[0, 24], [22, 24], [24, 40], [33, 40], [35.5, 24]],
    meets: [{ tm: 24, gap: 700, speed: [[0, 'walk'], [23, 'walk'], [24, 0], [33, 0], [34, 'walk'], [44, 'walk']], members: [
      { coat: 'snowleo', marks: 'rosettes', size: 0.95, dfx: 0, zMeet: 75, zPass: -103, name: 'Kira', voice: 200, ph: 0.15 },
      { coat: 'snowleo', marks: 'rosettes', size: 0.55, dfx: 110, zMeet: 170, zPass: 112, name: 'Pip', voice: 360, ph: 0.35 },
      { coat: 'snowleo', marks: 'rosettes', size: 1.0, dfx: 210, zMeet: -240, zPass: -310, name: 'Taro', voice: 140, ph: 0.25 }] }],
    talk: [
      { t: 24.4, d: 2.5, who: 'A0', text: 'Brr! You are far from home, strangers.' },
      { t: 27.0, d: 2.3, who: 'T', text: 'Not me. I was born for snow!' },
      { t: 29.4, d: 2.6, who: 'A0', text: 'The pass is open, but a storm is coming.' },
      { t: 32.1, d: 1.8, who: 'P', text: 'Then we hurry. Thank you!' },
      { t: 34.0, d: 1.6, who: 'A1', text: 'Run fast!' }] },
  { file: 'panther-adventure-3-desert-race.html', title: 'The Desert Race', dur: 42,
    biomes: [['savanna', 0], ['desert', 10]],
    speed: [[0, 'run'], [16, 'run'], [17.8, 'walk'], [19, 'walk'], [20, 0], [28.5, 0], [29.5, 'walk'], [31, 'walk'], [33, 'run'], [42, 'run']],
    tilt: [[0, 24], [18, 24], [20, 40], [28.5, 40], [31, 24]],
    meets: [{ tm: 20, gap: 700, speed: [[0, 'dash'], [17.4, 'dash'], [19.2, 'walk'], [20, 0], [28.6, 0], [29.4, 'run'], [30.6, 'dash'], [42, 'dash']], members: [
      { coat: 'cheetahDay', marks: 'spots', size: 0.92, dfx: 0, zMeet: 75, zPass: 112, name: 'Zuri', voice: 245, ph: 0.12 },
      { coat: 'cheetahDay', marks: 'spots', size: 0.9, dfx: 170, zMeet: -210, zPass: -310, name: 'Kofi', voice: 210, ph: 0.33 }] }],
    talk: [
      { t: 20.3, d: 2.0, who: 'A0', text: 'Hey! Race you to the canyon!' },
      { t: 22.4, d: 1.6, who: 'C', text: "You're on!" },
      { t: 24.1, d: 2.2, who: 'P', text: 'Dash... we are walking today.' },
      { t: 26.4, d: 2.0, who: 'C', text: 'Fine. Next time, Zuri!' },
      { t: 28.5, d: 1.6, who: 'A0', text: 'Ha! See you there!' }] },
  { file: 'panther-adventure-4-tiger-land.html', title: 'Tiger Land', dur: 42,
    biomes: [['jungle', 0], ['night', 33]],
    speed: [[0, 'run'], [10, 'run'], [11.8, 'walk'], [13, 'walk'], [14, 0], [23, 0], [24, 'walk'], [26.5, 'walk'], [28.5, 'run'], [42, 'run']],
    tilt: [[0, 24], [12, 24], [14, 40], [23, 40], [25.5, 24]],
    meets: [{ tm: 14, gap: 740, speed: [[0, 'walk'], [13, 'walk'], [14, 0], [23, 0], [24, 'walk'], [42, 'walk']], members: [
      { coat: 'bengal', marks: 'stripes', size: 1.18, dfx: 0, zMeet: 75, zPass: 112, name: 'Raja', voice: 105, ph: 0.1 },
      { coat: 'bengal', marks: 'stripes', size: 1.04, dfx: 200, zMeet: -220, zPass: -310, name: 'Tara', voice: 160, ph: 0.3 }] }],
    talk: [
      { t: 14.3, d: 2.0, who: 'A0', text: 'Stop. This is tiger land.' },
      { t: 16.5, d: 2.2, who: 'P', text: 'We are only passing through.' },
      { t: 18.9, d: 1.8, who: 'T', text: 'Cousin Raja? It is me, Frost!' },
      { t: 20.9, d: 2.3, who: 'A0', text: 'Frost! Then pass in peace, family.' },
      { t: 23.2, d: 1.6, who: 'A1', text: 'Come back soon!' }] },
  { file: 'panther-adventure-5-blossom-lake.html', title: 'Blossom Lake', dur: 46,
    biomes: [['savanna', 0], ['blossom', 8]],
    speed: [[0, 'run'], [8, 'run'], [9.8, 'walk'], [11, 'walk'], [12, 0], [20.5, 0], [21.5, 'walk'], [23.5, 'walk'], [25.5, 'run'], [32, 'run'], [35, 'walk'], [37, 'walk'], [38.4, 0], [46, 0]],
    tilt: [[0, 24], [10, 24], [12, 40], [20.5, 40], [22.5, 24], [35.5, 24], [39.5, 38], [46, 38]],
    drink: { t: 38.9, settle: [32.5, 37.4] },
    meets: [{ tm: 12, gap: 700, speed: [[0, 'walk'], [11, 'walk'], [12, 0], [20.5, 0], [21.5, 'walk'], [46, 'walk']], members: [
      { coat: 'leopardDay', marks: 'rosettes', size: 0.95, dfx: 0, zMeet: 75, zPass: 112, name: 'Mira', voice: 205, ph: 0.12 },
      { coat: 'leopardDay', marks: 'rosettes', size: 0.55, dfx: 110, zMeet: -130, zPass: -103, name: 'Bo', voice: 350, ph: 0.3 },
      { coat: 'leopardDay', marks: 'rosettes', size: 0.55, dfx: 150, zMeet: 170, zPass: 340, name: 'Lulu', voice: 390, ph: 0.45 }] }],
    talk: [
      { t: 12.3, d: 2.4, who: 'A0', text: 'What a lovely evening for a walk!' },
      { t: 14.9, d: 2.3, who: 'L', text: 'It is. Is there water nearby?' },
      { t: 17.4, d: 2.5, who: 'A0', text: 'The lake is just ahead. The water is sweet.' },
      { t: 20.0, d: 1.4, who: 'A1', text: 'Bye bye!' },
      { t: 21.4, d: 1.8, who: 'L', text: 'Thank you, Mira!' }] },
];
if (require.main === module) STORIES.forEach((st, i) => {
  if (only && !st.file.includes(only)) return;
  const { file, ...cfg } = st;
  engine(cfg, path.join(outDir, file));
});
