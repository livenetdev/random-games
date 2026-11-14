import { C } from './palette.js';

// A LUT is an ordered list of bands (cold -> hot). An entry is a palette index
// or a pair [a, b] rendered as a 50% checker (used to get extra steps from a
// tiny palette, e.g. the monochrome night-vision ramp).
export const LUTS = {
  // Default thermal: black -> blue -> cyan -> green -> yellow -> red -> white
  thermal: { name: 'thermal', bands: [C.black, C.blue, C.cyan, C.green, C.yellow, C.red, C.white, C.bwhite], stops: [0, 0.13, 0.25, 0.37, 0.47, 0.57, 0.8, 0.97, 1.0], hot: 5 },
  // Iron: black -> blue -> magenta -> red -> yellow -> white
  iron: { name: 'iron', bands: [C.black, C.blue, C.magenta, C.red, C.bred, C.yellow, C.byellow, C.bwhite], stops: [0, 0.13, 0.25, 0.37, 0.5, 0.6, 0.8, 0.97, 1.0], hot: 4 },
  // Monochrome green night-vision
  night: { name: 'night', bands: [C.black, [C.black, C.green], C.green, [C.green, C.bgreen], C.bgreen, [C.bgreen, C.bwhite], C.bwhite], hot: 5 },
  // Cheap disposable flash: overexposed centre, falloff to black. 4 bands.
  flash: { name: 'flash', bands: [C.black, C.blue, C.white, C.bwhite], hot: 3, flash: true },
  // Flatbed scan for Walt's index cards.
  scan: { name: 'scan', bands: [C.black, C.blue, C.cyan, C.white, C.bwhite], hot: 99 },
  // Burned-in flash afterimage (inverted, faded)
  after: { name: 'after', bands: [C.black, C.black, C.blue, C.magenta], hot: 99 },
};

// Band coordinate table: heat v -> continuous band position u (band k spans [k, k+1)).
// Non-uniform stops let bodies sit in a wide red band while headlights blow out to white.
const TMIN = -0.5, TMAX = 2.5, TN = 3072;
for (const lut of Object.values(LUTS)) {
  const N = lut.bands.length;
  const stops = lut.stops || Array.from({ length: N + 1 }, (_, k) => k / N);
  const tab = new Float32Array(TN);
  for (let i = 0; i < TN; i++) {
    const v = TMIN + (TMAX - TMIN) * (i / (TN - 1));
    let u;
    if (v < stops[1]) u = (v - stops[1]) / (stops[1] - stops[0]) + 1;
    else if (v >= stops[N - 1]) u = N - 1 + (v - stops[N - 1]) / (stops[N] - stops[N - 1]);
    else {
      let k = 1;
      while (k < N - 1 && v >= stops[k + 1]) k++;
      u = k + (v - stops[k]) / (stops[k + 1] - stops[k]);
    }
    tab[i] = u;
  }
  lut.tab = tab;
}
export const LUT_TMIN = TMIN, LUT_SCALE = (TN - 1) / (TMAX - TMIN), LUT_TN = TN;

export function getLut(name) {
  return LUTS[name] || LUTS.thermal;
}
