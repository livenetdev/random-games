# NIGHTSHIFT

One-button-pair tunnel survival. Carry a lantern down a raymarched-style polygon shaft through nine hospital wards; skim walls for combo, grab embers, beat your best.

**Play:** open `index.html` (single self-contained file, WebGL2, no deps). Rebuild after editing `src/`: `node build.js`.

| Input | Action |
|---|---|
| ← → / A D | rotate (right = clockwise) |
| touch | hold left / right half |
| Space / Enter | start · retry |
| R / Enter on death | revive (when offered) |
| Esc / P | pause · M mute |

## Loop
- **Survive** — walls arrive on the beat; sideways contact slides, head-on contact kills.
- **Graze** — pass a wall within a hair of its edge → combo; every 5 combo = +1 multiplier (max ×8, decays after ~2.6 s).
- **Embers ✦** — pickups between walls; gold ones sit at gap edges (risk).
- **Wards I–IX** every 16 s: faster, more spin, new sector counts (5–8), new patterns, new key. Survive Ward Nine → endless *Beyond*.

## Meta
- 3 rotating missions (tiers scale up), rank/XP with ember payouts, daily streak bonus.
- Daily seeded run (`Daily #N`) with its own best.
- Upgrades: Moth Lure, Kindling, Steady Hand, Last Light (shield); 7 lantern colours.
- Checkpoint start at any ward reached; one paid revive per run.
- Every generated wall pair is checked for reachability (rotation time + reaction margin); a zero-latency bot survives 200 s on all seeds.

## Layout
`src/shader.glsl` (scene) · `src/game.js` (logic, audio, meta) · `src/shell.html` (UI) → `build.js` → `index.html`
