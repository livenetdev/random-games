import { makeScene, makeCam, itFigure } from './common.js';
import { mesh, box, cyl, heat } from '../props/util.js';
import { desk, crt, chair, lantern } from '../props/small.js';
import { doorframe } from '../props/structures.js';
import { figure } from '../props/figure.js';

// Walt's desk inside the trailer. Card reader, CRT, index cards, corkboard.
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  const dark = variant === 'dark' || variant === 'behind';
  const room = heat(dark ? 0.2 : 0.26, { noise: 0.05, nscale: 1.2, alb: 0.5, grad: 0.02, gradBase: 1.2 });
  scene.add(mesh(box(6, 0.1, 6), room, 0, 0, 0));
  scene.add(mesh(box(6, 2.4, 0.1), room, 0, 1.2, -1.2));
  scene.add(mesh(box(0.1, 2.4, 6), room, -2.2, 1.2, 0));
  scene.add(mesh(box(0.1, 2.4, 6), room, 2.4, 1.2, 0));
  scene.add(mesh(box(6, 0.1, 6), heat(dark ? 0.22 : 0.3, { noise: 0.03, alb: 0.5 }), 0, 2.4, 0));
  // window above the desk: cold night glass
  scene.add(mesh(box(1.2, 0.8, 0.05), heat(0.03, { noise: 0.02, alb: 0.1, spec: 0.8 }), 0.9, 1.65, -1.14));
  const d = desk({ t: dark ? 0.22 : 0.27 }); d.position.set(0, 0, -0.75); scene.add(d);
  const m = crt({ on: dark ? 0 : 1, t: dark ? 0.42 : 0.55 }); m.position.set(-0.3, 0.79, -0.9); scene.add(m);
  // card reader with a hot little LED
  scene.add(mesh(box(0.14, 0.04, 0.1), heat(dark ? 0.3 : 0.45, { alb: 0.6 }), 0.32, 0.81, -0.6));
  if (!dark) scene.add(mesh(box(0.02, 0.015, 0.01), heat(1.0, { alb: 1, emit: 0.6 }), 0.36, 0.83, -0.55));
  // index cards scattered
  for (let i = 0; i < 4; i++) scene.add(mesh(box(0.13, 0.005, 0.08), heat(0.2, { alb: 0.95 }), 0.15 + i * 0.06, 0.795, -0.42 - (i % 2) * 0.05, 0, rng.range(-0.4, 0.4), 0));
  // corkboard
  scene.add(mesh(box(1.1, 0.75, 0.04), heat(dark ? 0.23 : 0.3, { noise: 0.08, nscale: 9, alb: 0.5 }), -1.2, 1.55, -1.13));
  for (let i = 0; i < 6; i++) scene.add(mesh(box(0.14, 0.1, 0.01), heat(0.24, { alb: 0.95 }), -1.6 + (i % 3) * 0.35, 1.7 - Math.floor(i / 3) * 0.3, -1.1));
  // lamp: hot bulb, cooling when the power is out
  scene.add(mesh(cyl(0.02, 0.06, 0.35, 6), heat(0.25, { alb: 0.6 }), 0.65, 0.95, -0.9));
  scene.add(mesh(cyl(0.05, 0.12, 0.14, 8), heat(dark ? 0.55 : 1.15, { glow: 0.2, alb: 1.1, emit: dark ? 0 : 0.5 }), 0.65, 1.15, -0.9));
  // fridge coils on the right wall (warm)
  scene.add(mesh(box(0.7, 1.7, 0.7), heat(0.3, { noise: 0.04, alb: 0.7, grad: -0.08, gradBase: 0.6 }), 1.9, 0.85, 0.4));
  const df = doorframe({ t: 0.24 }); df.position.set(-2.1, 0, 1.4); df.rotation.y = Math.PI / 2; scene.add(df);
  if (variant === 'live') {
    // Walt's indoor camera, high in the corner: Dana at the desk, something right behind her chair
    const ch = chair({ t: 0.26 }); ch.position.set(-0.05, 0, -0.15); ch.rotation.y = Math.PI; scene.add(ch);
    const dn = figure({ temp: 0.64, pose: 'sit', tagName: 'dana', seed: 21 }); dn.position.set(-0.05, 0.0, -0.1); dn.rotation.y = Math.PI; scene.add(dn);
    const f = itFigure(P.stage ?? 0.5, 'standSlouch'); f.position.set(-0.75, 0, 0.45); f.rotation.y = Math.PI * 0.8; scene.add(f);
  }
  if (variant === 'behind') {
    // after the jump: it is in the doorway behind the chair
    const f = itFigure(P.stage ?? 0.25, 'stand'); f.position.set(-1.6, 0, 1.4); f.rotation.y = 1.2; scene.add(f);
  }
  const camera = variant === 'live' ? makeCam([1.9, 2.25, 2.2], [-0.2, 0.9, -0.5], 62)
    : variant === 'wide' || variant === 'behind'
    ? makeCam([1.6, 1.6, 2.2], [-0.6, 1.0, -0.8], 60)
    : makeCam([0.1, 1.25, 0.55], [-0.1, 0.95, -0.9], 58);
  return { scene, camera, fog: 0.0, ambient: 0.0 };
}
