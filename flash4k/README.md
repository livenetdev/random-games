# TWELVE EXPOSURES (4K)

2D raycast found-photo horror. `index.html` = 4094 bytes, self-contained.

- **Play:** open `index.html`. `←/→` turn · `↑` walk · `Space` flash. Touch: left/right edge turn, middle walk, two fingers flash.
- **Goal:** find Mara's blinking flashlight in a pitch-black pine forest. 12 flashes.

| Stakes loop | |
|---|---|
| Darkness | you see nothing but faint sky between trunks and her blinking light |
| Flash | the only way to see trees, the path, and *it*; costs 1 of 12 |
| It | moves only in the dark; rubber-band speed (fast far, ≈ your pace near) |
| Twig snaps | stereo-panned toward it, louder/more frequent as it closes; only way to locate it |
| Flash it in view | it freezes 3 s; inside 6 m it flees 22 m |
| Bump a tree / stop / turn | it gains on you |
| Caught | the camera fires on its own |

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

Bot playtest: never flashing → always caught. Turn-and-flash on approach → won 3/4, using 5–7 flashes.

Build: `npm i terser roadroller && NODE_MODS=./node_modules/ node build.js`
