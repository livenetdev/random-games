import { COL } from '../game.js';
import { audio } from '../../audio/engine.js';
import { setTimeoutGame } from './act1.js';

// Timed slideshows with irregular intervals and audio-locked cuts.
const SEQ = {
  cold: (W) => [
    [null, 1.2, () => audio.sfx('engine'), '[the engine catches]'],
    ['e_c1', 2.5, () => audio.setScene('outdoor')],
    ['e_c2', 2.2],
    ['e_c3', 0.9, () => audio.sfx('tape')],
    ['e_c4', 2.4],
    [null, 0.6],
    ['e_c5', 7.5, () => audio.sfx('breath', { gain: 0.4 })],
  ],
  warm: (W) => [
    [null, 0.5],
    [`e_w1_${W}`, 0.35, () => audio.sfx('static')],
    ['e_w2', 0.22],
    ['e_w3', 0.6, () => audio.sfx('thump')],
    ['e_w4', 0.2, () => audio.sfx('static')],
    ['e_w5', 0.5],
    ['e_w6', 0.3, () => audio.sfx('creak')],
    [null, 2.0, () => audio.setScene('van')],
    [`e_w7_${W}`, 9.0, () => audio.sfx('trailclick')],
  ],
  exposure: () => [
    [null, 3.0, () => { audio.setItNear(1); audio.sfx('walk', { surface: 'leaves' }); }, '[my own footsteps]'],
    [null, 2.5, () => audio.echoStep('leaves', 600), '[footsteps behind you]'],
    [null, 3.0, () => audio.sfx('breath'), '[breathing, close]'],
    [null, 2.0, () => audio.sfx('wind'), '[the camera winds on. nothing left.]'],
    [null, 2.5, () => audio.silence(1500)],
    ['e_x2', 9.0, () => { audio.setScene('outdoor'); audio.setItNear(0); audio.sfx('trailclick'); }],
  ],
};
const TITLE = { cold: ['COLD.', 'ENDING 1 OF 3'], warm: ['WARM.', 'ENDING 2 OF 3'], exposure: ['EXPOSURE.', 'ENDING 3 OF 3'] };

export class Ending {
  constructor(g, type) { this.g = g; this.type = type; this.name = `ending:${type}`; this.done = false; }
  enter() {
    const g = this.g;
    const W = g.state?.walt === 'driver' ? 'A' : 'B';
    const seq = SEQ[this.type](W);
    let t = 0;
    for (const [id, dur, fx, cap] of seq) {
      setTimeoutGame(g, t, () => {
        if (fx) fx();
        if (cap) g.caption(cap, Math.max(2, dur));
        if (id) g.viewer.show(id, 'cut', { noSub: true }); else g.viewer.blank();
      });
      t += dur;
    }
    setTimeoutGame(g, t, () => { this.done = true; this.t1 = g.time; g.viewer.blank(); audio.setScene('silent'); if (g.state) { g.state.endings = [...new Set([...(g.state.endings || []), this.type])]; } g.clearSave(); });
  }
  key(code) { if (this.done && this.g.time - this.t1 > 2 && (code === 'Enter' || code === 'Space')) this.g.goto(new this.g.Scenes.Title(this.g)); }
  pointerUp() { this.key('Enter'); }
  draw(buf, t) {
    const g = this.g;
    g.viewer.draw(buf, t);
    if (!this.done) return;
    const [a, b] = TITLE[this.type];
    g.ui.center(a, 80, COL.W, COL.k, 2);
    g.ui.center(b, 104, COL.c);
    g.ui.center('THERMAL · A STILLS-DRIVEN HORROR', 140, COL.b);
    if (t - this.t1 > 2 && ((t * 2) | 0) % 2 === 0) g.ui.center('PRESS ENTER', 170, COL.w);
  }
}
