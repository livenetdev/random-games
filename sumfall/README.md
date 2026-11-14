# Sumfall

Single-file arcade number game (`index.html`, no build, no dependencies beyond Google Fonts).

| Rule | Value |
|---|---|
| Move | drag through touching tiles (8-way) whose digits sum to the target |
| Score | target × chain² ÷ 2 × combo × 2^(gold tiles) |
| Time | start 45 s, cap 60 s; +1 s/tile, +1 s/tile past 3, +0.5 s/combo step (max +3), +5 s/clock tile (8% spawn), +10 s/level; drain ×(1 + 0.08·(level−1)), max ×2 |
| Combo | clear within 3.5 s → +0.25× points (max ×4) and time bonus; a wrong release resets it |
| Level | every 5 clears; target re-rolls in 10…10+2(level−1), max 24 |
| Clutch | timer hits 0 mid-drag → land the sum to survive |
| Fairness | DFS solver guarantees ≥1 valid chain; else board reshuffles |
| Modes | Endless (random seed), Daily (date seed, same board for everyone) |
| Keys | Space/Enter play · P/Esc pause · R restart · M sound |
