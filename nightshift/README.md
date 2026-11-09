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

## Skipping wards
- **Clearance**: each ward has a meter filled by playing riskily: graze +5% (+3.5% more if within 2°), ember +3%, gold ember +12%, flare +8% / white-hot flare +20% (all ÷(1+0.06·ward)); a shield break or Vigil hit costs 30%. Full meter → the ward ends immediately: drop to the next one with bonus = skipped seconds' distance points × chain multiplier × express.
- **Express**: clear wards early back to back → skip bonus ×1.5, ×2, ×2.5…; a ward that runs out its clock resets it.
- **Ward map** (menu): start at any ward you've reached, with a head start of half your best score at that ward entry (recorded from Ward I starts).

## Why these hooks (inferred from the kinds of games you build)
| You build | Inference | Hook |
|---|---|---|
| systems-deep sims and sandboxes | you enjoy composing rules and seeing them interact | **Conditions**: 7 stackable rules (Brittle, Blackout, Vertigo, Overtime, Mirror, Short fuse, Barren), each adds heat → score multiplier |
| faithful, frame-exact engines | mastery of a precise feel; determinism matters | fixed 60 Hz tick, ghost lantern per seed+conditions; **flare**: cup the flame (Shift / 2nd finger) to turn slower and build heat near walls, release for a chain + score burst |
| calm, interruptible play | low-stakes sessions between work | **Vigil**: no death; hits gutter the flame (combo reset), best = longest unbroken stretch; softer music; end any time (E) |
| tools you tinker with and share | builders like making and trading challenges | **Codes** `NS-<seed>-<conditions>`: copy from any death screen, paste in Conditions, replay from Records |

## Built for you
- **Splits + live Δ vs PB**: score curve of your best run is stored; HUD shows live ±, each ward banner shows split delta.
- **Dense death card**: time, pts/s, graze rate, ×3+ uptime, turn°/wall (input economy), hairline (closest graze, PB-tracked), splits, seed.
- **4K CUT mode**: 4,096 steering ticks (2 per frame held); grazes +48, embers +64, gold +256. Separate PB.
- **Seeds**: `R` on death = same seed; `R` mid-run = instant reset.
- **Case files**: 27 one-line dossiers (3 per ward: reach / graze 12 inside / gold ember), loop-shaped story.

## Meta
- 3 rotating missions (tiers scale up), rank/XP with ember payouts, daily streak bonus.
- Daily seeded run (`Daily #N`) with its own best.
- Upgrades: Moth Lure, Kindling, Steady Hand, Last Light (shield); 7 lantern colours.
- Checkpoint start at any ward reached; one paid revive per run.
- Every generated wall pair is checked for reachability (rotation time + reaction margin); a zero-latency bot survives 200 s on all seeds.

## Layout
`src/shader.glsl` (scene) · `src/game.js` (logic, audio, meta) · `src/shell.html` (UI) → `build.js` → `index.html`
