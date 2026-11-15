// node hunt-build.js <panther-pack-clash-lake.html> <outDir> [only]
// PANTHERA — five hunts and escapes, built on the adventure engine with a free cinematic camera.
const fs = require('fs'), path = require('path');
const { engine } = require('./adv-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');
const base = src ? fs.readFileSync(src, 'utf8') : '';

function build(cfg, file, baseSrc) {
  let s = engine({ ...cfg, talk: [], meets: [] }, null, baseSrc || base);
  const count = a => s.split(a).length - 1;
  const R = (a, b, n = 1) => { const c = count(a); if (c !== n) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  const REGION = (a, b, rep) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0 || count(a) !== 1) throw new Error('REGION ' + a); s = s.slice(0, i) + rep + s.slice(j); };

  if (!/charset/i.test(s)) s = s.replace('<title>', '<meta charset="utf-8">\n<title>');
  REGION('// ---- who we meet on the road', '// markings sit on the 3D body surface', chunk('hunt-pack.txt'));
  // the camera: free yaw (0 = side, 90 = behind, below 0 = ahead of the cats), tilt and distance, set each frame
  R(`function setTurn(u) {
  RU = u; const a = u * Math.PI / 2, th = u * CH_TH;`, `function setTurn(u) {
  RU = 1; const a = CAMYAW * DEG, th = CAMTILT * DEG;`);
  R('let CH_TH = 24 * DEG; const CH_D = 900;', 'let CH_TH = 24 * DEG, CH_D = 900;');
  R('sc = Math.min(W * 0.86 / 560, H * (portrait ? 0.4 : 0.44) / 260);', 'sc = Math.min(W * 0.86 / 560, H * (portrait ? 0.4 : 0.44) / 260); SC0 = sc;');
  R('if (RU > 0.45) { drawLeg(cBody', 'if (RS > 0.55) { drawLeg(cBody');
  R('if (!far || RU > 0.45) {', 'if (!far || RS > 0.55) {');
  R('out.thr = 20 * RS; }', 'out.thr = 20 * Math.abs(RS); }');   // thigh width, also when the camera is ahead of the cats
  // a wider world, so side and front views have scenery behind the cats too
  REGION('const CH_SPAN = 3600;', 'const D_END', `const CH_SPAN = 5200;                   // the world repeats over this distance (body units)
const CH_DECOR = (() => { const r = rng(77), a = []; for (let i = 0; i < 760; i++) a.push({ wf: r() * CH_SPAN, z: (r() - 0.5) * 3200, kind: r(), s: r(), c: r() }); return a; })();
const CH_TREES = (() => { const r = rng(91), a = []; for (let i = 0; i < 60; i++) { const sd = i % 2 ? 1 : -1; a.push({ wf: r() * CH_SPAN, z: sd * (460 + r() * 1300), ht: 420 + r() * 220, cr: 120 + r() * 70, tw: 20 + r() * 12, seed: 1 + Math.floor(r() * 1e6) }); } return a; })();
const CH_FAR = (() => { const r = rng(55), a = []; for (let i = 0; i < 160; i++) { const sg = i % 2 ? 1 : -1; a.push({ f: sg * (3200 + r() * 2600), z: (r() - 0.5) * 9000, ht: 380 + r() * 300, cr: 150 + r() * 120, seed: 1 + Math.floor(r() * 1e6) }); } return a; })();
`);
  R('% CH_SPAN - 700;', '% CH_SPAN - 2200;', 2);
  R(`    if (f * RS - tr.z * RC < 0 && Math.abs(f * RC + tr.z * RS) < 320) continue;      // never between the camera and the panther
    const B = biomeAt(SD + f); if (hh(tr.seed % 991, 2.3) > B.keep) continue;
    items.push({ d: f * RS - tr.z * RC, draw: () => drawTreeP(P3, f, tr.z, tr, tIn * clamp(1 - (f - 1800) / 1100), B) });`,
  `    const dep = f * RS - tr.z * RC, nf = dep < 0 ? clamp((Math.abs(f * RC + tr.z * RS) - 300) / 320) : 1;   // fades rather than block the cats
    if (nf <= 0) continue;
    const B = biomeAt(SD + f); if (hh(tr.seed % 991, 2.3) > B.keep) continue;
    items.push({ d: dep, draw: () => drawTreeP(P3, f, tr.z, tr, tIn * nf * clamp(1 - (f - 1800) / 1100) * clamp((f + 2200) / 600), B) });`);
  R('if (!okAt(f, it.z) || f > 2600 || f > shoreRel(it.z) - 25) continue;', 'if (!okAt(f, it.z) || f > 2600 || f < -1900 || f > shoreRel(it.z) - 25) continue;');
  R(`  for (let i = 0; i <= 64; i++) {
    const f = -650 + Math.pow(i / 64, 2.2) * 9000;`, `  for (let i = 0; i <= 96; i++) {
    const sg = i / 48 - 1, f = Math.sign(sg) * Math.pow(Math.abs(sg), 2.2) * 9000;`);
  R('sx = van[0] + W * o.x', 'sx = W * (0.5 + o.x)');
  R('let mx = van[0], mw = -1;', 'let mx = W / 2, mw = -1;');
  R('if (hh(tr.seed % 997, 1.7) > B.farKeep) continue;', 'if (hh(tr.seed % 997, 1.7) > B.farKeep || !okAt(tr.f, tr.z)) continue;');
  REGION('function frame(now) {', "window.addEventListener('resize', resize);", `function frame(now) {
  const tR = Math.max(0, (now - startTime) / 1000) + T0, loop = Math.floor(tR / REAL);
  STL = Math.min(STORY - 1e-4, storyAt(tR - loop * REAL)); const t = STL + loop * STORY;   // story time slows inside slow-motion windows
  TAB = TAB0; SD = tab(TAB.d, STL); PAL = palAt(SD + 1400, 1400);
  camUpdate(STL); setTurn(1);
  CAMX = (W / 2 - ox) + CAMFX * W + SHX; CAMY = H * CAMFY - oy + 110 * sc + SHY;   // where the panther sits in the frame
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  drawChase(t, 1);
  drawHerdDust();
  drawDust();
  drawPack(t);
  drawWeather(t);
  drawCine();
  drawTitle();
  const fade = STL < FIN ? 1 - STL / FIN : STL > SEND - FOUT ? Math.min(1, (STL - (SEND - FOUT)) / FOUT) : 0;
  if (fade > 0) { ctx.fillStyle = \`rgba(0,0,0,\${smooth(fade)})\`; ctx.fillRect(0, 0, W, H); }
  if (!window.CAPTURING) requestAnimationFrame(frame);   // the frame renderer draws frames itself
}
`);
  // sound runs on the clock, so events are moved to where slow motion puts them
  R('const k0 = Math.max(0, Math.floor(schedUntil / STORY)), k1 = Math.floor(until / STORY);', 'const k0 = Math.max(0, Math.floor(schedUntil / REAL)), k1 = Math.floor(until / REAL);');
  R('const te = k * STORY + e.t;', 'const te = k * REAL + realOf(e.t);');
  R('const sr = 44100, dur = STORY,', 'const sr = 44100, dur = REAL,');
  R('for (const e of EVENTS) if (e.t < dur - 0.5) { try { playEvent(e, e.t); } catch (err) {} }', 'for (const e of EVENTS) if (realOf(e.t) < dur - 0.5) { try { playEvent(e, realOf(e.t)); } catch (err) {} }');
  R('window.DUR = STORY;', 'window.DUR = REAL;');
  R(`    case 'talk':`, `    case 'hoof': noise(a, e.heavy ? 0.2 : 0.12, 'lowpass', e.heavy ? 110 : 170, 0.8, e.v, e.pan, 0.25); noise(a + 0.01, 0.05, 'bandpass', 1900, 1.2, e.v * 0.12, e.pan, 0.2); break;
    case 'snort': snortSnd(a, e.heavy); break;
    case 'roar': roarSnd(a); break;
    case 'drum': drumSnd(a, e.acc, e.v); break;
    case 'talk':`);
  R('function pad(at, notes, len) {', `function snortSnd(at, heavy) {     // a big animal blowing hard through its nose
  noise(at, heavy ? 0.5 : 0.32, 'bandpass', heavy ? 520 : 900, 1.1, heavy ? 0.12 : 0.08, 0, 0.3);
  noise(at + 0.18, heavy ? 0.4 : 0.25, 'bandpass', heavy ? 420 : 760, 1.1, heavy ? 0.08 : 0.05, 0, 0.3);
}
function roarSnd(at) {              // a deep cat growl
  const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(92, at); o.frequency.linearRampToValueAtTime(70, at + 1.3);
  lfo.frequency.value = 22; lg.gain.value = 9; lfo.connect(lg); lg.connect(o.frequency);
  f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 2;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.22, at + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
  o.connect(f); f.connect(g); g.connect(master); g.connect(wet); o.start(at); lfo.start(at); o.stop(at + 1.5); lfo.stop(at + 1.5);
  noise(at, 1.2, 'bandpass', 380, 0.8, 0.05, 0, 0.4);
}
function drumSnd(at, acc, v) {      // a low cinematic drum that drives the chase
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(acc ? 120 : 95, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.35);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime((acc ? 0.3 : 0.18) * v + 0.001, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
  o.connect(g); g.connect(master); g.connect(wet); o.start(at); o.stop(at + 0.5);
  noise(at, 0.06, 'bandpass', 2400, 1, 0.03 * v, 0, 0.3);
}
function pad(at, notes, len) {`);
  // the panther itself comes from its own file in the project: panther/panther-rig.js
  if (!cfg.classicPanther) { const rig = path.join(path.dirname(src), 'panther', 'panther-rig.js'); if (fs.existsSync(rig)) s = require('./panther-module.js').apply(s, fs.readFileSync(rig, 'utf8')); }
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

// ---- the episodes (times are story time; slow-motion windows stretch them on screen) ----
const DAY_PANTHER = { fur: ['#2a2c33', '#15171c', '#060607'], far: '#08090b', rim: 'rgb(255,222,180)', lt: '255,220,182' };
const PACK = [{ coat: 'blackP2', marks: null, size: 0.95 }, { coat: 'leopardDay', marks: 'rosettes', size: 0.92 }, { coat: 'jaguar', marks: 'rosettes', size: 1.02 }];
const EPISODES = [
  { file: 'panthera-1-the-hunt.html', ep: 1, title: 'The Hunt', dur: 30, biomes: [['savanna', 0]],
    panther: DAY_PANTHER, pack: PACK, grade: ['#ff9a3c', 0.2], glow: [0.3, '255,190,120'],
    speed: [[0, 'walk'], [5.6, 'walk'], [6.8, 700], [15.5, 700], [18, 'run'], [21, 'walk'], [23.5, 0], [30, 0]],
    herds: [{ kind: 'gazelle', dir: 1, fx0: 1900, dust: 0.5, zig: 90, speed: [[0, 0], [5.9, 0], [7.4, 610], [15, 610], [16.4, 880], [30, 880]],
      hd: [[0, 42], [5.7, 42], [6.3, 0]], leaps: [[10.6, 0.9, 75], [14.2, 0.8, 60]], zShift: [[0, 0], [16, 0], [19, -900]],
      members: [{ dfx: 0, z: 40 }, { dfx: 120, z: -180, size: 0.95 }, { dfx: 220, z: 200 }, { dfx: 330, z: -60, size: 1.05 }, { dfx: 420, z: 330 }, { dfx: 520, z: -300, size: 0.9 }, { dfx: 640, z: 120 }] }],
    cam: [{ t: 0, yaw: 25, tilt: 9, zoom: 0.95, y: 0.66, x: -0.12, d: 1400 }, { t: 5.4, yaw: 48, tilt: 10, zoom: 1.05, x: -0.05, d: 1200 },
      { t: 6.6, yaw: 70, tilt: 16, zoom: 1.0, y: 0.7, x: 0, d: 950 }, { t: 9.5, yaw: 88, tilt: 22, zoom: 0.95, y: 0.72, d: 850 },
      { t: 10.5, yaw: 30, tilt: 12, zoom: 0.75, y: 0.64, x: -0.15, d: 1500 }, { t: 12.4, yaw: 18, tilt: 12, zoom: 0.75 },
      { t: 14.2, yaw: 60, tilt: 30, zoom: 0.85, y: 0.7, x: 0, d: 1000 }, { t: 16.8, yaw: 90, tilt: 44, zoom: 0.8, y: 0.72, d: 1100 },
      { t: 21, yaw: 75, tilt: 26, zoom: 0.95, y: 0.68 }, { t: 25.5, yaw: 30, tilt: 10, zoom: 1.15, y: 0.64 }, { t: 30, yaw: 22, tilt: 9, zoom: 1.2 }],
    slow: [[10.3, 12.1, 0.3]], shake: [[0, 0], [6.6, 1], [16, 1], [20, 0]], drums: [[6.3, 17, 112]], roars: [24.2] },
  { file: 'panthera-2-white-silence.html', ep: 2, title: 'White Silence', dur: 30, biomes: [['snow', 0]],
    panther: { fur: ['#2a2d36', '#15171d', '#060608'], far: '#08090c', rim: 'rgb(225,235,255)', lt: '215,228,255' }, pack: PACK, grade: ['#7fb0ff', 0.2], glow: [0.75, '220,235,255'],
    speed: [[0, 'walk'], [5, 'walk'], [6.2, 680], [16, 680], [18.5, 'run'], [21.5, 'walk'], [24, 0], [30, 0]],
    herds: [{ kind: 'deer', dir: 1, fx0: 1700, dust: 0.8, zig: 120, speed: [[0, 0], [5.2, 0], [6.8, 600], [14.5, 600], [16, 860], [30, 860]],
      hd: [[0, 40], [5, 40], [5.6, -6]], leaps: [[9.8, 0.95, 85], [13.3, 0.9, 95]], zShift: [[0, 0], [15.5, 0], [18.5, -1300]],
      members: [{ dfx: 0, z: 0, size: 1.08 }, { dfx: 140, z: -220 }, { dfx: 260, z: 210, size: 0.95 }, { dfx: 390, z: -40 }, { dfx: 520, z: 280, size: 0.9 }] }],
    cam: [{ t: 0, yaw: 90, tilt: 62, zoom: 0.7, y: 0.7, x: 0, d: 1300 }, { t: 4.5, yaw: 40, tilt: 12, zoom: 0.95, y: 0.66, x: -0.1, d: 1200 },
      { t: 6.2, yaw: 80, tilt: 18, zoom: 0.95, y: 0.7, x: 0, d: 900 }, { t: 9.4, yaw: 92, tilt: 24, zoom: 0.9, y: 0.72 },
      { t: 13.0, yaw: 22, tilt: 11, zoom: 0.72, y: 0.64, x: -0.14, d: 1500 }, { t: 14.8, yaw: 14, tilt: 11, zoom: 0.72 },
      { t: 17, yaw: 85, tilt: 48, zoom: 0.78, y: 0.72, x: 0, d: 1100 }, { t: 22, yaw: 60, tilt: 20, zoom: 0.95, y: 0.68 },
      { t: 26, yaw: 18, tilt: 8, zoom: 1.15, y: 0.64 }, { t: 30, yaw: 12, tilt: 8, zoom: 1.2 }],
    slow: [[13.0, 14.6, 0.3]], shake: [[0, 0], [6, 1], [16.5, 1], [20, 0]], drums: [[5.9, 17.5, 104]], roars: [24.6] },
  { file: 'panthera-3-tusk-and-fury.html', ep: 3, title: 'Tusk & Fury', dur: 32, biomes: [['jungle', 0]],
    panther: DAY_PANTHER, pack: PACK, grade: ['#5aff9a', 0.1], glow: [0.2, '230,255,200'],
    speed: [[0, 'walk'], [4, 'walk'], [5.2, 640], [12, 640], [13, 780], [24, 780], [26, 'run'], [28.5, 'walk'], [30.5, 0], [32, 0]],
    herds: [
      { kind: 'boar', dir: 1, fx0: 1250, dust: 0.4, zig: 70, speed: [[0, 0], [4.2, 0], [5.4, 560], [32, 560]], hd: [[0, 30], [4.2, 30], [4.8, 8]], zShift: [[0, 0], [10.5, 0], [13.5, -1700]],
        members: [{ dfx: 0, z: -20, size: 0.8 }, { dfx: 110, z: 160, size: 0.7 }, { dfx: 200, z: -190, size: 0.72 }] },
      { kind: 'boar', dir: 1, at: [11.5, -950], dust: 0.8, spread: true, speed: [[0, 0], [11.2, 0], [12.2, 860], [19.5, 860], [22, 280], [24, 0], [32, 0]], hd: [[0, 20], [11, 20], [12, 26], [22, 26], [24, 5]],
        snorts: [11.3, 14.6, 17.8, 21.6, 24.8], members: [{ dfx: 0, z: -270, size: 1.65 }] }],
    cam: [{ t: 0, yaw: 60, tilt: 14, zoom: 1.0, y: 0.68, x: 0, d: 1100 }, { t: 4.6, yaw: 82, tilt: 20, zoom: 0.95, y: 0.7, d: 900 },
      { t: 10.8, yaw: 88, tilt: 24, zoom: 0.9, y: 0.72 }, { t: 12.6, yaw: -38, tilt: 12, zoom: 0.82, y: 0.6, x: 0, d: 1000 },
      { t: 17.2, yaw: -30, tilt: 10, zoom: 0.8, y: 0.6 }, { t: 19.4, yaw: 8, tilt: 10, zoom: 0.68, y: 0.62, x: 0.14, d: 1600 },
      { t: 23.5, yaw: -55, tilt: 38, zoom: 0.78, y: 0.66, x: 0, d: 1100 }, { t: 28, yaw: 30, tilt: 12, zoom: 1.1, y: 0.64 }, { t: 32, yaw: 25, tilt: 10, zoom: 1.15 }],
    slow: [[17.4, 19.0, 0.35]], shake: [[0, 0], [5, 0.8], [12, 1.2], [23, 1.2], [26, 0]], drums: [[4.8, 11, 100], [11.3, 24.5, 128]], roars: [] },
  { file: 'panthera-4-stampede.html', ep: 4, title: 'Stampede', dur: 32, biomes: [['savanna', 0]],
    panther: DAY_PANTHER, pack: PACK, grade: ['#ff5a2a', 0.22], glow: [0.7, '255,150,90'],
    speed: [[0, 'walk'], [6, 'walk'], [7.2, 740], [22, 740], [24, 'run'], [26.5, 'walk'], [28.5, 0], [32, 0]],
    herds: [{ kind: 'buffalo', dir: 1, at: [7, -1700], dust: 1.0, zig: 30, spread: true, speed: [[0, 900], [32, 900]], hd: [[0, 22]], snorts: [9.5, 13, 16.5, 20],
      members: [{ dfx: 0, z: -560 }, { dfx: -180, z: 520 }, { dfx: -320, z: -760, size: 1.08 }, { dfx: -420, z: 700 }, { dfx: -600, z: -470, size: 0.95 },
        { dfx: -700, z: 380 }, { dfx: -860, z: -900 }, { dfx: -980, z: 880, size: 1.05 }, { dfx: -1150, z: -620 }, { dfx: -1260, z: 560 }, { dfx: -1420, z: 300, size: 0.95 }, { dfx: -1560, z: -360 }] }],
    cam: [{ t: 0, yaw: 70, tilt: 30, zoom: 0.85, y: 0.7, x: 0, d: 1100 }, { t: 5.2, yaw: 55, tilt: 16, zoom: 0.9, y: 0.68 },
      { t: 7.2, yaw: -50, tilt: 8, zoom: 0.8, y: 0.6, x: 0, d: 1000 }, { t: 13.2, yaw: -42, tilt: 9, zoom: 0.78, y: 0.6 },
      { t: 15.0, yaw: 90, tilt: 64, zoom: 0.46, y: 0.56, x: 0, d: 1300 }, { t: 19.0, yaw: 85, tilt: 58, zoom: 0.5 },
      { t: 21, yaw: 8, tilt: 10, zoom: 0.66, y: 0.64, x: -0.1, d: 1600 }, { t: 24.5, yaw: 88, tilt: 28, zoom: 0.85, y: 0.7, x: 0, d: 1000 },
      { t: 28.5, yaw: 35, tilt: 12, zoom: 1.05, y: 0.64 }, { t: 32, yaw: 28, tilt: 10, zoom: 1.12 }],
    slow: [[16.9, 18.6, 0.35]], shake: [[0, 0.3], [6, 0.8], [8, 1.4], [22, 1.4], [26, 0.2]], drums: [[6.5, 24, 120]], roars: [],
    haze: [[0, 0], [9, 0.15], [15, 0.55], [24, 0.45], [32, 0.15]] },
  { file: 'panthera-5-rhino-rage.html', ep: 5, title: 'Rhino Rage', dur: 32, biomes: [['desert', 0]],
    panther: DAY_PANTHER, pack: PACK, grade: ['#ff7a3c', 0.16], glow: [0.75, '255,220,170'],
    speed: [[0, 'walk'], [7, 'walk'], [8.2, 720], [21, 720], [23, 'run'], [25.5, 'walk'], [27.5, 0], [32, 0]],
    herds: [
      { kind: 'rhino', dir: 1, fx0: 520, dust: 0.9, spread: true, speed: [[0, 0], [7.4, 0], [8.6, 760], [18, 760], [20, 300], [22, 0], [32, 0]], hd: [[0, 30], [7.2, 30], [7.8, 22], [21, 22], [23, 10]],
        zShift: [[0, 0], [8, 0], [11, 170]], snorts: [7.2, 9.2, 13, 16.6, 21.2, 23.4], members: [{ dfx: 0, z: -420, size: 1.0 }] },
      { kind: 'rhino', dir: 1, fx0: 660, speed: [[0, 0], [32, 0]], hd: [[0, 30]], members: [{ dfx: 0, z: -560, size: 0.55 }] }],
    cam: [{ t: 0, yaw: 15, tilt: 8, zoom: 0.85, y: 0.64, x: -0.1, d: 1500 }, { t: 6.8, yaw: 22, tilt: 9, zoom: 1.0, y: 0.64, x: -0.05 },
      { t: 8.6, yaw: -45, tilt: 10, zoom: 0.82, y: 0.6, x: 0, d: 1000 }, { t: 12.6, yaw: -40, tilt: 10, zoom: 0.8 },
      { t: 14.0, yaw: 5, tilt: 9, zoom: 0.62, y: 0.62, x: 0.2, d: 1700 }, { t: 17.8, yaw: 0, tilt: 9, zoom: 0.66 },
      { t: 20.2, yaw: -60, tilt: 40, zoom: 0.72, y: 0.64, x: 0, d: 1100 }, { t: 26, yaw: 40, tilt: 12, zoom: 1.05, y: 0.64 }, { t: 32, yaw: 30, tilt: 10, zoom: 1.12 }],
    slow: [[16.0, 17.6, 0.35]], shake: [[0, 0], [7.5, 1], [20, 1.1], [23, 0]], drums: [[7.6, 21, 124]], roars: [26.4] },
];
module.exports = { build, DAY_PANTHER, PACK };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  build({ series: 'PANTHERA', ...cfg }, path.join(outDir, file));
});
