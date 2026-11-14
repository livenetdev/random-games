import { makeScene, makeCam, ground, strip, treeBand } from './common.js';
import { mesh, box, sphere, heat, jitter } from '../props/util.js';

// Cold ending: the rear-view mirror. Empty road behind. One bright-white blob on the back seat.
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  scene.add(ground(rng, { t: 0.165, noise: 0.025 }));
  scene.add(strip(rng, 0, 2, 0, 160, { width: 7, t: 0.09 }));
  treeBand(rng, scene, { x0: -40, x1: -6, z0: 6, z1: 150, n: 70, t: 0.26, hMin: 10, hMax: 20 });
  treeBand(rng, scene, { x0: 6, x1: 40, z0: 6, z1: 150, n: 70, t: 0.26, hMin: 10, hMax: 20 });
  // car interior behind the driver (car faces -z; we look +z)
  const seat = heat(0.24, { noise: 0.05, nscale: 3, alb: 0.4 });
  scene.add(mesh(box(1.5, 0.5, 0.6), seat, 0, 0.5, 1.5));
  scene.add(mesh(box(1.5, 0.7, 0.2), seat, 0, 0.95, 1.85, -0.2, 0, 0));
  // roof/pillars frame the rear window
  const shell = heat(0.18, { noise: 0.03, alb: 0.4 });
  scene.add(mesh(box(1.7, 0.1, 2.4), shell, 0, 1.45, 1.0));
  scene.add(mesh(box(0.25, 0.6, 0.1), shell, -0.75, 1.2, 2.2, 0, 0, 0.2));
  scene.add(mesh(box(0.25, 0.6, 0.1), shell, 0.75, 1.2, 2.2, 0, 0, -0.2));
  scene.add(mesh(box(1.7, 0.3, 0.6), shell, 0, 0.85, 2.3));
  if (variant !== 'empty') {
    const blob = mesh(jitter(sphere(0.2, 8, 6), rng, 0.04), heat(1.05, { noise: 0.04, glow: 0.2 }), 0.35, 0.95, 1.45);
    blob.scale.set(0.9, 1.3, 0.9); blob.userData.tag = 'blob';
    scene.add(blob);
  }
  // mirror bezel occluders (black) just in front of the lens
  const k = heat(-0.05, { noise: 0 });
  const rim = heat(0.2, { noise: 0.02, alb: 0.5 });
  const Z = 0.62;
  scene.add(mesh(box(4, 1.2, 0.01), k, 0, 1.2 + 0.73, Z));
  scene.add(mesh(box(4, 1.2, 0.01), k, 0, 1.2 - 0.69, Z));
  scene.add(mesh(box(1.2, 1, 0.01), k, -0.92, 1.2, Z));
  scene.add(mesh(box(1.2, 1, 0.01), k, 0.92, 1.2, Z));
  scene.add(mesh(box(0.66, 0.02, 0.012), rim, 0, 1.2 + 0.135, Z - 0.005), mesh(box(0.66, 0.02, 0.012), rim, 0, 1.2 - 0.095, Z - 0.005));
  const camera = makeCam([0, 1.2, 0.1], [0, 1.18, 10], 52);
  return { scene, camera, fog: 0.02, ambient: 0.0, fx: { vignette: 0.6 } };
}
