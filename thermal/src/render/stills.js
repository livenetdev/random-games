import MANIFEST from '../data/stills.json';
import { StillRenderer } from './StillRenderer.js';
import { drawCard } from './cards.js';
import { getCached, putCached } from '../core/store.js';
import { hashStr } from '../core/rng.js';

export const RENDER_VERSION = 'r7';
export const BY_ID = Object.fromEntries(MANIFEST.map((s) => [s.id, s]));
export { MANIFEST };

// Renders and caches every still. Heat buffers live in memory; ImageBitmap
// thumbnails are made on demand for the board and debug tools.
export class StillBank {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.mem = new Map();
    this.renderer = null;
    this.seedOverride = null;
  }
  ensureRenderer() {
    if (!this.renderer) this.renderer = new StillRenderer({ w: this.w, h: this.h, ss: 4 });
    return this.renderer;
  }
  key(def) { return `${RENDER_VERSION}:${this.w}x${this.h}:${def.id}:${hashStr(JSON.stringify(def))}`; }
  has(id) { return this.mem.has(id); }
  get(id) { return this.mem.get(id); }
  renderNow(def) {
    const r = this.ensureRenderer();
    const d = this.seedOverride != null ? { ...def, seed: this.seedOverride } : def;
    if (def.mode === 'card') {
      const cv = drawCard(d, this.w * 4, this.h * 4);
      return r.renderSource(cv, d);
    }
    return r.render(d);
  }
  async load(def, useCache = true) {
    if (this.mem.has(def.id)) return this.mem.get(def.id);
    const k = this.key(def);
    let s = useCache && this.seedOverride == null ? await getCached(k) : null;
    if (!s) {
      s = this.renderNow(def);
      if (this.seedOverride == null) putCached(k, s);
    }
    s.id = def.id;
    this.mem.set(def.id, s);
    return s;
  }
  // Load a list with progress; yields between items so the loader can animate.
  async loadMany(defs, onProgress, budgetMs = 30) {
    let i = 0, t0 = performance.now();
    for (const d of defs) {
      await this.load(d);
      i++;
      if (onProgress) onProgress(i, defs.length, d);
      if (performance.now() - t0 > budgetMs) { await new Promise((r) => setTimeout(r, 0)); t0 = performance.now(); }
    }
  }
  zoom(id, cx, cy, z) {
    const def = BY_ID[id];
    if (!def || def.mode === 'card') return null;
    const r = this.ensureRenderer();
    const opts = { zoom: { cx, cy, z } };
    const s = r.render(def, opts);
    s.rect = opts.zoom.rect;
    return s;
  }
  invalidate() { this.mem.clear(); }
}
