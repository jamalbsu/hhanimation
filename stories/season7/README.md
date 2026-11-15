# PANTHERA Season 7 — THE RAIN RUN · shared builder brief

**How to use this folder:** this file plus one episode file (`36-…md` to `40-…md`) is one complete prompt. Read this file first, then the episode. Each episode file tells you what to build; this file tells you everything that's true for all five.

---

## The job

Build one episode page per prompt: a self-contained HTML file (canvas animation plus a generated WebAudio score), 28 seconds long, in the project root at `C:\Users\Jamal\HHanimation`.

**Do not render video.** The user approves every HTML page in the browser first. Rendering to MP4 (a vertical Short and a landscape cut from the same page) happens later with `node tools/render-hf.js <pages>`.

## What PANTHERA is and who watches it

PANTHERA ("Panthers Pack") is a cartoon series of YouTube Shorts on the channel @HappyHillz. A pack of big cats runs through the wild; each episode something enormous comes at them and they get through it. Episodes 1–35 are published.

The audience is a phone Shorts feed, family-friendly, often muted. A viewer decides in the first second whether to keep watching. That drives three rules that matter more than any other detail in these prompts:

1. **The threat is on screen and named inside the first second.** The pack is already at full gallop when the video starts.
2. **The story must read with the sound off.** Pops (big comic words), tags and speech bubbles carry it.
3. **One threat per episode.** Earlier episodes with several threats flopped.

What the view counts say so far:

| Worked | Flopped |
|---|---|
| One unmissable hazard charging straight at the pack: Avalanche (659 views), Crossfire (636), Buffalo Stampede (175), Elephant Charge (173) | Sequels and "returns" |
| Water episodes | Cast-intro episodes |
| | Cold snow scenes |
| | Stories that mix several threats |

## The season

**Logline:** The rains are late and the last river is drying up. The Panthers Pack runs to find the storm. Everyone they meet teaches them something: being fast isn't the only way to win.

**Places, in order:** the last river → golden grassland → red dunes → misty highland → back to the old river, now dry.

**One lesson per episode, always learned from someone smaller or slower:**

| Ep | Title | Lesson | Hero cat |
|---|---|---|---|
| 36 | Buffalo River | Courage: run *to* the problem | Jaguar |
| 37 | Zebra Crossing | Patience: stand still | Black Panther, Leopard |
| 38 | Sand Avalanche | Listening | Black Panther |
| 39 | Rhino Fog | Kindness to the ones who scared you | Leopard |
| 40 | Storm Wall (finale) | All of it, together | The whole pack |

Every episode makes full sense on its own. The rain quest is only the last line of each one. There is no compass HUD this season: the pack finds the rain through what friends tell them.

## The adventure rules every episode follows

1. **Second 1:** the pack is already running and one huge threat is coming straight at them. Nobody slows down at the end.
2. **One threat.** The twist makes *the same threat* worse. It never adds a second one.
3. **Pass:** someone they run past. It's colour or a joke, and sometimes it sets something up.
4. **Meet:** someone smaller or slower who needs help.
5. **Exchange:** the pack gives help. The friend gives back a word, a skill or a secret.
6. **Twist (12–14 s):** speed alone can't fix it any more.
7. **Payoff:** what they were given saves them. Luck never rescues them; their choices do.
8. **A laugh and a heart beat** in every episode.
9. **The last line points to the next place.** End card: NEXT: …

Nobody is ever hurt. Threats are big and loud, never cruel.

## The pack

Four cats are on screen, from `PACK` and `DAY_PANTHER` in `tools/hunt-build.js`. Use the original rig in `panther/panther-rig.js` only; the user rejected the `teasers/` rig for episodes.

| Cat | Look | Character | How to address it in config |
|---|---|---|---|
| **Black Panther** (lead) | Black coat, warm rim light, runs in front | The calm leader. Few words. Makes the call at the twist. | speech `me: true`; a rider with no `cat` sits on him; `back: true` anchors a bubble to his rider |
| **The quiet one** | Second black panther, a little smaller | Never speaks. Reacts with looks only. Gets one line all season: the last line of ep 40. | `cat: 0` |
| **Leopard** | Gold with rosettes, the smallest and lightest | Quick and warm. Acts first, explains later. Leaps and climbs. | `cat: 1` |
| **Jaguar** | Darker gold, heavy rosettes, the biggest | Big-hearted, blunt, funny, complains out loud. Loves water. | `cat: 2` |

Check the `cat` order on screen in the built page before relying on it.

## Look

- Keep the Season 6 picture: `depth: true`, `real: true` (soft background, air haze, dust motes, water glitter, bloom, film grade) and `sound2: true`.
- Each episode has its own palette, given in its file. Sky gradients are three stops, top to horizon.
- **Every new animal must read as a silhouette at about 40 px tall on a phone.** Exaggerate its one feature: the fennec's ears, the ostrich's neck, the tortoise's dome, the oxpecker's red beak.
- Photosensitivity: no rapid full-screen flicker. Any strobing effect stays under 3 changes per second and is a moving wipe, not a flash.

## Text on screen

| Kind | Rule |
|---|---|
| **Pop** (big comic word) | 1–3 words, at the hook, the twist and the payoff. `boom: true` for the big ones. |
| **Tag** | A label and one line of facts, pinned to an animal: `HIPPOS ×4` / `1.5 TONS · HEAD-ON`. |
| **Cloud** | A soft coloured pop for the warm moment, built with `cloud()`. |
| **Speech bubble** | ALL CAPS, two lines at most (`'LINE ONE|LINE TWO'`), about 22 characters per line, on screen 1.2–2.2 s. Never two bubbles at once. Never on top of a pop. |

Use the wording in the episode file exactly; the lines were written to fit these limits. In the episode files, " / " marks the line break.

In the vertical 9:16 frame, keep text out from under the Shorts interface: the button column on the right edge and the caption strip along the bottom.

## Engine facts, so you don't have to rediscover them

**Build chain.** `tools/season6-build.js` exports `season6(cfg, file)`. It takes the output of `saga()` and splices in `season6.txt`, `real.txt` and `sound2.txt` with `R(a, b)`, a replace that must match exactly once and throws otherwise. Build Season 7 the same way: a new `tools/season7-build.js` on top of `season6()`, with new drawing code in a new `tools/season7.txt`, and an `EPISODES` array like Season 6's. It takes the same command line as `season6-build.js`.

**Episodes 1–35 are published.** Don't change what their builders produce. Add new behaviour behind new config keys.

**Config vocabulary, with the closest earlier use:**

| Need | Config | Precedent |
|---|---|---|
| A herd charging head-on | `herds: [{ kind, dir: -1, at: [t, lane], spread, spray, dust, speed, hd, members }]` | ep 31 hippos, ep 34 boars |
| A herd that brakes to a stop in front of the pack | head-on herd with `speed` falling to 0 | ep 34, second boar herd |
| A herd running the same way as the pack | `dir: 1, fx0` | ep 33 oryx, ep 35 giraffes |
| A young animal beside the pack | a `dir: 1` member with `size` about 0.5 | ep 35 giraffe calf |
| A wall chasing from behind | `wall: { type, fx: [[t, distance]] }`; types `water`, `fire`, default snow; `ocean: true` recolours it | eps 9, 12, 23, 32 |
| River | `river: { at, w, col, bank }` | ep 31 |
| Cliff wall, gorge | `cliff: { z, h, z2, until }`, `gorge: { at, w, snap }` | eps 14, 28, 34 |
| Small friend riding a cat | `riders: [{ kind, from, until, cat, size }]`, drawn by the `SPR` sprites in `season6.txt` (otter, meerkat, crab, turtle, gull, tumbleweed) | ep 31 otter, ep 33 meerkats |
| Small animals on the ground or in the air | `critters: [{ kind, n, at, f, z, from, until, size, vz }]` | ep 32 |
| Speech | `says: [{ t0, t1, text, … }]` anchored by `me`, `back`, `cat`, `pt: [t, f, z, h]`, `herd` + `m`, `friend` or `scr` | all of Season 6 |
| Pops, clouds, tags | `pops`, `cloud()`, `tags` | all |
| Camera | `cam: [{ t, yaw, tilt, zoom, y, x, d }]`; the top-down dodge is tilt about 58, zoom about 0.5 | ep 31 at 2.1 s |
| Slow motion, shake, hits, colour wipes | `slow: [[t0, t1, rate]]`, `shake`, `flashes`, `slashes` | all |
| Weather and light | `rain`, `bolts`, `dark`, `haze`, `sand`, `rainbow`, `rays`, `grade`, `glow` | eps 12, 15, 21, 29, 33 |
| Elephant calls | `trumpets: [t]` | eps 24, 26, 30 |

**Animals that already exist:** elephant, wildebeest, zebra, goat, impala, boar, buffalo, deer, gazelle, rhino, giraffe, hippo, oryx, flamingos, monkeys.

**Biomes that already exist:** night, savanna, snow, desert, autumn, jungle, blossom, dryland, storm, canyon, stormnight, dusk, beach, dustland, jungleDay, moonplain. A new one is a few lines in the builder's `BIO` table. The `biomes` list takes several `[name, time]` entries, so a biome can change mid-episode (`tools/adv-build.js` does this).

**The pack only ever runs one way.** A "turn around" is staged, never animated: cover the moment with the diagonal colour wipe (`slashes`, 0.4 s, with a whoosh) and put a new herd on the other side of it. Episode 31's "THEY TURNED!" worked this way: a second hippo herd with `dir: 1` that stands still, then chases.

**Sound is mostly automatic** (`sound2.txt`):

- The score builds to, and hits on, the times in `flashes`. It goes silent before the biggest hit only, so choose that hit deliberately.
- The melody leaves room wherever a `says` bubble is up.
- The ambience bed comes from the biome's name: names containing dust, desert, canyon, beach, snow or storm get wind; jungle gets jungle; night or moon gets night. A river adds water.
- A low rumble swells as herds come near. A head-on herd crossing the pack gets a pass-by whoosh.
- Voices are babble in a register picked from the speaker: `me` is a cat voice; `back` and `pt` are small voices; a herd of elephant, hippo, buffalo or rhino is a big voice; other herds are mid.
- Music is set with `music: EPIC(seed, root, bpm)` (minor, brass lead, harp, strings) or a custom object such as `{ seed, bpm, root, prog: 'hope', lead: 'flute', arp: 'harp', pad: 'strings', epic: true }`.

**The page contract the renderer depends on** (`tools/render-hf.js`):

- Exactly one `<script>` block.
- `frame(now)` draws the whole frame from time alone, and `requestAnimationFrame(frame);` sits on its own line.
- `window.cap(i)`, `window.READY`, `window.DUR`, `window.CAPTURING` and `window.renderAudioWav()` keep working.
- Layout comes from `innerWidth` and `innerHeight`, portrait when the height is larger.
- No `Math.random` in drawing code. Use the seeded `hh()` and `rng()`.
- The `<title>` is the episode title, and the file is `panthera-<N>-<slug>.html`.

## Done when (every episode)

- [ ] The page builds with no `R:` match errors and opens with no console errors.
- [ ] At 0.9 s the threat fills the frame and its pop is up. This frame is the thumbnail.
- [ ] The pack is running at 0.0 s and is still at full speed at the end card.
- [ ] Every bubble, pop and tag in the episode file appears, with that wording, readable in both 1080×1920 and 1920×1080.
- [ ] No two bubbles overlap in time, and none sits on a pop.
- [ ] The hook, the twist and the payoff each land on a score hit.
- [ ] Jumping to any time and back draws the same frame (the seek check in `render-hf.js` passes).
- [ ] `node tools/capf.js sndcheck <slot> x` with `PAGE=` set reports no sound errors.
- [ ] The end card shows the next episode's title.
- [ ] Episodes 1–35 still build to the same pages as before.

Then stop and show the user the page. Don't render.
