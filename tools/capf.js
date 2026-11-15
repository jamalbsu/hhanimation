// Drives headless Chrome over its debugging port to render panther-run.html.
//   node cap.js stills <v> <out.png> <t1,t2,...> [--cols=3] [--scale=0.5] [--w=720] [--h=1280]
//   node cap.js video  <v> <out.mp4>              [--w=1080] [--h=1920] [--fps=30] [--crf=18] [--only=0,30,60]
//   node cap.js audio  <v> <out.wav>
//   node cap.js time   <v>                         [--w=1080] [--h=1920]
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), { spawn } = require('child_process');
const [mode, ver, outp, timesArg, ...rest] = process.argv.slice(2);
const flags = [timesArg, ...rest].filter(x => x && x.startsWith('--'));
const flag = (n, d) => { const f = flags.find(f => f.startsWith('--' + n + '=')); return f ? +f.split('=')[1] : d; };
const PAGE = process.env.PAGE;                                  // path of panther-run.html
const FFMPEG = process.env.FFMPEG;
const w = flag('w', mode === 'video' || mode === 'time' ? 1080 : 720), h = flag('h', mode === 'video' || mode === 'time' ? 1920 : 1280), fps = flag('fps', 30);
const portBase = 9300 + (+ver) * 10 + ({ stills: 0, video: 3, audio: 6, time: 8 }[mode] || 0);   // fixed per job so parallel runs never collide
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const server = http.createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html' }); fs.createReadStream(PAGE).pipe(s); });
  await new Promise(r => server.listen(portBase, '127.0.0.1', r));
  const dbg = portBase + 1, prof = fs.mkdtempSync(path.join(os.tmpdir(), 'capprof-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`,
    `--window-size=${w},${h}`, '--force-device-scale-factor=1', '--hide-scrollbars', '--no-first-run', '--disable-extensions', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => { try { spawn('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) {} server.close(); setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} }, 1500); };
  try {
    let list = null;
    for (let i = 0; i < 60 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json(); if (!list.find(p => p.type === 'page')) list = null; } catch (e) {} if (!list) await sleep(250); }
    const ws = new WebSocket(list.find(p => p.type === 'page').webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0; const pend = new Map();
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } };
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expr, await_ = false) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: await_, returnByValue: true }); if (r.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails)); return r.result.value; };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://127.0.0.1:${portBase}/?v=${ver}&w=${w}&h=${h}&capture=1${process.env.QS || ""}` });
    for (let i = 0; i < 120; i++) { if (await ev('window.READY === true').catch(() => false)) break; await sleep(250); }
    if (!(await ev('window.READY === true'))) throw new Error('page did not become ready');

    if (mode === 'stills') {
      const b64 = await ev(`window.contact([${timesArg}], ${flag('cols', 3)}, ${flag('scale', 0.5)}, [${(flags.find(f => f.startsWith('--crop=')) || '--crop=0,0,1,1').split('=')[1]}])`);
      fs.writeFileSync(outp, Buffer.from(b64, 'base64')); console.log('wrote', outp);
    } else if (mode === 'time') {
      console.log('ms/frame', (await ev('window.timeIt(20)')).toFixed(1), `${w}x${h}`);
    } else if (mode === 'sndcheck') {       // play every sound event once and report any that throw
      await ev('window.renderAudioWav()', true);
      console.log(path.basename(PAGE), await ev(`(()=>{const errs={};let n=0;for(const e of EVENTS){n++;try{playEvent(e,1)}catch(x){errs[e.k+(e.inst||'')]=String(x).slice(0,60)}}return JSON.stringify({n,errs})})()`));
    } else if (mode === 'audio') {
      const b64 = await ev('window.renderAudioWav()', true); fs.writeFileSync(outp, Buffer.from(b64, 'base64')); console.log('wrote', outp);
    } else if (mode === 'video') {
      const dur = await ev('DUR'), n = Math.round(dur * fps), wav = outp.replace(/\.mp4$/, '.wav');
      const t0 = Date.now();
      fs.writeFileSync(wav, Buffer.from(await ev('window.renderAudioWav()', true), 'base64'));
      console.log(`v${ver}: audio ready (${((Date.now() - t0) / 1000).toFixed(1)}s), rendering ${n} frames at ${w}x${h}`);
      const dir = outp.replace(/\.mp4$/, '-frames'); fs.mkdirSync(dir, { recursive: true });
      const start = flag('from', 0);
      for (let i = start; i < n; i++) {
        fs.writeFileSync(path.join(dir, 'f' + String(i).padStart(5, '0') + '.jpg'), Buffer.from(await ev('window.cap(' + i + ')'), 'base64'));
        if (i % 90 === 0) console.log('v' + ver + ': frame ' + i + '/' + n);
      }
      console.log('frames done in ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
    ws.close();
  } finally { cleanup(); }
}
main().then(() => setTimeout(() => process.exit(0), 300), e => { console.error('FAILED:', e.message); setTimeout(() => process.exit(1), 300); });
