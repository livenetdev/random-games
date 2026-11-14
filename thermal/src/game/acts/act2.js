import { COL } from '../game.js';
import { NODES, CAM_NODES, shortestPath } from '../../data/nodes.js';
import { mapLayout } from '../../render/cards.js';
import { audio } from '../../audio/engine.js';
import { setTimeoutGame, PIN } from './act1.js';
import { StillControls } from './controls.js';
import { textWidth } from '../../render/font5x7.js';

const DIRS = { ArrowUp: 'up', ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', KeyW: 'up', KeyA: 'left', KeyD: 'right', KeyS: 'down' };
const ARROW = { up: '↑', left: '←', right: '→', down: '↓' };
export const WALK_TIME = 5.5;   // ~50 m of dark trail between places
export const FLASH_READY = 1.5; // the disposable's flash takes this long to recycle
const CAMNAME = { cam1: 'CAM 1', cam2: 'CAM 2', cam3: 'CAM 3' };

// ACT II — "Flash": the power is out. Movement is taking photos.
export class Act2 {
  constructor(g) { this.g = g; this.name = 'act2'; this.mode = 'dark'; this.sel = null; this.charge = 0; this.charging = false; this.ctl = new StillControls(g, this); this.pin = ''; }
  get st() { return this.g.state; }
  get node() { return NODES[this.st.node]; }
  enter() {
    const g = this.g;
    audio.setScene('outdoor');
    g.viewer.blank();
    this.mode = 'dark';
    this.updateNear();
    if (!this.st.act2Intro) {
      this.st.act2Intro = true;
      g.say('ARROWS: CHOOSE A WAY. HOLD ENTER (OR MOUSE) TO CHARGE THE FLASH, RELEASE TO GO.', 6, COL.C);
      setTimeoutGame(g, 6.5, () => g.say('TAB: THERMAL MONITOR. M: WALT\'S MAP. THREE CAMERAS TO RESET.', 5, COL.C));
    }
    g.save();
  }
  exits() {
    const ex = { ...this.node.exits };
    if (this.st.node === 'drive' && !this.allReset()) delete ex.up;
    return ex;
  }
  allReset() { return ['cam1', 'cam2', 'cam3'].every((c) => this.st.resets[c]); }
  itDist() { const p = shortestPath(this.st.itNode, this.st.node); return p ? p.length - 1 : 9; }
  updateNear() {
    const d = this.itDist();
    const near = d === 0 ? 1 : d === 1 ? 0.6 : d === 2 ? 0.2 : 0;
    this.near = near;
    audio.setItNear(near);
    if (d <= 1 && !this.cricketsGone) { this.cricketsGone = true; this.g.caption('[the crickets stop]'); }
    if (d > 2) this.cricketsGone = false;
  }
  dreadCtx() { return { itNear: this.near || 0, deciding: this.mode === 'dark' && !this.busy }; }

  // ---- input ----
  key(code, k, rep) {
    const g = this.g;
    if (this.busy) return;
    if (this.mode === 'pin') return this.pinKey(code);
    if (this.mode === 'map') { if (['KeyM', 'Escape', 'Enter'].includes(code)) this.mode = 'dark'; return; }
    if (this.mode === 'thermal') {
      if (code === 'Tab') return this.toggleThermal();
      this.ctl.key(code, rep);
      if (DIRS[code] && !this.ctl.toolOn) { this.toggleThermal(); this.choose(DIRS[code]); }
      return;
    }
    if (DIRS[code]) return this.choose(DIRS[code]);
    if ((code === 'Enter' || code === 'KeyF' || code === 'Space') && !rep) return this.startCharge();
    if (code === 'Tab') return this.toggleThermal();
    if (code === 'KeyM') { this.mode = 'map'; audio.sfx('tick'); return; }
    if (code === 'KeyE') return this.resetCam();
  }
  keyUp(code) {
    this.ctl.keyUp(code);
    if ((code === 'Enter' || code === 'KeyF' || code === 'Space') && this.charging) this.release();
  }
  wheel(d, x, y) { if (this.mode === 'thermal') this.ctl.wheel(d, x, y); }
  pointerDown(x, y) {
    if (this.busy) return;
    if (this.mode === 'thermal') { this.ctl.pointerDown(x, y); return; }
    if (this.mode !== 'dark') return;
    const hit = this.exitAt(x, y);
    if (hit) this.sel = hit;
    if (this.sel || hit) this.startCharge();
  }
  pointerMove(x, y) { this.ctl.pointerMove(x, y); }
  pointerUp(x, y, drag) {
    if (this.busy) return;
    if (this.mode === 'pin') return this.pinClick(x, y);
    if (this.mode === 'map') { this.mode = 'dark'; return; }
    if (this.mode === 'thermal') { if (!this.ctl.pointerUp(x, y, drag) && !drag && y < 14) this.toggleThermal(); return; }
    if (this.charging) { this.release(); return; }
    const W = this.g.display.w, H = this.g.display.h;
    if (y > H - 14 && x < 70) return this.toggleThermal();
    if (y > H - 14 && x > W - 50) { this.mode = 'map'; return; }
    if (this.camHere() && y > H - 34 && y < H - 18) return this.resetCam();
  }
  exitLayout() {
    const W = this.g.display.w, H = this.g.display.h, ex = this.exits(), out = {};
    for (const [dir, to] of Object.entries(ex)) {
      const s = `${ARROW[dir]} ${NODES[to].label}`;
      const w = textWidth(s);
      const p = dir === 'up' ? [(W - w) / 2, 30] : dir === 'down' ? [(W - w) / 2, H - 48] : dir === 'left' ? [8, H / 2 - 4] : [W - w - 8, H / 2 - 4];
      out[dir] = { s, x: p[0] | 0, y: p[1] | 0, w, to };
    }
    return out;
  }
  exitAt(x, y) { for (const [d, e] of Object.entries(this.exitLayout())) if (x >= e.x - 4 && x <= e.x + e.w + 4 && y >= e.y - 4 && y <= e.y + 11) return d; return null; }
  choose(dir) {
    if (!this.exits()[dir]) { this.g.say('NO WAY THROUGH THERE.', 1.2); return; }
    if (this.sel === dir) return this.startCharge();
    this.sel = dir; audio.sfx('tick', { gain: 0.4 });
  }

  // ---- flash movement ----
  startCharge() {
    if (this.mode !== 'dark' || this.busy) return;
    if (this.st.film <= 0) { this.g.say('NO EXPOSURES LEFT.', 2); return; }
    this.charging = true; this.charge = 0; this.chargeT0 = this.g.time;
    audio.chargeStart();
  }
  release() {
    this.charging = false;
    audio.chargeStop();
    const held = this.g.time - this.chargeT0;
    const charge = Math.min(1, held / 3.5);
    if (held < FLASH_READY) { this.g.say('THE FLASH ISN\'T READY. HOLD UNTIL THE WHINE PEAKS.', 2); return; }
    this.shoot(charge, this.sel);
  }
  shoot(charge, dir) {
    const g = this.g, st = this.st;
    this.busy = true;
    const to = dir ? this.exits()[dir] : null;
    st.film -= 1;
    audio.sfx('wind');
    const walk = to ? WALK_TIME : 0.3;
    if (to) {
      audio.sfx('walk', { surface: NODES[to].surface || 'leaves' });
      setTimeoutGame(this.g, 2.3, () => audio.sfx('walk', { surface: NODES[to].surface || 'leaves' }));
      if (this.itDist() <= 2 && g.rand() < 0.6) { audio.echoStep(NODES[to].surface || 'leaves', 2100); g.caption('[footsteps behind you]', 3); }
    }
    setTimeoutGame(g, walk, () => {
      if (to) { st.node = to; if (!st.visited.includes(to)) st.visited.push(to); }
      // it moves only between pictures you have seen
      this.moveIt(charge);
      const encounter = st.itNode === st.node;
      audio.sfx('shutter', { flash: true });
      this.sel = null;
      if (st.node === 'van') { this.toAct3(); return; }
      g.viewer.show(`n_${st.node}_f`, 'flash', { gain: 1 + charge * 1.3, noSub: false });
      g.dread.add(encounter ? 0.25 : 0.02);
      const hold = 1.1 + charge * 0.9;
      setTimeoutGame(g, hold, () => {
        g.viewer.startAfterimage(); g.viewer.blank();
        this.updateNear();
        // the afterimage burns for 1.5 s: you can't see anything else
        setTimeoutGame(g, 1.5, () => { if (encounter) this.encounter(); else this.afterShot(); });
      });
    });
  }
  afterShot() {
    const g = this.g, st = this.st;
    this.busy = false;
    g.save();
    if (this.camHere()) g.say(`${CAMNAME[this.camHere()]} IS HERE.  [E] RESET IT`, 3, COL.C);
    if (st.film <= 0 && st.node !== 'van') setTimeoutGame(g, 1.5, () => this.exposureEnd());
    else if (st.film <= 3) g.say(`${st.film} EXPOSURES LEFT.`, 2.5, COL.R);
  }
  encounter() {
    // soft failure: it was right here, in the dark. The camera winds itself on.
    const g = this.g, st = this.st;
    audio.sfx('breath'); g.caption('[breathing, close]', 3);
    setTimeoutGame(g, 1.6, () => {
      const lost = Math.min(2, st.film);
      st.film -= lost;
      if (lost) { audio.sfx('wind'); setTimeoutGame(g, 0.5, () => audio.sfx('wind')); g.caption('[the film advances by itself]', 3); }
      st.battery = Math.max(0, st.battery - 10);
      // then it is somewhere else
      const far = Object.keys(NODES).filter((n) => n !== 'van' && n !== 'drive' && (shortestPath(n, st.node)?.length || 0) >= 4);
      st.itNode = far[Math.floor(g.rand() * far.length)] || 'powerline';
      this.updateNear();
      setTimeoutGame(g, 1.4, () => this.afterShot());
    });
  }
  moveIt(charge) {
    const st = this.st;
    const p = 0.4 + 0.35 * charge + 0.15 * this.g.dread.v;
    if (this.g.rand() < p) {
      const path = shortestPath(st.itNode, st.node, (a, b) => b === 'van');
      if (path && path.length > 1) st.itNode = path[1];
    } else if (this.g.rand() < 0.5) {
      const ex = Object.values(NODES[st.itNode].exits).filter((n) => n !== 'van');
      st.itNode = ex[Math.floor(this.g.rand() * ex.length)] || st.itNode;
    }
    // never on the start node before the first reset; never shadows the camera you need
    if (st.itNode === 'van') st.itNode = 'gate';
  }

  // ---- handheld thermal ----
  toggleThermal() {
    const g = this.g, st = this.st;
    if (this.mode === 'thermal') { this.mode = 'dark'; g.viewer.blank(); this.ctl.toolOn = false; g.viewer.tool.on = false; audio.sfx('tick'); return; }
    if (this.mode !== 'dark' || this.charging) return;
    if (st.battery <= 0) { g.say('THE MONITOR IS DEAD.', 2); audio.sfx('battery'); return; }
    st.battery = Math.max(0, st.battery - 3);
    this.mode = 'thermal';
    const id = `n_${st.node}_${st.itNode === st.node ? 'i' : 't'}`;
    g.viewer.show(id, 'dissolve', { dur: 0.35, hold: 0.2 });
    g.viewer.prev = `n_${st.node}_f`;
    audio.sfx('static', { gain: 0.3 });
    if (st.itNode === st.node) g.dread.add(0.12);
  }

  // ---- cameras ----
  camHere() { const c = this.node.cam; return c && !this.st.resets[c] ? c : null; }
  resetCam() {
    const c = this.camHere(); if (!c || this.busy || this.mode !== 'dark') return;
    if (c === 'cam3') { this.mode = 'pin'; this.pin = ''; audio.sfx('beep'); return; }
    this.doReset(c);
  }
  doReset(c) {
    const g = this.g, st = this.st;
    this.busy = true; this.mode = 'dark';
    audio.sfx('beep');
    g.say(`RESETTING ${CAMNAME[c]}... IT SAVED ITS LAST BURST.`, 2.5);
    for (let i = 1; i <= 3; i++) setTimeoutGame(g, 1.4 + (i - 1) * 1.0, () => { audio.sfx('trailclick'); g.viewer.show(`${c}_b${i}`, 'cut', { noSub: true }); });
    setTimeoutGame(g, 1.4 + 3 * 1.0 + 1.6, () => {
      g.viewer.blank();
      st.resets[c] = true;
      g.dread.add(0.1);
      const left = 3 - Object.keys(st.resets).length;
      if (left > 0) g.say(`${CAMNAME[c]} RESET. ${left} LEFT.`, 3, COL.G);
      else {
        g.say('ALL THREE RESET.', 2.5, COL.G);
        setTimeoutGame(g, 2.8, () => { audio.sfx('engine'); g.caption('[an engine turns over, up the drive]', 3.5); g.say('THE VAN.', 3, COL.Y); });
      }
      this.busy = false;
      g.save();
    });
  }
  pinKey(code) {
    if (/^Digit\d$|^Numpad\d$/.test(code)) this.pinDigit(code.slice(-1));
    else if (code === 'Backspace') this.pin = this.pin.slice(0, -1);
    else if (code === 'Escape') this.mode = 'dark';
  }
  pinDigit(d) {
    this.pin += d; audio.sfx('tick');
    if (this.pin.length < 4) return;
    if (this.pin === PIN) this.doReset('cam3'); else { this.g.say('WRONG PIN.', 2, COL.R); this.pin = ''; }
  }
  pinClick(x, y) {
    const W = this.g.display.w;
    for (let d = 0; d < 10; d++) { const kx = W / 2 - 100 + d * 20; if (x >= kx && x < kx + 18 && y >= 120 && y < 136) return this.pinDigit(String(d)); }
    if (y > 150) this.mode = 'dark';
  }

  // ---- exits ----
  toAct3() { const g = this.g; this.st.act = 'act3'; g.save(); this.busy = false; g.goto(new g.Scenes.Act3(g)); }
  exposureEnd() { const g = this.g; this.st.act = 'ending'; this.st.ending = 'exposure'; g.save(); g.goto(new g.Scenes.Ending(g, 'exposure')); }

  update(dt) {
    this.ctl.update(dt);
    const st = this.st;
    if (this.mode === 'thermal') {
      st.battery = Math.max(0, st.battery - 1.6 * dt);
      if (st.battery <= 0) { this.toggleThermal(); this.g.say('THE MONITOR DIED.', 2.5); audio.sfx('battery'); }
      else if (st.battery < 15 && ((this.g.time * 0.5) | 0) !== this.lastBeep) { this.lastBeep = (this.g.time * 0.5) | 0; audio.sfx('battery', { gain: 0.4 }); }
    }
    if (this.charging) {
      this.charge = Math.min(1, (this.g.time - this.chargeT0) / 3.5);
      if (this.g.time - this.chargeT0 > 6) this.release();
    }
  }

  draw(buf, t) {
    const g = this.g, ui = g.ui, W = g.display.w, H = g.display.h, st = this.st;
    if (this.mode === 'pin') {
      buf.fill(COL.k);
      ui.center('CAM 3 · ENTER PIN', 70, COL.Y);
      ui.center(this.pin.padEnd(4, '_').split('').join(' '), 94, COL.W, COL.k, 2);
      for (let d = 0; d < 10; d++) { const kx = W / 2 - 100 + d * 20; ui.frame(kx, 120, 18, 16, COL.c); ui.text(String(d), kx + 6, 124, COL.w, null); }
      ui.center('ESC: BACK', 160, COL.b);
      return;
    }
    if (this.mode === 'map') return this.drawMap(buf, t);
    g.viewer.draw(buf, t);
    if (this.mode === 'thermal') { this.ctl.drawOverlay(buf, t); ui.text('TAB: OFF', W - 52, H - 11, COL.G, COL.k); return; }
    if (g.viewer.black && !this.busy) {
      for (const [dir, e] of Object.entries(this.exitLayout())) {
        if (dir === this.sel) { ui.rect(e.x - 2, e.y - 2, e.w + 4, 11, COL.c); ui.text(e.s, e.x, e.y, COL.k, null); }
        else ui.text(e.s, e.x, e.y, COL.b, null);
      }
      if (this.camHere()) ui.center(`[E] RESET ${CAMNAME[this.camHere()]}`, H - 30, COL.C, COL.k);
    }
    // the only UI: film counter, flash charge, battery
    ui.text(`TAB BATT ${Math.round(st.battery)}%`, 3, H - 10, st.battery < 20 ? COL.R : COL.G, COL.k);
    ui.text(`EXP ${String(st.film).padStart(2, '0')}`, W / 2 - 18, H - 10, st.film <= 3 ? COL.R : COL.Y, COL.k);
    ui.text('M MAP', W - 34, H - 10, COL.b, COL.k);
    if (this.charging) {
      const w = Math.round(60 * this.charge);
      ui.frame(W / 2 - 31, H - 20, 62, 6, COL.y); ui.rect(W / 2 - 30, H - 19, w, 4, this.g.time - this.chargeT0 >= FLASH_READY ? (this.charge >= 1 ? COL.W : COL.Y) : COL.r);
    }
  }
  drawMap(buf, t) {
    const g = this.g, ui = g.ui, st = this.st;
    g.viewer.composeStill('map', buf, t, { noOsd: true, noTool: true });
    const pos = mapLayout();
    for (const n of st.visited) { const p = pos[n]; ui.text('X', p.x - 2, p.y - 3, COL.R, null); }
    const p = pos[st.node];
    ui.ellipse(p.x - 7, p.y - 7, p.x + 7, p.y + 7, COL.R, t);
    for (const [c, n] of Object.entries(CAM_NODES)) { const q = pos[n]; ui.text(st.resets[c] ? 'OK' : c.toUpperCase().replace('CAM', 'C'), q.x + 5, q.y - 10, st.resets[c] ? COL.G : COL.Y, COL.k); }
    ui.text('M: BACK', 3, g.display.h - 10, COL.w, COL.k);
  }
}
