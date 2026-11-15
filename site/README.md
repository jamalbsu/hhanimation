# happyhillz.com

Landing page for Happy Hillz and the Panthers Pack cartoon. It's a static site: HostGator serves `dist/` as plain files, and there is no backend.

- **Hero:** a live episode page (`src/trailer/`, currently ep 24 *Head-On: Elephant Herd*) runs inside a phone frame. The animation is drawn in real time, not played from a video.
- **Episodes:** the six most-watched Panthers Pack Shorts. They play in a YouTube player on the page: the landscape cut on big screens, the Short on phones.
- **Subscribe:** links to youtube.com/@HappyHillz.

## Commands

Run these from this folder (`site/`):

| Command | What it does |
|---|---|
| `npm run videos` | Re-reads the public channel and updates `data/videos.json`, the card thumbnails and the share image. Run it when new episodes are up, then build. |
| `npm run build` | Builds `dist/`. |
| `npm run check-server` | Tests SSH access and lists the document root. |
| `npm run deploy:dry` | Builds, uploads, and prints what would change on the server. Changes nothing. |
| `npm run deploy` | Builds, deploys, then fetches the site to confirm it serves this build. |

To preview locally, use the `happyhillz-site` entry in `../.claude/launch.json` (http://localhost:8780).

## Settings: `site.config.json`

- `trailer`: the episode page in the hero, and the YouTube title it matches.
- `featured.count` / `featured.exclude`: how many cards to show, and the titles to leave out. Season 7 is excluded for now; remove titles from the list to allow them.
- `forceHttps`: set to `true` once the SSL certificate is issued. The build then adds the http→https and www redirect to `.htaccess`.

## Automatic deploys

Pushing to `main` with changes under `site/` runs [.github/workflows/deploy-site.yml](../.github/workflows/deploy-site.yml). The workflow builds the site and runs the same `scripts/deploy.js`. It needs three repository secrets: `HAPPYHILLZ_SSH_KEY`, `HAPPYHILLZ_HOST` and `HAPPYHILLZ_USER`. The deploy key is separate from personal keys and is named `happyhillz-deploy.pub` in HostGator. You can also start a deploy by hand from the Actions tab.

## Server

The document root is `~/public_html/website_adbe171a` on HostGator. The host alias `happyhillz` is defined in `~/.ssh/config` and uses the key `~/.ssh/happyhillz`. The deploy never touches anything outside that folder, and never deletes `.well-known/` or `cgi-bin/`. If SSH times out on port 22, set `HAPPYHILLZ_SSH_PORT=2222`.
