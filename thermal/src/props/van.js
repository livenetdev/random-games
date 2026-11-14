import { Group } from 'three';
import { mesh, box, cyl, heat, group } from './util.js';

// Old Chevy cargo van. Front faces +z. Driver sits at +x (viewer's right when facing it).
// opts: lights (0..1), engine (0..1 warmth), passengerDoor (0..1 open), driverDoor (0..1), body temp offset
export function van({ lights = 1, engine = 0.6, passengerDoor = 0, driverDoor = 0, cold = 0, tagName = 'van' } = {}) {
  const e = engine;
  const g = new Group();
  const body = heat(0.3 + 0.08 * e - cold, { rim: 0.05, noise: 0.04, nscale: 0.9, grad: -0.07, gradBase: 1.2, alb: 0.75, spec: 0.25 });
  const bodyLow = heat(0.33 + 0.1 * e - cold, { rim: 0.03, noise: 0.05, nscale: 1.1, grad: -0.12, gradBase: 0.8, alb: 0.7, spec: 0.2 });
  const hood = heat(0.36 + 0.14 * e - cold, { noise: 0.05, nscale: 1.6, grad: 0.0, alb: 0.72, spec: 0.35 });
  const roof = heat(0.18 - cold * 0.5, { noise: 0.03, alb: 0.6 });
  const interior = heat(0.26 + 0.06 * e - cold, { noise: 0.05, nscale: 2.0, alb: 0.25, rim: -0.04 });
  const seat = heat(0.33 + 0.06 * e - cold, { noise: 0.04, nscale: 2.5, alb: 0.3 });
  const dash = heat(0.36 + 0.12 * e - cold, { noise: 0.04, nscale: 2.2, alb: 0.3 });
  const glassFrame = heat(0.2 - cold * 0.5, { noise: 0.02, alb: 0.5, spec: 0.5 });
  const grille = heat(0.4 + 0.2 * e - cold, { noise: 0.06, nscale: 3.0, alb: 0.5, spec: 0.3 });
  const chrome = heat(0.24 + 0.1 * e - cold, { noise: 0.03, alb: 0.95, spec: 0.9 });
  const tire = heat(0.16 + 0.08 * e, { noise: 0.03, alb: 0.12, rim: -0.03 });
  const lamp = heat(0.25 + 1.05 * lights, { noise: 0.02, glow: 0.25 * lights, alb: 1.2, spec: 1.6, emit: 0.0 });

  // cargo box (rear)
  g.add(mesh(box(2.0, 1.55, 3.3), body, 0, 1.23, -1.05));
  g.add(mesh(box(2.0, 0.4, 3.3), bodyLow, 0, 0.62, -1.05)); // skirt (overlaps, gives lower warmth)
  // cab shell: floor, roof, bulkhead
  g.add(mesh(box(2.0, 0.12, 1.2), bodyLow, 0, 0.52, 1.1));
  g.add(mesh(box(2.0, 0.1, 1.25), roof, 0, 1.97, 1.05));
  g.add(mesh(box(1.9, 1.4, 0.06), interior, 0, 1.25, 0.52));
  // pillars + windshield frame (glass itself is left out: the heat reads straight through)
  const aPillarL = mesh(box(0.09, 0.85, 0.09), glassFrame, -0.96, 1.55, 1.72, -0.42, 0, 0);
  const aPillarR = mesh(box(0.09, 0.85, 0.09), glassFrame, 0.96, 1.55, 1.72, -0.42, 0, 0);
  g.add(aPillarL, aPillarR);
  g.add(mesh(box(2.0, 0.1, 0.12), glassFrame, 0, 1.18, 1.92));
  // dash, steering, seats
  g.add(mesh(box(1.9, 0.28, 0.4), dash, 0, 1.08, 1.7));
  const wheel = mesh(cyl(0.2, 0.2, 0.05, 10), dash, 0.5, 1.3, 1.45, 1.15, 0, 0);
  g.add(wheel);
  for (const sx of [-0.5, 0.5]) {
    g.add(mesh(box(0.55, 0.15, 0.55), seat, sx, 0.95, 0.95));
    g.add(mesh(box(0.55, 0.75, 0.14), seat, sx, 1.35, 0.68, -0.12, 0, 0));
  }
  // hood + nose
  g.add(mesh(box(1.92, 0.42, 0.95), hood, 0, 1.0, 2.25, -0.08, 0, 0));
  g.add(mesh(box(1.95, 0.55, 0.3), bodyLow, 0, 0.75, 2.62));
  g.add(mesh(box(1.25, 0.34, 0.05), grille, 0, 0.88, 2.78));
  for (const sx of [-0.66, 0.66]) {
    const l = mesh(box(0.34, 0.22, 0.06), lamp, sx, 0.9, 2.79);
    l.userData.tag = sx < 0 ? 'headlightL' : 'headlightR';
    g.add(l);
  }
  g.add(mesh(box(2.1, 0.17, 0.16), chrome, 0, 0.55, 2.86));
  // mirrors
  for (const sx of [-1.15, 1.15]) g.add(mesh(box(0.12, 0.3, 0.06), chrome, sx, 1.55, 1.6));
  // wheels
  for (const sx of [-0.95, 0.95]) for (const sz of [1.95, -1.85]) g.add(mesh(cyl(0.38, 0.38, 0.26, 10), tire, sx, 0.38, sz, 0, 0, Math.PI / 2));
  // doors (cab). Hinged at front edge.
  const mkDoor = (side, open) => {
    const hinge = new Group();
    hinge.position.set(side * 1.0, 0, 1.68);
    const d = new Group();
    d.add(mesh(box(0.06, 0.85, 1.05), bodyLow, 0, 0.95, -0.52));
    d.add(mesh(box(0.06, 0.6, 0.12), glassFrame, 0, 1.68, -0.98));
    d.add(mesh(box(0.06, 0.08, 1.05), glassFrame, 0, 1.96, -0.52));
    hinge.add(d);
    hinge.rotation.y = -side * open * 1.25;
    return hinge;
  };
  g.add(mkDoor(-1, passengerDoor));
  g.add(mkDoor(1, driverDoor));
  // cab side upper walls behind doors are open window (heat passes)
  if (tagName) g.userData.tag = tagName;
  return g;
}

// Pickup truck, front +z
export function pickup({ engine = 0.2, lights = 0, cold = 0 } = {}) {
  const body = heat(0.24 + 0.1 * engine - cold, { noise: 0.04, nscale: 1, grad: -0.06, gradBase: 1, alb: 0.7, spec: 0.3 });
  const hood = heat(0.3 + 0.35 * engine - cold, { noise: 0.05, nscale: 1.5, alb: 0.7, spec: 0.3 });
  const tire = heat(0.14, { noise: 0.03, alb: 0.12 });
  const glass = heat(0.16, { alb: 0.3, spec: 0.8 });
  const lamp = heat(0.2 + 1.4 * lights, { glow: 0.3 * lights, alb: 1.1, spec: 1.5 });
  return group(
    mesh(box(1.9, 0.75, 5.2), body, 0, 0.85, 0),
    mesh(box(1.85, 0.85, 1.6), body, 0, 1.6, 0.3),
    mesh(box(1.7, 0.6, 0.05), glass, 0, 1.65, 1.12, -0.3, 0, 0),
    mesh(box(1.88, 0.25, 1.6), hood, 0, 1.3, 1.85),
    mesh(box(0.3, 0.18, 0.05), lamp, -0.65, 0.95, 2.62),
    mesh(box(0.3, 0.18, 0.05), lamp, 0.65, 0.95, 2.62),
    ...[-0.9, 0.9].flatMap((sx) => [1.7, -1.6].map((sz) => mesh(cyl(0.38, 0.38, 0.25, 10), tire, sx, 0.38, sz, 0, 0, Math.PI / 2))),
  );
}

// Dana's sedan, front +z. door: driver door (+x) open amount
export function sedan({ engine = 0.3, lights = 0, door = 0, cold = 0, interior = 0.3 } = {}) {
  const g = new Group();
  const body = heat(0.26 + 0.08 * engine - cold, { noise: 0.04, nscale: 1, grad: -0.08, gradBase: 0.8, alb: 0.75, spec: 0.35 });
  const hood = heat(0.32 + 0.4 * engine - cold, { noise: 0.05, nscale: 1.6, alb: 0.75, spec: 0.35 });
  const roof = heat(0.16 - cold * 0.5, { noise: 0.03, alb: 0.65, spec: 0.3 });
  const inner = heat(interior - cold, { noise: 0.05, nscale: 2, alb: 0.25 });
  const tire = heat(0.14 + 0.06 * engine, { noise: 0.03, alb: 0.12 });
  const lamp = heat(0.2 + 1.45 * lights, { glow: 0.35 * lights, alb: 1.1, spec: 1.5 });
  const tail = heat(0.2 + 0.9 * lights, { glow: 0.2 * lights, alb: 0.8, spec: 1.0 });
  g.add(mesh(box(1.8, 0.6, 4.7), body, 0, 0.6, 0));
  g.add(mesh(box(1.7, 0.08, 2.1), roof, 0, 1.38, -0.2));
  g.add(mesh(box(1.6, 0.5, 1.9), inner, 0, 1.05, -0.2));
  for (const sx of [-0.82, 0.82]) for (const sz of [0.75, -1.15]) g.add(mesh(box(0.08, 0.5, 0.08), roof, sx, 1.13, sz));
  g.add(mesh(box(1.78, 0.12, 1.2), hood, 0, 0.92, 1.65));
  g.add(mesh(box(0.35, 0.14, 0.05), lamp, -0.6, 0.72, 2.36), mesh(box(0.35, 0.14, 0.05), lamp, 0.6, 0.72, 2.36));
  g.add(mesh(box(0.3, 0.12, 0.05), tail, -0.65, 0.78, -2.36), mesh(box(0.3, 0.12, 0.05), tail, 0.65, 0.78, -2.36));
  for (const sx of [-0.85, 0.85]) for (const sz of [1.45, -1.4]) g.add(mesh(cyl(0.33, 0.33, 0.22, 10), tire, sx, 0.33, sz, 0, 0, Math.PI / 2));
  const hinge = new Group(); hinge.position.set(0.9, 0, 0.7);
  hinge.add(mesh(box(0.06, 0.95, 1.1), body, 0, 0.85, -0.55));
  hinge.rotation.y = door * 1.1;
  g.add(hinge);
  return g;
}
