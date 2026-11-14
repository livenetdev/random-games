import { makeScene, makeCam, ground, treeBand, itFigure, dana } from './common.js';
import { figure } from '../props/figure.js';
import { van } from '../props/van.js';
import { mesh, box, heat } from '../props/util.js';

// Close-ups for subliminal inserts and the two earned jump-scares. Never a face.
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  scene.add(ground(rng, { t: 0.165, noise: 0.025 }));
  treeBand(rng, scene, { x0: -30, x1: 30, z0: -40, z1: -6, n: 50, t: 0.26 });
  const stage = P.stage ?? 0.6;
  let camera = makeCam([0, 1.6, 1.0], [0, 1.6, -5], 55);
  switch (variant) {
    case 'face': {
      const f = itFigure(stage, 'standSlouch', { lumpy: 0.07 }); f.position.set(0.05, -0.05, -0.55); scene.add(f);
      break;
    }
    case 'hand': {
      const f = itFigure(stage, 'reach'); f.position.set(0.15, 0, -0.9); scene.add(f);
      camera = makeCam([0, 1.45, 0.6], [0, 1.3, -4], 60);
      break;
    }
    case 'behind': {
      const d = dana('stand'); d.position.set(-0.35, 0, -0.4); d.rotation.y = Math.PI; scene.add(d);
      const f = itFigure(stage, 'stand'); f.position.set(0.55, 0.05, -1.6); scene.add(f);
      camera = makeCam([0.0, 1.65, 0.6], [0.2, 1.4, -4], 58);
      break;
    }
    case 'seat': {
      const v = van({ lights: 0, engine: 0.2, passengerDoor: 1 }); v.position.set(1.4, 0, -1.2); v.rotation.y = Math.PI / 2; scene.add(v);
      // heat imprint where someone sat a moment ago
      scene.add(mesh(box(0.4, 0.5, 0.05), heat(0.55, { noise: 0.08, nscale: 4 }), 1.3, 1.35, -1.75, 0, Math.PI / 2, 0));
      camera = makeCam([-0.6, 1.5, -1.2], [1.6, 1.2, -1.4], 62);
      break;
    }
    case 'door': {
      const v = van({ lights: 1, engine: 0.6, passengerDoor: 0.9 }); v.position.set(0.6, 0, -3.2); v.rotation.y = -0.1; scene.add(v);
      const f = itFigure(stage, 'doorHold'); f.position.set(-1.0, 0, -1.4); f.rotation.y = 0.15; scene.add(f);
      camera = makeCam([-0.7, 1.55, 0.6], [-0.9, 1.5, -3], 50);
      break;
    }
    case 'wake': {
      // warm ending: Dana's own view, low, the van door edge above
      const v = van({ lights: 1, engine: 0.6, passengerDoor: 0.9 }); v.position.set(1.6, 0, -1.8); v.rotation.y = -0.3; scene.add(v);
      camera = makeCam([-0.8, 0.5, 0.6], [0.2, 1.8, -3], 70);
      break;
    }
    default: break;
  }
  return { scene, camera, fog: 0.03, ambient: 0.0, fx: { blur: 1.7, sharp: 0.0, grain: 0.08, block: 0.035, bleed: 0.5, bleedTh: 0.7 } };
}
