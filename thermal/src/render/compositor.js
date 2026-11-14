import { U32, C } from './palette.js';
import { buildThresholdMap } from './dither.js';
import { getLut, LUT_TMIN, LUT_SCALE, LUT_TN } from './lut.js';

// Live heat -> palette mapping. Runs every frame over the cached heat buffer,
// so the threshold tool, palette cycling and LUT drift cost no re-render.
export class Compositor {
  constructor(w, h) {
    this.resize(w, h);
  }
  resize(w, h) {
    this.w = w; this.h = h;
    this.th = buildThresholdMap(w, h);
    this.idx = new Uint8Array(w * h);
    this.tmp = new Float32Array(w * h);
  }

  // Map heat to band indices. Returns this.idx.
  bands(heat, p) {
    const { w, h, th, idx } = this;
    const lut = typeof p.lut === 'string' ? getLut(p.lut) : p.lut;
    const N = lut.bands.length;
    const gain = p.gain ?? 1, off = p.offset ?? 0;
    const tool = p.tool && p.tool.on ? p.tool : null;
    const lo = tool ? tool.level - tool.width / 2 : 0, inv = tool ? 1 / tool.width : 1;
    const amp = p.ditherAmp ?? 0.85;
    const cyc = p.cycle ? p.time || 0 : -1;
    const hotV = lut.stops ? lut.stops[Math.min(N, lut.hot ?? 99)] ?? 9 : (lut.hot ?? 99) / N;
    const ph = cyc * Math.PI * 2 * 3;
    const tab = lut.tab, TN1 = LUT_TN - 1;
    for (let y = 0, i = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i++) {
        const hv = heat[i];
        let v = tool ? (hv - lo) * inv : hv * gain + off;
        if (cyc >= 0 && v > hotV) v += 0.045 * Math.sin(ph + hv * 46 + (y >> 2) * 0.7);
        let ti = ((v - LUT_TMIN) * LUT_SCALE) | 0;
        ti = ti < 0 ? 0 : ti > TN1 ? TN1 : ti;
        let b = Math.floor(tab[ti] + th[i] * amp);
        idx[i] = b < 0 ? 0 : b >= N ? N - 1 : b;
      }
    }
    // chromatic misregistration: hot bands smear 1px to the left, cold ones 1px up
    if (p.fringe !== false && lut.hot < N) {
      const hb = lut.hot;
      for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = w - 2; x >= 0; x--) {
          const a = idx[row + x], r = idx[row + x + 1];
          if (r >= hb && a < hb - 1 && ((x + y) & 1)) idx[row + x] = hb;
        }
      }
    }
    return idx;
  }

  // 8x8 attribute clash: each cell keeps only its two most common bands.
  clash(idx, N) {
    const { w, h } = this;
    const cnt = new Uint16Array(16);
    for (let cy = 0; cy < h; cy += 8) for (let cx = 0; cx < w; cx += 8) {
      cnt.fill(0);
      for (let y = cy; y < Math.min(h, cy + 8); y++) for (let x = cx; x < Math.min(w, cx + 8); x++) cnt[idx[y * w + x]]++;
      let a = 0, b = -1;
      for (let k = 1; k < N; k++) if (cnt[k] > cnt[a]) a = k;
      for (let k = 0; k < N; k++) if (k !== a && (b < 0 || cnt[k] > cnt[b])) b = k;
      if (b < 0 || cnt[b] === 0) b = a;
      for (let y = cy; y < Math.min(h, cy + 8); y++) for (let x = cx; x < Math.min(w, cx + 8); x++) {
        const v = idx[y * w + x];
        if (v !== a && v !== b) idx[y * w + x] = Math.abs(v - a) <= Math.abs(v - b) ? a : b;
      }
    }
  }

  // Colourise band indices into a Uint32 buffer.
  colorize(idx, lutName, out, p = {}) {
    const lut = typeof lutName === 'string' ? getLut(lutName) : lutName;
    const { w, h } = this;
    const A = new Uint32Array(lut.bands.length), B = new Uint32Array(lut.bands.length);
    lut.bands.forEach((e, k) => { if (Array.isArray(e)) { A[k] = U32[e[0]]; B[k] = U32[e[1]]; } else { A[k] = B[k] = U32[e]; } });
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const k = idx[i];
      out[i] = (x + y) & 1 ? B[k] : A[k];
    }
    if (p.pattern) this.pattern(idx, out);
  }

  // Colour-blind aid: band index as a texture overlay.
  pattern(idx, out) {
    const { w, h } = this;
    const ink = U32[C.bwhite], dark = U32[C.black];
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const k = idx[i];
      let on = false;
      switch (k) {
        case 1: on = (x % 4 === 0) && (y % 4 === 0); break;
        case 2: on = y % 3 === 0 && x % 2 === 0; break;
        case 3: on = x % 3 === 0 && y % 2 === 0; break;
        case 4: on = (x + y) % 4 === 0; break;
        case 5: on = (x - y + 400) % 4 === 0; break;
        case 6: on = (x % 4 === 0) || (y % 4 === 0); break;
        case 7: on = ((x + y) & 1) === 0 && (x % 2 === 0); break;
        default: on = false;
      }
      if (on) out[i] = k >= 4 ? dark : ink;
    }
  }

  render(heat, p, out) {
    const lut = typeof p.lut === 'string' ? getLut(p.lut) : p.lut;
    const idx = this.bands(heat, p);
    if (p.clash) this.clash(idx, lut.bands.length);
    this.colorize(idx, lut, out, p);
    return idx;
  }
}
