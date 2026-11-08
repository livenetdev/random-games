# THE HALL (4K)

Atmospheric 2D horror, narrative-driven. `index.html` = 4053 bytes, self-contained.

- **Play:** open `index.html`. `→`/`D` walk · `↓`/`S`/`Space` hide the flame · `←`/`A` turn back (don't). Touch: right ⅔ walk, left ⅓ hide.
- **Goal:** reach her door before the wax runs out.

| Stakes loop | |
|---|---|
| Hunt cue | house goes silent, her eyes open, flame gutters and leans toward her |
| Flame shown during hunt | she surges (≈640 units over a hunt = death from full distance) |
| Flame hidden + still | she loses you, drifts back |
| Flame hidden + moving | she still hears you, creeps closer |
| Wax | ~100 s total; hiding costs time, walking hidden is ⅓ speed |
| Look back | she closes in |
| Caught | tape ends in static |

| Trick | Effect |
|---|---|
| CPU "fragment shader" @ 320×180, pixelated upscale | every pixel procedural: damask wallpaper, damp stains, wainscot, wood grain, perspective floorboards |
| Candle point light + facing bias + flicker | darkness behind you is where *she* is |
| Lightning: window-distance falloff + projected wall shadows | her shadow appears behind yours before you ever see her |
| Silhouettes only (no faces), eye glints, blank portrait eyes that track you | brain fills the gaps |
| sqrt tone curve → 4×4 Bayer dither → 32-level quantize + film grain + vignette | painterly texture, no banding |
| Candle-cast wall shadows (yours, hers), blood handprints dragged down the wall, scratched-out portrait faces | late-hall dread |
| Camcorder realism: auto-exposure with gain pumping (lightning blows out, hidden flame cranks gain), gain-scaled chroma sensor noise, red chroma shift, interlaced fields, handheld sway, head-switching noise, rolling tracking band, PLAY timecode OSD | degraded signal reads as real footage; noise hides missing detail |
| Scanline tearing near her, dust motes in candlelight, rain on glass | proximity dread / detail density |
| WebAudio: lowpassed noise rain + thunder swell, 55 Hz drone; both drop out when she hunts | silence = danger |

Build: `src.js` → terser → roadroller → `index.html`
```
npm i terser roadroller && NODE_MODS=./node_modules/ node build.js
```
