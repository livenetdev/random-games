# TWELVE EXPOSURES (4K)

2D raycast found-photo horror. `index.html` = 4096 bytes, self-contained.

- **Play:** open `index.html`. `←/→` turn · `↑` walk · `Space` flash. Touch: edges turn, middle walk, two fingers flash.
- **Goal:** find Kayla's blinking flashlight in a pitch-black pine forest. 12 flashes.

| Pacing (tension curve) | |
|---|---|
| Opening ~8 s | safe: only you, the dark, her blinking flashlight |
| Reveal (20% of the way) | it appears 20 m off to the side; first flash shows only its eyeshine |
| Rule (taught in text) | it moves only in the dark; **any** flash freezes it 3 s; a flash within 5 m drives it off 20 m |
| Escalation | its speed scales with your progress: slower than you early, faster than you near the end |
| Heartbeat | starts at 9 m, quickens as it closes: the cue to flash, no aiming needed |
| Close calls | contact 1 and 2: the camera fires itself, its face, then it drops back 25 m; contact 3: death |
| Movement | slide along trunks instead of sticking |

Bot playtest: walk straight, never flash → 2 close calls, scraped through. Flash on heartbeat → clean win in ~30 s with 7 of 12 flashes left.

| Realism trick (low budget) | Why it works |
|---|---|
| Inverse-square on-axis flash, filmic `1-e^-x` roll-off | near trunks blow out white, far ones vanish: real flash photos look exactly like this |
| No shadows (light on camera axis), Lambert roundness on trunks | flat-flash look; cylinders read 3D |
| Backscatter orbs (dust in flash) | the signature of real night flash photos |
| Eyeshine: retroreflective eyes visible far beyond the flash falloff | animal-eye realism; brain fills in the body |
| Close range: blown-out face with black eye pits | overexposure *removes* detail; nothing to see is scarier |
| Photo persists as fading afterimage, fixed to the screen while you turn | retinal burn; you navigate from memory |
| Orange `'98 10 31` date imprint on photos only, film counter | disposable-camera vernacular = "this happened" |
| Live view: grain + near-black sky gradient | night vision is noise; silhouettes only |
| Audio: wind, leaf-crunch steps, shutter click, rising flash-capacitor whine | the whine is the ending |

Build: `npm i terser roadroller && NODE_MODS=./node_modules/ node build.js`
