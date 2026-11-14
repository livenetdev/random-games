import { settings } from '../core/settings.js';
import { BY_ID } from '../render/stills.js';
import { audio } from '../audio/engine.js';

// Hidden tension value. Rises while you look at frames containing it, when you
// re-view frames, and while you hesitate over decisions. Drives audio, LUT drift,
// subliminal inserts and (when high) frames that change while you watch.
export class Dread {
  constructor(game) { this.g = game; this.v = 0; this.views = {}; this.hesitate = 0; this.rng = Math.random; }
  set(v) { this.v = Math.max(0, Math.min(1, v)); }
  add(d) { this.set(this.v + d); }
  onView(id) {
    this.views[id] = (this.views[id] || 0) + 1;
    if (this.views[id] > 1) this.add(0.006 * Math.min(5, this.views[id]));
  }
  update(dt, ctx = {}) {
    const def = this.g.viewer.def;
    let d = -0.004 * dt;                                 // slow decay
    if (def?.hasIt && !this.g.viewer.black) d += 0.012 * dt;
    if (ctx.deciding) d += 0.01 * dt;
    if (ctx.itNear) d += 0.03 * ctx.itNear * dt;
    this.add(d);
    audio.setDread(this.v);
  }
  lutDrift() { return this.v * 0.035; }
  subliminal() {
    if (settings.reduceFlashes) return false;
    const p = this.v > 0.35 ? (this.v - 0.35) * 0.12 : 0;
    return this.rng() < p;
  }
  pickInsert() {
    const pool = ['sub_behind', 'sub_hand', 'sub_seat', 'sub_face'].filter((id) => this.g.bank.has(id));
    return pool[Math.floor(this.rng() * pool.length)] || 'sub_face';
  }
  shouldMorph() { return this.v > 0.7; }
}
