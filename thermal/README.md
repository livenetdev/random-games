# THERMAL

A first-person horror game told almost entirely through still images, set in rural Oregon in November 1997. You never move freely and there is no real-time camera. You move through frames: thermal trail-camera captures, disposable-camera flash photos and security-monitor grabs. Every frame is rendered procedurally in the browser at load time. There are no art or audio assets.

![reference vs render](docs/ref-match.png)

*Left: the reference image. Right: CAM 3, rendered by the still pipeline (milestone 1 acceptance test).*

## Run / build

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/ (one classic script, runs offline, even from file://)
npm run preview    # serve dist/
npm run stills     # render every still to docs/stills/*.png (headless Playwright)
npm run manifest   # regenerate the still manifest + thumbnails below
npm run speedrun   # autopilot plays the game: minimum and realistic run times
node scripts/gen-stills.mjs   # regenerate src/data/stills.json from its source
```

URL flags: `?debug=1` (debug panel), `?res=256` (256×192), `?seed=N`, `?skipwarn=1`, `?timescale=N`, `?autopilot=min|human`.

## Controls

| Where | Input | Action |
|---|---|---|
| Everywhere | `Esc` / `P`, `H` | pause menu, controls |
| Frames (Act I, monitor) | `←/→`, click the frame edges | previous / next frame |
| | hold `Space` (touch: long-press) | blink comparator: flicker between this frame and the previous one |
| | `T`, then `↑/↓`, `[ ]` or drag the right-hand bar | thermal threshold tool: re-maps the raw heat buffer live and shows a °F readout |
| | mouse wheel, pinch, `+/-` | zoom: re-renders the region with more noise (detail never improves) |
| | click and drag | circle an anomaly and pin it to Walt's corkboard |
| | `B`, `C` | evidence board, index cards |
| Outside (Act II) | arrow keys, or click a direction label | choose a way |
| | hold `Enter` / `F` / mouse, then release | charge the flash, release to walk and shoot (costs 1 exposure) |
| | `Tab` | handheld thermal monitor at this spot (costs battery, not film) |
| | `E`, `M` | reset the trail camera here, Walt's map |
| The van (Act III) | `↑`, `F`, `Tab`, `Space`, `T` | walk closer, flash, monitor, blink, threshold |
| | click a figure, or `1` / `2` | choose |

The whole game can be played with the keyboard alone, the mouse alone, or touch alone.

## Design notes

**The pipeline** (`src/render/StillRenderer.js`) draws every still the same way:

1. **Scene.** Low-poly Three.js scenes built from primitives and procedural props (`src/props/`). Figures are capsule mannequins with poseable joints. No figure ever has a face.
2. **Heat pass.** Each object carries a scalar *temperature* (plus rim term, vertical gradient, fbm noise and atmospheric falloff) instead of a colour. It is rendered into a float target at 4× internal resolution. The same shader also does a *flash pass*: albedo times inverse-square falloff from a light at the lens. That pass is how a scene gets photographed with the disposable camera.
3. **Degradation.** Gaussian sensor bloom, radial heat bleed from hot sources (computed at 1/8 resolution), multiplicative grain at sensor resolution, vignette, and JPEG-ish 8×8 block DC and cosine noise.
4. **Box downsample** to 320×200 (or 256×192).
5. **Gradient map / posterize, live.** The raw heat buffer is kept. Every frame it is mapped through a LUT (6–8 hard bands, with non-uniform stops so bodies sit in a wide red band) using Bayer 4×4 combined with void-and-cluster blue-noise dithering. Hot bands smear 1 px for chromatic misregistration, and some frames get 8×8 attribute clash.
6. **OSD** in a custom 5×7 bitmap font (`src/render/font5x7.js`).

Because the heat buffer is stored, the threshold tool, palette cycling (hot bands breathe at about 3 Hz), dread-driven LUT drift and the blink comparator cost nothing per frame. Hidden figures exist only as heat values. For example, the figure inside the fir sits at about 0.31 heat inside 0.27 needles and only separates when you narrow the threshold window.

**Fidelity tricks.** Every frame keeps 35–50% pure black. Pareidolia bait appears throughout: a coat on a chair, a bush shaped like a crouching person, a mailbox. Consecutive stills change exactly one thing. Some frames have a micro-loop (a ±1 px breathing figure, a fluorescent flicker). Monitor frames get scan artifacts (tearing, a rolling bar, dropped lines). At high dread, a frame swaps 8×8 blocks toward its variant while you watch. Subliminal single-frame inserts appear, and the reduce-flashes option disables them.

**Caching.** The first launch "develops film". That renders Act I, the title and the inserts, then keeps rendering the rest in the background while you play. Heat buffers are quantised to Uint16 and stored in IndexedDB, so a reload is instant. Thumbnails are ImageBitmaps.

**The rules it obeys** (learned from Walt's cards):
- It only shows up warm.
- It never appears in the flash.
- It copies how you stand.
- It only moves between pictures you have seen. In Act II it advances along the node graph only when you take a photo, and charging the flash longer gives it more time.
- Over the game its temperature drifts from red toward white.

**Dread** (`src/game/dread.js`) is a hidden value. It rises while you look at frames containing it, when you re-view frames, while you hesitate, and when it is near. Dread drives the drone depth, subliminal insert rate, LUT drift and morphing frames.

**Failure is soft.** If it is waiting in the dark where you shoot, the camera winds on by itself (−2 film) and the monitor loses battery. Everything funnels into three endings: **Cold**, **Warm** and **Exposure** (out of film). There are exactly two earned jump-scares, at the end of Act I and at the Act III choice. Each one is preceded by 1.2 s of absolute silence.

**Audio** (`src/audio/engine.js`) is all Web Audio synthesis:
- Beds: wind, distant highway, crickets that stop when it is near, 60 Hz hum, tape hiss.
- Foley: trail-cam click, film wind, shutter, flash-charge whine (2 to 8 kHz), gravel and leaf footsteps, door creak.
- A dread layer: a 35–45 Hz drone with detuned beating sines.
- An echo step that plays one step behind you.

**Accessibility:**
- A photosensitivity warning at boot.
- Reduce flashes: a white flash becomes a 200 ms fade, subliminal inserts are off and tearing is capped.
- Subtitles for meaningful sounds.
- Band patterns for colour-blind players (each threshold band gets its own texture).
- Hard mode removes hover hints.
- Volume and mute.

**Pacing.** The 1997 card reader takes 5.5 s to pull each file off the card. The flash needs 1.5 s to recycle. Each walk between places takes 5.5 s and the afterimage burns for 1.5 s. The shortest route through Act II is 12 moves, and all three cameras must be reset. `npm run speedrun` measures this: see `docs/speedrun.json`.

## Architecture

```
src/main.js                  boot + state machine (Title -> Intro -> Act1 -> Act2 -> Act3 -> Ending)
src/render/                  StillRenderer (heat pass, degradation), lut, dither, compositor, osd, font5x7, cards, stills (bank)
src/scenes/                  one module per location: build(rng, variant, params) -> scene + camera (+ tagged hotspots)
src/props/                   van, pickup, sedan, figure rig, firs, deer, carcass, trailer, shed, poles, fence, canopy, ...
src/game/                    game shell, viewer, dread, save, clock, ui, acts/ (front, act1, act2, act3, endings, controls)
src/audio/engine.js          procedural beds, foley, dread layer
src/data/stills.json         ordered still manifest (generated by scripts/gen-stills.mjs)
src/data/nodes.js            Act II node graph
src/debug/                   ?debug=1 panel, autopilot, still dump pages
```

## Still manifest

<!-- STILLS:BEGIN -->
Run `npm run stills && npm run manifest` to generate this section.
<!-- STILLS:END -->
