# Grave Light

A 2D top-down horror game in exactly 4,096 bytes. Open `index.html` in a desktop browser with WebGL, then click to start.

You are in a flooded graveyard at night with a lantern. Find the five candles burning in blood pentagrams. A pale thing crawls toward you whenever your light is off it. While the beam is on it, it freezes, but it drinks your oil twice as fast. Each candle refills the lantern. If it reaches you, the game is over. If you take all five candles, dawn comes.

**Controls:** WASD to move · the mouse aims the lantern · click to start or restart

## Visuals (one fragment shader, every pixel computed procedurally)
- The lantern casts real-time soft shadows. Each lit pixel ray-marches the scene's signed distance field toward the flame, so tombs, trees and the creature all throw penumbral shadows.
- The ground is bump-mapped from a 6-octave height field: mud, grass grain and flat puddles. Wet areas give a specular glint of the lantern.
- Ledger tombs have bevelled edges, weathered stone, moss and an engraved cross.
- Dead trees are drawn as a parallax canopy of gnarled branches above the ground. The lantern lights them from below. The moon and lightning cast their shadows onto the ground.
- Lightning flashes throw long hard shadows across the graveyard and show the creature wherever it is.
- The creature is an SDF figure with animated splayed limbs and a fan of black hair. Its eyes glow red as it gets close.
- Each candle sits in a blood pentagram and casts a flickering warm glow.
- Drifting ground fog is lit by the *shadowed* lantern light, which gives volumetric-looking light shafts.
- Post-processing: lens barrel distortion, tone curve, a vignette that pulses with your heartbeat as fear rises, a red fade on death, and film grain.

## Byte tricks
- The world is a 256×256 random RGBA texture that JS uploads once. With smoothstep-warped coordinates, one bilinear fetch gives smooth value noise. At integer coordinates the same fetch returns the exact texel, so it also serves as the per-cell hash. JS reads the same bytes for collision, so the shader and JS agree exactly with no float-hash drift.
- Each obstacle stays inside its own 2×2 cell, so a single cell lookup gives the distance field. Shadow steps are capped so that rays cannot skip over a neighbouring cell's object.
- WebGL method names are aliased by a 3-character hash (`k[0]+k[5]+k[9]`).
- The DOM, styles and text are all built from inside the compressed JS. The shell is only `<meta charset=utf8><script>`.
- Packing reuses the `ward4k` scheme: terser, a GLSL minifier, zopfli deflate, 7-bit chunks in a `String.raw` literal, and `DecompressionStream` + `eval`.
- Audio is one noise buffer through a lowpass filter at different cutoffs: rain, heartbeat, thunder and a death shriek.

Rebuild with `node build.js` (needs `terser` and `@gfx/zopfli`, or set `TERSER` and `ZOPFLI` to their paths).
