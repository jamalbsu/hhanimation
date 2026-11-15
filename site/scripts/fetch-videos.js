// Refreshes data/videos.json and the thumbnails from the public YouTube channel.
//   npm run videos
// It reads the channel's Shorts and Videos tabs the way a browser would (no API
// key). YouTube can change that page format at any time; if this script stops
// finding episodes, the last good data/videos.json keeps the site building.
const fs = require('fs');
const sharp = require('sharp');
const { at, config, key, pickFeatured, findEpisode } = require('./lib');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const cfg = config();

async function tab(name) {
  const res = await fetch(`https://www.youtube.com/${cfg.channel.handle}/${name}`, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`${name} tab: HTTP ${res.status}`);
  const m = (await res.text()).match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error(`${name} tab: page data not found`);
  return JSON.parse(m[1]);
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

async function image(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

(async () => {
  const [shorts, longs] = await Promise.all([tab('shorts'), tab('videos')]);

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

  fs.writeFileSync(at('data/videos.json'), JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), episodes }, null, 2) + '\n');
  console.log(`${episodes.length} episodes -> data/videos.json (${episodes.filter(e => e.longId).length} with a landscape cut)`);

  // Thumbnails for the cards and the hero: the Short's own vertical frame.
  const hero = findEpisode(episodes, cfg.trailer.episode);
  const need = [...pickFeatured(cfg, episodes), ...(hero ? [hero] : [])];
  for (const ep of need) {
    let buf = null;
    for (const name of ['oar2', 'oardefault', 'oar1']) {
      buf = await image(`https://i.ytimg.com/vi/${ep.shortId}/${name}.jpg`);
      if (buf) break;
    }
    if (!buf) { console.warn(`  no vertical thumbnail for "${ep.title}"`); continue; }
    await sharp(buf).resize(540, 960, { fit: 'cover' }).webp({ quality: 74 }).toFile(at('src/thumbs', `${ep.shortId}.webp`));
    console.log(`  thumb  ${ep.title}`);
  }

  // Share image (Open Graph): a landscape frame from the hero episode.
  if (hero && hero.longId) {
    const buf = await image(`https://i.ytimg.com/vi/${hero.longId}/maxresdefault.jpg`) || await image(`https://i.ytimg.com/vi/${hero.longId}/hq720.jpg`);
    if (buf) {
      await sharp(buf).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(at('src/static/og.jpg'));
      console.log('  share image -> src/static/og.jpg');
    }
  }
})().catch(err => { console.error('fetch-videos failed:', err.message); process.exit(1); });
