import { Display } from './display.js';
import { Viewer } from './viewer.js';
import { UI, COL } from './ui.js';
import { Dread } from './dread.js';
import { Clock } from './clock.js';
import { newState, saveGame, loadGame, clearSave } from './save.js';
import { StillBank, MANIFEST, BY_ID } from '../render/stills.js';
import { settings, saveSettings } from '../core/settings.js';
import { clearCache } from '../core/store.js';
import { audio } from '../audio/engine.js';
import { textWidth } from '../render/font5x7.js';

export class Game {
  constructor() {
    const q = new URLSearchParams(location.search);
    this.q = q;
    const res = +(q.get('res') || settings.res);
    const [w, h] = res === 256 ? [256, 192] : [320, 200];
    this.display = new Display(w, h);
    this.ui = new UI(this.display);
    this.bank = new StillBank(w, h);
    this.viewer = new Viewer(this);
    this.dread = new Dread(this);
    this.clock = new Clock(this);
    this.state = null;
    this.time = 0;
    this.timescale = +(q.get('timescale') || 1);
    this.scene = null;
    this.lines = [];
    this.captionsList = [];
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false, sx: 0, sy: 0, dragging: false, inside: false };
    this.readout = null;
    this.overlay = null; // pause / help / options
    this.debug = q.get('debug') === '1';
    this.log = [];
    this._bindInput();
  }

  // ---------- flow ----------
  goto(scene) {
    if (this.scene?.exit) this.scene.exit();
    if (this.timers) this.timers.length = 0;
    this.viewer.osdOverride = null;
    this.scene = scene;
    this.viewer.tool.on = false;
    this.viewer.blink = false;
    this.lines = [];
    if (scene.enter) scene.enter();
    this.log.push({ t: +this.time.toFixed(2), scene: scene.name });
  }
  newGame() {
    this.state = newState(this.q.get('seed') ? +this.q.get('seed') : undefined);
    this.dread.set(0);
    saveGame(this.state);
  }
  continueGame() {
    this.state = loadGame();
    if (!this.state) return false;
    this.dread.set(this.state.dread || 0);
    return true;
  }
  save() { if (this.state) { this.state.dread = this.dread.v; saveGame(this.state); } }
  clearSave() { clearSave(); }

  say(text, secs = 3, col = COL.W) { this.lines = [{ text, until: this.time + secs, col }]; }
  caption(text, secs = 2.5) {
    if (!settings.captions) return;
    this.captionsList.push({ text, until: this.time + secs });
    if (this.captionsList.length > 2) this.captionsList.shift();
  }
  sfx(name, opts, cap) { audio.sfx(name, opts); if (cap) this.caption(cap); }

  // ---------- loop ----------
  start() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000) * this.timescale;
      last = now;
      this.step(dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  step(dt) {
    this.time += dt;
    if (this.state && !this.overlay && this.scene?.counts !== false) this.state.elapsed += dt;
    if (!this.overlay && this.scene?.update) this.scene.update(dt);
    this.viewer.updateMorph(this.time);
    if (!this.overlay) this.dread.update(dt, this.scene?.dreadCtx ? this.scene.dreadCtx() : {});
    this.draw();
  }
  draw() {
    const buf = this.display.buf;
    if (this.scene?.draw) this.scene.draw(buf, this.time);
    else this.viewer.draw(buf, this.time);
    this.drawLines();
    if (this.debugHook) this.debugHook(buf, this.time);
    if (this.overlay) this.overlay.draw(buf, this.time);
    this.display.present();
  }
  drawLines() {
    const { ui, display } = this;
    const t = this.time;
    this.lines = this.lines.filter((l) => l.until > t);
    for (const l of this.lines) {
      const ls = ui.wrap(l.text, Math.floor(display.w / 6) - 4);
      ls.forEach((s, i) => { const y = display.h - 24 - (ls.length - 1 - i) * 10; ui.rect(((display.w - textWidth(s)) / 2 | 0) - 3, y - 2, textWidth(s) + 6, 11, COL.k); ui.center(s, y, l.col, null); });
    }
    this.captionsList = this.captionsList.filter((c) => c.until > t);
    this.captionsList.forEach((c, i) => { const y = 14 + i * 10; ui.rect(((display.w - textWidth(c.text)) / 2 | 0) - 3, y - 2, textWidth(c.text) + 6, 11, COL.k); ui.center(c.text, y, COL.Y, null); });
  }

  // ---------- input ----------
  _bindInput() {
    const cv = this.display.canvas;
    const gesture = () => { audio.init(); audio.setVolume(settings.volume); audio.setMuted(settings.muted); };
    window.addEventListener('keydown', (e) => {
      gesture();
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
      const rep = e.repeat;
      this.keys.add(e.code);
      if (this.overlay) { this.overlay.key?.(e.code, e.key, rep); return; }
      if (!rep && (e.code === 'Escape' || e.code === 'KeyP') && this.scene?.pausable !== false) { this.openPause(); return; }
      if (!rep && e.code === 'KeyH' && this.scene?.pausable !== false) { this.overlay = new Help(this); return; }
      this.scene?.key?.(e.code, e.key, rep);
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); if (!this.overlay) this.scene?.keyUp?.(e.code); });
    window.addEventListener('blur', () => { for (const k of [...this.keys]) this.scene?.keyUp?.(k); this.keys.clear(); });
    const pos = (e) => this.display.toInternal(e.clientX, e.clientY);
    cv.addEventListener('pointerdown', (e) => {
      gesture();
      cv.setPointerCapture?.(e.pointerId);
      const p = pos(e);
      Object.assign(this.mouse, { x: p.x, y: p.y, sx: p.x, sy: p.y, down: true, dragging: false, t0: this.time, type: e.pointerType });
      if (this.overlay) { this.overlay.click?.(p.x, p.y); return; }
      this.scene?.pointerDown?.(p.x, p.y, e);
    });
    cv.addEventListener('pointermove', (e) => {
      const p = pos(e);
      this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.inside = true;
      if (this.mouse.down && Math.hypot(p.x - this.mouse.sx, p.y - this.mouse.sy) > 5) this.mouse.dragging = true;
      if (this.overlay) { this.overlay.hover?.(p.x, p.y); return; }
      this.scene?.pointerMove?.(p.x, p.y);
    });
    cv.addEventListener('pointerup', (e) => {
      const p = pos(e);
      const wasDrag = this.mouse.dragging;
      this.mouse.down = false; this.mouse.dragging = false;
      if (this.overlay) return;
      this.scene?.pointerUp?.(p.x, p.y, wasDrag, e);
    });
    cv.addEventListener('pointerleave', () => { this.mouse.inside = false; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); if (!this.overlay) this.scene?.wheel?.(e.deltaY < 0 ? 1 : -1, this.mouse.x, this.mouse.y); }, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    // pinch to zoom
    let pinch = null;
    cv.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    cv.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinch) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (Math.abs(d - pinch) > 40) { const mid = this.display.toInternal((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2); this.scene?.wheel?.(d > pinch ? 1 : -1, mid.x, mid.y); pinch = d; }
      }
    }, { passive: true });
    cv.addEventListener('touchend', () => { pinch = null; }, { passive: true });
  }
  held(code) { return this.keys.has(code); }
  openPause() { this.overlay = new Pause(this); audio.sfx('tick'); }
}

// ---------- overlays ----------
export class OptionsMenu {
  constructor(game, back) { this.g = game; this.back = back; this.sel = 0; }
  items() {
    const s = settings;
    const bar = '#'.repeat(Math.round(s.volume * 10)).padEnd(10, '.');
    return [
      `VOLUME   [${bar}]`, `MUTE           ${s.muted ? 'ON' : 'OFF'}`, `REDUCE FLASHES ${s.reduceFlashes ? 'ON' : 'OFF'}`,
      `SUBTITLES      ${s.captions ? 'ON' : 'OFF'}`, `HARD MODE      ${s.hardMode ? 'ON' : 'OFF'}`, `BAND PATTERNS  ${s.patterns ? 'ON' : 'OFF'}`,
      `RESOLUTION ${s.res === 256 ? '256X192' : '320X200'}`, 'RE-DEVELOP FILM (CLEAR CACHE)', 'BACK',
    ];
  }
  act(i, dir = 1) {
    const s = settings;
    switch (i) {
      case 0: s.volume = Math.max(0, Math.min(1, Math.round((s.volume + dir * 0.1) * 10) / 10)); audio.setVolume(s.volume); break;
      case 1: s.muted = !s.muted; audio.setMuted(s.muted); break;
      case 2: s.reduceFlashes = !s.reduceFlashes; break;
      case 3: s.captions = !s.captions; break;
      case 4: s.hardMode = !s.hardMode; break;
      case 5: s.patterns = !s.patterns; break;
      case 6: s.res = s.res === 256 ? 320 : 256; saveSettings(); this.g.say('RESOLUTION APPLIES ON RELOAD.', 3); break;
      case 7: clearCache(); this.g.say('CACHE CLEARED. FILM RE-DEVELOPS ON RELOAD.', 3); break;
      case 8: saveSettings(); this.g.overlay = this.back; return;
      default: break;
    }
    saveSettings();
    audio.sfx('tick');
  }
  key(code) {
    const n = this.items().length;
    if (code === 'ArrowUp') this.sel = (this.sel + n - 1) % n;
    else if (code === 'ArrowDown') this.sel = (this.sel + 1) % n;
    else if (code === 'ArrowLeft') this.act(this.sel, -1);
    else if (code === 'ArrowRight' || code === 'Enter' || code === 'Space') this.act(this.sel, 1);
    else if (code === 'Escape') { saveSettings(); this.g.overlay = this.back; }
  }
  layout() { const items = this.items(); return { x: 60, y: 40, w: 200, items }; }
  hover(x, y) { const L = this.layout(); const i = Math.floor((y - L.y + 2) / 11); if (x > L.x - 4 && x < L.x + L.w && i >= 0 && i < L.items.length) this.sel = i; }
  click(x, y) { this.hover(x, y); const L = this.layout(); const i = Math.floor((y - L.y + 2) / 11); if (i >= 0 && i < L.items.length && x > L.x - 4 && x < L.x + L.w) this.act(i, x > L.x + L.w / 2 ? 1 : -1); }
  draw(buf, t) {
    const ui = this.g.ui; const L = this.layout();
    ui.rect(0, 0, this.g.display.w, this.g.display.h, COL.k);
    ui.center('OPTIONS', 20, COL.C);
    ui.menu(L.items, this.sel, L.x, L.y, L.w);
    ui.center('←/→ CHANGE   ENTER SELECT   ESC BACK', this.g.display.h - 14, COL.b);
  }
}

export class Pause {
  constructor(game) { this.g = game; this.sel = 0; }
  get items() { return ['RESUME', 'CONTROLS', 'OPTIONS', 'QUIT TO TITLE']; }
  act(i) {
    const g = this.g;
    if (i === 0) g.overlay = null;
    if (i === 1) g.overlay = new Help(g, this);
    if (i === 2) g.overlay = new OptionsMenu(g, this);
    if (i === 3) { g.save(); g.overlay = null; g.goto(new g.Scenes.Title(g)); }
    audio.sfx('tick');
  }
  key(code) {
    if (code === 'ArrowUp') this.sel = (this.sel + 3) % 4;
    else if (code === 'ArrowDown') this.sel = (this.sel + 1) % 4;
    else if (code === 'Enter' || code === 'Space') this.act(this.sel);
    else if (code === 'Escape' || code === 'KeyP') this.g.overlay = null;
  }
  hover(x, y) { const i = Math.floor((y - 78) / 11); if (i >= 0 && i < 4) this.sel = i; }
  click(x, y) { const i = Math.floor((y - 78) / 11); if (i >= 0 && i < 4) this.act(i); }
  draw() {
    const ui = this.g.ui;
    ui.center('PAUSED', 60, COL.C, COL.k);
    ui.menu(this.items, this.sel, 120, 80, 80);
  }
}

export class Help {
  constructor(game, back = null) { this.g = game; this.back = back; }
  key() { this.g.overlay = this.back; }
  click() { this.g.overlay = this.back; }
  draw() {
    const ui = this.g.ui, W = this.g.display.w, H = this.g.display.h;
    ui.rect(0, 0, W, H, COL.k);
    const L = [
      ['CONTROLS', COL.C],
      ['←/→  CLICK EDGES   PREV / NEXT FRAME', COL.w],
      ['HOLD SPACE         BLINK: COMPARE WITH PREVIOUS', COL.w],
      ['T  ↑/↓  [ ]        THERMAL THRESHOLD TOOL', COL.w],
      ['WHEEL / PINCH      ZOOM (RE-EXPOSE REGION)', COL.w],
      ['CLICK + DRAG       CIRCLE AN ANOMALY', COL.w],
      ['B  C               EVIDENCE BOARD / INDEX CARDS', COL.w],
      ['', COL.w],
      ['OUTSIDE', COL.C],
      ['ARROWS             CHOOSE A DIRECTION', COL.w],
      ['HOLD ENTER/F/MOUSE CHARGE FLASH, RELEASE: SHOOT', COL.w],
      ['TAB                HANDHELD THERMAL (BATTERY)', COL.w],
      ['E  M               RESET CAMERA / WALT\'S MAP', COL.w],
      ['', COL.w],
      ['ESC PAUSE    H THIS SCREEN', COL.b],
    ];
    L.forEach(([s, c], i) => ui.text(s, 14, 16 + i * 11, c, null));
  }
}

export { COL, BY_ID, MANIFEST };
