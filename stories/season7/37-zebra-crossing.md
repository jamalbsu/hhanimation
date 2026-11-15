# EP 37 · ZEBRA CROSSING — build prompt

Read `README.md` in this folder first. It holds the rules, the cast, the engine facts and the done-when list that apply to every episode.

**Build:** `panthera-37-zebra-crossing.html`, title "Zebra Crossing", 28 s, end card `NEXT: SAND AVALANCHE`. Build the page only; don't render.

## The story in one breath

Two zebra herds charge in from both sides with the pack caught in the middle. The Leopard snatches a hundred-year-old tortoise from under the hooves and gives him the ride of his life. He pays them back with the one thing runners never try: "When they meet… stand still." When the herds come back as two solid walls with no gap, the fastest cats in the wild stop dead, and the stripes part around them like water around a rock.

**What the viewer should feel, in order:** shock → a laugh (the ostrich) → delight (the tortoise loving the speed) → disbelief at his advice → dread → two seconds of held breath → relief and a grin.

**The lesson, never said as a moral:** not everything is a race.

This episode is a nod to the series' second most-watched Short, *Crossfire*, where two herds converged on the pack. It must not copy it: there the herds were gazelles and buffalo and the pack outran them. Here both herds are zebras, they come from the *sides*, and the answer is to stop.

## The world

- **Place:** open grassland in the dry season, late morning. Tall straw-coloured grass, a few flat-topped acacias far apart, a huge pale sky, heat shimmer on the horizon.
- **Palette:** sky `#5a8cc8` → `#b9d4ea` → `#f4e6c0`. Grass and ground `#e4c27c`, `#caa052`, `#a8803a`. Dust `rgb(206,160,110)` in low ribbons.
- **The look:** the zebras are the only black-and-white things on screen. Pure black and white against all that gold is the visual signature. Keep the cats' rim light warm so they never merge with the stripes.
- **Start from:** a new midday grassland biome on the `savanna` base (the existing `dryland` is too dusky).
- A line of small birds flies overhead in the pack's direction for the first seconds. It needs no explanation.

## Cast

| Who | Look | Character and voice |
|---|---|---|
| **Zebras, two herds** | The existing zebra, about 12 per herd, or as many as the frame rate allows. Make the tag's number match what's on screen | A force of nature. No lines |
| **The tortoise** | A new side-view sprite (the existing `turtle` is a sea turtle seen from above). A high round dome, olive-brown `#6b6a3a` with ochre plates, a long wrinkled neck stretched forward, four short legs that paddle in the air when he rides | A hundred years old, unhurried, dry and kind. Slow, low voice |
| **The ostrich** | New. Black body, white wing and tail plumes, long pink neck and legs, a small head with big eyelashes. Taller than the cats. His neck bobs as he runs | A show-off. Honking mid voice |

## Beat sheet

| Time | Picture and camera | Words | Sound |
|---|---|---|---|
| 0.0 | Low side view. The pack at full gallop through tall grass, birds overhead | — | wind, gallop pulse |
| 0.5 | Zebras burst in from the LEFT edge of frame | POP **ZEBRAS!** | **hit 1** |
| 1.3 | Cut to top-down. A second herd from the RIGHT. Two lines of stripes close on the pack like scissors | POP **BOTH SIDES!** · TAG *ZEBRAS ×24* / *FROM BOTH SIDES* | second, smaller hit |
| 2.4–3.6 | Slow motion (about 0.45). The herds are loose; the pack slips through a gap. Bands of stripes sweep across the edges of the frame | TAG *STRIPES CONFUSE THE EYE* | whoosh |
| 4.4–5.6 | Side view. Pass: the ostrich overtakes the pack, looking back at them | OSTRICH: TOO SLOW, / KITTIES! | honk-laugh |
| 6.2–7.1 | Ahead, the tortoise plods across the grass, right where the herds will meet | TORTOISE: OH DEAR... / NOT AGAIN. | — |
| 7.2 | The Leopard swerves and flips him onto her back a beat before hooves land on the spot | — | thump, hooves miss |
| 8.4–9.7 | Close. The tortoise rides, neck out, legs paddling | TORTOISE: WHEEE! 100 YEARS... / NEVER THIS FAST! | laugh |
| 9.8–11.0 | He turns his head to the cats | TORTOISE: YOU GAVE ME FAST. / I'LL GIVE YOU SLOW. | music softens |
| 11.0–12.2 | — | TORTOISE: WHEN THEY MEET... / STAND STILL. | — |
| 12.3–13.1 | The cats look at each other | JAGUAR: STAND STILL?! / WE'RE RUNNERS! | comic sting |
| 13.2 | **TWIST.** Top-down. The herds have wheeled round and come back as two solid lines, shoulder to shoulder, closing ahead and behind. No gap anywhere | POP **NO WAY OUT!** | drums, **hit 2** |
| 14.0–14.8 | Close on the Black Panther | BLACK PANTHER: TRUST HIM. / STOP! | — |
| 14.8 | The pack skids to a halt. Dust fans out in front of them | — | skid, **music cuts to a heartbeat** |
| 15.0–17.0 | Slow motion, starting top-down and settling low among the cats. The two lines meet and part around the still pack. Zebras stream past on both sides at full stretch; the stripes turn in a slow spiral. None touches them | — | heartbeat, low choir, muffled hooves |
| 17.2 | The dust settles. Four cats and a tortoise, untouched, alone on the plain | POP **NOT A SCRATCH!** | **hit 3, the biggest**; score returns |
| 17.8 | They burst back into a run | — | — |
| 18.4–19.7 | — | TORTOISE: SEE? NOT EVERYTHING / IS A RACE. | — |
| 19.9–21.0 | They pass the ostrich: head stuck in the sand, tail feathers up, legs braced | OSTRICH (muffled): IS IT / OVER? | comic bonk |
| 21.2 | The zebras circle back and run alongside: stripes and spots together | cloud **STRIPES & SPOTS!** | full score |
| 22.4–23.8 | The tortoise points with his chin. Red dunes rise on the horizon | TORTOISE: THE RAIN COMES / OVER THE RED DUNES. | — |
| 24.0–25.4 | Without slowing, the Leopard tips him onto a soft tuft in the shade of an acacia | TORTOISE: SEE YOU... / EVENTUALLY! | pack motif |
| 25.8 | End card | **NEXT: SAND AVALANCHE** | cadence |

## The three shots that must land

1. **The hook (0.5–1.6 s).** Stripes from one side, then the other, inside the first second and a half. The top-down frame at 1.3 s is the thumbnail: two walls of stripes closing like scissors on four spotted and black cats. The geometry has to be readable at a glance, so keep the top-down shot clean: flat gold ground, no trees.
2. **The decision (13.2–14.8 s).** The viewer must see for themselves that there is no gap; that is why the twist is top-down. At the hook the herds were loose and the pack found a way through. Now they are two unbroken lines. Then cut close to the Black Panther for the call. The stop has to read as a choice made against every instinct, which is why the Jaguar objects first.
3. **The standstill (14.8–17.2 s).** This is the only time in the whole season the pack stops, and it should feel enormous. The cats need a real standing pose: weight back from the skid, ears flat, tails low, then heads turning to follow the zebras past. A frozen run cycle will ruin it. Around them everything moves at full speed in slow motion. The zebras bend their paths around the pack the way water bends around a rock. Hold it for two full seconds.

## Music and sound

- Lighter than episode 36, with room for comedy: try `{ seed: 37, bpm: 126, root: 60, prog: 'hope', lead: 'whistle', arp: 'harp', pad: 'strings', epic: true }`.
- Three hits in `flashes`: the hook (about 0.5), the twist (13.2) and the reveal (17.2). The reveal is the biggest. The silence before it is the standstill itself: heartbeat only from 14.8.
- The tortoise shouldn't sound like the other small friends. Give him a slow, low voice.

## What exists and what's new

**Reuse:** the zebra; the top-down camera; slow motion; pops, tags and clouds; riders.

**New:**
- **Herds that cross the pack's path from the sides.** Herds today run along the pack's line, toward it or with it.
- **The parting.** Zebra paths that bend around a point as they pass it.
- **The pack at speed zero with a standing pose**, and the skid into it.
- **The tortoise sprite**, riding the Leopard, with a speech bubble anchored to him. `back: true` only anchors to the lead cat's rider.
- **The ostrich**, running, then planted head-down.
- **A voice override** for one `says` entry, so the tortoise can be slow and low.
- **The stripe sweep.** Moving bands at the frame edges for under a second. It is a wipe, not a flicker: nothing on screen alternates faster than three times a second.

## Don't

- Don't add a predator or any second danger. The only threat is the crossing.
- Don't let a zebra touch a cat or jump over one. The parting is clean.
- Don't shorten the standstill below two seconds or put a bubble in it.
- Don't state the moral beyond the tortoise's one line.
- Don't stop to set the tortoise down. Nobody slows at the end.

## Done when

Everything in the README's list, plus:

- [ ] In the top-down frame at 13.2 s a viewer can see there is no gap.
- [ ] From 14.8 to 17.2 s the cats are standing, in a standing pose, while the zebras move.
- [ ] Nothing in the stripe sweep flickers.
- [ ] The tortoise is readable on the Leopard's back in the vertical frame.
