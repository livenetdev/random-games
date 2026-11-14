import { COL } from '../game.js';
import { MANIFEST } from '../../render/stills.js';

// Waits for a set of stills (e.g. on Continue, or if the background developer lags behind).
export class Developing {
  constructor(g, filter, next) { this.g = g; this.filter = filter; this.next = next; this.name = 'developing'; this.counts = false; this.pausable = false; }
  enter() {
    const defs = MANIFEST.filter(this.filter).filter((d) => !this.g.bank.has(d.id));
    this.total = defs.length; this.n = 0;
    this.g.bank.loadMany(defs, (i) => { this.n = i; }).then(() => this.g.goto(this.next()));
  }
  draw(buf) {
    buf.fill(COL.k);
    this.g.ui.center('DEVELOPING...', 90, COL.w);
    this.g.ui.center(`${this.n} / ${this.total}`, 104, COL.b);
  }
}
