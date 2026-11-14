import { Scene, PerspectiveCamera, PlaneGeometry, Mesh } from 'three';
import { heat, mesh, plane, jitter } from '../props/util.js';
import { fir, blobTree, bush } from '../props/nature.js';

export function makeScene() {
  return new Scene();
}

export function makeCam(pos, look, fov = 46, roll = 0) {
  const c = new PerspectiveCamera(fov, 1.6, 0.1, 400);
  c.position.set(...pos);
  c.lookAt(...look);
  if (roll) c.rotateZ(roll);
  return c;
}

// Ground plane: near-cold, noisy, optionally with a warm light/heat pool.
export function ground(rng, { t = 0.17, size = 260, noise = 0.035, pool = null, poolAdd = 0.3, poolR = 4, undulate = 0.25 } = {}) {
  const g = new PlaneGeometry(size, size, 48, 48);
  g.rotateX(-Math.PI / 2);
  if (undulate) jitter(g, rng, 0.0, undulate);
  const m = heat(t, { noise, nscale: 0.8, alb: 0.35, hot: pool, hotAdd: pool ? poolAdd : 0, hotR: poolR });
  const gm = new Mesh(g, m);
  return gm;
}

// A strip (path / gravel drive) slightly above ground.
export function strip(rng, x0, z0, x1, z1, { width = 3, t = 0.2, noise = 0.04, pool = null, poolAdd = 0.3, poolR = 4 } = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const g = new PlaneGeometry(width, len, 4, 16);
  g.rotateX(-Math.PI / 2);
  jitter(g, rng, 0.15, 0.02);
  const m = heat(t, { noise, nscale: 2.2, alb: 0.45, hot: pool, hotAdd: pool ? poolAdd : 0, hotR: poolR });
  const s = new Mesh(g, m);
  s.position.set((x0 + x1) / 2, 0.03, (z0 + z1) / 2);
  s.rotation.y = Math.atan2(x1 - x0, z1 - z0);
  return s;
}

// Scatter trees in a band; returns a group-able array.
export function treeBand(rng, scene, { x0 = -40, x1 = 40, z0 = -40, z1 = -20, n = 30, t = 0.19, hMin = 7, hMax = 14, avoid = null, kind = 'fir' } = {}) {
  for (let i = 0; i < n; i++) {
    const x = rng.range(x0, x1), z = rng.range(z0, z1);
    if (avoid && avoid(x, z)) continue;
    const h = rng.range(hMin, hMax);
    const tr = (kind === 'mix' && rng.chance(0.35)) || kind === 'blob' ? blobTree(rng, { h: h * 0.7, t: t + rng.range(-0.02, 0.03) }) : fir(rng, { h, t: t + rng.range(-0.02, 0.03) });
    tr.position.set(x, 0, z);
    tr.rotation.y = rng.range(0, 6.28);
    scene.add(tr);
  }
}

export function bushes(rng, scene, { x0, x1, z0, z1, n = 8, t = 0.22, avoid = null } = {}) {
  for (let i = 0; i < n; i++) {
    const x = rng.range(x0, x1), z = rng.range(z0, z1);
    if (avoid && avoid(x, z)) continue;
    const b = bush(rng, { r: rng.range(0.4, 1.0), t: t + rng.range(-0.02, 0.03) });
    b.position.set(x, 0, z);
    scene.add(b);
  }
}

// The heat of "it" across the game: red early, drifting toward white.
export function itTemp(stage = 0) {
  return 0.7 + 0.22 * Math.min(1, Math.max(0, stage));
}

import { figure } from '../props/figure.js';
// "It": a figure that only registers as heat. Invisible to the flash pass.
export function itFigure(stage = 0.3, pose = 'stand', o = {}) {
  const f = figure({ temp: o.temp ?? itTemp(stage), pose, tagName: o.tag ?? 'it', rim: -0.22, headAdd: 0.05, seed: o.seed ?? 13, lumpy: o.lumpy ?? 0.03 });
  f.userData.noFlash = true;
  return f;
}
export function dana(pose = 'walk', o = {}) {
  return figure({ temp: o.temp ?? 0.66, pose, tagName: 'dana', rim: -0.2, headAdd: 0.04, seed: 21, lumpy: 0.02 });
}
