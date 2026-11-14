import { makeScene, makeCam, ground, strip, treeBand, itFigure } from './common.js';
import { pole, wires, gasCanopy, gate } from '../props/structures.js';
import { mesh, box, heat } from '../props/util.js';
import { van } from '../props/van.js';

// County road along the property. Gas station canopy glowing far off.
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  const driving = ['ahead', 'canopy', 'back'].includes(variant);
  scene.add(ground(rng, { t: 0.165, noise: 0.025 }));
  const pool = variant === 'ahead' ? [0, 0, -9] : null;
  scene.add(strip(rng, 0, 30, 0, -160, { width: 7, t: 0.11, noise: 0.03, pool, poolAdd: 0.3, poolR: 7 }));
  scene.add(strip(rng, 0, 30, 0, -160, { width: 0.15, t: 0.16, noise: 0.02 }));
  treeBand(rng, scene, { x0: -40, x1: -6, z0: -150, z1: 20, n: 90, t: 0.26, hMin: 10, hMax: 20 });
  treeBand(rng, scene, { x0: 6, x1: 40, z0: -150, z1: 20, n: 90, t: 0.26, hMin: 10, hMax: 20 });
  let prev = null;
  for (let i = 0; i < 7; i++) {
    const z = 10 - i * 22;
    const p = pole({ h: 9 }); p.position.set(5.5, 0, z); scene.add(p);
    const top = [5.5 - 0.9, 8.55, z];
    if (prev) scene.add(wires(prev, top, { sag: 1.0, n: 8 }));
    prev = top;
  }
  const can = gasCanopy({ lights: 1 });
  if (variant === 'canopy') can.position.set(-11, 0, -14); else can.position.set(-16, 0, -95);
  scene.add(can);
  if (variant === 'back') {
    // looking back through the rear window: the gate, the van's lights far in the trees
    const g = gate(rng, { open: 1 }); g.position.set(-8, 0, -14); g.rotation.y = 1.2; scene.add(g);
    const v = van({ lights: 1, engine: 0.6 }); v.position.set(-16, 0, -28); v.rotation.y = 0.9; scene.add(v);
  }
  if (variant === 'it' && P.it) { const f = itFigure(P.stage ?? 0.5, P.it.pose || 'stand'); f.position.set(P.it.x, 0, P.it.z); scene.add(f); }
  const camera = driving ? makeCam([-0.4, 1.25, 3.2], [-0.4, 1.0, -20], 52) : makeCam([3.5, 1.6, 8], [-1, 1.4, -20], P.fov ?? 50);
  return { scene, camera, fog: 0.022, ambient: 0.0 };
}
