// Builds the static site into dist/. No server-side code: HostGator serves the folder as is.
//   npm run build
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { at, config, readJson, pickFeatured, findEpisode } = require('./lib');

const cfg = config();
const { episodes } = readJson('data/videos.json');
const DIST = at('dist');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = p => fs.readFileSync(at(p), 'utf8');
const write = (p, body) => { fs.mkdirSync(path.dirname(path.join(DIST, p)), { recursive: true }); fs.writeFileSync(path.join(DIST, p), body); };
const copy = (from, to) => { fs.mkdirSync(path.dirname(path.join(DIST, to)), { recursive: true }); fs.copyFileSync(at(from), path.join(DIST, to)); };

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
  return `<svg class="horizon" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" focusable="false">${trees.length ? g : ''}</svg>`;
}

const ICON_PLAY = '<svg class="i" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5.6 9.4 5 1.5 9.4z"/></svg>';
const ICON_CLOSE = '<svg class="i" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.6.4.4 1.6 3.8 5 .4 8.4l1.2 1.2L5 6.2l3.4 3.4 1.2-1.2L6.2 5l3.4-3.4L8.4.4 5 3.8z"/></svg>';

const shortUrl = ep => `https://www.youtube.com/shorts/${ep.shortId}`;
const playData = (ep, title = ep.title) =>
  `data-play data-title="${esc(title)}" data-short="${esc(ep.shortId)}"${ep.longId ? ` data-long="${esc(ep.longId)}"` : ''}`;

// ---- pick the content ------------------------------------------------------
const hero = findEpisode(episodes, cfg.trailer.episode);
if (!hero) throw new Error(`trailer episode "${cfg.trailer.episode}" is not in data/videos.json; run "npm run videos"`);
const featured = pickFeatured(cfg, episodes);
for (const ep of [...featured, hero]) {
  if (!fs.existsSync(at('src/thumbs', `${ep.shortId}.webp`))) throw new Error(`missing thumbnail for "${ep.title}"; run "npm run videos"`);
}

const cards = featured.map(ep => `      <li><a class="card" href="${shortUrl(ep)}" ${playData(ep)}>
        <span class="card__art"><img src="/thumbs/${ep.shortId}.webp" alt="" width="540" height="960" loading="lazy" decoding="async"><span class="card__play" aria-hidden="true">${ICON_PLAY}</span></span>
        <span class="card__title">${esc(ep.title)}</span>
      </a></li>`).join('\n');

// ---- write dist ------------------------------------------------------------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const css = read('src/styles.css'), js = read('src/app.js');
const v = crypto.createHash('sha1').update(css + js).digest('hex').slice(0, 8);
const channelUrl = `https://www.youtube.com/${cfg.channel.handle}`;

const vars = {
  siteUrl: cfg.siteUrl, v, channelUrl, subscribeUrl: `${channelUrl}?sub_confirmation=1`, handle: esc(cfg.channel.handle),
  year: new Date().getFullYear(), cards, horizon: horizon(),
  heroHref: shortUrl(hero), heroData: playData(hero, cfg.trailer.label), heroThumb: hero.shortId, trailerLabel: esc(cfg.trailer.label),
  burstNew: burst(3), burstA: burst(11), burstB: burst(29, 15), burstC: burst(47, 12),
  iconPlay: ICON_PLAY, iconClose: ICON_CLOSE,
};
const html = read('src/index.html').replace(/\{\{(\w+)\}\}/g, (m, name) => {
  if (!(name in vars)) throw new Error(`index.html uses {{${name}}}, which the build does not define`);
  return vars[name];
});
write('index.html', html);
write('styles.css', css);
write('app.js', js);

for (const f of ['anton-latin-400-normal.woff2']) copy(`node_modules/@fontsource/anton/files/${f}`, `fonts/${f}`);
for (const f of ['comic-neue-latin-400-normal.woff2', 'comic-neue-latin-700-normal.woff2']) copy(`node_modules/@fontsource/comic-neue/files/${f}`, `fonts/${f}`);
for (const ep of [...featured, hero]) copy(`src/thumbs/${ep.shortId}.webp`, `thumbs/${ep.shortId}.webp`);
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

write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /trailer/\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${cfg.siteUrl}/</loc></url>\n</urlset>\n`);

// .htaccess lives in the build output so a deploy never removes it.
const host = new URL(cfg.siteUrl).host.replace(/\./g, '\\.');
const https = cfg.forceHttps
  ? `  # Send http and www to ${cfg.siteUrl} (the temporary HostGator URL is left alone)
  RewriteCond %{HTTP_HOST} ^(www\\.)?${host}$ [NC]
  RewriteCond %{HTTPS} off [OR]
  RewriteCond %{HTTP_HOST} ^www\\. [NC]
  RewriteRule ^ ${cfg.siteUrl}%{REQUEST_URI} [L,R=301]

`
  : `  # HTTP -> HTTPS redirect is off until the SSL certificate is issued.
  # Turn it on with "forceHttps": true in site.config.json, then build and deploy.

`;
write('.htaccess', `# happyhillz.com — generated by scripts/build.js; edit it there, not on the server.
Options -Indexes

# Upload and staging files exist for a few seconds during a deploy; never serve them.
RedirectMatch 404 /\\.deploy-

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
${https}  # Unknown paths load the landing page instead of a 404.
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml application/xml text/plain
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
  ExpiresByType image/svg+xml "access plus 7 days"
</IfModule>

<IfModule mod_mime.c>
  AddType font/woff2 .woff2
  AddType image/webp .webp
</IfModule>
`);

// ---- report ----------------------------------------------------------------
let total = 0, count = 0;
(function sum(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sum(p); else { total += fs.statSync(p).size; count++; }
  }
})(DIST);
console.log(`built dist/: ${count} files, ${(total / 1024).toFixed(0)} KB`);
console.log(`  hero:  ${cfg.trailer.label}`);
console.log(`  cards: ${featured.map(e => e.title).join(', ')}`);
console.log(`  https redirect: ${cfg.forceHttps ? 'on' : 'off'}`);
