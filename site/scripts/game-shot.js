// Makes the share image for Pack Run: a still of the game, elephants bearing down on the pack.
//   npm run game-shot      (builds first, then saves src/games/pack-run/shot.png; commit that file)
// It serves dist/ on a local port, opens /games/pack-run/?shot in headless Chrome at 1200x630 and
// saves the screenshot. The game plays its own round up to a fixed moment for ?shot (see game.js).
// Chrome: the usual install path, or set CHROME to the browser's full path.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');
const { at } = require('./lib');

const CHROME = process.env.CHROME || ({
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
}[process.platform] || 'google-chrome');
const OUT = at('src/games/pack-run/shot.png');
const W = 1200, H = 630;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const dist = at('dist');
  if (!fs.existsSync(path.join(dist, 'games/pack-run/index.html'))) throw new Error('build the site first: npm run build');
  const server = http.createServer((q, s) => {
    let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dist, p);
    if (!f.startsWith(dist) || !fs.existsSync(f)) { s.writeHead(404); s.end(); return; }
    s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(fs.readFileSync(f));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port, dbg = port + 1, prof = fs.mkdtempSync(path.join(os.tmpdir(), 'packrun-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`,
    '--force-device-scale-factor=1', '--hide-scrollbars', '--no-first-run', '--disable-extensions', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  try {
    let list = null;
    for (let i = 0; i < 60 && !list; i++) {
      try { list = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); if (!list.find(p => p.type === 'page')) list = null; } catch (e) { /* not up yet */ }
      if (!list) await sleep(250);
    }
    if (!list) throw new Error(`Chrome did not start (${CHROME}); set CHROME to its path`);
    const ws = new WebSocket(list.find(p => p.type === 'page').webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0; const pend = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result.value; };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/games/pack-run/?shot` });
    let ready = false;
    for (let i = 0; i < 120 && !ready; i++) { ready = await ev(`document.documentElement.dataset.shot === 'ready' && document.fonts.status === 'loaded'`).catch(() => false); if (!ready) await sleep(250); }
    if (!ready) throw new Error('the game did not draw its still');
    await sleep(300);
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    fs.writeFileSync(OUT, Buffer.from(data, 'base64'));
    console.log(`wrote ${path.relative(at('.'), OUT)} (${W}x${H})`);
    ws.close();
  } finally {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); else chrome.kill();
    server.close();
    setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* Chrome still letting go */ } }, 1500);
  }
})().catch(err => { console.error(err.message || err); process.exit(1); });
