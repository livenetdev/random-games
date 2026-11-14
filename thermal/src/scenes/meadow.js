import { makeScene, makeCam, ground, treeBand, bushes, itFigure, dana, itTemp } from './common.js';
import { fir, deer, carcass, crouchBush, stump, rock } from '../props/nature.js';
import { figure } from '../props/figure.js';
import { lantern } from '../props/small.js';

// CAM 1: meadow below the treeline. Camera strapped to a fir at the meadow edge.
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  scene.add(ground(rng, { t: P.groundT ?? 0.165, noise: 0.025, undulate: 0.35 }));
  // treeline across the back third
  treeBand(rng, scene, { x0: -45, x1: 45, z0: -46, z1: -22, n: 90, t: 0.26, hMin: 10, hMax: 20 });
  // near firs framing left/right
  const warmFir = fir(rng.fork('wf'), { h: 11, t: variant === 'hidden' || P.warmFir ? 0.27 : 0.15 });
  warmFir.position.set(-7.5, 0, -13); scene.add(warmFir);
  const rf = fir(rng.fork('rf'), { h: 13, t: 0.14 }); rf.position.set(9, 0, -9); scene.add(rf);
  bushes(rng, scene, { x0: -14, x1: 14, z0: -20, z1: -5, n: 7, t: 0.22, avoid: (x, z) => Math.abs(x) < 2 && z > -12 });
  const st = stump(rng); st.position.set(3.2, 0, -7); scene.add(st);
  const rk = rock(rng, { r: 0.7 }); rk.position.set(-2.5, 0, -16); scene.add(rk);
  // pareidolia: a bush shaped like a crouching person, on the right third
  const cb = crouchBush(rng, { t: P.bushT ?? 0.28 }); cb.position.set(5.5, 0, -12); cb.rotation.y = -0.6; scene.add(cb);

  const stage = P.stage ?? 0.0;
  const add = (o, x, z, ry = 0) => { o.position.set(x, o.position.y, z); o.rotation.y = ry; scene.add(o); return o; };
  switch (variant) {
    case 'deer':
      add(deer(rng, { pose: 'graze' }), -1.5, -9, 0.9);
      add(deer(rng, { pose: 'graze', t: 0.57 }), 2.2, -12, -0.4);
      break;
    case 'deerClose':
      add(deer(rng, { pose: 'alert' }), 0.8, -5.5, 0.3);
      break;
    case 'bolt1':
      add(deer(rng, { pose: 'alert' }), 0.5, -8, 1.2);
      add(deer(rng, { pose: 'alert', t: 0.56 }), 3, -11, 1.0);
      break;
    case 'bolt2':
      add(deer(rng, { pose: 'alert' }), 4.5, -10, 1.5);
      // first appearance: tiny, at the treeline, half behind a trunk
      add(itFigure(stage, 'stand', { temp: itTemp(stage) - 0.08 }), -3.6, -23.5, 0);
      break;
    case 'bolt3':
      add(itFigure(stage, 'stand'), -3.1, -22, 0);
      break;
    case 'hidden':
      // inside the warm fir: 0.31 against 0.27 needles. Invisible at default banding.
      add(itFigure(stage, 'stand', { temp: 0.31, tag: 'hidden' }), -7.3, -12.4, 0.2);
      break;
    case 'figure':
      add(itFigure(stage, 'standSlouch'), 1.5, -15, -0.2);
      break;
    case 'carcass':
      add(carcass(rng, { t: 0.34 }), -0.5, -6.5, 0.5);
      break;
    case 'open':
      add(itFigure(stage, 'stand'), 0.6, -8.5, 0);
      add(carcass(rng, { t: 0.22 }), -0.5, -6.5, 0.5);
      break;
    case 'walt': {
      // Walt crossing the meadow with a lantern, the night he went to the van
      const w = add(figure({ temp: 0.64, pose: 'walk', tagName: 'walt', seed: 3 }), -1.8, -10, 1.3);
      const l = lantern(); l.position.set(-1.6, 0.62, -9.75); scene.add(l);
      add(itFigure(stage, 'walk', { temp: itTemp(stage) - 0.05 }), -6.5, -21, 1.3);
      break;
    }
    case 'dawn':
      // exposure ending: next morning, two figures side by side at the treeline
      add(itFigure(stage, 'stand'), -1.2, -19, 0);
      add(figure({ temp: 0.6, pose: 'stand', tagName: 'dana', seed: 21 }), -0.2, -19, 0);
      break;
    case 'dana1':
      add(dana('walk'), -2, -14, 0.3);
      add(itFigure(stage, 'stand', { temp: itTemp(stage) - 0.06 }), -6.4, -24, 0);
      break;
    case 'dana2':
      add(dana('walk'), -0.8, -6, 0.2);
      add(itFigure(stage, 'walk'), -4.5, -15, 0.3);
      break;
    case 'dana3':
      add(dana('camera'), 0.3, -2.2, 0.0);
      add(itFigure(stage, 'camera'), -1.6, -8, 0.2);
      break;
    default:
      break;
  }
  const camera = makeCam([0.4, 1.25, 0], [0, 0.9, -14], P.fov ?? 50);
  return { scene, camera, fog: 0.028, ambient: 0.0 };
}
