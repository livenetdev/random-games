import { van } from '../props/van.js';
import { figure } from '../props/figure.js';
import { makeScene, makeCam, ground, strip, treeBand, bushes, itTemp } from './common.js';
import { fir } from '../props/nature.js';
import { pole } from '../props/structures.js';

// The Chevy van at night, facing the camera. Reference composition.
// variants: ref (driver + door figure), empty, walt (driver only), door (door figure only),
//           dana (Dana at door, warm ending), far, mid, cold (lights off, engine cold)
// params: walt: 'driver'|'door' (which figure is the corpse), stage (it heat), itPose, dist, camX
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  const lights = P.lights ?? (variant === 'cold' || variant === 'empty' ? 0 : 1);
  const engine = P.engine ?? (variant === 'cold' || variant === 'empty' ? 0 : 0.7);
  const doorOpen = P.door ?? (variant === 'cold' || variant === 'empty' ? 0 : 0.85);
  const v = van({ lights, engine, passengerDoor: doorOpen });
  v.rotation.y = P.vanRot ?? -0.08;
  scene.add(v);

  scene.add(ground(rng, { t: 0.045, pool: lights ? [0, 0, 3.8] : null, poolAdd: 0.3 * lights, poolR: 2.6 }));
  scene.add(strip(rng, 0, -20, 0, 30, { width: 4.2, t: 0.07, pool: lights ? [0, 0, 3.8] : null, poolAdd: 0.36 * lights, poolR: 2.4 }));
  treeBand(rng, scene, { x0: -40, x1: 40, z0: -60, z1: -9, n: 70, t: 0.11, hMin: 9, hMax: 18, avoid: (x) => Math.abs(x) < 3 });
  treeBand(rng, scene, { x0: -30, x1: -5, z0: -8, z1: 10, n: 16, t: 0.12, avoid: null });
  treeBand(rng, scene, { x0: 5, x1: 30, z0: -8, z1: 10, n: 16, t: 0.12 });
  bushes(rng, scene, { x0: -9, x1: -3, z0: -2, z1: 6, n: 4, t: 0.14 });
  const p = pole({ h: 9 }); p.position.set(6, 0, -6); scene.add(p);

  const walt = P.walt || 'driver';
  const stage = P.stage ?? 0.6;
  const showDriver = ['ref', 'walt', 'mid', 'far', 'swap', 'dana', 'driver'].includes(variant) || P.driver;
  const showDoor = ['ref', 'door', 'mid', 'far', 'swap', 'dana'].includes(variant) || P.doorFig;
  const corpseT = P.corpseT ?? 0.6, itT = itTemp(stage);
  if (showDriver) {
    const isIt = walt !== 'driver';
    const pose = isIt ? (P.itPose === 'raise' ? { ...{ lHip: [-90, 4], rHip: [-90, 4], lKnee: 85, rKnee: 85, rootY: -0.43 }, rSh: [-150, 10], rEl: -10, lSh: [-48, 6], lEl: -30 } : 'sit') : 'slump';
    const f = figure({ temp: isIt ? itT : corpseT, pose, tagName: isIt ? 'it' : 'walt', rim: isIt ? -0.22 : -0.12, headAdd: isIt ? 0.08 : 0.0 });
    f.position.set(0.48, 0.52, 0.98);
    v.add(f);
    if (isIt) f.userData.noFlash = true;
  }
  if (showDoor) {
    const isIt = walt !== 'door' || variant === 'dana';
    const pose = variant === 'dana' ? 'doorHold' : isIt ? (P.itPose === 'raise' ? 'armUp' : P.itPose || 'doorHold') : 'hang';
    const f = figure({ temp: variant === 'dana' ? 0.68 : isIt ? itT : corpseT, pose, tagName: variant === 'dana' ? 'dana' : isIt ? 'it' : 'walt', rim: -0.2, headAdd: isIt ? 0.08 : 0.0 });
    f.position.set(-1.5, 0, 2.05);
    f.rotation.y = 0.2;
    if (!isIt && variant !== 'dana') {
      // Walt's body propped against the open door
      f.rotation.z = -0.12;
    }
    scene.add(f);
    if (isIt && variant !== 'dana') f.userData.noFlash = true;
  }

  const dist = P.dist ?? (variant === 'far' ? 22 : variant === 'mid' ? 11 : 2.7);
  const camX = P.camX ?? -0.35;
  const camera = makeCam([camX, 1.2, 2.8 + dist], [0.15, 1.2, 0], P.fov ?? 52);
  return { scene, camera, fog: 0.018, ambient: 0.0, fx: { bleed: 0.55, bleedTh: 0.8, bleedSigma: 1.6 } };
}
