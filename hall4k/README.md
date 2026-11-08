# THE HALL (4K)

Atmospheric 2D horror, narrative-driven. `index.html` = 4033 bytes, self-contained.

- **Play:** open `index.html`. `→`/`D` walk, `←`/`A` turn back (don't). Touch: right ⅔ walk, left ⅓ turn.
- **Goal:** reach her door before the candle dies. Two endings.

| Trick | Effect |
|---|---|
| CPU "fragment shader" @ 320×180, pixelated upscale | every pixel procedural: damask wallpaper, damp stains, wainscot, wood grain, perspective floorboards |
| Candle point light + facing bias + flicker | darkness behind you is where *she* is |
| Lightning: window-distance falloff + projected wall shadows | her shadow appears behind yours before you ever see her |
| Silhouettes only (no faces), eye glints, blank portrait eyes that track you | brain fills the gaps |
| sqrt tone curve → 4×4 Bayer dither → 32-level quantize + film grain + vignette | painterly texture, no banding |
| Candle-cast wall shadows (yours, hers), blood handprints dragged down the wall, scratched-out portrait faces, cold breath when she is close | late-hall dread |
| Scanline tearing near her, dust motes in candlelight, rain on glass, floor reflections | proximity dread / detail density |
| WebAudio: lowpassed noise rain + thunder swell, 55 Hz drone, footsteps + delayed echo (hers) | "they stop when I stop" |

Build: `src.js` → terser → roadroller → `index.html`
```
npm i terser roadroller && NODE_MODS=./node_modules/ node build.js
```
