# happyhillz.com

Website for Happy Hillz and the Panthers Pack cartoon. HostGator serves `dist/` as plain files. The only server code is a little PHP in `/api/`: the game's play counter and the shop's checkout.

| Page | What's on it |
|---|---|
| `/` | Hero with a live episode drawing in a phone frame (`src/trailer/`), the six most-watched episodes (they play in a YouTube player on the page), the show format, About the cartoon, and Subscribe. |
| `/episodes/` | Every episode, latest first. |
| `/episodes/<slug>/` | One page per episode: the YouTube player, the description and topics from YouTube, the episode number, length and date, previous and next episode links, and more episodes. |
| `/games/` | The games. For now there is one: Pack Run. |
| `/games/pack-run/` | Pack Run, a free browser game (see [The game](#the-game-pack-run)), with how to play and links to the episodes behind it. |
| `/shop/` | Merch from Printify (see [The shop](#the-shop)). Built only when `data/shop.json` has products. |
| `/shop/<product>/` | One product: pictures per color, color and size picker, price with US shipping, and Stripe's checkout in a dialog on the page. |
| `/shop/thanks/` | Where Stripe sends the shopper after paying. Not indexed. |
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
| `npm run shop-keys` | Stores the shop's Printify token and Stripe keys on the server (typed privately; Enter keeps a stored key), then checks that they work. |
| `npm run shop-sync` | Reads the products from Printify (through the server) into `data/shop.json` and `src/shop/`. Run after saving or publishing a product in Printify, then commit. It also confirms products waiting in "Publishing" back to Printify, with their page here as the link. `-- --shop <id>` picks the Printify shop if there are several. |
| `npm run typecheck` | Type-checks `game.js` with TypeScript, with no change to how it is built or runs. The game stays plain JavaScript; types are written as JSDoc comments. It catches misspelled names, wrong kinds of values and calls to things that do not exist. `globals.d.ts` next to the game lists what the cartoon code provides (the panther rig and the herds) and the shape of a round (`RunState`). Run it before committing a change to the game. |
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
- `shop`: see [The shop](#the-shop).

## The game: Pack Run

The pack runs down a ten-lane savanna trail while one huge threat charges straight at it, the rule of every episode. The player picks the threat: an elephant charge, a buffalo stampede or a rockslide. A round lasts 45 seconds.

**How to play.** Swipe left or right (arrow keys, or A and D) to switch lanes. Swipe up (up arrow or W) to jump. Tap (Space, F or J; hold to keep roaring) to roar: the lead panther fires a blast of sound down its lane. A roar never hurts anything. It spooks a buffalo off the trail with one hit and an elephant with three, and cracks a boulder with two (a big one takes three) or a log with one. Clearing them scores 20, 50, 30 and 10 points. Logs and boulders can also be jumped; elephants and buffalo can't.

**They shoot back.** Elephants within a lane of the pack squirt water balls, buffalo fling mud balls, more often as the round goes on. A roar and a ball that meet in a lane cancel each other (+5). Jumping clears a ball; one that hits costs a paw.

**Diamonds and armor.** Every 7 to 10 seconds a diamond appears in an open lane. Picking it up puts on one of four armors (`ARMORS` in `game.js`), shown as a shell around the pack and a chip with a timer in the corner: Bubble Armor (blue, 10 s, takes three bumps or balls), Rock Armor (orange, 7 s, the pack smashes through whatever it runs into, for points), Triple Roar (pink, 8 s, each roar goes down three lanes) Mirror Armor (green, 9 s, balls bounce back as roars) and Twin Stream (purple, 7 s, two lines of small roars fire on their own down the pack's lane) and Laser (red, 6 s, a beam down the pack's lane that clears everything in it and every ball it crosses). Which one a diamond gives is random (never the one the pack is already wearing).

**Nitro.** Orange nitro cans appear every 3 to 5 seconds, usually in the open lane (never while a boost is on). One doubles the pack's speed for 9,000 units of trail, about three seconds, which doubles the meters scored; everything comes at you twice as fast. The cats' legs are capped at a fast gallop so the picture doesn't blur.

**Levels.** The start and end screens have Easy and Hard (`LEVELS` in `game.js`). Hard spawns waves two and a half times as often, closes up to 1.6 more lanes per wave (times the trail's width), runs the pack 10% and the herds 15% faster, and lets the herds shoot from three lanes away, about two and a half times as often, starting at 3.5 s. The numbers are in `LEVELS` in `game.js`. Best scores are kept per threat and level. Each shell is painted once and then only placed, to keep 60 fps.

 Stars are 25 points each, plus a point per meter run, and finishing the round adds 200. Three bumps end the round early. P or Esc pauses, M turns the sound on or off. Sound starts off.

**How it's built.** `src/games/pack-run/game.js` is the whole game. The build puts two pieces of the show into it at its markers and writes `dist/games/pack-run/pack-run.js`:

- the panther rig, `../panther/panther-rig.js`, unchanged, so the cats are the cats of the episodes;
- the elephants and buffalo of the episode engine: the "hoofed animals" section of the trailer episode (`trailer.page` in `site.config.json`).

`src/games/pack-run/page.html` is the page around it. The game's date for the sitemap and structured data is `GAME.updated` in `scripts/build.js`; change it when the game changes. Pushing a change to the rig also redeploys the site, so the game picks it up.

**Speed.** The rig paints each cat with thousands of small shapes, more than a browser's drawing thread can rasterize 60 times a second. So the game file also runs as two to four Web Workers that paint the cats and the herds in software on other cores, while the page only places the pictures. Each animal's pose is repainted up to 30 times a second, the frame rate of the episodes; the scene itself runs at 60 fps. Browsers without `OffscreenCanvas` paint on the page instead, and a device that can't keep up gets a lower resolution.

**Counting players.** The game keeps a random number in the player's browser (`packrun.player` in localStorage) and posts it to `/api/play.php` when a round starts and ends. That's PHP (`src/server/`), which appends a line to `.hh-data/plays.log` in the document root. Apache refuses every request for `.hh-data/`, and deploys never delete it. No IP, cookie or name is stored. Counting is off on localhost unless the address has `?count`.

**Admin page.** https://happyhillz.com/secret-crm-door/ shows players (all time, today, 7 and 30 days), rounds, wins, best score, the last 14 days and the split by threat. It's password protected: wrong passwords are limited to 5 per 15 minutes, and it is kept out of search engines. Set or change the password with `npm run admin-password`, run in a terminal on a computer with the site's SSH key. It sends the password to the server's PHP over SSH, and only a hash is stored, in `.hh-data/admin.json`. The password is never in git.

**Test switches** (add to the address): `?bot` plays a round by itself, dodging and roaring; `?threat=buffalo` (or `elephants`, `boulders`) picks the threat; `?armor=bubble` (or `rock`, `triple`, `mirror`, `twin`, `laser`) wears that armor all round; `?level=hard` picks the level; `?nitro` keeps the nitro boost on; `?cats=page` turns the workers off; `?shot` draws the still used for the share image. `?shot&faces` paints one cat at a sweep of camera angles, for checking its face (`&tilt=` the camera height, `&coat=panther|leopardDay|jaguar|blackP2`, `&step=` and `&from=` the angles, `&cols=`, and `&focus=head&zoom=3.4` to close in on the head). `window.__packRun` shows the frame rate, how often each cat is repainted, and the game state.

## The shop

Printify prints and ships; Stripe takes the payment; the site sits in between.

1. **Products.** `npm run shop-sync` asks the server's PHP, over SSH, to read the Printify shop. It saves each product's title, description, enabled colors and sizes, retail prices (as set in Printify), the mockups chosen for publishing and Printify's US shipping cost per variant. Shipping is measured with Printify's order calculator (1 and 2 items), because its catalog shipping table was out of date: it listed $3.99 for the tee, while orders cost $5.35. The data goes in `data/shop.json` and the pictures in `src/shop/<product>/`. Commit both. The Printify token never leaves the server.
2. **Checkout.** Buy now posts the product, variant and quantity to `/api/checkout.php`. The server looks up the price and shipping in the catalog the build wrote (`api/shop-catalog.php`), never trusting a price from the browser. It then creates a Stripe Checkout Session (`ui_mode: embedded_page`, US addresses only, phone number required) and returns its client secret. The page loads Stripe.js (only at that moment) and shows Stripe's checkout in a dialog. Card details go straight to Stripe.
3. **The order.** Stripe calls `/api/stripe-webhook.php` when a payment completes. The server checks Stripe's signature, re-reads the session, and creates the Printify order with the shopper's variant, quantity and address. The order's `external_id` comes from the session, so a retry can never order twice. Printify waits for its approval window (24 hours by default) before printing, so an order can still be cancelled there. If Printify refuses, the webhook answers 500 and Stripe retries for up to three days.
4. **Test mode.** With Stripe test keys, a test payment doesn't create a Printify order. The webhook only asks Printify to price shipping for the same items and address, which checks the product, variant and address. Pay with the card 4242 4242 4242 4242, any future date and any CVC.

**What's logged.** `.hh-data/shop.log` on the server gets one line per event: session ids, Printify order ids, results and errors. It holds no names, emails or addresses; those live in Stripe and Printify.

**Settings** (`shop` in `site.config.json`):
- `public`: `false` keeps the shop out of search, with no homepage section, no sitemap entry and noindex. The Shop link in the menu and footer shows whenever there are products. Set it to `true` to launch; that also needs `contactEmail`.
- `contactEmail`: the address in the returns policy.
- `printifyShopId`: needed only if the Printify account has several shops.
- `countries`: where checkout ships (`["US"]`).
- `deliveryDays`: the estimate shown in checkout and on the page, in business days.
- `maxQty`: the most of one item per order.
- `collectTax`: `true` turns on Stripe Tax, which must first be set up in Stripe.
- `imagesPerColor`: how many mockups each color shows.
- `hideProducts`: Printify product ids to leave off the site.

**Keys** live only in `.hh-data/shop.json` on the server, set with `npm run shop-keys`:
- the Printify token, with scopes shops.read, products.read, catalog.read, orders.read and orders.write;
- the Stripe secret key and publishable key, both test or both live;
- the Stripe webhook signing secret, for an endpoint at `https://happyhillz.com/api/stripe-webhook.php` listening to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

To go live, run `npm run shop-keys` again with the live keys and the live endpoint's secret.

The API version is pinned in `src/server/shop-lib.php` (`STRIPE_VERSION`), and the Stripe.js path in `src/shop.js` matches it.

## Automatic deploys

Pushing to `main` with changes under `site/` (or to the panther rig) runs [.github/workflows/deploy-site.yml](../.github/workflows/deploy-site.yml). The workflow builds the site and runs the same `scripts/deploy.js`. It needs three repository secrets: `HAPPYHILLZ_SSH_KEY`, `HAPPYHILLZ_HOST` and `HAPPYHILLZ_USER`. The deploy key is separate from personal keys and is authorized in HostGator. You can also start a deploy by hand from the Actions tab.

## Server

The document root is `~/public_html/website_adbe171a` on HostGator. The host alias `happyhillz` is defined in `~/.ssh/config` and uses the key `~/.ssh/happyhillz`. The deploy never touches anything outside that folder, and never deletes `.well-known/`, `cgi-bin/` or `.hh-data/` (the play counter, the admin password hash, and the shop's keys and log). If SSH times out on port 22, set `HAPPYHILLZ_SSH_PORT=2222`.
