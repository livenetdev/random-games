import { StillRenderer } from '../render/StillRenderer.js';
import { Compositor } from '../render/compositor.js';

const q = new URLSearchParams(location.search);
const def = { id: q.get('id') || 'test', scene: q.get('scene') || 'van', variant: q.get('variant') || 'ref', seed: +(q.get('seed') || 1103), mode: q.get('mode') || 'heat', params: JSON.parse(q.get('params') || '{}') };
const r = new StillRenderer({ w: 320, h: 200, ss: 4 });
const t0 = performance.now();
const still = r.render(def);
const dt = performance.now() - t0;
const comp = new Compositor(320, 200);
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const img = ctx.createImageData(320, 200);
const u32 = new Uint32Array(img.data.buffer);
comp.render(still.heat, { lut: q.get('lut') || (def.mode === 'flash' ? 'flash' : 'thermal'), gain: +(q.get('gain') || 1), offset: +(q.get('off') || 0) }, u32);
ctx.putImageData(img, 0, 0);
let mn = Infinity, mx = -Infinity; for (const v of still.heat) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
document.getElementById('log').textContent = `render ${dt.toFixed(0)}ms min ${mn.toFixed(3)} max ${mx.toFixed(3)} hotspots ${JSON.stringify(still.hotspots)}`;
window.__done = true;
