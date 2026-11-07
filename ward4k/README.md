# Ward Nine 4K

The 4,093-byte cut of [Ward Nine](../ward9). Budget: 4,096 bytes. Open `index.html` in a desktop browser with WebGL2.

Find three burning sigils in a dark asylum maze. She walks through walls. Your torch freezes her while you face her, but the battery drains. Turn it off (F) to recharge.

**Controls:** WASD move · mouse look · F torch

## What survived the cut
- Ray-cast maze with an integer-hash binary-tree layout. The shader and JS compute the identical maze, so no texture is uploaded.
- One procedural surface function: glazed wall tiles, peeling paint, checker floor with wet puddles, ceiling grid. All are bump-mapped from finite differences of the height field.
- Contact AO near walls. Ceiling panels flicker and die when she is near.
- Torch with specular highlights and volumetric haze. SDF figure. Sigil glow. Distance fog, tone curve, vignette, fear tint.
- Audio is one oscillator whose drone rises with fear.

## Packing
terser for JS and a custom GLSL minifier, then zopfli deflate. The result is stored as 7-bit chunks in a `String.raw` literal. The six unsafe values (NUL, CR, `$`, `<`, `\`, backtick) are each folded into a 2-byte character together with the next chunk. `DecompressionStream` and `eval` unpack it at load.

Rebuild with `node build.js` (needs `terser` and `@gfx/zopfli`).
