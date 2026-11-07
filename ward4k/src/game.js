const { sin, cos, hypot, min, max, random } = Math;
document.body.innerHTML = '<style>body{margin:0;background:#000;font:30px serif;color:#a99;overflow:hidden}</style><canvas id=c style=position:fixed;width:100%;height:100%></canvas><p id=t style=position:fixed;inset:0;margin:0;padding-top:40vh;text-align:center;cursor:pointer>WARD NINE<br>find 3 sigils. light freezes her';
const g = c.getContext('webgl2'), R = random, k = { w: 0, s: 0, a: 0, d: 0 };
let X, Z, yaw, pit, bat, on, ex, ez, sg, got, st = 0, t0 = 0, au, o1, g1, T;
const W = (x, z) => w(x / 3 | 0, z / 3 | 0);
const ok = (x, z) => !(W(x - .3, z - .3) || W(x + .3, z - .3) || W(x - .3, z + .3) || W(x + .3, z + .3));
const end = (s, f) => { st = s; t.innerHTML = f; t.hidden = 0; document.exitPointerLock(); o1.frequency.value = 300; };

const kk = (x, y) => y < 2 ? 0 : x > 18 ? 1 : (x * x * 7 + y * y * 3 + x * y) % 17 < 8;
const w = (x, y) => x < 1 || y < 1 || x > 19 || y > 19 || !(x % 2 + y % 2) ? 1 : x % 2 * y % 2 || (x * 5 + y * 11) % 13 < 2 ? 0 : y % 2 ? kk(x - 1, y) : !kk(x, y + 1);
function gen() {
  sg = [[52.5, 10.5, 1], [16.5, 46.5, 1], [40.5, 34.5, 1]];
  X = Z = 4.5; yaw = pit = got = T = 0; bat = on = 1; ex = ez = 34.5;
}

const p = g.createProgram(), sh = (ty, s) => { const o = g.createShader(ty); g.shaderSource(o, s); g.compileShader(o); g.attachShader(p, o); };
sh(35633, '#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}'); sh(35632, '__Z__');
g.linkProgram(p); g.useProgram(p);
const U = (n, ...v) => g['uniform' + v.length + 'f'](g.getUniformLocation(p, n), ...v);
gen();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = min(.05, (now - t0) / 1e3 || 0); t0 = now;
  const vw = innerWidth / 2 | 0, vh = innerHeight / 2 | 0;
  if (c.width != vw) c.width = vw, c.height = vh, g.viewport(0, 0, vw, vh);
  const fx = sin(yaw), fz = cos(yaw), dx = X - ex, dz = Z - ez, d = hypot(dx, dz), fear = max(0, 1 - d / 10);
  T += dt;
  if (st == 1) {
    const sp = 2.5 * dt, f = k.w - k.s, s = k.d - k.a, mx = f * fx - s * fz, mz = f * fz + s * fx, ml = hypot(mx, mz) / sp;
    if (ml) { if (ok(X + mx / ml, Z)) X += mx / ml; if (ok(X, Z + mz / ml)) Z += mz / ml; }
    bat = min(1, max(0, bat + (on ? -dt / 60 : dt / 40))); if (!bat) on = 0;
    const lit = on && -(dx * fx + dz * fz) / d > .9;
    if (T > 10 && !lit) { const v = (1.4 + got * .5) * dt / d; ex += dx * v; ez += dz * v; }
    g1.gain.value = .1 + fear * .3; o1.frequency.value = 41 + fear * 30;
    if (d < .8) ex = X + fx * .7, ez = Z + fz * .7, pit = .3, end(2, 'CAUGHT');
    for (const s of sg) if (s[2] && hypot(s[0] - X, s[1] - Z) < 1.3) s[2] = 0, ++got > 2 && end(3, 'FREE');
  }
  U('P', X, 1.6, Z);
  U('G', on * min(1, bat * 5), st > 1 || fear);
  U('E', ex, ez); g.uniform3fv(g.getUniformLocation(p, 'Q'), sg.flat());
  U('R', vw, vh); U('A', yaw, pit); U('T', now / 1e3);
  g.drawArrays(4, 0, 3);
}
requestAnimationFrame(frame);

onkeydown = e => { k[e.key] = 1; if (e.key == 'f') on ^= 1; };
onkeyup = e => k[e.key] = 0;
onmousemove = e => { if (st == 1) yaw -= e.movementX / 400, pit = max(-1.3, min(1.3, pit - e.movementY / 400)); };
t.onclick = () => {
  if (!au) au = new AudioContext, o1 = au.createOscillator(), g1 = au.createGain(), o1.type = 'sawtooth', o1.connect(g1).connect(au.destination), o1.start();
  if (st > 1) gen();
  st = 1; t.hidden = 1; c.requestPointerLock();
};
