import { Group } from 'three';
import { mesh, cone, cyl, ico, box, sphere, heat, jitter } from './util.js';

// Conifer: trunk + noisy cone stack. t ~ cold.
export function fir(rng, { h = 9, t = 0.2, r = null } = {}) {
  const g = new Group();
  const rr = r ?? h * 0.22;
  const trunk = heat(t + 0.08, { noise: 0.04, nscale: 2, alb: 0.4, rim: -0.02, grad: -0.02, gradBase: 1 });
  const needles = heat(t, { noise: 0.06, nscale: 1.4, alb: 0.32, rim: -0.03 });
  g.add(mesh(cyl(0.12 * h / 9, 0.2 * h / 9, h * 0.45, 6), trunk, 0, h * 0.22, 0));
  const tiers = rng.int(3, 5);
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers;
    const cr = rr * (1 - f * 0.75) * rng.range(0.85, 1.1);
    const ch = h * 0.42;
    const c = jitter(cone(cr, ch, 7), rng, cr * 0.18, ch * 0.06);
    g.add(mesh(c, needles, rng.range(-0.1, 0.1), h * 0.22 + f * h * 0.62 + ch * 0.3, rng.range(-0.1, 0.1), 0, rng.range(0, 6), 0));
  }
  return g;
}

// Leafless / deciduous blob tree.
export function blobTree(rng, { h = 7, t = 0.15 } = {}) {
  const g = new Group();
  const trunk = heat(t + 0.05, { noise: 0.04, alb: 0.25 });
  const crown = heat(t, { noise: 0.07, nscale: 1.2, alb: 0.3 });
  g.add(mesh(cyl(0.12, 0.22, h * 0.6, 6), trunk, 0, h * 0.3, 0));
  const n = rng.int(2, 4);
  for (let i = 0; i < n; i++) {
    const r = h * rng.range(0.16, 0.26);
    g.add(mesh(jitter(ico(r, 1), rng, r * 0.25), crown, rng.range(-1, 1), h * rng.range(0.6, 0.85), rng.range(-1, 1)));
  }
  return g;
}

export function bush(rng, { r = 0.7, t = 0.22 } = {}) {
  const m = heat(t, { noise: 0.06, nscale: 2, alb: 0.3, rim: -0.03 });
  const g = new Group();
  const n = rng.int(2, 4);
  for (let i = 0; i < n; i++) {
    const rr = r * rng.range(0.5, 0.9);
    g.add(mesh(jitter(ico(rr, 1), rng, rr * 0.3), m, rng.range(-r, r) * 0.6, rr * 0.7, rng.range(-r, r) * 0.4));
  }
  return g;
}

// A bush deliberately shaped like a crouching person (pareidolia bait).
export function crouchBush(rng, { t = 0.3 } = {}) {
  const m = heat(t, { noise: 0.05, nscale: 2.5, alb: 0.35, rim: -0.08 });
  const g = new Group();
  g.add(mesh(jitter(ico(0.42, 1), rng, 0.08), m, 0, 0.42, 0));
  g.add(mesh(jitter(ico(0.32, 1), rng, 0.06), m, 0.05, 0.85, 0.05));
  const head = mesh(jitter(sphere(0.15, 7, 5), rng, 0.02), heat(t + 0.06, { noise: 0.04, alb: 0.35, rim: -0.06 }), 0.12, 1.12, 0.1);
  head.scale.set(0.9, 1.2, 1);
  g.add(head);
  return g;
}

export function stump(rng, { t = 0.24 } = {}) {
  return mesh(jitter(cyl(0.35, 0.45, 0.5, 7), rng, 0.05), heat(t, { noise: 0.05, alb: 0.3 }), 0, 0.25, 0);
}

export function rock(rng, { r = 0.6, t = 0.26 } = {}) {
  const m = mesh(jitter(ico(r, 0), rng, r * 0.3), heat(t, { noise: 0.04, alb: 0.45, rim: -0.02 }), 0, r * 0.4, 0);
  m.scale.y = 0.6;
  return m;
}

export function deer(rng, { t = 0.6, pose = 'graze', tagName = 'deer' } = {}) {
  const body = heat(t, { rim: -0.18, noise: 0.04, nscale: 3, alb: 0.5 });
  const head = heat(t + 0.06, { rim: -0.12, noise: 0.03, alb: 0.5 });
  const leg = heat(t - 0.1, { rim: -0.1, noise: 0.03, alb: 0.4 });
  const g = new Group();
  const torso = mesh(sphere(0.38, 9, 6), body, 0, 0.95, 0); torso.scale.set(0.75, 0.8, 1.6); g.add(torso);
  const neckDown = pose === 'graze';
  const neck = mesh(cyl(0.08, 0.13, 0.6, 6), body, 0, neckDown ? 0.75 : 1.3, neckDown ? 0.75 : 0.6, neckDown ? 2.2 : 0.45, 0, 0);
  g.add(neck);
  const hd = mesh(sphere(0.12, 7, 5), head, 0, neckDown ? 0.42 : 1.6, neckDown ? 0.95 : 0.75); hd.scale.set(0.8, 0.9, 1.6); g.add(hd);
  if (!neckDown) {
    g.add(mesh(cone(0.05, 0.16, 4), head, -0.08, 1.75, 0.68, 0, 0, 0.4));
    g.add(mesh(cone(0.05, 0.16, 4), head, 0.08, 1.75, 0.68, 0, 0, -0.4));
  }
  for (const [x, z] of [[-0.17, 0.42], [0.17, 0.42], [-0.17, -0.45], [0.17, -0.45]]) g.add(mesh(cyl(0.035, 0.05, 0.75, 5), leg, x, 0.38, z));
  if (tagName) g.userData.tag = tagName;
  return g;
}

// Cooling carcass: lying, residual heat in the core only.
export function carcass(rng, { t = 0.34 } = {}) {
  const body = heat(t, { rim: -0.14, noise: 0.06, nscale: 2.2, alb: 0.45 });
  const g = new Group();
  const torso = mesh(jitter(sphere(0.38, 9, 6), rng, 0.04), body, 0, 0.25, 0); torso.scale.set(1.6, 0.6, 0.8); g.add(torso);
  const cold = heat(t - 0.14, { noise: 0.04, alb: 0.4 });
  g.add(mesh(cyl(0.035, 0.05, 0.7, 5), cold, 0.3, 0.12, 0.35, 1.4, 0.3, 0));
  g.add(mesh(cyl(0.035, 0.05, 0.7, 5), cold, -0.3, 0.12, 0.38, 1.5, -0.2, 0));
  g.add(mesh(cyl(0.035, 0.05, 0.7, 5), cold, 0.25, 0.1, -0.35, -1.3, 0.2, 0));
  const hd = mesh(sphere(0.12, 6, 4), cold, -0.75, 0.14, 0.2); hd.scale.set(1.6, 0.8, 0.8); g.add(hd);
  g.userData.tag = 'carcass';
  return g;
}

export function raccoon(rng, { t = 0.62 } = {}) {
  const m = heat(t, { rim: -0.15, noise: 0.04, alb: 0.4 });
  const g = new Group();
  const b = mesh(sphere(0.18, 7, 5), m, 0, 0.2, 0); b.scale.set(1, 0.85, 1.4); g.add(b);
  g.add(mesh(sphere(0.1, 6, 4), heat(t + 0.06, { rim: -0.1, alb: 0.4 }), 0, 0.26, 0.28));
  g.add(mesh(cyl(0.04, 0.06, 0.35, 5), heat(t - 0.1, { alb: 0.4 }), 0, 0.2, -0.36, -1.1, 0, 0));
  g.userData.tag = 'raccoon';
  return g;
}
