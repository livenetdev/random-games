// Fixed Spectrum-inspired palette: 8 base colours + bright variants.
export const HEX = [
  '#000000', // 0 black
  '#0000D7', // 1 blue
  '#00D7D7', // 2 cyan
  '#00D700', // 3 green
  '#D7D700', // 4 yellow
  '#D70000', // 5 red
  '#D700D7', // 6 magenta
  '#D7D7D7', // 7 white
  '#0000FF', // 8 bright blue
  '#00FFFF', // 9 bright cyan
  '#00FF00', // 10 bright green
  '#FFFF00', // 11 bright yellow
  '#FF0000', // 12 bright red
  '#FFFFFF', // 13 bright white
];
export const C = {
  black: 0, blue: 1, cyan: 2, green: 3, yellow: 4, red: 5, magenta: 6, white: 7,
  bblue: 8, bcyan: 9, bgreen: 10, byellow: 11, bred: 12, bwhite: 13,
};
export const RGB = HEX.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
// Little-endian ABGR words for Uint32 views over ImageData.
export const U32 = RGB.map(([r, g, b]) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0);
