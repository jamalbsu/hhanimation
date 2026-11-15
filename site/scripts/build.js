// Builds the site into dist/. HostGator serves the folder as is; the only server code is the PHP in /api/
// (the game's play counter and the shop's checkout) and the admin page.
//   npm run build
// Pages: / (landing), /episodes/ (all episodes), /episodes/<slug>/ (one per episode),
// /games/ (all games), /games/pack-run/ (the Pack Run game),
// /shop/ (merch), /shop/<product>/ (one per product), /shop/thanks/ (after paying), 404.html.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const sharp = require('sharp');
const { at, config, readJson, slug, visibleEpisodes, pickFeatured, findEpisode } = require('./lib');

const cfg = config();
const SITE = cfg.siteUrl;
const DIST = at('dist');
const all = readJson('data/videos.json').episodes;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = p => fs.readFileSync(at(p), 'utf8');
const write = (p, body) => { fs.mkdirSync(path.dirname(path.join(DIST, p)), { recursive: true }); fs.writeFileSync(path.join(DIST, p), body); };
const copy = (from, to) => { fs.mkdirSync(path.dirname(path.join(DIST, to)), { recursive: true }); fs.copyFileSync(at(from), path.join(DIST, to)); };
const abs = p => SITE + p;

// ---- formatting ------------------------------------------------------------
const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const isoDuration = s => `PT${Math.floor(s / 60) ? `${Math.floor(s / 60)}M` : ''}${s % 60}S`;
const longDate = iso => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' });
const day = iso => new Date(iso).toISOString().slice(0, 10);
// Meta descriptions: whole words, at most ~155 characters.
function summary(text, max = 155) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.!?-]+$/, '') + '…';
}
const paragraphs = text => String(text || '').split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');

// Small seeded generator so the drawn shapes come out the same on every build.
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// A comic starburst: uneven spikes around an ellipse, like the show's pop words.
function burst(seed, spikes = 13) {
  const r = rng(seed), w = 240, h = 150, pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const k = i % 2 ? 0.63 + r() * 0.07 : 0.84 + r() * 0.16;
    pts.push(`${(w / 2 + Math.cos(a) * (w / 2 - 4) * k).toFixed(1)},${(h / 2 + Math.sin(a) * (h / 2 - 4) * k).toFixed(1)}`);
  }
  return `<svg class="burst__shape" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><polygon points="${pts.join(' ')}"/></svg>`;
}

// The line of flat-topped acacias on the hero's horizon. Smaller trees are farther and hazier.
function horizon() {
  const r = rng(24), W = 1600, H = 220;
  const trees = [70, 250, 430, 640, 830, 1010, 1190, 1380, 1540].map(x => ({ x: x + (r() - 0.5) * 70, s: 0.42 + r() * 0.62 }));
  trees.sort((a, b) => a.s - b.s);
  const g = trees.map(({ x, s }) => `<g transform="translate(${x.toFixed(0)} ${H}) scale(${s.toFixed(2)})" opacity="${(0.3 + s * 0.55).toFixed(2)}">` +
    '<path d="M0 0V-74M0-64L-36-116M0-74L32-122M-13-84L-5-120" stroke="#7a5230" stroke-width="7" stroke-linecap="round" fill="none"/>' +
    '<ellipse cx="-6" cy="-128" rx="94" ry="22" fill="#647d30"/><ellipse cx="-32" cy="-119" rx="60" ry="14" fill="#566e28"/><ellipse cx="16" cy="-137" rx="64" ry="14" fill="#7f9742"/></g>').join('');
  return `<svg class="horizon" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" focusable="false">${g}</svg>`;
}

const ICON_PLAY = '<svg class="i" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5.6 9.4 5 1.5 9.4z"/></svg>';
const ICON_CLOSE = '<svg class="i" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.6.4.4 1.6 3.8 5 .4 8.4l1.2 1.2L5 6.2l3.4 3.4 1.2-1.2L6.2 5l3.4-3.4L8.4.4 5 3.8z"/></svg>';
const ICON_PAUSE = '<svg class="i" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 1h2.6v8H1.5zM5.9 1h2.6v8H5.9z"/></svg>';
const ICON_SOUND_OFF = '<svg class="i i-off" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M1.5 7H6l5-4.2v14.4L6 13H1.5z"/><path d="m13.6 7.4 5 5.2m0-5.2-5 5.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const ICON_SOUND_ON = '<svg class="i i-on" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M1.5 7H6l5-4.2v14.4L6 13H1.5z"/><path d="M13.8 6.6a4.8 4.8 0 0 1 0 6.8M16.4 4a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const PAW = '<svg class="game__paw" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><ellipse cx="12" cy="16.2" rx="5.4" ry="4.5"/><ellipse cx="4.9" cy="10.2" rx="2.3" ry="2.9"/><ellipse cx="9.3" cy="5.6" rx="2.3" ry="3"/><ellipse cx="14.7" cy="5.6" rx="2.3" ry="3"/><ellipse cx="19.1" cy="10.2" rx="2.3" ry="2.9"/></svg>';

// {{name}} placeholders in a page template; an unknown name stops the build
function fill(tpl, vars, name) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`${name} uses {{${k}}}, which the build does not define`);
    return vars[k];
  });
}

// ---- content ---------------------------------------------------------------
const channelUrl = `https://www.youtube.com/${cfg.channel.handle}`;
const subscribeUrl = `${channelUrl}?sub_confirmation=1`;
const SERIES = cfg.series;

const hero = findEpisode(all, cfg.trailer.episode);
if (!hero) throw new Error(`trailer episode "${cfg.trailer.episode}" is not in data/videos.json; run "npm run videos"`);
// Latest episode first: by episode number, then upload time (several episodes can go up the same day, in any order).
const shown = visibleEpisodes(cfg, all).sort((a, b) => (b.ep || 0) - (a.ep || 0) || (b.published || '').localeCompare(a.published || ''));
const inOrder = [...shown].sort((a, b) => (a.ep || 0) - (b.ep || 0) || (a.published || '').localeCompare(b.published || ''));
const featured = pickFeatured(cfg, all);
for (const ep of new Set([...shown, hero])) {
  for (const f of [`src/thumbs/${ep.shortId}.webp`, `src/share/${ep.slug}.jpg`]) if (!fs.existsSync(at(f))) throw new Error(`missing ${f} for "${ep.title}"; run "npm run videos"`);
  if (!ep.published || !ep.seconds) throw new Error(`"${ep.title}" has no date or length; run "npm run videos"`);
}

const pageOf = ep => `/episodes/${ep.slug}/`;
const fullName = ep => `${SERIES}: ${ep.title}`;
const watchUrl = ep => ep.longId ? `https://www.youtube.com/watch?v=${ep.longId}` : `https://www.youtube.com/shorts/${ep.shortId}`;
const embedId = ep => ep.longId || ep.shortId;
const playData = (ep, title = ep.title) =>
  `data-play data-title="${esc(title)}" data-short="${esc(ep.shortId)}"${ep.longId ? ` data-long="${esc(ep.longId)}"` : ''}`;
const epLabel = ep => ep.ep ? `Episode ${ep.ep}` : SERIES;

function card(ep, { play = false, meta = false } = {}) {
  return `      <li><a class="card" href="${pageOf(ep)}"${play ? ' ' + playData(ep) : ''}>
        <span class="card__art"><img src="/thumbs/${ep.shortId}.webp" alt="Scene from ${esc(ep.title)}" width="540" height="960" loading="lazy" decoding="async"><span class="card__play" aria-hidden="true">${ICON_PLAY}</span></span>
        <span class="card__title">${esc(ep.title)}</span>${meta ? `
        <span class="card__meta">${esc(epLabel(ep))} · ${clock(ep.seconds)}</span>` : ''}
      </a></li>`;
}

// ---- games -------------------------------------------------------------------
// Pack Run is src/games/pack-run/game.js with two pieces of the show put in at its markers: the panther rig
// (../panther/panther-rig.js, the same file every episode builder uses) and the elephants and buffalo of the
// episode engine (the "hoofed animals" section of the trailer episode).
const GAME = {
  path: '/games/pack-run/', name: 'Pack Run', published: '2026-11-14', updated: '2026-11-14',   // bump "updated" when the game changes
  shot: 'src/games/pack-run/shot.png', image: '/games/pack-run/share.jpg', card: '/games/pack-run/card.webp',
  // each threat, with the episode it comes from
  threats: [['elephants', 'Elephants', 'Head-On Elephant Herd'], ['buffalo', 'Buffalo', 'Buffalo Stampede'], ['boulders', 'Boulders', 'Rockslide']],
};
GAME.description = `${SERIES} game: play free online. Steer the pack past charging elephants, buffalo and boulders in a 45-second cartoon runner. No download.`;
GAME.pitch = `An elephant herd is charging head-on. Swipe the pack out of the way, jump the logs and grab the stars. It runs right here in your browser, on a phone or a computer.`;
const threatEps = GAME.threats.map(([key, label, title]) => {
  const ep = findEpisode(shown, title);
  if (!ep) throw new Error(`Pack Run links the "${label}" round to "${title}", which is not on the site`);
  return { key, label, ep };
});
function gameScript() {
  const rig = fs.readFileSync(path.join(at('..'), 'panther', 'panther-rig.js'), 'utf8');
  const engine = read(cfg.trailer.page), a = engine.indexOf('// ---- hoofed animals:'), b = engine.indexOf('const HERDS = ', a);
  if (a < 0 || b < 0) throw new Error(`${cfg.trailer.page} has no "hoofed animals" section for Pack Run`);
  let src = read('src/games/pack-run/game.js');
  for (const [mark, code] of [['//@@PANTHER_RIG@@', rig], ['//@@BEASTS@@', engine.slice(a, b)]]) {
    if (src.split(mark).length !== 2) throw new Error(`game.js must have exactly one ${mark}`);
    src = src.replace(mark, () => code);
  }
  new vm.Script(src, { filename: 'pack-run.js' });   // a syntax error stops the build here, not in a visitor's browser
  return src;
}
const gameJs = gameScript();
const gv = crypto.createHash('sha1').update(gameJs).digest('hex').slice(0, 8);

// ---- shop ---------------------------------------------------------------------------
// Products come from Printify ("npm run shop-sync" writes data/shop.json and the pictures in src/shop/).
// Payment is Stripe's embedded checkout; the PHP in src/server/ starts it and turns paid orders into Printify orders.
// The menu links the shop whenever it has products. Until "shop.public" is true it stays out of search:
// no homepage section, not in the sitemap, noindex.
const SHOP = { countries: ['US'], deliveryDays: [5, 12], maxQty: 5, ...(cfg.shop || {}) };
const shopFile = process.env.HH_SHOP_DATA || at('data/shop.json');   // the env variables are for trying the pages with sample data
const shopImg = process.env.HH_SHOP_IMG || at('src/shop');
const shopData = fs.existsSync(shopFile) ? JSON.parse(fs.readFileSync(shopFile, 'utf8')) : { products: [] };
const products = shopData.products || [];
const shopOn = products.length > 0;
const shopPublic = shopOn && SHOP.public === true;
if (shopPublic && !SHOP.contactEmail) throw new Error('set shop.contactEmail in site.config.json before making the shop public (the returns policy needs it)');
const money = c => `$${(c / 100).toFixed(2)}`;
const productPath = p => `/shop/${p.slug}/`;
const picture = (p, img, ext = 'webp') => `/shop/${p.slug}/${img.file}.${ext}`;
const groupOf = (p, v) => (p.colorOption >= 0 ? v.options[p.colorOption] : 0);
const firstPicture = (p, group) => p.images.find(i => i.groups.includes(group)) || p.images[0];
// color is picked first, then the rest (sizes), whatever order Printify lists them in
const optionOrder = p => (p.colorOption >= 0 ? [p.colorOption] : []).concat(p.options.map((_, i) => i).filter(i => i !== p.colorOption));
const optionLabel = o => (o.type === 'color' ? 'Color' : o.type === 'size' ? 'Size' : o.name);
const textOf = p => p.blocks.flatMap(b => (b.p ? [b.p] : b.ul));
const descHtml = p => p.blocks.map(b => b.p ? `          <p>${esc(b.p)}</p>`
  : `          ${b.h ? `<h2 class="product__h">${esc(b.h)}</h2>` : ''}<ul>${b.ul.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`).join('\n');
for (const p of products) {
  for (const img of p.images) for (const ext of ['webp', 'jpg']) {
    if (!fs.existsSync(path.join(shopImg, p.slug, `${img.file}.${ext}`))) throw new Error(`missing src/shop/${p.slug}/${img.file}.${ext}; run "npm run shop-sync"`);
  }
  if (!p.variants.some(v => v.id === p.defaultVariant)) p.defaultVariant = p.variants[0].id;
}
const shopJs = read('src/shop.js');
const sv = crypto.createHash('sha1').update(shopJs).digest('hex').slice(0, 8);

// ---- structured data ---------------------------------------------------------
const ORG = { '@type': 'Organization', '@id': `${SITE}/#org`, name: cfg.brand, url: `${SITE}/`, logo: { '@type': 'ImageObject', url: abs('/logo.png'), width: 512, height: 512 }, sameAs: [channelUrl] };
const SERIES_LD = { '@type': 'CreativeWorkSeries', '@id': `${SITE}/#series`, name: SERIES, url: `${SITE}/`, genre: ['Animation', 'Cartoon', 'Adventure'], inLanguage: 'en', creator: { '@id': `${SITE}/#org` }, sameAs: [channelUrl] };
const crumbs = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(url) })) });
function videoLd(ep) {
  return {
    '@type': 'VideoObject', '@id': `${abs(pageOf(ep))}#video`,
    name: fullName(ep), description: ep.description || `${fullName(ep)}, an animated cartoon from ${cfg.brand}.`,
    thumbnailUrl: [abs(`/share/${ep.slug}.jpg`), abs(`/thumbs/${ep.shortId}.webp`)],
    uploadDate: ep.published, duration: isoDuration(ep.seconds),
    embedUrl: `https://www.youtube.com/embed/${embedId(ep)}`, url: abs(pageOf(ep)),
    inLanguage: 'en', isFamilyFriendly: true, genre: 'Animation',
    ...(ep.tags && ep.tags.length ? { keywords: ep.tags.join(', ') } : {}),
    partOfSeries: { '@id': `${SITE}/#series` }, publisher: ORG,
  };
}
const ldScript = graph => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;

// ---- page shell --------------------------------------------------------------
const css = read('src/styles.css'), js = read('src/app.js');
const v = crypto.createHash('sha1').update(css + js).digest('hex').slice(0, 8);
const year = new Date().getFullYear();

const header = current => `<header class="bar">
  <div class="wrap bar__in">
    <a class="wordmark" href="/" aria-label="${esc(cfg.brand)}, home">${esc(cfg.brand)}</a>
    <nav class="bar__nav" aria-label="Main">
      <a class="bar__link" href="/episodes/"${current === 'episodes' ? ' aria-current="page"' : ''}>Episodes</a>
      <a class="bar__link" href="/games/"${current === 'games' ? ' aria-current="page"' : ''}>Games</a>${shopOn ? `
      <a class="bar__link" href="/shop/"${current === 'shop' ? ' aria-current="page"' : ''}>Shop</a>` : ''}
      <a class="bar__link" href="/#about">About</a>
      <a class="btn btn--pop btn--sm" href="${subscribeUrl}" target="_blank" rel="noopener">Subscribe</a>
    </nav>
  </div>
</header>`;

const footer = `<footer class="foot">
  <div class="wrap foot__in">
    <p><span class="wordmark wordmark--sm">${esc(cfg.brand)}</span> Original animated adventures, one short episode at a time.</p>
    <p><a href="/episodes/">All episodes</a> · <a href="/games/">Games</a> · ${shopOn ? '<a href="/shop/">Shop</a> · ' : ''}<a href="${channelUrl}" target="_blank" rel="noopener">YouTube: ${esc(cfg.channel.handle)}</a> · © ${year} ${esc(cfg.brand)}</p>
  </div>
</footer>`;

const dialog = `<dialog class="player" id="player" aria-labelledby="player-title">
  <div class="player__box">
    <div class="player__top">
      <h2 id="player-title">Episode</h2>
      <button class="player__close" type="button" aria-label="Close player">${ICON_CLOSE}</button>
    </div>
    <div class="player__frame"></div>
    <p class="player__more"><a href="${channelUrl}" target="_blank" rel="noopener">Open on YouTube</a></p>
  </div>
</dialog>`;

const verification = [
  cfg.searchVerification?.google && `<meta name="google-site-verification" content="${esc(cfg.searchVerification.google)}">`,
  cfg.searchVerification?.bing && `<meta name="msvalidate.01" content="${esc(cfg.searchVerification.bing)}">`,
].filter(Boolean).join('\n');

function page({ path: p, title, description, image = '/og.jpg', ogType = 'website', head = '', body, current, withDialog = false, noindex = false, ld }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${abs(p)}">`}
<meta name="theme-color" content="#0b0b0f">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(cfg.brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(p)}">
<meta property="og:image" content="${abs(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
${head}${p === '/' && verification ? verification + '\n' : ''}<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/comic-neue-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css?v=${v}">
<script src="/app.js?v=${v}" defer></script>
${ld ? ldScript(ld) + '\n' : ''}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(current)}
<main id="main">
${body}
</main>
${footer}
${withDialog ? dialog + '\n' : ''}</body>
</html>
`;
}

// ---- write dist ----------------------------------------------------------------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const pages = [];   // for the sitemap

// Home
{
  const vars = {
    subscribeUrl, horizon: horizon(), episodeCount: shown.length,
    cards: featured.map(ep => card(ep, { play: true })).join('\n'),
    heroHref: pageOf(hero), heroData: playData(hero, cfg.trailer.label), heroThumb: hero.shortId, trailerLabel: esc(cfg.trailer.label),
    burstNew: burst(3), burstA: burst(11), burstB: burst(29, 15), burstC: burst(47, 12), iconPlay: ICON_PLAY,
    gameHref: GAME.path, gameCard: GAME.card, gamePitch: esc(GAME.pitch), burstGame: burst(61, 12),
    shopTeaser: shopPublic ? shopTeaser() : '',
  };
  const body = fill(read('src/home.html'), vars, 'home.html');
  const description = `${SERIES} is a family-friendly animated cartoon about young panthers, a leopard and a jaguar on the run. Short adventure videos, new every week.`;
  write('index.html', page({
    path: '/', title: `${SERIES}: Animated Panther Cartoon Videos | ${cfg.brand}`, description, body, withDialog: true,
    ld: [
      { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: cfg.brand, alternateName: SERIES, inLanguage: 'en', publisher: { '@id': `${SITE}/#org` } },
      ORG, { ...SERIES_LD, description },
    ],
  }));
  pages.push({ loc: '/', lastmod: day(shown[0].published) });
}

// All episodes
{
  const body = `<section class="section listing">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Episodes</li></ol></nav>
    <div class="head">
      <h1 class="page-title">All ${esc(SERIES)} episodes</h1>
      <p>Every episode of the ${esc(SERIES)} cartoon, latest first. Each one is a short animated adventure video, under 30 seconds, with a black panther, a leopard and a jaguar on the run.</p>
    </div>
    <ul class="reel reel--all" role="list">
${shown.map(ep => card(ep, { meta: true })).join('\n')}
    </ul>
  </div>
</section>`;
  write('episodes/index.html', page({
    path: '/episodes/', current: 'episodes', body,
    title: `All ${SERIES} Episodes: Cartoon Videos | ${cfg.brand}`,
    description: `Watch all ${shown.length} episodes of ${SERIES}, a family-friendly animated cartoon about a pack of big cats. Short adventure videos, latest first.`,
    ld: [
      { '@type': 'CollectionPage', '@id': `${abs('/episodes/')}#page`, url: abs('/episodes/'), name: `All ${SERIES} episodes`, isPartOf: { '@id': `${SITE}/#website` }, about: SERIES_LD,
        mainEntity: { '@type': 'ItemList', numberOfItems: shown.length, itemListElement: shown.map((ep, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(pageOf(ep)), name: fullName(ep) })) } },
      crumbs([['Home', '/'], ['Episodes', '/episodes/']]),
    ],
  }));
  pages.push({ loc: '/episodes/', lastmod: day(shown[0].published) });
}

// One page per episode
for (const ep of shown) {
  const i = inOrder.indexOf(ep), prev = inOrder[i - 1], next = inOrder[i + 1];
  const wide = Boolean(ep.longId);
  const more = shown.filter(e => e !== ep).sort((a, b) => b.views - a.views).slice(0, 6);
  const tags = (ep.tags || []).filter(t => t.toLowerCase() !== SERIES.toLowerCase()).slice(0, 8);
  const description = summary(ep.description || `${fullName(ep)}: a short animated cartoon from ${cfg.brand}.`);
  const body = `<article class="section ep">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/episodes/">Episodes</a></li><li aria-current="page">${esc(ep.title)}</li></ol></nav>
    <div class="ep__grid ep__grid--${wide ? 'wide' : 'tall'}">
      <div class="ep__player">
        <iframe src="https://www.youtube-nocookie.com/embed/${embedId(ep)}?rel=0&amp;playsinline=1" title="${esc(fullName(ep))} (video)" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>
      <div class="ep__info">
        <p class="chips"><span class="chip chip--ink">${esc(SERIES)}</span>${ep.ep ? `<span class="chip chip--pop">Episode ${ep.ep}</span>` : ''}</p>
        <h1 class="page-title">${esc(ep.title)}</h1>
        <p class="ep__meta">${clock(ep.seconds)} animated cartoon · <time datetime="${esc(ep.published)}">${longDate(ep.published)}</time></p>
        <div class="ep__desc">
${paragraphs(ep.description)}
        </div>${tags.length ? `
        <ul class="tags" role="list" aria-label="Topics">${tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <div class="actions">
          <a class="btn btn--pop" href="${watchUrl(ep)}" target="_blank" rel="noopener">Watch on YouTube</a>
          <a class="btn" href="${subscribeUrl}" target="_blank" rel="noopener">Subscribe</a>
        </div>
      </div>
    </div>
    <nav class="ep__nav" aria-label="Previous and next episode">
      ${prev ? `<a class="ep__step ep__step--prev" href="${pageOf(prev)}"><span>Previous episode</span><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
      ${next ? `<a class="ep__step ep__step--next" href="${pageOf(next)}"><span>Next episode</span><strong>${esc(next.title)}</strong></a>` : '<span></span>'}
    </nav>
  </div>
</article>

<section class="section more-eps">
  <div class="wrap">
    <div class="head"><h2>More ${esc(SERIES)} episodes</h2></div>
    <ul class="reel" role="list">
${more.map(e => card(e)).join('\n')}
    </ul>
    <p class="more"><a class="btn" href="/episodes/">See all ${shown.length} episodes</a></p>
  </div>
</section>`;
  write(`episodes/${ep.slug}/index.html`, page({
    path: pageOf(ep), current: 'episodes', body, ogType: 'video.other', image: `/share/${ep.slug}.jpg`,
    title: `${ep.title}: ${SERIES} Cartoon${ep.ep ? `, Episode ${ep.ep}` : ''} | ${cfg.brand}`, description,
    head: `<meta property="og:video" content="https://www.youtube.com/embed/${embedId(ep)}">
<meta property="og:video:type" content="text/html">
<meta property="og:video:width" content="${wide ? 1280 : 720}">
<meta property="og:video:height" content="${wide ? 720 : 1280}">
`,
    ld: [videoLd(ep), crumbs([['Home', '/'], ['Episodes', '/episodes/'], [ep.title, pageOf(ep)]])],
  }));
  copy(`src/share/${ep.slug}.jpg`, `share/${ep.slug}.jpg`);
  pages.push({ loc: pageOf(ep), lastmod: day(ep.published), ep });
}

// Games: the list, and Pack Run
const VIDEO_GAME_LD = {
  '@type': 'VideoGame', '@id': `${abs(GAME.path)}#game`, name: GAME.name, alternateName: `${SERIES}: ${GAME.name}`,
  description: GAME.description, url: abs(GAME.path), image: abs(GAME.image),
  genre: ['Endless runner', 'Action', 'Family'], gamePlatform: ['Web browser'], applicationCategory: 'Game', operatingSystem: 'Any (runs in a web browser)',
  playMode: 'SinglePlayer', isAccessibleForFree: true, isFamilyFriendly: true, inLanguage: 'en',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  keywords: `${SERIES} game, panther game, free online game, cartoon game, runner game, browser game`,
  datePublished: GAME.published, dateModified: GAME.updated,
  about: SERIES_LD, author: { '@id': `${SITE}/#org` }, publisher: ORG,
};
{
  const picker = name => `          <fieldset class="game__pick">
            <legend>Pick the threat</legend>
            <div class="game__pick-row">${threatEps.map(({ key, label }, i) => `<label><input type="radio" name="${name}" value="${key}" data-threat${i ? '' : ' checked'}><span>${esc(label)}</span></label>`).join('')}</div>
          </fieldset>`;
  const vars = {
    series: esc(SERIES), subscribeUrl, episodeCount: shown.length,
    paws: PAW.repeat(3), iconPause: ICON_PAUSE, iconSoundOff: ICON_SOUND_OFF, iconSoundOn: ICON_SOUND_ON, iconPlay: ICON_PLAY,
    burstEnd: burst(71, 14), pickerStart: picker('threat'), pickerEnd: picker('threat-again'),
    epLinks: `          <p class="game__ep">${threatEps.map(({ key, ep }, i) => `<a data-ep="${key}" href="${pageOf(ep)}"${i ? ' hidden' : ''}>Watch “${esc(ep.title)}”, the episode behind this round</a>`).join('')}</p>`,
    threatEpisodes: threatEps.map(({ ep }) => `<a href="${pageOf(ep)}">${esc(ep.title)}</a>`).join(', ').replace(/, ([^,]*)$/, ' and $1'),
    cards: threatEps.map(({ ep }) => card(ep, { meta: true })).join('\n'),
  };
  write('games/pack-run/index.html', page({
    path: GAME.path, current: 'games', image: GAME.image, description: GAME.description,
    title: `${GAME.name}: Free ${SERIES} Game, Play Online | ${cfg.brand}`,
    head: `<script src="${GAME.path}pack-run.js?v=${gv}" defer></script>\n`,
    body: fill(read('src/games/pack-run/page.html'), vars, 'games/pack-run/page.html'),
    ld: [VIDEO_GAME_LD, crumbs([['Home', '/'], ['Games', '/games/'], [GAME.name, GAME.path]])],
  }));
  write('games/pack-run/pack-run.js', gameJs);
  // the play counter and the admin page that shows it (PHP; see src/server/)
  copy('src/server/hh-store.php', 'api/hh-store.php');
  copy('src/server/play.php', 'api/play.php');
  copy('src/server/admin.php', 'secret-crm-door/index.php');

  const body = `<section class="section listing">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Games</li></ol></nav>
    <div class="head">
      <h1 class="page-title">${esc(SERIES)} games</h1>
      <p>Free games starring the ${esc(SERIES)}, the animated panther cartoon. They run right in your browser on a phone, a tablet or a computer: no download, no sign-up.</p>
    </div>
    <ul class="games" role="list">
      <li><a class="game-card" href="${GAME.path}">
        <span class="game-card__art"><img src="${GAME.card}" alt="The ${esc(SERIES)} running from a charging elephant herd in ${GAME.name}" width="800" height="420" decoding="async"></span>
        <span class="game-card__body">
          <span class="chips"><span class="chip chip--pop">Free</span><span class="chip chip--ink">Phone or computer</span></span>
          <h2 class="game-card__title">${GAME.name}</h2>
          <span class="game-card__text">Elephants, buffalo or a rockslide, charging straight at the pack. Switch lanes, jump and grab the stars for 45 seconds.</span>
          <span class="btn btn--pop">${ICON_PLAY}Play ${GAME.name}</span>
        </span>
      </a></li>
    </ul>
    <p class="more">Rather watch? <a href="/episodes/">See all ${shown.length} episodes of the cartoon</a>.</p>
  </div>
</section>`;
  write('games/index.html', page({
    path: '/games/', current: 'games', body, image: GAME.image,
    title: `${SERIES} Games: Free Online Cartoon Games | ${cfg.brand}`,
    description: `Free online games starring the ${SERIES}, the animated panther cartoon. Play in your browser on a phone, tablet or computer. No download, no sign-up.`,
    ld: [
      { '@type': 'CollectionPage', '@id': `${abs('/games/')}#page`, url: abs('/games/'), name: `${SERIES} games`, isPartOf: { '@id': `${SITE}/#website` }, about: SERIES_LD,
        mainEntity: { '@type': 'ItemList', numberOfItems: 1, itemListElement: [{ '@type': 'ListItem', position: 1, url: abs(GAME.path), name: GAME.name }] } },
      crumbs([['Home', '/'], ['Games', '/games/']]),
    ],
  }));
  pages.push({ loc: '/games/', lastmod: GAME.updated }, { loc: GAME.path, lastmod: GAME.updated });
}

// Shop: the list, one page per product, the thank-you page, and the catalog the checkout PHP trusts
function shopTeaser() {
  const p = products[0], img = firstPicture(p, groupOf(p, p.variants.find(v => v.id === p.defaultVariant)));
  return `<section class="section shop-teaser" id="merch">
  <div class="wrap">
    <a class="teaser teaser--shop" href="${products.length > 1 ? '/shop/' : productPath(p)}">
      <span class="teaser__art"><img src="${picture(p, img)}" alt="${esc(p.title)}" width="1000" height="1000" loading="lazy" decoding="async"></span>
      <span class="teaser__copy">
        <span class="chip chip--pop">Official merch</span>
        <h2 class="teaser__title">Wear the pack</h2>
        <span class="teaser__text">${esc(p.title)}, from ${money(Math.min(...p.variants.map(v => v.price)))}. Printed when you order it and shipped to you${SHOP.countries.length === 1 && SHOP.countries[0] === 'US' ? ' in the US' : ''}.</span>
        <span class="btn btn--pop">Shop now</span>
      </span>
    </a>
  </div>
</section>
`;
}
if (shopOn) {
  const robots = shopPublic ? {} : { noindex: true };
  const [dMin, dMax] = SHOP.deliveryDays;
  const where = SHOP.countries.length === 1 && SHOP.countries[0] === 'US' ? 'US addresses only' : `ships to ${SHOP.countries.join(', ')}`;
  const contact = SHOP.contactEmail ? `<a href="mailto:${esc(SHOP.contactEmail)}">${esc(SHOP.contactEmail)}</a>` : 'us';
  const policy = `<details class="product__policy">
          <summary>Shipping and returns</summary>
          <p><strong>Shipping:</strong> ${where}. Each item is printed when you order it, and most orders arrive in ${dMin}–${dMax} business days. You get an email with tracking when it ships.</p>
          <p><strong>Returns:</strong> because every item is made for you, we can't take returns for a different size or a change of mind. If it arrives damaged or misprinted, email ${contact} within 30 days with a photo and we'll replace it for free.</p>
        </details>`;
  const fromPrice = p => Math.min(...p.variants.map(v => v.price));
  const colorsOf = p => (p.colorOption >= 0 ? p.options[p.colorOption].values.length : 0);

  // the list
  const body = `<section class="section listing shop">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Shop</li></ol></nav>
    <div class="head">
      <h1 class="page-title">${esc(SERIES)} merch</h1>
      <p>Official ${esc(cfg.brand)} merch from the ${esc(SERIES)} cartoon. Every item is printed when you order it and shipped to you (${where}).</p>
    </div>
    <ul class="products" role="list">
${products.map(p => { const img = firstPicture(p, groupOf(p, p.variants.find(v => v.id === p.defaultVariant))); return `      <li><a class="product-card" href="${productPath(p)}">
        <span class="product-card__art"><img src="${picture(p, img)}" alt="${esc(p.title)}" width="1000" height="1000" decoding="async"></span>
        <span class="product-card__body">
          <span class="product-card__title">${esc(p.title)}</span>
          <span class="product-card__meta">From ${money(fromPrice(p))}${colorsOf(p) > 1 ? ` · ${colorsOf(p)} colors` : ''}</span>
          <span class="btn btn--pop btn--sm">Choose your size</span>
        </span>
      </a></li>`; }).join('\n')}
    </ul>
  </div>
</section>`;
  write('shop/index.html', page({
    path: '/shop/', current: 'shop', body, ...robots, image: `/shop/${products[0].slug}/share.jpg`,
    title: `${SERIES} Merch: T-Shirts and More | ${cfg.brand}`,
    description: summary(`Official ${SERIES} merch from ${cfg.brand}: ${products.map(p => p.title).join(', ')}. Printed when you order and shipped to you.`),
    head: `<script src="/shop.js?v=${sv}" defer></script>\n`,
    ld: [
      { '@type': 'CollectionPage', '@id': `${abs('/shop/')}#page`, url: abs('/shop/'), name: `${SERIES} merch`, isPartOf: { '@id': `${SITE}/#website` },
        mainEntity: { '@type': 'ItemList', numberOfItems: products.length, itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(productPath(p)), name: p.title })) } },
      crumbs([['Home', '/'], ['Shop', '/shop/']]),
    ],
  }));
  if (shopPublic) pages.push({ loc: '/shop/', lastmod: day(shopData.synced) });

  // one page per product
  for (const p of products) {
    const def = p.variants.find(v => v.id === p.defaultVariant);
    const defGroup = groupOf(p, def);
    const main = firstPicture(p, defGroup);
    const optionHtml = optionOrder(p).map(oi => {
      const o = p.options[oi], isColor = o.type === 'color';
      if (o.values.length === 1) {   // nothing to choose: say what it is
        return `          <p class="opt opt--fixed"><input type="radio" name="opt${oi}" value="${o.values[0].id}" data-opt="${oi}" checked hidden>${esc(optionLabel(o))}: <strong>${esc(o.values[0].title)}</strong></p>`;
      }
      return `          <fieldset class="opt${isColor ? ' opt--color' : ''}">
            <legend>${esc(optionLabel(o))}${isColor ? `: <strong data-opt-name="${oi}">${esc(o.values.find(x => x.id === def.options[oi])?.title || '')}</strong>` : ''}</legend>
            <div class="opt__row">${o.values.map(x => `<label class="${isColor ? 'swatch' : 'pill'}"><input type="radio" name="opt${oi}" value="${x.id}" data-opt="${oi}"${x.id === def.options[oi] ? ' checked' : ''}>${isColor
              ? `<span class="swatch__dot" style="--c:${esc(x.hex || '#ccc')}"></span><span class="visually-hidden">${esc(x.title)}</span>`
              : `<span>${esc(x.title)}</span>`}</label>`).join('')}</div>
          </fieldset>`;
    }).join('\n');
    const data = {
      id: p.id, title: p.title, colorOption: p.colorOption, order: optionOrder(p), maxQty: SHOP.maxQty,
      options: p.options.map(o => ({ name: o.name, values: o.values.map(x => ({ id: x.id, title: x.title })) })),
      variants: p.variants.map(v => ({ id: v.id, title: v.title, price: v.price, options: v.options, available: v.available, ship: v.ship })),
      images: p.images.map(i => ({ src: picture(p, i), groups: i.groups, position: i.position })),
    };
    const prices = p.variants.map(v => v.price);
    const description = summary([`${p.title}: official ${SERIES} merch from ${cfg.brand}.`, ...textOf(p)].join(' '));
    const body = `<article class="section product">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/shop/">Shop</a></li><li aria-current="page">${esc(p.title)}</li></ol></nav>
    <div class="product__grid">
      <div class="product__gallery">
        <div class="product__main"><img src="${picture(p, main)}" alt="${esc(p.title)}" width="1000" height="1000" fetchpriority="high" data-main></div>
        <ul class="product__thumbs" role="list">
${p.images.map((img, i) => `          <li${img.groups.includes(defGroup) ? '' : ' hidden'} data-groups="${img.groups.join(' ')}"><button class="product__thumb" type="button" data-src="${picture(p, img)}" aria-label="Show picture ${i + 1}"${img === main ? ' aria-current="true"' : ''}><img src="${picture(p, img)}" alt="" width="1000" height="1000" loading="lazy" decoding="async"></button></li>`).join('\n')}
        </ul>
      </div>
      <form class="product__info" data-product>
        <p class="chips"><span class="chip chip--ink">${esc(cfg.brand)}</span><span class="chip chip--pop">Official merch</span></p>
        <h1 class="page-title">${esc(p.title)}</h1>
        <p class="product__price"><span data-price>${money(def.price)}</span> <span class="product__ship" data-ship>+ ${money(def.ship[0])} shipping</span></p>
${optionHtml}
        <div class="product__buyrow">
          <label class="qty"><span>Qty</span><select name="qty" data-qty>${Array.from({ length: SHOP.maxQty }, (_, i) => `<option${i ? '' : ' selected'}>${i + 1}</option>`).join('')}</select></label>
          <button class="btn btn--pop btn--lg product__buy" type="submit" data-buy>Buy now</button>
        </div>
        <p class="product__status" role="status" aria-live="polite" data-status></p>
        <noscript><p class="product__status">Checkout needs JavaScript. Please turn it on to buy.</p></noscript>
        <div class="product__desc">
${descHtml(p)}
        </div>
        ${policy}
      </form>
    </div>
  </div>
</article>
<dialog class="checkout" id="checkout" aria-labelledby="checkout-title">
  <div class="checkout__box">
    <div class="checkout__top">
      <h2 id="checkout-title">Checkout</h2>
      <button class="player__close" type="button" aria-label="Close checkout" data-close>${ICON_CLOSE}</button>
    </div>
    <p class="checkout__item" data-summary></p>
    <div class="checkout__mount" data-mount><p class="checkout__wait">Opening secure checkout…</p></div>
  </div>
</dialog>
<script type="application/json" id="product-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
    write(`shop/${p.slug}/index.html`, page({
      path: productPath(p), current: 'shop', body, ...robots, ogType: 'product', image: `/shop/${p.slug}/share.jpg`,
      title: `${p.title} | ${SERIES} Merch | ${cfg.brand}`, description,
      head: `<script src="/shop.js?v=${sv}" defer></script>\n<link rel="preconnect" href="https://js.stripe.com">\n<meta property="product:price:amount" content="${(def.price / 100).toFixed(2)}">\n<meta property="product:price:currency" content="USD">\n`,
      ld: [
        { '@type': 'Product', '@id': `${abs(productPath(p))}#product`, name: p.title, description: textOf(p).join(' ').slice(0, 5000) || description,
          image: p.images.slice(0, 8).map(i => abs(picture(p, i))), url: abs(productPath(p)), brand: { '@type': 'Brand', name: cfg.brand },
          offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: (Math.min(...prices) / 100).toFixed(2), highPrice: (Math.max(...prices) / 100).toFixed(2), offerCount: p.variants.length,
            availability: p.variants.some(v => v.available) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: abs(productPath(p)) } },
        crumbs([['Home', '/'], ['Shop', '/shop/'], [p.title, productPath(p)]]),
      ],
    }));
    for (const f of fs.readdirSync(path.join(shopImg, p.slug))) {
      fs.mkdirSync(path.join(DIST, 'shop', p.slug), { recursive: true });
      fs.copyFileSync(path.join(shopImg, p.slug, f), path.join(DIST, 'shop', p.slug, f));
    }
    if (shopPublic) pages.push({ loc: productPath(p), lastmod: day(shopData.synced) });
  }

  // after Stripe: thanks (or, if the payment didn't finish, a way back)
  write('shop/thanks/index.html', page({
    path: '/shop/thanks/', current: 'shop', noindex: true, title: `Thanks for your order | ${cfg.brand}`, description: 'Your Happy Hillz order.',
    head: `<script src="/shop.js?v=${sv}" defer></script>\n`,
    body: `<section class="section thanks">
  <div class="wrap thanks__in" data-thanks data-days="${dMin}–${dMax}">
    <p class="burst burst--thanks">${burst(808, 14)}<span class="burst__text">Thank<br>you!</span></p>
    <h1 class="page-title" data-thanks-title>Thanks for your order!</h1>
    <p data-thanks-text>Your receipt is on its way to your email. Your order is printed just for you, usually arrives in ${dMin}–${dMax} business days, and you'll get tracking when it ships.</p>
    <div class="actions"><a class="btn btn--pop" href="/episodes/">Watch an episode</a><a class="btn" href="/shop/">Back to the shop</a></div>
  </div>
</section>`,
  }));
  write('shop.js', shopJs);

  // what /api/checkout.php may sell, at which price (the server never takes a price from the browser)
  const catalog = {
    site: SITE, shopId: String(shopData.shop?.id ?? ''), countries: SHOP.countries, delivery: SHOP.deliveryDays, maxQty: SHOP.maxQty, tax: SHOP.collectTax === true,
    products: Object.fromEntries(products.map(p => [p.id, {
      title: p.title, url: abs(productPath(p)),
      variants: Object.fromEntries(p.variants.map(v => [String(v.id), {
        title: v.title, price: v.price, ship: v.ship, available: v.available, image: abs(picture(p, firstPicture(p, groupOf(p, v)), 'jpg')),
      }])),
    }])),
  };
  const catalogJson = JSON.stringify(catalog);
  if (/^JSON$/m.test(catalogJson)) throw new Error('catalog text breaks the PHP heredoc');
  write('api/shop-catalog.php', `<?php\n// Generated by scripts/build.js from data/shop.json. Not served on its own.\nif (!defined('HH')) { http_response_code(404); exit; }\nreturn json_decode(<<<'JSON'\n${catalogJson}\nJSON, true);\n`);
  for (const f of ['shop-lib.php', 'checkout.php', 'shop-status.php', 'stripe-webhook.php']) copy(`src/server/${f}`, `api/${f}`);
}

// Not found: a real 404 (an unknown address must not look like a page to search engines).
write('404.html', page({
  path: '/404.html', noindex: true, title: `Page not found | ${cfg.brand}`, description: 'This page does not exist.',
  body: `<section class="section lost">
  <div class="wrap lost__in">
    <p class="burst burst--lost">${burst(404, 14)}<span class="burst__text">Lost the<br>trail!</span></p>
    <h1 class="page-title">This page ran off</h1>
    <p>The pack can't find what you were looking for. Try the episodes instead.</p>
    <div class="actions"><a class="btn btn--pop" href="/episodes/">All episodes</a><a class="btn" href="/">Home</a></div>
  </div>
</section>`,
}));

// Assets
write('styles.css', css);
write('app.js', js);
for (const f of ['anton-latin-400-normal.woff2']) copy(`node_modules/@fontsource/anton/files/${f}`, `fonts/${f}`);
for (const f of ['comic-neue-latin-400-normal.woff2', 'comic-neue-latin-700-normal.woff2']) copy(`node_modules/@fontsource/comic-neue/files/${f}`, `fonts/${f}`);
for (const ep of new Set([...shown, hero])) copy(`src/thumbs/${ep.shortId}.webp`, `thumbs/${ep.shortId}.webp`);
for (const f of fs.readdirSync(at('src/static'))) copy(`src/static/${f}`, f);

// The live trailer is a real episode page with one addition in front of it:
//  - the landing page can pause drawing while the phone is off screen;
//  - no frame is drawn while the frame has no size yet (an iframe can start at
//    0x0, and an episode frame drawn at 0x0 throws and stops the animation),
//    and the first real frame re-runs the episode's resize handler.
const PAUSE_SWITCH = `<meta name="robots" content="noindex">
<script>
(function () {
  var raf = window.requestAnimationFrame.bind(window), paused = false, held = null, sized = false;
  function tick(cb) {
    return raf(function (t) {
      if (paused || !(innerWidth > 0 && innerHeight > 0)) { held = cb; if (!paused) setTimeout(resume, 120); return; }
      if (!sized) { sized = true; window.dispatchEvent(new Event('resize')); }
      cb(t);
    });
  }
  function resume() { if (held && !paused) { var cb = held; held = null; tick(cb); } }
  window.requestAnimationFrame = function (cb) { if (paused) { held = cb; return 0; } return tick(cb); };
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    if (e.data === 'hh:pause') paused = true;
    else if (e.data === 'hh:play') { paused = false; resume(); }
  });
})();
</script>
`;
write('trailer/index.html', PAUSE_SWITCH + read(cfg.trailer.page));

// Sitemap, with Google's video extension for the episode pages.
const x = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${pages.map(({ loc, lastmod, ep }) => `  <url>
    <loc>${x(abs(loc))}</loc>
    <lastmod>${lastmod}</lastmod>${ep ? `
    <video:video>
      <video:thumbnail_loc>${x(abs(`/share/${ep.slug}.jpg`))}</video:thumbnail_loc>
      <video:title>${x(fullName(ep))}</video:title>
      <video:description>${x((ep.description || fullName(ep)).slice(0, 2000))}</video:description>
      <video:player_loc>${x(`https://www.youtube.com/embed/${embedId(ep)}`)}</video:player_loc>
      <video:duration>${ep.seconds}</video:duration>
      <video:publication_date>${x(ep.published)}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>` : ''}
  </url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /trailer/\nDisallow: /api/\nDisallow: /shop/thanks/\n\nSitemap: ${SITE}/sitemap.xml\n`);

// .htaccess lives in the build output so a deploy never removes it.
const host = new URL(SITE).host.replace(/\./g, '\\.');
const https = cfg.forceHttps
  ? `  # Send http and www to ${SITE} (the temporary HostGator URL is left alone)
  RewriteCond %{HTTP_HOST} ^(www\\.)?${host}$ [NC]
  RewriteCond %{HTTPS} off [OR]
  RewriteCond %{HTTP_HOST} ^www\\. [NC]
  RewriteRule ^ ${SITE}%{REQUEST_URI} [L,R=301]
`
  : `  # HTTP -> HTTPS redirect is off until the SSL certificate is issued.
  # Turn it on with "forceHttps": true in site.config.json, then build and deploy.
`;
write('.htaccess', `# happyhillz.com — generated by scripts/build.js; edit it there, not on the server.
Options -Indexes
DirectoryIndex index.html index.php
ErrorDocument 404 /404.html

# Upload and staging files exist for a few seconds during a deploy; never serve them.
RedirectMatch 404 /\\.deploy-
# The play counter's data, the admin password hash and the shop's keys are never served; deploys never touch the folder.
RedirectMatch 404 /\\.hh-data
# PHP that other PHP files include; it does nothing on its own.
RedirectMatch 404 ^/api/(hh-store|shop-lib|shop-catalog)\\.php$

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
${https}
  # Old addresses: /index.html -> /
  RewriteCond %{THE_REQUEST} \\s/index\\.html[\\s?] [NC]
  RewriteRule ^index\\.html$ / [L,R=301]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml application/xml text/xml text/plain
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType image/webp "access plus 7 days"
  ExpiresByType image/jpeg "access plus 7 days"
  ExpiresByType image/png "access plus 7 days"
  ExpiresByType image/svg+xml "access plus 7 days"
</IfModule>

<IfModule mod_mime.c>
  AddType font/woff2 .woff2
  AddType image/webp .webp
</IfModule>
`);

// Icons for bookmarks, home screens and the logo in structured data.
(async () => {
  const svg = fs.readFileSync(at('src/static/favicon.svg'));
  await sharp(svg, { density: 300 }).resize(180, 180).png().toFile(path.join(DIST, 'apple-touch-icon.png'));
  await sharp(svg, { density: 600 }).resize(512, 512).png().toFile(path.join(DIST, 'logo.png'));
  // The game's share image and card come from one still of the game (npm run game-shot makes it).
  if (fs.existsSync(at(GAME.shot))) {
    await sharp(at(GAME.shot)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(DIST, GAME.image));
    await sharp(at(GAME.shot)).resize(800, 420, { fit: 'cover' }).webp({ quality: 82 }).toFile(path.join(DIST, GAME.card));
  } else if (process.env.CI) throw new Error(`missing ${GAME.shot}; run "npm run game-shot" and commit it`);
  else console.warn(`warning: no ${GAME.shot} yet, so the game has no share image or card; run "npm run game-shot"`);

  let total = 0, count = 0;
  (function sum(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) sum(p); else { total += fs.statSync(p).size; count++; }
    }
  })(DIST);
  console.log(`built dist/: ${count} files, ${(total / 1024).toFixed(0)} KB, ${pages.length} pages in the sitemap`);
  console.log(`  hero:  ${cfg.trailer.label}`);
  console.log(`  cards: ${featured.map(e => e.title).join(', ')}`);
  console.log(`  episode pages: ${shown.length}${cfg.hide?.length ? ` (hidden: ${cfg.hide.join(', ')})` : ''}`);
  console.log(`  https redirect: ${cfg.forceHttps ? 'on' : 'off'}`);
})().catch(err => { console.error(err); process.exit(1); });
