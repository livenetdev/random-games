# Night Shift

Survivors-style roguelite set in Ward Nine's Ashgrove Sanatorium. One HTML file, no assets, no libraries. Open `index.html` in any modern browser (desktop or mobile).

The ward lights failed at midnight. Your lantern is the only light. Shades come at you out of the dark. Survive until 6:00 AM (10 real minutes).

**Controls:** WASD / arrows / touch-drag to move · weapons fire on their own · 1–4 pick a card · R reroll · Esc pause · M mute

## The loop
| Layer | Hook |
|---|---|
| Seconds | Gems chime up a pentatonic scale as you chain pickups. Combo counter pays ash at 50 / 100 / 200 / … |
| Minutes | Level-up every ~20–40 s: 3 cards (6 weapons, 8 passives, 4+4 slots). Weapon at max level + its paired passive → next reliquary evolves it |
| Run | Hourly chimes, surges, elites carrying reliquaries, **She** at 3 AM and 5:24 AM (slow in your light, blinks behind you in the dark), dawn at 6 AM, endless overtime after |
| Meta | Ash goes to a permanent shop (10 upgrades). 3 staff to unlock (survive to 3 AM, put Her down, reach dawn). The death screen shows how far you were from your record, the next unlock and what you can afford |

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
