import { drawText, textWidth } from '../render/font5x7.js';
import { fillRect, wrapText } from '../render/osd.js';
import { U32, C } from '../render/palette.js';
import { thresholdAt } from '../render/dither.js';

export const COL = {
  k: U32[C.black], w: U32[C.white], W: U32[C.bwhite], c: U32[C.cyan], C: U32[C.bcyan], b: U32[C.blue],
  r: U32[C.red], R: U32[C.bred], y: U32[C.yellow], Y: U32[C.byellow], g: U32[C.green], G: U32[C.bgreen], m: U32[C.magenta],
};

export class UI {
  constructor(display) { this.d = display; }
  get buf() { return this.d.buf; }
  text(s, x, y, col = COL.W, shadow = COL.k, scale = 1) { drawText(this.buf, this.d.w, this.d.h, s, x, y, col, scale, shadow); }
  center(s, y, col = COL.W, shadow = COL.k, scale = 1) { this.text(s, ((this.d.w - textWidth(s, scale)) / 2) | 0, y, col, shadow, scale); }
  rect(x, y, w, h, col) { fillRect(this.buf, this.d.w, this.d.h, x, y, w, h, col); }
  frame(x, y, w, h, col) { this.rect(x, y, w, 1, col); this.rect(x, y + h - 1, w, 1, col); this.rect(x, y, 1, h, col); this.rect(x + w - 1, y, 1, h, col); }
  // 1px dithered outline (hover hint)
  ditherFrame(x, y, w, h, col, t = 0) {
    const B = this.buf, W = this.d.w, H = this.d.h, ph = (t * 8) | 0;
    const put = (px, py) => { if (px >= 0 && py >= 0 && px < W && py < H && ((px + py + ph) & 1)) B[py * W + px] = col; };
    for (let i = 0; i < w; i++) { put(x + i, y); put(x + i, y + h - 1); }
    for (let i = 0; i < h; i++) { put(x, y + i); put(x + w - 1, y + i); }
  }
  ellipse(x0, y0, x1, y1, col, t = 0) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
    const n = Math.max(24, (rx + ry) * 3) | 0;
    const B = this.buf, W = this.d.w, H = this.d.h;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = Math.round(cx + Math.cos(a) * rx), py = Math.round(cy + Math.sin(a) * ry);
      if (px >= 0 && py >= 0 && px < W && py < H && (i + ((t * 10) | 0)) % 3 !== 0) B[py * W + px] = col;
    }
  }
  // Menu: black panel, one cyan highlight bar.
  menu(items, sel, x, y, w) {
    const lh = 11;
    this.rect(x - 4, y - 4, w + 8, items.length * lh + 6, COL.k);
    items.forEach((it, i) => {
      const yy = y + i * lh;
      if (i === sel) { this.rect(x - 2, yy - 2, w + 4, lh, COL.c); this.text(it, x, yy, COL.k, null); }
      else this.text(it, x, yy, COL.w, null);
    });
    return { x: x - 2, y: y - 2, w: w + 4, lh, n: items.length };
  }
  wrap(s, n) { return wrapText(s, n); }
  // Typed-out paragraph, returns true when fully typed.
  typed(s, t, x, y, maxChars = 48, cps = 24, col = COL.W) {
    const lines = wrapText(s, maxChars);
    let left = Math.floor(t * cps);
    let yy = y;
    for (const ln of lines) {
      const part = ln.slice(0, Math.max(0, left));
      left -= ln.length;
      const xx = x === 'center' ? ((this.d.w - ln.length * 6) / 2) | 0 : x;
      this.text(part, xx, yy, col, COL.k);
      yy += 11;
    }
    return left > 0;
  }
  noise(amount, t) {
    const B = this.buf, n = B.length, f = (t * 60) | 0;
    for (let i = 0; i < n; i++) if (((i * 2654435761 + f * 97) >>> 0) % 1000 < amount * 1000) B[i] = ((i + f) & 3) ? COL.b : COL.w;
  }
  dither(x, y) { return thresholdAt(x, y); }
}
