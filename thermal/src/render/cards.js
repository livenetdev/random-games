import { glyphStrokes, ADV } from './font5x7.js';
import { RNG } from '../core/rng.js';
import { NODES } from '../data/nodes.js';

// Walt's index cards, corkboard and map, drawn in grey on a 2D canvas and then
// pushed through the same sensor degradation as every other still.
const g = (v) => { const c = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${c},${c},${c})`; };

export function handwrite(ctx, text, x, y, size, rng, ink = 0.12, weight = 0.17) {
  const s = size / 7;
  ctx.strokeStyle = g(ink);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let cx = x;
  let base = y;
  for (const ch of text) {
    const rot = rng.range(-0.08, 0.08);
    base += rng.range(-0.04, 0.04) * size;
    ctx.save();
    ctx.translate(cx, base);
    ctx.rotate(rot);
    ctx.lineWidth = size * weight * rng.range(0.85, 1.15);
    const j = () => rng.range(-0.14, 0.14) * s;
    ctx.beginPath();
    for (const [x0, y0, x1, y1] of glyphStrokes(ch)) {
      ctx.moveTo(x0 * s + j(), y0 * s + j());
      ctx.lineTo(x1 * s + j(), y1 * s + j());
    }
    ctx.stroke();
    ctx.restore();
    cx += ADV * s * rng.range(0.92, 1.08);
  }
  return cx;
}

function paperCard(ctx, W, H, rng, cx, cy, cw, ch, rot, paper = 0.725) {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.fillStyle = g(paper);
  ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
  // ruled lines + red header (red reads darker on the scanner)
  ctx.lineWidth = Math.max(1, ch * 0.006);
  ctx.strokeStyle = g(paper - 0.12);
  for (let i = 1; i < 9; i++) { const yy = -ch / 2 + ch * 0.18 + i * ch * 0.09; ctx.beginPath(); ctx.moveTo(-cw / 2, yy); ctx.lineTo(cw / 2, yy); ctx.stroke(); }
  ctx.strokeStyle = g(paper - 0.3); ctx.lineWidth = ch * 0.01;
  ctx.beginPath(); ctx.moveTo(-cw / 2, -ch / 2 + ch * 0.16); ctx.lineTo(cw / 2, -ch / 2 + ch * 0.16); ctx.stroke();
  // coffee ring / grime
  ctx.strokeStyle = g(paper - 0.08); ctx.lineWidth = ch * 0.02;
  ctx.beginPath(); ctx.arc(cw * 0.3, ch * 0.22, ch * 0.18, 0.3, 5.2); ctx.stroke();
  ctx.restore();
}

export function drawCard(def, W, H, state = {}) {
  const cv = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = cv.getContext('2d');
  const rng = new RNG(def.seed || 7);
  // desk surface
  ctx.fillStyle = g(0.08); ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 400; i++) { ctx.fillStyle = g(rng.range(0.04, 0.14)); ctx.fillRect(rng.range(0, W), rng.range(0, H), rng.range(2, 30), 2); }
  const u = W / 320; // output-pixel unit
  if (def.kind === 'board') return drawBoard(ctx, cv, W, H, rng, u);
  if (def.kind === 'map') return drawMap(ctx, cv, W, H, rng, u, state);
  const cw = 250 * u, ch = 160 * u, rot = rng.range(-0.06, 0.06);
  paperCard(ctx, W, H, rng, W / 2, H / 2 - 4 * u, cw, ch, rot);
  ctx.save();
  ctx.translate(W / 2, H / 2 - 4 * u); ctx.rotate(rot);
  const lines = def.lines || [];
  const size = 22 * u;
  lines.forEach((ln, i) => {
    let ink = 0.12;
    if (def.kind === 'faded') ink = 0.668;          // pencil gone almost to nothing
    if (def.kind === 'pin' && i === 1) ink = 0.672;  // the digits only show at one threshold
    const tw = ln.length * ADV * size / 7;
    handwrite(ctx, ln, -tw / 2, -ch / 2 + ch * 0.26 + i * size * 1.6, size, rng, ink, def.kind === 'faded' ? 0.12 : 0.17);
  });
  if (def.kind === 'faded') handwrite(ctx, '- W.', cw * 0.18, ch * 0.3, 12 * u, rng, 0.2);
  ctx.restore();
  return cv;
}

// Corkboard slot geometry, in output pixels (shared with the evidence board UI).
export const BOARD_SLOTS = [
  { slot: 'first', label: '1ST TIME', x: 16, y: 22 },
  { slot: 'fir', label: 'IN THE FIR', x: 116, y: 22 },
  { slot: 'edit', label: 'ONE IS FAKE', x: 216, y: 22 },
  { slot: 'inside', label: 'INSIDE MY HOUSE', x: 16, y: 108 },
  { slot: 'sleep', label: 'WHERE IT SLEEPS', x: 116, y: 108 },
  { slot: 'tonight', label: 'TONIGHT??', x: 216, y: 108 },
].map((s) => ({ ...s, w: 88, h: 55 }));

function drawBoard(ctx, cv, W, H, rng, u) {
  ctx.fillStyle = g(0.3); ctx.fillRect(4 * u, 4 * u, W - 8 * u, H - 8 * u);
  for (let i = 0; i < 2500; i++) { ctx.fillStyle = g(rng.range(0.24, 0.36)); ctx.fillRect(rng.range(0, W), rng.range(0, H), 2 * u, 2 * u); }
  ctx.strokeStyle = g(0.2); ctx.lineWidth = 6 * u; ctx.strokeRect(4 * u, 4 * u, W - 8 * u, H - 8 * u);
  for (const s of BOARD_SLOTS) {
    // empty photo outline + label card under it
    ctx.strokeStyle = g(0.55); ctx.lineWidth = 1.5 * u; ctx.setLineDash([3 * u, 3 * u]);
    ctx.strokeRect(s.x * u, s.y * u, s.w * u, s.h * u); ctx.setLineDash([]);
    ctx.fillStyle = g(0.74); ctx.fillRect(s.x * u, (s.y + s.h + 3) * u, s.w * u, 13 * u);
    handwrite(ctx, s.label, (s.x + 3) * u, (s.y + s.h + 6) * u, 7 * u, rng, 0.12, 0.2);
  }
  handwrite(ctx, 'WALT', 140 * u, 6 * u, 9 * u, rng, 0.16, 0.2);
  return cv;
}

// Walt's hand-drawn map of the property. The game overlays the visited nodes live.
export function mapLayout() {
  const pos = {};
  for (const [k, n] of Object.entries(NODES)) pos[k] = { x: 30 + n.x * 44, y: 24 + n.y * 30 };
  return pos;
}
function drawMap(ctx, cv, W, H, rng, u) {
  paperCard(ctx, W, H, rng, W / 2, H / 2, 304 * u, 190 * u, 0.0, 0.73);
  const pos = mapLayout();
  ctx.strokeStyle = g(0.28); ctx.lineWidth = 1.6 * u; ctx.lineCap = 'round';
  const seen = new Set();
  for (const [k, n] of Object.entries(NODES)) for (const m of Object.values(n.exits)) {
    const key = [k, m].sort().join('-'); if (seen.has(key)) continue; seen.add(key);
    const a = pos[k], b = pos[m];
    ctx.beginPath(); ctx.moveTo(a.x * u, a.y * u);
    const steps = 6;
    for (let i = 1; i <= steps; i++) { const t = i / steps; ctx.lineTo((a.x + (b.x - a.x) * t + rng.range(-1.2, 1.2)) * u, (a.y + (b.y - a.y) * t + rng.range(-1.2, 1.2)) * u); }
    ctx.stroke();
  }
  for (const [k, n] of Object.entries(NODES)) {
    const p = pos[k];
    ctx.fillStyle = g(0.2); ctx.beginPath(); ctx.arc(p.x * u, p.y * u, 2.4 * u, 0, 6.3); ctx.fill();
    const lab = n.label.replace("WALT'S ", '');
    handwrite(ctx, lab, (p.x - lab.length * 2.2) * u, (p.y + 4) * u, 5 * u, rng, 0.2, 0.22);
  }
  handwrite(ctx, 'MY 40', 10 * u, 6 * u, 8 * u, rng, 0.15, 0.2);
  return cv;
}
