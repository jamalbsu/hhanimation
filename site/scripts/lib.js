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

// Reads one line typed or pasted in the terminal without showing any of it, for passwords and API keys.
// The terminal is switched to raw mode, so it echoes nothing, not even when a long paste wraps the line.
// (readline's "hide the output" trick redraws the whole line once it wraps, which prints the secret.)
// Backspace deletes, Enter finishes, Ctrl-C cancels.
function cleanSecret(raw) {
  const s = raw.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '').replace(/\x1b./g, '');   // arrow keys, paste markers
  let out = '';
  for (const c of s) { if (c === '\x7f' || c === '\b') out = out.slice(0, -1); else if (c >= ' ') out += c; }
  return out.trim();
}
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') return reject(new Error('run this in a terminal, so it can be typed in privately'));
    let raw = '';
    const finish = err => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      if (err) reject(err); else resolve(cleanSecret(raw));
    };
    const onData = chunk => {
      for (const c of chunk.toString('utf8')) {
        if (c === '\u0003' || c === '\u0004') return finish(new Error('cancelled; nothing was changed'));
        if (c === '\r' || c === '\n') return finish();
        raw += c;
      }
    };
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

module.exports = { ROOT, at, readJson, config, key, slug, visibleEpisodes, pickFeatured, findEpisode, askHidden, cleanSecret };
