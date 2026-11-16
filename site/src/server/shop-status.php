<?php
// GET /api/shop-status.php?session_id=cs_...
// What the thank-you page shows after Stripe sends the shopper back: whether the order went through,
// and the email address the receipt goes to.
define('HH', 1);
require __DIR__ . '/shop-lib.php';
shop_headers();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') shop_out(405, ['error' => 'Use GET.']);

$id = (string)($_GET['session_id'] ?? '');
if (!preg_match('/^cs_(test|live)_[A-Za-z0-9]{10,200}$/', $id)) shop_out(400, ['error' => 'No order to look up.']);
if (!shop_ready()) shop_out(503, ['error' => 'The shop is not open yet.']);

[$code, $s] = stripe_api('GET', 'checkout/sessions/' . $id);
if ($code !== 200) shop_out($code === 404 ? 404 : 502, ['error' => 'That order could not be found.']);
shop_out(200, [
  'status' => (string)($s['status'] ?? ''),                       // open | complete | expired
  'paid' => ($s['payment_status'] ?? '') === 'paid',
  'email' => (string)($s['customer_details']['email'] ?? ''),
  'total' => (int)($s['amount_total'] ?? 0),
  'test' => empty($s['livemode']),
]);
