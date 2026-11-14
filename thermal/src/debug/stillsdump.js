// Renders every still in the manifest to PNG (used by `npm run stills`).
import { MANIFEST } from '../render/stills.js';
import { StillBank } from '../render/stills.js';
import { Compositor } from '../render/compositor.js';
import { drawOSD } from '../render/osd.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 320), H = W === 256 ? 192 : 200;
const only = q.get('ids') ? q.get('ids').split(',') : null;
const bank = new StillBank(W, H);
const comp = new Compositor(W, H);
const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const img = ctx.createImageData(W, H);
const u32 = new Uint32Array(img.data.buffer);
const stamp = (s) => (s && s.startsWith('now') ? (s.includes('+6') ? '23:09:12' : '23:03:12') : s);
window.__list = MANIFEST.filter((d) => !only || only.includes(d.id)).map((d) => d.id);
window.__render = async (id) => {
  const def = MANIFEST.find((d) => d.id === id);
  const t0 = performance.now();
  const s = bank.renderNow(def);
  comp.render(s.heat, { lut: def.lut || 'thermal', clash: def.clash, fringe: def.mode !== 'card' }, u32);
  if (def.style && def.style !== 'none') drawOSD(u32, W, H, { cam: def.cam, temp: def.temp, time: stamp(def.time), date: def.date, style: def.style, batt: 84, burst: def.burst ? `BURST ${def.burst}` : null, extra: 'LIVE', imprint: "'97 11 14" });
  ctx.putImageData(img, 0, 0);
  return { png: cv.toDataURL('image/png'), ms: Math.round(performance.now() - t0), hotspots: s.hotspots };
};
document.getElementById('log').textContent = `ready: ${window.__list.length}`;
window.__ready = true;
