// Stores the shop's keys on the server: the Printify API token and the Stripe keys.
//   npm run shop-keys
// Asks for each key (nothing shows as you type or paste; press Enter to keep the one already stored), sends them
// over SSH to the server's PHP, which keeps them in .hh-data/shop.json in the document root. That folder is never
// served and deploys never touch it. The keys are never written to a file here, never go into git, and never
// appear on a command line. Afterwards the server checks that each key works and prints the result (not the keys).
// To switch the shop from test to live, run it again and enter the live keys and the live webhook secret.
const { spawn } = require('child_process');
const { askHidden } = require('./lib');

const DOC = 'public_html/website_adbe171a';                         // the document root, as in deploy.js
const TARGET = process.env.HAPPYHILLZ_SSH_TARGET || 'happyhillz';   // the Host entry in ~/.ssh/config
const PORT = process.env.HAPPYHILLZ_SSH_PORT;

// what a pasted value is, by its prefix (prefixes aren't secret), so a key pasted in the wrong place is caught
const kind = v => /^(sk|rk)_(test|live)_/.test(v) ? `a Stripe secret key (${v.slice(0, 8)}…)`
  : /^pk_(test|live)_/.test(v) ? `a Stripe publishable key (${v.slice(0, 8)}…)`
  : /^whsec_/.test(v) ? 'a Stripe webhook secret (whsec_…)'
  : /^eyJ/.test(v) ? 'a Printify token' : 'not a key this script knows';
const FIELDS = [
  ['printify_token', 'Printify API token', v => (/^eyJ/.test(v) && v.length >= 40) || `that's ${kind(v)}, not a Printify token`],
  ['stripe_secret_key', 'Stripe SECRET key (starts with sk_test_ or sk_live_)', v => /^(sk|rk)_(test|live)_\w{20,}$/.test(v) || `that's ${kind(v)}; the secret key starts with sk_test_ or sk_live_`],
  ['stripe_publishable_key', 'Stripe PUBLISHABLE key (starts with pk_test_ or pk_live_)', v => /^pk_(test|live)_\w{20,}$/.test(v) || `that's ${kind(v)}; the publishable key starts with pk_test_ or pk_live_`],
  ['stripe_webhook_secret', 'Stripe webhook signing secret (starts with whsec_)', v => /^whsec_\w{20,}$/.test(v) || `that's ${kind(v)}; the webhook signing secret starts with whsec_`],
];

(async () => {
  console.log('Paste each key and press Enter. Nothing shows on screen, not even dots. Press Enter alone to keep');
  console.log('a key that is already stored. Start with Stripe TEST keys (sk_test_, pk_test_), then rerun with live keys.\n');
  const set = {};
  for (const [name, label, check] of FIELDS) {
    for (let tries = 0; ; tries++) {
      const v = await askHidden(`${label}: `);
      if (!v) { console.log('  kept as it was'); break; }
      const ok = check(v);
      if (ok === true) { set[name] = v; console.log(`  got ${kind(v)}, ${v.length} characters`); break; }
      console.log(`  ${ok}. Try again, or press Enter to skip.`);
      if (tries >= 2) throw new Error('too many tries; nothing was changed');
    }
  }
  const b64 = Buffer.from(JSON.stringify(set), 'utf8').toString('base64');
  const php = `<?php
$dir = getenv('HOME') . '/${DOC}/.hh-data';
if (!is_dir($dir)) mkdir($dir, 0700, true);
if (!is_file("$dir/.htaccess")) file_put_contents("$dir/.htaccess", "Require all denied\\n<IfModule !mod_authz_core.c>\\n  Deny from all\\n</IfModule>\\n");
$f = "$dir/shop.json";
$k = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
$k = array_merge($k, json_decode(base64_decode('${b64}'), true));
$mode = fn($key) => preg_match('/_(test|live)_/', (string)($k[$key] ?? ''), $m) ? $m[1] : null;
if ($mode('stripe_secret_key') && $mode('stripe_publishable_key') && $mode('stripe_secret_key') !== $mode('stripe_publishable_key')) {
  echo json_encode(['error' => 'the secret key is ' . $mode('stripe_secret_key') . ' mode but the publishable key is ' . $mode('stripe_publishable_key') . ' mode; nothing was changed']); exit;
}
$k['set'] = date('c');
file_put_contents($f, json_encode($k), LOCK_EX);
chmod($f, 0600);

function get($url, $auth) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $auth, 'User-Agent: PHP-shop/1.0', 'Stripe-Version: 2026-03-25.dahlia']]);
  $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
  return [$code, json_decode((string)$raw, true)];
}
$out = ['stripe_mode' => $mode('stripe_secret_key'), 'webhook_secret' => !empty($k['stripe_webhook_secret']), 'publishable_key' => !empty($k['stripe_publishable_key'])];
if (!empty($k['stripe_secret_key'])) { [$c] = get('https://api.stripe.com/v1/checkout/sessions?limit=1', $k['stripe_secret_key']); $out['stripe_works'] = $c === 200; $out['stripe_http'] = $c; }
if (!empty($k['printify_token'])) {
  [$c, $shops] = get('https://api.printify.com/v1/shops.json', $k['printify_token']);
  $out['printify_works'] = $c === 200; $out['printify_http'] = $c;
  if ($c === 200 && is_array($shops)) $out['printify_shops'] = array_map(fn($s) => ['id' => $s['id'] ?? null, 'title' => $s['title'] ?? '', 'channel' => $s['sales_channel'] ?? ''], $shops);
}
echo json_encode($out);
`;
  const opts = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20', ...(PORT ? ['-p', PORT] : [])];
  const out = await new Promise((resolve, reject) => {
    const child = spawn('ssh', [...opts, TARGET, 'php'], { stdio: ['pipe', 'pipe', 'inherit'] });
    let buf = '';
    child.stdout.on('data', d => { buf += d; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(buf) : reject(new Error(`the server did not store the keys (ssh exit ${code}) ${buf.trim()}`)));
    child.stdin.end(php);
  });
  let r;
  try { r = JSON.parse(out); } catch (e) { throw new Error(`unexpected answer from the server: ${out.trim().slice(0, 300)}`); }
  if (r.error) throw new Error(r.error);
  const yes = b => (b ? 'yes' : 'NO');
  console.log(`Stored ${Object.keys(set).length ? Object.keys(set).join(', ') : 'nothing new'} on the server.`);
  if (r.stripe_mode) console.log(`Stripe: ${r.stripe_mode} mode, key works: ${yes(r.stripe_works)}${r.stripe_works ? '' : ` (HTTP ${r.stripe_http})`}, publishable key: ${yes(r.publishable_key)}, webhook secret: ${yes(r.webhook_secret)}`);
  if ('printify_works' in r) {
    console.log(`Printify: token works: ${yes(r.printify_works)}${r.printify_works ? '' : ` (HTTP ${r.printify_http})`}`);
    for (const s of r.printify_shops || []) console.log(`  shop ${s.id}: ${s.title} (${s.channel || 'no sales channel'})`);
  }
})().catch(err => { console.error(err.message || err); process.exit(1); });
