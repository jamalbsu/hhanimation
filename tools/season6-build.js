// node season6-build.js <panther-pack-clash-lake.html> <outDir> [only]
// PANTHERA Season 6 — THE STARCOMPASS, episodes 31-35. The star left the pack a glowing feather that points to whoever
// needs help. Every episode: a hook in the first second, someone passed, someone met and helped, a gift traded, a twist,
// a payoff, and the compass swinging toward the next place.
const fs = require('fs'), path = require('path');
const { saga } = require('./saga-build.js');
const { BIOME_ADD } = require('./disaster-build.js');
const { DAY_PANTHER, PACK } = require('./hunt-build.js');
const [src, outDir, only] = process.argv.slice(2);
const chunk = n => fs.readFileSync(path.join(__dirname, n), 'utf8');

function season6(cfg, file) {
  let s = saga(cfg, null);
  const count = a => s.split(a).length - 1;
  const R = (a, b) => { const c = count(a); if (c !== 1) throw new Error(`R: ${c} matches for ${JSON.stringify(a.slice(0, 90))}`); s = s.split(a).join(b); };
  R('function drawPop(t) {', chunk('season6.txt') + '\n' + chunk('real.txt') + '\n' + chunk('sound2.txt') + '\nfunction drawPop(t) {');
  // sound 2: the adaptive score, ambience beds, voices and the bigger effects
  R("    case 'say': saySnd(a, e.f, e.v); break;", `    case 'say': saySnd(a, e.f, e.v); break;
    case 'n2': n2Snd(a, e); break;
    case 'duck': { const g = musBus().gain; g.setValueAtTime(1, a); g.linearRampToValueAtTime(0.4, a + 0.04); g.linearRampToValueAtTime(1, a + 0.9); break; }
    case 'bed': bedSnd(a, e); break;
    case 'voice': voiceSnd(a, e); break;
    case 'pass': passSnd(a, e); break;
    case 'roar2': roar2Snd(a); break;
    case 'gullcry': gullSnd(a, e.pan); break;`);
  R('  sagaBefore(t);', '  sagaBefore(t);\n  s6Before(t);\n  realDOF();');
  R('  sagaAfter(t);', '  sagaAfter(t);\n  s6After(t);\n  realAir(t);');
  // the realism layer: soft background, air between the camera and far animals, bloom and a film-style grade
  R('  drawCine();\n  drawPop(t);', '  realPost();\n  drawCine();\n  drawPop(t);');
  R('function litStyle(c, n, f) {', 'var REAL_FOG = 0, FOGC = [200, 200, 200];\nfunction litStyle(c, n, f) {\n  if (REAL_FOG > 0) c = mixc(c, FOGC, REAL_FOG);          // far animals take on the colour of the air');
  R('      FA = h.dir; setGroundTransform(ctx); beastShadow(sp, st.lift); drawBeast(sp, st);', '      if (RL && RL.fog > 0) { REAL_FOG = RL.fog * clamp((Math.hypot(e.fx, e.z) - 1200) / 5200); FOGC = PAL.c.haze || PAL.c.dust; }\n      FA = h.dir; setGroundTransform(ctx); beastShadow(sp, st.lift); drawBeast(sp, st); REAL_FOG = 0;');
  R('  drawHUD();', '  drawHUD();\n  drawCompass();');
  // speech can come from a place in the world, from the friend riding on the panther's back, or from the sky
  R('function sayAnchor(g) { if (g.me)', `function sayAnchor(g) {
  if (g.pt) { const f = worldD(g.pt[0], g.pt[1]) - SD, z = g.pt[2]; return hzVis(f, z) ? P3s(f, g.pt[3] || 120, z) : null; }
  if (g.back) return hzVis(-10, 0) ? P3s(-10, 250, 0) : null;
  if (g.scr) return [W * g.scr[0], H * g.scr[1]];
  if (g.me)`);
  R('function HZ_NOTREE(f, z) {', 'function HZ_NOTREE(f, z) {\n  if (CFG.ocean && z < CFG.ocean.z + 260) return true;\n  if (GORGE && Math.abs(SD + f - GORGE.D - GORGE.w / 2) < GORGE.w / 2 + 260) return true;');
  // the ocean wave: blue water and white foam instead of the muddy flood
  R("hzFill(hzBand(-14000, fx0 - 60, -6000, 6000, 30), '#6e5434');", "hzFill(hzBand(-14000, fx0 - 60, -6000, 6000, 30), CFG.wall.ocean ? '#2f8fb0' : '#6e5434');");
  R("else if (it.l === 2) hzPuff(p[0], p[1], r, 'rgba(186,150,102,1)', 'rgba(156,120,78,0.95)', 'rgba(130,98,60,0)');", "else if (it.l === 2) { if (CFG.wall.ocean) hzPuff(p[0], p[1], r, 'rgba(140,220,236,1)', 'rgba(80,180,210,0.95)', 'rgba(50,140,180,0)'); else hzPuff(p[0], p[1], r, 'rgba(186,150,102,1)', 'rgba(156,120,78,0.95)', 'rgba(130,98,60,0)'); }");
  R("else hzPuff(p[0], p[1], r, 'rgba(150,112,66,1)', 'rgba(122,88,50,0.97)', 'rgba(100,72,40,0)');", "else if (CFG.wall.ocean) hzPuff(p[0], p[1], r, 'rgba(50,150,190,1)', 'rgba(32,118,160,0.97)', 'rgba(20,90,130,0)'); else hzPuff(p[0], p[1], r, 'rgba(150,112,66,1)', 'rgba(122,88,50,0.97)', 'rgba(100,72,40,0)');");
  // the oryx: a desert antelope, white with a dark side stripe
  R('Object.assign(BEASTS, NEW_BEASTS);', `Object.assign(NEW_BEASTS, { oryx: { L: 86, H: 33, W: 25, legU: 62, legD: 66, legR: [9, 4.6], neck: [60, 48, 14, 10], head: [52, 13, 10, 38], horns: 'lyre', tail: 26, stride: 360, earL: 16,
  body: '#ebe4d6', back: '#d6cdbc', belly: '#f8f4ec', leg: '#dcd4c6', dark: '#24201c', horn: '#2a2420', stripe: '#3a3430' } });
Object.assign(BEASTS, NEW_BEASTS);`);
  // cleaner water: a soft wake under each wader instead of a hard white-outlined ring
  R("ctx.fillStyle = water ? col(rgbOf(water), 0.75) : 'rgba(110,84,52,0.8)'; fillPoly(ctx, hzRing(p.f, p.z, 95 * p.k, 55 * p.k));\n    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, 2.4 * sc); ctx.stroke();",
    "ctx.fillStyle = 'rgba(255,255,255,0.16)'; fillPoly(ctx, hzRing(p.f, p.z, 105 * p.k, 60 * p.k));\n    ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = Math.max(1, 1.3 * sc); ctx.stroke();");
  // flamingos: capped in size so none fills the screen, slim black wing tips instead of dots
  R('const p = P3s(f, hg, z), s = 26 * b.s * hzK(f, hg, z); if (s < 0.8) continue;', 'const p = P3s(f, hg, z), s = Math.min(S * 0.02, 26 * b.s * hzK(f, hg, z)); if (s < 0.8) continue;');
  R('ctx.arc(sg * s * 1.75, -s * 1.2 * fl, s * 0.22, 0, TAU); ctx.fill();', 'ctx.moveTo(sg * s * 1.9, -s * 1.3 * fl); ctx.lineTo(sg * s * 1.3, -s * 0.85 * fl); ctx.lineTo(sg * s * 1.45, -s * 0.75 * fl); ctx.closePath(); ctx.fill();');
  R('return a.filter(b => Math.abs(b.z) > 330);', 'return a.filter(b => Math.abs(b.z) > 900);');
  if (!file) return s;
  fs.writeFileSync(file, s);
  console.log('wrote', file, s.length);
}

const BIO = { ...BIOME_ADD,
  dusk: { base: 'savanna', sky: ['#3b2f6e', '#c96a98', '#ffb27a'], haze: '255,170,150', hazeA: 0.5, keep: 0.4 },
  beach: { base: 'desert', sky: ['#3a8ad8', '#8cd0f0', '#f4ead0'], ground: ['#f2dcaa', '#e8cc92', '#dcbc7e', '#c8a468'], trail: ['236,216,170', '222,198,150'], haze: '240,240,230', hazeA: 0.4,
    tree: 'round', crowns: ['#2e7a3a', '#3a8c44', '#4ea052'], trunk: '#7a5a38', keep: 0.18, farKeep: 0, dust: '240,224,190', amb: { wind: 0.5, birds: 0.3 } },
  dustland: { base: 'desert', sky: ['#6e3e22', '#d9844a', '#f2c27a'], haze: '236,160,100', hazeA: 0.68, keep: 0.3, dust: '220,160,110', amb: { wind: 1 } },
  jungleDay: { base: 'jungle', rain: 0, petals: 0.55, petalCol: '110,170,60', haze: '200,235,190', hazeA: 0.5, amb: { birds: 1, insects: 1 } },
  moonplain: { base: 'night', stars: 1, ff: 0.4, orb: { x: 0.08, y: 0.32, r: 0.16, col: '#f6f3e6', halo: '220,230,255', ha: 0.85, moon: 1 }, tree: 'acacia', keep: 0.35, farKeep: 0.3,
    crowns: ['#122018', '#1a2a20', '#22362a'], amb: { crick: 1 } },
};
const NIGHT_PANTHER = { fur: ['#2a2d38', '#14161e', '#050608'], far: '#07080c', rim: 'rgb(200,212,255)', lt: '200,212,255' };
const EPIC = (seed, root, bpm, extra) => ({ seed, bpm, root, minor: true, prog: 'epic', lead: 'brass', arp: 'harp', pad: 'strings', epic: true, vol: 0.95, ...extra });
const base = { pack: PACK, biomeAdd: BIO, endCard: 2.2, depth: true, real: true, sound2: true, farView: 11500, drums: [], roars: [], panther: DAY_PANTHER };
const cloud = (t, text, bg, size = 0.13, y = 0.3) => ({ t, text, size, y, shape: 'cloud', bg, fg: '#ffffff' });
const GOLD = '#ffd76a', SEA = '#5ce1e6', SAND = '#ffb46e', LEAF = '#7dff9a', MOON = '#e8ecff';

const EPISODES = [
  // 31 — the otter. Hook: hippos head-on. Pass: flamingos. Help: an otter on a drifting log. Gift: a lucky pebble. Twist: the hippos chase. Payoff: the secret shallow.
  { file: 'panthera-31-hippo-highway.html', ep: 31, title: 'Hippo Highway', dur: 28, biomes: [['savanna', 0]], next: 'NEXT: TIDAL WAVE BEACH',
    grade: ['#ffa040', 0.12], glow: [0.4, '255,200,140'], rays: { x: 0.7, y: 0.03, col: '255,220,170', a: 0.05 }, music: EPIC(31, 57, 120),
    speed: [[0, 740], [0.5, 740], [1.0, 650], [18, 650], [18.7, 790], [28, 790]],
    river: { at: 0.4, w: 11500, col: ['#4f9aa0', '#3c7c84'], bank: '#8a6e48' },
    herds: [
      { kind: 'hippo', dir: -1, at: [1.7, 320], spray: true, dust: 0, spread: true, speed: [[0, 360], [28, 360]], hd: [[0, 6]], snorts: [0.4, 1.2, 1.9],
        members: [{ dfx: 0, z: -560, size: 1.2 }, { dfx: 180, z: 620, size: 1.3 }, { dfx: 480, z: -900, size: 1.15 }, { dfx: 640, z: 860, size: 1.2 }] },
      { kind: 'hippo', dir: 1, at: [12.6, -440], spray: true, dust: 0, speed: [[0, 0], [10.6, 0], [11.4, 760], [15.6, 760], [17, 0], [28, 0]], hd: [[0, 6]], snorts: [11.3, 12.6, 14.2],
        members: [{ dfx: 0, z: -680, size: 1.15 }, { dfx: -180, z: 700 }] }],
    flamingos: { t0: 3.6, n: 34 },
    logs: [{ at: 6.4, df: 260, z: 360, len: 340, rider: { kind: 'otter', until: 7.4 } }],
    riders: [{ kind: 'otter', from: 7.4, until: 21, size: 15 }],
    shoal: { from: 15.4, at: 15.8, df0: -200, df1: 2600, z0: -260, z1: 260 },
    critters: [{ kind: 'otter', n: 4, at: 15.8, f: [400, 1800], z: [-520, 520], from: 15.6, until: 23, hg: 6, size: 16 }],
    compass: { ang: [[0, 18], [6, 2], [12, -8], [20, -2], [23, -40]], col: [[0, GOLD], [23.5, GOLD], [24.5, SEA]], spin: [[23.6, 25.0]] },
    cam: [{ t: 0, yaw: 86, tilt: 18, zoom: 0.72, y: 0.7, x: 0, d: 1000 }, { t: 1.6, yaw: 90, tilt: 24, zoom: 0.72 }, { t: 2.1, yaw: 90, tilt: 58, zoom: 0.5, y: 0.56, d: 1300 }, { t: 3.4, yaw: 80, tilt: 46, zoom: 0.52 },
      { t: 4.6, yaw: 18, tilt: 12, zoom: 0.62, y: 0.64, x: 0.05, d: 1500 }, { t: 5.4, yaw: 86, tilt: 20, zoom: 0.76, y: 0.7, x: 0, d: 1000 }, { t: 7.0, yaw: 70, tilt: 18, zoom: 0.8, y: 0.68 }, { t: 8.2, yaw: 18, tilt: 10, zoom: 1.0, y: 0.64, x: -0.04, d: 1200 },
      { t: 11, yaw: -42, tilt: 12, zoom: 0.74, y: 0.6, x: 0, d: 1100 }, { t: 15.2, yaw: 72, tilt: 32, zoom: 0.6, y: 0.66, d: 1300 }, { t: 19, yaw: 22, tilt: 10, zoom: 0.92, y: 0.64, d: 1200 },
      { t: 23, yaw: 40, tilt: 14, zoom: 0.95, y: 0.64 }, { t: 28, yaw: 50, tilt: 16, zoom: 0.9 }],
    slow: [[2.1, 2.9, 0.45]], shake: [[0, 1.2], [3.4, 1.2], [4.6, 0.6], [11, 0.9], [11.4, 1.7], [15, 1.4], [16.4, 0.6], [28, 0.6]], flashes: [1.75, 11.35], slashes: [4.4, 18.8],
    says: [{ t0: 6.4, t1: 8.2, pt: [6.4, 260, 360, 70], text: 'HELP! MY LOG|IS DRIFTING!' }, { t0: 8.4, t1: 9.8, me: true, text: 'HOP ON!' },
      { t0: 9.9, t1: 11.2, back: true, text: 'A LUCKY PEBBLE|FOR YOU!', gift: true }, { t0: 16.2, t1: 18, pt: [15.8, 900, 520, 50], text: 'THIS WAY!|OUR SECRET SHALLOW!' },
      { t0: 21.2, t1: 22.8, back: true, text: 'GOODBYE, FRIENDS!' }, { t0: 23.4, t1: 25.4, me: true, text: 'THE COMPASS...|IT POINTS TO THE SEA!' }],
    pops: [{ t: 0.9, text: 'HIPPOS!', size: 0.16, y: 0.72 }, { t: 11.35, text: 'THEY TURNED!', size: 0.15, y: 0.38, boom: true }, cloud(19.2, 'THANK YOU, OTTERS!', '#5ce1e6', 0.1)],
    tags: [{ t0: 1.0, t1: 1.9, herd: 0, m: 0, label: 'HIPPOS ×4', sub: '1.5 TONS · HEAD-ON' }],
    lines: [[0, 0.5], [1.7, 1], [3.4, 1], [4.4, 0.25], [11, 0.25], [11.4, 0.9], [15, 0.9], [16, 0.25], [28, 0.25]], tone: [[0, 0.4], [1.7, 1], [3.2, 1], [4.2, 0.35], [11.2, 0.35], [11.5, 1], [12.5, 0.35]] },

  // 32 — the turtles. Hook: a giant wave behind the pack. Pass: crabs and gulls. Help: hatchlings racing for the sea. Gift: a shell whistle. Twist: the wave breaks. Payoff: the turtles ride it out.
  { file: 'panthera-32-tidal-wave-beach.html', ep: 32, title: 'Tidal Wave Beach', dur: 28, biomes: [['beach', 0]], next: 'NEXT: DUST DEVIL',
    grade: ['#7fd4ff', 0.12], glow: [0.6, '255,245,220'], rays: { x: 0.3, y: 0.02, col: '255,245,220', a: 0.05 },
    music: { seed: 32, bpm: 122, root: 62, prog: 'hope', lead: 'flute', arp: 'harp', pad: 'strings', epic: true }, whipCol: '120,96,50',
    speed: [[0, 780], [28, 780]],
    ocean: { z: -1000 },
    wall: { type: 'water', ocean: true, fx: [[0, -1300], [5, -1000], [9, -800], [12, -560], [13.5, -400], [15, -620], [19, -950], [23, -1200], [28, -1500]] },
    critters: [
      { kind: 'crab', n: 18, at: 0, f: [300, 6500], z: [-750, 750], size: 13 },
      { kind: 'turtle', n: 14, at: 6.6, f: [80, 700], z: [300, 800], t0: 6.2, vz: 150, size: 11, from: 4.5, until: 17 },
      { kind: 'turtle', n: 1, at: 9.6, f: [380, 380], z: [-880, -880], size: 40, from: 7, until: 15 },
      { kind: 'gull', n: 5, at: 6.6, f: [0, 600], z: [100, 500], dive: [7.8, 9.6], from: 4, until: 11.5, size: 26 },
      { kind: 'gull', n: 4, at: 0, f: [-500, 2500], z: [-1600, -400], size: 22 }],
    compass: { ang: [[0, -30], [8, -10], [16, 10], [22, 50]], col: [[0, SEA], [21, SEA], [22.5, SAND]], spin: [[21.8, 23.2]] },
    cam: [{ t: 0, yaw: -40, tilt: 12, zoom: 0.7, y: 0.6, x: 0, d: 1100 }, { t: 3.6, yaw: 15, tilt: 10, zoom: 0.62, y: 0.62, x: 0.1, d: 1600 }, { t: 6.2, yaw: 50, tilt: 22, zoom: 0.66, y: 0.66, x: 0, d: 1200 },
      { t: 9.4, yaw: 20, tilt: 12, zoom: 0.8, y: 0.64, d: 1300 }, { t: 12.6, yaw: -30, tilt: 28, zoom: 0.56, y: 0.6, d: 1300 }, { t: 14.6, yaw: -28, tilt: 24, zoom: 0.58 },
      { t: 16, yaw: 12, tilt: 9, zoom: 0.62, y: 0.64, x: 0.08, d: 1600 }, { t: 20, yaw: -40, tilt: 10, zoom: 0.78, y: 0.6, x: 0, d: 1100 }, { t: 24, yaw: 25, tilt: 10, zoom: 0.88, y: 0.64, d: 1200 }, { t: 28, yaw: 20, tilt: 10, zoom: 0.85 }],
    slow: [[13.6, 14.6, 0.4]], shake: [[0, 1.1], [12, 1.6], [14.8, 1], [28, 0.8]], flashes: [13.55], slashes: [3.4, 15.8],
    says: [{ t0: 6.8, t1: 8.6, pt: [6.6, 400, 520, 230], text: 'HELP! WE HAVE TO|REACH THE SEA!' }, { t0: 8.7, t1: 10.0, me: true, text: "WE'LL SHIELD YOU!" },
      { t0: 10.4, t1: 12.4, pt: [9.6, 380, -880, 70], text: 'THANK YOU.|TAKE MY SHELL WHISTLE.', gift: true }, { t0: 15.6, t1: 17.4, pt: [6.6, 300, -950, 30], text: 'WHEEE!|WE RIDE THE WAVE!' },
      { t0: 19.6, t1: 21.4, me: true, text: 'THE WHISTLE...|IT HUMS!' }, { t0: 22.6, t1: 24.4, me: true, text: 'THE COMPASS|POINTS TO THE DESERT!' }],
    pops: [{ t: 0.9, text: 'BIG WAVE!', size: 0.16, y: 0.72, boom: true }, { t: 8.6, text: 'SHOO, GULLS!', size: 0.13, y: 0.3, bg: '#14e0ff' }, { t: 13.55, text: 'SPLAAASH!', size: 0.17, y: 0.38, boom: true }],
    tags: [{ t0: 4.4, t1: 6.2, wall: true, label: 'GIANT WAVE', sub: 'ROLLING IN FAST' }],
    lines: [[0, 0.5], [12.8, 0.5], [13.5, 1], [14.8, 1], [15.6, 0.4], [28, 0.35]], tone: [[0, 0.35], [13.2, 0.35], [13.6, 1], [14.6, 1], [15.4, 0.35]], toneCol: '#5ce1e6' },

  // 33 — the meerkats. Hook: a dust devil tears across the desert. Pass: oryx and tumbleweeds. Help: the lookout's pups. Gift: her lookout eyes. Twist: the twister splits. Payoff: the burrow.
  { file: 'panthera-33-dust-devil.html', ep: 33, title: 'Dust Devil', dur: 28, biomes: [['dustland', 0]], next: 'NEXT: TIGER LAND RETURNS',
    grade: ['#ff7a2a', 0.2], glow: [0.5, '255,180,110'], music: EPIC(33, 55, 126), whipCol: '96,60,30',
    speed: [[0, 800], [11.6, 800], [12.3, 910], [16, 910], [17, 800], [28, 800]],
    twisters: [{ fx: [[0, -720], [6, -680], [10, -640], [11.9, -600], [16, -900], [28, -1500]], z: [[0, -40], [10, 0], [11.9, -300], [16, -1000], [28, -1100]], h: 1800 },
      { from: 11.9, fx: [[11.9, -640], [14, -520], [18, -820], [28, -1400]], z: [[11.9, -350], [13.5, 300], [16, 950], [28, 1100]], h: 1450 }],
    herds: [{ kind: 'oryx', dir: 1, fx0: 260, dust: 0.8, zig: 60, speed: [[0, 820], [11.6, 820], [12.3, 930], [28, 930]], hd: [[0, 0]], leaps: [[6.2, 0.8, 80], [14.4, 0.85, 90]],
      members: [{ dfx: 0, z: 600 }, { dfx: 150, z: 780 }, { dfx: 300, z: -640, size: 0.95 }, { dfx: -140, z: 880, size: 1.05 }] }],
    critters: [{ kind: 'tumbleweed', n: 7, at: 0, f: [200, 4000], z: [0, 0], vz: 700, size: 30 },
      { kind: 'meerkat', n: 1, at: 5, f: [360, 360], z: [470, 470], from: 0, until: 7.6, size: 32 },
      { kind: 'meerkat', n: 9, at: 19.5, f: [250, 900], z: [380, 900], from: 18.8, size: 26 }],
    riders: [{ kind: 'meerkat', from: 7.6, until: 21.5, size: 11 }, { kind: 'meerkat', from: 7.6, until: 21.5, cat: 0, size: 9, i: 1 }, { kind: 'meerkat', from: 7.6, until: 21.5, cat: 1, size: 9, i: 2 }, { kind: 'meerkat', from: 7.6, until: 21.5, cat: 2, size: 9, i: 3 }],
    compass: { ang: [[0, 40], [10, 20], [18, -10], [23, -70]], col: [[0, SAND], [23, SAND], [24.4, LEAF]], spin: [[23.2, 24.6]] },
    cam: [{ t: 0, yaw: -45, tilt: 10, zoom: 0.5, y: 0.7, x: 0.2, d: 1300 }, { t: 2.0, yaw: -42, tilt: 10, zoom: 0.52, y: 0.7, x: 0.18 }, { t: 3.0, yaw: 15, tilt: 10, zoom: 0.56, y: 0.64, x: 0.12, d: 1700 }, { t: 3.8, yaw: 86, tilt: 18, zoom: 0.76, y: 0.7, x: 0, d: 1000 }, { t: 6.4, yaw: 70, tilt: 18, zoom: 0.8, y: 0.68 },
      { t: 8, yaw: 20, tilt: 10, zoom: 0.95, y: 0.64, x: -0.04, d: 1250 }, { t: 11.2, yaw: -35, tilt: 26, zoom: 0.48, y: 0.62, x: 0, d: 1400 }, { t: 15.6, yaw: -30, tilt: 22, zoom: 0.5 },
      { t: 17.4, yaw: 20, tilt: 10, zoom: 0.8, y: 0.64, d: 1300 }, { t: 21, yaw: 55, tilt: 20, zoom: 0.78, y: 0.66 }, { t: 28, yaw: 40, tilt: 14, zoom: 0.85, y: 0.64 }],
    slow: [[12.1, 13.1, 0.4]], shake: [[0, 1.2], [11.6, 1.8], [15.8, 1.6], [17.5, 0.9], [28, 0.7]], flashes: [11.95], slashes: [3.2, 17.2],
    haze: [[0, 0.45], [12, 0.6], [20, 0.35], [28, 0.25]], sand: [[0, 0.7], [17, 0.7], [20, 0.25], [28, 0.2]],
    says: [{ t0: 4.4, t1: 6.6, pt: [5, 360, 470, 95], text: 'TWISTER! TAKE MY PUPS|AND LISTEN FOR MY CALLS!' }, { t0: 6.8, t1: 8.2, me: true, text: 'ALL ABOARD!' },
      { t0: 9.0, t1: 10.6, back: true, text: 'LEFT! NOW RIGHT!' }, { t0: 13.6, t1: 15.2, back: true, text: 'DOWN THE MIDDLE!' },
      { t0: 19.8, t1: 21.8, pt: [19.5, 500, 600, 70], text: "WELCOME HOME!|YOU'RE ONE OF US NOW.", gift: true }, { t0: 23.4, t1: 25.2, me: true, text: 'IT GLOWS GREEN...|THE JUNGLE!' }],
    pops: [{ t: 0.9, text: 'DUST DEVIL!', size: 0.15, y: 0.72, boom: true }, { t: 11.95, text: 'IT SPLIT IN TWO!', size: 0.12, y: 0.38, boom: true }, cloud(18.6, 'MADE IT!', '#ffb46e')],
    tags: [{ t0: 1.6, t1: 3.2, herd: 0, m: 0, label: 'ORYX', sub: 'RUNNING FROM THE STORM' }],
    lines: [[0, 0.5], [11.6, 0.5], [12, 1], [15.6, 1], [16.6, 0.4], [28, 0.3]], tone: [[0, 0.4], [11.7, 0.4], [12, 1], [13.2, 1], [14, 0.4]] },

  // 34 — Raja. Hook: boars charge head-on in the mist. Pass: monkeys. Meet: Raja, who blocks the way. Trade: a word, then a race. Twist: the bridge snaps. Payoff: his roar, given to them.
  { file: 'panthera-34-tiger-land-returns.html', ep: 34, title: 'Tiger Land Returns', dur: 28, biomes: [['jungleDay', 0]], next: 'NEXT: THE MOON RACE',
    grade: ['#5aff9a', 0.08], glow: [0.3, '230,255,200'], rays: { x: 0.6, y: 0.0, col: '220,255,200', a: 0.08 }, music: EPIC(34, 52, 124), whipCol: '20,48,20',
    speed: [[0, 790], [28, 790]],
    friends: [{ coat: 'bengalTiger', marks: 'stripes', size: 1.14, at: [7.6, 230], z: [[0, -40], [7.6, -40], [9.4, -430]], speed: [[0, 0], [7.7, 0], [8.5, 800], [28, 800]] }],
    herds: [
      { kind: 'boar', dir: -1, at: [2.4, 380], dust: 0.6, zig: 30, spread: true, speed: [[0, 760], [28, 760]], hd: [[0, 18]],
        members: [{ dfx: 0, z: -470 }, { dfx: 120, z: 500, size: 1.1 }, { dfx: 300, z: -700 }, { dfx: 380, z: 720, size: 0.9 }, { dfx: 560, z: -520, size: 1.05 }, { dfx: 680, z: 880 }, { dfx: 860, z: -900 }, { dfx: 960, z: 560 }] },
      { kind: 'boar', dir: -1, at: [18.6, 700], dust: 0.6, zig: 20, spread: true, speed: [[0, 760], [17.9, 760], [18.6, 0], [28, 0]], hd: [[0, 18], [18, 18], [18.6, -6]],
        members: [{ dfx: 0, z: -480, size: 1.15 }, { dfx: 160, z: 520 }, { dfx: 320, z: -760 }, { dfx: 440, z: 800, size: 1.05 }, { dfx: 640, z: -540 }] }],
    gorge: { at: 13.0, w: 700, snap: 14.7 },
    monkeys: { from: 3.6, until: 11.5, n: 6, fruit: true },
    shocks: [{ t: 18.0, friend: 0 }],
    compass: { ang: [[0, -20], [10, 10], [20, 0], [23, 70]], col: [[0, LEAF], [23, LEAF], [24.4, MOON]], spin: [[23.2, 24.6]] },
    cam: [{ t: 0, yaw: 88, tilt: 18, zoom: 0.74, y: 0.7, x: 0, d: 1000 }, { t: 2.2, yaw: 90, tilt: 24, zoom: 0.72 }, { t: 2.7, yaw: 90, tilt: 60, zoom: 0.48, y: 0.56, d: 1300 }, { t: 4.2, yaw: 82, tilt: 46, zoom: 0.52 },
      { t: 5.4, yaw: 20, tilt: 10, zoom: 0.8, y: 0.64, d: 1300 }, { t: 6.8, yaw: 85, tilt: 16, zoom: 0.8, y: 0.7, x: 0, d: 1000 }, { t: 9.2, yaw: 20, tilt: 10, zoom: 0.9, y: 0.64, x: -0.04, d: 1250 },
      { t: 12.4, yaw: 70, tilt: 34, zoom: 0.6, y: 0.66, x: 0, d: 1300 }, { t: 15.2, yaw: -40, tilt: 16, zoom: 0.7, y: 0.6, d: 1100 }, { t: 17.2, yaw: 84, tilt: 18, zoom: 0.74, y: 0.7, d: 1000 },
      { t: 19.4, yaw: 22, tilt: 10, zoom: 0.92, y: 0.64, d: 1200 }, { t: 23, yaw: 50, tilt: 16, zoom: 0.88, y: 0.66 }, { t: 28, yaw: 40, tilt: 14, zoom: 0.88 }],
    slow: [[2.8, 3.6, 0.45], [14.8, 15.8, 0.45]], shake: [[0, 1], [2.4, 1.8], [4.2, 1.6], [5, 0.7], [14.6, 1.6], [16, 0.8], [18, 2], [19, 0.6], [28, 0.6]], flashes: [2.45, 14.7, 18.0], slashes: [5.2, 19.2],
    says: [{ t0: 7.7, t1: 9.3, friend: 0, text: 'FRIEND...|OR RIVAL?' }, { t0: 9.4, t1: 10.9, me: true, text: 'FRIEND!|RACE YOU!' }, { t0: 16.4, t1: 17.8, me: true, text: 'MORE BOARS!' },
      { t0: 19.6, t1: 21.4, friend: 0, text: 'TAKE MY ROAR.|YOU WILL NEED IT.', gift: true }, { t0: 22.8, t1: 24.8, friend: 0, text: 'BEWARE...|THE MOON IS FALLING.' }],
    pops: [{ t: 0.9, text: 'BOARS!', size: 0.16, y: 0.72 }, { t: 14.7, text: 'THE BRIDGE!', size: 0.15, y: 0.38, boom: true }, { t: 18.05, text: 'ROAAAR!', size: 0.19, y: 0.4 }],
    tags: [{ t0: 1.2, t1: 2.3, herd: 0, m: 0, label: 'WILD BOARS ×8', sub: 'HEAD-ON IN THE MIST' }, { t0: 5.8, t1: 7.5, friend: 0, label: 'RAJA', sub: 'KING OF TIGER LAND' }],
    lines: [[0, 0.5], [2.4, 1], [4, 1], [5, 0.3], [14.4, 0.3], [14.8, 1], [15.8, 1], [16.4, 0.3], [17.9, 0.3], [18.1, 1], [19, 0.3]],
    tone: [[0, 0.4], [2.4, 1], [3.8, 1], [4.6, 0.35], [14.6, 0.35], [14.8, 1], [15.8, 1], [16.6, 0.35], [17.9, 0.35], [18.1, 1], [18.9, 0.35]] },

  // 35 — the finale. Hook: the moon sinks toward the earth. Everyone met this season runs along. The moon speaks: race me. Twist: a stampede. Payoff: the star relights the moon.
  { file: 'panthera-35-the-moon-race.html', ep: 35, title: 'The Moon Race', dur: 28, biomes: [['moonplain', 0]], next: 'SEASON 7?', endText: 'SEASON FINALE',
    panther: NIGHT_PANTHER, grade: ['#8a9aff', 0.12], glow: [0.5, '220,230,255'], music: EPIC(35, 60, 116, { minor: false, prog: 'hope' }), whipCol: '10,16,30',
    speed: [[0, 800], [19, 800], [19.6, 900], [28, 900]],
    friends: [{ coat: 'bengalTiger', marks: 'stripes', size: 1.14, at: [0, -120], z: -440, speed: [[0, 800], [19, 800], [19.6, 900], [28, 900]] }],
    riders: [{ kind: 'otter', from: 0, size: 14 }, { kind: 'meerkat', from: 0, cat: 0, size: 9, i: 1 }],
    river: { at: 11.5, w: 1700, col: ['#3c5c8c', '#2c4670'], bank: '#4a4a5c' },
    critters: [{ kind: 'meerkat', n: 6, at: 4.5, f: [200, 700], z: [520, 900], from: 3.4, until: 8, size: 26 },
      { kind: 'turtle', n: 6, at: 12.2, f: [0, 1400], z: [-700, 700], from: 11, until: 15.5, size: 22 },
      { kind: 'otter', n: 3, at: 12.2, f: [200, 1200], z: [-600, 600], from: 11, until: 15.5, hg: 6, size: 16 }],
    herds: [{ kind: 'wildebeest', dir: -1, at: [18.0, 420], dust: 1.0, zig: 15, spread: true, speed: [[0, 820], [28, 820]], hd: [[0, 20]],
      members: [{ dfx: 0, z: -560 }, { dfx: 120, z: 600 }, { dfx: 320, z: -780 }, { dfx: 420, z: 760 }, { dfx: 620, z: -520 }, { dfx: 720, z: 900 }, { dfx: 920, z: -960 }, { dfx: 1020, z: 560 }] },
      { kind: 'giraffe', dir: 1, at: [7.6, 300], dust: 0.4, speed: [[0, 900], [6.8, 900], [7.8, 800], [19, 800], [19.6, 900], [28, 900]], hd: [[0, 0]], members: [{ dfx: 0, z: -840, size: 1.1 }, { dfx: -260, z: -1060, size: 0.55 }] }],
    star: { fall: 20.4, from: 20.9, release: 22.6, col: [[0, '#ffffff'], [28, '#ffffff']] }, motifs: [22.6],
    shocks: [{ t: 18.4, friend: 0 }],
    aurora: [[0, 0], [22.4, 0], [23.6, 0.7], [28, 0.8]], constel: { t0: 23.0, label: 'THE PANTHERS PACK & FRIENDS' }, hearts: [24.4], sparkle: [[0, 0.3], [22.6, 1.2], [28, 1]],
    compass: { ang: [[0, 0], [10, -6], [20, 4], [25, 0]], col: [[0, MOON], [24, MOON], [25.4, GOLD]], spin: [[24.6, 26]] },
    cam: [{ t: 0, yaw: 20, tilt: 6, zoom: 0.62, y: 0.74, x: 0.06, d: 1500 }, { t: 3.8, yaw: 50, tilt: 14, zoom: 0.72, y: 0.68, x: 0, d: 1200 }, { t: 7.4, yaw: 12, tilt: 8, zoom: 0.6, y: 0.7, x: 0.08, d: 1600 },
      { t: 11.4, yaw: 62, tilt: 26, zoom: 0.66, y: 0.66, x: 0, d: 1200 }, { t: 15.6, yaw: 86, tilt: 18, zoom: 0.76, y: 0.7, d: 1000 }, { t: 18.0, yaw: 90, tilt: 22, zoom: 0.74 },
      { t: 18.6, yaw: 90, tilt: 58, zoom: 0.48, y: 0.56, d: 1300 }, { t: 20.2, yaw: 24, tilt: 8, zoom: 0.86, y: 0.66, d: 1200 }, { t: 22.4, yaw: 50, tilt: 4, zoom: 0.56, y: 0.84, x: 0 }, { t: 28, yaw: 62, tilt: 4, zoom: 0.54, y: 0.85 }],
    slow: [[18.7, 19.7, 0.4]], shake: [[0, 0.5], [17.6, 1], [18.4, 2], [20, 0.6], [28, 0.3]], flashes: [18.4], slashes: [11.2, 15.4],
    says: [{ t0: 2.7, t1: 4.0, me: true, text: "THE MOON!|IT'S FALLING!" }, { t0: 4.1, t1: 5.6, scr: [0.55, 0.3], text: 'RACE ME|TO THE MOUNTAIN!' },
      { t0: 5.8, t1: 7.2, back: true, text: 'MY PEBBLE|BRINGS LUCK!' }, { t0: 8.4, t1: 10.2, herd: 1, m: 0, text: 'WE CAME TO HELP!' },
      { t0: 12.2, t1: 14.0, pt: [12.2, 700, -500, 30], text: "HOP ACROSS -|WE'VE GOT YOU!" }, { t0: 16.2, t1: 17.8, friend: 0, text: 'NOW... THE ROAR!' },
      { t0: 21.0, t1: 22.6, me: true, text: 'LIGHT THE MOON,|LITTLE STAR!', gift: true }],
    pops: [{ t: 18.4, text: 'ROAAAR!', size: 0.19, y: 0.4, boom: true }, cloud(20.6, 'THE STAR CAME BACK!', '#b388ff', 0.1, 0.32)],
    tags: [{ t0: 15.8, t1: 17.6, herd: 0, m: 0, label: 'STAMPEDE', sub: 'ACROSS THE MOONLIT PLAIN' }],
    lines: [[0, 0.3], [18.2, 0.3], [18.5, 1], [19.8, 1], [20.6, 0.2]], tone: [[0, 0.25], [18.2, 0.25], [18.5, 1], [19.6, 1], [20.4, 0.25]], toneCol: '#9fd8ff', accent: ['#ffe27a', '#b388ff', '#7ae8ff'] },
];
module.exports = { season6 };
if (require.main === module) EPISODES.forEach(ep => {
  if (only && !ep.file.includes(only)) return;
  const { file, ...cfg } = ep;
  season6({ ...base, ...cfg }, path.join(outDir, file));
});
