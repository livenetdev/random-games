import { Group } from 'three';
import { makeScene, makeCam, ground, treeBand, bushes, itFigure, dana } from './common.js';
import { mesh, box, heat } from '../props/util.js';
import { coatOnChair, chair, desk, crt } from '../props/small.js';
import { raccoon } from '../props/nature.js';
import { figure } from '../props/figure.js';
import { pole } from '../props/structures.js';

// CAM 2: Walt's single-wide from the yard. Windows are real openings so heat inside reads through.
export function build(rng, variant, P = {}) {
  const scene = makeScene();
  scene.add(ground(rng, { t: 0.165, noise: 0.025 }));
  treeBand(rng, scene, { x0: -40, x1: 40, z0: -40, z1: -8, n: 60, t: 0.26, hMin: 10, hMax: 18 });
  const lit = variant === 'live' || P.lit;
  const inside = P.inside ?? (lit ? 0.4 : 0.24);
  const wall = heat(0.27, { noise: 0.04, nscale: 1, grad: -0.03, gradBase: 1.5, alb: 0.65 });
  const skirt = heat(0.22, { noise: 0.05, alb: 0.4 });
  const roof = heat(0.2, { noise: 0.03, alb: 0.5 });
  const frame = heat(0.3, { noise: 0.02, alb: 0.6 });
  const pane = heat(lit ? 0.5 : 0.2, { noise: 0.05, nscale: 3, alb: 0.15, spec: 0.7 });
  const room = heat(inside, { noise: 0.05, nscale: 1.5, alb: 0.2 });
  const T = new Group();
  // body behind the front face
  T.add(mesh(box(14, 2.4, 0.4), wall, 0, 1.9, -1.95));
  T.add(mesh(box(0.2, 2.4, 4.0), wall, -6.95, 1.9, -0.05), mesh(box(0.2, 2.4, 4.0), wall, 6.95, 1.9, -0.05));
  T.add(mesh(box(14, 0.1, 4.0), skirt, 0, 0.74, -0.05));
  T.add(mesh(box(14.1, 0.7, 4.0), skirt, 0, 0.35, -0.1));
  T.add(mesh(box(14.2, 0.18, 4.4), roof, 0, 3.15, 0));
  // hollow out a room behind the middle window + door
  T.add(mesh(box(6, 2.2, 0.1), room, -1, 1.95, -1.5));
  T.add(mesh(box(6, 0.1, 3.4), room, -1, 0.8, 0.2));
  T.add(mesh(box(6, 0.1, 3.4), room, -1, 3.0, 0.2));
  // front face pieces (z = 1.9) leaving holes for windows at x=-4.4..-3.1, -2.4..-1.1 and door x=-0.45..0.45
  const F = 1.91;
  const holes = [[-5.65, -4.35], [-2.95, -1.65], [-0.45, 0.45], [2.95, 4.25]];
  let x = -7;
  for (const [a, b] of holes) { const w = a - x; if (w > 0) T.add(mesh(box(w, 2.4, 0.08), wall, x + w / 2, 1.9, F)); x = b; }
  T.add(mesh(box(7 - x, 2.4, 0.08), wall, x + (7 - x) / 2, 1.9, F));
  for (const [a, b] of holes) {
    const cx = (a + b) / 2, w = b - a;
    const isDoor = a === -0.45;
    const top = isDoor ? 2.75 : 2.45, bot = isDoor ? 0.8 : 1.55;
    T.add(mesh(box(w, 3.1 - top, 0.08), wall, cx, (top + 3.1) / 2, F));
    if (bot > 0.7) T.add(mesh(box(w, bot - 0.7, 0.08), wall, cx, (bot + 0.7) / 2, F));
    T.add(mesh(box(w + 0.12, 0.07, 0.1), frame, cx, top, F + 0.02), mesh(box(w + 0.12, 0.07, 0.1), frame, cx, bot, F + 0.02));
    const tagName = isDoor ? 'door' : cx < -3 ? 'winL' : cx < 0 ? 'winM' : 'winR';
    if (!isDoor) {
      const glassOff = (variant === 'window' || variant === 'live' || P.openWin) && tagName === 'winM';
      if (!glassOff) { const p = mesh(box(w, top - bot, 0.03), pane, cx, (top + bot) / 2, F - 0.02); p.userData.tag = tagName; T.add(p); }
      else { const ph = new Group(); ph.position.set(cx, (top + bot) / 2, F); const m = mesh(box(w, top - bot, 0.01), heat(0, {}), 0, 0, 0); m.visible = false; ph.add(m); ph.userData.tag = tagName; T.add(ph); }
    } else {
      const open = variant === 'door' || P.door;
      const hinge = new Group(); hinge.position.set(0.45, 0, F + 0.04);
      hinge.add(mesh(box(0.9, 1.95, 0.06), frame, -0.45, 1.75, 0));
      hinge.rotation.y = open ? -0.5 : 0;
      T.add(hinge);
    }
  }
  // steps
  T.add(mesh(box(1.4, 0.2, 0.5), skirt, 0, 0.6, 2.3), mesh(box(1.4, 0.2, 0.5), skirt, 0, 0.3, 2.65));
  scene.add(T);
  // porch chair
  const chairObj = variant === 'coat' || variant === 'edit' || variant === 'raccoon' ? coatOnChair(rng, { t: 0.36 }) : chair({ t: 0.2 });
  chairObj.position.set(2.3, 0, 3.2); chairObj.rotation.y = -0.5;
  if (variant === 'edit') chairObj.visible = false;
  scene.add(chairObj);
  const p = pole({ h: 8 }); p.position.set(-9, 0, 4); scene.add(p);
  bushes(rng, scene, { x0: -12, x1: 12, z0: 2.5, z1: 5, n: 4, t: 0.22, avoid: (xx) => Math.abs(xx) < 4 });

  const stage = P.stage ?? 0.2;
  switch (variant) {
    case 'raccoon': { const r = raccoon(rng); r.position.set(0.2, 0.7, 2.3); r.rotation.y = 0.8; scene.add(r); break; }
    case 'edit': {
      // the coat is gone; something crouches where the chair was
      const f = itFigure(stage, 'crouch', { tag: 'edit', temp: 0.5 }); f.position.set(2.3, 0, 3.3); f.rotation.y = -0.4; scene.add(f);
      const c = chair({ t: 0.2 }); c.position.set(2.0, 0, 2.8); c.rotation.y = 0.9; scene.add(c);
      break;
    }
    case 'window': {
      const f = itFigure(stage, 'stand'); f.position.set(-2.3, 0.75, 1.55); scene.add(f);
      break;
    }
    case 'live': {
      // Dana at Walt's desk, back to the window. Something stands behind her.
      const d = desk({ t: 0.25 }); d.position.set(-2.4, 0.85, -0.9); scene.add(d);
      const m = crt({ on: 1 }); m.position.set(-2.4, 1.65, -1.0); m.rotation.y = 0; scene.add(m);
      const ch = chair({ t: 0.25 }); ch.position.set(-2.4, 0.85, -0.2); ch.rotation.y = Math.PI; scene.add(ch);
      const dn = figure({ temp: 0.66, pose: 'sit', tagName: 'dana', seed: 21 }); dn.position.set(-2.4, 0.85 + 0.0, -0.15); dn.rotation.y = Math.PI; scene.add(dn);
      const f = itFigure(stage, 'stand'); f.position.set(-1.7, 0.85, 0.6); f.rotation.y = Math.PI * 0.9; scene.add(f);
      break;
    }
    case 'door': break;
    case 'dana1': { const d = dana('walk'); d.position.set(-1.0, 0, 6.5); d.rotation.y = Math.PI * 0.9; scene.add(d); const f = itFigure(stage, 'stand'); f.position.set(-6.5, 0, 3.0); scene.add(f); break; }
    case 'dana2': { const d = dana('camera'); d.position.set(1.0, 0, 9.5); d.rotation.y = Math.PI * 0.95; scene.add(d); const f = itFigure(stage, 'walk'); f.position.set(-3.5, 0, 6.0); f.rotation.y = 1.2; scene.add(f); break; }
    case 'dana3': { const f = itFigure(stage, 'camera'); f.position.set(0.6, 0, 9.4); f.rotation.y = Math.PI * 0.95; scene.add(f); break; }
    default: break;
  }
  const camera = makeCam([3.6, 1.45, 10.5], [-1.0, 1.6, 0], P.fov ?? 50);
  return { scene, camera, fog: 0.025, ambient: 0.0 };
}
