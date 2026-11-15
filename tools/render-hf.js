// Renders PANTHERA episode pages through HyperFrames: a vertical Short and a landscape Long for each.
//   node tools/render-hf.js <page> [<page> ...] [--only=short|long] [--keep] [--workers=N] [--out=<dir>]
//   <page>: an episode page in the project folder, with or without .html (e.g. panthera-31-hippo-highway)
//   --workers=N forces the parallel worker count; --out writes somewhere other than videos/
// For each episode and format:
//   1. renders the score with capf.js (audio mode) at that format's size,
//   2. checks the page draws the same picture whatever order its frames are drawn in, since HyperFrames
//      renders in parallel chunks; if it does not, that video renders with a single worker instead,
//   3. wraps the page's script so HyperFrames' hf-seek event drives frame(t) instead of requestAnimationFrame,
//   4. renders videos/PANTHERA-ep<N>-<Title>-SHORT-vertical-9x16.mp4 or -LONG-landscape-16x9.mp4,
//   5. probes the result (size, frame count, audio) and removes its work folder (--keep keeps it).
// Needs Chrome, Node 22+, and ffmpeg + ffprobe in FFMPEG_DIR (default C:/Users/Jamal/AppData/Local/ffmpeg-9.0.2).
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { spawn, spawnSync } = require('child_process');

const PROJ = path.resolve(__dirname, '..');
const FFDIR = process.env.FFMPEG_DIR || 'C:/Users/Jamal/AppData/Local/ffmpeg-9.0.2';
const FFMPEG = path.join(FFDIR, 'ffmpeg.exe'), FFPROBE = path.join(FFDIR, 'ffprobe.exe');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HF = 'hyperframes@0.9.41';
const FPS = 30;
const FORMATS = {
  short: { w: 1080, h: 1920, tag: 'SHORT-vertical-9x16' },
  long:  { w: 1920, h: 1080, tag: 'LONG-landscape-16x9' },
};

const args = process.argv.slice(2);
const flag = n => { const f = args.find(a => a.startsWith('--' + n)); return f ? (f.split('=')[1] || true) : null; };
const pages = args.filter(a => !a.startsWith('--')).map(a => a.replace(/\.html$/, ''));
const formats = flag('only') ? [flag('only')] : ['short', 'long'];
if (!pages.length || formats.some(f => !FORMATS[f])) {
  console.error('usage: node tools/render-hf.js <page> [<page> ...] [--only=short|long] [--keep] [--workers=N] [--out=<dir>]');
  process.exit(1);
}
const OUTDIR = flag('out') ? path.resolve(flag('out')) : path.join(PROJ, 'videos');
for (const p of [FFMPEG, FFPROBE, CHROME]) if (!fs.existsSync(p)) { console.error('missing ' + p); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const secs = t0 => ((Date.now() - t0) / 1000).toFixed(0) + 's';

// ---- the episode page ----------------------------------------------------------
function episodeInfo(base) {
  const file = path.join(PROJ, base + '.html');
  if (!fs.existsSync(file)) throw new Error('no such page: ' + file);
  const html = fs.readFileSync(file, 'utf8');
  const num = (base.match(/^panthera-(\d+)-/) || [])[1];
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
  if (!num || !title) throw new Error(base + ': could not read the episode number or <title>');
  const slug = title.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { base, file, html, num: +num, title: title.trim(), name: `PANTHERA-ep${num}-${slug}` };
}

function wrapScript(html) {   // the episode's own script, driven by HyperFrames' clock
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) throw new Error(`expected one <script> block, found ${blocks.length}`);
  const kick = /^requestAnimationFrame\(frame\);\s*$/m;
  if (!kick.test(blocks[0][1])) throw new Error('could not find the episode loop start');
  return 'window.CAPTURING = true;   // HyperFrames seeks every frame; the episode never schedules its own\n'
    + blocks[0][1].replace(kick, '// requestAnimationFrame(frame);   (HyperFrames drives frames: see the end of this file)')
    + '\n// ---- HyperFrames clock --------------------------------------------------------\n'
    + 'window.addEventListener("hf-seek", e => frame(startTime + e.detail.time * 1000));\n'
    + 'frame(startTime);\n';
}

function composition({ w, h }, dur, title) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${w}, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      html, body { margin: 0; padding: 0; width: ${w}px; height: ${h}px; overflow: hidden; background: #000; }
      #main { position: relative; width: ${w}px; height: ${h}px; overflow: hidden; }
      .clip { position: absolute; inset: 0; }
      #c { display: block; width: ${w}px; height: ${h}px; }
      #overlay { display: none; }
    </style>
  </head>
  <body>
    <div id="main" data-composition-id="main" data-width="${w}" data-height="${h}" data-start="0" data-duration="${dur}">
      <div id="episode" class="clip" data-start="0" data-duration="${dur}" data-track-index="0"><canvas id="c"></canvas></div>
      <audio id="score" src="assets/score.wav" data-start="0" data-duration="${dur}" data-track-index="1" data-volume="1"></audio>
      <div id="overlay"></div>
      <script src="episode.js"></script>
    </div>
  </body>
</html>
`;
}

function wavSeconds(file) {
  const b = fs.readFileSync(file);
  return b.readUInt32LE(40) / b.readUInt16LE(32) / b.readUInt32LE(24);
}

// ---- seek-order check ---------------------------------------------------------------
// Runs the wrapped script (exactly what HyperFrames runs: no live loop) and draws sample frames on three
// fresh pages: forwards, backwards, and the middle frame first. A parallel worker starts mid-film the same way.
// Frames are compared as 16x16-pixel block averages: a block that moves more than MAXDIFF levels (of 255) is a
// visible change (a shifted animal, a missing bubble); rounding drift of a pixel or two is not.
const MAXDIFF = 3;
async function seekCheck(ep, { w, h }, dur, port) {
  const page = ep.html.replace(/<script>[\s\S]*?<\/script>/, () => '<script>' + wrapScript(ep.html) + '</script>');
  const server = http.createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html' }); s.end(page); });
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  const dbg = port + 1, prof = fs.mkdtempSync(path.join(os.tmpdir(), 'hfcheck-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`,
    `--window-size=${w},${h}`, '--force-device-scale-factor=1', '--hide-scrollbars', '--no-first-run', '--disable-extensions', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  try {
    let list = null;
    for (let i = 0; i < 60 && !list; i++) {
      try { list = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); if (!list.find(p => p.type === 'page')) list = null; } catch (e) {}
      if (!list) await sleep(250);
    }
    const ws = new WebSocket(list.find(p => p.type === 'page').webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0; const pend = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); if (r.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails)); return r.result.value; };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    const open = async () => {
      await send('Page.navigate', { url: 'about:blank' }); await sleep(200);
      await send('Page.navigate', { url: `http://127.0.0.1:${port}/?capture=1` });
      for (let i = 0; i < 120; i++) { if (await ev('window.READY === true').catch(() => false)) return; await sleep(250); }
      throw new Error('page did not become ready');
    };
    const blocks = i => ev(`(() => { window.cap(${i}); const c = document.getElementById('c'), W = c.width, H = c.height, B = 16;
      const d = c.getContext('2d').getImageData(0, 0, W, H).data, o = [];
      for (let by = 0; by < H; by += B) for (let bx = 0; bx < W; bx += B) { let s = 0, n = 0;
        for (let y = by; y < Math.min(by + B, H); y++) for (let x = bx; x < Math.min(bx + B, W); x++) { const k = (y * W + x) * 4; s += d[k] + d[k + 1] + d[k + 2]; n += 3; }
        o.push(s / n); }
      return o; })()`);
    const worst = (a, b) => a.reduce((m, v, k) => Math.max(m, Math.abs(v - b[k])), 0);
    const frames = [0.04, 0.27, 0.5, 0.73, 0.96].map(f => Math.round(f * dur * FPS));
    await open();
    const fwd = {}; for (const i of frames) fwd[i] = await blocks(i);
    const bad = {};
    const cmp = async i => { const d = worst(await blocks(i), fwd[i]); if (d > MAXDIFF) bad[i] = Math.max(bad[i] || 0, d); };
    await open();
    for (const i of [...frames].reverse()) await cmp(i);
    await open();
    for (const i of [frames[2], frames[0], frames[4]]) await cmp(i);
    return Object.keys(bad).map(i => `${i} (block off by ${bad[i].toFixed(1)})`);
  } finally {
    try { spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) {}
    server.close();
    setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} }, 1500);
  }
}

// ---- one video ----------------------------------------------------------------------
async function renderOne(ep, fmtName) {
  const fmt = FORMATS[fmtName], t0 = Date.now();
  const out = path.join(OUTDIR, `${ep.name}-${fmt.tag}.mp4`);
  const work = path.join(PROJ, 'tools', 'hf-work', `${ep.base}-${fmtName}`);
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(path.join(work, 'assets'), { recursive: true });
  const say = s => console.log(`[ep${ep.num} ${fmtName}] ${s}`);

  const wav = path.join(work, 'assets', 'score.wav');
  const a = spawnSync('node', [path.join(PROJ, 'tools', 'capf.js'), 'audio', String(ep.num), wav, `--w=${fmt.w}`, `--h=${fmt.h}`],
    { env: { ...process.env, PAGE: ep.file }, encoding: 'utf8' });
  if (a.status !== 0 || !fs.existsSync(wav)) throw new Error('audio render failed: ' + (a.stderr || a.stdout).slice(-400));
  const dur = +wavSeconds(wav).toFixed(3);
  say(`score ${dur}s (${secs(t0)})`);

  const bad = await seekCheck(ep, fmt, dur, 9700 + ep.num * 4 + (fmtName === 'long' ? 2 : 0));
  const workers = flag('workers') ? ` --workers ${+flag('workers')}` : bad.length ? ' --workers 1' : '';
  say(bad.length ? `frames ${bad.join(', ')} change visibly with drawing order: ${flag('workers') ? 'workers forced anyway' : 'rendering with one worker'}` : 'seek check passed');

  fs.writeFileSync(path.join(work, 'episode.js'), wrapScript(ep.html));
  fs.writeFileSync(path.join(work, 'index.html'), composition(fmt, dur, `${ep.title} (${fmtName})`));
  fs.writeFileSync(path.join(work, 'meta.json'), JSON.stringify({ id: `${ep.base}-${fmtName}`, name: `${ep.base}-${fmtName}` }, null, 2) + '\n');
  fs.writeFileSync(path.join(work, 'hyperframes.json'), JSON.stringify({ paths: { assets: 'assets' }, media: { autoProxy: true } }, null, 2) + '\n');

  const log = path.join(work, 'render.log'), fd = fs.openSync(log, 'w'), t1 = Date.now();
  const r = spawnSync(`npx --yes ${HF} render "${work}" -o "${out}" --fps ${FPS} --crf 18${workers}`, {
    shell: true, stdio: ['ignore', fd, fd],
    env: { ...process.env, HYPERFRAMES_FFMPEG_PATH: FFMPEG, HYPERFRAMES_FFPROBE_PATH: FFPROBE },
  });
  fs.closeSync(fd);
  if (r.status !== 0 || !fs.existsSync(out)) throw new Error(`render failed (log kept: ${log})\n` + fs.readFileSync(log, 'utf8').slice(-1500));

  const p = JSON.parse(spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,nb_frames:format=duration', '-of', 'json', out], { encoding: 'utf8' }).stdout);
  const v = p.streams.find(s => s.codec_type === 'video'), au = p.streams.find(s => s.codec_type === 'audio');
  const want = Math.ceil(dur * FPS - 1e-6), problems = [];   // HyperFrames covers the score's last partial frame
  if (!v || v.width !== fmt.w || v.height !== fmt.h) problems.push(`video is ${v && v.width}x${v && v.height}, wanted ${fmt.w}x${fmt.h}`);
  if (v && +v.nb_frames !== want) problems.push(`${v.nb_frames} frames, wanted ${want}`);
  if (!au) problems.push('no audio track');
  if (Math.abs(+p.format.duration - dur) > 0.1) problems.push(`lasts ${p.format.duration}s, wanted ${dur}s`);
  if (problems.length) throw new Error(`${path.basename(out)}: ${problems.join('; ')} (work folder kept: ${work})`);

  if (!flag('keep')) fs.rmSync(work, { recursive: true, force: true });
  const mb = (fs.statSync(out).size / 1048576).toFixed(0);
  say(`done in ${secs(t0)} (render ${secs(t1)}): ${path.basename(out)}, ${mb} MB, ${want} frames${workers ? `,${workers.replace(' --', ' ')}` : ''}`);
  return { file: path.basename(out), ok: true };
}

(async () => {
  const T0 = Date.now(), results = [];
  for (const base of pages) {
    let ep;
    try { ep = episodeInfo(base); } catch (e) { console.log('FAILED ' + base + ': ' + e.message); results.push({ file: base, ok: false }); continue; }
    for (const f of formats) {
      try { results.push(await renderOne(ep, f)); }
      catch (e) { console.log(`FAILED ep${ep.num} ${f}: ${e.message}`); results.push({ file: `${ep.name} ${f}`, ok: false }); }
    }
  }
  const ok = results.filter(r => r.ok).length;
  console.log(`\nALL FINISHED in ${secs(T0)}: ${ok}/${results.length} videos rendered`);
  for (const r of results) console.log(`  ${r.ok ? 'ok    ' : 'FAILED'} ${r.file}`);
  process.exit(ok === results.length ? 0 : 1);
})();
