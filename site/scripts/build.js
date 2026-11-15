// Builds the static site into dist/. No server-side code: HostGator serves the folder as is.
//   npm run build
// Pages: / (landing), /episodes/ (all episodes), /episodes/<slug>/ (one per episode), 404.html.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
      <a class="bar__link" href="/#about">About</a>
      <a class="btn btn--pop btn--sm" href="${subscribeUrl}" target="_blank" rel="noopener">Subscribe</a>
    </nav>
  </div>
</header>`;

const footer = `<footer class="foot">
  <div class="wrap foot__in">
    <p><span class="wordmark wordmark--sm">${esc(cfg.brand)}</span> Original animated adventures, one short episode at a time.</p>
    <p><a href="/episodes/">All episodes</a> · <a href="${channelUrl}" target="_blank" rel="noopener">YouTube: ${esc(cfg.channel.handle)}</a> · © ${year} ${esc(cfg.brand)}</p>
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
  };
  const body = read('src/home.html').replace(/\{\{(\w+)\}\}/g, (m, name) => {
    if (!(name in vars)) throw new Error(`home.html uses {{${name}}}, which the build does not define`);
    return vars[name];
  });
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
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /trailer/\n\nSitemap: ${SITE}/sitemap.xml\n`);

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
DirectoryIndex index.html
ErrorDocument 404 /404.html

# Upload and staging files exist for a few seconds during a deploy; never serve them.
RedirectMatch 404 /\\.deploy-

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
