import { Compositor } from '../render/compositor.js';
import { drawOSD, fillRect, OSD_COL } from '../render/osd.js';
import { getLut } from '../render/lut.js';
import { U32, C } from '../render/palette.js';
import { buildDissolveMap } from '../render/dither.js';
import { BY_ID } from '../render/stills.js';
import { settings } from '../core/settings.js';
import { hash2 } from '../core/rng.js';

// Draws stills with every live effect: LUT/threshold, palette cycling, micro-loops,
// scan artifacts, transitions (cut / noise dissolve / flash), OSD.
export class Viewer {
  constructor(game) {
    this.g = game;
    const { w, h } = game.display;
    this.w = w; this.h = h;
    this.comp = new Compositor(w, h);
    this.a = new Uint32Array(w * h);
    this.b = new Uint32Array(w * h);
    this.heatTmp = new Float32Array(w * h);
    this.dis = buildDissolveMap(w, h, 1103);
    this.cur = null;          // still id
    this.prev = null;         // previous still (blink comparator)
    this.trans = null;
    this.flash = null;
    this.after = null;        // burned-in afterimage
    this.tool = { on: false, level: 0.45, width: 0.16 };
    this.zoom = null;
    this.blink = false;
    this.gain = 1;
    this.lutOverride = null;
    this.morph = null;        // frame changing while viewed
    this.holdUntil = 0;
    this.black = false;
    this.osdOverride = null;
  }
  get still() { return this.cur ? this.g.bank.get(this.cur) : null; }
  get def() { return this.cur ? BY_ID[this.cur] : null; }

  // type: 'cut' | 'dissolve' | 'flash' | 'fade'
  show(id, type = 'cut', o = {}) {
    if (!this.g.bank.has(id)) { console.warn('[thermal] still not loaded', id); return; }
    const from = this.cur;
    if (from && from !== id && !o.keepPrev) this.prev = from;
    this.cur = id;
    this.zoom = null;
    this.morph = null;
    this.black = false;
    this.gain = o.gain ?? 1;
    this.lutOverride = o.lut || null;
    const now = this.g.time;
    this.holdUntil = now + (o.hold ?? 0.4);
    if (type === 'flash' && settings.reduceFlashes) type = 'fade';
    if (type === 'dissolve' && from) this.trans = { type, from, t0: now, dur: o.dur ?? 0.45 };
    else if (type === 'fade') this.trans = { type, t0: now, dur: o.dur ?? 0.2 };
    else if (type === 'flash') { this.trans = null; this.flash = { t0: now, gain: o.gain ?? 1 }; }
    else this.trans = null;
    // subliminal insert: one 16ms frame of something else
    if (!o.noSub && this.g.dread.subliminal()) {
      this.sub = { id: this.g.dread.pickInsert(), until: now + 1 / 60 };
    }
    this.g.dread.onView(id);
  }
  blank() { this.black = true; this.cur = null; this.zoom = null; }
  ready() { return this.g.time >= this.holdUntil && !this.trans; }
  startAfterimage() {
    if (!this.cur) return;
    this.after = { id: this.cur, t0: this.g.time, gain: this.gain };
  }

  // Live heat for the current still (zoom, morph and scan artifacts applied).
  heatFor(id, def, t, scan) {
    const s = this.g.bank.get(id);
    let heat = s.heat;
    if (this.zoom && id === this.cur) heat = this.zoom.heat;
    if (this.morph && id === this.cur && !this.zoom) heat = this.morph.heat;
    if (!scan) return heat;
    const H = this.heatTmp; H.set(heat);
    const { w, h } = this;
    const cap = settings.reduceFlashes ? 0.25 : 1;
    // rolling bar
    const by = ((t * 22) % (h + 40)) - 20;
    for (let y = Math.max(0, by | 0); y < Math.min(h, (by + 12) | 0); y++) for (let x = 0; x < w; x++) H[y * w + x] += 0.035;
    // dropped lines
    const f = (t * 60) | 0;
    for (let y = 0; y < h; y++) if (hash2(y, f, 9) < 0.006 * cap) H.fill(-0.2, y * w, y * w + w);
    // horizontal tearing
    if (hash2(f >> 2, 3, 1) < 0.06 * cap) {
      const y0 = (hash2(f >> 2, 5, 2) * h) | 0, n = 3 + ((hash2(f, 7, 3) * 8) | 0), dx = ((hash2(f >> 2, 8, 4) - 0.5) * 16) | 0;
      for (let y = y0; y < Math.min(h, y0 + n); y++) { const row = heat.subarray(y * w, y * w + w); for (let x = 0; x < w; x++) H[y * w + x] = row[Math.min(w - 1, Math.max(0, x - dx))]; }
    }
    return H;
  }

  composeStill(id, out, t, o = {}) {
    const def = BY_ID[id];
    const s = this.g.bank.get(id);
    if (!s) { out.fill(U32[C.black]); return null; }
    const lutName = o.lut || (id === this.cur && this.lutOverride) || def.lut || 'thermal';
    const lut = getLut(lutName);
    const scan = (def.style === 'monitor' || def.style === 'handheld') && !o.noScan;
    const heat = this.heatFor(id, def, t, scan);
    const dreadDrift = def.mode === 'card' ? 0 : this.g.dread.lutDrift();
    const tool = id === this.cur && this.tool.on && !o.noTool ? this.tool : null;
    const idx = this.comp.render(heat, {
      lut, gain: (o.gain ?? (id === this.cur ? this.gain : 1)), offset: dreadDrift, tool, time: t, cycle: lut.hot < 9,
      clash: def.clash || o.clash, pattern: tool && settings.patterns, fringe: def.mode !== 'card',
    }, out);
    // micro-loops
    if (def.micro?.includes('breathe') && !this.zoom) {
      const on = Math.sin(t * Math.PI * 2 * 0.55) > 0.2;
      if (on) for (const hs of s.hotspots) if (hs.tag === 'it' || hs.tag === 'dana') {
        const y1 = hs.y + (hs.h >> 1);
        for (let y = hs.y; y < y1; y++) { if (y + 1 >= this.h) break; out.copyWithin(y * this.w + hs.x, (y + 1) * this.w + hs.x, (y + 1) * this.w + hs.x + hs.w); }
      }
    }
    if (def.micro?.includes('flicker') && ((t * 7) | 0) % 9 === 0) for (let i = 0; i < out.length; i += 2) if (idx[i] > 3) out[i] = U32[C.black];
    if (!o.noOsd) this.osd(def, out, t);
    return idx;
  }

  osd(def, out, t) {
    if (this.osdOverride === false) return;
    const style = def.style || 'trail';
    if (style === 'none') return;
    const blink = ((t * 1.6) | 0) % 2 === 0;
    const o = { cam: def.cam, temp: def.temp, date: def.date, time: this.g.clock.stamp(def.time), blink, style, burst: def.burst ? `BURST ${def.burst}` : null };
    if (style === 'handheld') { o.batt = Math.round(this.g.state?.battery ?? 100); o.reading = this.g.readout; }
    if (style === 'monitor') o.extra = 'LIVE';
    if (style === 'flash') o.imprint = "'97 11 14";
    drawOSD(out, this.w, this.h, o);
  }

  draw(buf, t) {
    const { w, h } = this;
    if (this.sub && t < this.sub.until && this.g.bank.has(this.sub.id)) {
      this.composeStill(this.sub.id, buf, t, { noOsd: true });
      return;
    }
    this.sub = null;
    // flash: two white frames then the exposure blooming down
    if (this.flash) {
      const dt = t - this.flash.t0;
      if (dt < 2 / 60) { buf.fill(U32[C.bwhite]); return; }
      const k = Math.min(1, (dt - 2 / 60) / 0.2);
      this.gain = this.flash.gain * (1 + (1 - k) * 2.2);
      if (k >= 1) { this.gain = this.flash.gain; this.flash = null; }
    }
    if (this.black || !this.cur) {
      buf.fill(U32[C.black]);
      this.drawAfter(buf, t);
      return;
    }
    const showId = this.blink && this.prev && this.g.bank.has(this.prev) ? this.prev : this.cur;
    this.composeStill(showId, buf, t);
    if (this.blink && showId === this.prev) {
      // blink comparator marker
      fillRect(buf, w, h, w - 8, 2, 6, 6, OSD_COL.Y);
    }
    if (this.trans) {
      const p = (t - this.trans.t0) / this.trans.dur;
      if (p >= 1) this.trans = null;
      else if (this.trans.type === 'dissolve') {
        this.composeStill(this.trans.from, this.b, t, { noTool: true });
        const d = this.dis;
        for (let i = 0; i < buf.length; i++) if (d[i] > p) buf[i] = this.b[i];
      } else if (this.trans.type === 'fade') {
        const d = this.dis, k = U32[C.black];
        for (let i = 0; i < buf.length; i++) if (d[i] > p) buf[i] = k;
      }
    }
    this.drawAfter(buf, t);
  }

  drawAfter(buf, t) {
    if (!this.after) return;
    const p = (t - this.after.t0) / 1.5;
    if (p >= 1 || !this.g.bank.has(this.after.id)) { this.after = null; return; }
    if (!this.black && this.cur) return; // only lingers over the following black
    const s = this.g.bank.get(this.after.id);
    const lut = getLut('after');
    const idx = this.comp.bands(s.heat, { lut, gain: this.after.gain * 1.4, time: t, fringe: false, ditherAmp: 1 });
    const cols = lut.bands.map((e) => U32[e]);
    const d = this.dis;
    // offset slightly: the eye drifts
    const ox = Math.round(Math.sin(t * 0.7) * 2);
    for (let y = 0, i = 0; y < this.h; y++) for (let x = 0; x < this.w; x++, i++) {
      if (d[i] < p) continue;
      const sx = Math.min(this.w - 1, Math.max(0, x - ox));
      const k = idx[y * this.w + sx];
      if (k > 1) buf[i] = cols[k];
    }
  }

  // Readout for the thermal tool: °F at a point.
  heatAt(x, y) {
    const s = this.still; if (!s) return null;
    const heat = this.zoom ? this.zoom.heat : s.heat;
    const xi = Math.max(0, Math.min(this.w - 1, x | 0)), yi = Math.max(0, Math.min(this.h - 1, y | 0));
    let acc = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = xi + dx, yy = yi + dy; if (xx < 0 || yy < 0 || xx >= this.w || yy >= this.h) continue;
      acc += heat[yy * this.w + xx]; n++;
    }
    return acc / n;
  }

  hotspotsNow() {
    if (this.zoom) return this.zoom.hotspots;
    return this.still ? this.still.hotspots : [];
  }

  // Re-render a region with more noise. Detail never improves.
  setZoom(z, cx, cy) {
    if (!this.cur) return;
    const def = this.def;
    if (z <= 1 || def.mode === 'card') { this.zoom = null; return; }
    const r = this.g.bank.zoom(this.cur, cx, cy, z);
    if (r) this.zoom = { z, heat: r.heat, hotspots: r.hotspots, rect: r.rect };
  }

  // Slowly swap blocks toward an alternate variant (high dread only).
  startMorph(altId) {
    const a = this.g.bank.get(this.cur), b = this.g.bank.get(altId);
    if (!a || !b) return;
    const { w, h } = this;
    const blocks = [];
    for (let by = 0; by < h; by += 8) for (let bx = 0; bx < w; bx += 8) {
      let diff = 0;
      for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) diff += Math.abs(a.heat[y * w + x] - b.heat[y * w + x]);
      if (diff > 1.2) blocks.push([bx, by, hash2(bx, by, 77)]);
    }
    blocks.sort((p, q) => p[2] - q[2]);
    this.morph = { alt: altId, heat: Float32Array.from(a.heat), blocks, n: 0, next: this.g.time + 2 };
  }
  updateMorph(t) {
    const m = this.morph; if (!m || t < m.next || m.n >= m.blocks.length) return;
    const b = this.g.bank.get(m.alt);
    const [bx, by] = m.blocks[m.n++];
    for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) m.heat[y * this.w + x] = b.heat[y * this.w + x];
    m.next = t + 0.35;
  }
}
