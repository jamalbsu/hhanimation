<?php
// POST /api/play.php  {"id": 32 hex, "event": "start"|"finish", "threat": ..., "score": n, "won": bool}
// Pack Run sends one when a round starts and one when it ends. Nothing personal is stored: no IP, no cookie.
define('HH', 1);
require __DIR__ . '/hh-store.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$d = json_decode((string)file_get_contents('php://input', false, null, 0, 512), true);
if (!is_array($d)) { http_response_code(400); exit; }
$id = (string)($d['id'] ?? ''); $ev = (string)($d['event'] ?? ''); $th = (string)($d['threat'] ?? '');
if (!preg_match('/^[a-f0-9]{32}$/', $id) || !in_array($ev, ['start', 'finish'], true) || !in_array($th, HH_THREATS, true)) { http_response_code(400); exit; }
$score = $ev === 'finish' ? max(0, min(100000, (int)($d['score'] ?? 0))) : 0;
$won = $ev === 'finish' && !empty($d['won']) ? 1 : 0;

// a ceiling, so a broken or hostile client can't fill the disk
if (is_file(hh_log()) && filesize(hh_log()) > 50 * 1024 * 1024) { http_response_code(507); exit; }
hh_append([time(), $ev, $id, $th, $score, $won]);
http_response_code(204);
