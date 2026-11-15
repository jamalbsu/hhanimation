// Shared helpers for the build, fetch and deploy scripts.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const at = (...p) => path.join(ROOT, ...p);
const readJson = p => JSON.parse(fs.readFileSync(at(p), 'utf8'));

const config = () => readJson('site.config.json');

// "Head-On: Elephant Herd" and "Head-On Elephant Herd" are the same episode.
const key = title => title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// The episodes shown as cards: most watched first, minus the excluded titles
// and the episode that is already playing in the hero.
function pickFeatured(cfg, episodes) {
  const skip = new Set([...(cfg.featured.exclude || []), cfg.trailer.episode].map(key));
  return episodes
    .filter(e => e.shortId && !skip.has(key(e.title)))
    .sort((a, b) => b.views - a.views)
    .slice(0, cfg.featured.count);
}

const findEpisode = (episodes, title) => episodes.find(e => key(e.title) === key(title));

module.exports = { ROOT, at, readJson, config, key, pickFeatured, findEpisode };
