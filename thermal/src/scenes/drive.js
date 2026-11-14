import { makeScene, makeCam, ground, strip, treeBand, bushes, itFigure, dana, itTemp } from './common.js';
import { van, sedan } from '../props/van.js';
import { figure } from '../props/figure.js';
import { mailbox } from '../props/small.js';
import { raccoon } from '../props/nature.js';
import { gate } from '../props/structures.js';

// CAM 3: the gravel drive. Walt's van to the right, the spot where Dana parks on the left.
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  const vanOn = ['two', 'tonight2', 'mirror'].includes(variant);
  const vanWarm = vanOn ? 0.7 : variant === 'sleep' ? 0.0 : 0;
  scene.add(ground(rng, { t: 0.17, noise: 0.04 }));
  scene.add(strip(rng, -2, 18, 1, -30, { width: 4, t: 0.085, pool: vanOn ? [3.2, 0, 1.8] : null, poolAdd: 0.25, poolR: 3 }));
  treeBand(rng, scene, { x0: -40, x1: 40, z0: -50, z1: -14, n: 70, t: 0.215, hMin: 10, hMax: 19 });
  treeBand(rng, scene, { x0: 9, x1: 30, z0: -14, z1: 8, n: 14, t: 0.215 });
  treeBand(rng, scene, { x0: -30, x1: -9, z0: -14, z1: 8, n: 14, t: 0.215 });
  bushes(rng, scene, { x0: -9, x1: 9, z0: -12, z1: -6, n: 4, t: 0.22, avoid: (x) => Math.abs(x) < 3 });
  const v = van({ lights: vanOn ? 1 : 0, engine: vanWarm, passengerDoor: ['sleep', 'two', 'walk3', 'mirror'].includes(variant) ? 0.85 : 0, cold: vanOn ? 0 : 0.06 });
  v.position.set(4.2, 0, -4.5); v.rotation.y = -0.55; scene.add(v);
  const mb = mailbox({ t: 0.2 }); mb.position.set(-3.8, 0, 2.5); scene.add(mb);
  const g = gate(rng, { open: 1 }); g.position.set(-1, 0, 9); scene.add(g);
  const stage = P.stage ?? 0.3;
  const car = ['arrive', 'parked', 'tonight', 'tonight2', 'reset1', 'reset2', 'reset3'].includes(variant);
  if (car) {
    const arriving = variant === 'arrive';
    const s = sedan({ engine: arriving ? 0.8 : variant === 'parked' ? 0.55 : 0.35, lights: arriving ? 1 : 0, door: variant === 'tonight' || variant === 'tonight2' ? 0.9 : 0 });
    if (arriving) { s.position.set(-1.2, 0, 1.5); s.rotation.y = Math.PI - 0.15; }
    else { s.position.set(-3.4, 0, -3.2); s.rotation.y = 0.35; }
    s.userData.tag = 'car';
    scene.add(s);
    if (variant === 'tonight' || variant === 'tonight2') {
      const f = itFigure(stage, 'doorHold'); f.position.set(-1.6, 0, -1.0); f.rotation.y = 0.5; scene.add(f);
    }
  }
  switch (variant) {
    case 'raccoon': { const r = raccoon(rng); r.position.set(2.6, 0, -1.7); r.rotation.y = 1.4; scene.add(r); break; }
    case 'walk1': { const f = itFigure(stage, 'walk'); f.position.set(-0.6, 0, -9.5); f.rotation.y = 0.9; scene.add(f); break; }
    case 'walk2': { const f = itFigure(stage, 'walk'); f.position.set(0.6, 0, -6.6); f.rotation.y = 1.1; scene.add(f); break; }
    case 'walk3': { const f = itFigure(stage, 'doorHold'); f.position.set(2.1, 0, -2.3); f.rotation.y = 0.2; scene.add(f); break; }
    case 'sleep': {
      // the van is where it sleeps: a hot shape in the driver's seat of a cold van
      const f = itFigure(stage, 'slump'); f.position.set(0.48, 0.52, 0.98); v.add(f); break;
    }
    case 'two': {
      const w = figure({ temp: 0.64, pose: 'sit', tagName: 'walt', seed: 3 }); w.position.set(0.48, 0.52, 0.98); v.add(w);
      const f = itFigure(stage, 'doorHold'); f.position.set(-1.5, 0, 2.05); f.rotation.y = 0.2; v.add(f);
      break;
    }
    case 'mirror': {
      // CAM 3 sees Dana from behind. One of the two at the van holds the same pose she does.
      const d = dana('camera'); d.position.set(1.2, 0, 1.6); d.rotation.y = Math.PI - 0.5; scene.add(d);
      const wd = P.walt === 'door';
      const w = figure({ temp: 0.6, pose: wd ? 'hang' : 'slump', tagName: 'walt', seed: 3 });
      const f = itFigure(stage, wd ? 'camera' : { lHip: [-90, 4], rHip: [-90, 4], lKnee: 85, rKnee: 85, rootY: -0.43, lSh: [-80, 18], rSh: [-80, 18], lEl: -100, rEl: -100 });
      if (wd) { w.position.set(-1.5, 0, 2.05); f.position.set(0.48, 0.52, 0.98); } else { w.position.set(0.48, 0.52, 0.98); f.position.set(-1.5, 0, 2.05); f.rotation.y = 0.2; }
      v.add(w); v.add(f);
      break;
    }
    case 'reset1': { const d = dana('walk'); d.position.set(0, 0, -1); d.rotation.y = Math.PI; scene.add(d); break; }
    case 'reset2': { const d = dana('camera'); d.position.set(-0.8, 0, 3.5); d.rotation.y = Math.PI * 0.85; scene.add(d); const f = itFigure(stage, 'walk'); f.position.set(2.6, 0, -1.2); f.rotation.y = 2.4; scene.add(f); break; }
    case 'reset3': { const f = itFigure(stage, 'camera'); f.position.set(-0.6, 0, 4.0); f.rotation.y = Math.PI * 0.85; scene.add(f); break; }
    default: break;
  }
  const camera = makeCam([-2.5, 1.5, 11], [1.2, 1.0, -3.5], P.fov ?? 50);
  return { scene, camera, fog: 0.028, ambient: 0.0, fx: { bleedTh: 0.8, bleed: 0.6 } };
}
