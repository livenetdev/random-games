import {
  Mesh, Group, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, CapsuleGeometry,
  IcosahedronGeometry, PlaneGeometry,
} from 'three';
import { heat } from '../render/heatMaterial.js';

export { heat };

export function mesh(geom, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new Mesh(geom, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
}
export const box = (w, h, d, sx = 1, sy = 1, sz = 1) => new BoxGeometry(w, h, d, sx, sy, sz);
export const cyl = (rt, rb, h, seg = 8) => new CylinderGeometry(rt, rb, h, seg, 1);
export const cone = (r, h, seg = 7) => new ConeGeometry(r, h, seg, 1);
export const sphere = (r, ws = 8, hs = 6) => new SphereGeometry(r, ws, hs);
export const capsule = (r, l, cs = 3, rs = 8) => new CapsuleGeometry(r, l, cs, rs);
export const ico = (r, d = 1) => new IcosahedronGeometry(r, d);
export const plane = (w, h, sx = 1, sy = 1) => new PlaneGeometry(w, h, sx, sy);

// Displace vertices with seeded noise (keeps shared verts coherent by hashing positions).
export function jitter(geom, rng, amt = 0.1, yAmt = null) {
  const p = geom.attributes.position;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let d = seen.get(k);
    if (!d) { d = [rng.range(-amt, amt), rng.range(-(yAmt ?? amt), yAmt ?? amt), rng.range(-amt, amt)]; seen.set(k, d); }
    p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
  }
  geom.computeVertexNormals();
  return geom;
}

export function group(...children) {
  const g = new Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

export function place(obj, x = 0, y = 0, z = 0, ry = 0, s = 1) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  if (s !== 1) obj.scale.setScalar(s);
  return obj;
}

export function tag(obj, t) {
  obj.userData.tag = t;
  return obj;
}
