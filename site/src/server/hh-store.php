<?php
// Pack Run play counter: the storage shared by /api/play.php and the admin page (/secret-crm-door/).
// Plays are kept in .hh-data/ in the document root: Apache refuses every request for it, and deploys never touch it.
// A row: unix time, event (start | finish), player id (a random number kept in the player's browser), threat, score, won.
if (!defined('HH')) { http_response_code(404); exit; }

const HH_DATA = __DIR__ . '/../.hh-data';
const HH_THREATS = ['elephants', 'buffalo', 'boulders'];
date_default_timezone_set('America/Los_Angeles');

function hh_dir(): string {
  if (!is_dir(HH_DATA)) @mkdir(HH_DATA, 0700, true);
  $ht = HH_DATA . '/.htaccess';
  if (!is_file($ht)) @file_put_contents($ht, "Require all denied\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");
  return HH_DATA;
}
function hh_log(): string { return hh_dir() . '/plays.log'; }
function hh_append(array $row): bool {
  return file_put_contents(hh_log(), implode("\t", $row) . "\n", FILE_APPEND | LOCK_EX) !== false;
}
function hh_rows(): array {
  $f = hh_log(); $out = [];
  if (!is_file($f) || !($h = fopen($f, 'r'))) return $out;
  flock($h, LOCK_SH);
  while (($l = fgets($h)) !== false) { $p = explode("\t", rtrim($l, "\n")); if (count($p) >= 6) $out[] = $p; }
  flock($h, LOCK_UN); fclose($h);
  return $out;
}
// small JSON files in the data folder (the admin password hash, failed logins)
function hh_json_get(string $name): array {
  $f = hh_dir() . '/' . $name;
  $d = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
  return is_array($d) ? $d : [];
}
function hh_json_put(string $name, array $data): void {
  file_put_contents(hh_dir() . '/' . $name, json_encode($data), LOCK_EX);
}
