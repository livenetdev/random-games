import { Group } from 'three';
import { mesh, box, cyl, sphere, capsule, heat, group, jitter, ico } from './util.js';

export function chair({ t = 0.2 } = {}) {
  const m = heat(t, { noise: 0.03, alb: 0.5 });
  const g = group(mesh(box(0.5, 0.06, 0.5), m, 0, 0.45, 0), mesh(box(0.5, 0.5, 0.06), m, 0, 0.72, -0.22));
  for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) g.add(mesh(box(0.04, 0.45, 0.04), m, x, 0.22, z));
  return g;
}

// Coat slung over a chair: reads exactly like a hunched sitter at low detail.
export function coatOnChair(rng, { t = 0.36 } = {}) {
  const g = chair({ t: 0.2 });
  const c = heat(t, { noise: 0.05, nscale: 3, alb: 0.4, rim: -0.1 });
  const coat = mesh(jitter(capsule(0.2, 0.35, 3, 8), rng, 0.04), c, 0, 0.8, -0.12); coat.scale.set(1.2, 1, 0.6); g.add(coat);
  const hood = mesh(jitter(sphere(0.13, 7, 5), rng, 0.02), heat(t + 0.03, { noise: 0.04, alb: 0.4, rim: -0.08 }), 0, 1.18, -0.16); hood.scale.set(1, 1.2, 1);
  g.add(hood);
  return g;
}

export function mattress(rng, { t = 0.13 } = {}) {
  const m = mesh(jitter(box(1.4, 0.22, 1.95, 3, 1, 3), rng, 0.04), heat(t, { noise: 0.06, nscale: 2, alb: 0.55 }), 0, 0.11, 0, 0, 0, 0);
  return m;
}

export function mailbox({ t = 0.18 } = {}) {
  const m = heat(t, { noise: 0.03, alb: 0.6, spec: 0.3 });
  const g = group(mesh(cyl(0.05, 0.05, 1.1, 6), heat(t - 0.01, { alb: 0.4 }), 0, 0.55, 0), mesh(box(0.25, 0.25, 0.5), m, 0, 1.2, 0));
  const top = mesh(cyl(0.125, 0.125, 0.5, 8, 1), m, 0, 1.32, 0, Math.PI / 2, 0, 0); g.add(top);
  return g;
}

// Lantern: small hot source with a handle.
export function lantern({ t = 1.1 } = {}) {
  return group(mesh(cyl(0.07, 0.08, 0.2, 8), heat(t, { glow: 0.3, alb: 1.2, emit: 0.5 }), 0, 0.1, 0));
}

export function desk({ t = 0.2 } = {}) {
  const m = heat(t, { noise: 0.04, alb: 0.5 });
  const g = group(mesh(box(1.6, 0.06, 0.75), m, 0, 0.76, 0));
  for (const x of [-0.75, 0.75]) g.add(mesh(box(0.06, 0.76, 0.7), m, x, 0.38, 0));
  return g;
}

export function crt({ t = 0.5, on = 1 } = {}) {
  const shell = heat(t, { noise: 0.04, alb: 0.5, rim: 0.05 });
  const screen = heat(0.3 + 0.35 * on, { noise: 0.05, nscale: 6, alb: 0.6, spec: 0.6, emit: 0.3 * on, glow: 0.1 });
  return group(mesh(box(0.45, 0.4, 0.42), shell, 0, 0.2, 0), mesh(box(0.36, 0.28, 0.02), screen, 0, 0.21, 0.215));
}
