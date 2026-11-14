import { COL } from '../game.js';
import { MANIFEST, BY_ID } from '../../render/stills.js';
import { BOARD_SLOTS } from '../../render/cards.js';
import { settings } from '../../core/settings.js';
import { audio } from '../../audio/engine.js';
import { textWidth } from '../../render/font5x7.js';
import { StillControls } from './controls.js';

export const REEL = MANIFEST.filter((s) => s.reel).map((s) => s.id);
export const CARDS = ['card_warm', 'card_flash', 'card_van', 'card_pin', 'card_moves', 'card_copy', 'card_cold'];
export const PIN = '1103';
export const READ_TIME = 5.5; // seconds to pull one file off the card (USB 1.1, 1997)
const SLOT_NAMES = Object.fromEntries(BOARD_SLOTS.map((s) => [s.slot, s.label]));

// ACT I — "The Card": Walt's trail-cam captures at the desk.
export class Act1 {
  constructor(g) { this.g = g; this.name = 'act1'; this.mode = 'reel'; this.cardIdx = 0; this.pin = ''; this.ctl = new StillControls(g, this); this.queue = []; }
  get st() { return this.g.state; }
  enter() {
    audio.setScene('desk');
    const st = this.st;
    st.reelIdx = Math.min(st.reelIdx || 0, REEL.length - 1);
    this.showFrame(st.reelIdx, 'dissolve');
    if (!st.hintShown) { this.g.say('←/→ FRAMES · SPACE BLINK · T THERMAL · DRAG TO CIRCLE · B BOARD · C CARDS · H HELP', 7, COL.C); st.hintShown = true; }
    if (Object.keys(st.evidence).length >= 6 && !st.act1Done) this.finale();
  }
  dreadCtx() { return { deciding: false }; }
  frameDef(i) { return BY_ID[REEL[i]]; }

  showFrame(i, type = 'cut') {
    const st = this.st, g = this.g;
    st.reelIdx = i;
    const id = REEL[i];
    g.viewer.show(id, type, { dur: type === 'dissolve' ? 0.6 : 0.45, hold: 0.4 });
    g.viewer.prev = i > 0 ? REEL[i - 1] : null;
    g.viewer.tool.on = this.ctl.toolOn;
    // high dread: some frames change while you look at them
    const def = BY_ID[id];
    if (def.alt && g.dread.shouldMorph() && g.bank.has(def.alt)) g.viewer.startMorph(def.alt);
  }

  step(dir) {
    const st = this.st, g = this.g;
    if (this.busy || !g.viewer.ready()) return;
    const ni = st.reelIdx + dir;
    if (ni < 0 || ni >= REEL.length) { if (ni >= REEL.length) g.say('END OF CARD.', 2); return; }
    const def = this.frameDef(ni);
    if (def.locked && !st.pinOK) { this.mode = 'pin'; this.pin = ''; audio.sfx('beep'); return; }
    if (ni > st.readIdx) {
      // the 1997 card reader is slow: every new file is read off the card
      st.readIdx = ni;
      this.readFile(ni, () => { if (def.burst === '1/3') this.playBurst(ni); else g.save(); });
      return;
    }
    this.showFrame(ni, dir > 0 ? 'cut' : 'cut');
  }

  // The reader pulls the file off the card: pixels resolve like a slow sensor read.
  readFile(i, then) {
    const g = this.g;
    this.busy = true;
    this.reading = { i, t0: g.time };
    audio.sfx('read');
    const tick = setInterval(() => { if (!this.reading) clearInterval(tick); else audio.sfx('read', { gain: 0.5 }); }, 1400);
    g.viewer.show(REEL[i], 'fade', { dur: READ_TIME, hold: READ_TIME });
    this.st.reelIdx = i; g.viewer.prev = i > 0 ? REEL[i - 1] : null; g.viewer.tool.on = this.ctl.toolOn;
    setTimeoutGame(g, READ_TIME, () => { this.reading = null; clearInterval(tick); audio.sfx('beep', { gain: 0.3 }); this.busy = false; then && then(); });
  }

  // Trail-cam burst: three stills, one second apart, with the mechanical click.
  playBurst(i) {
    const g = this.g;
    this.busy = true;
    const ids = [i + 1, i + 2];
    ids.forEach((k, n) => setTimeoutGame(g, 1.0 + n * 1.0, () => { audio.sfx('trailclick'); this.st.readIdx = Math.max(this.st.readIdx, k); this.showFrame(k, 'cut'); }));
    setTimeoutGame(g, 3.0, () => { this.busy = false; g.save(); });
  }

  key(code, k, rep) {
    const g = this.g;
    if (this.busy) return;
    if (this.mode === 'pin') return this.pinKey(code, k);
    if (this.mode === 'board') { if (['KeyB', 'Escape', 'Enter'].includes(code)) this.closeOverlayMode(); return; }
    if (this.mode === 'cards') {
      if (code === 'ArrowRight') this.showCard(this.cardIdx + 1);
      else if (code === 'ArrowLeft') this.showCard(this.cardIdx - 1);
      else if (['KeyC', 'Escape'].includes(code)) this.closeOverlayMode();
      else this.ctl.key(code, rep);
      return;
    }
    if (code === 'ArrowRight' || code === 'KeyD') this.step(1);
    else if (code === 'ArrowLeft' || code === 'KeyA') this.step(-1);
    else if (code === 'KeyB') this.openBoard();
    else if (code === 'KeyC') this.openCards();
    else this.ctl.key(code, rep);
  }
  keyUp(code) { this.ctl.keyUp(code); }
  wheel(d, x, y) { if (this.mode === 'reel') this.ctl.wheel(d, x, y); }
  pointerDown(x, y) { if (this.mode === 'reel' || this.mode === 'cards') this.ctl.pointerDown(x, y); }
  pointerMove(x, y) { this.ctl.pointerMove(x, y); }
  pointerUp(x, y, drag) {
    if (this.busy) return;
    const W = this.g.display.w;
    if (this.mode === 'pin') return this.pinClick(x, y);
    if (this.mode === 'board') return this.closeOverlayMode();
    if (this.ctl.pointerUp(x, y, drag)) return;
    if (drag) return;
    if (this.mode === 'cards') { if (x < W * 0.15) this.showCard(this.cardIdx - 1); else if (x > W * 0.85) this.showCard(this.cardIdx + 1); else if (y < 14) this.closeOverlayMode(); return; }
    if (x < W * 0.12) this.step(-1); else if (x > W * 0.88) this.step(1);
    else if (y < 12 && x < 60) this.openBoard();
    else if (y < 12 && x > W - 60) this.openCards();
  }

  // ---- evidence ----
  circled(x0, y0, x1, y1) {
    const g = this.g, st = this.st;
    if (this.mode !== 'reel') return;
    const def = g.viewer.def;
    const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (rx * ry * Math.PI > g.display.w * g.display.h * 0.35) { g.say('TOO BIG. CIRCLE ONE THING.', 2); return; }
    const inside = (h) => { const hx = h.x + h.w / 2, hy = h.y + h.h / 2; return ((hx - cx) / Math.max(rx, 2)) ** 2 + ((hy - cy) / Math.max(ry, 2)) ** 2 <= 1.15; };
    const hs = g.viewer.hotspotsNow().filter(inside);
    const an = def.anomaly;
    const hit = an && hs.find((h) => h.tag === an.tag);
    if (hit) {
      if (an.need === 'threshold' && !g.viewer.tool.on) { g.say('NOTHING THERE... AT THIS SETTING.', 2.5); g.dread.add(0.02); return; }
      if (st.evidence[an.slot]) { g.say('ALREADY ON THE BOARD.', 2); return; }
      st.evidence[an.slot] = { id: def.id, x: hit.x, y: hit.y, w: hit.w, h: hit.h, tool: g.viewer.tool.on ? g.viewer.tool.level : null, zoom: g.viewer.zoom ? g.viewer.zoom.rect : null };
      audio.sfx('knock', { gain: 0.5 });
      g.dread.add(0.06);
      const n = Object.keys(st.evidence).length;
      g.say(`PINNED: ${SLOT_NAMES[an.slot]}  (${n}/6)`, 3, COL.Y);
      g.save();
      if (n >= 6) setTimeoutGame(g, 2.5, () => this.finale());
      return;
    }
    if (def.decoy && hs.find((h) => h.tag === def.decoy.tag)) { g.say(def.decoy.msg, 2.5); return; }
    if (hs.find((h) => h.tag === 'it' || h.tag === 'edit' || h.tag === 'hidden')) { g.say('WALT DIDN\'T PIN THIS ONE. THERE\'S NO SLOT FOR IT.', 3); g.dread.add(0.02); return; }
    g.say(hs.length ? 'JUST AN ANIMAL. OR A SHAPE.' : 'NOTHING THERE.', 2);
    g.dread.add(0.01);
  }

  // ---- cards ----
  openCards() { this.mode = 'cards'; this.prevTool = this.ctl.toolOn; this.showCard(this.cardIdx); audio.sfx('tick'); }
  showCard(i) {
    this.cardIdx = (i + CARDS.length) % CARDS.length;
    const id = CARDS[this.cardIdx];
    if (!this.g.bank.has(id)) return;
    this.g.viewer.show(id, 'cut', { noSub: true, hold: 0.25 });
    this.g.viewer.tool.on = this.ctl.toolOn;
    if (!this.st.cardsSeen.includes(id)) this.st.cardsSeen.push(id);
  }
  openBoard() { this.mode = 'board'; this.g.viewer.show('board', 'cut', { noSub: true, hold: 0.2 }); this.g.viewer.tool.on = false; audio.sfx('tick'); }
  closeOverlayMode() { this.mode = 'reel'; this.showFrame(this.st.reelIdx, 'cut'); }

  // ---- PIN ----
  pinKey(code, k) {
    if (/^Digit\d$|^Numpad\d$/.test(code)) this.pinDigit(code.slice(-1));
    else if (code === 'Backspace') this.pin = this.pin.slice(0, -1);
    else if (code === 'Escape') { this.mode = 'reel'; this.showFrame(this.st.reelIdx); }
  }
  pinDigit(d) {
    const g = this.g;
    this.pin += d; audio.sfx('tick');
    if (this.pin.length < 4) return;
    if (this.pin === PIN) {
      this.st.pinOK = true; this.mode = 'reel'; audio.sfx('beep'); g.say('CAM 3 FOLDER UNLOCKED.', 2, COL.G);
      this.step(1);
    } else { g.say('WRONG PIN.', 2, COL.R); this.pin = ''; audio.sfx('battery'); g.dread.add(0.01); }
  }
  pinClick(x, y) {
    const W = this.g.display.w;
    // keypad row
    for (let d = 0; d < 10; d++) { const kx = W / 2 - 100 + d * 20; if (x >= kx && x < kx + 18 && y >= 120 && y < 136) return this.pinDigit(String(d)); }
    if (y > 150) { this.mode = 'reel'; this.showFrame(this.st.reelIdx); }
  }

  // ---- Act I finale: live feed, silence, the first jump-scare, power dies ----
  finale() {
    if (this.busy) return;
    const g = this.g;
    this.busy = true; this.mode = 'reel';
    this.ctl.toolOn = false; g.viewer.tool.on = false;
    const T = (s, f) => setTimeoutGame(g, s, f);
    g.say('THAT\'S ALL OF THEM.', 2.5);
    T(2.5, () => { audio.sfx('beep'); T(0.25, () => audio.sfx('beep')); g.say('NEW FILE: CAM 2 · LIVE', 3, COL.Y); });
    T(4.0, () => { audio.sfx('read'); g.viewer.show('a1_live', 'dissolve', { dur: 0.9, noSub: true }); g.dread.add(0.15); });
    T(6.5, () => g.say('THAT\'S THE TRAILER. THAT\'S ME AT THE DESK.', 3.2));
    T(10.0, () => { g.lines = []; audio.silence(1200); g.viewer.osdOverride = false; });
    T(11.2, () => { g.viewer.osdOverride = null; audio.sfx('stinger'); g.viewer.show('a1_face', 'cut', { noSub: true }); g.dread.add(0.3); });
    T(11.9, () => { g.viewer.blank(); audio.sfx('powerdown'); g.caption('[the hum dies]'); audio.setScene('silent'); });
    T(14.0, () => { g.viewer.show('i_dark', 'fade', { noSub: true }); g.say('THE POWER WENT OUT.', 3); });
    T(17.5, () => { g.viewer.blank(); g.say('THE CAMERAS WOULD HAVE TO BE RESET BY HAND.', 3.5); });
    T(21.5, () => g.say('I TOOK WALT\'S DISPOSABLE. 27 EXPOSURES. AND HIS THERMAL MONITOR.', 4));
    T(26.0, () => {
      const st = this.st; st.act1Done = true; st.act = 'act2'; g.save();
      this.busy = false;
      g.goto(new g.Scenes.Act2(g));
    });
  }

  update(dt) { this.ctl.update(dt); }

  draw(buf, t) {
    const g = this.g, ui = g.ui, W = g.display.w, H = g.display.h;
    if (this.mode === 'pin') {
      buf.fill(COL.k);
      ui.center('CAM3 FOLDER LOCKED', 60, COL.Y);
      ui.center('ENTER PIN', 80, COL.w);
      ui.center(this.pin.padEnd(4, '_').split('').join(' '), 98, COL.W, COL.k, 2);
      for (let d = 0; d < 10; d++) { const kx = W / 2 - 100 + d * 20; ui.frame(kx, 120, 18, 16, COL.c); ui.text(String(d), kx + 6, 124, COL.w, null); }
      ui.center('ESC: BACK', 160, COL.b);
      return;
    }
    g.viewer.draw(buf, t);
    if (this.mode === 'board') return this.drawBoard(buf, t);
    this.ctl.drawOverlay(buf, t);
    if (this.reading) {
      const p = Math.min(1, (t - this.reading.t0) / READ_TIME);
      ui.rect(W / 2 - 62, 4, 124, 18, COL.k);
      ui.text(`READING FILE ${String(this.reading.i + 1).padStart(2, '0')}...`, W / 2 - 58, 5, COL.w, null);
      ui.frame(W / 2 - 58, 14, 116, 5, COL.c); ui.rect(W / 2 - 57, 15, Math.round(114 * p), 3, COL.C);
    }
    if (this.mode === 'reel' && !this.busy) {
      const n = Object.keys(this.st.evidence).length;
      ui.text(`FILE ${String(this.st.reelIdx + 1).padStart(2, '0')}/${REEL.length}`, W - 66, 3, COL.w, COL.k);
      ui.text(`B BOARD ${n}/6`, 3, 3, n ? COL.Y : COL.w, COL.k);
    }
    if (this.mode === 'cards') ui.text(`CARD ${this.cardIdx + 1}/${CARDS.length}  C: BACK`, 3, 3, COL.w, COL.k);
  }

  drawBoard(buf, t) {
    const g = this.g, ui = g.ui, W = g.display.w;
    const tmp = g.viewer.a;
    for (const s of BOARD_SLOTS) {
      const e = this.st.evidence[s.slot];
      if (!e || !g.bank.has(e.id)) continue;
      // crop the pinned region from the still (as it looked when circled)
      const def = BY_ID[e.id];
      g.viewer.composeStill(e.id, tmp, t, { noOsd: true, noScan: true, lut: def.lut });
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      const cw = Math.max(44, e.w * 2.2), ch = cw * (s.h / s.w);
      const sx0 = Math.max(0, Math.min(W - cw, cx - cw / 2)), sy0 = Math.max(0, Math.min(g.display.h - ch, cy - ch / 2));
      for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
        const sx = (sx0 + (x / s.w) * cw) | 0, sy = (sy0 + (y / s.h) * ch) | 0;
        buf[(s.y + y) * W + s.x + x] = tmp[sy * W + sx];
      }
      ui.frame(s.x - 1, s.y - 1, s.w + 2, s.h + 2, COL.w);
      ui.rect(s.x + s.w / 2 - 1, s.y - 2, 3, 3, COL.R);
    }
    ui.text('B / ESC: BACK', 3, g.display.h - 9, COL.w, COL.k);
  }
}

// Game-clock timers (respect pause and timescale).
export function setTimeoutGame(g, secs, fn) {
  if (!g.timers) {
    g.timers = [];
    const orig = g.step.bind(g);
    g.step = (dt) => {
      orig(dt);
      if (g.overlay) { for (const tm of g.timers) tm.at += dt; return; }
      const now = g.time;
      const due = g.timers.filter((tm) => tm.at <= now);
      g.timers = g.timers.filter((tm) => tm.at > now);
      for (const tm of due) tm.fn();
    };
  }
  g.timers.push({ at: g.time + secs, fn });
}
