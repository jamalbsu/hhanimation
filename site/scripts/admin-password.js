// Sets the password for the admin page, https://happyhillz.com/secret-crm-door/
//   npm run admin-password
// Asks for the password twice (nothing shows as you type), then sends it over SSH to the server's PHP,
// which stores only a hash, in .hh-data/admin.json in the document root. The password itself is never
// written to a file here, never goes into git, and never appears on a command line. Run it again to change it.
const readline = require('readline');
const { spawn } = require('child_process');

const DOC = 'public_html/website_adbe171a';                         // the document root, as in deploy.js
const TARGET = process.env.HAPPYHILLZ_SSH_TARGET || 'happyhillz';   // the Host entry in ~/.ssh/config
const PORT = process.env.HAPPYHILLZ_SSH_PORT;

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (s.includes(question)) process.stdout.write(s); };   // hide what is typed
    rl.question(question, answer => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

(async () => {
  if (!process.stdin.isTTY) throw new Error('run this in a terminal, so the password can be typed in privately');
  const pw = await ask('New admin password: ');
  if (pw.length < 10) throw new Error('use at least 10 characters');
  if (await ask('Type it again: ') !== pw) throw new Error('the two passwords are different; nothing was changed');
  const b64 = Buffer.from(pw, 'utf8').toString('base64');
  const php = `<?php
$dir = getenv('HOME') . '/${DOC}/.hh-data';
if (!is_dir($dir)) mkdir($dir, 0700, true);
if (!is_file("$dir/.htaccess")) file_put_contents("$dir/.htaccess", "Require all denied\\n<IfModule !mod_authz_core.c>\\n  Deny from all\\n</IfModule>\\n");
file_put_contents("$dir/admin.json", json_encode(['hash' => password_hash(base64_decode('${b64}'), PASSWORD_DEFAULT), 'set' => date('c')]), LOCK_EX);
chmod("$dir/admin.json", 0600);
echo "ok\\n";
`;
  const opts = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20', ...(PORT ? ['-p', PORT] : [])];
  await new Promise((resolve, reject) => {
    const child = spawn('ssh', [...opts, TARGET, 'php'], { stdio: ['pipe', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.on('error', reject);
    child.on('close', code => (code === 0 && out.trim() === 'ok') ? resolve() : reject(new Error(`the server did not store it (ssh exit ${code}) ${out.trim()}`)));
    child.stdin.end(php);
  });
  console.log('Admin password set. Log in at https://happyhillz.com/secret-crm-door/');
})().catch(err => { console.error(err.message || err); process.exit(1); });
