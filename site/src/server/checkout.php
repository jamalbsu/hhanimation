<?php
// POST /api/checkout.php  {"product": "<printify product id>", "variant": <variant id>, "qty": 1..}
// Starts a Stripe Checkout Session for one shop item and returns what the page needs to show
// Stripe's embedded checkout: {"clientSecret": ..., "publishableKey": ...}.
// The price and the shipping charge come from the catalog on the server, never from the browser.
define('HH', 1);
require __DIR__ . '/shop-lib.php';
shop_headers();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') shop_out(405, ['error' => 'Use POST.']);

$cat = shop_catalog();
shop_same_origin($cat);
if (!shop_ready() || empty($cat['products'])) shop_out(503, ['error' => 'The shop is not open yet. Please check back soon.']);

$in = json_decode((string)file_get_contents('php://input', false, null, 0, 2048), true);
$pid = (string)($in['product'] ?? '');
$vid = (string)($in['variant'] ?? '');
$qty = (int)($in['qty'] ?? 1);
$p = $cat['products'][$pid] ?? null;
$v = $p['variants'][$vid] ?? null;
if (!$p || !$v || $qty < 1 || $qty > (int)($cat['maxQty'] ?? 5)) shop_out(400, ['error' => 'That item is not available.']);
if (empty($v['available'])) shop_out(409, ['error' => 'That one is sold out right now. Please pick another size or color.']);

$item = ['printify_product' => $pid, 'printify_variant' => $vid, 'qty' => (string)$qty, 'item' => $p['title'] . ' / ' . $v['title']];
$shipping = (int)$v['ship'][0] + ($qty - 1) * (int)$v['ship'][1];
$params = [
  'ui_mode' => 'embedded_page',
  'mode' => 'payment',
  'return_url' => $cat['site'] . '/shop/thanks/?session_id={CHECKOUT_SESSION_ID}',
  'line_items' => [[
    'quantity' => $qty,
    'price_data' => [
      'currency' => 'usd',
      'unit_amount' => (int)$v['price'],
      'product_data' => ['name' => $p['title'], 'description' => $v['title'], 'images' => [$v['image']]],
    ],
  ]],
  'shipping_address_collection' => ['allowed_countries' => $cat['countries']],
  'shipping_options' => [[
    'shipping_rate_data' => [
      'type' => 'fixed_amount',
      'display_name' => 'Standard shipping',
      'fixed_amount' => ['amount' => $shipping, 'currency' => 'usd'],
      'delivery_estimate' => [
        'minimum' => ['unit' => 'business_day', 'value' => (int)$cat['delivery'][0]],
        'maximum' => ['unit' => 'business_day', 'value' => (int)$cat['delivery'][1]],
      ],
    ],
  ]],
  'phone_number_collection' => ['enabled' => 'true'],   // the print partner's carriers ask for one
  'metadata' => $item,
  'payment_intent_data' => ['metadata' => $item, 'description' => $item['item'] . ' x' . $qty],
];
if (!empty($cat['tax'])) $params['automatic_tax'] = ['enabled' => 'true'];

[$code, $s, $err] = stripe_api('POST', 'checkout/sessions', $params);
if ($code !== 200 || empty($s['client_secret'])) {
  shop_log(['event' => 'checkout_failed', 'http' => $code, 'error' => $s['error']['message'] ?? $err]);
  shop_out(502, ['error' => 'Checkout could not start. Please try again in a minute.']);
}
shop_out(200, ['clientSecret' => $s['client_secret'], 'publishableKey' => (string)shop_keys()['stripe_publishable_key']]);
