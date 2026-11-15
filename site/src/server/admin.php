<?php
// /secret-crm-door/ : how many people played Pack Run, behind a password.
// The password hash lives in .hh-data/admin.json on the server only (set it with: npm run admin-password).
define('HH', 1);
require __DIR__ . '/../api/hh-store.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('hhadmin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/secret-crm-door/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
$csrf = $_SESSION['csrf'];
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$self = strtok($_SERVER['REQUEST_URI'], '?');

$config = hh_json_get('admin.json');
$hash = (string)($config['hash'] ?? '');
$error = '';

// at most 5 wrong passwords per 15 minutes from one address (kept as a hash, and only for 15 minutes)
$who = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $hash);
$fails = array_filter(hh_json_get('login-fails.json'), fn($t) => is_array($t));
foreach ($fails as $k => $list) { $fails[$k] = array_values(array_filter($list, fn($t) => $t > time() - 900)); if (!$fails[$k]) unset($fails[$k]); }
$locked = count($fails[$who] ?? []) >= 5;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!hash_equals($csrf, (string)($_POST['csrf'] ?? ''))) { http_response_code(400); exit('Form expired. Go back and try again.'); }
  if (isset($_POST['logout'])) { $_SESSION = []; session_destroy(); header('Location: ' . $self, true, 303); exit; }
  if ($hash === '') $error = 'The admin password has not been set yet.';
  elseif ($locked) $error = 'Too many wrong passwords. Wait 15 minutes and try again.';
  elseif (password_verify((string)($_POST['password'] ?? ''), $hash)) {
    session_regenerate_id(true); $_SESSION['ok'] = true;
    unset($fails[$who]); hh_json_put('login-fails.json', $fails);
    header('Location: ' . $self, true, 303); exit;
  } else {
    $fails[$who][] = time(); hh_json_put('login-fails.json', $fails);
    usleep(400000);
    $error = 'Wrong password.';
  }
}
$in = !empty($_SESSION['ok']) && $hash !== '';

// ---- the numbers ----
if ($in) {
  $rows = hh_rows();
  $today = date('Y-m-d');
  $since = fn(int $days) => strtotime("today -" . ($days - 1) . " days");
  $players = []; $playersToday = []; $players7 = []; $players30 = [];
  $starts = 0; $finishes = 0; $wins = 0; $best = 0;
  $byThreat = array_fill_keys(HH_THREATS, ['rounds' => 0, 'players' => []]);
  $byDay = [];
  foreach ($rows as [$t, $ev, $id, $th, $score, $won]) {
    $t = (int)$t; $day = date('Y-m-d', $t);
    if ($ev === 'start') {
      $starts++; $players[$id] = 1;
      if ($day === $today) $playersToday[$id] = 1;
      if ($t >= $since(7)) $players7[$id] = 1;
      if ($t >= $since(30)) $players30[$id] = 1;
      if (isset($byThreat[$th])) { $byThreat[$th]['rounds']++; $byThreat[$th]['players'][$id] = 1; }
      $byDay[$day]['rounds'] = ($byDay[$day]['rounds'] ?? 0) + 1; $byDay[$day]['players'][$id] = 1;
    } else {
      $finishes++; $wins += (int)$won; $best = max($best, (int)$score);
    }
  }
  $days = [];
  for ($i = 0; $i < 14; $i++) { $d = date('Y-m-d', strtotime("today -$i days")); $days[$d] = ['players' => count($byDay[$d]['players'] ?? []), 'rounds' => $byDay[$d]['rounds'] ?? 0]; }
  $peak = max(1, max(array_column($days, 'players')));
}
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin | Happy Hillz</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<style>
  .admin { padding-block: clamp(28px, 5vw, 56px); }
  .admin .page-title { margin-bottom: 18px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; list-style: none; margin: 20px 0 34px; }
  .stats li { padding: 16px 18px; background: #fff; border: var(--line) solid var(--ink); box-shadow: 4px 4px 0 var(--ink); }
  .stats li:first-child { background: var(--pop); }
  .stats strong { display: block; font: 400 2.8rem/1 var(--display); }
  .stats span { font-weight: 700; }
  .admin table { width: 100%; max-width: 640px; border-collapse: collapse; background: #fff; border: var(--line) solid var(--ink); margin: 12px 0 30px; }
  .admin th, .admin td { padding: 8px 12px; border-bottom: 1px solid #e6dcc6; text-align: left; }
  .admin th { font: 400 1rem/1.2 var(--display); text-transform: uppercase; letter-spacing: .04em; background: var(--ink); color: #fff; }
  .admin td.n { text-align: right; font-variant-numeric: tabular-nums; }
  .bar { display: inline-block; height: 12px; background: var(--hot); vertical-align: middle; }
  .login { display: grid; gap: 12px; max-width: 360px; padding: 20px; background: #fff; border: var(--line) solid var(--ink); box-shadow: var(--drop); }
  .login input { font: inherit; padding: 10px 12px; border: var(--line) solid var(--ink); }
  .note { max-width: 40em; color: #4a4337; font-size: 1rem; }
  .err { color: #b0003a; font-weight: 700; }
  .out { margin-top: 10px; }
  .out button { font: inherit; text-decoration: underline; background: none; border: 0; cursor: pointer; padding: 0; }
</style>
</head>
<body>
<main class="section admin"><div class="wrap">
<?php if (!$in): ?>
  <h1 class="page-title">Admin</h1>
  <?php if ($hash === ''): ?>
    <p class="note">The admin password has not been set yet. On the computer with the site's SSH key, run <code>npm run admin-password</code> in the <code>site</code> folder.</p>
  <?php else: ?>
  <form class="login" method="post" action="<?= $h($self) ?>">
    <label for="pw"><strong>Password</strong></label>
    <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
    <input type="hidden" name="csrf" value="<?= $h($csrf) ?>">
    <?php if ($error): ?><p class="err" role="alert"><?= $h($error) ?></p><?php endif; ?>
    <button class="btn btn--pop" type="submit">Log in</button>
  </form>
  <?php endif; ?>
<?php else: ?>
  <h1 class="page-title">Pack Run players</h1>
  <ul class="stats" role="list">
    <li><strong><?= count($players) ?></strong><span>players, all time</span></li>
    <li><strong><?= count($playersToday) ?></strong><span>played today</span></li>
    <li><strong><?= count($players7) ?></strong><span>in the last 7 days</span></li>
    <li><strong><?= count($players30) ?></strong><span>in the last 30 days</span></li>
    <li><strong><?= $starts ?></strong><span>rounds started</span></li>
    <li><strong><?= $finishes ?></strong><span>rounds finished (<?= $wins ?> made it to the end)</span></li>
    <li><strong><?= $best ?></strong><span>best score</span></li>
  </ul>

  <h2>Last 14 days</h2>
  <table>
    <thead><tr><th>Day</th><th>Players</th><th>Rounds</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($days as $d => $v): ?>
      <tr><td><?= $h(date('D, M j', strtotime($d))) ?></td><td class="n"><?= $v['players'] ?></td><td class="n"><?= $v['rounds'] ?></td><td><span class="bar" style="width:<?= round(160 * $v['players'] / $peak) ?>px"></span></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>

  <h2>By threat</h2>
  <table>
    <thead><tr><th>Threat</th><th>Players</th><th>Rounds</th></tr></thead>
    <tbody>
    <?php foreach ($byThreat as $k => $v): ?>
      <tr><td><?= $h(ucfirst($k)) ?></td><td class="n"><?= count($v['players']) ?></td><td class="n"><?= $v['rounds'] ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>

  <p class="note">A player is one browser on one device: the game keeps a random number in the browser, not a name or an address. The same person on a phone and a laptop counts twice, and so does someone who clears their browser data. Days are in California time. Counting started when this page went live.</p>
  <form class="out" method="post" action="<?= $h($self) ?>"><input type="hidden" name="csrf" value="<?= $h($csrf) ?>"><button name="logout" value="1">Log out</button></form>
<?php endif; ?>
</div></main>
</body>
</html>
