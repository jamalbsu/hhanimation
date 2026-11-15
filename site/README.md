# happyhillz.com

Website for Happy Hillz and the Panthers Pack cartoon. It's a static site: HostGator serves `dist/` as plain files, and there is no backend.

| Page | What's on it |
|---|---|
| `/` | Hero with a live episode drawing in a phone frame (`src/trailer/`), the six most-watched episodes (they play in a YouTube player on the page), the show format, About the cartoon, and Subscribe. |
| `/episodes/` | Every episode, latest first. |
| `/episodes/<slug>/` | One page per episode: the YouTube player, the description and topics from YouTube, the episode number, length and date, previous and next episode links, and more episodes. |
| `/games/` | The games. For now there is one: Pack Run. |
| `/games/pack-run/` | Pack Run, a free browser game (see [The game](#the-game-pack-run)), with how to play and links to the episodes behind it. |
| `/404.html` | A real "not found" page. Unknown addresses return a 404 status, which search engines need. |

## Search engines

- Each page has its own title, description, canonical URL and share image (Open Graph and Twitter).
- Structured data (schema.org JSON-LD):
  - home: WebSite, Organization and the Panthers Pack series;
  - episodes page: an ItemList;
  - each episode page: a **VideoObject** (date, length, thumbnail, YouTube embed) and breadcrumbs;
  - games page: an ItemList; Pack Run: a **VideoGame** (free, runs in a web browser) and breadcrumbs.
- `sitemap.xml` lists every page and includes Google's video extension for each episode. `robots.txt` points to it.
- To verify the site in Google Search Console or Bing Webmaster Tools with a meta tag, put the token under `searchVerification` in `site.config.json`, then build and deploy.

## Commands

Run these from this folder (`site/`):

| Command | What it does |
|---|---|
| `npm run videos` | Re-reads the public channel. It updates `data/videos.json` (episodes, views, dates, lengths, descriptions, tags) and adds images for new episodes. `-- --refresh` re-reads everything. |
| `npm run build` | Builds `dist/`. |
| `npm run admin-password` | Sets the password for the admin page `/secret-crm-door/` (asks twice, stores only a hash on the server). |
| `npm run game-shot` | Builds, then makes Pack Run's share image (`src/games/pack-run/shot.png`) from a still of the game in headless Chrome, then builds again. Commit the image. Needs Chrome; set `CHROME` to its path if it isn't in the usual place. |
| `npm run check-server` | Tests SSH access and lists the document root. |
| `npm run deploy:dry` | Builds, uploads, and prints what would change on the server. Changes nothing. |
| `npm run deploy` | Builds, deploys, then confirms https://happyhillz.com serves this build. |

To preview locally, use the `happyhillz-site` entry in `../.claude/launch.json` (http://localhost:8780). The local preview doesn't apply `.htaccess`.

## Settings: `site.config.json`

- `trailer`: the episode page in the hero, and the YouTube title it matches.
- `featured.count`: how many episodes the homepage shows.
- `hide`: episode titles the site leaves out entirely (no card, no page, not in the sitemap).
- `episodeNumbers`: episode numbers for YouTube titles that don't match a local `panthera-N-*.html` title.
- `searchVerification`: Google and Bing site-verification tokens.
- `forceHttps`: sends http and www to https://happyhillz.com.

## The game: Pack Run

The pack runs down a five-lane savanna trail while one huge threat charges straight at it, the rule of every episode. The player picks the threat: an elephant charge, a buffalo stampede or a rockslide. A round lasts 45 seconds.

**How to play.** Swipe left or right (arrow keys, or A and D) to switch lanes. Swipe up (up arrow or W) to jump. Tap (Space, F or J; hold to keep roaring) to roar: the lead panther fires a blast of sound down its lane. A roar never hurts anything. It spooks a buffalo off the trail with one hit and an elephant with three, and cracks a boulder with two (a big one takes three) or a log with one. Clearing them scores 20, 50, 30 and 10 points. Logs and boulders can also be jumped; elephants and buffalo can't. Stars are 25 points each, plus a point per meter run, and finishing the round adds 200. Three bumps end the round early. P or Esc pauses, M turns the sound on or off. Sound starts off.

**How it's built.** `src/games/pack-run/game.js` is the whole game. The build puts two pieces of the show into it at its markers and writes `dist/games/pack-run/pack-run.js`:

- the panther rig, `../panther/panther-rig.js`, unchanged, so the cats are the cats of the episodes;
- the elephants and buffalo of the episode engine: the "hoofed animals" section of the trailer episode (`trailer.page` in `site.config.json`).

`src/games/pack-run/page.html` is the page around it. The game's date for the sitemap and structured data is `GAME.updated` in `scripts/build.js`; change it when the game changes. Pushing a change to the rig also redeploys the site, so the game picks it up.

**Speed.** The rig paints each cat with thousands of small shapes, more than a browser's drawing thread can rasterize 60 times a second. So the game file also runs as two to four Web Workers that paint the cats and the herds in software on other cores, while the page only places the pictures. Each animal's pose is repainted up to 30 times a second, the frame rate of the episodes; the scene itself runs at 60 fps. Browsers without `OffscreenCanvas` paint on the page instead, and a device that can't keep up gets a lower resolution.

**Counting players.** The game keeps a random number in the player's browser (`packrun.player` in localStorage) and posts it to `/api/play.php` when a round starts and ends. That's PHP (`src/server/`), which appends a line to `.hh-data/plays.log` in the document root. Apache refuses every request for `.hh-data/`, and deploys never delete it. No IP, cookie or name is stored. Counting is off on localhost unless the address has `?count`.

**Admin page.** https://happyhillz.com/secret-crm-door/ shows players (all time, today, 7 and 30 days), rounds, wins, best score, the last 14 days and the split by threat. It's password protected: wrong passwords are limited to 5 per 15 minutes, and it is kept out of search engines. Set or change the password with `npm run admin-password`, run in a terminal on a computer with the site's SSH key. It sends the password to the server's PHP over SSH, and only a hash is stored, in `.hh-data/admin.json`. The password is never in git.

**Test switches** (add to the address): `?bot` plays a round by itself, dodging and roaring; `?threat=buffalo` (or `elephants`, `boulders`) picks the threat; `?cats=page` turns the workers off; `?shot` draws the still used for the share image. `window.__packRun` shows the frame rate, how often each cat is repainted, and the game state.

## Automatic deploys

Pushing to `main` with changes under `site/` (or to the panther rig) runs [.github/workflows/deploy-site.yml](../.github/workflows/deploy-site.yml). The workflow builds the site and runs the same `scripts/deploy.js`. It needs three repository secrets: `HAPPYHILLZ_SSH_KEY`, `HAPPYHILLZ_HOST` and `HAPPYHILLZ_USER`. The deploy key is separate from personal keys and is authorized in HostGator. You can also start a deploy by hand from the Actions tab.

## Server

The document root is `~/public_html/website_adbe171a` on HostGator. The host alias `happyhillz` is defined in `~/.ssh/config` and uses the key `~/.ssh/happyhillz`. The deploy never touches anything outside that folder, and never deletes `.well-known/` or `cgi-bin/`. If SSH times out on port 22, set `HAPPYHILLZ_SSH_PORT=2222`.
