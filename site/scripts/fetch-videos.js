// Refreshes data/videos.json and the images from the public YouTube channel.
//   npm run videos              new episodes, fresh view counts
//   npm run videos -- --refresh also re-reads every episode's details and images
// It reads the channel pages the way a browser would (no API key). YouTube can
// change that page format at any time; if this script stops finding episodes,
// the last good data/videos.json keeps the site building.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { ROOT, at, config, key, slug, visibleEpisodes, findEpisode } = require('./lib');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const REFRESH = process.argv.includes('--refresh');
const cfg = config();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' } });
  if (!res.ok) return null;
  return as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

function json(html, name) {
  const m = html && html.match(new RegExp(`var ${name} = (\\{.*?\\});(?:var |<\\/script>)`, 's'));
  return m ? JSON.parse(m[1]) : null;
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const k in node) walk(node[k], visit);
}

// "924 views", "1K views", "1.2M views", "No views"
function views(text = '') {
  const m = text.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  return Math.round(parseFloat(m[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1));
}

const PREFIX = new RegExp(`^${cfg.series}:\\s*`, 'i');
const clean = title => title.replace(PREFIX, '').replace(/\s*#shorts\s*$/i, '').trim();
const cleanText = s => s.replace(/(^|\s)#[\w-]+/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

// Episode numbers: from the local episode pages (../panthera-N-*.html), plus aliases in the config.
function episodeNumbers() {
  const map = {};
  const dir = path.join(ROOT, '..');
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^panthera-(\d+)-.*\.html$/);
    if (!m) continue;
    const t = fs.readFileSync(path.join(dir, f), 'utf8').match(/<title>([^<]*)<\/title>/);
    if (t) map[key(t[1].replace(/&amp;/g, '&'))] = +m[1];
  }
  for (const [title, n] of Object.entries(cfg.episodeNumbers || {})) map[key(title)] = n;
  return map;
}

// Upload date, length, description and tags from the episode's own YouTube page.
async function details(ep) {
  const url = ep.longId ? `https://www.youtube.com/watch?v=${ep.longId}` : `https://www.youtube.com/shorts/${ep.shortId}`;
  const p = json(await get(url), 'ytInitialPlayerResponse');
  if (!p) return null;
  const v = p.videoDetails || {}, mf = p.microformat?.playerMicroformatRenderer || {};
  return {
    published: mf.publishDate || mf.uploadDate || null,
    seconds: +v.lengthSeconds || null,
    description: cleanText(v.shortDescription || ''),
    tags: (v.keywords || []).filter(t => !/^#?shorts$/i.test(t)).slice(0, 12),
  };
}

(async () => {
  const [shorts, longs] = await Promise.all([
    get(`https://www.youtube.com/${cfg.channel.handle}/shorts`).then(h => json(h, 'ytInitialData')),
    get(`https://www.youtube.com/${cfg.channel.handle}/videos`).then(h => json(h, 'ytInitialData')),
  ]);
  if (!shorts) throw new Error('could not read the Shorts tab; keeping the existing data/videos.json');

  const episodes = [];
  walk(shorts, n => {
    const s = n.shortsLockupViewModel;
    if (!s) return;
    const title = s.overlayMetadata?.primaryText?.content || '';
    const id = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
    if (!id || !PREFIX.test(title)) return;
    episodes.push({ title: clean(title), shortId: id, longId: null, views: views(s.overlayMetadata?.secondaryText?.content) });
  });
  walk(longs, n => {
    const v = n.lockupViewModel;
    if (!v || v.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO') return;
    const title = v.metadata?.lockupMetadataViewModel?.title?.content || '';
    if (!PREFIX.test(title)) return;
    const ep = episodes.find(e => key(e.title) === key(clean(title)));
    if (ep) ep.longId = v.contentId;
  });
  if (!episodes.length) throw new Error('no episodes found; keeping the existing data/videos.json');

  // Keep details already fetched, unless --refresh.
  const prevFile = at('data/videos.json');
  const prev = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, 'utf8')).episodes : [];
  const numbers = episodeNumbers();
  for (const ep of episodes) {
    const old = prev.find(p => p.shortId === ep.shortId);
    Object.assign(ep, { slug: slug(ep.title), ep: numbers[key(ep.title)] || null });
    if (old && old.published && old.longId === ep.longId && !REFRESH) {
      Object.assign(ep, { published: old.published, seconds: old.seconds, description: old.description, tags: old.tags });
      continue;
    }
    const d = await details(ep);
    if (d) Object.assign(ep, d); else console.warn(`  no details for "${ep.title}"`);
    console.log(`  details  ${ep.title}`);
    await sleep(250);
  }

  const order = ['title', 'slug', 'ep', 'shortId', 'longId', 'views', 'published', 'seconds', 'description', 'tags'];
  const out = episodes.map(e => Object.fromEntries(order.map(k => [k, e[k] ?? null])));
  fs.writeFileSync(prevFile, JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), episodes: out }, null, 2) + '\n');
  console.log(`${episodes.length} episodes -> data/videos.json (${episodes.filter(e => e.longId).length} with a landscape cut)`);

  // Images for every episode the site shows: a vertical card image, and a 1200x630 share image.
  const shown = visibleEpisodes(cfg, out);
  const hero = findEpisode(out, cfg.trailer.episode);
  for (const ep of new Set([...shown, hero].filter(Boolean))) {
    const thumb = at('src/thumbs', `${ep.shortId}.webp`);
    const share = at('src/share', `${ep.slug}.jpg`);
    if (!REFRESH && fs.existsSync(thumb) && fs.existsSync(share)) continue;

    let tall = null;
    for (const name of ['oar2', 'oardefault', 'oar1']) if ((tall = await get(`https://i.ytimg.com/vi/${ep.shortId}/${name}.jpg`, 'buffer'))) break;
    if (tall) await sharp(tall).resize(540, 960, { fit: 'cover' }).webp({ quality: 74 }).toFile(thumb);
    else console.warn(`  no vertical image for "${ep.title}"`);

    const wide = ep.longId && (await get(`https://i.ytimg.com/vi/${ep.longId}/maxresdefault.jpg`, 'buffer') || await get(`https://i.ytimg.com/vi/${ep.longId}/hq720.jpg`, 'buffer'));
    if (wide) {
      await sharp(wide).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(share);
    } else if (tall) {   // Shorts-only episodes: the vertical frame centred on the show's ink colour
      const fg = await sharp(tall).resize({ height: 630 }).toBuffer();
      await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0b0b0f' } }).composite([{ input: fg, gravity: 'center' }]).jpeg({ quality: 80, mozjpeg: true }).toFile(share);
    }
    console.log(`  images   ${ep.title}`);
  }

  // Site-wide share image: a landscape frame from the hero episode.
  if (hero && fs.existsSync(at('src/share', `${hero.slug}.jpg`))) fs.copyFileSync(at('src/share', `${hero.slug}.jpg`), at('src/static/og.jpg'));
})().catch(err => { console.error('fetch-videos failed:', err.message); process.exit(1); });
