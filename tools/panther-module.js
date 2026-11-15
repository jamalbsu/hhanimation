// The panther lives in its own file (panther/panther-rig.js in the project). It is cut into named sections;
// each section replaces the same span of a built page, found by its start and end markers.
const fs = require('fs');
const SECTIONS = [
  ['gait', '// ---- gait ---', '// ---- curve helpers'],
  ['curves', '// ---- curve helpers', '// ---- the story: set by CFG'],
  ['motion', '// ---- gallop ---', '// ---- sound events, found by scanning'],
  ['pose-and-shapes', 'function poseSide(tl) {', '// ---- scene layout'],
  ['compositing', '// ---- panther compositing', '// ---- the turn: a real 3D'],
  ['projection', '// ---- the turn: a real 3D', '// ---- the chase view'],
  ['coats', 'const COATS = {', 'let COAT = COATS.panther'],
  ['drawing', '// markings sit on the 3D body surface', '// ---- foreground & atmosphere'],
];
const OPEN = n => `//#region panther:${n}\n`, CLOSE = n => `//#endregion panther:${n}\n`;
function span(s, a, b) { const i = s.indexOf(a), j = s.indexOf(b, i + 1); if (i < 0 || j < 0 || s.indexOf(a, i + 1) >= 0) throw new Error('panther section marker: ' + a); return [i, j]; }
function extract(page, header) {
  let out = header || '';
  for (const [n, a, b] of SECTIONS) { const [i, j] = span(page, a, b); out += OPEN(n) + page.slice(i, j) + CLOSE(n); }
  return out;
}
function sections(mod) {
  const m = {};
  for (const [n] of SECTIONS) { const i = mod.indexOf(OPEN(n)), j = mod.indexOf(CLOSE(n)); if (i < 0 || j < 0) throw new Error('panther module is missing section ' + n); m[n] = mod.slice(i + OPEN(n).length, j); }
  m.extra = (() => { const i = mod.indexOf(OPEN('extra')), j = mod.indexOf(CLOSE('extra')); return i < 0 ? '' : mod.slice(i + OPEN('extra').length, j); })();
  return m;
}
function apply(page, modText) {                       // put the module's panther into a built page
  const m = sections(modText);
  for (const [n, a, b] of SECTIONS) { const [i, j] = span(page, a, b); page = page.slice(0, i) + m[n] + page.slice(j); }
  if (m.extra) { const k = page.indexOf('const COATS = {'); page = page.slice(0, k) + m.extra + page.slice(k); }
  return page;
}
module.exports = { SECTIONS, extract, apply, sections };
if (require.main === module) {                        // node panther-module.js extract <page.html> <out.js>
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'extract') { fs.writeFileSync(b, extract(fs.readFileSync(a, 'utf8'))); console.log('wrote', b); }
}
