import { Group } from 'three';
import { mesh, capsule, sphere, box, heat, jitter } from './util.js';
import { RNG } from '../core/rng.js';

// Faceless mannequin rig. Joints are Groups; poses are joint angles (radians).
// A head is a hot oval and nothing more.
const D = Math.PI / 180;
export const POSES = {
  stand: {},
  standSlouch: { spine: 8, neck: 12, lSh: [4, 6], rSh: [4, 6], lEl: -10, rEl: -10 },
  walk: { lHip: [-22, 0], lKnee: 10, rHip: [18, 0], rKnee: 25, lSh: [20, 4], rSh: [-18, 4], lEl: -15, rEl: -20 },
  lean: { spine: -4, neck: 18, rSh: [0, 150], rEl: -10, lSh: [6, 10], lEl: -8, rootRot: 0, hipShift: 0.05 },
  doorHold: { spine: 4, neck: 16, neckZ: 8, lSh: [-10, 88], lEl: -10, lElZ: 100, rSh: [4, 8], rEl: -12 },
  sit: { lHip: [-90, 4], rHip: [-90, 4], lKnee: 85, rKnee: 85, lSh: [-48, 6], rSh: [-48, 6], lEl: -30, rEl: -30, rootY: -0.43 },
  slump: { lHip: [-88, 8], rHip: [-88, 8], lKnee: 80, rKnee: 84, spine: 18, spineZ: 8, neck: 38, neckZ: 22, lSh: [8, 10], rSh: [8, 10], lEl: -12, rEl: -8, rootY: -0.43 },
  crouch: { lHip: [-110, 8], rHip: [-110, 8], lKnee: 130, rKnee: 130, spine: 30, neck: -10, lSh: [-40, 10], rSh: [-40, 10], lEl: -60, rEl: -60, rootY: -0.42 },
  camera: { neck: 4, lSh: [-80, 18], rSh: [-80, 18], lEl: -100, rEl: -100 },
  armUp: { neck: -6, rSh: [-170, 10], rEl: -8, lSh: [4, 6], lEl: -6 },
  reach: { spine: 12, neck: 10, rSh: [-80, 6], rEl: -6, lSh: [-60, 8], lEl: -10 },
  hang: { spine: 4, neck: 40, lSh: [2, 3], rSh: [2, 3], lEl: 0, rEl: 0 },
  lying: { rootLie: true },
};

export function figure({ temp = 0.68, pose = 'stand', tagName = null, rim = -0.2, headAdd = 0.03, noise = 0.06, scale = 1, extra = {}, lumpy = 0.025, seed = 7 } = {}) {
  const jr = new RNG(seed);
  const J = (g, k = 1) => (lumpy > 0 ? jitter(g, jr, lumpy * k) : g);
  const body = heat(temp, { rim, noise, nscale: 3.1, grad: 0.03, gradBase: 1.0, alb: 0.55, ...extra });
  const head = heat(temp + headAdd, { rim: rim * 0.8, noise: noise * 0.7, nscale: 4, alb: 0.6, glow: 0.04, ...extra });
  const limb = heat(temp - 0.04, { rim, noise, nscale: 3.3, alb: 0.5, ...extra });
  const P = { ...POSES.stand, ...(POSES[pose] || {}), ...(typeof pose === 'object' ? pose : {}) };
  const a = (v) => (v || 0) * D;

  const root = new Group();
  const hips = new Group(); hips.position.set(P.hipShift || 0, 0.95 + (P.rootY || 0), 0); root.add(hips);
  hips.add(mesh(J(sphere(0.16, 8, 5)), body, 0, 0, 0));
  hips.children[0].scale.set(1.05, 0.7, 0.75);

  const spine = new Group(); spine.rotation.set(a(P.spine), 0, a(P.spineZ)); hips.add(spine);
  const torso = mesh(J(capsule(0.15, 0.32, 3, 8), 1.4), body, 0, 0.3, 0);
  torso.scale.set(1.18, 1, 0.72); spine.add(torso);
  const chest = new Group(); chest.position.y = 0.52; spine.add(chest);

  const neck = new Group(); neck.position.y = 0.05; neck.rotation.set(a(P.neck), 0, a(P.neckZ)); chest.add(neck);
  neck.add(mesh(capsule(0.05, 0.06, 2, 6), head, 0, 0.04, 0));
  const h = mesh(J(sphere(0.11, 8, 6), 0.6), head, 0, 0.2, 0.01); h.scale.set(0.95, 1.25, 1.05); neck.add(h);

  for (const side of [-1, 1]) {
    const L = side < 0;
    const sh = new Group(); sh.position.set(side * 0.21, -0.02, 0); chest.add(sh);
    const sa = L ? P.lSh : P.rSh; sh.rotation.set(a(sa?.[0]), 0, side * a(sa?.[1]));
    sh.add(mesh(capsule(0.052, 0.24, 2, 6), limb, 0, -0.15, 0));
    const el = new Group(); el.position.y = -0.3; el.rotation.set(a(L ? P.lEl : P.rEl), 0, side * a(L ? P.lElZ : P.rElZ)); sh.add(el);
    el.add(mesh(capsule(0.045, 0.22, 2, 6), limb, 0, -0.14, 0));
    el.add(mesh(sphere(0.05, 6, 4), head, 0, -0.31, 0));

    const hp = new Group(); hp.position.set(side * 0.09, -0.04, 0); hips.add(hp);
    const ha = L ? P.lHip : P.rHip; hp.rotation.set(a(ha?.[0]), 0, side * a(ha?.[1]));
    hp.add(mesh(J(capsule(0.075, 0.3, 2, 7)), body, 0, -0.22, 0));
    const kn = new Group(); kn.position.y = -0.44; kn.rotation.x = a(L ? P.lKnee : P.rKnee); hp.add(kn);
    kn.add(mesh(capsule(0.058, 0.32, 2, 6), limb, 0, -0.2, 0));
    kn.add(mesh(box(0.1, 0.07, 0.24), limb, 0, -0.44, 0.06));
  }
  if (P.rootLie) { root.rotation.z = Math.PI / 2; root.position.y = 0.12; }
  const outer = new Group();
  outer.add(root);
  if (scale !== 1) outer.scale.setScalar(scale);
  if (tagName) outer.userData.tag = tagName;
  return outer;
}
