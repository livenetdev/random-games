import { drawText, textWidth } from './font5x7.js';
import { U32, C } from './palette.js';

const W = U32[C.bwhite], K = U32[C.black], R = U32[C.bred], Y = U32[C.byellow], G = U32[C.bgreen], CY = U32[C.bcyan];
export const OSD_COL = { W, K, R, Y, G, CY };

export function fillRect(buf, w, h, x, y, rw, rh, col) {
  const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0), x1 = Math.min(w, (x + rw) | 0), y1 = Math.min(h, (y + rh) | 0);
  for (let yy = y0; yy < y1; yy++) buf.fill(col, yy * w + x0, yy * w + x1);
}

// Trail-cam / monitor on-screen display.
// o: { cam, time, date, temp, rec, blink, style: 'trail'|'monitor'|'handheld'|'flash'|'reader', extra }
export function drawOSD(buf, w, h, o) {
  const style = o.style || 'trail';
  if (style === 'trail') {
    // bottom bar, the way cheap trail cams burn it in
    fillRect(buf, w, h, 0, h - 10, w, 10, K);
    const left = `${o.cam || 'CAM 1'}  ${o.temp || '34°F'}`;
    drawText(buf, w, h, left, 3, h - 8, W);
    const right = `${o.time || '00:00:00'} ${o.date || '01/01/1997'}`;
    const rx = w - textWidth(right) - 34;
    drawText(buf, w, h, right, rx, h - 8, W);
    if (o.rec !== false && o.blink !== false) drawText(buf, w, h, '▮REC', w - 26, h - 8, R);
    if (o.burst) drawText(buf, w, h, o.burst, 3, 3, W, 1, K);
  } else if (style === 'monitor') {
    drawText(buf, w, h, o.cam || 'CAM 2', 4, 4, W, 1, K);
    const right = `${o.time || ''} ${o.date || ''}`;
    drawText(buf, w, h, right, w - textWidth(right) - 4, 4, W, 1, K);
    if (o.blink !== false) drawText(buf, w, h, '▮REC', 4, h - 11, R, 1, K);
    if (o.extra) drawText(buf, w, h, o.extra, w - textWidth(o.extra) - 4, h - 11, W, 1, K);
  } else if (style === 'handheld') {
    const t = `THERMAL  BATT ${o.batt ?? 100}%`;
    drawText(buf, w, h, t, 4, 4, G, 1, K);
    if (o.reading) drawText(buf, w, h, o.reading, w - textWidth(o.reading) - 4, 4, G, 1, K);
    if (o.blink !== false) drawText(buf, w, h, '▮', w - 10, h - 11, R, 1, K);
  } else if (style === 'flash') {
    // date-back imprint of a disposable camera, orange-ish (bright yellow/red)
    const t = o.imprint || "'97 11 14";
    drawText(buf, w, h, t, w - textWidth(t) - 8, h - 14, Y, 1, null);
  }
}

// Text box at the bottom (diegetic status line / subtitles).
export function drawLine(buf, w, h, text, y, col = W, bg = K, align = 'center') {
  const tw = textWidth(text);
  const x = align === 'center' ? ((w - tw) / 2) | 0 : align === 'left' ? 4 : w - tw - 4;
  if (bg !== null) fillRect(buf, w, h, x - 3, y - 2, tw + 6, 11, bg);
  drawText(buf, w, h, text, x, y, col);
}

export function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const wd of words) {
    if ((cur + ' ' + wd).trim().length > maxChars) { if (cur) lines.push(cur); cur = wd; }
    else cur = (cur + ' ' + wd).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}
