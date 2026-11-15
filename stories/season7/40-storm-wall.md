# EP 40 · STORM WALL (season finale) — build prompt

Read `README.md` in this folder first. It holds the rules, the cast, the engine facts and the done-when list that apply to every episode.

**Build:** `panthera-40-storm-wall.html`, title "Storm Wall", 28 s, end card `SEASON FINALE` with `SEASON 8?` beneath. Build the page only; don't render.

## The story in one breath

The pack is back at the river from episode 36, and it's gone: a bed of cracked mud. A storm the size of the horizon rolls in head-on. For once the pack runs *into* the threat, because this is the rain they've chased all season. In the riverbed they find a baby elephant, born in the drought, hiding from a sound it has never heard. They show it its first rain. Then the storm sends the river back all at once, as a flash flood, and getting the calf out takes every cat's own skill and a mother's trunk. The rain turns the world green.

**What the viewer should feel, in order:** awe → surprise that the cats are glad → tenderness ("What's… rain?") → wonder at the first drops → alarm → a second of real worry for the Jaguar → relief → joy that keeps growing to the last frame.

**The lesson, never said out loud:** together. Each cat does the thing only it can do.

A new viewer must be able to enjoy this without having seen episodes 36–39. The season's friends appear, but only as a parade in the background.

## The world

The episode has three looks, and the change between them is the story.

1. **Dry (0–10 s).** A wide, flat riverbed of pale cracked mud (`#cdb89a`, darker in the cracks), with steep banks three or four metres high on both sides, dead reeds, and a dark high-water line near the top of the banks. The sun is still out behind the camera, so the cats are lit warm. Ahead, the storm: slate grey `#2a3442` to `#4a5666`, flat-topped, with a pale curtain of rain hanging to the ground and a skirt of dust rolling in front of it. Warm cats against a dark wall is the signature image.
2. **Rain (10–20 s).** The curtain arrives. The light drops, silver streaks fill the air, the mud darkens and shines. Then the flood: brown water, foam, torn reeds.
3. **Green (20–28 s).** The rain thins, the sun breaks through, a rainbow stands over the river. In a few seconds of time-lapse the ground goes from tan to fresh green (`#7fbf5a`), flowers open in white, yellow and pink, and the river runs blue-silver with sun glitter.

Lightning lives inside the storm as soft glows, about one every second and a half. No full-screen white flashes.

**Start from:** `dryland` for the first look and `storm` for the second. The `biomes` list takes several `[name, time]` entries, so the biome can change mid-episode; the Panther Adventure pages did this (`tools/adv-build.js`). The ambience bed is chosen from the first entry only.

## Cast

| Who | Look | Character and voice |
|---|---|---|
| **The storm wall** | New. Fills the sky from horizon to top of frame; anvil top; rain curtain; rolling dust skirt; lightning inside | Terrifying, and exactly what they wanted |
| **The baby elephant** | The existing elephant at about 0.42 size, with a bigger head and ears for its body, no tusks, a short trunk it can't quite control, grey-brown `#8a8078` | Has never seen rain. Frightened, then delighted. Needs a small voice, not the big elephant voice |
| **Mama elephants ×3** | The existing elephant, on top of the bank | Trumpeting, reaching |
| **The season's friends** | Two or three each of buffalo (with the calf), zebras, oryx and rhinos, in the far lanes | Scenery, all heading for the rain |
| **The flood** | The brown water wall from ep 12, coming *at* the pack down the riverbed | The river, coming home too fast |

## Beat sheet

| Time | Picture and camera | Words | Sound |
|---|---|---|---|
| 0.0 | Low view from behind and to one side. The pack gallops down the dry riverbed toward a sky that is already half storm | — | dry wind, low pulse |
| 0.4 | The camera tilts up: the storm fills the frame, lightning inside it | POP **STORM WALL!** · TAG *STORM FRONT* / *20 KM WIDE · HEAD-ON* | thunder, **hit 1** |
| 1.8–3.2 | Front view. The pack speeds up, *toward* it | BLACK PANTHER: IT'S THE RAIN! / WE FOUND IT! | brass swell |
| 3.6–5.6 | Pass: on the banks and in the far lanes, buffalo, zebras, oryx and rhinos all run the same way | (4.2–5.4) BUFFALO CALF: HI, / SPOTTY BUFFALO! | hooves, a lift in the music |
| 6.0–7.1 | In the riverbed, the baby elephant cowers under a dead tree as thunder cracks | BABY ELEPHANT: WHAT IS / THAT NOISE?! | thunder |
| 7.2–8.1 | The Jaguar swings past it | JAGUAR: THUNDER! / IT MEANS RAIN! | — |
| 8.2–9.2 | Close on the calf's face | BABY ELEPHANT: WHAT'S... / RAIN? | music thins to almost nothing |
| 9.3–10.3 | The calf trots out and runs among the cats | BLACK PANTHER: COME ON, / WE'LL SHOW YOU! | score lifts |
| 10.4 | Close-up, briefly slowed. The first drops punch small craters in the dust. One lands on the calf's trunk; it goes cross-eyed looking at it | — | music-box motif |
| 11.4–12.3 | The curtain arrives. Silver rain sweeps over everyone | BABY ELEPHANT: IT TICKLES! | rain roar, laughter |
| 12.4–12.8 | Close on the Black Panther. His ears turn up the riverbed | BLACK PANTHER: LISTEN... | **music cuts** |
| 12.8 | **TWIST.** Round the bend ahead comes a brown wall of water, filling the riverbed bank to bank | POP **FLASH FLOOD!** | **hit 2, the biggest** |
| 14.0 | The banks are too steep for the calf. On top, the mamas trumpet | — | trumpets |
| 14.6–15.4 | The Leopard springs up the bank in two bounds. The Black Panther gets behind the calf and pushes. A trunk reaches down from above | BLACK PANTHER: PUSH! | — |
| 15.6–17.0 | Slow motion (about 0.4). The trunk wraps the calf's trunk and lifts. The Black Panther leaps clear at the last instant. The flood hits; the Jaguar, last in the riverbed, vanishes under brown water | — | choir; the water explodes |
| 17.2 | The Jaguar bursts out of the flood onto the bank, shaking off spray | POP **SPLAAASH!** | **hit 3** |
| 18.0 | Everyone on the bank, the calf under its mother | cloud **EVERYONE'S SAFE!** | — |
| 18.4 | The river is alive again, full to the old line. The pack runs along the bank in the rain, elephants beside them | — | full score |
| 20.0 | The rain thins. Sun. A rainbow over the river. The land turns green and flowers open | — | strings and bells |
| 21.6–23.0 | The calf fills its trunk and sprays the cats as they run | BABY ELEPHANT: NOW I KNOW / WHAT RAIN IS! | laugh |
| 23.2 | Very wide. Every friend of the season runs along the full river under the rainbow. In the sky, in letters of light: **THE RAIN RUN** | — | final statement of the pack motif |
| 24.0–25.4 | Close on the second black panther, who has not said a word all season | THE QUIET ONE: BEST RUN / EVER. | — |
| 25.8 | End card | **SEASON FINALE** · *SEASON 8?* | cadence |

## The three shots that must land

1. **The hook (0.4–3.2 s).** The storm must look like the biggest thing the series has ever shown: taller than the frame, with the pack tiny beneath it. The frame at 0.9 s is the thumbnail. Then comes the surprise that makes this episode different from every other: the cats *speed up*. Give the Black Panther's line space; it turns fear into joy in one bubble.
2. **The first drop (8.2–11.4 s).** This is the heart of the season, and it's quiet. "What's… rain?" should land in near silence. Then one drop, in close-up, on the trunk of an animal that has never felt one. Don't rush to the downpour. If the viewer smiles here, the flood that follows will matter.
3. **The rescue (12.4–17.2 s).** The flood comes from *ahead*, from where the storm has already passed, so the only way out is up. It has to read as four separate jobs done at once: the Black Panther hears it first and pushes; the Leopard is up the bank in two bounds; the trunk lifts the calf; the Jaguar, the swimmer, is caught by the water and comes out the other side. Hold the Jaguar under for a little over half a second. That worry is what makes the splash a cheer.

Then let the ending breathe. From 18.4 s nothing goes wrong again. The green-up is the pay-off for five episodes of dust.

## Music and sound

- The finale is in a major key: start from `EPIC(40, 60, 118, { minor: false, prog: 'hope' })`, as episode 35 did.
- Hits in `flashes`: the storm (about 0.45), the flood (12.8) and the Jaguar's return (17.2). The flood is the biggest, because the silence belongs under "LISTEN…".
- The music-box motif at 10.4 s is the only delicate sound in the episode. Keep everything else out of its way.
- Rain is a new ambience: a soft roar from 11.4 s that thins to drips by 21 s.
- The calf needs the small voice. By default any elephant gets the big one.

## What exists and what's new

**Reuse:** the elephant and `trumpets`; `dir: 1` herds for the cameo parade and for the calf (ep 35's giraffe calf); `rain`, `dark` and `bolts` (eps 12, 15, 29); the brown flood wall (ep 12); `rainbow` (ep 21); sky lettering (ep 35's constellation label); a river.

**New:**
- **The storm wall** as a sky object that grows and then swallows the frame.
- **A dry style for the river,** and the change from dry to full.
- **A flood that comes from ahead.** The existing `wall` chases from behind. Mirror it or restage it; what matters is that it's coming at them and the way out is up the bank.
- **Banks with height,** and characters moving from the bed to the top: the Leopard's two bounds, the calf's lift, the leap clear.
- **One cat going under water and coming out.**
- **The first-drop close-up:** craters in dust, a drop on a trunk.
- **The green-up:** ground colour changing over time, flowers opening.
- **A voice override** for the calf.
- **A bubble on the second black panther** (`cat: 0`).

## Don't

- Don't make the storm a villain after 1.8 s. From then on the danger is only the flood.
- Don't add lightning strikes on the ground, fire or any second danger.
- Don't let the cameo herds speak, apart from the one calf line, or come near the foreground. A new viewer shouldn't need to know them.
- Don't keep the Jaguar under water for more than a second.
- Don't end on the flood. At least eight seconds of the episode belong to the rain and the green.
- Don't use full-screen lightning flashes.

## Done when

Everything in the README's list, plus:

- [ ] At 0.9 s the storm is taller than the frame and the pack is small beneath it.
- [ ] A viewer with the sound off understands, by 3 s, that the cats are happy to see the storm.
- [ ] The first drop on the trunk is a close-up and is readable in the vertical frame.
- [ ] In the rescue, each of the three named cats can be seen doing its own job.
- [ ] The ground is visibly green and the river visibly full by 22 s.
- [ ] The last bubble belongs to the second black panther.
