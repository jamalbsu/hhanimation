// Builds the pages in this folder from teasers/src:
//   tN-name.js  → teaser-N-name.html        (engine.js + the teaser)
//   sN-name.js  → stardust-ep-N-name.html   (engine.js + series-stardust.js + the episode)
//   node teasers/build.js          (everything)      node teasers/build.js t3      node teasers/build.js s
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src'), read = f => fs.readFileSync(path.join(src, f), 'utf8');
const engine = read('engine.js'), series = read('series-stardust.js'), page = read('page.html');
const only = process.argv[2] || '';
for (const f of fs.readdirSync(src).filter(f => /^[ts]\d+-.+\.js$/.test(f)).sort()) {
  const [, kind, n, slug] = f.match(/^([ts])(\d+)-(.+)\.js$/);
  if (only && !(kind + n).startsWith(only) && only !== n) continue;
  const code = read(f), name = (code.match(/name:\s*'([^']+)'/) || [, slug])[1];
  const title = kind === 's' ? `PANTHERA Stardust — Ep ${n}: ${name}` : 'PANTHERA teaser — ' + name;
  const body = engine + '\n' + (kind === 's' ? series + '\n' : '') + code + '\nboot();\n';
  const out = path.join(__dirname, (kind === 's' ? 'stardust-ep-' : 'teaser-') + `${n}-${slug}.html`);
  fs.writeFileSync(out, page.replace('{{TITLE}}', () => title).replace('/*{{CODE}}*/', () => body)); console.log('built', path.basename(out));
}
