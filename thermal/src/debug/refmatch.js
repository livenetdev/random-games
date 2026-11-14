// Renders the reference-composition still with OSD for docs/ref-match.png
import { StillRenderer } from '../render/StillRenderer.js';
import { Compositor } from '../render/compositor.js';
import { drawOSD } from '../render/osd.js';

const r = new StillRenderer({ w: 320, h: 200, ss: 4 });
const still = r.render({ id: 'ref', scene: 'van', variant: 'ref', seed: 1103, params: { corpseT: 0.7, stage: 0.1, walt: 'driver' } });
const comp = new Compositor(320, 200);
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const img = ctx.createImageData(320, 200);
const u32 = new Uint32Array(img.data.buffer);
comp.render(still.heat, { lut: 'thermal' }, u32);
drawOSD(u32, 320, 200, { cam: 'CAM 3', time: '03:14:07', date: '11/03/1997', temp: '31°F' });
ctx.putImageData(img, 0, 0);
document.getElementById('log').textContent = 'ok';
window.__done = true;
