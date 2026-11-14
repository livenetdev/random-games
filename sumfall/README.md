# Sumfall

Single-file arcade number game (`index.html`, no build, no dependencies beyond Google Fonts).

| Rule | Value |
|---|---|
| Move | drag through touching tiles (8-way) whose digits sum to the target |
| Score | target × chain² ÷ 2 × combo × 2^(gold tiles) |
| Time | 30 s cap; +0.6 s per tile, +3 s per clock tile; drain ×(1 + 0.12·(level−1)), max ×2.6 |
| Combo | clear within 3.5 s → +0.25×, max ×4; a wrong release resets it |
| Level | every 5 clears; target re-rolls in 10…10+2(level−1), max 24 |
| Clutch | timer hits 0 mid-drag → land the sum to survive |
| Fairness | DFS solver guarantees ≥1 valid chain; else board reshuffles |
| Modes | Endless (random seed), Daily (date seed, same board for everyone) |
| Keys | Space/Enter play · P/Esc pause · R restart · M sound |
