// Shared helpers for the build, fetch and deploy scripts.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const at = (...p) => path.join(ROOT, ...p);
const readJson = p => JSON.parse(fs.readFileSync(at(p), 'utf8'));

const config = () => readJson('site.config.json');

// "Head-On: Elephant Herd" and "Head-On Elephant Herd" are the same episode.
const key = title => title.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
// URL part for an episode page: "Head-On Elephant Herd" -> "head-on-elephant-herd"
const slug = title => title.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Episodes the site shows: everything on the channel except the titles in "hide".
function visibleEpisodes(cfg, episodes) {
  const hide = new Set((cfg.hide || []).map(key));
  return episodes.filter(e => e.shortId && !hide.has(key(e.title)));
}

// Homepage cards: most watched first, minus the episode already playing in the hero.
function pickFeatured(cfg, episodes) {
  const hero = key(cfg.trailer.episode);
  return visibleEpisodes(cfg, episodes)
    .filter(e => key(e.title) !== hero)
    .sort((a, b) => b.views - a.views)
    .slice(0, cfg.featured.count);
}

const findEpisode = (episodes, title) => episodes.find(e => key(e.title) === key(title));

module.exports = { ROOT, at, readJson, config, key, slug, visibleEpisodes, pickFeatured, findEpisode };
