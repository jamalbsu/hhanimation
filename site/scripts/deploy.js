// Deploys dist/ to the Happy Hillz document root on HostGator over SSH.
//   npm run check-server   test the SSH key and list the document root
//   npm run deploy:dry     build, upload, show what would change on the server, change nothing
//   npm run deploy         build, upload, sync, then fetch the site to confirm it serves this build
//
// Works without a local rsync (Windows). dist/ is packed here and uploaded as
// one file into the document root, then a script sent over stdin unpacks it
// into a staging folder and syncs it with the server's rsync. Nothing outside
// ~/public_html/website_adbe171a is touched, and .well-known/ (SSL validation)
// and cgi-bin/ are never deleted. Upload and staging files are removed after.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { at, config } = require('./lib');

const DOC = 'public_html/website_adbe171a';                         // relative to the account's home folder
const TARGET = process.env.HAPPYHILLZ_SSH_TARGET || 'happyhillz';   // the Host entry in ~/.ssh/config
const PORT = process.env.HAPPYHILLZ_SSH_PORT;                       // set to 2222 if port 22 times out

// Every argument here is a plain word; scripts and data only travel over stdin,
// so nothing depends on how Windows quotes a command line.
function ssh(words, input) {
  return new Promise((resolve, reject) => {
    const opts = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20', '-o', 'StrictHostKeyChecking=accept-new', ...(PORT ? ['-p', PORT] : [])];
    const child = spawn('ssh', [...opts, TARGET, ...words], { stdio: ['pipe', 'inherit', 'inherit'] });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`ssh exited with code ${code}`)));
    child.stdin.end(input);
  });
}

// Minimal ustar writer, so packing does not depend on which tar the machine has.
function header(name, size, mode, type) {
  if (Buffer.byteLength(name) > 100) throw new Error(`path too long to pack: ${name}`);
  const b = Buffer.alloc(512);
  const oct = (n, len) => n.toString(8).padStart(len - 1, '0') + '\0';
  b.write(name, 0, 100, 'utf8');
  b.write(oct(mode, 8), 100); b.write(oct(0, 8), 108); b.write(oct(0, 8), 116);
  b.write(oct(size, 12), 124); b.write(oct(Math.floor(Date.now() / 1000), 12), 136);
  b.fill(' ', 148, 156); b.write(type, 156);
  b.write('ustar\0', 257); b.write('00', 263);
  let sum = 0; for (const x of b) sum += x;
  b.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return b;
}
function pack(dir) {
  const parts = [];
  let files = 0;
  (function walk(rel) {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { parts.push(header(`${r}/`, 0, 0o755, '5')); walk(r); continue; }
      const data = fs.readFileSync(path.join(dir, r));
      parts.push(header(r, data.length, 0o644, '0'), data, Buffer.alloc((512 - (data.length % 512)) % 512));
      files++;
    }
  })('');
  parts.push(Buffer.alloc(1024));
  return { gz: zlib.gzipSync(Buffer.concat(parts), { level: 9 }), files };
}

// Runs on the server as: bash -s -- <upload file name> [-n]
const REMOTE = String.raw`set -eu -o pipefail
UP="$1"; DRY=""; if [ $# -ge 2 ]; then DRY="$2"; fi
case "$UP" in .deploy-upload-*.tgz) ;; *) echo "refusing: bad upload name" >&2; exit 1;; esac
case "$UP" in */*) echo "refusing: bad upload name" >&2; exit 1;; esac
DOC="$HOME/public_html/website_adbe171a"
[ -d "$DOC" ] || { echo "document root $DOC does not exist" >&2; exit 1; }
cd "$DOC"
STAGE=".deploy-stage-$$"
cleanup() { rm -rf "$DOC/$STAGE"; rm -f "$DOC/$UP"; }
trap cleanup EXIT
mkdir "$STAGE"
gzip -dc "$UP" | tar -xf - -C "$STAGE"
if [ ! -f "$STAGE/index.html" ] || [ ! -f "$STAGE/.htaccess" ]; then echo "upload incomplete" >&2; exit 1; fi
if command -v rsync >/dev/null 2>&1; then
  if [ -n "$DRY" ]; then echo "would change on the server (dry run, nothing changed):"; else echo "changed on the server:"; fi
  OUT=$(rsync -a -c --delete $DRY --itemize-changes \
    --exclude='/.deploy-stage-*' --exclude='/.deploy-upload-*' --exclude='/.well-known/' --exclude='/cgi-bin/' \
    "$STAGE/" "$DOC/")
  CHANGES=$(printf '%s\n' "$OUT" | grep -v -e '^\.' -e '^$' || true)
  if [ -n "$CHANGES" ]; then printf '%s\n' "$CHANGES"; else echo "  nothing: the server already has this build"; fi
elif [ -n "$DRY" ]; then
  echo "server has no rsync; a deploy would replace these entries in the document root:"
  ls -A "$DOC" | grep -v -e '^\.deploy-' -e '^\.well-known$' -e '^cgi-bin$' || echo "  (document root is empty)"
else
  find "$DOC" -mindepth 1 -maxdepth 1 ! -name "$STAGE" ! -name "$UP" ! -name .well-known ! -name cgi-bin -exec rm -rf {} +
  cp -a "$STAGE/." "$DOC/"
  echo "replaced the document root contents (server has no rsync)"
fi
`;

async function main(argv) {
  const args = new Set(argv);
  const DRY = args.has('--dry-run');

  if (args.has('--check')) {
    console.log(`ssh ${TARGET}: listing ~/${DOC}`);
    await ssh(['bash', '-s'], `cd "$HOME/${DOC}" && pwd && ls -la\n`);
    return;
  }

  const dist = at('dist');
  if (!fs.existsSync(path.join(dist, 'index.html')) || !fs.existsSync(path.join(dist, '.htaccess'))) throw new Error('dist/ is missing index.html or .htaccess; run "npm run build" first');
  const { gz, files } = pack(dist);
  const up = `.deploy-upload-${crypto.randomBytes(6).toString('hex')}.tgz`;
  console.log(`packed dist/: ${files} files, ${(gz.length / 1024).toFixed(0)} KB -> ${TARGET}:~/${DOC}${DRY ? ' (dry run)' : ''}`);

  await ssh(['cat', '>', `${DOC}/${up}`], gz);
  await ssh(['bash', '-s', '--', up, ...(DRY ? ['-n'] : [])], REMOTE);
  if (DRY) return;

  // Confirm the live site answers with this build; fail the run if it doesn't.
  const want = fs.readFileSync(path.join(dist, 'index.html'), 'utf8').match(/styles\.css\?v=(\w+)/)[1];
  const base = config().siteUrl;
  try {
    const res = await fetch(`${base}/?deploycheck=${Date.now()}`, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    const body = await res.text();
    if (res.ok && body.includes(want)) console.log(`${base}: HTTP ${res.status}, serving this build`);
    else throw new Error(`HTTP ${res.status}, not serving this build`);
  } catch (err) {
    throw new Error(`deployed, but ${base} check failed: ${err.cause?.code || err.message}`);
  }
}

module.exports = { pack, REMOTE };
if (require.main === module) main(process.argv.slice(2)).catch(err => { console.error('deploy failed:', err.message); process.exit(1); });
