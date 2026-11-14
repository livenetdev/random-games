import { Group } from 'three';
import { mesh, box, cyl, cone, plane, heat, group, jitter } from './util.js';

// Single-wide trailer home, long axis along x. Front (door side) faces +z.
// opts: window (0..1 interior warmth through the window), door (0..1 open), lit
export function trailer({ windowHeat = 0.3, door = 0, cold = 0 } = {}) {
  const g = new Group();
  const wall = heat(0.2 - cold, { noise: 0.04, nscale: 1, grad: -0.03, gradBase: 1.5, alb: 0.65, spec: 0.1 });
  const skirt = heat(0.17 - cold, { noise: 0.05, alb: 0.4 });
  const roof = heat(0.12 - cold, { noise: 0.03, alb: 0.5 });
  const win = heat(windowHeat, { noise: 0.05, nscale: 3, alb: 0.15, spec: 0.7 });
  const frame = heat(0.24 - cold, { noise: 0.02, alb: 0.6 });
  g.add(mesh(box(14, 2.4, 4.2), wall, 0, 1.9, 0));
  g.add(mesh(box(14.1, 0.7, 4.0), skirt, 0, 0.35, 0));
  g.add(mesh(box(14.2, 0.18, 4.4), roof, 0, 3.15, 0));
  const wins = [[-5, 'winL'], [-2.4, 'winM'], [3.6, 'winR']];
  for (const [x, t] of wins) {
    const w = mesh(box(1.3, 0.9, 0.05), win, x, 2.0, 2.11);
    w.userData.tag = t;
    g.add(w, mesh(box(1.45, 0.08, 0.06), frame, x, 2.48, 2.12), mesh(box(1.45, 0.08, 0.06), frame, x, 1.52, 2.12));
  }
  // door + steps
  const hinge = new Group(); hinge.position.set(0.45, 0, 2.12);
  hinge.add(mesh(box(0.9, 1.95, 0.06), frame, -0.45, 1.75, 0));
  hinge.rotation.y = -door * 1.2;
  g.add(hinge);
  if (door > 0) g.add(mesh(box(0.85, 1.9, 0.05), heat(windowHeat * 0.9 + 0.05, { noise: 0.06, alb: 0.1 }), 0, 1.75, 2.06));
  g.add(mesh(box(1.4, 0.2, 0.5), skirt, 0, 0.6, 2.45), mesh(box(1.4, 0.2, 0.5), skirt, 0, 0.3, 2.8));
  return g;
}

export function shed(rng, { door = 0, t = 0.16 } = {}) {
  const g = new Group();
  const w = heat(t, { noise: 0.05, nscale: 1.5, alb: 0.5 });
  const r = heat(t - 0.05, { noise: 0.03, alb: 0.5 });
  g.add(mesh(box(3, 2.2, 2.5), w, 0, 1.1, 0));
  const roof = mesh(box(3.3, 0.12, 1.6), r, 0, 2.55, 0.62, 0.45, 0, 0);
  const roof2 = mesh(box(3.3, 0.12, 1.6), r, 0, 2.55, -0.62, -0.45, 0, 0);
  g.add(roof, roof2);
  g.add(mesh(box(1.0, 1.9, 0.05), heat(door > 0 ? 0.08 : t + 0.02, { noise: 0.04, alb: 0.3 }), 0, 0.95, 1.27));
  if (door > 0) {
    const h = new Group(); h.position.set(0.5, 0, 1.28);
    h.add(mesh(box(1.0, 1.9, 0.05), w, -0.5, 0.95, 0)); h.rotation.y = -door * 1.3; g.add(h);
  }
  return g;
}

export function outhouse(rng, { t = 0.15 } = {}) {
  const w = heat(t, { noise: 0.05, alb: 0.5 });
  return group(mesh(box(1.2, 2.2, 1.2), w, 0, 1.1, 0), mesh(box(1.4, 0.1, 1.5), w, 0, 2.3, 0, 0.15, 0, 0));
}

export function pole({ h = 9, t = 0.17, cross = true } = {}) {
  const m = heat(t, { noise: 0.03, nscale: 2, alb: 0.4 });
  const g = group(mesh(cyl(0.12, 0.16, h, 6), m, 0, h / 2, 0));
  if (cross) g.add(mesh(box(2.2, 0.12, 0.12), m, 0, h - 0.6, 0), mesh(box(0.1, 0.15, 0.1), heat(t + 0.1, { alb: 0.8 }), -0.9, h - 0.45, 0), mesh(box(0.1, 0.15, 0.1), heat(t + 0.1, { alb: 0.8 }), 0.9, h - 0.45, 0));
  return g;
}

export function wires(from, to, { t = 0.16, sag = 0.8, n = 10 } = {}) {
  const m = heat(t, { noise: 0.0, alb: 0.6 });
  const g = new Group();
  for (let i = 0; i < n; i++) {
    const a = i / n, b = (i + 1) / n;
    const p = (s) => [from[0] + (to[0] - from[0]) * s, from[1] + (to[1] - from[1]) * s - sag * 4 * s * (1 - s), from[2] + (to[2] - from[2]) * s];
    const pa = p(a), pb = p(b);
    const dx = pb[0] - pa[0], dy = pb[1] - pa[1], dz = pb[2] - pa[2];
    const len = Math.hypot(dx, dy, dz);
    const seg = mesh(box(0.025, 0.025, len), m, (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2);
    seg.lookAt(pb[0], pb[1], pb[2]);
    g.add(seg);
  }
  return g;
}

export function fencePost(rng, { t = 0.17, h = 1.2 } = {}) {
  return mesh(jitter(box(0.12, h, 0.12), rng, 0.02), heat(t, { noise: 0.04, alb: 0.4 }), 0, h / 2, 0, rng.range(-0.08, 0.08), 0, rng.range(-0.08, 0.08));
}

// A run of fence posts with sagging wire.
export function fence(rng, x0, z0, x1, z1, { n = 8, t = 0.17 } = {}) {
  const g = new Group();
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = x0 + (x1 - x0) * s, z = z0 + (z1 - z0) * s;
    const p = fencePost(rng, { t }); p.position.x = x; p.position.z = z; g.add(p);
    pts.push([x, 1.0, z]);
  }
  for (let i = 0; i < n; i++) g.add(wires(pts[i], pts[i + 1], { sag: 0.06, n: 2, t: t - 0.01 }));
  return g;
}

export function gasCanopy({ t = 0.2, lights = 1 } = {}) {
  const m = heat(t, { noise: 0.03, alb: 0.6 });
  const lit = heat(0.3 + 0.9 * lights, { glow: 0.2, alb: 1, emit: 0.4 * lights });
  const g = group(mesh(box(12, 0.8, 7), m, 0, 5, 0));
  for (const x of [-4, 0, 4]) g.add(mesh(box(1.2, 0.08, 0.6), lit, x, 4.58, 0));
  for (const x of [-4.5, 4.5]) g.add(mesh(box(0.5, 4.6, 0.5), m, x, 2.3, 0));
  for (const x of [-2, 2]) g.add(mesh(box(0.8, 1.6, 0.5), heat(t + 0.08, { alb: 0.6 }), x, 0.8, 0));
  return g;
}

export function doorframe({ t = 0.22, w = 1.0, h = 2.1 } = {}) {
  const m = heat(t, { noise: 0.03, alb: 0.5 });
  return group(mesh(box(0.1, h, 0.15), m, -w / 2, h / 2, 0), mesh(box(0.1, h, 0.15), m, w / 2, h / 2, 0), mesh(box(w + 0.2, 0.12, 0.15), m, 0, h, 0));
}

export function footbridge(rng, { t = 0.14 } = {}) {
  const m = heat(t, { noise: 0.05, nscale: 2, alb: 0.5 });
  const g = group(mesh(box(1.4, 0.12, 6), m, 0, 0.6, 0));
  for (const x of [-0.7, 0.7]) {
    g.add(mesh(box(0.08, 0.08, 6), m, x, 1.5, 0));
    for (const z of [-2.8, 0, 2.8]) g.add(mesh(box(0.1, 1.0, 0.1), m, x, 1.05, z));
  }
  return g;
}

export function gate(rng, { t = 0.18, open = 0 } = {}) {
  const m = heat(t, { noise: 0.03, alb: 0.7, spec: 0.4 });
  const g = group(mesh(cyl(0.1, 0.1, 1.6, 6), m, -2.2, 0.8, 0), mesh(cyl(0.1, 0.1, 1.6, 6), m, 2.2, 0.8, 0));
  const h = new Group(); h.position.set(-2.2, 0, 0);
  for (const y of [0.4, 0.8, 1.2]) h.add(mesh(box(4.3, 0.06, 0.06), m, 2.15, y, 0));
  h.add(mesh(box(0.06, 1.0, 0.06), m, 2.1, 0.8, 0), mesh(box(4.3, 0.05, 0.05), m, 2.15, 0.8, 0, 0, 0.25));
  h.rotation.y = -open * 1.4;
  g.add(h);
  return g;
}

export function woodpile(rng, { t = 0.16 } = {}) {
  const g = new Group();
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9 - r; i++) {
    g.add(mesh(cyl(0.15, 0.15, 0.6, 6), heat(t + rng.range(-0.02, 0.02), { noise: 0.04, alb: 0.5 }), -1.2 + i * 0.3 + r * 0.15, 0.15 + r * 0.27, 0, Math.PI / 2, 0, 0));
  }
  return g;
}
