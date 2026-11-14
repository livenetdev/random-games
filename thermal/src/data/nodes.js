// Act II node graph: Walt's 40 acres at night. Pure data (used by the game and by the still generator).
// dir: which arrow key takes you there. cam: a trail camera to reset here.
export const NODES = {
  steps: { label: 'TRAILER STEPS', x: 2, y: 4, surface: 'gravel', exits: { up: 'yard', left: 'shed', right: 'woodpile' },
    scene: 'forest', params: { open: true, path: 'straight', surface: 'gravel', camH: 1.9, props: [{ type: 'woodpile', x: -4, z: -6, ry: 0.3 }, { type: 'chair', x: 2.2, z: -3, ry: -0.6 }, { type: 'pole', x: 5, z: -12 }] }, it: { x: 0.6, z: -8.5, pose: 'stand' } },
  yard: { label: 'CAM 2 POLE', x: 2, y: 3, surface: 'gravel', cam: 'cam2', exits: { down: 'steps', up: 'trailhead', right: 'outhouse' },
    scene: 'forest', params: { open: true, path: 'straight', surface: 'gravel', props: [{ type: 'pole', x: 1.8, z: -3.5, h: 7 }, { type: 'cam', x: 1.8, z: -3.3, y: 1.6 }, { type: 'coat', x: -3, z: -7, ry: 0.6 }] }, it: { x: -3.9, z: -7.6, pose: 'standSlouch' } },
  shed: { label: "WALT'S SHED", x: 1, y: 4, surface: 'leaves', exits: { right: 'steps', up: 'firs', left: 'dump' },
    scene: 'forest', params: { path: 'bendL', density: 0.7, props: [{ type: 'shed', x: 3.6, z: -7, ry: -0.4, door: 0.7 }] }, it: { x: 3.1, z: -5.4, pose: 'stand', ry: -0.3 } },
  woodpile: { label: 'WOODPILE', x: 3, y: 4, surface: 'leaves', exits: { left: 'steps', up: 'fence', right: 'outhouse' },
    scene: 'forest', params: { path: 'straight', props: [{ type: 'woodpile', x: -2.6, z: -5, ry: 0.2 }, { type: 'stump', x: 1.5, z: -4 }, { type: 'crouchBush', x: 2.6, z: -9, t: 0.3 }] }, it: { x: 1.9, z: -11, pose: 'crouch' } },
  outhouse: { label: 'OUTHOUSE', x: 3, y: 5, surface: 'leaves', exits: { left: 'yard', right: 'road', down: 'woodpile' },
    scene: 'forest', params: { path: 'bendR', props: [{ type: 'outhouse', x: -3, z: -6, ry: 0.4 }] }, it: { x: -1.6, z: -5.2, pose: 'stand' } },
  trailhead: { label: 'TRAILHEAD', x: 2, y: 2, surface: 'leaves', exits: { down: 'yard', left: 'firs' },
    scene: 'forest', params: { path: 'fork', props: [{ type: 'fir', x: -2.2, z: -4, t: 0.24 }, { type: 'rock', x: 2.4, z: -6 }] }, it: { x: 0.3, z: -12, pose: 'stand' } },
  firs: { label: 'FIR STAND', x: 1, y: 3, surface: 'leaves', exits: { down: 'shed', right: 'trailhead', up: 'ridge' },
    scene: 'forest', params: { path: 'straight', density: 1.7 }, it: { x: -1.6, z: -7, pose: 'standSlouch' } },
  ridge: { label: 'RIDGE', x: 1, y: 2, surface: 'leaves', exits: { down: 'firs', right: 'meadow', up: 'powerline' },
    scene: 'forest', params: { ridge: true, path: 'bendR', density: 0.8, lookY: 1.8 }, it: { x: 2.8, z: -13, pose: 'stand' } },
  meadow: { label: 'CAM 1 MEADOW', x: 2, y: 1, surface: 'leaves', cam: 'cam1', exits: { left: 'ridge', right: 'carcass' },
    scene: 'forest', params: { open: true, path: 'none', props: [{ type: 'fir', x: -1.8, z: -3.2, h: 11, t: 0.22 }, { type: 'cam', x: -1.45, z: -2.7, y: 1.3 }, { type: 'crouchBush', x: 4.5, z: -12 }] }, it: { x: 3.6, z: -16, pose: 'stand' } },
  carcass: { label: 'DEER CARCASS', x: 3, y: 1, surface: 'leaves', exits: { left: 'meadow', up: 'creek' },
    scene: 'forest', params: { open: true, path: 'straight', props: [{ type: 'carcass', x: 0.9, z: -5, t: 0.24 }] }, it: { x: 1.2, z: -6.0, pose: 'crouch', ry: 2.6 } },
  creek: { label: 'CREEK', x: 4, y: 1, surface: 'leaves', exits: { down: 'carcass', left: 'footbridge' },
    scene: 'forest', params: { path: 'straight', creek: -8, props: [{ type: 'rock', x: 2, z: -7.5 }, { type: 'rock', x: -3, z: -9, r: 0.9 }] }, it: { x: 1.1, z: -12.5, pose: 'stand' } },
  footbridge: { label: 'FOOTBRIDGE', x: 4, y: 0, surface: 'leaves', exits: { right: 'creek', up: 'blind', left: 'powerline' },
    scene: 'forest', params: { path: 'straight', creek: -8, props: [{ type: 'bridge', x: 0, z: -8 }] }, it: { x: 0.1, z: -8.6, pose: 'stand' } },
  powerline: { label: 'POWER LINE', x: 0, y: 1, surface: 'leaves', exits: { down: 'ridge', right: 'footbridge', left: 'dump' },
    scene: 'forest', params: { open: true, path: 'straight', props: [{ type: 'pole', x: -4, z: -6 }, { type: 'pole', x: -4, z: -30 }, { type: 'wires', a: [-4.9, 8.4, -6], b: [-4.9, 8.4, -30] }, { type: 'wires', a: [-3.1, 8.4, -6], b: [-3.1, 8.4, -30] }] }, it: { x: -3.3, z: -7.4, pose: 'stand' } },
  dump: { label: 'MATTRESS DUMP', x: 0, y: 4, surface: 'leaves', exits: { right: 'shed', up: 'powerline' },
    scene: 'forest', params: { path: 'bendL', props: [{ type: 'mattress', x: 1.4, z: -5, ry: 0.4 }, { type: 'pickup', x: -4.5, z: -11, ry: 1.0 }, { type: 'tank', x: 3.4, z: -12 }] }, it: { x: 1.4, z: -5.1, pose: 'lying' } },
  fence: { label: 'FENCE LINE', x: 3, y: 3, surface: 'leaves', exits: { down: 'woodpile', up: 'gate' },
    scene: 'forest', params: { path: 'straight', props: [{ type: 'fence', x0: -1.6, z0: 1, x1: -2.2, z1: -30, n: 10 }, { type: 'fence', x0: 1.8, z0: 1, x1: 2.4, z1: -30, n: 10 }] }, it: { x: -2.8, z: -15, pose: 'stand' } },
  road: { label: 'COUNTY ROAD', x: 4, y: 5, surface: 'gravel', exits: { left: 'outhouse', up: 'gate' },
    scene: 'road', params: {}, it: { x: -1.5, z: -14, pose: 'stand' } },
  blind: { label: 'DEER BLIND', x: 5, y: 1, surface: 'leaves', exits: { left: 'footbridge', down: 'gate' },
    scene: 'forest', params: { path: 'bendL', props: [{ type: 'outhouse', x: 2.5, z: -7, y: 2.2, ry: -0.5 }, { type: 'pole', x: 1.9, z: -6.5, h: 2.3 }, { type: 'pole', x: 3.1, z: -7.5, h: 2.3 }] }, it: { x: -0.4, z: -9, pose: 'standSlouch' } },
  gate: { label: 'THE GATE', x: 4, y: 3, surface: 'gravel', exits: { down: 'fence', left: 'road', right: 'blind', up: 'drive' },
    scene: 'forest', params: { open: true, path: 'straight', surface: 'gravel', props: [{ type: 'gate', x: 0, z: -6, open: 0.15 }, { type: 'mailbox', x: 2.8, z: -5 }] }, it: { x: 0.4, z: -9, pose: 'stand' } },
  drive: { label: 'CAM 3 DRIVE', x: 5, y: 3, surface: 'gravel', cam: 'cam3', exits: { down: 'gate', up: 'van' },
    scene: 'van', variant: 'cold', params: { dist: 8.5, lights: 0, engine: 0, door: 0, camX: -1.2 }, it: { doorFig: true } },
  van: { label: 'THE VAN', x: 6, y: 3, surface: 'gravel', exits: {} },
};

export const START_NODE = 'steps';
export const CAM_NODES = { cam1: 'meadow', cam2: 'yard', cam3: 'drive' };

// BFS distance helper (used by the it-movement AI and the speedrun solver).
export function shortestPath(from, to, blocked = () => false) {
  const prev = { [from]: null };
  const q = [from];
  while (q.length) {
    const n = q.shift();
    if (n === to) break;
    for (const m of Object.values(NODES[n].exits)) {
      if (m in prev || blocked(n, m)) continue;
      prev[m] = n; q.push(m);
    }
  }
  if (!(to in prev)) return null;
  const path = [];
  for (let n = to; n; n = prev[n]) path.unshift(n);
  return path;
}
