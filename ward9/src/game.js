const Z = '__Z__';
const $ = id => document.getElementById(id);
const cv = $('c'), gl = cv.getContext('webgl2');
const N = 21, S = 3, M = Math;
let maze, dist, sig, ent, pl, keys = {}, st = 0, scale = .6, last = 0, fps = 16, ac, au;
const W = (x, y) => x < 0 || y < 0 || x >= N || y >= N || maze[y * N + x] > 0;
const Wp = (x, z) => W(M.floor(x / S), M.floor(z / S));

function gen() {
  maze = new Uint8Array(N * N).fill(255);
  const s = [[1, 1]]; maze[N + 1] = 0;
  while (s.length) {
    const [x, y] = s[s.length - 1];
    const d = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([a, b]) => x + a > 0 && y + b > 0 && x + a < N - 1 && y + b < N - 1 && maze[(y + b) * N + x + a]);
    if (!d.length) { s.pop(); continue; }
    const [a, b] = d[M.random() * d.length | 0];
    maze[(y + b / 2) * N + x + a / 2] = maze[(y + b) * N + x + a] = 0; s.push([x + a, y + b]);
  }
  for (let i = 0; i < 45; i++) { const x = 1 + M.random() * (N - 2) | 0, y = 1 + M.random() * (N - 2) | 0; if ((x + y) % 2) maze[y * N + x] = 0; }
  bfs(1, 1);
  const open = [];
  for (let y = 1; y < N; y += 2) for (let x = 1; x < N; x += 2) open.push([dist[y * N + x], x, y]);
  open.sort((a, b) => b[0] - a[0]);
  const at = ([, x, y]) => [(x + .5) * S, (y + .5) * S];
  const e = at(open[0]);
  ent = { x: e[0], z: e[1], a: 0, ag: 0 };
  sig = [3, 9, 17, 27].map(i => { const [x, z] = at(open[i]); return [x, 1.3, z, 1]; });
  pl = { x: 1.5 * S, z: 1.5 * S, yaw: 0, pit: 0, bat: 1, on: 1, dir: [0, 0, 1], step: 0, bob: 0, got: 0, t: 0 };
  const tx = gl.createTexture(); gl.bindTexture(3553, tx);
  gl.pixelStorei(3317, 1);
  gl.texImage2D(3553, 0, 33321, N, N, 0, 6403, 5121, maze);
  gl.texParameteri(3553, 10241, 9728); gl.texParameteri(3553, 10240, 9728);
  gl.texParameteri(3553, 10242, 33071); gl.texParameteri(3553, 10243, 33071);
}
function bfs(sx, sy) {
  dist = new Int16Array(N * N).fill(999); dist[sy * N + sx] = 0;
  const q = [[sx, sy]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      if (!W(x + a, y + b) && dist[(y + b) * N + x + a] > dist[y * N + x] + 1) { dist[(y + b) * N + x + a] = dist[y * N + x] + 1; q.push([x + a, y + b]); }
  }
}
const los = (ax, az, bx, bz) => { const d = M.hypot(bx - ax, bz - az); for (let t = 0; t < d; t += .25) if (Wp(ax + (bx - ax) * t / d, az + (bz - az) * t / d)) return 0; return 1; };

// ---------------------------------------------------------------- sound
function snd() {
  ac = new AudioContext(); const o = ac.destination, g = ac.createGain(); g.connect(o); au = { g };
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = M.random() * 2 - 1;
  au.nb = nb;
  const src = (f, q, v, type = 'bandpass') => { const s = ac.createBufferSource(), b = ac.createBiquadFilter(), k = ac.createGain(); s.buffer = nb; s.loop = 1; b.type = type; b.frequency.value = f; b.Q.value = q; k.gain.value = v; s.connect(b).connect(k).connect(g); s.start(); return [k, b]; };
  src(300, .7, .05);
  [au.wh, au.whf] = src(1400, 6, 0);
  for (const f of [41, 41.7, 61.5]) { const s = ac.createOscillator(), b = ac.createBiquadFilter(), k = ac.createGain(); s.type = 'sawtooth'; s.frequency.value = f; b.frequency.value = 160; k.gain.value = .035; s.connect(b).connect(k).connect(g); s.start(); }
}
function blip(f, dur, v, type = 'sine', f2 = f, noise) {
  if (!ac) return;
  const t = ac.currentTime, s = noise ? ac.createBufferSource() : ac.createOscillator(), k = ac.createGain(), b = ac.createBiquadFilter();
  if (noise) { s.buffer = au.nb; b.frequency.value = f; b.Q.value = 1.5; b.type = 'bandpass'; }
  else { s.type = type; s.frequency.setValueAtTime(f, t); s.frequency.exponentialRampToValueAtTime(f2, t + dur); b.frequency.value = 3000; }
  k.gain.setValueAtTime(v, t); k.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(b).connect(k).connect(au.g); s.start(t); s.stop(t + dur);
}

// ---------------------------------------------------------------- gl
function init(src) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, 35713)) throw gl.getShaderInfoLog(o); return o; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(35633, '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0,1);}'));
  gl.attachShader(p, sh(35632, src)); gl.linkProgram(p); gl.useProgram(p);
  gl.bindBuffer(34962, gl.createBuffer()); gl.bufferData(34962, new Float32Array([-1, -1, 3, -1, -1, 3]), 35044);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, 5126, 0, 0, 0);
  const u = {}; for (const k of 'RTPDAEGQMN') u[k] = gl.getUniformLocation(p, k == 'Q' ? 'Q[0]' : k);
  gen();
  const hud = $('h');
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = M.min(.05, (now - last) / 1e3 || 0); last = now;
    fps = fps * .95 + dt * 1e3 * .05;
    if (fps > 30 && scale > .3) scale *= .98; else if (fps < 18 && scale < 1) scale *= 1.01;
    const w = innerWidth * scale | 0, h = innerHeight * scale | 0;
    if (cv.width != w || cv.height != h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h);
    if (st == 1) tick(dt);
    const f = [M.cos(pl.pit) * M.sin(pl.yaw), M.sin(pl.pit), M.cos(pl.pit) * M.cos(pl.yaw)];
    for (let i = 0; i < 3; i++) pl.dir[i] += (f[i] - pl.dir[i]) * M.min(1, dt * 9);
    const dl = M.hypot(...pl.dir); const fear = M.max(0, 1 - M.hypot(ent.x - pl.x, ent.z - pl.z) / 11);
    let L = pl.on * M.min(1, pl.bat * 5);
    if (pl.bat < .2 && M.random() < .1) L *= .2;
    gl.uniform2f(u.R, w, h); gl.uniform1f(u.T, now / 1e3); gl.uniform1f(u.N, N);
    gl.uniform3f(u.P, pl.x, 1.62 + M.sin(pl.bob) * .04, pl.z);
    gl.uniform3f(u.D, pl.dir[0] / dl, pl.dir[1] / dl, pl.dir[2] / dl);
    gl.uniform2f(u.A, pl.yaw + M.sin(pl.bob * .5) * .006, pl.pit);
    gl.uniform4f(u.E, ent.x, ent.z, ent.a, ent.ag);
    gl.uniform3f(u.G, L, st == 2 ? 1 : st == 3 ? 0 : fear, st == 2 ? M.min(.85, pl.t) : 0);
    gl.uniform4fv(u.Q, sig.flat()); gl.uniform1i(u.M, 0);
    gl.drawArrays(4, 0, 3);
    if (au) { au.wh.gain.value = fear * fear * .25; au.whf.frequency.value = 900 + 900 * M.sin(now / 300); }
    hud.innerHTML = st == 1 ? `<b>${'◆'.repeat(pl.got)}${'◇'.repeat(4 - pl.got)}</b><i style="width:${pl.bat * 120}px"></i>` : '';
  }
  requestAnimationFrame(frame);
}

function tick(dt) {
  pl.t += dt;
  const run = keys.ShiftLeft || keys.ShiftRight, sp = (run ? 4.2 : 2.2) * dt;
  const fx = M.sin(pl.yaw), fz = M.cos(pl.yaw);
  let mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) mx += fx, mz += fz;
  if (keys.KeyS || keys.ArrowDown) mx -= fx, mz -= fz;
  if (keys.KeyA || keys.ArrowLeft) mx += fz, mz -= fx;
  if (keys.KeyD || keys.ArrowRight) mx -= fz, mz += fx;
  const ml = M.hypot(mx, mz);
  if (ml) {
    mx *= sp / ml; mz *= sp / ml; const r = .35;
    const ok = (x, z) => !Wp(x - r, z - r) && !Wp(x + r, z - r) && !Wp(x - r, z + r) && !Wp(x + r, z + r);
    if (ok(pl.x + mx, pl.z)) pl.x += mx;
    if (ok(pl.x, pl.z + mz)) pl.z += mz;
    pl.bob += sp * 3.3; pl.step += sp;
    if (pl.step > (run ? 1 : .75)) { pl.step = 0; blip(run ? 900 : 600, .09, run ? .5 : .3, 0, 0, 1); }
  }
  pl.bat = M.max(0, M.min(1, pl.bat + (pl.on ? -dt / 70 : dt / 45)));
  if (!pl.bat) pl.on = 0;
  // the nurse
  const dx = pl.x - ent.x, dz = pl.z - ent.z, d = M.hypot(dx, dz);
  ent.a = M.atan2(dx, dz);
  const dl = M.hypot(...pl.dir), seen = pl.on && pl.bat > .02 && d < 16 && (-dx * pl.dir[0] - dz * pl.dir[2]) / dl / d > .9 && los(pl.x, pl.z, ent.x, ent.z);
  ent.ag += ((seen ? 1 : 0) - ent.ag) * M.min(1, dt * 6);
  if (pl.t > 12 && !seen) {
    bfs(M.floor(pl.x / S), M.floor(pl.z / S));
    const cx = M.floor(ent.x / S), cz = M.floor(ent.z / S);
    let tx = pl.x, tz = pl.z, b = dist[cz * N + cx];
    if (b > 0) for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = dist[(cz + c) * N + cx + a]; if (k < b) { b = k; tx = (cx + a + .5) * S; tz = (cz + c + .5) * S; } }
    const ex = tx - ent.x, ez = tz - ent.z, el = M.hypot(ex, ez) || 1, v = (1.5 + pl.got * .45 + (d < 6 ? .6 : 0)) * dt;
    ent.x += ex / el * M.min(v, el); ent.z += ez / el * M.min(v, el);
  }
  if (seen) pl.bat -= dt / 50;
  if (d < .85) { st = 2; pl.t = 0; ent.x = pl.x + fx * .7; ent.z = pl.z + fz * .7; ent.a = M.atan2(-fx, -fz); pl.pit = .3; msg('She found you', 'click to wake'); blip(200, 1.6, 1, 'sawtooth', 50); blip(2500, 1.2, .8, 0, 0, 1); document.exitPointerLock(); }
  for (const s of sig) if (s[3] && M.hypot(s[0] - pl.x, s[2] - pl.z) < 1.3) {
    s[3] = 0; pl.got++; blip(660, 2, .3); blip(989, 2.5, .2); blip(1320, 2, .1);
    if (pl.got == 4) { st = 3; msg('The ward is quiet', 'all four sigils burned · click to return'); document.exitPointerLock(); }
  }
}
function msg(a, b) { $('t').innerHTML = `<h1>${a}</h1><p>${b}</p>`; $('t').hidden = 0; }

onkeydown = e => { keys[e.code] = 1; if (e.code == 'KeyF' && st == 1) { pl.on ^= 1; blip(3e3, .03, .4, 'square'); } };
onkeyup = e => keys[e.code] = 0;
onmousemove = e => { if (st == 1 && (document.pointerLockElement || e.buttons)) { pl.yaw -= e.movementX * .0025; pl.pit = M.max(-1.3, M.min(1.3, pl.pit - e.movementY * .0025)); } };
$('t').onclick = () => {
  if (!ac) snd();
  if (st > 1) gen();
  st = 1; $('t').hidden = 1; cv.requestPointerLock?.()?.catch?.(() => 0);
};
init(Z);
