// Generates src/data/stills.json — the ordered still manifest.
import { writeFileSync } from 'fs';
import { NODES } from '../src/data/nodes.js';

const S = [];
let seed = 1997;
const add = (o) => { S.push({ seed: seed++, mode: 'heat', lut: 'thermal', style: 'trail', ...o }); };
const cam = (n) => ({ cam: `CAM ${n}`, lut: n === 2 ? 'iron' : 'thermal' });

// ---------- intro ----------
add({ id: 'i_road', act: 0, scene: 'road', variant: 'ahead', style: 'none' });
add({ id: 'i_desk', act: 0, scene: 'desk', variant: 'intro', style: 'none', micro: ['flicker'] });
add({ id: 'i_dark', act: 1, scene: 'desk', variant: 'dark', style: 'none' });

// ---------- ACT I: the card ----------
const A1 = [
  ['a1_01', 'meadow', 'deer', 1, '02:11:40', '10/19/1997', '38°F', { alt: 'a1_01b' }],
  ['a1_02', 'drive', 'raccoon', 3, '23:40:12', '10/21/1997', '41°F'],
  ['a1_03', 'trailer', 'raccoon', 2, '01:05:55', '10/22/1997', '40°F'],
  ['a1_04', 'meadow', 'bolt1', 1, '03:30:01', '10/24/1997', '36°F', { burst: '1/3' }],
  ['a1_05', 'meadow', 'bolt2', 1, '03:30:02', '10/24/1997', '36°F', { burst: '2/3', hasIt: true, anomaly: { slot: 'first', tag: 'it' } }],
  ['a1_06', 'meadow', 'bolt3', 1, '03:30:03', '10/24/1997', '36°F', { burst: '3/3', hasIt: true, decoy: { tag: 'it', msg: 'IT WAS THERE EARLIER.' } }],
  ['a1_07', 'meadow', 'hidden', 1, '04:02:19', '10/25/1997', '35°F', { hasIt: true, anomaly: { slot: 'fir', tag: 'hidden', need: 'threshold' } }],
  ['a1_08', 'drive', 'empty', 3, '22:15:31', '10/26/1997', '39°F', { alt: 'a1_08b' }],
  ['a1_09', 'meadow', 'figure', 1, '03:12:44', '10/27/1997', '33°F', { hasIt: true, alt: 'a1_09b' }],
  ['a1_10', 'trailer', 'coat', 2, '02:47:09', '10/28/1997', '34°F'],
  ['a1_11', 'trailer', 'edit', 2, '02:47:09', '10/28/1997', '34°F', { hasIt: true, anomaly: { slot: 'edit', tag: 'edit' } }],
  ['a1_12', 'meadow', 'carcass', 1, '05:20:11', '10/30/1997', '31°F', { alt: 'a1_12b' }],
  ['a1_13', 'drive', 'walk1', 3, '01:58:30', '11/01/1997', '30°F', { burst: '1/3', hasIt: true }],
  ['a1_14', 'drive', 'walk2', 3, '01:58:31', '11/01/1997', '30°F', { burst: '2/3', hasIt: true }],
  ['a1_15', 'drive', 'walk3', 3, '01:58:32', '11/01/1997', '30°F', { burst: '3/3', hasIt: true }],
  ['a1_16', 'drive', 'sleep', 3, '04:40:05', '11/01/1997', '29°F', { hasIt: true, anomaly: { slot: 'sleep', tag: 'it' } }],
  ['a1_17', 'trailer', 'window', 2, '03:14:07', '11/02/1997', '33°F', { hasIt: true, anomaly: { slot: 'inside', tag: 'it' } }],
  ['a1_18', 'meadow', 'walt', 1, '02:58:10', '11/03/1997', '31°F'],
  ['a1_19', 'drive', 'two', 3, '03:14:07', '11/03/1997', '31°F', { hasIt: true }],
  ['a1_20', 'trailer', 'door', 2, '06:30:44', '11/05/1997', '35°F', { alt: 'a1_20b' }],
  ['a1_21', 'meadow', 'open', 1, '02:02:02', '11/09/1997', '28°F', { hasIt: true }],
  ['a1_22', 'drive', 'arrive', 3, '21:50:37', '11/14/1997', '34°F', { locked: true }],
  ['a1_23', 'drive', 'parked', 3, '22:31:08', '11/14/1997', '33°F', { locked: true, alt: 'a1_23b' }],
  ['a1_24', 'drive', 'tonight', 3, 'now+6', '11/14/1997', '33°F', { locked: true, hasIt: true, anomaly: { slot: 'tonight', tag: 'it' } }],
];
let stage = 0;
for (const [id, scene, variant, n, time, date, temp, extra = {}] of A1) {
  stage += 0.02;
  add({ id, act: 1, scene, variant, ...cam(n), time, date, temp, params: { stage }, reel: true, ...extra });
}
// variants: one thing changed (used for frames that change while viewed at high dread)
add({ id: 'a1_01b', act: 1, scene: 'meadow', variant: 'bolt2', ...cam(1), params: { stage: 0.05 }, variantOf: 'a1_01', hasIt: true });
add({ id: 'a1_08b', act: 1, scene: 'drive', variant: 'walk1', ...cam(3), params: { stage: 0.15 }, variantOf: 'a1_08', hasIt: true });
add({ id: 'a1_09b', act: 1, scene: 'meadow', variant: 'open', ...cam(1), params: { stage: 0.18 }, variantOf: 'a1_09', hasIt: true });
add({ id: 'a1_12b', act: 1, scene: 'meadow', variant: 'open', ...cam(1), params: { stage: 0.24 }, variantOf: 'a1_12', hasIt: true });
add({ id: 'a1_20b', act: 1, scene: 'trailer', variant: 'window', ...cam(2), params: { stage: 0.4, door: true }, variantOf: 'a1_20', hasIt: true });
add({ id: 'a1_23b', act: 1, scene: 'drive', variant: 'tonight2', ...cam(3), params: { stage: 0.45 }, variantOf: 'a1_23', hasIt: true });
for (const s of S) if (s.variantOf) { const b = S.find((x) => x.id === s.variantOf); Object.assign(s, { time: b.time, date: b.date, temp: b.temp }); }
// live feed + first earned jump-scare
add({ id: 'a1_live', act: 1, scene: 'desk', variant: 'live', cam: 'CAM 4 (INSIDE)', lut: 'night', style: 'monitor', time: 'now', date: '11/14/1997', params: { stage: 0.5 }, hasIt: true });
add({ id: 'a1_scare', act: 1, scene: 'desk', variant: 'behind', style: 'none', params: { stage: 0.5 }, hasIt: true });
add({ id: 'a1_face', act: 1, scene: 'close', variant: 'face', style: 'none', params: { stage: 0.45 }, hasIt: true });

// ---------- index cards + board (2D, scanned) ----------
const CARDS = [
  ['card_warm', ['IT ONLY', 'SHOWS UP', 'WARM.'], null],
  ['card_flash', ["DON'T LOOK", 'AT IT IN', 'THE FLASH.'], null],
  ['card_van', ['THE VAN', 'IS WHERE', 'IT SLEEPS.'], 'faded'],
  ['card_pin', ['CAM 3 PIN', '1 1 0 3'], 'pin'],
  ['card_copy', ['IT STANDS', 'HOW YOU', 'STAND.'], null],
  ['card_cold', ['DEAD MEN', 'RUN COLD.', 'IT RUNS HOT.'], null],
  ['card_moves', ['IT ONLY MOVES', 'BETWEEN', 'PICTURES.'], null],
];
for (const [id, lines, kind] of CARDS) add({ id, act: 1, scene: 'card', mode: 'card', lut: 'scan', style: 'none', lines, kind });
add({ id: 'board', act: 1, scene: 'card', mode: 'card', lut: 'scan', style: 'none', kind: 'board' });
add({ id: 'map', act: 2, scene: 'card', mode: 'card', lut: 'scan', style: 'none', kind: 'map' });

// ---------- ACT II: flash ----------
for (const [k, n] of Object.entries(NODES)) {
  if (k === 'van') continue;
  const base = { act: 2, scene: n.scene, node: k, params: { ...n.params } };
  const v = n.variant || 'default';
  add({ ...base, id: `n_${k}_f`, variant: v, mode: 'flash', lut: 'flash', style: 'flash' });
  add({ ...base, id: `n_${k}_t`, variant: v, style: 'handheld' });
  if (n.scene === 'van') add({ ...base, id: `n_${k}_i`, variant: v, style: 'handheld', params: { ...n.params, ...n.it, stage: 0.65 }, hasIt: true });
  else add({ ...base, id: `n_${k}_i`, variant: 'it', style: 'handheld', params: { ...n.params, it: n.it, stage: 0.65 }, hasIt: true });
}
// trail-cam bursts recovered when resetting each camera
const bursts = { cam1: ['meadow', 1], cam2: ['trailer', 2], cam3: ['drive', 3] };
for (const [c, [scene, num]] of Object.entries(bursts)) {
  for (let i = 1; i <= 3; i++) {
    const variant = scene === 'drive' ? `reset${i}` : `dana${i}`;
    add({ id: `${c}_b${i}`, act: 2, scene, variant, ...cam(num), time: `now-${4 - i}s`, date: '11/14/1997', temp: '29°F', burst: `${i}/3`, params: { stage: 0.6 }, hasIt: true });
  }
}

// ---------- ACT III: the van (both placements of Walt's body) ----------
for (const w of ['driver', 'door']) {
  const W = w === 'driver' ? 'A' : 'B';
  const p = (o) => ({ walt: w, stage: 0.85, ...o });
  add({ id: `a3_approach_${W}`, act: 3, scene: 'van', variant: 'far', style: 'handheld', params: p({ dist: 21 }), hasIt: true });
  add({ id: `a3_far_f_${W}`, act: 3, scene: 'van', variant: 'far', mode: 'flash', lut: 'flash', style: 'flash', params: p({}) });
  add({ id: `a3_far_t_${W}`, act: 3, scene: 'van', variant: 'far', style: 'handheld', params: p({}), hasIt: true });
  add({ id: `a3_mid_f_${W}`, act: 3, scene: 'van', variant: 'mid', mode: 'flash', lut: 'flash', style: 'flash', params: p({}) });
  add({ id: `a3_mid_t_${W}`, act: 3, scene: 'van', variant: 'mid', style: 'handheld', params: p({}), hasIt: true });
  add({ id: `a3_ref_${W}`, act: 3, scene: 'van', variant: 'ref', style: 'handheld', params: p({}), hasIt: true, micro: ['breathe'] });
  add({ id: `a3_raise_${W}`, act: 3, scene: 'van', variant: 'ref', style: 'handheld', params: p({ itPose: 'raise' }), hasIt: true, micro: ['breathe'] });
  add({ id: `a3_ref_f_${W}`, act: 3, scene: 'van', variant: 'ref', mode: 'flash', lut: 'flash', style: 'flash', params: p({}) });
  add({ id: `a3_cam_${W}`, act: 3, scene: 'drive', variant: 'mirror', ...cam(3), time: 'now', date: '11/14/1997', temp: '28°F', params: p({}), hasIt: true });
}

// ---------- endings ----------
add({ id: 'e_c1', act: 4, scene: 'road', variant: 'back', style: 'none' });
add({ id: 'e_c2', act: 4, scene: 'road', variant: 'ahead', style: 'none' });
add({ id: 'e_c3', act: 4, scene: 'road', variant: 'canopy', style: 'none' });
add({ id: 'e_c4', act: 4, scene: 'road', variant: 'ahead', style: 'none', params: { far: true } });
add({ id: 'e_c5', act: 4, scene: 'mirror', variant: 'blob', style: 'none' });
for (const w of ['driver', 'door']) {
  const W = w === 'driver' ? 'A' : 'B';
  add({ id: `e_w1_${W}`, act: 4, scene: 'close', variant: 'door', style: 'none', params: { stage: 0.7 }, hasIt: true });
  add({ id: `e_w7_${W}`, act: 4, scene: 'van', variant: 'dana', ...cam(3), time: 'now', date: '11/14/1997', temp: '27°F', params: { walt: w, stage: 0.95, corpseT: 0.62 }, hasIt: true, micro: ['breathe'] });
}
add({ id: 'e_w2', act: 4, scene: 'close', variant: 'hand', style: 'none', params: { stage: 0.75 }, hasIt: true });
add({ id: 'e_w3', act: 4, scene: 'close', variant: 'wake', style: 'none' });
add({ id: 'e_w4', act: 4, scene: 'close', variant: 'face', style: 'none', params: { stage: 0.8 }, hasIt: true, clash: true });
add({ id: 'e_w5', act: 4, scene: 'close', variant: 'seat', style: 'none' });
add({ id: 'e_w6', act: 4, scene: 'van', variant: 'ref', style: 'none', params: { stage: 1, walt: 'driver' }, clash: true, hasIt: true });
add({ id: 'e_x2', act: 4, scene: 'meadow', variant: 'dawn', ...cam(1), time: '06:12:40', date: '11/15/1997', temp: '26°F', params: { stage: 1, groundT: 0.2 }, hasIt: true });

// ---------- subliminal inserts (1 frame) ----------
add({ id: 'sub_behind', act: 9, scene: 'close', variant: 'behind', style: 'none', params: { stage: 0.6 }, hasIt: true });
add({ id: 'sub_hand', act: 9, scene: 'close', variant: 'hand', style: 'none', params: { stage: 0.6 }, hasIt: true, clash: true });
add({ id: 'sub_seat', act: 9, scene: 'close', variant: 'seat', style: 'none', clash: true });
add({ id: 'sub_face', act: 9, scene: 'close', variant: 'face', style: 'none', params: { stage: 0.6 }, hasIt: true, clash: true });

// ---------- title ----------
add({ id: 'title', act: 0, scene: 'van', variant: 'ref', ...cam(3), time: '03:14:07', date: '11/03/1997', temp: '31°F', params: { stage: 0.1, corpseT: 0.7, walt: 'driver' }, micro: ['breathe'] });

writeFileSync(new URL('../src/data/stills.json', import.meta.url), JSON.stringify(S, null, 1));
console.log(`${S.length} stills (${S.filter((s) => s.mode !== 'card').length} 3D, ${S.filter((s) => s.mode === 'card').length} scanned)`);
