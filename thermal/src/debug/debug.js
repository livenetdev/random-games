import { MANIFEST, BY_ID } from '../render/stills.js';
import { LUTS } from '../render/lut.js';
import { U32, C } from '../render/palette.js';
import { NODES } from '../data/nodes.js';

// ?debug=1 : still/scene selector, seed override, LUT + threshold sliders,
// heat-buffer view, hotspot overlay, dread meter, skip-to-act.
export function installDebug(g) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:4px;right:4px;width:250px;max-height:96vh;overflow:auto;background:rgba(0,0,0,.85);color:#0ff;font:11px monospace;padding:6px;z-index:9;border:1px solid #0dd';
  el.innerHTML = `
  <b>THERMAL DEBUG</b><br>
  still <select id="dbStill" style="width:170px">${MANIFEST.map((s) => `<option>${s.id}</option>`).join('')}</select><br>
  seed <input id="dbSeed" style="width:80px" placeholder="manifest"> <button id="dbReseed">re-render</button><br>
  lut <select id="dbLut"><option value="">(still)</option>${Object.keys(LUTS).map((k) => `<option>${k}</option>`).join('')}</select>
  gain <input id="dbGain" type="range" min="0.3" max="3" step="0.05" value="1" style="width:80px"><br>
  <label><input type="checkbox" id="dbTool"> threshold</label> lvl <input id="dbLvl" type="range" min="0" max="1.2" step="0.005" value="0.45" style="width:70px">
  w <input id="dbW" type="range" min="0.02" max="0.6" step="0.01" value="0.16" style="width:50px"><br>
  <label><input type="checkbox" id="dbHeat"> heat buffer</label> <label><input type="checkbox" id="dbHot"> hotspots</label><br>
  dread <input id="dbDread" type="range" min="0" max="1" step="0.01" value="0" style="width:120px"> <span id="dbDv"></span><br>
  <canvas id="dbMeter" width="236" height="24" style="background:#000"></canvas><br>
  skip: <button data-act="act1">I</button><button data-act="act2">II</button><button data-act="act3">III</button>
  <button data-end="cold">cold</button><button data-end="warm">warm</button><button data-end="exposure">exp</button><br>
  node <select id="dbNode">${Object.keys(NODES).map((k) => `<option>${k}</option>`).join('')}</select> <button id="dbGoNode">go</button><br>
  timescale <input id="dbTs" style="width:40px" value="${g.timescale}"><br>
  <div id="dbInfo" style="color:#ff0;white-space:pre-wrap"></div>`;
  document.body.appendChild(el);
  const $ = (id) => el.querySelector('#' + id);
  const opts = { heat: false, hot: false };
  $('dbStill').onchange = (e) => { const id = e.target.value; if (g.bank.has(id)) g.viewer.show(id, 'cut', { noSub: true }); else g.bank.load(BY_ID[id]).then(() => g.viewer.show(id, 'cut', { noSub: true })); };
  $('dbReseed').onclick = () => {
    const id = g.viewer.cur; if (!id) return;
    const v = $('dbSeed').value; g.bank.seedOverride = v === '' ? null : +v;
    g.bank.mem.delete(id); g.bank.load(BY_ID[id], false).then(() => { g.viewer.show(id, 'cut', { noSub: true }); g.bank.seedOverride = null; });
  };
  $('dbLut').onchange = (e) => { g.viewer.lutOverride = e.target.value || null; };
  $('dbGain').oninput = (e) => { g.viewer.gain = +e.target.value; };
  $('dbTool').onchange = (e) => { g.viewer.tool.on = e.target.checked; };
  $('dbLvl').oninput = (e) => { g.viewer.tool.level = +e.target.value; };
  $('dbW').oninput = (e) => { g.viewer.tool.width = +e.target.value; };
  $('dbHeat').onchange = (e) => { opts.heat = e.target.checked; };
  $('dbHot').onchange = (e) => { opts.hot = e.target.checked; };
  $('dbDread').oninput = (e) => g.dread.set(+e.target.value);
  $('dbTs').onchange = (e) => { g.timescale = +e.target.value || 1; };
  el.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => {
    if (!g.state) g.newGame();
    g.overlay = null;
    g.state.act = b.dataset.act;
    if (b.dataset.act === 'act2') g.state.act1Done = true;
    g.resume();
  }));
  el.querySelectorAll('[data-end]').forEach((b) => (b.onclick = () => { if (!g.state) g.newGame(); g.overlay = null; g.goto(new g.Scenes.Ending(g, b.dataset.end)); }));
  $('dbGoNode').onclick = () => { if (g.state) { g.state.node = $('dbNode').value; g.state.resets = { cam1: true, cam2: true }; } };
  const meter = $('dbMeter').getContext('2d');
  g.debugHook = (buf, t) => {
    const s = g.viewer.still;
    const W = g.display.w, H = g.display.h;
    if (opts.heat && s) {
      const heat = g.viewer.zoom ? g.viewer.zoom.heat : s.heat;
      for (let i = 0; i < buf.length; i++) { const v = Math.max(0, Math.min(255, (heat[i] / 1.2) * 255)) | 0; buf[i] = (0xff000000 | (v << 16) | (v << 8) | v) >>> 0; }
    }
    if (opts.hot) for (const h of g.viewer.hotspotsNow()) g.ui.frame(h.x, h.y, h.w, h.h, U32[C.magenta]), g.ui.text(h.tag, h.x, Math.max(0, h.y - 8), U32[C.byellow], U32[C.black]);
    meter.fillStyle = '#000'; meter.fillRect(0, 0, 236, 24); meter.fillStyle = g.dread.v > 0.7 ? '#f00' : '#0d0'; meter.fillRect(0, 4, 236 * g.dread.v, 16);
    $('dbDv').textContent = g.dread.v.toFixed(2);
    if (((t * 4) | 0) !== opts.tick) {
      opts.tick = (t * 4) | 0;
      const st = g.state;
      $('dbInfo').textContent = `scene ${g.scene?.name}\nstill ${g.viewer.cur}\nloaded ${g.bank.mem.size}/${MANIFEST.length}\n` + (st ? `act ${st.act} film ${st.film} batt ${Math.round(st.battery)}\nnode ${st.node} it@${st.itNode}\nwalt ${st.walt} ev ${Object.keys(st.evidence).length}\nelapsed ${st.elapsed.toFixed(0)}s` : '');
    }
  };
}
