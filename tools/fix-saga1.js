const fs = require('fs');
let t = fs.readFileSync(__dirname + '/saga.txt', 'utf8'), s = fs.readFileSync(__dirname + '/saga-build.js', 'utf8');
const T = (a, b) => { if (t.split(a).length !== 2) throw new Error('saga.txt: ' + a); t = t.replace(a, b); };
const S = (a, b) => { if (s.split(a).length !== 2) throw new Error('build: ' + a); s = s.replace(a, b); };
// the sky effects go on top of the night, so the dark does not dim them
T('function sagaSky(t) { ctx.setTransform(1, 0, 0, 1, 0, 0); drawAurora(t); drawConstellation(t); }', 'function sagaSky(t) {}\nfunction sagaTop(t) { ctx.setTransform(1, 0, 0, 1, 0, 0); drawAurora(t); drawConstellation(t); }');
T("g.addColorStop(0.25, `rgba(${cc},${0.13 * k})`);", "g.addColorStop(0.25, `rgba(${cc},${0.2 * k})`);");
{ const NL = String.fromCharCode(10), anchor = "  R('  joySky(t);'", i = s.indexOf(anchor); if (i < 0) throw new Error('hook anchor');
  s = s.slice(0, i) + "  R('  drawStorm(t);', '  drawStorm(t);' + String.fromCharCode(10) + '  sagaTop(t);');" + NL + s.slice(i); }
// ep 26: gentler rays
S("rays: { x: 0.25, y: 0.03, col: '255,190,140', a: 0.07 }", "rays: { x: 0.25, y: 0.03, col: '255,190,140', a: 0.045 }");
// ep 29: taller, closer giraffes; the mother herd runs right beside the pack
S("members: [{ dfx: 0, z: -540 }, { dfx: 160, z: 600, size: 1.05 }, { dfx: 420, z: -860 }, { dfx: 560, z: 880, size: 0.95 }, { dfx: 840, z: -560, size: 1.08 }, { dfx: 980, z: 1100 }, { dfx: 1300, z: -1000 }, { dfx: 1500, z: 620 }] },",
  "members: [{ dfx: 0, z: -470, size: 1.3 }, { dfx: 160, z: 500, size: 1.35 }, { dfx: 420, z: -640, size: 1.25 }, { dfx: 560, z: 660, size: 1.2 }, { dfx: 840, z: -500, size: 1.35 }, { dfx: 980, z: 900, size: 1.25 }, { dfx: 1300, z: -860, size: 1.3 }, { dfx: 1500, z: 540, size: 1.25 }] },");
S("{ kind: 'giraffe', dir: 1, at: [19.6, 520], dust: 0.4, zig: 20, speed: [[0, 600], [19.4, 600], [20.4, 800], [28, 800]], hd: [[0, 0]], members: [{ dfx: 0, z: 640, size: 1.05 }, { dfx: 240, z: 900 }, { dfx: -200, z: 1000, size: 0.95 }] }],",
  "{ kind: 'giraffe', dir: 1, at: [19.6, 160], dust: 0.4, zig: 20, speed: [[0, 600], [19.4, 600], [20.4, 800], [28, 800]], hd: [[0, 0]], members: [{ dfx: 0, z: -620, size: 1.25 }, { dfx: 260, z: -900, size: 1.15 }, { dfx: -240, z: -780, size: 1.1 }] }],");
S("{ t: 17.4, yaw: 84, tilt: 18, zoom: 0.7, y: 0.7, d: 1000 }, { t: 20.2, yaw: 20, tilt: 10, zoom: 0.6, y: 0.68, x: 0.05, d: 1500 },", "{ t: 17.4, yaw: 84, tilt: 18, zoom: 0.7, y: 0.7, d: 1000 }, { t: 20.2, yaw: 18, tilt: 9, zoom: 0.52, y: 0.74, x: 0, d: 1600 },");
// ep 30: a true night on the summit
S("slow: [], shake: [[0, 0.5], [17.4, 0.5], [17.6, 1.6], [18.6, 0.3], [28, 0.2]], flashes: [17.55], slashes: [],", "slow: [], shake: [[0, 0.5], [17.4, 0.5], [17.6, 1.6], [18.6, 0.3], [28, 0.2]], flashes: [17.55], slashes: [], dark: [[0, 0.52], [28, 0.56]], haze: [[0, 0]],");
S("haze: '90,110,170', hazeA: 0.5,\n    vig:", "haze: '60,80,150', hazeA: 0.25,\n    vig:");
fs.writeFileSync(__dirname + '/saga.txt', t); fs.writeFileSync(__dirname + '/saga-build.js', s); console.log('fixed');
