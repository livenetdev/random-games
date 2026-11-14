// Seeded RNG (mulberry32) + hashing helpers. Everything visual is driven from these.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function hash2(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class RNG {
  constructor(seed) {
    this.seed = typeof seed === 'string' ? hashStr(seed) : seed >>> 0;
    this.f = mulberry32(this.seed);
  }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return a + Math.floor((b - a + 1) * this.f()); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
  chance(p) { return this.f() < p; }
  gauss() {
    let u = 0, v = 0;
    while (u === 0) u = this.f();
    while (v === 0) v = this.f();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  fork(tag) { return new RNG((this.seed ^ hashStr(String(tag))) >>> 0); }
}
