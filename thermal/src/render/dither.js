import { mulberry32 } from '../core/rng.js';

// Ordered (Bayer 4x4) + blue-noise threshold maps. Combined they give the
// ragged, crawling band edges of a cheap posterised sensor.
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

// Void-and-cluster blue noise, 32x32, generated once (deterministic).
function makeBlueNoise(n = 32, sigma = 1.5) {
  const N = n * n;
  const rng = mulberry32(1997);
  const bits = new Uint8Array(N);
  const energy = new Float32Array(N);
  const R = 4;
  const k = [];
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) k.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))]);
  const splat = (i, s) => {
    const x = i % n, y = (i / n) | 0;
    for (const [dx, dy, w] of k) energy[((y + dy + n) % n) * n + ((x + dx + n) % n)] += s * w;
  };
  // initial random pattern ~10%
  let ones = 0;
  while (ones < N / 10) {
    const i = Math.floor(rng() * N);
    if (!bits[i]) { bits[i] = 1; splat(i, 1); ones++; }
  }
  const argmax = (want) => { let b = -1, bv = -Infinity; for (let i = 0; i < N; i++) if (bits[i] === want && energy[i] > bv) { bv = energy[i]; b = i; } return b; };
  const argmin = (want) => { let b = -1, bv = Infinity; for (let i = 0; i < N; i++) if (bits[i] === want && energy[i] < bv) { bv = energy[i]; b = i; } return b; };
  // relax
  for (let it = 0; it < 200; it++) {
    const c = argmax(1); bits[c] = 0; splat(c, -1);
    const v = argmin(0);
    if (v === c) { bits[c] = 1; splat(c, 1); break; }
    bits[v] = 1; splat(v, 1);
  }
  const rank = new Float32Array(N);
  const proto = bits.slice(); const protoE = energy.slice();
  // phase 1: remove ones
  let r = ones - 1;
  while (r >= 0) { const c = argmax(1); bits[c] = 0; splat(c, -1); rank[c] = r--; }
  bits.set(proto); energy.set(protoE);
  // phase 2/3: add zeros
  r = ones;
  while (r < N) { const v = argmin(0); bits[v] = 1; splat(v, 1); rank[v] = r++; }
  for (let i = 0; i < N; i++) rank[i] = (rank[i] + 0.5) / N;
  return rank;
}

export const BLUE = makeBlueNoise(32);

// Threshold map in [0,1) for the given pixel.
export function thresholdAt(x, y) {
  return 0.5 * BAYER4[(y & 3) * 4 + (x & 3)] + 0.5 * BLUE[(y & 31) * 32 + (x & 31)];
}

// Precomputed full-screen threshold map for speed.
export function buildThresholdMap(w, h) {
  const m = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = thresholdAt(x, y) - 0.5;
  return m;
}

// Per-pixel random order for noise dissolves (seeded).
export function buildDissolveMap(w, h, seed) {
  const r = mulberry32(seed);
  const m = new Float32Array(w * h);
  for (let i = 0; i < m.length; i++) m[i] = r();
  return m;
}
