// Wraps a built PANTHERA episode page so HyperFrames can render it.
//   node build.cjs <episode.html>
// Writes episode.js next to this file: the episode's own script, unchanged except that
// HyperFrames' clock (the hf-seek event) replaces the episode's requestAnimationFrame loop.
// Episodes draw any moment from frame(startTime + t * 1000), so each seek draws frame t exactly.
const fs = require('fs'), path = require('path');

const page = process.argv[2];
if (!page) { console.error('usage: node build.cjs <episode.html>'); process.exit(1); }
const src = fs.readFileSync(page, 'utf8');
const blocks = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (blocks.length !== 1) throw new Error(`expected one <script> block, found ${blocks.length}`);

let js = blocks[0][1];
const kick = /^requestAnimationFrame\(frame\);\s*$/m;          // the loop's first tick
if (!kick.test(js)) throw new Error('could not find the episode loop start');
js = js.replace(kick, '// requestAnimationFrame(frame);   (HyperFrames drives frames: see the end of this file)');

js = 'window.CAPTURING = true;   // the episode never reschedules itself; HyperFrames seeks every frame\n'
  + js
  + '\n// ---- HyperFrames clock --------------------------------------------------------\n'
  + 'window.addEventListener("hf-seek", e => frame(startTime + e.detail.time * 1000));\n'
  + 'frame(startTime);\n';

const out = path.join(__dirname, 'episode.js');
fs.writeFileSync(out, js);
console.log('wrote', out, `(${(js.length / 1024).toFixed(0)} KB) from`, path.basename(page));
