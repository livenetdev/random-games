import { COL } from '../game.js';
import { settings } from '../../core/settings.js';
import { audio } from '../../audio/engine.js';

// Shared still-viewer controls: blink comparator, threshold tool, zoom, circling, hover hints.
export class StillControls {
  constructor(g, owner) { this.g = g; this.owner = owner; this.toolOn = false; this.slider = false; this.circle = null; this.zoomZ = 1; }
  get v() { return this.g.viewer; }
  key(code, rep) {
    const v = this.v, tool = v.tool;
    if (code === 'Space') { if (!rep) { this.blinkT0 = this.g.time; if (v.prev) audio.sfx('tick', { gain: 0.3 }); } this.blinkHeld = true; }
    else if (code === 'KeyT') { this.toolOn = !this.toolOn; tool.on = this.toolOn; audio.sfx('tick'); if (this.toolOn && !this.g.state.toolHint) { this.g.say('THRESHOLD: ↑/↓ OR DRAG THE BAR AT RIGHT', 4, COL.C); this.g.state.toolHint = true; } }
    else if (tool.on && (code === 'ArrowUp' || code === 'BracketRight' || code === 'KeyW')) tool.level = Math.min(1.2, tool.level + 0.01);
    else if (tool.on && (code === 'ArrowDown' || code === 'BracketLeft' || code === 'KeyS')) tool.level = Math.max(0, tool.level - 0.01);
    else if (code === 'Equal' || code === 'NumpadAdd') this.wheel(1, this.g.display.w / 2, this.g.display.h / 2);
    else if (code === 'Minus' || code === 'NumpadSubtract') this.wheel(-1, 0, 0);
  }
  keyUp(code) { if (code === 'Space') { this.blinkHeld = false; this.v.blink = false; } }
  wheel(d, x, y) {
    const v = this.v;
    if (!v.cur || v.def?.mode === 'card') return;
    const z = d > 0 ? Math.min(4, this.zoomZ * 2) : Math.max(1, this.zoomZ / 2);
    if (z === this.zoomZ) return;
    // keep the zoom centred on the same scene point when zooming further in
    let cx = x, cy = y;
    if (v.zoom && z > 1) { const r = v.zoom.rect; cx = r[0] + (x / this.g.display.w) * r[2]; cy = r[1] + (y / this.g.display.h) * r[3]; }
    this.zoomZ = z;
    audio.sfx('tick', { gain: 0.4 });
    v.setZoom(z, cx, cy);
    this.g.dread.add(0.01);
  }
  sliderRect() { const H = this.g.display.h; return { x: this.g.display.w - 10, y: 24, w: 8, h: H - 60 }; }
  pointerDown(x, y) {
    const s = this.sliderRect();
    if (this.v.tool.on && x >= s.x - 4 && y >= s.y && y <= s.y + s.h) { this.slider = true; this.setSlider(y); return true; }
    this.circle = { x0: x, y0: y, x1: x, y1: y };
    return false;
  }
  setSlider(y) { const s = this.sliderRect(); this.v.tool.level = Math.max(0, Math.min(1.2, 1.2 * (1 - (y - s.y) / s.h))); }
  pointerMove(x, y) {
    if (this.slider) { this.setSlider(y); return; }
    if (this.circle && this.g.mouse.down) { this.circle.x1 = x; this.circle.y1 = y; }
  }
  pointerUp(x, y, drag) {
    if (this.slider) { this.slider = false; this.circle = null; return true; }
    const c = this.circle; this.circle = null;
    if (drag && c && this.owner.circled) { this.owner.circled(c.x0, c.y0, c.x1, c.y1); return true; }
    return false;
  }
  update() {
    const v = this.v;
    if (this.blinkHeld && v.prev) v.blink = Math.floor((this.g.time - this.blinkT0) * 4) % 2 === 1;
    // reset zoom bookkeeping when the still changes
    if (!v.zoom) this.zoomZ = 1;
    const m = this.g.mouse;
    if (v.tool.on && m.inside) {
      const h = v.heatAt(m.x, m.y);
      this.g.readout = h == null ? null : `${Math.round(10 + h * 120)}°F`;
    } else this.g.readout = null;
  }
  // hover hints, circle being drawn, threshold slider, readout
  drawOverlay(buf, t) {
    const g = this.g, ui = g.ui, v = this.v, m = g.mouse;
    let overHot = false;
    if (m.inside && !settings.hardMode && v.cur) {
      const def = v.def;
      for (const h of v.hotspotsNow()) {
        const interesting = (def?.anomaly && h.tag === def.anomaly.tag && (def.anomaly.need !== 'threshold' || v.tool.on)) || h.tag === 'cam' || (this.owner.hotTags && this.owner.hotTags.includes(h.tag));
        if (!interesting) continue;
        if (m.x >= h.x && m.x <= h.x + h.w && m.y >= h.y && m.y <= h.y + h.h) { overHot = true; ui.ditherFrame(h.x - 1, h.y - 1, h.w + 2, h.h + 2, COL.w, t); }
      }
    }
    g.display.setCursor(overHot ? 'crosshair' : 'default');
    if (this.circle && g.mouse.dragging) ui.ellipse(this.circle.x0, this.circle.y0, this.circle.x1, this.circle.y1, COL.Y, t);
    if (v.tool.on) {
      const s = this.sliderRect();
      ui.rect(s.x, s.y, s.w, s.h, COL.k); ui.frame(s.x, s.y, s.w, s.h, COL.c);
      const ly = s.y + s.h * (1 - v.tool.level / 1.2);
      ui.rect(s.x - 3, ly - 1, s.w + 4, 3, COL.Y);
      ui.text('T', s.x + 1, s.y - 10, COL.c, COL.k);
      if (g.readout && v.def?.style !== 'handheld') ui.text(g.readout, Math.min(g.display.w - 40, m.x + 6), Math.max(2, m.y - 10), COL.Y, COL.k);
    }
    if (v.zoom) ui.text(`ZOOM ${v.zoom.z}X`, 3, g.display.h - 20, COL.c, COL.k);
  }
}
