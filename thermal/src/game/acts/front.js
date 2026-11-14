import { COL, OptionsMenu } from '../game.js';
import { MANIFEST, BY_ID } from '../../render/stills.js';
import { settings, saveSettings } from '../../core/settings.js';
import { audio } from '../../audio/engine.js';
import { loadGame } from '../save.js';

// Boot: photosensitivity warning.
export class Warning {
  constructor(g) { this.g = g; this.name = 'warning'; this.pausable = false; this.counts = false; }
  enter() { this.t0 = this.g.time; }
  key(code) {
    if (code === 'KeyR') { settings.reduceFlashes = !settings.reduceFlashes; saveSettings(); audio.sfx('tick'); }
    if ((code === 'Enter' || code === 'Space') && this.g.time - this.t0 > 1.0) this.g.goto(new Loader(this.g));
  }
  pointerUp(x, y) { if (y > 150 && y < 175) { settings.reduceFlashes = !settings.reduceFlashes; saveSettings(); } else if (this.g.time - this.t0 > 1.0) this.g.goto(new Loader(this.g)); }
  draw(buf) {
    const ui = this.g.ui;
    buf.fill(COL.k);
    ui.center('PHOTOSENSITIVITY WARNING', 24, COL.Y);
    const ls = ui.wrap('THIS GAME CONTAINS BRIEF WHITE FLASHES, SINGLE-FRAME IMAGE INSERTS, FLICKER AND SCREEN TEARING THAT MAY TRIGGER SEIZURES IN PEOPLE WITH PHOTOSENSITIVE EPILEPSY.', 46);
    ls.forEach((l, i) => ui.center(l, 50 + i * 11, COL.w));
    ui.center('HEADPHONES RECOMMENDED.', 118, COL.c);
    ui.center(`[R] REDUCE FLASHES: ${settings.reduceFlashes ? 'ON ' : 'OFF'}`, 156, settings.reduceFlashes ? COL.G : COL.w);
    if (((this.g.time * 2) | 0) % 2 === 0) ui.center('PRESS ENTER', 180, COL.W);
  }
}

// "Developing film...": renders/caches stills behind a loader.
export class Loader {
  constructor(g) { this.g = g; this.name = 'loader'; this.pausable = false; this.counts = false; this.done = 0; this.total = 1; this.last = null; }
  enter() {
    const g = this.g;
    const order = (s) => (s.id === 'title' ? -1 : s.act === 0 ? 0 : s.act === 1 ? 1 : s.act === 9 ? 2 : s.act);
    const all = [...MANIFEST].sort((a, b) => order(a) - order(b));
    const first = all.filter((s) => order(s) <= 2);
    const rest = all.filter((s) => order(s) > 2);
    this.total = first.length;
    const startT = performance.now();
    g.bank.loadMany(first, (i, n, d) => { this.done = i; this.last = d.id; }).then(() => {
      g.log.push({ loadedMs: Math.round(performance.now() - startT) });
      g.goto(new Title(g));
      // the rest develops in the background while Act I plays
      const bg = async () => { for (const d of rest) { await g.bank.load(d); await new Promise((r) => setTimeout(r, 30)); } g.bgDone = true; };
      g.bgLoad = bg();
    }).catch((e) => { console.error(e); this.err = String(e.message || e); });
  }
  draw(buf, t) {
    const ui = this.g.ui, W = this.g.display.w, H = this.g.display.h;
    buf.fill(COL.k);
    if (this.last && this.g.bank.has(this.last) && BY_ID[this.last].mode !== 'card') {
      // the newest print, dim, in a little frame
      const v = this.g.viewer; const tmp = v.b;
      v.composeStill(this.last, tmp, t, { gain: 0.6, noOsd: true });
      for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) buf[(70 + y) * W + (W / 2 - 40 + x)] = tmp[(y * 4) * W + x * 4];
      ui.frame(W / 2 - 41, 69, 82, 52, COL.b);
    }
    ui.center('DEVELOPING FILM...', 40, COL.W);
    const p = this.done / this.total;
    ui.frame(60, 140, W - 120, 8, COL.c);
    ui.rect(62, 142, Math.round((W - 124) * p), 4, COL.C);
    ui.center(`PRINT ${this.done} / ${this.total}`, 156, COL.w);
    if (this.err) ui.center(this.err.slice(0, 50), 176, COL.R);
  }
}

// Title: the van frame, palette-cycled, blinking REC, slow tape wobble.
export class Title {
  constructor(g) { this.g = g; this.name = 'title'; this.pausable = false; this.counts = false; this.sel = 0; }
  enter() {
    this.g.viewer.show('title', 'cut', { noSub: true, hold: 0 });
    this.g.viewer.tool.on = false;
    audio.setScene('title');
    audio.setItNear(0);
    this.hasSave = !!loadGame();
  }
  get items() { return [...(this.hasSave ? ['CONTINUE'] : []), 'NEW GAME', 'OPTIONS']; }
  act(i) {
    const g = this.g, it = this.items[i];
    audio.sfx('tick');
    if (it === 'CONTINUE' && g.continueGame()) g.resume();
    else if (it === 'NEW GAME') { g.newGame(); g.goto(new g.Scenes.Intro(g)); }
    else if (it === 'OPTIONS') g.overlay = new OptionsMenu(g, null);
  }
  key(code) {
    const n = this.items.length;
    if (code === 'ArrowUp') this.sel = (this.sel + n - 1) % n;
    if (code === 'ArrowDown') this.sel = (this.sel + 1) % n;
    if (code === 'Enter' || code === 'Space') this.act(this.sel);
  }
  pointerMove(x, y) { const i = Math.floor((y - 138) / 11); if (x > 206 && x < 310 && i >= 0 && i < this.items.length) this.sel = i; }
  pointerUp(x, y) { const i = Math.floor((y - 138) / 11); if (x > 206 && x < 310 && i >= 0 && i < this.items.length) this.act(i); }
  draw(buf, t) {
    const g = this.g, W = g.display.w, H = g.display.h;
    g.viewer.draw(buf, t);
    // tape wobble: slow horizontal offset bands
    const tmp = g.viewer.b;
    tmp.set(buf);
    for (let y = 0; y < H; y++) {
      const off = Math.round(Math.sin(y * 0.045 + t * 1.3) * 1.2 + (Math.sin(t * 0.37) > 0.92 ? Math.sin(y * 0.3 + t * 40) * 3 : 0));
      if (!off) continue;
      for (let x = 0; x < W; x++) buf[y * W + x] = tmp[y * W + Math.min(W - 1, Math.max(0, x - off))];
    }
    const ui = g.ui;
    ui.text('THERMAL', 18, 18, COL.W, COL.k, 3);
    ui.text('OREGON  NOV 1997', 20, 44, COL.c, COL.k);
    ui.menu(this.items, this.sel, W - 100, 140, 90);
    ui.text('HEADPHONES RECOMMENDED', W - 140, 22, COL.b, COL.k);
  }
}

// Intro (0-1 min): typed lines over black and a few stills.
const BEATS = [
  { still: null, text: 'OREGON. NOVEMBER 14, 1997.' },
  { still: 'i_road', text: 'UNCLE WALT HAD BEEN GONE ELEVEN DAYS WHEN THE COUNTY CALLED ME.' },
  { still: null, text: 'FORTY ACRES OF TIMBER. A TRAILER. A SHED. A CHEVY VAN THAT HADN\'T MOVED IN YEARS.' },
  { still: 'a1_22', text: 'I GOT THERE AT TEN TO TEN.' },
  { still: 'i_desk', text: 'HIS CARD READER WAS STILL PLUGGED IN. HIS NOTES WERE EVERYWHERE.' },
  { still: 'i_dark', text: 'THE TRAILER SMELLED LIKE HIM. COLD COFFEE AND TWO-STROKE OIL.' },
  { still: null, text: 'THE COUNTY SAID HE WALKED OFF INTO THE TIMBER. THEY NEVER LOOKED IN THE VAN.' },
  { still: null, text: 'I SHOULD HAVE LEFT THEN.' },
];
export class Intro {
  constructor(g) { this.g = g; this.name = 'intro'; this.i = -1; }
  enter() { audio.setScene('desk'); this.next(); }
  next() {
    this.i++;
    if (this.i >= BEATS.length) { this.g.state.act = 'act1'; this.g.save(); this.g.goto(new this.g.Scenes.Act1(this.g)); return; }
    const b = BEATS[this.i];
    this.t0 = this.g.time;
    if (b.still) this.g.viewer.show(b.still, 'dissolve', { noSub: true, dur: 0.6 }); else this.g.viewer.blank();
    if (b.still === 'a1_22') audio.sfx('trailclick');
  }
  typedDone() { const b = BEATS[this.i]; return (this.g.time - this.t0) * 18 > b.text.length + 4; }
  update() { if (this.typedDone() && this.g.time - this.t0 > BEATS[this.i].text.length / 18 + 4.5) this.next(); }
  key(code) { if ((code === 'Enter' || code === 'Space') && this.canSkip()) this.next(); }
  pointerUp() { if (this.canSkip()) this.next(); }
  canSkip() { return this.typedDone() && this.g.time - this.t0 > BEATS[this.i].text.length / 18 + 2.0; }
  draw(buf, t) {
    this.g.viewer.draw(buf, t);
    const b = BEATS[this.i]; if (!b) return;
    const ui = this.g.ui;
    const y = b.still ? this.g.display.h - 40 : 90;
    const lines = ui.wrap(b.text, 46);
    ui.rect(0, y - 4, this.g.display.w, lines.length * 11 + 6, b.still ? COL.k : COL.k);
    ui.typed(b.text, t - this.t0, 'center', y, 46, 18, COL.W);
  }
}
