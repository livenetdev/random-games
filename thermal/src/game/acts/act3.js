import { COL } from '../game.js';
import { audio } from '../../audio/engine.js';
import { setTimeoutGame } from './act1.js';
import { StillControls } from './controls.js';

const POS = ['approach', 'far', 'mid', 'close'];

// ACT III — "The Van": which one is Walt?
export class Act3 {
  constructor(g) { this.g = g; this.name = 'act3'; this.pos = 0; this.raised = false; this.choice = null; this.ctl = new StillControls(g, this); this.hotTags = ['walt', 'it']; this.view = 'thermal'; }
  get st() { return this.g.state; }
  get W() { return this.st.walt === 'driver' ? 'A' : 'B'; }
  thermalId() {
    const p = POS[this.pos], W = this.W;
    if (p === 'approach') return `a3_approach_${W}`;
    if (p === 'far') return `a3_far_t_${W}`;
    if (p === 'mid') return `a3_mid_t_${W}`;
    return this.raised ? `a3_raise_${W}` : `a3_ref_${W}`;
  }
  flashId() { const p = POS[this.pos], W = this.W; return p === 'close' ? `a3_ref_f_${W}` : p === 'mid' ? `a3_mid_f_${W}` : `a3_far_f_${W}`; }
  enter() {
    const g = this.g;
    audio.setScene('van');
    audio.setItNear(0.8);
    this.busy = true;
    g.viewer.blank();
    g.say('THE VAN\'S HEADLIGHTS WERE ON.', 3);
    setTimeoutGame(g, 3, () => { this.busy = false; this.look(); g.say('↑ WALK CLOSER · F FLASH · TAB MONITOR · SPACE BLINK · T THRESHOLD', 5, COL.C); });
  }
  dreadCtx() { return { itNear: 0.5 + this.pos * 0.15, deciding: POS[this.pos] === 'close' }; }
  look(type = 'dissolve') {
    const g = this.g;
    if (this.view === 'thermal' && this.st.battery > 0) { g.viewer.show(this.thermalId(), type, { dur: 0.5 }); if (this.raised) g.viewer.prev = `a3_ref_${this.W}`; }
    else g.viewer.blank();
  }
  key(code, k, rep) {
    const g = this.g;
    if (this.busy) return;
    if (this.choice) {
      if (code === 'Enter' || code === 'KeyY') this.decide(this.choice);
      else if (code === 'Escape' || code === 'KeyN') this.choice = null;
      return;
    }
    if ((code === 'ArrowUp' || code === 'KeyW') && !this.ctl.toolOn) return this.walk();
    if (code === 'KeyF' || code === 'Enter') return this.flash();
    if (code === 'Tab') { this.view = this.view === 'thermal' ? 'dark' : 'thermal'; audio.sfx('static', { gain: 0.3 }); this.look('cut'); return; }
    if (POS[this.pos] === 'close' && (code === 'Digit1' || code === 'Digit2')) { this.choice = code === 'Digit1' ? this.tagAt('driver') : this.tagAt('door'); return; }
    this.ctl.key(code, rep);
  }
  keyUp(code) { this.ctl.keyUp(code); }
  wheel(d, x, y) { this.ctl.wheel(d, x, y); }
  pointerDown(x, y) { this.ctl.pointerDown(x, y); }
  pointerMove(x, y) { this.ctl.pointerMove(x, y); }
  pointerUp(x, y, drag) {
    if (this.busy) return;
    if (this.ctl.pointerUp(x, y, drag) || drag) return;
    if (this.choice) { if (y > this.g.display.h - 40) this.decide(this.choice); else this.choice = null; return; }
    if (POS[this.pos] === 'close' && this.g.viewer.cur) {
      for (const h of this.g.viewer.hotspotsNow()) if ((h.tag === 'walt' || h.tag === 'it') && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { this.choice = h.tag; audio.sfx('tick'); return; }
    }
    if (y < this.g.display.h * 0.25 && POS[this.pos] !== 'close') this.walk();
  }
  // which tag sits in the driver's seat vs at the door this playthrough
  tagAt(spot) { return this.st.walt === spot ? 'walt' : 'it'; }
  walk() {
    const g = this.g;
    if (this.pos >= POS.length - 1 || !g.viewer.ready() && g.viewer.cur) return;
    this.busy = true;
    audio.sfx('walk', { surface: 'gravel' });
    g.viewer.blank();
    setTimeoutGame(g, 1.8, () => {
      this.pos++;
      this.busy = false;
      this.look();
      if (POS[this.pos] === 'mid' && !this.camSeen) this.camBurst();
      if (POS[this.pos] === 'close') { audio.sfx('creak', { gain: 0.6 }); g.caption('[the van door creaks]'); g.say('ONE OF THEM IS WALT. HIS KEYS ARE ON HIM. CLICK ONE (OR 1 / 2).', 5, COL.Y); }
    });
  }
  camBurst() {
    const g = this.g;
    this.camSeen = true; this.busy = true;
    setTimeoutGame(g, 1.2, () => { audio.sfx('trailclick'); g.say('CAM 3 CAUGHT ME.', 2.5); g.viewer.show(`a3_cam_${this.W}`, 'cut'); });
    setTimeoutGame(g, 5.2, () => { this.busy = false; this.look('cut'); });
  }
  flash() {
    const g = this.g, st = this.st;
    if (st.film <= 0) { g.say('NO EXPOSURES LEFT.', 2); return; }
    st.film--;
    this.busy = true;
    audio.chargeStart();
    setTimeoutGame(g, 0.9, () => {
      audio.chargeStop(); audio.sfx('shutter', { flash: true });
      g.viewer.show(this.flashId(), 'flash', { gain: 1.4 });
      if (POS[this.pos] !== 'approach') g.dread.add(POS[this.pos] === 'close' ? 0.2 : 0.08);
      setTimeoutGame(g, 1.6, () => {
        g.viewer.startAfterimage(); g.viewer.blank();
        // it copies how you stand: you raised the camera
        if (POS[this.pos] === 'close') { this.raised = true; g.say('ONE OF THEM IS STANDING DIFFERENTLY.', 3); }
        setTimeoutGame(g, 1.5, () => { this.busy = false; this.look('cut'); });
      });
    });
  }
  decide(tag) {
    const g = this.g;
    this.choice = null; this.busy = true;
    const correct = tag === 'walt';
    this.st.ending = correct ? 'cold' : 'warm';
    g.lines = [];
    // the second earned jump-scare: absolute silence, then
    audio.silence(1200);
    g.viewer.osdOverride = false;
    setTimeoutGame(g, 1.2, () => {
      g.viewer.osdOverride = null;
      audio.sfx('stinger');
      g.viewer.show(correct ? 'sub_hand' : `e_w1_${this.W}`, 'cut', { noSub: true });
      g.dread.add(0.3);
    });
    setTimeoutGame(g, 1.9, () => { this.st.act = 'ending'; g.save(); g.goto(new g.Scenes.Ending(g, this.st.ending)); });
  }
  update(dt) {
    this.ctl.update(dt);
    if (this.view === 'thermal' && this.g.viewer.cur && !this.busy) {
      this.st.battery = Math.max(0, this.st.battery - 0.5 * dt);
      if (this.st.battery <= 0) { this.g.say('THE MONITOR DIED. ONLY THE FLASH NOW.', 3); this.view = 'dark'; this.look('cut'); }
    }
  }
  draw(buf, t) {
    const g = this.g, ui = g.ui, W = g.display.w, H = g.display.h;
    g.viewer.draw(buf, t);
    this.ctl.drawOverlay(buf, t);
    if (this.choice) {
      const where = this.tagAt('driver') === this.choice ? "THE ONE IN THE DRIVER'S SEAT" : 'THE ONE AT THE DOOR';
      ui.rect(0, H - 40, W, 30, COL.k);
      ui.center(`TAKE THE KEYS FROM ${where}?`, H - 36, COL.Y, null);
      ui.center('ENTER: YES    ESC: NO', H - 24, COL.w, null);
    }
    ui.text(`EXP ${String(this.st.film).padStart(2, '0')}`, W / 2 - 18, H - 10, COL.Y, COL.k);
    if (g.viewer.black && !this.busy) ui.center(POS[this.pos] === 'close' ? 'TAB: MONITOR  F: FLASH' : '↑ WALK CLOSER', H / 2, COL.b, null);
  }
}
