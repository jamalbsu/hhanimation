<?php
// POST /api/stripe-webhook.php — Stripe calls this when a checkout finishes.
// A paid order becomes a Printify order with the shopper's size, color and address. Printify holds new
// orders for its approval window (24 hours by default) before printing, so an order can still be cancelled there.
//  - Test-mode payments never create a Printify order: Printify is only asked to price the shipping for the
//    same items and address, which checks the product, variant and address without ordering anything.
//  - The order's external_id comes from the Checkout Session, so a retried webhook can't order twice.
//  - If Printify fails, this answers 500 and Stripe retries (for up to three days).
define('HH', 1);
require __DIR__ . '/shop-lib.php';
shop_headers();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') shop_out(405, ['error' => 'Use POST.']);

$payload = (string)file_get_contents('php://input', false, null, 0, 512 * 1024);
$keys = shop_keys();
if (!stripe_signature_ok($payload, (string)($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? ''), (string)($keys['stripe_webhook_secret'] ?? ''))) {
  shop_log(['event' => 'webhook_bad_signature']);
  shop_out(400, ['error' => 'bad signature']);
}
$event = json_decode($payload, true);
$type = (string)($event['type'] ?? '');
if (!in_array($type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) shop_out(200, ['ignored' => $type]);

// Read the session fresh from Stripe (pinned API version), rather than trusting the event body's shape.
$sid = (string)($event['data']['object']['id'] ?? '');
[$code, $s] = stripe_api('GET', 'checkout/sessions/' . rawurlencode($sid));
if ($code !== 200) {
  shop_log(['event' => 'webhook_session_unreadable', 'session' => $sid, 'http' => $code]);
  shop_out(500, ['error' => 'could not read the session']);
}
if (($s['payment_status'] ?? '') !== 'paid') {   // e.g. a bank debit still clearing; async_payment_succeeded follows
  shop_log(['event' => 'webhook_not_paid_yet', 'session' => $sid]);
  shop_out(200, ['waiting' => 'payment']);
}

$order = shop_printify_order($s);
$cat = shop_catalog();
$shopId = (string)($cat['shopId'] ?? '');
$live = !empty($s['livemode']);
if (!$order || $shopId === '') {
  shop_log(['event' => 'webhook_no_order', 'session' => $sid, 'live' => $live]);
  shop_out(500, ['error' => 'this session has no shop item or address']);
}

if (!$live) {
  [$pc, $pr] = printify_api('POST', "shops/$shopId/orders/shipping.json", ['line_items' => $order['line_items'], 'address_to' => $order['address_to']]);
  $ok = $pc === 200;
  shop_log(['event' => 'test_order', 'session' => $sid, 'printify_check' => $ok ? 'accepted' : 'refused', 'http' => $pc,
    'shipping' => $ok ? $pr : null, 'error' => $ok ? null : ($pr['message'] ?? $pr['errors'] ?? null), 'item' => $order['line_items'][0]]);
  shop_out(200, ['test' => true, 'printify_check' => $ok]);
}

[$pc, $pr] = printify_api('POST', "shops/$shopId/orders.json", $order);
if ($pc === 200 || $pc === 201) {
  shop_log(['event' => 'order_sent', 'session' => $sid, 'printify_order' => $pr['id'] ?? null, 'item' => $order['line_items'][0], 'total' => $s['amount_total'] ?? null]);
  shop_out(200, ['ok' => true]);
}
if ($pc === 409) {   // this session's order already exists
  shop_log(['event' => 'order_already_sent', 'session' => $sid]);
  shop_out(200, ['ok' => true, 'duplicate' => true]);
}
shop_log(['event' => 'order_failed', 'session' => $sid, 'http' => $pc, 'error' => $pr['message'] ?? $pr['errors'] ?? null, 'item' => $order['line_items'][0]]);
shop_out(500, ['error' => 'Printify did not take the order']);
