# happyhillz.com

Website for Happy Hillz and the Panthers Pack cartoon. It's a static site: HostGator serves `dist/` as plain files, and there is no backend.

| Page | What's on it |
|---|---|
| `/` | Hero with a live episode drawing in a phone frame (`src/trailer/`), the six most-watched episodes (they play in a YouTube player on the page), the show format, About the cartoon, and Subscribe. |
| `/episodes/` | Every episode, latest first. |
| `/episodes/<slug>/` | One page per episode: the YouTube player, the description and topics from YouTube, the episode number, length and date, previous and next episode links, and more episodes. |
| `/404.html` | A real "not found" page. Unknown addresses return a 404 status, which search engines need. |

## Search engines

- Each page has its own title, description, canonical URL and share image (Open Graph and Twitter).
- Structured data (schema.org JSON-LD):
  - home: WebSite, Organization and the Panthers Pack series;
  - episodes page: an ItemList;
  - each episode page: a **VideoObject** (date, length, thumbnail, YouTube embed) and breadcrumbs.
- `sitemap.xml` lists every page and includes Google's video extension for each episode. `robots.txt` points to it.
- To verify the site in Google Search Console or Bing Webmaster Tools with a meta tag, put the token under `searchVerification` in `site.config.json`, then build and deploy.

## Commands

Run these from this folder (`site/`):

| Command | What it does |
|---|---|
| `npm run videos` | Re-reads the public channel. It updates `data/videos.json` (episodes, views, dates, lengths, descriptions, tags) and adds images for new episodes. `-- --refresh` re-reads everything. |
| `npm run build` | Builds `dist/`. |
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

## Automatic deploys

Pushing to `main` with changes under `site/` runs [.github/workflows/deploy-site.yml](../.github/workflows/deploy-site.yml). The workflow builds the site and runs the same `scripts/deploy.js`. It needs three repository secrets: `HAPPYHILLZ_SSH_KEY`, `HAPPYHILLZ_HOST` and `HAPPYHILLZ_USER`. The deploy key is separate from personal keys and is authorized in HostGator. You can also start a deploy by hand from the Actions tab.

## Server

The document root is `~/public_html/website_adbe171a` on HostGator. The host alias `happyhillz` is defined in `~/.ssh/config` and uses the key `~/.ssh/happyhillz`. The deploy never touches anything outside that folder, and never deletes `.well-known/` or `cgi-bin/`. If SSH times out on port 22, set `HAPPYHILLZ_SSH_PORT=2222`.
