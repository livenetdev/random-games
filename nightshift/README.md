# Night Shift

Survivors-style roguelite set in Ward Nine's Ashgrove Sanatorium. One HTML file, no assets, no libraries. Open `index.html` in any modern browser (desktop or mobile).

The ward lights failed at midnight. Your lantern is the only light. Shades come at you out of the dark. Survive until 6:00 AM (10 real minutes).

**Controls:** WASD / arrows / touch-drag to move · hold Space (or Shift, or the DRIFT button) while turning, release to boost · weapons fire on their own · 1–4 pick a card · R reroll · Esc pause · M mute · menu: D daily, A achievements, T stats, B shop

## The loop
| Layer | Hook |
|---|---|
| Seconds | Gems chime up a pentatonic scale as you chain pickups. Combo counter pays ash at 50 / 100 / 200 / … |
| Minutes | Level-up every ~20–40 s: 3 cards (6 weapons, 8 passives, 4+4 slots). Weapon at max level + its paired passive → next reliquary evolves it |
| Run | Hourly chimes, surges, elites carrying reliquaries, **She** at 3 AM and 5:24 AM (slow in your light, blinks behind you in the dark), dawn at 6 AM, endless overtime after |
| Meta | 32 achievements and 3 rolling contracts pay ash. Weapon mastery. Daily streak. Ash goes to a permanent shop (10 upgrades). 3 staff to unlock (survive to 3 AM, put Her down, reach dawn). The death screen shows how far you were from your record, the next unlock and what you can afford |

## Borrowed from the other projects
| From | In Night Shift |
|---|---|
| Ward Nine (horror) | Setting, Her, sigils, torch-vs-dark, grain, synthesized audio |
| dariokuigi (kart) | **Drift-boost:** hold while turning to charge blue → orange → purple sparks, release to boost with i-frames, ramming damage |
| Lull (blocks) | **Chain multiplier:** ash per kill ×0.05 for every 25 kills in a chain, up to ×2. **Daily Shift** with a streak bonus. Stats page and past-shift history |
| Stick RPG HD | **Contracts** (a job board: 3 active jobs that scale up as you finish them), **achievements that pay out**, **weapon mastery** (perks at kill thresholds: +6% damage per level, 5 levels) |

## Night Terrors
Optional modifiers, unlocked after 3 shifts. Each adds its % to the shift's ash. The Daily Shift picks a staff member (locked ones too), a bonus weapon and 2 terrors from the date.

| Terror | Effect | Ash |
|---|---|---|
| 🌑 Lights Out | light radius −25% | +30% |
| 💨 Restless | shades +20% speed | +25% |
| 🪨 Thick Hides | shades +50% HP | +30% |
| 👁️ Insomnia | She also wakes at 1:30 AM | +35% |
| 🩹 Rationing | no hearts, half regen | +20% |
| 🐜 Overcrowded | +40% shades | +25% |

## Evolutions
| Weapon | + Passive | → |
|---|---|---|
| 🏮 Lantern | 🌀 Reach | Sun Lamp |
| 🧨 Flare Gun | ⏳ Focus | Phosphor Storm |
| 🔪 Scalpels | 👟 Haste | Surgical Halo |
| ✴️ Sigil | 🩸 Fury | Ninth Sigil |
| 💡 Arc Bulb | 🍀 Luck | Fuse Box |
| 🧂 Salt Circle | 💉 Regen | Sanctum |

## Tech
- Canvas 2D with a half-resolution darkness buffer. Lights punch holes into it with `destination-out`. Eyes, embers and gems are drawn above the dark, so in the dark you see only eyes.
- Spatial-hash grid for collisions and separation. Runs at 400+ enemies.
- WebAudio-only sound: SFX, a drone bed, and adaptive music whose tempo and layers follow the threat level.
- The title screen plays itself in attract mode.
- Progress is saved in `localStorage` (`nightshift.v1`).
