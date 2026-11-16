<?php
// The shop's server side, shared by /api/checkout.php, /api/shop-status.php and /api/stripe-webhook.php.
//  - The keys (Stripe secret, publishable and webhook keys, and the Printify token) are in .hh-data/shop.json.
//    "npm run shop-keys" puts them there over SSH; they are never in git or in the built site.
//  - What can be bought, and for how much, comes from shop-catalog.php, which the build writes from
//    data/shop.json. Prices are never taken from the browser.
if (!defined('HH')) { http_response_code(404); exit; }
require_once __DIR__ . '/hh-store.php';

const STRIPE_VERSION = '2026-03-25.dahlia';   // pinned: ui_mode "embedded_page" and shipping in collected_information
const SHOP_UA = 'PHP-shop/1.0';

function shop_keys(): array { return hh_json_get('shop.json'); }
function shop_catalog(): array { $c = require __DIR__ . '/shop-catalog.php'; return is_array($c) ? $c : []; }

function shop_out(int $code, array $body): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($body);
  exit;
}
function shop_headers(): void {
  header('Cache-Control: no-store');
  header('X-Robots-Tag: noindex');
  header('X-Content-Type-Options: nosniff');
}

// One line per event in .hh-data/shop.log: ids, amounts and results only (no names, emails or addresses).
function shop_log(array $row): void {
  $f = hh_dir() . '/shop.log';
  if (is_file($f) && filesize($f) > 20 * 1024 * 1024) return;
  file_put_contents($f, json_encode(['t' => date('c')] + $row) . "\n", FILE_APPEND | LOCK_EX);
}

function shop_http(string $method, string $url, array $headers, ?string $body = null): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers,
    CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 30,
  ]);
  if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
  $raw = curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  $json = is_string($raw) ? json_decode($raw, true) : null;
  return [$code, is_array($json) ? $json : [], $err];
}

// Stripe takes form-encoded parameters; nested arrays become line_items[0][price_data][...].
function stripe_api(string $method, string $path, array $params = []): array {
  $key = (string)(shop_keys()['stripe_secret_key'] ?? '');
  $q = http_build_query($params, '', '&');
  $url = 'https://api.stripe.com/v1/' . $path . ($method === 'GET' && $q !== '' ? '?' . $q : '');
  return shop_http($method, $url, [
    'Authorization: Bearer ' . $key, 'Stripe-Version: ' . STRIPE_VERSION, 'Content-Type: application/x-www-form-urlencoded',
  ], $method === 'GET' ? null : $q);
}

function printify_api(string $method, string $path, ?array $body = null): array {
  $token = (string)(shop_keys()['printify_token'] ?? '');
  return shop_http($method, 'https://api.printify.com/v1/' . $path, [
    'Authorization: Bearer ' . $token, 'User-Agent: ' . SHOP_UA, 'Content-Type: application/json',
  ], $body === null ? null : json_encode($body));
}

// Checkout stays closed until the webhook secret is stored too: without it a paid order would never reach Printify.
function shop_ready(): bool {
  $k = shop_keys();
  return !empty($k['stripe_secret_key']) && !empty($k['stripe_publishable_key']) && !empty($k['stripe_webhook_secret']);
}

// Requests from other sites can't start checkouts here.
function shop_same_origin(array $cat): void {
  $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
  if ($origin !== '' && $origin !== ($cat['site'] ?? '')) shop_out(403, ['error' => 'Checkout only works on ' . ($cat['site'] ?? 'this site') . '.']);
}

// Stripe signs each webhook: "t=<time>,v1=<hex hmac of '<time>.<body>'>"; older than 5 minutes is refused.
function stripe_signature_ok(string $payload, string $header, string $secret, int $tolerance = 300): bool {
  if ($secret === '' || $header === '') return false;
  $t = null; $sigs = [];
  foreach (explode(',', $header) as $part) {
    $kv = explode('=', trim($part), 2);
    if (count($kv) !== 2) continue;
    if ($kv[0] === 't') $t = $kv[1];
    elseif ($kv[0] === 'v1') $sigs[] = $kv[1];
  }
  if ($t === null || !ctype_digit($t) || !$sigs || abs(time() - (int)$t) > $tolerance) return false;
  $expected = hash_hmac('sha256', $t . '.' . $payload, $secret);
  foreach ($sigs as $s) if (hash_equals($expected, $s)) return true;
  return false;
}

// A paid Checkout Session -> the Printify order (line items and the address to ship to).
function shop_printify_order(array $session): ?array {
  $m = $session['metadata'] ?? [];
  $ship = $session['collected_information']['shipping_details'] ?? ($session['shipping_details'] ?? null);
  $addr = $ship['address'] ?? null;
  if (empty($m['printify_product']) || empty($m['printify_variant']) || !$addr) return null;
  $name = trim((string)($ship['name'] ?? ($session['customer_details']['name'] ?? '')));
  $parts = preg_split('/\s+/', $name) ?: [];
  $last = count($parts) > 1 ? array_pop($parts) : ($parts[0] ?? '');
  $first = $parts ? implode(' ', $parts) : $last;
  return [
    'external_id' => 'hh-' . substr(hash('sha256', (string)$session['id']), 0, 20),   // the same session can never order twice
    'label' => 'happyhillz ' . substr((string)$session['id'], -8),
    'line_items' => [[
      'product_id' => (string)$m['printify_product'],
      'variant_id' => (int)$m['printify_variant'],
      'quantity' => max(1, (int)($m['qty'] ?? 1)),
    ]],
    'shipping_method' => 1,
    'send_shipping_notification' => true,
    'address_to' => [
      'first_name' => $first, 'last_name' => $last,
      'email' => (string)($session['customer_details']['email'] ?? ''),
      'phone' => (string)($session['customer_details']['phone'] ?? ''),
      'country' => (string)($addr['country'] ?? ''), 'region' => (string)($addr['state'] ?? ''),
      'address1' => (string)($addr['line1'] ?? ''), 'address2' => (string)($addr['line2'] ?? ''),
      'city' => (string)($addr['city'] ?? ''), 'zip' => (string)($addr['postal_code'] ?? ''),
    ],
  ];
}
