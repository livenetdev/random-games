import { makeScene, makeCam, ground, strip, treeBand, bushes, itFigure } from './common.js';
import { fir, crouchBush, stump, rock, carcass, deer } from '../props/nature.js';
import { mattress, mailbox, coatOnChair, chair } from '../props/small.js';
import { pole, wires, fence, shed, outhouse, woodpile, footbridge, gate } from '../props/structures.js';
import { mesh, box, heat, plane } from '../props/util.js';
import { pickup } from '../props/van.js';

// Generic trail location, parameterised per node of the Act II graph.
// P: { path: 'straight'|'bendL'|'bendR'|'fork'|'none', density, props: [...], it: {x, z, pose, near}, ridge, creek, open, stage }
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  const surface = P.surface || 'leaves';
  scene.add(ground(rng, { t: P.groundT ?? 0.165, noise: 0.025, undulate: P.ridge ? 1.2 : 0.35 }));
  const path = P.path || 'straight';
  const pw = P.pathW ?? 1.6, pt = surface === 'gravel' ? 0.27 : 0.235;
  const pathXs = [];
  if (path !== 'none') {
    if (path === 'straight' || path === 'fork') { scene.add(strip(rng, 0, 4, 0.5, -30, { width: pw, t: pt })); pathXs.push((z) => 0.5 * (-z / 30)); }
    if (path === 'bendL' || path === 'fork') { scene.add(strip(rng, 0, 4, -2, -9, { width: pw, t: pt })); scene.add(strip(rng, -2, -9, -14, -18, { width: pw, t: pt })); pathXs.push((z) => (z > -9 ? -2 * (-z / 9) : -2 - 12 * ((-z - 9) / 9))); }
    if (path === 'bendR') { scene.add(strip(rng, 0, 4, 2, -9, { width: pw, t: pt })); scene.add(strip(rng, 2, -9, 14, -18, { width: pw, t: pt })); pathXs.push((z) => (z > -9 ? 2 * (-z / 9) : 2 + 12 * ((-z - 9) / 9))); }
  }
  const onPath = (x, z) => pathXs.some((f) => Math.abs(x - f(z)) < (P.open ? 6 : 2.6));
  const dens = P.density ?? 1;
  if (!P.open) {
    treeBand(rng, scene, { x0: -30, x1: 30, z0: -45, z1: 2, n: Math.round(70 * dens), t: 0.26, hMin: 8, hMax: 17, avoid: onPath, kind: P.kind || 'fir' });
  } else {
    treeBand(rng, scene, { x0: -45, x1: 45, z0: -50, z1: -24, n: Math.round(60 * dens), t: 0.26, hMin: 9, hMax: 18 });
    treeBand(rng, scene, { x0: -30, x1: -12, z0: -24, z1: 2, n: 10, t: 0.26 });
    treeBand(rng, scene, { x0: 12, x1: 30, z0: -24, z1: 2, n: 10, t: 0.26 });
  }
  bushes(rng, scene, { x0: -10, x1: 10, z0: -18, z1: -2, n: Math.round(6 * dens), t: 0.22, avoid: onPath });
  if (P.creek) {
    const cr = mesh(plane(60, 3.2, 20, 2), heat(-0.03, { noise: 0.03, nscale: 3, alb: 0.9, spec: 0.8 }), 0, 0.02, P.creek, -Math.PI / 2, 0, 0.05);
    scene.add(cr);
  }
  for (const pr of P.props || []) {
    let o = null;
    switch (pr.type) {
      case 'pole': o = pole({ h: pr.h || 9 }); break;
      case 'wires': scene.add(wires(pr.a, pr.b, { sag: pr.sag ?? 0.9 })); continue;
      case 'fence': scene.add(fence(rng, pr.x0, pr.z0, pr.x1, pr.z1, { n: pr.n || 8 })); continue;
      case 'shed': o = shed(rng, { door: pr.door || 0 }); break;
      case 'outhouse': o = outhouse(rng); break;
      case 'woodpile': o = woodpile(rng); break;
      case 'bridge': o = footbridge(rng); break;
      case 'gate': o = gate(rng, { open: pr.open || 0 }); break;
      case 'mattress': o = mattress(rng, { t: pr.t ?? 0.13 }); break;
      case 'mailbox': o = mailbox(); break;
      case 'coat': o = coatOnChair(rng, { t: pr.t ?? 0.34 }); break;
      case 'chair': o = chair(); break;
      case 'crouchBush': o = crouchBush(rng, { t: pr.t ?? 0.28 }); break;
      case 'stump': o = stump(rng); break;
      case 'rock': o = rock(rng, { r: pr.r || 0.7 }); break;
      case 'carcass': o = carcass(rng, { t: pr.t ?? 0.3 }); break;
      case 'deer': o = deer(rng, { pose: pr.pose || 'alert' }); break;
      case 'fir': o = fir(rng, { h: pr.h || 10, t: pr.t ?? 0.15 }); break;
      case 'pickup': o = pickup({ engine: 0, cold: 0.04 }); break;
      case 'cam': o = mesh(box(0.18, 0.25, 0.1), heat(pr.t ?? 0.24, { alb: 0.6, spec: 0.5 }), 0, pr.y ?? 1.3, 0); o.userData.tag = 'cam'; break;
      case 'tank': o = mesh(box(1.2, 1.0, 2.4), heat(0.16, { alb: 0.7, spec: 0.4 }), 0, 0.8, 0); break;
      default: break;
    }
    if (o) { o.position.x += pr.x || 0; o.position.z += pr.z || 0; o.position.y += pr.y && pr.type !== 'cam' ? pr.y : 0; o.rotation.y = pr.ry || 0; if (pr.tag) o.userData.tag = pr.tag; scene.add(o); }
  }
  if (variant === 'it' && P.it) {
    const f = itFigure(P.stage ?? 0.4, P.it.pose || 'stand', { temp: P.it.temp });
    f.position.set(P.it.x, 0, P.it.z); f.rotation.y = P.it.ry || 0; scene.add(f);
  }
  const ch = P.camH ?? 1.6;
  const camera = makeCam([P.camX ?? 0, ch, 3], [P.lookX ?? 0, P.lookY ?? 1.2, -14], P.fov ?? 50);
  return { scene, camera, fog: P.fog ?? 0.03, ambient: 0.0, flashFall: 0.025 };
}
