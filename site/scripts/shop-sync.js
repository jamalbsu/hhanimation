// Reads the shop's products from Printify and saves what the site shows:
//   npm run shop-sync                   → data/shop.json, and src/shop/<product>/ (mockup pictures)
//   npm run shop-sync -- --shop <id>    → the same, from that Printify shop (only needed if you have several)
// The Printify token stays on the server: this asks the server's PHP, over SSH, to read Printify and send back the
// product data (titles, descriptions, enabled colors and sizes, retail prices, mockups and US shipping costs).
// Run it again after changing a product in Printify, then build and deploy.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const sharp = require('sharp');
const { at, config, slug } = require('./lib');

const DOC = 'public_html/website_adbe171a';
const TARGET = process.env.HAPPYHILLZ_SSH_TARGET || 'happyhillz';
const PORT = process.env.HAPPYHILLZ_SSH_PORT;
const cfg = config();
const shopCfg = cfg.shop || {};
const argShop = (() => { const i = process.argv.indexOf('--shop'); return i > 0 ? process.argv[i + 1] : null; })();
const wantShop = argShop || shopCfg.printifyShopId || null;

// ---- 1. ask the server to read Printify ---------------------------------------
function fromServer() {
  const php = `<?php
$k = json_decode((string)@file_get_contents(getenv('HOME') . '/${DOC}/.hh-data/shop.json'), true) ?: [];
if (empty($k['printify_token'])) { echo json_encode(['error' => 'no Printify token on the server yet; run "npm run shop-keys" first']); exit; }
function pf($path) {
  global $k;
  $ch = curl_init('https://api.printify.com/v1/' . $path);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $k['printify_token'], 'User-Agent: PHP-shop/1.0']]);
  $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
  if ($code !== 200) { echo json_encode(['error' => "Printify answered HTTP $code for $path", 'body' => substr((string)$raw, 0, 300)]); exit; }
  return json_decode((string)$raw, true);
}
$shops = pf('shops.json');
$want = ${JSON.stringify(wantShop === null ? null : String(wantShop))};
$shop = null;
foreach ($shops as $s) if ($want !== null && (string)$s['id'] === $want) $shop = $s;
if ($want === null && count($shops) === 1) $shop = $shops[0];
if (!$shop) { echo json_encode(['error' => $want === null ? 'several Printify shops; pick one with: npm run shop-sync -- --shop <id>' : "no Printify shop $want", 'shops' => array_map(fn($s) => ['id' => $s['id'], 'title' => $s['title'], 'channel' => $s['sales_channel'] ?? ''], $shops)]); exit; }
$products = [];
for ($page = 1; $page <= 20; $page++) {
  $r = pf("shops/{$shop['id']}/products.json?limit=50&page=$page");
  foreach ($r['data'] ?? [] as $p) $products[] = $p;
  if ($page >= (int)($r['last_page'] ?? 1)) break;
}
// What Printify actually charges for standard US shipping. Its catalog shipping table can be out of date
// (it said $3.99 + $2.09 for the tee; orders cost $5.35 + $2.40), so ask the order calculator for 1 and 2 of
// one variant from each group of variants the table prices alike. The price was the same to every state.
function pfPost($path, $body) {
  global $k;
  $ch = curl_init('https://api.printify.com/v1/' . $path);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40, CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($body),
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $k['printify_token'], 'User-Agent: PHP-shop/1.0', 'Content-Type: application/json']]);
  $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
  if ($code !== 200) { echo json_encode(['error' => "Printify answered HTTP $code for $path", 'body' => substr((string)$raw, 0, 300)]); exit; }
  return json_decode((string)$raw, true);
}
$addr = ['first_name' => 'Price', 'last_name' => 'Check', 'email' => 'price-check@example.com', 'phone' => '+18165550100', 'country' => 'US', 'region' => 'MO', 'address1' => '1 Main St', 'address2' => '', 'city' => 'Kansas City', 'zip' => '64105'];
$shipping = []; $measured = [];
foreach ($products as $p) {
  $key = $p['blueprint_id'] . '-' . $p['print_provider_id'];
  if (!isset($shipping[$key])) $shipping[$key] = pf("catalog/blueprints/{$p['blueprint_id']}/print_providers/{$p['print_provider_id']}/shipping.json");
  $groups = [];
  foreach ($p['variants'] as $v) {
    if (!$v['is_enabled']) continue;
    $g = 'none';
    foreach ($shipping[$key]['profiles'] ?? [] as $i => $prof) if (in_array($v['id'], $prof['variant_ids'] ?? [], true) && in_array('US', $prof['countries'] ?? [], true)) { $g = (string)$i; break; }
    $groups[$g][] = $v['id'];
  }
  foreach ($groups as $ids) {
    $cost = [];
    foreach ([1, 2] as $q) $cost[$q] = (int)(pfPost("shops/{$shop['id']}/orders/shipping.json", ['line_items' => [['product_id' => $p['id'], 'variant_id' => $ids[0], 'quantity' => $q]], 'address_to' => $addr])['standard'] ?? 0);
    foreach ($ids as $id) $measured[$p['id']][$id] = [$cost[1], $cost[2] - $cost[1]];
  }
}
echo json_encode(['shop' => ['id' => $shop['id'], 'title' => $shop['title'], 'channel' => $shop['sales_channel'] ?? ''], 'products' => $products, 'shipping' => $shipping, 'measured' => $measured]);
`;
  const opts = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20', ...(PORT ? ['-p', PORT] : [])];
  return new Promise((resolve, reject) => {
    const child = spawn('ssh', [...opts, TARGET, 'php'], { stdio: ['pipe', 'pipe', 'inherit'] });
    let buf = '';
    child.stdout.on('data', d => { buf += d; });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(new Error(`ssh exit ${code}: ${buf.slice(0, 300)}`));
      try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error(`unexpected answer from the server: ${buf.slice(0, 300)}`)); }
    });
    child.stdin.end(php);
  });
}

// ---- 2. Printify's HTML description -> paragraphs and bullet points ------------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', bull: '•', deg: '°', reg: '®', trade: '™', copy: '©' };
const decode = s => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : (ENT[e.toLowerCase()] ?? m));
// Printify writes lists as lines starting with "- " or ".: " (often under a line like "Product features"),
// so this reads the text line by line: blocks are { p: text } or { h: heading or "", ul: [items] }.
// It drops "see the size chart below": that chart is something marketplaces add, and this site has none.
function describe(html) {
  const text = decode(String(html || '')
    .replace(/<(table|style|script)[\s\S]*?<\/\1>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ').replace(/<br\s*\/?>|<\/?(p|div|h\d|ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' '));
  const lines = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim());
  const blocks = [];
  let para = [];
  const endPara = () => {
    const t = para.join(' ').replace(/\s*Check the size chart below\.?\s*/gi, ' ').trim();
    if (t.length > 1) blocks.push({ p: t });
    para = [];
  };
  for (const l of lines) {
    const item = l.match(/^(?:-|\.:|•|\*)\s*(.+)$/);
    if (!l) { endPara(); continue; }
    if (!item) { para.push(l); continue; }
    const last = blocks[blocks.length - 1];
    if (para.length === 1 && para[0].length <= 40 && !/[.!?]$/.test(para[0])) { blocks.push({ h: para[0].replace(/:$/, ''), ul: [] }); para = []; }   // a "Product features" line heads the list
    else if (para.length || !last || !last.ul) { endPara(); blocks.push({ h: '', ul: [] }); }
    blocks[blocks.length - 1].ul.push(item[1]);
  }
  endPara();
  return { blocks };
}

// ---- 3. one product -> what the site needs ---------------------------------------
// standard US shipping as Printify's order calculator priced it: [first item, each additional item], in cents
const shippingFor = (measured, variantId) => {
  const c = measured?.[variantId];
  return c && c[0] > 0 && c[1] >= 0 ? c : null;
};

function shape(p, measured) {
  // A variant's option values aren't always in the product's option order (the tee lists Sizes, Colors but
  // its variants say [color, size]), so each value is put back under the option it belongs to.
  const owner = new Map();
  (p.options || []).forEach((o, i) => (o.values || []).forEach(x => owner.set(x.id, i)));
  const inOrder = v => {
    const out = (p.options || []).map((_, i) => v.options.find(id => owner.get(id) === i));
    if (out.some(id => id === undefined)) throw new Error(`"${p.title}": variant ${v.id} (${v.title}) doesn't have a value for every option`);
    return out;
  };
  const variants = (p.variants || []).filter(v => v.is_enabled).map(v => ({
    id: v.id, title: v.title, sku: v.sku || '', price: v.price, options: inOrder(v), available: v.is_available !== false,
    ship: shippingFor(measured, v.id),
  }));
  const used = new Set(variants.flatMap(v => v.options));
  const options = (p.options || []).map(o => ({
    name: o.name, type: o.type,
    values: (o.values || []).filter(x => used.has(x.id)).map(x => ({ id: x.id, title: x.title, ...(x.colors?.length ? { hex: x.colors[0] } : {}) })),
  }));
  const colorAt = options.findIndex(o => o.type === 'color');
  const groupOf = v => (colorAt >= 0 ? v.options[colorAt] : 0);
  const groups = colorAt >= 0 ? options[colorAt].values.map(x => x.id) : [0];
  // the mockups chosen for publishing, a few per color, default picture first
  const per = shopCfg.imagesPerColor || 4, seen = new Set(), images = [];
  const pics = (p.images || []).filter(i => i.is_selected_for_publishing !== false).sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
  for (const g of groups) {
    const ids = new Set(variants.filter(v => groupOf(v) === g).map(v => v.id));
    let n = 0;
    for (const i of pics) {
      if (n >= per || !(i.variant_ids || []).some(id => ids.has(id))) continue;
      n++;
      if (seen.has(i.src)) { images.find(x => x.src === i.src).groups.push(g); continue; }
      seen.add(i.src);
      images.push({ src: i.src, file: crypto.createHash('sha1').update(i.src).digest('hex').slice(0, 12), position: i.position || '', groups: [g] });
    }
  }
  const def = variants.find(v => (p.variants || []).find(x => x.id === v.id)?.is_default && v.available) || variants.find(v => v.available) || variants[0];
  // Marketplace titles run long ("Tee | Happy Hills Cartoon Game Merch | Run With The Pack Graphic Shirt"): the site uses the first part
  const title = p.title.split(/\s+\|\s+/)[0].trim();
  return {
    id: p.id, title, printifyTitle: p.title.trim(), slug: (shopCfg.slugs || {})[p.id] || slug(title), ...describe(p.description), tags: p.tags || [],
    blueprintId: p.blueprint_id, printProviderId: p.print_provider_id, colorOption: colorAt, defaultVariant: def?.id ?? null,
    options, variants, images,
  };
}

// ---- 4. pictures --------------------------------------------------------------------
async function pictures(prod) {
  const dir = at('src/shop', prod.slug);
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(['share.jpg']);
  for (const img of prod.images) {
    keep.add(`${img.file}.webp`); keep.add(`${img.file}.jpg`);
    if (fs.existsSync(path.join(dir, `${img.file}.webp`)) && fs.existsSync(path.join(dir, `${img.file}.jpg`))) continue;
    const res = await fetch(img.src);
    if (!res.ok) throw new Error(`could not download ${img.src} (HTTP ${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).resize(1000, 1000, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(dir, `${img.file}.webp`));
    await sharp(buf).resize(600, 600, { fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(dir, `${img.file}.jpg`));
  }
  // the share picture: the default mockup on the site's paper color, 1200x630
  const first = prod.images[0];
  if (first) {
    const art = await sharp(path.join(dir, `${first.file}.webp`)).resize(600, 600, { fit: 'contain', background: '#fff6e0' }).toBuffer();
    await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#fff6e0' } }).composite([{ input: art, left: 300, top: 15 }]).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(dir, 'share.jpg'));
  }
  for (const f of fs.readdirSync(dir)) if (!keep.has(f)) fs.rmSync(path.join(dir, f));   // pictures Printify no longer has
}

(async () => {
  const r = await fromServer();
  if (r.error) {
    for (const s of r.shops || []) console.error(`  shop ${s.id}: ${s.title} (${s.channel || 'no sales channel'})`);
    throw new Error(r.error + (r.body ? `: ${r.body}` : ''));
  }
  const hide = new Set((shopCfg.hideProducts || []).map(String));
  const products = r.products.filter(p => !hide.has(String(p.id))).map(p => shape(p, r.measured[p.id]))
    .filter(p => p.variants.length && p.images.length);
  for (const p of products) {
    const noShip = p.variants.filter(v => !v.ship);
    if (noShip.length) throw new Error(`"${p.title}": Printify has no US shipping price for ${noShip.map(v => v.title).join(', ')}`);
    await pictures(p);
  }
  // product folders for products that are gone
  for (const d of fs.existsSync(at('src/shop')) ? fs.readdirSync(at('src/shop')) : []) {
    if (!products.some(p => p.slug === d)) fs.rmSync(at('src/shop', d), { recursive: true, force: true });
  }
  const data = { synced: new Date().toISOString(), shop: r.shop, products: products.map(({ images, ...p }) => ({ ...p, images: images.map(({ src, ...i }) => i) })) };
  fs.writeFileSync(at('data/shop.json'), JSON.stringify(data, null, 2) + '\n');
  console.log(`Printify shop ${r.shop.id}: ${r.shop.title} (${r.shop.channel || 'no sales channel'})`);
  for (const p of products) {
    const prices = p.variants.map(v => v.price);
    console.log(`  ${p.title}: /shop/${p.slug}/, ${p.variants.length} variants, $${(Math.min(...prices) / 100).toFixed(2)}–$${(Math.max(...prices) / 100).toFixed(2)}, ${p.images.length} pictures`);
  }
  if (!products.length) console.log('  no products with enabled variants and mockups');
  console.log('wrote data/shop.json; now run "npm run build"');
})().catch(err => { console.error(err.message || err); process.exit(1); });
