# Ward Nine

First-person horror in a single 10,153-byte HTML file (budget: 10,240). Open `index.html` in a desktop browser with WebGL2.

Burn four sigils in a procedurally generated asylum ward. Your torch freezes the thing that walks the halls, but it drains the battery. In the dark the battery recharges and she moves.

**Controls:** WASD move · mouse look · Shift run · F torch

## How it fits in 10 KB
- No assets or libraries. Every pixel comes from one fragment shader.
- Walls use a DDA ray-cast through a maze texture. Floor and ceiling are analytic planes. The entity is a sphere-traced SDF.
- Surfaces are procedural: glazed tiles, peeling paint, water stains, cracks, blood scrawl, wooden doors, checker lino, puddles and acoustic ceiling tiles. Each gets bump-mapped normals from height-field finite differences.
- Fake AO comes from distance to the neighbouring wall blocks. Lamps light their own cell and its neighbours only, which keeps light from leaking through walls.
- Torchlight has a cookie, soft SDF shadows of the entity, a volumetric haze march, and lamp glow inside the fog.
- Post-processing: filmic tone curve, colour grade, vignette, grain, and fear distortion.
- Audio is synthesized with WebAudio.
- Packing: terser for JS, a whitespace and identifier minifier for GLSL, zopfli deflate, then 7-bit packing into a `String.raw` literal. `DecompressionStream` unpacks it at load.

Sources are in `src/`. To rebuild, run `node build.js` (needs `terser` and `@gfx/zopfli`).
